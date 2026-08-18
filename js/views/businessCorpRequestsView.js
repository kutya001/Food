/**
 * BUSINESS-CORP-REQUESTS-VIEW.JS — Управление входящими B2B-заявками в кабинете общепита
 */

import { db } from '../state/db.js';
import { AuthManager } from '../state/auth.js';
import { CorpDetailsModal } from '../components/corpDetailsModal.js';

export class BusinessCorpRequestsView {
  static render(container) {
    const est = AuthManager.getActiveEstablishment() || { id: 'est_1', name: 'Столовая «Свежесть»' };
    const requests = db.query('corpRequests', r => r.estId === est.id);

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
                <th style="text-align: right;">Управление</th>
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
                const totalPortions = (req.items || []).reduce((s, i) => s + i.qty, 0);

                let statusBadge = '<span class="badge badge-primary">Новая заявка</span>';
                if (req.status === 'in_progress') statusBadge = '<span class="badge badge-warning">В работе на кухне</span>';
                if (req.status === 'ready') statusBadge = '<span class="badge badge-accent">Готово к выдаче</span>';
                if (req.status === 'delivered') statusBadge = '<span class="badge badge-success">Выдано</span>';

                return `
                  <tr>
                    <td><strong>#${req.id.slice(-4)}</strong></td>
                    <td><strong>🏢 ${org.name}</strong></td>
                    <td>${req.date} · ⏰ ${req.timeSlot}</td>
                    <td><strong>${totalPortions} порций</strong></td>
                    <td><strong style="color: var(--color-primary);">${req.totalSum} сом</strong></td>
                    <td>${statusBadge}</td>
                    <td style="text-align: right;">
                      <button class="btn btn-primary btn-sm btn-manage-corp-req" data-req-id="${req.id}">
                        📋 Спецификация и статус
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

    container.querySelectorAll('.btn-manage-corp-req').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.reqId;
        CorpDetailsModal.open(id, true, () => this.render(container));
      });
    });
  }
}
