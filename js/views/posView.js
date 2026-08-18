/**
 * POS-VIEW.JS — Главный сенсорный терминал кассира (Touch UI, Neo-Dark, Чек, Оплата)
 */

import { db } from '../state/db.js';
import { AuthManager } from '../state/auth.js';
import { ThemeManager } from '../theme/themeManager.js';
import { PosPaymentModal } from '../components/posPaymentModal.js';
import { PosShiftModal } from '../components/posShiftModal.js';
import { showToast } from '../components/toast.js';
import { Haptics } from '../services/haptics.js';

export class PosView {
  static activeCategory = 'all';
  static searchQuery = '';
  static activeTable = 'Стол №1';
  static discountPercent = 0;
  static billItems = []; // [{ id, name, retailPrice, qty, photoIcon }]

  static render(container) {
    const est = AuthManager.getActiveEstablishment() || { id: 'est_1', name: 'Столовая «Свежесть»' };
    const allDishes = db.query('menuItems', m => m.estId === est.id);
    const categories = ['all', 'Вторые блюда', 'Супы', 'Салаты', 'Бургеры', 'Стейки & Гриль'];

    const totalBillCount = this.billItems.reduce((s, i) => s + i.qty, 0);
    const rawTotal = this.billItems.reduce((sum, i) => sum + (i.retailPrice * i.qty), 0);
    const finalTotal = Math.max(0, rawTotal - Math.round(rawTotal * (this.discountPercent / 100)));

    container.innerHTML = `
      <div class="container" style="max-width: 1300px;">
        <!-- Верхняя плашка кассовой смены -->
        <div class="pos-shift-statusbar">
          <div style="display: flex; align-items: center; gap: var(--space-3);">
            <span style="font-size: 1.5rem;">💻</span>
            <div>
              <strong style="font-size: var(--font-size-md);">POS-Терминал: ${est.name}</strong>
              <div class="text-xs text-muted">Кассир: Айтматов Э. · Смена №42 (Открыта)</div>
            </div>
          </div>

          <div style="display: flex; gap: var(--space-2);">
            <button class="btn btn-secondary btn-sm" id="btn-pos-x-report">
              📊 X-отчёт
            </button>
            <button class="btn btn-secondary btn-sm" id="btn-pos-z-report" style="color: var(--color-error);">
              🔴 Закрыть смену (Z-отчёт)
            </button>
          </div>
        </div>

        <!-- Двухколоночный сенсорный макет -->
        <div class="pos-terminal-layout">
          <!-- Левая колонка: Категории и тач-плитки -->
          <div class="pos-catalog-panel">
            <!-- Поиск -->
            <div style="margin-bottom: var(--space-3);">
              <input type="text" class="input" id="pos-search-input" placeholder="🔍 Быстрый поиск блюда или артикула..." value="${this.searchQuery}">
            </div>

            <!-- Категории блюд -->
            <div class="category-chips" style="margin-bottom: var(--space-3);">
              ${categories.map(cat => `
                <button class="category-chip ${this.activeCategory === cat ? 'active' : ''}" data-cat="${cat}">
                  ${cat === 'all' ? '✨ Все' : cat}
                </button>
              `).join('')}
            </div>

            <!-- Сенсорная сетка блюд -->
            <div class="pos-touch-grid" id="pos-dishes-grid">
              <!-- Рендер тач-плиток -->
            </div>
          </div>

          <!-- Правая колонка: Чек заказа -->
          <div class="pos-bill-panel" id="pos-bill-panel-el">
            <div class="pos-bill-header">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.2rem;">🧾</span>
                <strong>Текущий чек</strong>
              </div>

              <div style="display: flex; align-items: center; gap: 6px;">
                <!-- Выбор стола / с собой -->
                <select class="select btn-sm" id="pos-table-select" style="width: auto; padding: 4px 8px;">
                  <option value="Стол №1" ${this.activeTable === 'Стол №1' ? 'selected' : ''}>Стол №1</option>
                  <option value="Стол №2" ${this.activeTable === 'Стол №2' ? 'selected' : ''}>Стол №2</option>
                  <option value="Стол №3" ${this.activeTable === 'Стол №3' ? 'selected' : ''}>Стол №3</option>
                  <option value="Стол №4" ${this.activeTable === 'Стол №4' ? 'selected' : ''}>Стол №4</option>
                  <option value="С собой" ${this.activeTable === 'С собой' ? 'selected' : ''}>🥡 С собой</option>
                </select>
                <button class="btn btn-ghost btn-sm show-on-mobile" id="btn-close-mobile-bill" style="padding: 4px 8px; font-size: 1.2rem;">✕</button>
              </div>
            </div>

            <!-- Список позиций в чеке -->
            <div class="pos-bill-items-list" id="pos-bill-items">
              <!-- Рендер позиций чека -->
            </div>

            <!-- Подвал чека: скидки и оплата -->
            <div class="pos-bill-footer">
              <!-- Скидки -->
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: var(--font-size-xs);">
                <span class="text-muted">Скидка на чек:</span>
                <div style="display: flex; gap: 4px;">
                  ${[0, 5, 10, 15, 20].map(d => `
                    <button class="btn btn-secondary btn-sm ${this.discountPercent === d ? 'active' : ''}" style="padding: 2px 8px; font-size: 11px;" data-discount="${d}">
                      ${d === 0 ? '0%' : `${d}%`}
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Суммы -->
              <div class="pos-totals-row">
                <span>Итого без скидки:</span>
                <span id="pos-raw-sum">0 сом</span>
              </div>
              <div class="pos-totals-row" style="color: var(--color-warning);">
                <span>Скидка:</span>
                <span id="pos-discount-sum">0 сом</span>
              </div>
              <div class="pos-totals-row final">
                <span>К оплате:</span>
                <span id="pos-final-sum" style="color: var(--color-primary);">0 сом</span>
              </div>

              <!-- Кнопки действий -->
              <div style="display: grid; grid-template-columns: 1fr 2fr; gap: var(--space-2); margin-top: var(--space-2);">
                <button class="btn btn-secondary" id="btn-clear-pos-bill" style="min-height: 48px;">
                  🗑️ Очистить
                </button>
                <button class="btn btn-accent btn-lg" id="btn-open-pos-payment" style="min-height: 48px; font-size: var(--font-size-md);">
                  💳 Оплатить чек →
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Мобильная плавающая плашка чека -->
        ${totalBillCount > 0 ? `
          <div class="pos-mobile-bar" id="btn-pos-mobile-bar">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.3rem;">🧾</span>
              <div>
                <strong>Чек: ${totalBillCount} поз.</strong>
                <div class="text-xs text-muted">${this.activeTable}</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="color: var(--color-primary); font-size: 1.15rem;">${finalTotal} сом</strong>
              <span class="btn btn-accent btn-sm">Открыть →</span>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    this.bindEvents(container);
    this.renderTiles(container);
    this.renderBill(container);
  }

  static renderTiles(container) {
    const grid = container.querySelector('#pos-dishes-grid');
    if (!grid) return;

    const est = AuthManager.getActiveEstablishment() || { id: 'est_1' };
    let list = db.query('menuItems', m => m.estId === est.id);

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(m => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q));
    }

    if (this.activeCategory !== 'all') {
      list = list.filter(m => m.category === this.activeCategory);
    }

    if (list.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: var(--space-6); color: var(--color-text-secondary);">
          Блюда не найдены
        </div>
      `;
      return;
    }

    grid.innerHTML = list.map(dish => `
      <div class="pos-dish-tile ${dish.inStopList ? 'tile-stoplist' : ''}" data-dish-id="${dish.id}">
        <div class="pos-tile-icon">${dish.photoIcon || '🍲'}</div>
        <div class="pos-tile-title">${dish.name}</div>
        <div class="pos-tile-price">${dish.retailPrice} сом</div>
        ${dish.inStopList ? '<span class="badge badge-error" style="font-size:9px; position:absolute; top:4px; right:4px;">СТОП</span>' : ''}
      </div>
    `).join('');

    // Клик по плитке -> Добавление в чек
    grid.querySelectorAll('.pos-dish-tile').forEach(tile => {
      tile.addEventListener('click', () => {
        const dishId = tile.dataset.dishId;
        const dish = db.getById('menuItems', dishId);
        if (dish) {
          if (dish.inStopList) {
            showToast(`«${dish.name}» находится в стоп-листе!`, 'error');
            return;
          }
          this.addToBill(dish);
        }
      });
    });
  }

