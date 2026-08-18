/**
 * CHECKOUT-MODAL.JS — Модальное окно оформления заказа (Доставка/Самовывоз, Оплата)
 */

import { db } from '../state/db.js';
import { CartDrawer } from './cartDrawer.js';
import { OrderTrackerModal } from './orderTrackerModal.js';
import { showToast } from './toast.js';

export class CheckoutModal {
  static open(items, totalSum, totalKbju) {
    let backdrop = document.getElementById('checkout-modal-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'checkout-modal-backdrop';
      backdrop.className = 'modal-backdrop';
      document.body.appendChild(backdrop);
    }

    const user = db.getCollection('users')[0] || { name: 'Клиент', phone: '+996 555 12-34-56' };

    backdrop.innerHTML = `
      <div class="modal-dialog" style="max-width: 520px;" role="dialog">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">📦 Оформление заказа</h3>
            <p class="text-xs text-muted" style="margin-top:2px;">Сумма к оплате: <strong>${totalSum} сом</strong> (${totalKbju.calories} ккал)</p>
          </div>
          <button class="modal-close-btn" id="close-checkout-modal">✕</button>
        </div>

        <form id="checkout-form" class="modal-body">
          <!-- Тип получения -->
          <div class="form-group">
            <label class="form-label">Способ получения:</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2);">
              <label class="btn btn-secondary btn-sm" style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                <input type="radio" name="deliveryType" value="delivery" checked>
                <span>🚗 Курьерская доставка</span>
              </label>
              <label class="btn btn-secondary btn-sm" style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                <input type="radio" name="deliveryType" value="pickup">
                <span>🏃 Самовывоз</span>
              </label>
            </div>
          </div>

          <!-- Адрес -->
          <div class="form-group" id="address-group">
            <label class="form-label">Адрес доставки в Бишкеке:</label>
            <input type="text" class="input" id="checkout-address" placeholder="ул. Токтогула, д. 125, кв./офис 4" value="ул. Раззакова, 19" required>
          </div>

          <!-- Контакты -->
          <div class="grid grid-cols-2" style="gap: var(--space-3);">
            <div class="form-group">
              <label class="form-label">Ваше имя:</label>
              <input type="text" class="input" id="checkout-name" value="${user.name}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Телефон:</label>
              <input type="tel" class="input" id="checkout-phone" value="${user.phone}" required>
            </div>
          </div>

          <!-- Способ оплаты -->
          <div class="form-group">
            <label class="form-label">Способ оплаты:</label>
            <select class="select" id="checkout-payment">
              <option value="cash">💵 Наличными курьеру</option>
              <option value="card">💳 Банковской картой (Элкарт / Visa / MBank)</option>
              <option value="corp_account">🏢 Корпоративный счёт компании</option>
            </select>
          </div>

          <!-- Примечание -->
          <div class="form-group">
            <label class="form-label">Комментарий к заказу:</label>
            <input type="text" class="input" id="checkout-comment" placeholder="Позвонить за 5 минут, без лука и т.д.">
          </div>

          <div style="margin-top: var(--space-4); display: flex; flex-direction: column; gap: var(--space-2);">
            <button type="submit" class="btn btn-accent btn-lg" style="width: 100%;">
              Подтвердить заказ на ${totalSum} сом →
            </button>
          </div>
        </form>
      </div>
    `;

    setTimeout(() => backdrop.classList.add('open'), 10);

    const form = backdrop.querySelector('#checkout-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const newOrder = {
        userId: user.id,
        estId: items[0]?.estId || 'est_1',
        type: 'b2c_retail',
        items: items.map(i => ({
          menuItemId: i.id,
          name: i.name,
          qty: i.qty,
          price: i.retailPrice,
          total: i.retailPrice * i.qty,
          kbju: i.kbju
        })),
        totalSum: totalSum,
        totalCalories: totalKbju.calories,
        address: backdrop.querySelector('#checkout-address').value,
        customerName: backdrop.querySelector('#checkout-name').value,
        customerPhone: backdrop.querySelector('#checkout-phone').value,
        paymentMethod: backdrop.querySelector('#checkout-payment').value,
        comment: backdrop.querySelector('#checkout-comment').value,
        status: 'accepted'
      };

      // Сохраняем в БД
      const createdOrder = db.insert('orders', newOrder);

      // Очищаем корзину
      CartDrawer.clear();

      // Закрываем модалку
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);

      showToast(`Заказ #${createdOrder.id.slice(-4)} успешно оформлен!`, 'success');

      // Запуск трекера заказа
      OrderTrackerModal.open(createdOrder);
    });

    backdrop.querySelector('#close-checkout-modal').addEventListener('click', () => {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);
    });
  }
}
