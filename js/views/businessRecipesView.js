/**
 * BUSINESS-RECIPES-VIEW.JS — Реестр технологических карт, калькуляция и полуфабрикаты
 */

import { db } from '../state/db.js';
import { AuthManager } from '../state/auth.js';
import { CalculationService } from '../services/calculationService.js';
import { TechCardModal } from '../components/techCardModal.js';

export class BusinessRecipesView {
  static filterType = 'all'; // 'all' | 'dishes' | 'semi'
  static searchQuery = '';

  static render(container) {
    const est = AuthManager.getActiveEstablishment() || { id: 'est_1', name: 'Столовая «Свежесть»' };
    const allCards = db.query('techCards', tc => tc.estId === est.id);

    container.innerHTML = `
      <div>
        <!-- Панель действий -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-3); margin-bottom: var(--space-4);">
          <div style="display: flex; gap: var(--space-2); flex: 1; max-width: 480px;">
            <input type="text" class="input" id="tc-search-input" placeholder="🔍 Поиск по рецептурам и полуфабрикатам..." value="${this.searchQuery}">
          </div>

          <button class="btn btn-accent" id="btn-create-techcard">
            ✨ Создать новую техкарту
          </button>
        </div>

        <!-- Переключатель типа техкарт -->
        <div class="category-chips" style="margin-bottom: var(--space-4);">
          <button class="category-chip ${this.filterType === 'all' ? 'active' : ''}" data-type="all">
            📋 Все рецептуры (${allCards.length})
          </button>
          <button class="category-chip ${this.filterType === 'dishes' ? 'active' : ''}" data-type="dishes">
            🍽️ Готовые блюда (${allCards.filter(c => !c.isSemiFinished).length})
          </button>
          <button class="category-chip ${this.filterType === 'semi' ? 'active' : ''}" data-type="semi">
            🥣 Полуфабрикаты (${allCards.filter(c => c.isSemiFinished).length})
          </button>
        </div>

        <!-- Сетка карточек техкарт -->
        <div class="grid grid-cols-2" id="techcards-grid">
          <!-- Карточки рендерятся динамически -->
        </div>
      </div>
    `;

    this.bindEvents(container);
    this.renderCards(container);
  }

  static renderCards(container) {
    const grid = container.querySelector('#techcards-grid');
    if (!grid) return;

    const est = AuthManager.getActiveEstablishment() || { id: 'est_1' };
    let list = db.query('techCards', tc => tc.estId === est.id);

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(tc => tc.name.toLowerCase().includes(q) || tc.category.toLowerCase().includes(q));
    }

    if (this.filterType === 'dishes') {
      list = list.filter(tc => !tc.isSemiFinished);
    } else if (this.filterType === 'semi') {
      list = list.filter(tc => tc.isSemiFinished);
    }

    if (list.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: var(--space-8); color: var(--color-text-secondary); background: var(--color-surface); border-radius: var(--radius-lg); border: 1px dashed var(--color-border);">
          Рецептуры не найдены. Создайте первую техкарту!
        </div>
      `;
      return;
    }

    const menuItems = db.getCollection('menuItems');

    grid.innerHTML = list.map(tc => {
      const calc = CalculationService.calculateTechCard(tc);
      const linkedDish = menuItems.find(m => m.techCardId === tc.id);
      const retailPrice = linkedDish ? linkedDish.retailPrice : CalculationService.getRecommendedRetailPrice(calc.costPrice, 30);
      const foodCostPercent = CalculationService.calculateFoodCostPercent(calc.costPrice, retailPrice);

      let fcBadgeClass = 'badge-foodcost-good';
      if (foodCostPercent > 35) fcBadgeClass = 'badge-foodcost-danger';
      else if (foodCostPercent > 28) fcBadgeClass = 'badge-foodcost-warning';

      return `
        <div class="card" style="display:flex; flex-direction:column;">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <div style="display:flex; gap:6px; margin-bottom:4px;">
                <span class="badge ${tc.isSemiFinished ? 'badge-secondary' : 'badge-primary'}">
                  ${tc.isSemiFinished ? '🥣 Полуфабрикат' : '🍽️ Готовое блюдо'}
                </span>
                <span class="badge badge-secondary">${tc.category}</span>
              </div>
              <h3 style="font-size:var(--font-size-md); margin:0;">${tc.name}</h3>
            </div>
            <button class="btn btn-secondary btn-sm btn-edit-tc" data-tc-id="${tc.id}">
              ✏️ Изменить
            </button>
          </div>

          <!-- Сводка себестоимости и фудкоста -->
          <div style="background:var(--color-surface-alt); padding:var(--space-3); border-radius:var(--radius-md); border:1px solid var(--color-border); margin-bottom:var(--space-3); display:flex; justify-content:space-between; align-items:center;">
            <div>
              <span class="text-xs text-muted">Себестоимость порции:</span>
              <div style="font-size:var(--font-size-lg); font-weight:var(--font-weight-extrabold); color:var(--color-primary);">
                ${calc.costPrice} сом
              </div>
            </div>
            <div style="text-align:right;">
              <span class="text-xs text-muted">Food Cost %:</span>
              <div>
                <span class="badge ${fcBadgeClass}" style="font-weight:var(--font-weight-extrabold);">
                  ${foodCostPercent}%
                </span>
              </div>
            </div>
          </div>

          <!-- Состав сырья -->
          <div style="margin-bottom:var(--space-3); flex:1;">
            <div class="text-xs text-muted" style="margin-bottom:4px;">Компоненты рецептуры (${tc.items?.length || 0}):</div>
            <div style="display:flex; flex-wrap:wrap; gap:4px;">
              ${(tc.items || []).map(item => {
                let name = 'Компонент';
                if (item.ingredientId) {
                  const ing = db.getById('ingredients', item.ingredientId);
                  name = ing ? ing.name : name;
                } else if (item.semiFinishedCardId) {
                  const sf = db.getById('techCards', item.semiFinishedCardId);
                  name = sf ? `[П/Ф] ${sf.name}` : name;
                }
                return `<span class="ingredient-chip text-xs">${name} (${item.grossWeight}г)</span>`;
              }).join('')}
            </div>
          </div>

          <!-- Пищевая ценность -->
          <div style="border-top:1px solid var(--color-border); padding-top:var(--space-2); display:flex; justify-content:space-between; font-size:var(--font-size-xs); color:var(--color-text-secondary);">
            <span>Выход: <strong>${tc.outputWeight || 350}г</strong></span>
            <span>КБЖУ: <strong>${calc.kbju.calories} ккал</strong> (Б:${calc.kbju.protein}г · Ж:${calc.kbju.fat}г · У:${calc.kbju.carbs}г)</span>
          </div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.btn-edit-tc').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.tcId;
        TechCardModal.open(id, () => this.render(container));
      });
    });
  }

  static bindEvents(container) {
    const searchInput = container.querySelector('#tc-search-input');
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.renderCards(container);
    });

    container.querySelectorAll('.category-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.filterType = chip.dataset.type;
        container.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.renderCards(container);
      });
    });

    container.querySelector('#btn-create-techcard').addEventListener('click', () => {
      TechCardModal.open(null, () => this.render(container));
    });
  }
}