  static addToBill(dish) {
    const existing = this.billItems.find(i => i.id === dish.id);
    if (existing) {
      existing.qty++;
    } else {
      this.billItems.push({
        id: dish.id,
        name: dish.name,
        retailPrice: dish.retailPrice,
        photoIcon: dish.photoIcon || '🍲',
        qty: 1
      });
    }
    const container = document.getElementById('app-root');
    if (container) this.renderBill(container);
  }

  static updateBillQty(dishId, delta) {
    const item = this.billItems.find(i => i.id === dishId);
    if (item) {
      item.qty += delta;
      if (item.qty <= 0) {
        this.billItems = this.billItems.filter(i => i.id !== dishId);
      }
      const container = document.getElementById('app-root');
      if (container) this.renderBill(container);
    }
  }

  static renderBill(container) {
    const itemsList = container.querySelector('#pos-bill-items');
    const rawSumEl = container.querySelector('#pos-raw-sum');
    const finalSumEl = container.querySelector('#pos-final-sum');
    if (!itemsList || !rawSumEl || !finalSumEl) return;

    if (this.billItems.length === 0) {
      itemsList.innerHTML = `
        <div style="text-align: center; padding: var(--space-8) var(--space-3); color: var(--color-text-secondary);">
          <div style="font-size: 2.5rem; margin-bottom: var(--space-2);">🧾</div>
          <h4>Чек пуст</h4>
          <p class="text-xs">Нажимайте на плитки блюд слева для добавления в заказ</p>
        </div>
      `;
      rawSumEl.textContent = '0 сом';
      finalSumEl.textContent = '0 сом';
      return;
    }

    const rawTotal = this.billItems.reduce((sum, i) => sum + (i.retailPrice * i.qty), 0);
    const discountAmount = Math.round(rawTotal * (this.discountPercent / 100));
    const finalTotal = Math.max(0, rawTotal - discountAmount);

    rawSumEl.textContent = `${rawTotal} сом`;
    finalSumEl.textContent = `${finalTotal} сом`;

    const discountEl = container.querySelector('#pos-discount-sum');
    if (discountEl) discountEl.textContent = `-${discountAmount} сом`;

    itemsList.innerHTML = this.billItems.map(item => `
      <div class="pos-bill-row">
        <div>
          <div style="font-weight: bold;">${item.name}</div>
          <div class="text-muted">${item.retailPrice} сом / шт</div>
        </div>
        <div class="qty-stepper" style="padding: 0;">
          <button class="qty-btn btn-bill-minus" data-id="${item.id}" style="width:28px; height:28px; font-size:12px;">−</button>
          <span class="qty-number" style="min-width:24px; font-size:12px;">${item.qty}</span>
          <button class="qty-btn btn-bill-plus" data-id="${item.id}" style="width:28px; height:28px; font-size:12px;">+</button>
        </div>
        <strong style="color: var(--color-primary);">${item.retailPrice * item.qty} сом</strong>
        <button class="btn btn-ghost btn-sm btn-bill-del" data-id="${item.id}" style="color:var(--color-error); padding:2px 6px;">✕</button>
      </div>
    `).join('');

    itemsList.querySelectorAll('.btn-bill-minus').forEach(b => {
      b.addEventListener('click', () => this.updateBillQty(b.dataset.id, -1));
    });
    itemsList.querySelectorAll('.btn-bill-plus').forEach(b => {
      b.addEventListener('click', () => this.updateBillQty(b.dataset.id, 1));
    });
    itemsList.querySelectorAll('.btn-bill-del').forEach(b => {
      b.addEventListener('click', () => {
        this.billItems = this.billItems.filter(i => i.id !== b.dataset.id);
        this.renderBill(container);
      });
    });
  }

