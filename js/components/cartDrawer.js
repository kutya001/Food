/**
 * CART-DRAWER.JS — Управление корзиной и расчет суммарного КБЖУ заказа
 */

import { showToast } from './toast.js';
import { CheckoutModal } from './checkoutModal.js';

const CART_STORAGE_KEY = 'foodflow_cart_items';

export class CartDrawer {
  static items = [];

  static init() {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      this.items = saved ? JSON.parse(saved) : [];
    } catch (e) {
      this.items = [];
    }
    this.updateHeaderBadge();
  }

  static save() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items));
    this.updateHeaderBadge();
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items: this.items } }));
  }

  static addItem(dish, qty = 1) {
    const existing = this.items.find(i => i.id === dish.id);
    if (existing) {
      existing.qty += qty;
    } else {
      this.items.push({
        id: dish.id,
        name: dish.name,
        retailPrice: dish.retailPrice,
        photoIcon: dish.photoIcon || '🍲',
        portionWeight: dish.portionWeight || '350 г',
        kbju: dish.kbju || { calories: 350, protein: 15, fat: 12, carbs: 30 },
        qty: qty
      });
    }
    this.save();
    showToast(`«${dish.name}» добавлен в корзину (${dish.retailPrice} сом)`, 'success');
  }

  static updateQty(dishId, delta) {
    const item = this.items.find(i => i.id === dishId);
    if (item) {
      item.qty += delta;
      if (item.qty <= 0) {
        this.items = this.items.filter(i => i.id !== dishId);
      }
      this.save();
      this.renderDrawerContent();
    }
  }

  static removeItem(dishId) {
    this.items = this.items.filter(i => i.id !== dishId);
    this.save();
    this.renderDrawerContent();
  }

  static clear() {
    this.items = [];
    this.save();
    this.renderDrawerContent();
  }

  static getTotalSum() {
    return this.items.reduce((sum, i) => sum + (i.retailPrice * i.qty), 0);
  }

  static getTotalKbju() {
    return this.items.reduce((acc, i) => {
      acc.calories += (i.kbju.calories || 0) * i.qty;
      acc.protein += (i.kbju.protein || 0) * i.qty;
      acc.fat += (i.kbju.fat || 0) * i.qty;
      acc.carbs += (i.kbju.carbs || 0) * i.qty;
      return acc;
    }, { calories: 0, protein: 0, fat: 0, carbs: 0 });
  }

  static updateHeaderBadge() {
    const badge = document.getElementById('cart-count');
    const totalCount = this.items.reduce((sum, i) => sum + i.qty, 0);
    if (badge) {
      badge.textContent = totalCount;
      badge.style.display = totalCount > 0 ? 'inline-block' : 'none';
    }
  }

  static open() {
    let backdrop = document.getElementById('cart-drawer-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'cart-drawer-backdrop';
      backdrop.className = 'drawer-backdrop';
      document.body.appendChild(backdrop);
    }

    backdrop.innerHTML = `
      <div class="drawer-panel" id="cart-drawer-panel">
        <div class="drawer-header">
          <div style="display: flex; align-items: center; gap: var(--space-2);">
            <span style="font-size: 1.3rem;">🛒</span>
            <h3 style="margin: 0; font-size: var(--font-size-lg);">Корзина заказа</h3>
          </div>
          <button class="modal-close-btn" id="close-cart-drawer">✕</button>
        </div>

        <div class="drawer-body" id="cart-drawer-items-container">
          <!-- Рендер позиций -->
        </div>

        <div class="drawer-footer" id="cart-drawer-footer">
          <!-- Рендер итогов -->
        </div>
      </div>
    `;

    setTimeout(() => backdrop.classList.add('open'), 10);

    backdrop.querySelector('#close-cart-drawer').addEventListener('click', () => this.close());
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) this.close();
    });

    this.renderDrawerContent();
  }

  static close() {
    const backdrop = document.getElementById('cart-drawer-backdrop');
    if (backdrop) {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);
    }
  }

  static renderDrawerContent() {
    const itemsContainer = document.getElementById('cart-drawer-items-container');
    const footerContainer = document.getElementById('cart-drawer-footer');
    if (!itemsContainer || !footerContainer) return;

    if (this.items.length === 0) {
      itemsContainer.innerHTML = `
        <div style="text-align: center; padding: var(--space-8) var(--space-4); color: var(--color-text-secondary);">
          <div style="font-size: 3.5rem; margin-bottom: var(--space-3);">🍲</div>
          <h4>Ваша корзина пуста</h4>
          <p class="text-xs" style="margin-top: 4px;">Выберите блюда из меню витрины столовой или ресторана</p>
        </div>
      `;
      footerContainer.innerHTML = `
        <button class="btn btn-secondary" id="empty-cart-close-btn" style="width: 100%;">
          Перейти к выбору блюд
        </button>
      `;
      footerContainer.querySelector('#empty-cart-close-btn').addEventListener('click', () => this.close());
      return;
    }

    const totalSum = this.getTotalSum();
    const totalKbju = this.getTotalKbju();

    itemsContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--space-3);">
        ${this.items.map(item => `
          <div class="cart-item-card">
            <div class="cart-item-icon">${item.photoIcon}</div>
            <div>
              <div class="cart-item-title">${item.name}</div>
              <div class="text-xs text-muted">${item.portionWeight} · ${item.kbju.calories * item.qty} ккал</div>
              <div class="cart-item-price-som">${item.retailPrice * item.qty} сом</div>
            </div>
            <div class="qty-stepper">
              <button class="qty-btn btn-minus" data-id="${item.id}">−</button>
              <span class="qty-number">${item.qty}</span>
              <button class="qty-btn btn-plus" data-id="${item.id}">+</button>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Сводка питательности заказа -->
      <div class="cart-nutrition-summary">
        <div>
          <strong style="color: var(--color-primary);">${totalKbju.calories} ккал</strong>
          <span class="text-muted" style="display: block;">Питательность</span>
        </div>
        <div>
          <strong>${Math.round(totalKbju.protein)}г</strong>
          <span class="text-muted" style="display: block;">Белки</span>
        </div>
        <div>
          <strong>${Math.round(totalKbju.fat)}г</strong>
          <span class="text-muted" style="display: block;">Жиры</span>
        </div>
        <div>
          <strong>${Math.round(totalKbju.carbs)}г</strong>
          <span class="text-muted" style="display: block;">Углеводы</span>
        </div>
      </div>
    `;

    footerContainer.innerHTML = `
      <div class="drawer-total-row">
        <span style="font-size: var(--font-size-md); font-weight: var(--font-weight-bold);">Сумма заказа:</span>
        <strong style="font-size: var(--font-size-2xl); color: var(--color-primary);">${totalSum} сом</strong>
      </div>
      <button class="btn btn-accent btn-lg" id="proceed-to-checkout-btn" style="width: 100%;">
        Оформить доставку →
      </button>
      <button class="btn btn-ghost btn-sm" id="clear-cart-btn" style="color: var(--color-error);">
        Очистить корзину
      </button>
    `;

    // Слушатели кнопок внутри шторки
    itemsContainer.querySelectorAll('.btn-minus').forEach(b => {
      b.addEventListener('click', () => this.updateQty(b.dataset.id, -1));
    });
    itemsContainer.querySelectorAll('.btn-plus').forEach(b => {
      b.addEventListener('click', () => this.updateQty(b.dataset.id, 1));
    });

    footerContainer.querySelector('#clear-cart-btn').addEventListener('click', () => this.clear());
    footerContainer.querySelector('#proceed-to-checkout-btn').addEventListener('click', () => {
      this.close();
      CheckoutModal.open(this.items, totalSum, totalKbju);
    });
  }
}
