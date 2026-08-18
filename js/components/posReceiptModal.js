/**
 * POS-RECEIPT-MODAL.JS — Модальное окно фискального чека для кассира и гостя
 */

import { db } from '../state/db.js';

export class PosReceiptModal {
  static open(orderData) {
    const est = db.getById('establishments', orderData.estId) || { name: 'Столовая «Свежесть»', address: 'г. Бишкек, ул. Токтогула, 125' };

    let backdrop = document.getElementById('receipt-view-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'receipt-view-backdrop';
      backdrop.className = 'modal-backdrop';
      document.body.appendChild(backdrop);
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('ru-RU');
    const timeStr = now.toLocaleTimeString('ru-RU');

    backdrop.innerHTML = `
      <div class="modal-dialog" style="max-width: 400px; background: transparent; box-shadow: none; border: none;" role="dialog">
        <div class="fiscal-receipt-paper">
          <div style="text-align: center;">
            <h3 style="margin: 0 0 4px 0; font-size: 16px;">${est.name}</h3>
            <div>${est.address}</div>
            <div>ИНН: 01402201910245 · ККМ №ФК-9821</div>
            <div>Чек № ${orderData.id.slice(-6)} · ${orderData.table ? 'Стол: ' + orderData.table : 'С собой'}</div>
            <div>${dateStr} ${timeStr}</div>
          </div>

          <div class="fiscal-divider"></div>

          <div>
            ${orderData.items.map(item => `
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span>${item.name} x${item.qty}</span>
                <strong>${item.price * item.qty} сом</strong>
              </div>
            `).join('')}
          </div>

          ${orderData.discountPercent ? `
            <div style="display:flex; justify-content:space-between; color:#777; font-size:11px; margin-top:4px;">
              <span>Скидка (${orderData.discountPercent}%):</span>
              <span>- ${Math.round(orderData.rawTotal * (orderData.discountPercent / 100))} сом</span>
            </div>
          ` : ''}

          <div class="fiscal-divider"></div>

          <div style="display:flex; justify-content:space-between; font-size:16px; font-weight:bold;">
            <span>ИТОГО К ОПЛАТЕ:</span>
            <span>${orderData.totalSum} СОМ</span>
          </div>

          <div style="display:flex; justify-content:space-between; font-size:11px; margin-top:4px;">
            <span>Способ оплаты:</span>
            <span>${orderData.paymentMethod === 'cash' ? 'НАЛИЧНЫЕ' : (orderData.paymentMethod === 'card' ? 'БАНКОВСКАЯ КАРТА' : 'КОРП. СЧЕТ')}</span>
          </div>

          ${orderData.paymentMethod === 'cash' ? `
            <div style="display:flex; justify-content:space-between; font-size:11px;">
              <span>Получено наличными:</span>
              <span>${orderData.receivedCash || orderData.totalSum} сом</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:11px;">
              <span>Сдача:</span>
              <span>${orderData.change || 0} сом</span>
            </div>
          ` : ''}

          <div class="fiscal-divider"></div>

          <div style="text-align:center; font-size:11px;">
            <div>*** СПАСИБО ЗА ПОКУПКУ! ***</div>
            <div>Приятного аппетита!</div>
            <div style="margin-top:6px;">Электронный чек: foodflow.kg/r/${orderData.id.slice(-6)}</div>
          </div>
        </div>

        <div style="margin-top: var(--space-4); display: flex; gap: var(--space-2); justify-content: center;">
          <button class="btn btn-secondary" id="close-fiscal-receipt-btn" style="background:#fff; color:#111;">
            Закрыть чек
          </button>
          <button class="btn btn-primary" id="print-fiscal-receipt-btn">
            🖨️ Печать чека
          </button>
        </div>
      </div>
    `;

    setTimeout(() => backdrop.classList.add('open'), 10);

    backdrop.querySelector('#close-fiscal-receipt-btn').addEventListener('click', () => {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);
    });

    backdrop.querySelector('#print-fiscal-receipt-btn').addEventListener('click', () => {
      window.print();
    });
  }
}
