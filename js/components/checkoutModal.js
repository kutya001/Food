/**
 * CHECKOUT-MODAL.JS — Модальное окно оформления заказа (Доставка/Самовывоз, Оплата)
 */

import { db } from '../state/db.js';
import { AuthManager } from '../state/auth.js';
import { CartDrawer } from './cartDrawer.js';
import { OrderTrackerModal } from './orderTrackerModal.js';
import { StockService } from '../services/stockService.js';
import { showToast } from './toast.js';

export class CheckoutModal {
  static open(items, totalSum, totalKbju) {
    let backdrop = document.getElementById('checkout-modal-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'checkout-modal-backdrop';
      backdrop.className = 'modal-backdrop';
      document.body.appendChild(backdrop);
    }

    const user = AuthManager.getActiveUser() || { name: 'Клиент', phone: '+996 555 12-34-56' };

    backdrop.innerHTML = `
      <div class="modal-dialog" style="max-width: 520px;" role="dialog">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">🛍️ Оформление заказа</h3>
            <p class="text-xs text-muted">Позиций: ${items.length} шт · КБЖУ: ${totalKbju.calories} ккал</p>
          </div>
          <button class="modal-close-btn" id="close-checkout-modal">✕</button>
        </div>

        <form id="checkout-form" class="modal-body">
          <div class="form-group">
            <label class="form-label">Способ получения:</label>
            <div style="display: flex; gap: var(--space-2);">
              <label class="radio-label">
                <input type="radio" name="delivery_type" value="delivery" checked> 🚚 Доставка курьером
              </label>
              <label class="radio-label">
                <input type="radio" name="delivery_type" value="pickup"> 🛍️ Самовывоз из заведения
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Адрес доставки:</label>
            <input type="text" class="input" id="checkout-address" placeholder="ул. Киевская 120, кв. 45" required value="ул. Токтогула 125/1">
          </div>

          <div class="grid grid-cols-2" style="gap: var(--space-3);">
            <div class="form-group">
              <label class="form-label">Ваше имя:</label>
              <input type="text" class="input" id="checkout-name" value="${user.name}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Телефон:</label>
              <input type="tel" class="input" id="checkout-phone" value="${user.phone || '+996 555 12-34-56'}" required>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Способ оплаты:</label>
            <select class="select" id="checkout-payment">
              <option value="cash">💵 Наличными при получении (сдача)</option>
              <option value="card">💳 Банковской картой / MBank онлайн</option>
              <option value="corp">🏢 Корпоративный баланс компании</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Комментарий к заказу:</label>
            <textarea class="textarea" id="checkout-comment" rows="2" placeholder="Код домофона, не звонить в дверь, приборы на 2 персоны..."></textarea>
          </div>

          <!-- Итоговый блок -->
          <div style="background: var(--color-surface-alt); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--color-border); margin-top: var(--space-3); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span class="text-xs text-muted">Итого к оплате:</span>
              <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-extrabold); color: var(--color-primary);">
                ${totalSum} сом
              </div>
            </div>
            <div style="text-align: right;">
              <span class="text-xs text-muted">Энергия:</span>
              <div style="font-weight: var(--font-weight-bold);">${totalKbju.calories} ккал</div>
            </div>
          </div>

          <div style="margin-top: var(--space-4); display: flex; flex-direction: column; gap: var(--space-2);">
            <button type="submit" class="btn btn-accent btn-lg" style="width: 100%;">
              Подтвердить заказ на ${totalSum} сом →
            </button>
          </div>
        </form>
      </div>
    `;

    setTimeout(() => backdrop.classList.add('open'), 10);

    const form = backdrop.querySelector('#checkout-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const payMethod = backdrop.querySelector('#checkout-payment').value;
      const targetEstId = items[0]?.estId || 'est_1';

      // Если оплата с корп. счета — проверяем и списываем баланс
      if (payMethod === 'corp') {
        const org = AuthManager.getActiveOrganization();
        if (org) {
          if (totalSum > (org.currentBalance || 0)) {
            showToast('Ошибка: на корпоративном счете недостаточно средств!', 'error');
            return;
          }
          db.update('organizations', org.id, { currentBalance: (org.currentBalance || 0) - totalSum });
        }
      }

      const newOrder = {
        userId: user.id || 'user_1',
        estId: targetEstId,
        type: 'b2c_retail',
        items: items.map(i => ({
          menuItemId: i.id,
          name: i.name,
          qty: i.qty,
          price: i.retailPrice,
          total: i.retailPrice * i.qty,
          kbju: i.kbju
        })),
        totalSum: totalSum,
        totalCalories: totalKbju.calories,
        address: backdrop.querySelector('#checkout-address').value,
        customerName: backdrop.querySelector('#checkout-name').value,
        customerPhone: backdrop.querySelector('#checkout-phone').value,
        paymentMethod: payMethod,
        comment: backdrop.querySelector('#checkout-comment').value,
        status: 'accepted'
      };

      // Сохраняем в БД
      const createdOrder = db.insert('orders', newOrder);

      // Сквозное списание сырья со склада заведения
      StockService.deductStockForOrder(items, targetEstId);

      // Очищаем корзину
      CartDrawer.clear();

      // Закрываем модалку
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);

      showToast(`Заказ #${createdOrder.id.slice(-4)} успешно оформлен!`, 'success');

      // Запуск трекера заказа
      OrderTrackerModal.open(createdOrder);
    });

    backdrop.querySelector('#close-checkout-modal').addEventListener('click', () => {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);
    });
  }
}
