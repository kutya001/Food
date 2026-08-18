/**
 * POS-PAYMENT-MODAL.JS — Модальное окно оплаты чека кассиром с калькулятором сдачи в сомах
 */

import { db } from '../state/db.js';
import { AuthManager } from '../state/auth.js';
import { StockService } from '../services/stockService.js';
import { PosReceiptModal } from './posReceiptModal.js';
import { showToast } from './toast.js';

export class PosPaymentModal {
  static open(billData, onSuccess = null) {
    const est = AuthManager.getActiveEstablishment() || { id: 'est_1', name: 'Столовая «Свежесть»' };

    let backdrop = document.getElementById('pos-payment-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'pos-payment-backdrop';
      backdrop.className = 'modal-backdrop';
      document.body.appendChild(backdrop);
    }

    let activeMethod = 'cash'; // 'cash' | 'card' | 'corp'
    let receivedCash = billData.totalSum;
    let change = 0;

    backdrop.innerHTML = `
      <div class="modal-dialog" style="max-width: 520px;" role="dialog">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">💵 Оплата чека POS</h3>
            <p class="text-xs text-muted">${est.name} · ${billData.table ? 'Стол: ' + billData.table : 'С собой'}</p>
          </div>
          <button class="modal-close-btn" id="close-pos-pay-modal">✕</button>
        </div>

        <div class="modal-body">
          <!-- Сумма к оплате -->
          <div style="background:var(--color-surface-alt); padding:var(--space-4); border-radius:var(--radius-lg); border:1px solid var(--color-border); text-align:center; margin-bottom:var(--space-4);">
            <span class="text-xs text-muted">Итого к оплате:</span>
            <div style="font-size:var(--font-size-3xl); font-weight:var(--font-weight-extrabold); color:var(--color-primary);">
              ${billData.totalSum} сом
            </div>
            ${billData.discountPercent ? `<small class="text-muted">Включая скидку ${billData.discountPercent}%</small>` : ''}
          </div>

          <!-- Выбор метода оплаты -->
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:var(--space-2); margin-bottom:var(--space-4);">
            <button class="btn btn-secondary pay-method-btn active" data-method="cash" style="flex-direction:column; padding:10px; height:auto;">
              <span style="font-size:1.4rem;">💵</span>
              <span style="font-size:var(--font-size-xs); font-weight:bold;">Наличные</span>
            </button>
            <button class="btn btn-secondary pay-method-btn" data-method="card" style="flex-direction:column; padding:10px; height:auto;">
              <span style="font-size:1.4rem;">💳</span>
              <span style="font-size:var(--font-size-xs); font-weight:bold;">Карта / MBank</span>
            </button>
            <button class="btn btn-secondary pay-method-btn" data-method="corp" style="flex-direction:column; padding:10px; height:auto;">
              <span style="font-size:1.4rem;">🏢</span>
              <span style="font-size:var(--font-size-xs); font-weight:bold;">Корп. счёт</span>
            </button>
          </div>

          <!-- Блок наличных: быстрые купюры и сдача -->
          <div id="cash-payment-section">
            <div class="form-group">
              <label class="form-label">Получено от гостя (сом):</label>
              <input type="number" step="10" class="input" id="input-received-cash" value="${billData.totalSum}" style="font-size:var(--font-size-xl); font-weight:bold; text-align:center;">
            </div>

            <!-- Кнопки быстрых купюр в сомах -->
            <div class="quick-cash-grid">
              <button class="cash-nominal-btn" data-add="200">+200 сом</button>
              <button class="cash-nominal-btn" data-add="500">+500 сом</button>
              <button class="cash-nominal-btn" data-add="1000">+1 000 сом</button>
              <button class="cash-nominal-btn" data-add="2000">+2 000 сом</button>
              <button class="cash-nominal-btn" data-add="5000">+5 000 сом</button>
              <button class="cash-nominal-btn" id="btn-exact-cash" style="background:var(--color-primary-light); color:var(--color-primary); border-color:var(--color-primary);">Без сдачи</button>
            </div>

            <!-- Расчет сдачи -->
            <div style="background:var(--color-surface-alt); padding:var(--space-3); border-radius:var(--radius-md); border:1px solid var(--color-border); display:flex; justify-content:space-between; align-items:center;">
              <span style="font-weight:bold; font-size:var(--font-size-sm);">Сдача клиенту:</span>
              <strong style="font-size:var(--font-size-xl); color:var(--color-success);" id="label-change-som">0 сом</strong>
            </div>
          </div>

          <!-- Блок безнала / QR -->
          <div id="card-payment-section" style="display:none; text-align:center; padding:var(--space-4); background:var(--color-surface-alt); border-radius:var(--radius-md); border:1px solid var(--color-border);">
            <div style="font-size:2.5rem; margin-bottom:8px;">📱</div>
            <h4>Приложите карту к терминалу или отсканируйте MBank QR</h4>
            <p class="text-xs text-muted" style="margin-top:4px;">Элкарт / Visa / Mastercard / MBank / О!Деньги</p>
          </div>

          <!-- Блок корпоративной оплаты -->
          <div id="corp-payment-section" style="display:none; padding:var(--space-3); background:var(--color-surface-alt); border-radius:var(--radius-md); border:1px solid var(--color-border);">
            <label class="form-label">Организация-заказчик:</label>
            <select class="select" id="select-corp-client">
              <option value="org_1">ОсОО «Alfa Tech» (Лимит: 8 400 сом)</option>
              <option value="org_2">ОАО «Бишкек Финанс» (Лимит: 24 500 сом)</option>
            </select>
            <div class="text-xs text-muted" style="margin-top:6px;">Сумма чека будет списана с корпоративного баланса организации</div>
          </div>

          <div style="margin-top:var(--space-6); display:flex; gap:var(--space-2);">
            <button class="btn btn-secondary" id="cancel-pos-pay-btn" style="flex:1;">Отмена</button>
            <button class="btn btn-primary btn-lg" id="confirm-pos-pay-btn" style="flex:2;">
              ✅ Пробить чек (${billData.totalSum} сом)
            </button>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => backdrop.classList.add('open'), 10);

    const cashInput = backdrop.querySelector('#input-received-cash');
    const changeLabel = backdrop.querySelector('#label-change-som');
    const cashSection = backdrop.querySelector('#cash-payment-section');
    const cardSection = backdrop.querySelector('#card-payment-section');
    const corpSection = backdrop.querySelector('#corp-payment-section');

    const updateChange = () => {
      const rec = parseFloat(cashInput.value) || 0;
      change = Math.max(0, rec - billData.totalSum);
      changeLabel.textContent = `${change} сом`;
    };

    cashInput.addEventListener('input', updateChange);

    // Кнопки купюр
    backdrop.querySelectorAll('.cash-nominal-btn[data-add]').forEach(btn => {
      btn.addEventListener('click', () => {
        const nominal = parseFloat(btn.dataset.add);
        cashInput.value = nominal;
        updateChange();
      });
    });

    backdrop.querySelector('#btn-exact-cash').addEventListener('click', () => {
      cashInput.value = billData.totalSum;
      updateChange();
    });

    // Переключение способов оплаты
    backdrop.querySelectorAll('.pay-method-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        backdrop.querySelectorAll('.pay-method-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeMethod = btn.dataset.method;

        cashSection.style.display = activeMethod === 'cash' ? 'block' : 'none';
        cardSection.style.display = activeMethod === 'card' ? 'block' : 'none';
        corpSection.style.display = activeMethod === 'corp' ? 'block' : 'none';
      });
    });

    // Подтверждение оплаты
    backdrop.querySelector('#confirm-pos-pay-btn').addEventListener('click', () => {
      const recCash = parseFloat(cashInput.value) || billData.totalSum;

      if (activeMethod === 'cash' && recCash < billData.totalSum) {
        showToast('Внимание: внесенная сумма меньше суммы чека!', 'error');
        return;
      }

      // Сохраняем заказ в БД
      const createdOrder = db.insert('orders', {
        estId: est.id,
        type: 'pos_cashier',
        items: billData.items.map(i => ({
          menuItemId: i.id,
          name: i.name,
          qty: i.qty,
          price: i.retailPrice,
          total: i.retailPrice * i.qty
        })),
        rawTotal: billData.rawTotal,
        discountPercent: billData.discountPercent,
        totalSum: billData.totalSum,
        table: billData.table,
        paymentMethod: activeMethod,
        receivedCash: activeMethod === 'cash' ? recCash : billData.totalSum,
        change: activeMethod === 'cash' ? change : 0,
        status: 'delivered'
      });

      // Сквозное списание сырья со склада заведения
      StockService.deductStockForOrder(billData.items, est.id);

      showToast(`Чек #${createdOrder.id.slice(-4)} успешно пробит!`, 'success');

      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);

      // Печать/предпросмотр чека
      PosReceiptModal.open(createdOrder);

      if (onSuccess) onSuccess();
    });

    backdrop.querySelector('#close-pos-pay-modal').addEventListener('click', () => {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);
    });

    backdrop.querySelector('#cancel-pos-pay-btn').addEventListener('click', () => {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);
    });
  }
}
