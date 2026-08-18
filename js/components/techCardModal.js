/**
 * TECH-CARD-MODAL.JS — Интерактивный конструктор технологических карт с полуфабрикатами
 */

import { db } from '../state/db.js';
import { AuthManager } from '../state/auth.js';
import { CalculationService } from '../services/calculationService.js';
import { showToast } from './toast.js';

export class TechCardModal {
  static open(techCardId = null, onSuccess = null) {
    const est = AuthManager.getActiveEstablishment() || { id: 'est_1', name: 'Столовая «Свежесть»' };
    const allIngredients = db.query('ingredients', i => i.estId === est.id);
    const existingSemiFinished = db.query('techCards', tc => tc.estId === est.id && tc.isSemiFinished && tc.id !== techCardId);

    const existingCard = techCardId ? db.getById('techCards', techCardId) : null;

    let backdrop = document.getElementById('tech-card-modal-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'tech-card-modal-backdrop';
      backdrop.className = 'modal-backdrop';
      document.body.appendChild(backdrop);
    }

    // Состояние строк рецептуры
    let rows = existingCard?.items ? JSON.parse(JSON.stringify(existingCard.items)) : [
      { ingredientId: allIngredients[0]?.id || '', grossWeight: 150, wastePercent: 10, netWeight: 135 }
    ];

    backdrop.innerHTML = `
      <div class="modal-dialog" style="max-width: 780px;" role="dialog">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">${existingCard ? '✏️ Редактирование техкарты' : '✨ Конструктор новой техкарты'}</h3>
            <p class="text-xs text-muted">${est.name} · Авторасчёт себестоимости в сомах и КБЖУ</p>
          </div>
          <button class="modal-close-btn" id="close-techcard-modal">✕</button>
        </div>

        <form id="techcard-form" class="modal-body">
          <div class="grid grid-cols-3" style="gap: var(--space-3);">
            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label">Наименование блюда / полуфабриката:</label>
              <input type="text" class="input" id="tc-name" placeholder="Например: Плов Ташкентский особый" value="${existingCard?.name || ''}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Тип рецептуры:</label>
              <select class="select" id="tc-type">
                <option value="dish" ${!existingCard?.isSemiFinished ? 'selected' : ''}>🍽️ Готовое блюдо</option>
                <option value="semi_finished" ${existingCard?.isSemiFinished ? 'selected' : ''}>🥣 Полуфабрикат</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2" style="gap: var(--space-3);">
            <div class="form-group">
              <label class="form-label">Категория:</label>
              <input type="text" class="input" id="tc-category" placeholder="Вторые блюда, Супы, Соусы..." value="${existingCard?.category || 'Вторые блюда'}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Вес готовой порции / выхода (грамм):</label>
              <input type="number" min="10" step="5" class="input" id="tc-output-weight" value="${existingCard?.outputWeight || 350}" required>
            </div>
          </div>

          <!-- Таблица сырья и полуфабрикатов -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:var(--space-4);">
            <h4 style="margin:0; font-size:var(--font-size-sm);">🥗 Сырьевой набор рецептуры:</h4>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-add-ingredient-row">
              ➕ Добавить сырье / полуфабрикат
            </button>
          </div>

          <table class="recipe-builder-table">
            <thead>
              <tr>
                <th style="width: 40%;">Компонент (сырье / полуфабрикат)</th>
                <th style="width: 18%;">Брутто (г)</th>
                <th style="width: 14%;">Отход %</th>
                <th style="width: 18%;">Нетто (г)</th>
                <th style="width: 10%; text-align:center;">Удал.</th>
              </tr>
            </thead>
            <tbody id="recipe-rows-tbody">
              <!-- Строки рендерятся динамически -->
            </tbody>
          </table>

          <!-- Интерактивная плашка расчетов себестоимости и КБЖУ -->
          <div class="kbju-matrix-card" id="tc-calc-preview-card" style="margin-top:var(--space-4);">
            <!-- Динамический расчет -->
          </div>

          <div style="margin-top:var(--space-4); display:flex; justify-content:flex-end; gap:var(--space-2);">
            <button type="button" class="btn btn-secondary" id="cancel-techcard-btn">Отмена</button>
            <button type="submit" class="btn btn-primary">💾 Сохранить техкарту</button>
          </div>
        </form>
      </div>
    `;

    setTimeout(() => backdrop.classList.add('open'), 10);

    const tbody = backdrop.querySelector('#recipe-rows-tbody');
    const calcCard = backdrop.querySelector('#tc-calc-preview-card');
    const outputWeightInput = backdrop.querySelector('#tc-output-weight');

    const renderRowsAndCalc = () => {
      tbody.innerHTML = rows.map((row, idx) => `
        <tr data-row-index="${idx}">
          <td>
            <select class="select btn-sm row-item-select" data-index="${idx}" style="font-size:11px;">
              <optgroup label="📦 Сырье со склада">
                ${allIngredients.map(ing => `
                  <option value="ing_${ing.id}" ${row.ingredientId === ing.id ? 'selected' : ''}>
                    ${ing.name} (${ing.purchasePrice} сом/${ing.unit})
                  </option>
                `).join('')}
              </optgroup>
              ${existingSemiFinished.length > 0 ? `
                <optgroup label="🥣 Готовые полуфабрикаты">
                  ${existingSemiFinished.map(sf => `
                    <option value="sf_${sf.id}" ${row.semiFinishedCardId === sf.id ? 'selected' : ''}>
                      [П/Ф] ${sf.name}
                    </option>
                  `).join('')}
                </optgroup>
              ` : ''}
            </select>
          </td>
          <td>
            <input type="number" step="1" min="1" class="input btn-sm row-gross-input" data-index="${idx}" value="${row.grossWeight}" style="width:100%;">
          </td>
          <td>
            <input type="number" step="1" min="0" max="90" class="input btn-sm row-waste-input" data-index="${idx}" value="${row.wastePercent || 0}" style="width:100%;">
          </td>
          <td>
            <strong class="row-net-label" id="net-label-${idx}">${row.netWeight} г</strong>
          </td>
          <td style="text-align:center;">
            <button type="button" class="btn btn-ghost btn-sm btn-delete-row" data-index="${idx}" style="color:var(--color-error); padding:2px 6px;">✕</button>
          </td>
        </tr>
      `).join('');

      // Пересчёт
      const dummyCard = {
        outputWeight: parseFloat(outputWeightInput.value) || 350,
        items: rows
      };
      const calc = CalculationService.calculateTechCard(dummyCard);
      const recRetail = CalculationService.getRecommendedRetailPrice(calc.costPrice, 30);

      calcCard.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid var(--color-border); padding-bottom:6px;">
          <div>
            <span class="text-xs text-muted">Себестоимость порции:</span>
            <div style="font-size:var(--font-size-xl); font-weight:var(--font-weight-extrabold); color:var(--color-primary);">
              ${calc.costPrice} сом
            </div>
          </div>
          <div style="text-align:right;">
            <span class="text-xs text-muted">Реком. цена (фудкост 30%):</span>
            <div style="font-size:var(--font-size-lg); font-weight:var(--font-weight-bold); color:var(--color-success);">
              ${recRetail} сом
            </div>
          </div>
        </div>

        <div class="kbju-matrix-grid">
          <div class="kbju-metric-item">
            <span class="kbju-label">Калории</span>
            <span class="kbju-value">${calc.kbju.calories}</span>
          </div>
          <div class="kbju-metric-item">
            <span class="kbju-label">Белки</span>
            <span class="kbju-value">${calc.kbju.protein}г</span>
          </div>
          <div class="kbju-metric-item">
            <span class="kbju-label">Жиры</span>
            <span class="kbju-value">${calc.kbju.fat}г</span>
          </div>
          <div class="kbju-metric-item">
            <span class="kbju-label">Углеводы</span>
            <span class="kbju-value">${calc.kbju.carbs}г</span>
          </div>
        </div>
      `;

      // Слушатели инпутов таблицы
      tbody.querySelectorAll('.row-item-select').forEach(sel => {
        sel.addEventListener('change', (e) => {
          const idx = parseInt(e.target.dataset.index);
          const val = e.target.value;
          if (val.startsWith('ing_')) {
            rows[idx].ingredientId = val.replace('ing_', '');
            delete rows[idx].semiFinishedCardId;
          } else if (val.startsWith('sf_')) {
            rows[idx].semiFinishedCardId = val.replace('sf_', '');
            delete rows[idx].ingredientId;
          }
          renderRowsAndCalc();
        });
      });

      tbody.querySelectorAll('.row-gross-input').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const idx = parseInt(e.target.dataset.index);
          const g = parseFloat(e.target.value) || 0;
          rows[idx].grossWeight = g;
          const waste = rows[idx].wastePercent || 0;
          rows[idx].netWeight = Math.round(g * (1 - waste / 100));
          renderRowsAndCalc();
        });
      });

      tbody.querySelectorAll('.row-waste-input').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const idx = parseInt(e.target.dataset.index);
          const waste = parseFloat(e.target.value) || 0;
          rows[idx].wastePercent = waste;
          const g = rows[idx].grossWeight || 0;
          rows[idx].netWeight = Math.round(g * (1 - waste / 100));
          renderRowsAndCalc();
        });
      });

      tbody.querySelectorAll('.btn-delete-row').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(btn.dataset.index);
          if (rows.length > 1) {
            rows.splice(idx, 1);
            renderRowsAndCalc();
          } else {
            showToast('В техкарте должен оставаться хотя бы 1 компонент', 'info');
          }
        });
      });
    };

    backdrop.querySelector('#btn-add-ingredient-row').addEventListener('click', () => {
      rows.push({
        ingredientId: allIngredients[0]?.id || '',
        grossWeight: 100,
        wastePercent: 0,
        netWeight: 100
      });
      renderRowsAndCalc();
    });

    outputWeightInput.addEventListener('input', renderRowsAndCalc);

    renderRowsAndCalc();

    backdrop.querySelector('#techcard-form').addEventListener('submit', (e) => {
      e.preventDefault();

      const name = backdrop.querySelector('#tc-name').value;
      const isSemiFinished = backdrop.querySelector('#tc-type').value === 'semi_finished';
      const category = backdrop.querySelector('#tc-category').value;
      const outputWeight = parseFloat(outputWeightInput.value) || 350;

      const calc = CalculationService.calculateTechCard({ outputWeight, items: rows });

      const cardPayload = {
        estId: est.id,
        name: name,
        category: category,
        isSemiFinished: isSemiFinished,
        outputWeight: outputWeight,
        items: rows,
        costPrice: calc.costPrice,
        calculatedKbju: calc.kbju,
        calculatedKbjuPer100g: calc.kbjuPer100g,
        status: 'approved'
      };

      if (existingCard) {
        db.update('techCards', existingCard.id, cardPayload);
        showToast(`Техкарта «${name}» обновлена (${calc.costPrice} сом)`, 'success');
      } else {
        db.insert('techCards', cardPayload);
        showToast(`Техкарта «${name}» успешно создана (${calc.costPrice} сом)`, 'success');
      }

      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);

      if (onSuccess) onSuccess();
    });

    backdrop.querySelector('#close-techcard-modal').addEventListener('click', () => {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);
    });

    backdrop.querySelector('#cancel-techcard-btn').addEventListener('click', () => {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);
    });
  }
}
