/**
 * BUSINESS-WAREHOUSE-VIEW.JS — Управление складом сырья, остатками и накладными
 */

import { db } from '../state/db.js';
import { AuthManager } from '../state/auth.js';
import { ReceiptModal } from '../components/receiptModal.js';
import { WriteOffModal } from '../components/writeOffModal.js';

export class BusinessWarehouseView {
  static activeCategory = 'all';
  static searchQuery = '';

  static render(container) {
    const est = AuthManager.getActiveEstablishment() || { id: 'est_1', name: 'Столовая «Свежесть»' };
    const allIngredients = db.query('ingredients', i => i.estId === est.id);

    const categories = ['all', 'Мясо и птица', 'Бакалея', 'Овощи и зелень', 'Молочные продукты', 'Соусы и специи'];
    const lowStockItems = allIngredients.filter(i => i.currentStock <= i.minStockAlert);
    const totalWarehouseSom = Math.round(allIngredients.reduce((sum, i) => sum + (i.currentStock * i.purchasePrice), 0));

    container.innerHTML = `
      <div>
        <!-- Предупреждение о критических остатках -->
        ${lowStockItems.length > 0 ? `
          <div class="alert alert-warning" style="margin-bottom: var(--space-4); display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.3rem;">⚠️</span>
              <div>
                <strong>Внимание: ${lowStockItems.length} позиций сырья заканчиваются!</strong>
                <div class="text-xs">Требуется закупка: ${lowStockItems.map(i => i.name).join(', ')}</div>
              </div>
            </div>
            <button class="btn btn-warning btn-sm" id="btn-quick-receipt-from-alert">
              📥 Оформить приход
            </button>
          </div>
        ` : ''}

        <!-- Верхняя панель управления складом -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-3); margin-bottom: var(--space-4);">
          <div style="display: flex; gap: var(--space-2); flex: 1; max-width: 480px;">
            <input type="text" class="input" id="wh-search-input" placeholder="🔍 Поиск сырья (говядина, мука, масло...)" value="${this.searchQuery}">
          </div>

          <div style="display: flex; gap: var(--space-2);">
            <button class="btn btn-primary" id="btn-open-receipt-modal">
              📥 Приходная накладная
            </button>
            <button class="btn btn-secondary" id="btn-open-writeoff-modal" style="color: var(--color-error);">
              🗑️ Акт списания
            </button>
          </div>
        </div>

        <!-- Чипы категорий склада -->
        <div class="category-chips" style="margin-bottom: var(--space-4);">
          ${categories.map(cat => `
            <button class="category-chip ${this.activeCategory === cat ? 'active' : ''}" data-cat="${cat}">
              ${cat === 'all' ? '📦 Все позиции (' + allIngredients.length + ')' : cat}
            </button>
          `).join('')}
        </div>

        <!-- Таблица остатков -->
        <div class="warehouse-table-container">
          <table class="table" style="margin: 0;">
            <thead>
              <tr>
                <th>Наименование сырья</th>
                <th>Категория</th>
                <th>Текущий остаток</th>
                <th>Мин. порог</th>
                <th>Закупочная цена</th>
                <th>Сумма запаса</th>
                <th>Статус остатка</th>
              </tr>
            </thead>
            <tbody id="wh-table-body">
              <!-- Рендер строк -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.bindEvents(container);
    this.renderTableRows(container);
  }

  static renderTableRows(container) {
    const tbody = container.querySelector('#wh-table-body');
    if (!tbody) return;

    const est = AuthManager.getActiveEstablishment() || { id: 'est_1' };
    let list = db.query('ingredients', i => i.estId === est.id);

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }

    if (this.activeCategory !== 'all') {
      list = list.filter(i => i.category === this.activeCategory);
    }

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: var(--space-6); color: var(--color-text-secondary);">
            Сырье по заданным критериям не найдено
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map(ing => {
      const isCritical = ing.currentStock <= (ing.minStockAlert * 0.5);
      const isWarning = ing.currentStock <= ing.minStockAlert;
      const totalSum = Math.round(ing.currentStock * ing.purchasePrice);

      let rowClass = '';
      let statusBadge = '<span class="badge badge-success">В норме</span>';

      if (isCritical) {
        rowClass = 'stock-critical-row';
        statusBadge = '<span class="badge badge-error">Критический запас!</span>';
      } else if (isWarning) {
        rowClass = 'stock-warning-row';
        statusBadge = '<span class="badge badge-warning">Заканчивается</span>';
      }

      return `
        <tr class="${rowClass}">
          <td>
            <strong>${ing.name}</strong>
            ${ing.allergens?.length > 0 ? `<div class="text-xs text-muted">Аллергены: ${ing.allergens.join(', ')}</div>` : ''}
          </td>
          <td>${ing.category}</td>
          <td>
            <strong style="font-size: var(--font-size-md);">${ing.currentStock} ${ing.unit}</strong>
          </td>
          <td class="text-muted">${ing.minStockAlert} ${ing.unit}</td>
          <td><strong>${ing.purchasePrice} сом</strong> / ${ing.unit}</td>
          <td><strong style="color: var(--color-primary);">${totalSum} сом</strong></td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join('');
  }

  static bindEvents(container) {
    // Поиск
    const searchInput = container.querySelector('#wh-search-input');
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.renderTableRows(container);
    });

    // Фильтр категорий
    container.querySelectorAll('.category-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.activeCategory = chip.dataset.cat;
        container.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.renderTableRows(container);
      });
    });

    // Модалка прихода
    const openReceipt = () => {
      ReceiptModal.open(() => this.render(container));
    };

    container.querySelector('#btn-open-receipt-modal').addEventListener('click', openReceipt);
    const alertBtn = container.querySelector('#btn-quick-receipt-from-alert');
    if (alertBtn) alertBtn.addEventListener('click', openReceipt);

    // Модалка списания
    container.querySelector('#btn-open-writeoff-modal').addEventListener('click', () => {
      WriteOffModal.open(() => this.render(container));
    });
  }
}
