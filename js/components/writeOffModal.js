/**
 * WRITE-OFF-MODAL.JS — Оформление акта списания сырья со склада
 */

import { db } from '../state/db.js';
import { AuthManager } from '../state/auth.js';
import { showToast } from './toast.js';

export class WriteOffModal {
  static open(onSuccess = null) {
    const est = AuthManager.getActiveEstablishment() || { id: 'est_1', name: 'Столовая «Свежесть»' };
    const ingredients = db.query('ingredients', i => i.estId === est.id && i.currentStock > 0);

    let backdrop = document.getElementById('writeoff-modal-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'writeoff-modal-backdrop';
      backdrop.className = 'modal-backdrop';
      document.body.appendChild(backdrop);
    }

    backdrop.innerHTML = `
      <div class="modal-dialog" style="max-width: 540px;" role="dialog">
        <div class="modal-header">
          <div>
            <h3 class="modal-title" style="color:var(--color-error);">🗑️ Акт списания сырья со склада</h3>
            <p class="text-xs text-muted">${est.name} · Фиксация потерь и списание</p>
          </div>
          <button class="modal-close-btn" id="close-writeoff-modal">✕</button>
        </div>

        <form id="writeoff-form" class="modal-body">
          <div class="form-group">
            <label class="form-label">Выберите сырье для списания:</label>
            <select class="select" id="writeoff-ingredient-select" required>
              <option value="" disabled selected>-- Выберите сырье --</option>
              ${ingredients.map(ing => `
                <option value="${ing.id}" data-stock="${ing.currentStock}" data-unit="${ing.unit}" data-price="${ing.purchasePrice}">
                  ${ing.name} (в наличии: ${ing.currentStock} ${ing.unit} · ${ing.purchasePrice} сом/${ing.unit})
                </option>
              `).join('')}
            </select>
          </div>

          <div class="grid grid-cols-2" style="gap: var(--space-3);">
            <div class="form-group">
              <label class="form-label">Количество списания:</label>
              <div style="display:flex; align-items:center; gap:6px;">
                <input type="number" step="0.1" min="0.1" class="input" id="writeoff-qty" placeholder="1.0" required>
                <span class="badge badge-secondary" id="writeoff-unit-label" style="min-width:40px; text-align:center;">кг</span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Причина списания:</label>
              <select class="select" id="writeoff-reason" required>
                <option value="spoilage">⚠️ Порча / Брак</option>
                <option value="expired">⌛ Истёк срок годности</option>
                <option value="storage_fault">❄️ Нарушение условий хранения</option>
                <option value="staff_meal">🍲 Служебное питание поваров</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Комментарий / Ответственное лицо:</label>
            <input type="text" class="input" id="writeoff-comment" placeholder="Шеф-повар, завскладом..." value="Шеф-повар Асанов Б.">
          </div>

          <!-- Сумма ущерба / списания -->
          <div style="background:var(--color-error-bg); padding:var(--space-3); border-radius:var(--radius-md); border:1px solid var(--color-error); display:flex; justify-content:space-between; align-items:center; margin-top:var(--space-3);">
            <span style="font-weight:var(--font-weight-bold); font-size:var(--font-size-sm); color:var(--color-error);">Сумма списания (убыток):</span>
            <strong style="font-size:var(--font-size-xl); color:var(--color-error);" id="writeoff-total-loss">0 сом</strong>
          </div>

          <div style="margin-top:var(--space-4); display:flex; justify-content:flex-end; gap:var(--space-2);">
            <button type="button" class="btn btn-secondary" id="cancel-writeoff-btn">Отмена</button>
            <button type="submit" class="btn btn-error">Подтвердить списание →</button>
          </div>
        </form>
      </div>
    `;

    setTimeout(() => backdrop.classList.add('open'), 10);

    const ingSelect = backdrop.querySelector('#writeoff-ingredient-select');
    const unitLabel = backdrop.querySelector('#writeoff-unit-label');
    const qtyInput = backdrop.querySelector('#writeoff-qty');
    const totalLossEl = backdrop.querySelector('#writeoff-total-loss');

    const updateCalculatedLoss = () => {
      const selected = ingSelect.selectedOptions[0];
      const price = selected ? parseFloat(selected.dataset.price) : 0;
      const q = parseFloat(qtyInput.value) || 0;
      totalLossEl.textContent = `${Math.round(q * price)} сом`;
    };

    ingSelect.addEventListener('change', () => {
      const selected = ingSelect.selectedOptions[0];
      if (selected) {
        unitLabel.textContent = selected.dataset.unit || 'кг';
        qtyInput.max = selected.dataset.stock;
        updateCalculatedLoss();
      }
    });

    qtyInput.addEventListener('input', updateCalculatedLoss);

    backdrop.querySelector('#writeoff-form').addEventListener('submit', (e) => {
      e.preventDefault();

      const ingId = ingSelect.value;
      const qty = parseFloat(qtyInput.value);
      const ing = db.getById('ingredients', ingId);

      if (ing) {
        if (qty > ing.currentStock) {
          showToast('Ошибка: нельзя списать больше, чем числится на складе!', 'error');
          return;
        }

        const newStock = Math.round((ing.currentStock - qty) * 10) / 10;
        db.update('ingredients', ingId, { currentStock: newStock, stockQty: newStock });
        showToast(`Акт списания утвержден: -${qty} ${ing.unit} ${ing.name}`, 'warning');
      }

      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);

      if (onSuccess) onSuccess();
    });

    backdrop.querySelector('#close-writeoff-modal').addEventListener('click', () => {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);
    });

    backdrop.querySelector('#cancel-writeoff-btn').addEventListener('click', () => {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);
    });
  }
}
