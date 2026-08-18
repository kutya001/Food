/**
 * RECEIPT-MODAL.JS — Оформление приходной накладной (поступление сырья на склад)
 */

import { db } from '../state/db.js';
import { AuthManager } from '../state/auth.js';
import { showToast } from './toast.js';

export class ReceiptModal {
  static open(onSuccess = null) {
    const est = AuthManager.getActiveEstablishment() || { id: 'est_1', name: 'Столовая «Свежесть»' };
    const ingredients = db.query('ingredients', i => i.estId === est.id);

    let backdrop = document.getElementById('receipt-modal-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'receipt-modal-backdrop';
      backdrop.className = 'modal-backdrop';
      document.body.appendChild(backdrop);
    }

    backdrop.innerHTML = `
      <div class="modal-dialog" style="max-width: 540px;" role="dialog">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">📥 Приходная накладная (Поступление сырья)</h3>
            <p class="text-xs text-muted">${est.name} · Пополнение складских остатков</p>
          </div>
          <button class="modal-close-btn" id="close-receipt-modal">✕</button>
        </div>

        <form id="receipt-form" class="modal-body">
          <div class="form-group">
            <label class="form-label">Выберите сырье со склада:</label>
            <select class="select" id="receipt-ingredient-select" required>
              <option value="" disabled selected>-- Выберите позицию сырья --</option>
              ${ingredients.map(ing => `
                <option value="${ing.id}" data-unit="${ing.unit}" data-price="${ing.purchasePrice}">
                  ${ing.name} (текущий остаток: ${ing.currentStock} ${ing.unit}, закупка: ${ing.purchasePrice} сом/${ing.unit})
                </option>
              `).join('')}
            </select>
          </div>

          <div class="grid grid-cols-2" style="gap: var(--space-3);">
            <div class="form-group">
              <label class="form-label">Количество поступления:</label>
              <div style="display:flex; align-items:center; gap:6px;">
                <input type="number" step="0.1" min="0.1" class="input" id="receipt-qty" placeholder="10.0" required>
                <span class="badge badge-secondary" id="receipt-unit-label" style="min-width:40px; text-align:center;">кг</span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Закупочная цена (сом / ед.):</label>
              <input type="number" step="1" min="1" class="input" id="receipt-price" placeholder="420" required>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Поставщик / Источник закупки:</label>
            <input type="text" class="input" id="receipt-supplier" placeholder="ОсОО «АгроФуд Бишкек», Ошский рынок и т.д." value="ОсОО «АгроФуд Бишкек»" required>
          </div>

          <div class="form-group">
            <label class="form-label">Номер накладной / чек:</label>
            <input type="text" class="input" id="receipt-doc-num" placeholder="№ ПН-4091" value="№ ПН-${Math.floor(1000 + Math.random() * 9000)}">
          </div>

          <!-- Итоговая сумма прихода -->
          <div style="background:var(--color-surface-alt); padding:var(--space-3); border-radius:var(--radius-md); border:1px solid var(--color-border); display:flex; justify-content:space-between; align-items:center; margin-top:var(--space-3);">
            <span style="font-weight:var(--font-weight-bold); font-size:var(--font-size-sm);">Сумма накладной:</span>
            <strong style="font-size:var(--font-size-xl); color:var(--color-primary);" id="receipt-total-sum">0 сом</strong>
          </div>

          <div style="margin-top:var(--space-4); display:flex; justify-content:flex-end; gap:var(--space-2);">
            <button type="button" class="btn btn-secondary" id="cancel-receipt-btn">Отмена</button>
            <button type="submit" class="btn btn-primary">Принять на склад →</button>
          </div>
        </form>
      </div>
    `;

    setTimeout(() => backdrop.classList.add('open'), 10);

    const ingSelect = backdrop.querySelector('#receipt-ingredient-select');
    const unitLabel = backdrop.querySelector('#receipt-unit-label');
    const qtyInput = backdrop.querySelector('#receipt-qty');
    const priceInput = backdrop.querySelector('#receipt-price');
    const totalSumEl = backdrop.querySelector('#receipt-total-sum');

    const updateCalculatedSum = () => {
      const q = parseFloat(qtyInput.value) || 0;
      const p = parseFloat(priceInput.value) || 0;
      totalSumEl.textContent = `${Math.round(q * p)} сом`;
    };

    ingSelect.addEventListener('change', () => {
      const selected = ingSelect.selectedOptions[0];
      if (selected) {
        unitLabel.textContent = selected.dataset.unit || 'кг';
        priceInput.value = selected.dataset.price || '100';
        updateCalculatedSum();
      }
    });

    qtyInput.addEventListener('input', updateCalculatedSum);
    priceInput.addEventListener('input', updateCalculatedSum);

    backdrop.querySelector('#receipt-form').addEventListener('submit', (e) => {
      e.preventDefault();

      const ingId = ingSelect.value;
      const qty = parseFloat(qtyInput.value);
      const newPrice = parseFloat(priceInput.value);
      const supplier = backdrop.querySelector('#receipt-supplier').value;

      const ing = db.getById('ingredients', ingId);
      if (ing) {
        const oldStock = ing.currentStock || 0;
        const newStock = Math.round((oldStock + qty) * 10) / 10;
        
        // Средневзвешенная закупочная цена
        const totalOldVal = oldStock * ing.purchasePrice;
        const totalNewVal = qty * newPrice;
        const avgPrice = Math.round((totalOldVal + totalNewVal) / (newStock || 1));

        db.update('ingredients', ingId, {
          currentStock: newStock,
          stockQty: newStock,
          purchasePrice: avgPrice,
          lastSupplier: supplier
        });

        showToast(`Накладная принята: +${qty} ${ing.unit} ${ing.name} на склад!`, 'success');
      }

      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);

      if (onSuccess) onSuccess();
    });

    backdrop.querySelector('#close-receipt-modal').addEventListener('click', () => {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);
    });

    backdrop.querySelector('#cancel-receipt-btn').addEventListener('click', () => {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);
    });
  }
}
