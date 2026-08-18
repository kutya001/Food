/**
 * USER-NUTRITION-MODAL.JS — Модальное окно персонального КБЖУ-дневника и суточных норм
 */

import { db } from '../state/db.js';
import { AuthManager } from '../state/auth.js';

export class UserNutritionModal {
  static open() {
    const user = AuthManager.getActiveUser() || { name: 'Гость платформы' };
    const orders = db.getCollection('orders');

    // Подсчет потребленных нутриентов по заказам пользователя
    let totalCalories = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;
    let itemsCount = 0;

    orders.forEach(order => {
      (order.items || []).forEach(item => {
        const dish = db.getById('menuItems', item.menuItemId || item.id);
        if (dish && dish.kbju) {
          totalCalories += (dish.kbju.calories || 0) * (item.qty || 1);
          totalProtein += (dish.kbju.protein || 0) * (item.qty || 1);
          totalFat += (dish.kbju.fat || 0) * (item.qty || 1);
          totalCarbs += (dish.kbju.carbs || 0) * (item.qty || 1);
          itemsCount += (item.qty || 1);
        }
      });
    });

    totalCalories = Math.round(totalCalories);
    totalProtein = Math.round(totalProtein * 10) / 10;
    totalFat = Math.round(totalFat * 10) / 10;
    totalCarbs = Math.round(totalCarbs * 10) / 10;

    // Рекомендуемые суточные нормы
    const normCalories = 2200;
    const normProtein = 85;
    const normFat = 70;
    const normCarbs = 260;

    const calPercent = Math.min(100, Math.round((totalCalories / normCalories) * 100));
    const protPercent = Math.min(100, Math.round((totalProtein / normProtein) * 100));
    const fatPercent = Math.min(100, Math.round((totalFat / normFat) * 100));
    const carbsPercent = Math.min(100, Math.round((totalCarbs / normCarbs) * 100));

    let backdrop = document.getElementById('user-nutrition-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'user-nutrition-backdrop';
      backdrop.className = 'modal-backdrop';
      document.body.appendChild(backdrop);
    }

    backdrop.innerHTML = `
      <div class="modal-dialog" style="max-width: 650px;" role="dialog">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">🍏 Персональный нутриент-дневник (КБЖУ)</h3>
            <p class="text-xs text-muted">Пользователь: <strong>${user.name}</strong> · Заказов учтено: ${orders.length} шт (${itemsCount} блюд)</p>
          </div>
          <button class="modal-close-btn" id="close-nutrition-modal">✕</button>
        </div>

        <div class="modal-body">
          <div style="background:var(--color-surface-alt); padding:var(--space-4); border-radius:var(--radius-lg); border:1px solid var(--color-border); margin-bottom:var(--space-4); display:flex; justify-content:space-between; align-items:center;">
            <div>
              <span class="text-xs text-muted">Суммарная калорийность рациона:</span>
              <div style="font-size:var(--font-size-3xl); font-weight:var(--font-weight-extrabold); color:var(--color-primary);">
                ${totalCalories} ккал
              </div>
            </div>
            <div style="text-align:right;">
              <span class="badge ${calPercent <= 100 ? 'badge-success' : 'badge-warning'}">
                ${calPercent}% от суточной нормы
              </span>
              <div class="text-xs text-muted" style="margin-top:4px;">Норма: ${normCalories} ккал/день</div>
            </div>
          </div>

          <!-- Сетка 4 нутриентов с прогресс-барами -->
          <div class="nutrition-grid">
            <div class="nutrition-stat-box">
              <span class="text-xs text-muted">⚡ Калории</span>
              <div class="nutrition-value" style="color:var(--color-primary);">${totalCalories}</div>
              <div class="nutrition-progress-track">
                <div class="nutrition-progress-fill" style="width:${calPercent}%; background:var(--color-primary);"></div>
              </div>
              <small class="text-muted" style="font-size:10px;">${calPercent}% от ${normCalories}</small>
            </div>

            <div class="nutrition-stat-box">
              <span class="text-xs text-muted">🥩 Белки</span>
              <div class="nutrition-value" style="color:var(--color-info);">${totalProtein}г</div>
              <div class="nutrition-progress-track">
                <div class="nutrition-progress-fill" style="width:${protPercent}%; background:var(--color-info);"></div>
              </div>
              <small class="text-muted" style="font-size:10px;">${protPercent}% от ${normProtein}г</small>
            </div>

            <div class="nutrition-stat-box">
              <span class="text-xs text-muted">🥑 Жиры</span>
              <div class="nutrition-value" style="color:var(--color-warning);">${totalFat}г</div>
              <div class="nutrition-progress-track">
                <div class="nutrition-progress-fill" style="width:${fatPercent}%; background:var(--color-warning);"></div>
              </div>
              <small class="text-muted" style="font-size:10px;">${fatPercent}% от ${normFat}г</small>
            </div>

            <div class="nutrition-stat-box">
              <span class="text-xs text-muted">🌾 Углеводы</span>
              <div class="nutrition-value" style="color:var(--color-accent);">${totalCarbs}г</div>
              <div class="nutrition-progress-track">
                <div class="nutrition-progress-fill" style="width:${carbsPercent}%; background:var(--color-accent);"></div>
              </div>
              <small class="text-muted" style="font-size:10px;">${carbsPercent}% от ${normCarbs}г</small>
            </div>
          </div>

          <div class="alert alert-info" style="font-size:var(--font-size-xs);">
            💡 <strong>Совет нутрициолога:</strong> Данные рассчитываются автоматически на основе технологических карт блюд в ваших заказах.
          </div>

          <div style="margin-top:var(--space-4); display:flex; justify-content:flex-end;">
            <button class="btn btn-primary" id="ok-nutrition-modal-btn">
              Понятно
            </button>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => backdrop.classList.add('open'), 10);

    backdrop.querySelector('#close-nutrition-modal').addEventListener('click', () => {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);
    });

    backdrop.querySelector('#ok-nutrition-modal-btn').addEventListener('click', () => {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);
    });
  }
}
