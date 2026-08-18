/**
 * BUSINESS-MENU-VIEW.JS — Управление меню заведения, ценами (B2C/B2B) и стоп-листом
 */

import { db } from '../state/db.js';
import { AuthManager } from '../state/auth.js';
import { showToast } from '../components/toast.js';

export class BusinessMenuView {
  static render(container) {
    const est = AuthManager.getActiveEstablishment() || { id: 'est_1', name: 'Столовая «Свежесть»' };
    const menuItems = db.query('menuItems', m => m.estId === est.id);
    const techCards = db.query('techCards', tc => tc.estId === est.id && !tc.isSemiFinished);

    container.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-3); margin-bottom: var(--space-4);">
          <div>
            <h3 style="margin:0; font-size:var(--font-size-lg);">🍽️ Прейскурант и Стоп-лист</h3>
            <p class="text-xs text-muted">Изменения розничных цен и стоп-листа мгновенно отображаются на онлайн-витрине и кассе</p>
          </div>

          <button class="btn btn-primary" id="btn-add-menu-item">
            ➕ Добавить блюдо из техкарты
          </button>
        </div>

        <div class="warehouse-table-container">
          <table class="table" style="margin:0;">
            <thead>
              <tr>
                <th>Иконка</th>
                <th>Наименование блюда</th>
                <th>Категория</th>
                <th>Себестоимость</th>
                <th>Розничная цена (B2C)</th>
                <th>Корп. цена (B2B)</th>
                <th style="text-align:center;">Стоп-лист</th>
                <th style="text-align:center;">Действие</th>
              </tr>
            </thead>
            <tbody id="menu-table-body">
              ${menuItems.map(item => {
                const tc = db.getById('techCards', item.techCardId);
                const costPrice = tc?.costPrice || 100;

                return `
                  <tr data-item-id="${item.id}">
                    <td style="font-size: 1.6rem; text-align:center; width:48px;">${item.photoIcon || '🍲'}</td>
                    <td>
                      <strong>${item.name}</strong>
                      <div class="text-xs text-muted">Порция: ${item.portionWeight || '350 г'}</div>
                    </td>
                    <td>${item.category}</td>
                    <td><strong style="color:var(--color-text-secondary);">${costPrice} сом</strong></td>
                    <td>
                      <div style="display:flex; align-items:center; gap:4px;">
                        <input type="number" step="5" min="10" class="input btn-sm menu-retail-input" data-id="${item.id}" value="${item.retailPrice}" style="width:90px;">
                        <span class="text-xs text-muted">сом</span>
                      </div>
                    </td>
                    <td>
                      <div style="display:flex; align-items:center; gap:4px;">
                        <input type="number" step="5" min="10" class="input btn-sm menu-corp-input" data-id="${item.id}" value="${item.corpPrice || item.retailPrice}" style="width:90px;">
                        <span class="text-xs text-muted">сом</span>
                      </div>
                    </td>
                    <td style="text-align:center;">
                      <label class="switch-label">
                        <input type="checkbox" class="stoplist-checkbox" data-id="${item.id}" ${item.inStopList ? 'checked' : ''}>
                        <span class="switch-slider"></span>
                      </label>
                      <div class="text-xs" style="font-size:10px; color:${item.inStopList ? 'var(--color-error)' : 'var(--color-success)'};">
                        ${item.inStopList ? 'В стопе' : 'Активно'}
                      </div>
                    </td>
                    <td style="text-align:center;">
                      <button class="btn btn-secondary btn-sm btn-save-menu-item" data-id="${item.id}">
                        💾 Сохранить
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.bindEvents(container);
  }

  static bindEvents(container) {
    // Сохранение цен
    container.querySelectorAll('.btn-save-menu-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const row = container.querySelector(`tr[data-item-id="${id}"]`);
        const retailPrice = parseFloat(row.querySelector('.menu-retail-input').value) || 100;
        const corpPrice = parseFloat(row.querySelector('.menu-corp-input').value) || retailPrice;

        db.update('menuItems', id, { retailPrice, corpPrice });
        showToast('Цены блюда обновлены!', 'success');
      });
    });

    // Переключение стоп-листа
    container.querySelectorAll('.stoplist-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = cb.dataset.id;
        const inStop = e.target.checked;
        db.update('menuItems', id, { inStopList: inStop });
        showToast(inStop ? 'Блюдо переведено в СТОП-ЛИСТ' : 'Блюдо возвращено в активное меню', inStop ? 'warning' : 'success');
        this.render(container);
      });
    });

    // Добавить блюдо из техкарты
    container.querySelector('#btn-add-menu-item').addEventListener('click', () => {
      showToast('Выберите утвержденную техкарту во вкладке «Технологические карты»', 'info');
    });
  }
}
