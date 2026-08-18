/**
 * BUSINESS-CORP-REQUESTS-VIEW.JS — Управление входящими B2B-заявками в кабинете общепита
 */

import { db } from '../state/db.js';
import { AuthManager } from '../state/auth.js';
import { CorpDetailsModal } from '../components/corpDetailsModal.js';
import { showToast } from '../components/toast.js';

export class BusinessCorpRequestsView {
  static render(container) {
    const est = AuthManager.getActiveEstablishment() || { id: 'est_1', name: 'Столовая «Свежесть»' };
    const requests = db.query('corpRequests', r => r.estId === est.id);

    const getStatusBadge = (status) => {
      switch (status) {
        case 'new': return '<span class="badge badge-primary">⏳ Новая заявка</span>';
        case 'accepted': return '<span class="badge badge-secondary" style="background: var(--color-primary); color:#fff;">🤝 Принята</span>';
        case 'cooking': return '<span class="badge badge-warning">👨‍🍳 Готовится на кухне</span>';
        case 'ready': return '<span class="badge badge-accent">🍱 Готово к отправке</span>';
        case 'on_way': return '<span class="badge badge-secondary" style="background: #0284c7; color:#fff;">🚚 В пути</span>';
        case 'delivered': return '<span class="badge badge-success">🎉 Доставлено / Выдано</span>';
        case 'cancelled': return '<span class="badge badge-error">❌ Отменено</span>';
        default: return `<span class="badge badge-secondary">${status}</span>`;
      }
    };

    container.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
          <div>
            <h3 style="margin: 0; font-size: var(--font-size-lg);">🏢 Входящие корпоративные заявки компаний</h3>
            <p class="text-xs text-muted">Контракты на организацию корпоративного питания сотрудников</p>
          </div>
        </div>

        <div class="warehouse-table-container">
          <table class="corp-requests-table">
            <thead>
              <tr>
                <th>Номер</th>
                <th>Организация-заказчик</th>
                <th>Дата и время</th>
                <th>Порций</th>
                <th>Сумма заявки</th>
                <th>Статус производства</th>
                <th style="text-align: right;">Управление и статус</th>
              </tr>
            </thead>
            <tbody>
              ${requests.length === 0 ? `
                <tr>
                  <td colspan="7" style="text-align: center; padding: var(--space-8); color: var(--color-text-secondary);">
                    Входящих корпоративных заявок пока нет
                  </td>
                </tr>
              ` : requests.map(req => {
                const org = db.getById('organizations', req.orgId) || { name: 'Организация' };
                const totalPortions = (req.items || []).reduce((s, i) => s + (i.qty || i.portions || 1), 0);

                return `
                  <tr>
                    <td><strong>#${req.id.slice(-4)}</strong></td>
                    <td><strong>🏢 ${org.name}</strong></td>
                    <td>${req.date || req.targetDate || '2026-08-19'} · ⏰ ${req.timeSlot || '12:30'}</td>
                    <td><strong>${totalPortions} порций</strong></td>
                    <td><strong style="color: var(--color-primary);">${req.totalSum.toLocaleString('ru-RU')} сом</strong></td>
                    <td>${getStatusBadge(req.status)}</td>
                    <td style="text-align: right;">
                      <div style="display: flex; gap: 4px; justify-content: flex-end; align-items: center;">
                        <button class="btn btn-secondary btn-sm btn-view-spec" data-req-id="${req.id}" title="Спецификация">
                          📄 Детали
                        </button>
                        ${req.status === 'new' ? `
                          <button class="btn btn-primary btn-sm btn-action-status" data-req-id="${req.id}" data-next-status="accepted">
                            🤝 Принять
                          </button>
                          <button class="btn btn-secondary btn-sm btn-reject-status" data-req-id="${req.id}" style="color: var(--color-error);">
                            ✕
                          </button>
                        ` : ''}
                        ${req.status === 'accepted' ? `
                          <button class="btn btn-warning btn-sm btn-action-status" data-req-id="${req.id}" data-next-status="cooking">
                            👨‍🍳 На кухню
                          </button>
                        ` : ''}
                        ${req.status === 'cooking' ? `
                          <button class="btn btn-accent btn-sm btn-action-status" data-req-id="${req.id}" data-next-status="ready">
                            🍱 Готово
                          </button>
                        ` : ''}
                        ${req.status === 'ready' ? `
                          <button class="btn btn-primary btn-sm btn-action-status" data-req-id="${req.id}" data-next-status="on_way" style="background:#0284c7;">
                            🚚 В путь
                          </button>
                        ` : ''}
                        ${req.status === 'on_way' ? `
                          <button class="btn btn-success btn-sm btn-action-status" data-req-id="${req.id}" data-next-status="delivered">
                            🎉 Доставлено
                          </button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.querySelectorAll('.btn-view-spec').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.reqId;
        CorpDetailsModal.open(id, true, () => this.render(container));
      });
    });

    container.querySelectorAll('.btn-action-status').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.reqId;
        const nextStatus = btn.dataset.nextStatus;
        db.update('corpRequests', id, { status: nextStatus });
        const statusNames = {
          'accepted': 'Принята',
          'cooking': 'Готовится на кухне',
          'ready': 'Готово к отправке',
          'on_way': 'В пути (доставка)',
          'delivered': 'Доставлено / Выдано'
        };
        showToast(`Заявка #${id.slice(-4)}: статус изменен на «${statusNames[nextStatus]}»`, 'success');
        this.render(container);
      });
    });

    container.querySelectorAll('.btn-reject-status').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.reqId;
        const req = db.getById('corpRequests', id);
        if (req && confirm(`Отклонить заявку #${req.id.slice(-4)}? Средства вернутся заказчику.`)) {
          db.update('corpRequests', id, { status: 'cancelled' });
          const org = db.getById('organizations', req.orgId);
          if (org) {
            db.update('organizations', org.id, { currentBalance: (org.currentBalance || 0) + req.totalSum });
          }
          showToast(`Заявка #${id.slice(-4)} отклонена`, 'info');
          this.render(container);
        }
      });
    });
  }
}
