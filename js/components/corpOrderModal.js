/**
 * CORP-ORDER-MODAL.JS — Конструктор и редактор корпоративной заявки на питание сотрудников
 */

import { db } from '../state/db.js';
import { AuthManager } from '../state/auth.js';
import { showToast } from './toast.js';

export class CorpOrderModal {
  static open(onSuccess = null, editRequestId = null) {
    const org = AuthManager.getActiveOrganization() || { id: 'org_1', name: 'ОсОО «Alfa Tech»', budgetMonthly: 120000, currentBalance: 84500 };
    const establishments = db.getCollection('establishments');

    let existingReq = editRequestId ? db.getById('corpRequests', editRequestId) : null;

    let backdrop = document.getElementById('corp-order-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'corp-order-backdrop';
      backdrop.className = 'modal-backdrop';
      document.body.appendChild(backdrop);
    }

    let selectedEstId = existingReq?.estId || establishments[0]?.id || 'est_1';
    let availableDishes = db.query('menuItems', m => m.estId === selectedEstId && !m.inStopList);

    let rows = existingReq && existingReq.items && existingReq.items.length > 0
      ? existingReq.items.map(i => ({ menuItemId: i.menuItemId || availableDishes[0]?.id, qty: i.qty || 10, department: i.department || 'IT отдел' }))
      : [{ menuItemId: availableDishes[0]?.id || '', qty: 15, department: 'IT отдел' }];

    backdrop.innerHTML = `
      <div class="modal-dialog" style="max-width: 740px;" role="dialog">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">${existingReq ? '✏️ Редактирование заявки #' + existingReq.id.slice(-4) : '🏢 Формирование корпоративной заявки'}</h3>
            <p class="text-xs text-muted">${org.name} · Доступный лимит: <strong>${org.currentBalance} сом</strong></p>
          </div>
          <button class="modal-close-btn" id="close-corp-order-modal">✕</button>
        </div>

        <form id="corp-order-form" class="modal-body">
          <div class="grid grid-cols-3" style="gap: var(--space-3);">
            <div class="form-group">
              <label class="form-label">Заведение-партнёр:</label>
              <select class="select" id="corp-est-select" ${existingReq ? 'disabled' : ''}>
                ${establishments.map(e => `
                  <option value="${e.id}" ${e.id === selectedEstId ? 'selected' : ''}>${e.name}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Дата питания:</label>
              <input type="date" class="input" id="corp-order-date" value="${existingReq?.date || new Date().toISOString().split('T')[0]}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Время доставки обеда:</label>
              <select class="select" id="corp-order-time">
                <option value="12:30" ${existingReq?.timeSlot === '12:30' ? 'selected' : ''}>⏰ 12:30 (1-я смена)</option>
                <option value="13:30" ${existingReq?.timeSlot === '13:30' ? 'selected' : ''}>⏰ 13:30 (2-я смена)</option>
                <option value="18:30" ${existingReq?.timeSlot === '18:30' ? 'selected' : ''}>⏰ 18:30 (Ужин)</option>
              </select>
            </div>
          </div>

          <!-- Таблица позиций по отделам -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:var(--space-4);">
            <h4 style="margin:0; font-size:var(--font-size-sm);">🥗 Состав корпоративного заказа:</h4>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-add-corp-row">
              ➕ Добавить позицию
            </button>
          </div>

          <table class="recipe-builder-table">
            <thead>
              <tr>
                <th style="width: 45%;">Блюдо (корпоративная спеццена)</th>
                <th style="width: 25%;">Отдел компании</th>
                <th style="width: 15%;">Порций</th>
                <th style="width: 15%; text-align:right;">Сумма</th>
              </tr>
            </thead>
            <tbody id="corp-rows-tbody">
              <!-- Рендер строк -->
            </tbody>
          </table>

          <!-- Итоговый расчет и проверка бюджета -->
          <div style="background:var(--color-surface-alt); padding:var(--space-4); border-radius:var(--radius-lg); border:1px solid var(--color-border); margin-top:var(--space-4); display:flex; justify-content:space-between; align-items:center;">
            <div>
              <span class="text-xs text-muted">Сумма заявки:</span>
              <div style="font-size:var(--font-size-2xl); font-weight:var(--font-weight-extrabold); color:var(--color-primary);" id="corp-total-sum-label">
                0 сом
              </div>
            </div>
            <div style="text-align:right;">
              <span class="text-xs text-muted">Остаток лимита после заказа:</span>
              <div style="font-size:var(--font-size-lg); font-weight:var(--font-weight-bold); color:var(--color-success);" id="corp-remaining-budget-label">
                ${org.currentBalance} сом
              </div>
            </div>
          </div>

          <div style="margin-top:var(--space-6); display:flex; justify-content:flex-end; gap:var(--space-2);">
            <button type="button" class="btn btn-secondary" id="cancel-corp-order-btn">Отмена</button>
            <button type="submit" class="btn btn-primary btn-lg">
              ${existingReq ? '💾 Сохранить изменения →' : '🚀 Отправить заявку в общепит →'}
            </button>
          </div>
        </form>
      </div>
    `;

    setTimeout(() => backdrop.classList.add('open'), 10);

    const estSelect = backdrop.querySelector('#corp-est-select');
    const tbody = backdrop.querySelector('#corp-rows-tbody');
    const totalSumLabel = backdrop.querySelector('#corp-total-sum-label');
    const remBudgetLabel = backdrop.querySelector('#corp-remaining-budget-label');

    const renderRows = () => {
      let totalSum = 0;

      tbody.innerHTML = rows.map((row, idx) => {
        const dish = db.getById('menuItems', row.menuItemId) || availableDishes[0];
        const price = dish ? (dish.corpPrice || dish.retailPrice) : 150;
        const rowSum = price * row.qty;
        totalSum += rowSum;

        return `
          <tr data-row-idx="${idx}">
            <td>
              <select class="select btn-sm row-dish-select" data-idx="${idx}">
                ${availableDishes.map(d => `
                  <option value="${d.id}" ${d.id === row.menuItemId ? 'selected' : ''}>
                    ${d.photoIcon || '🍲'} ${d.name} (${d.corpPrice || d.retailPrice} сом)
                  </option>
                `).join('')}
              </select>
            </td>
            <td>
              <input type="text" class="input btn-sm row-dept-input" data-idx="${idx}" value="${row.department}" placeholder="IT, Бухгалтерия...">
            </td>
            <td>
              <input type="number" min="1" step="1" class="input btn-sm row-qty-input" data-idx="${idx}" value="${row.qty}" style="width:70px;">
            </td>
            <td style="text-align:right;">
              <strong>${rowSum} сом</strong>
            </td>
          </tr>
        `;
      }).join('');

      totalSumLabel.textContent = `${totalSum} сом`;
      const baseBalance = existingReq ? (org.currentBalance + (existingReq.totalSum || 0)) : org.currentBalance;
      const rem = baseBalance - totalSum;
      remBudgetLabel.textContent = `${rem} сом`;
      remBudgetLabel.style.color = rem < 0 ? 'var(--color-error)' : 'var(--color-success)';

      tbody.querySelectorAll('.row-dish-select').forEach(sel => {
        sel.addEventListener('change', (e) => {
          const idx = parseInt(e.target.dataset.idx);
          rows[idx].menuItemId = e.target.value;
          renderRows();
        });
      });

      tbody.querySelectorAll('.row-dept-input').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const idx = parseInt(e.target.dataset.idx);
          rows[idx].department = e.target.value;
        });
      });

      tbody.querySelectorAll('.row-qty-input').forEach(inp => {
        inp.addEventListener('input', (e) => {
          const idx = parseInt(e.target.dataset.idx);
          rows[idx].qty = parseInt(e.target.value) || 1;
          renderRows();
        });
      });
    };

    if (!existingReq) {
      estSelect.addEventListener('change', (e) => {
        selectedEstId = e.target.value;
        availableDishes = db.query('menuItems', m => m.estId === selectedEstId && !m.inStopList);
        rows = [{ menuItemId: availableDishes[0]?.id || '', qty: 10, department: 'IT отдел' }];
        renderRows();
      });
    }

    backdrop.querySelector('#btn-add-corp-row').addEventListener('click', () => {
      rows.push({ menuItemId: availableDishes[0]?.id || '', qty: 5, department: 'Бухгалтерия' });
      renderRows();
    });

    renderRows();

    // Отправка / сохранение заявки
    backdrop.querySelector('#corp-order-form').addEventListener('submit', (e) => {
      e.preventDefault();

      let calcTotal = 0;
      const orderItems = rows.map(r => {
        const dish = db.getById('menuItems', r.menuItemId) || availableDishes[0];
        const price = dish ? (dish.corpPrice || dish.retailPrice) : 150;
        const total = price * r.qty;
        calcTotal += total;

        return {
          menuItemId: dish.id,
          name: dish.name,
          department: r.department,
          qty: r.qty,
          price: price,
          total: total
        };
      });

      const baseBalance = existingReq ? (org.currentBalance + (existingReq.totalSum || 0)) : org.currentBalance;

      if (calcTotal > baseBalance) {
        showToast('Ошибка: сумма заявки превышает доступный лимит компании!', 'error');
        return;
      }

      if (existingReq) {
        // Обновление существующей заявки
        const diff = calcTotal - (existingReq.totalSum || 0);
        db.update('corpRequests', existingReq.id, {
          date: backdrop.querySelector('#corp-order-date').value,
          timeSlot: backdrop.querySelector('#corp-order-time').value,
          items: orderItems,
          totalSum: calcTotal
        });

        // Корректируем баланс
        db.update('organizations', org.id, { currentBalance: org.currentBalance - diff });
        showToast(`Заявка #${existingReq.id.slice(-4)} успешно отредактирована!`, 'success');
      } else {
        // Создание новой заявки
        const newReq = db.insert('corpRequests', {
          orgId: org.id,
          estId: selectedEstId,
          date: backdrop.querySelector('#corp-order-date').value,
          timeSlot: backdrop.querySelector('#corp-order-time').value,
          items: orderItems,
          totalSum: calcTotal,
          status: 'new'
        });

        // Списываем баланс
        db.update('organizations', org.id, { currentBalance: org.currentBalance - calcTotal });
        showToast(`Корпоративная заявка #${newReq.id.slice(-4)} на ${calcTotal} сом успешно создана!`, 'success');
      }

      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);

      if (onSuccess) onSuccess();
    });

    backdrop.querySelector('#close-corp-order-modal').addEventListener('click', () => {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);
    });

    backdrop.querySelector('#cancel-corp-order-btn').addEventListener('click', () => {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);
    });
  }
}
