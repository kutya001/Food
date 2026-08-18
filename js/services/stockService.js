/**
 * STOCK-SERVICE.JS — Сервис сквозного списания сырья со склада по рецептурам техкарт
 */

import { db } from '../state/db.js';
import { showToast } from '../components/toast.js';

export class StockService {
  /**
   * Сквозное списание сырья при оплате заказа / чека
   * @param {Array} orderItems - Позиции заказа [{menuItemId, qty, name, price}]
   * @param {string} estId - ID заведения
   */
  static deductStockForOrder(orderItems, estId) {
    if (!orderItems || !orderItems.length) return;

    const deductionsMap = new Map(); // ingredientId -> totalKgToDeduct

    // Рекурсивный сбор потребности в сырье
    const processTechCard = (techCardId, multiplier, visited = new Set()) => {
      if (!techCardId || visited.has(techCardId)) return;
      visited.add(techCardId);

      const tc = db.getById('techCards', techCardId);
      if (!tc || !tc.items) return;

      for (const item of tc.items) {
        if (item.ingredientId) {
          const kg = (item.grossWeight / 1000) * multiplier;
          const current = deductionsMap.get(item.ingredientId) || 0;
          deductionsMap.set(item.ingredientId, current + kg);
        } else if (item.semiFinishedCardId) {
          const semiCard = db.getById('techCards', item.semiFinishedCardId);
          const ratio = (item.grossWeight / (semiCard?.outputWeight || 100)) * multiplier;
          processTechCard(item.semiFinishedCardId, ratio, new Set(visited));
        }
      }
    };

    // Обход всех пробитых блюд
    for (const orderItem of orderItems) {
      const dishId = orderItem.menuItemId || orderItem.id;
      const dish = db.getById('menuItems', dishId);
      if (dish && dish.techCardId) {
        processTechCard(dish.techCardId, orderItem.qty);
      }
    }

    // Выполнение списания со склада в БД
    const warnings = [];

    deductionsMap.forEach((kgToDeduct, ingId) => {
      const ing = db.getById('ingredients', ingId);
      if (ing) {
        const current = ing.currentStock !== undefined && ing.currentStock !== null ? ing.currentStock : (ing.stockQty ?? 0);
        const newStock = Math.max(0, Math.round((current - kgToDeduct) * 100) / 100);
        db.update('ingredients', ingId, { currentStock: newStock, stockQty: newStock });

        const minAlert = ing.minStockAlert !== undefined && ing.minStockAlert !== null ? ing.minStockAlert : (ing.minStockQty ?? 5);
        if (newStock <= minAlert) {
          warnings.push(`${ing.name} (остаток: ${newStock} ${ing.unit || 'кг'})`);
        }
      }
    });

    if (warnings.length > 0) {
      showToast(`⚠️ Списано со склада. Заканчиваются: ${warnings.join(', ')}`, 'warning');
    } else {
      showToast('Сырье успешно списано со склада по нормам техкарты', 'info');
    }
  }
}
