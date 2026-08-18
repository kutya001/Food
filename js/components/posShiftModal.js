/**
 * POS-SHIFT-MODAL.JS — Управление кассовой сменой, X-отчет и Z-отчет закрытия смены
 */

import { db } from '../state/db.js';
import { AuthManager } from '../state/auth.js';
import { showToast } from './toast.js';

export class PosShiftModal {
  static open(mode = 'x_report', onSuccess = null) {
    const est = AuthManager.getActiveEstablishment() || { id: 'est_1', name: 'Столовая «Свежесть»' };
    const allShifts = db.getCollection('posShifts');
    const currentShift = allShifts.find(s => s.status === 'open') || {
      id: 'shift_42',
      shiftNumber: 42,
      cashierName: 'Кассир Айтматов Э.',
      initialCash: 3500,
      openedAt: new Date().toISOString()
    };

    // Агрегация заказов за смену
    const orders = db.query('orders', o => o.estId === est.id && o.type === 'pos_cashier');
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalSum || 0), 0);
    const cashTotal = orders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + (o.totalSum || 0), 0);
    const cardTotal = orders.filter(o => o.paymentMethod === 'card').reduce((sum, o) => sum + (o.totalSum || 0), 0);
    const corpTotal = orders.filter(o => o.paymentMethod === 'corp').reduce((sum, o) => sum + (o.totalSum || 0), 0);
    const avgCheck = orders.length ? Math.round(totalRevenue / orders.length) : 0;

    let backdrop = document.getElementById('pos-shift-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'pos-shift-backdrop';
      backdrop.className = 'modal-backdrop';
      document.body.appendChild(backdrop);
    }

    const isZReport = mode === 'z_report';

    backdrop.innerHTML = `
      <div class="modal-dialog" style="max-width: 520px;" role="dialog">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">${isZReport ? '🔴 Закрытие смены (Z-отчёт)' : '📊 Промежуточный X-отчёт'}</h3>
            <p class="text-xs text-muted">Смена №${currentShift.shiftNumber || 42} · ${currentShift.cashierName || 'Кассир'}</p>
          </div>
          <button class="modal-close-btn" id="close-pos-shift-modal">✕</button>
        </div>

        <div class="modal-body">
          <!-- Сводка выручки -->
          <div style="background:var(--color-surface-alt); padding:var(--space-4); border-radius:var(--radius-lg); border:1px solid var(--color-border); margin-bottom:var(--space-4);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-2);">
              <span class="text-xs text-muted">Общая выручка за смену:</span>
              <strong style="font-size:var(--font-size-2xl); color:var(--color-primary);">${totalRevenue} сом</strong>
            </div>

            <div class="grid grid-cols-2" style="gap:var(--space-2); font-size:var(--font-size-xs); border-top:1px solid var(--color-border); padding-top:var(--space-2);">
              <div>Чеков пробито: <strong>${orders.length} шт</strong></div>
              <div>Средний чек: <strong>${avgCheck} сом</strong></div>
              <div>Размен на начало: <strong>${currentShift.initialCash || 3500} сом</strong></div>
              <div>В кассе наличными: <strong>${(currentShift.initialCash || 3500) + cashTotal} сом</strong></div>
            </div>
          </div>

          <!-- Структура оплат -->
          <h4 style="font-size:var(--font-size-xs); text-transform:uppercase; color:var(--color-text-secondary); margin-bottom:var(--space-2);">
            💳 Структура оплат:
          </h4>
          <div style="display:flex; flex-direction:column; gap:6px; font-size:var(--font-size-xs); margin-bottom:var(--space-4);">
            <div style="display:flex; justify-content:space-between; padding:6px; background:var(--color-surface-alt); border-radius:var(--radius-sm);">
              <span>💵 Наличные:</span>
              <strong>${cashTotal} сом</strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding:6px; background:var(--color-surface-alt); border-radius:var(--radius-sm);">
              <span>💳 Карты / QR:</span>
              <strong>${cardTotal} сом</strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding:6px; background:var(--color-surface-alt); border-radius:var(--radius-sm);">
              <span>🏢 Корпоративный счёт:</span>
              <strong>${corpTotal} сом</strong>
            </div>
          </div>

          ${isZReport ? `
            <div class="alert alert-warning" style="margin-bottom:var(--space-4); font-size:var(--font-size-xs);">
              ⚠️ Внимание: после закрытия смены касса будет заблокирована до открытия новой смены, а выручка будет отправлена на инкассацию.
            </div>
          ` : ''}

          <div style="display:flex; gap:var(--space-2); justify-content:flex-end;">
            <button class="btn btn-secondary" id="cancel-shift-modal-btn">
              ${isZReport ? 'Отмена' : 'Закрыть окно'}
            </button>
            ${isZReport ? `
              <button class="btn btn-error" id="confirm-close-shift-btn">
                🔴 Снять Z-отчёт и закрыть смену
              </button>
            ` : `
              <button class="btn btn-primary" id="print-x-report-btn">
                🖨️ Распечатать X-отчёт
              </button>
            `}
          </div>
        </div>
      </div>
    `;

    setTimeout(() => backdrop.classList.add('open'), 10);

    if (isZReport) {
      backdrop.querySelector('#confirm-close-shift-btn').addEventListener('click', () => {
        showToast(`Смена №${currentShift.shiftNumber || 42} успешно закрыта. Выручка: ${totalRevenue} сом`, 'success');
        backdrop.classList.remove('open');
        setTimeout(() => backdrop.remove(), 250);
        if (onSuccess) onSuccess();
      });
    } else {
      backdrop.querySelector('#print-x-report-btn').addEventListener('click', () => {
        window.print();
      });
    }

    backdrop.querySelector('#close-pos-shift-modal').addEventListener('click', () => {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);
    });

    backdrop.querySelector('#cancel-shift-modal-btn').addEventListener('click', () => {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);
    });
  }
}
