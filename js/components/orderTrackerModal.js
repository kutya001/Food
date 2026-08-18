/**
 * ORDER-TRACKER-MODAL.JS — Интерактивный трекер жизненного цикла заказа
 */

import { db } from '../state/db.js';
import { showToast } from './toast.js';

export class OrderTrackerModal {
  static open(order) {
    let backdrop = document.getElementById('tracker-modal-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'tracker-modal-backdrop';
      backdrop.className = 'modal-backdrop';
      document.body.appendChild(backdrop);
    }

    const est = db.getById('establishments', order.estId) || { name: 'Столовая «Свежесть»' };

    backdrop.innerHTML = `
      <div class="modal-dialog" style="max-width: 520px;" role="dialog">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">🛵 Статус доставки заказа</h3>
            <p class="text-xs text-muted">Заказ #${order.id.slice(-6)} · ${est.name}</p>
          </div>
          <button class="modal-close-btn" id="close-tracker-modal">✕</button>
        </div>

        <div class="modal-body">
          <!-- Карточка расчетного времени -->
          <div class="delivery-estimate-card">
            <span class="text-xs text-muted" id="tracker-status-subtitle">Примерное время доставки:</span>
            <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-extrabold); color: var(--color-primary); margin: 4px 0;" id="tracker-timer">
              ~ 25-35 мин
            </div>
            <small class="text-muted" id="tracker-status-desc">Заказ передан на кухню заведения</small>
          </div>

          <!-- Таймлайн этапов -->
          <div class="order-timeline">
            <div class="timeline-step completed" id="step-1">
              <div class="timeline-icon-bubble">📋</div>
              <span class="timeline-label">Принят</span>
            </div>
            <div class="timeline-step active" id="step-2">
              <div class="timeline-icon-bubble">🍳</div>
              <span class="timeline-label">Готовится</span>
            </div>
            <div class="timeline-step" id="step-3">
              <div class="timeline-icon-bubble">🛵</div>
              <span class="timeline-label">В пути</span>
            </div>
            <div class="timeline-step" id="step-4">
              <div class="timeline-icon-bubble">✅</div>
              <span class="timeline-label">Доставлен</span>
            </div>
          </div>

          <!-- Детали заказа -->
          <div style="background: var(--color-surface-alt); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--color-border); font-size: var(--font-size-xs); margin-bottom: var(--space-4);">
            <div style="font-weight: var(--font-weight-bold); margin-bottom: 4px;">Состав заказа:</div>
            ${order.items.map(i => `
              <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                <span>${i.name} x${i.qty}</span>
                <strong>${i.total} сом</strong>
              </div>
            `).join('')}
            <div style="border-top:1px solid var(--color-border); margin-top:6px; padding-top:6px; display:flex; justify-content:space-between; font-weight:var(--font-weight-extrabold);">
              <span>Итого:</span>
              <span style="color:var(--color-primary);">${order.totalSum} сом</span>
            </div>
          </div>

          <button class="btn btn-secondary" id="tracker-ok-btn" style="width: 100%;">
            Понятно, продолжить покупки
          </button>
        </div>
      </div>
    `;

    setTimeout(() => backdrop.classList.add('open'), 10);

    // Симуляция смены статусов
    const s1 = backdrop.querySelector('#step-1');
    const s2 = backdrop.querySelector('#step-2');
    const s3 = backdrop.querySelector('#step-3');
    const s4 = backdrop.querySelector('#step-4');
    const statusDesc = backdrop.querySelector('#tracker-status-desc');
    const timer = backdrop.querySelector('#tracker-timer');

    // Через 3 секунды -> Курьер в пути
    setTimeout(() => {
      if (document.body.contains(backdrop)) {
        s2.classList.remove('active');
        s2.classList.add('completed');
        s3.classList.add('active');
        statusDesc.textContent = 'Курьер забрал заказ и направляется по вашему адресу';
        timer.textContent = '~ 15 мин';
        showToast('Курьер забрал ваш заказ из кухни!', 'info');
      }
    }, 4000);

    // Через 8 секунд -> Доставлен
    setTimeout(() => {
      if (document.body.contains(backdrop)) {
        s3.classList.remove('active');
        s3.classList.add('completed');
        s4.classList.add('completed');
        statusDesc.textContent = 'Приятного аппетита! Заказ успешно вручен.';
        timer.textContent = 'Доставлен! 🎉';
        showToast('Заказ доставлен! Приятного аппетита 🍲', 'success');
        db.update('orders', order.id, { status: 'delivered' });
      }
    }, 9000);

    backdrop.querySelector('#close-tracker-modal').addEventListener('click', () => {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);
    });

    backdrop.querySelector('#tracker-ok-btn').addEventListener('click', () => {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);
    });
  }
}
