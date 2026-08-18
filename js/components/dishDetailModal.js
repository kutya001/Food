/**
 * DISH-DETAIL-MODAL.JS — Подробная карточка блюда с КБЖУ нутриентами, аллергенами и составом
 */

import { db } from '../state/db.js';
import { CartDrawer } from './cartDrawer.js';

export class DishDetailModal {
  static open(menuItemId) {
    const item = db.getById('menuItems', menuItemId);
    if (!item) return;

    const est = db.getById('establishments', item.estId) || { name: 'Общепит', address: 'г. Бишкек', rating: 4.8 };
    const techCard = db.getById('techCards', item.techCardId) || {
      calculatedKbju: { calories: 380, protein: 18, fat: 14, carbs: 36 },
      items: []
    };

    const kbju = techCard.calculatedKbju;

    // Сбор названий ингредиентов и аллергенов
    const ingredientsList = techCard.items.map(tci => {
      const ing = db.getById('ingredients', tci.ingredientId);
      return ing ? ing.name : 'Ингредиент';
    });

    const allergensList = new Set();
    techCard.items.forEach(tci => {
      const ing = db.getById('ingredients', tci.ingredientId);
      if (ing?.allergens) ing.allergens.forEach(a => allergensList.add(a));
    });

    let backdrop = document.getElementById('dish-detail-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'dish-detail-backdrop';
      backdrop.className = 'modal-backdrop';
      document.body.appendChild(backdrop);
    }

    let currentQty = 1;

    // Расчет % от суточной нормы (базовая норма: 2000 ккал, 75г белка, 65г жиров, 280г углей)
    const calPercent = Math.min(100, Math.round((kbju.calories / 2000) * 100));
    const protPercent = Math.min(100, Math.round((kbju.protein / 75) * 100));
    const fatPercent = Math.min(100, Math.round((kbju.fat / 65) * 100));
    const carbPercent = Math.min(100, Math.round((kbju.carbs / 280) * 100));

    backdrop.innerHTML = `
      <div class="modal-dialog dish-detail-dialog" role="dialog">
        <div class="dish-detail-hero">
          <span>${item.photoIcon || '🍲'}</span>
          <button class="modal-close-btn" id="close-dish-modal" style="position:absolute; top:12px; right:12px; background:var(--color-surface); box-shadow:0 2px 6px rgba(0,0,0,0.1);">✕</button>
        </div>

        <div class="dish-detail-body">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-2);">
            <div>
              <h2 style="font-size: var(--font-size-xl); margin-bottom: 2px;">${item.name}</h2>
              <div style="display: flex; align-items: center; gap: var(--space-2); font-size: var(--font-size-xs); color: var(--color-text-secondary);">
                <span>🏠 ${est.name}</span>
                <span>•</span>
                <span>⭐ ${est.rating}</span>
                <span>•</span>
                <span>📦 ${item.portionWeight || '350 г'}</span>
              </div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-extrabold); color: var(--color-primary);">${item.retailPrice} сом</span>
              ${item.corpPrice ? `<div class="text-xs text-muted">Корп: ${item.corpPrice} сом</div>` : ''}
            </div>
          </div>

          <p style="font-size: var(--font-size-sm); color: var(--color-text-secondary); line-height: 1.5; margin: var(--space-3) 0;">
            ${item.description}
          </p>

          <!-- Диетические теги -->
          <div style="display: flex; gap: 6px; margin-bottom: var(--space-4);">
            ${item.dietary?.includes('halal') ? '<span class="badge badge-success">✅ Халяль</span>' : ''}
            ${item.dietary?.includes('vegan') ? '<span class="badge badge-primary">🌱 Веган</span>' : ''}
            ${item.dietary?.includes('gluten_free') ? '<span class="badge badge-accent">🌾 Без глютена</span>' : ''}
          </div>

          <!-- Матрица КБЖУ с прогресс-барами -->
          <div class="kbju-matrix-card">
            <h4 style="font-size: var(--font-size-xs); text-transform: uppercase; color: var(--color-text-secondary); margin-bottom: var(--space-2);">
              📊 Пищевая ценность порции (${item.portionWeight}):
            </h4>
            <div class="kbju-matrix-grid">
              <div class="kbju-metric-item">
                <span class="kbju-label">Калории</span>
                <span class="kbju-value">${kbju.calories}</span>
                <small class="text-muted">${calPercent}% нормы</small>
                <div class="kbju-progress-bar"><div class="kbju-progress-fill kbju-fill-calories" style="width:${calPercent}%"></div></div>
              </div>
              <div class="kbju-metric-item">
                <span class="kbju-label">Белки</span>
                <span class="kbju-value">${kbju.protein}г</span>
                <small class="text-muted">${protPercent}% нормы</small>
                <div class="kbju-progress-bar"><div class="kbju-progress-fill kbju-fill-protein" style="width:${protPercent}%"></div></div>
              </div>
              <div class="kbju-metric-item">
                <span class="kbju-label">Жиры</span>
                <span class="kbju-value">${kbju.fat}г</span>
                <small class="text-muted">${fatPercent}% нормы</small>
                <div class="kbju-progress-bar"><div class="kbju-progress-fill kbju-fill-fat" style="width:${fatPercent}%"></div></div>
              </div>
              <div class="kbju-metric-item">
                <span class="kbju-label">Углеводы</span>
                <span class="kbju-value">${kbju.carbs}г</span>
                <small class="text-muted">${carbPercent}% нормы</small>
                <div class="kbju-progress-bar"><div class="kbju-progress-fill kbju-fill-carbs" style="width:${carbPercent}%"></div></div>
              </div>
            </div>
          </div>

          <!-- Предупреждение об аллергенах -->
          ${allergensList.size > 0 ? `
            <div class="allergens-box">
              <strong>⚠️ Содержит аллергены:</strong> ${Array.from(allergensList).join(', ')}
            </div>
          ` : ''}

          <!-- Состав ингредиентов -->
          <div>
            <h4 style="font-size: var(--font-size-xs); text-transform: uppercase; color: var(--color-text-secondary);">
              🥗 Ингредиенты по техкарте:
            </h4>
            <div class="ingredients-chips-list">
              ${ingredientsList.length > 0 ? ingredientsList.map(name => `
                <span class="ingredient-chip">${name}</span>
              `).join('') : '<span class="text-xs text-muted">Спецификация по рецептуре заведения</span>'}
            </div>
          </div>

          <!-- Нижняя панель с количеством и кнопкой добавления -->
          <div class="dish-order-actions-bar">
            <div class="qty-stepper">
              <button class="qty-btn" id="modal-qty-minus">−</button>
              <span class="qty-number" id="modal-qty-val">1</span>
              <button class="qty-btn" id="modal-qty-plus">+</button>
            </div>
            <button class="btn btn-accent btn-lg" id="modal-add-to-cart-btn" style="flex: 1;">
              Добавить в заказ · <span id="modal-total-price">${item.retailPrice} сом</span>
            </button>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => backdrop.classList.add('open'), 10);

    const qtyValEl = backdrop.querySelector('#modal-qty-val');
    const totalPriceEl = backdrop.querySelector('#modal-total-price');

    backdrop.querySelector('#modal-qty-minus').addEventListener('click', () => {
      if (currentQty > 1) {
        currentQty--;
        qtyValEl.textContent = currentQty;
        totalPriceEl.textContent = `${item.retailPrice * currentQty} сом`;
      }
    });

    backdrop.querySelector('#modal-qty-plus').addEventListener('click', () => {
      currentQty++;
      qtyValEl.textContent = currentQty;
      totalPriceEl.textContent = `${item.retailPrice * currentQty} сом`;
    });

    backdrop.querySelector('#modal-add-to-cart-btn').addEventListener('click', () => {
      CartDrawer.addItem({
        id: item.id,
        name: item.name,
        retailPrice: item.retailPrice,
        photoIcon: item.photoIcon,
        portionWeight: item.portionWeight,
        kbju: kbju
      }, currentQty);

      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);
    });

    backdrop.querySelector('#close-dish-modal').addEventListener('click', () => {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);
    });

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove('open');
        setTimeout(() => backdrop.remove(), 250);
      }
    });
  }
}