  static bindEvents(container) {
    // Поиск
    const searchInput = container.querySelector('#pos-search-input');
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.renderTiles(container);
    });

    // Категории
    container.querySelectorAll('.category-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.activeCategory = chip.dataset.cat;
        container.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.renderTiles(container);
      });
    });

    // Выбор стола
    const tableSelect = container.querySelector('#pos-table-select');
    tableSelect.addEventListener('change', (e) => {
      this.activeTable = e.target.value;
    });

    // Скидки
    container.querySelectorAll('[data-discount]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.discountPercent = parseInt(btn.dataset.discount);
        this.render(container);
      });
    });

    // Очистить чек
    container.querySelector('#btn-clear-pos-bill').addEventListener('click', () => {
      if (this.billItems.length > 0) {
        this.billItems = [];
        this.discountPercent = 0;
        this.renderBill(container);
        showToast('Чек очищен', 'info');
      }
    });

    // Оплатить чек
    const payBtn = container.querySelector('#btn-open-pos-payment') || container.querySelector('#btn-pay-pos-bill');
    if (payBtn) {
      payBtn.addEventListener('click', () => {
        if (this.billItems.length === 0) {
          showToast('Чек пуст! Добавьте блюда для пробития оплаты.', 'warning');
          return;
        }

        const rawTotal = this.billItems.reduce((sum, i) => sum + (i.retailPrice * i.qty), 0);
        const discountAmount = Math.round(rawTotal * (this.discountPercent / 100));
        const finalTotal = Math.max(0, rawTotal - discountAmount);

        Haptics.medium();
        PosPaymentModal.open({
          items: this.billItems,
          table: this.activeTable,
          rawTotal: rawTotal,
          discountPercent: this.discountPercent,
          totalSum: finalTotal
        }, () => {
          this.billItems = [];
          this.discountPercent = 0;
          this.render(container);
        });
      });
    }

    // Мобильная плавающая плашка чека (открытие шторки)
    const mobileBar = container.querySelector('#btn-pos-mobile-bar');
    const billPanel = container.querySelector('#pos-bill-panel-el');
    if (mobileBar && billPanel) {
      mobileBar.addEventListener('click', () => {
        Haptics.light();
        billPanel.classList.add('mobile-expanded');
      });
    }

    // Закрытие мобильной шторки чека
    const closeMobileBillBtn = container.querySelector('#btn-close-mobile-bill');
    if (closeMobileBillBtn && billPanel) {
      closeMobileBillBtn.addEventListener('click', () => {
        Haptics.light();
        billPanel.classList.remove('mobile-expanded');
      });
    }

    // X-отчёт
    container.querySelector('#btn-pos-x-report').addEventListener('click', () => {
      Haptics.light();
      PosShiftModal.open('x_report');
    });

    // Z-отчёт
    container.querySelector('#btn-pos-z-report').addEventListener('click', () => {
      Haptics.light();
      PosShiftModal.open('z_report', () => {
        this.render(container);
      });
    });
  }
}
