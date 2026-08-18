/**
 * CORPORATE-PORTAL-VIEW.JS — Кабинет корпоративного заказчика (Бюджет, Заявки на питание)
 */

import { db } from '../state/db.js';
import { AuthManager } from '../state/auth.js';
import { CorpOrderModal } from '../components/corpOrderModal.js';
import { CorpDetailsModal } from '../components/corpDetailsModal.js';
import { showToast } from '../components/toast.js';

export class CorporatePortalView {
  static render(container) {
    const org = AuthManager.getActiveOrganization() || {
      id: 'org_1',
      name: 'ОсОО «Alfa Tech»',
      employeeCount: 45,
      budgetMonthly: 120000,
      currentBalance: 84500,
      contractEnd: '2026-12-31'
    };

    const requests = db.query('corpRequests', r => r.orgId === org.id);
    const spentBudget = (org.budgetMonthly || 120000) - (org.currentBalance || 0);
    const spentPercent = Math.min(100, Math.max(0, Math.round((spentBudget / (org.budgetMonthly || 120000)) * 100)));

    const getStatusBadge = (status) => {
      switch (status) {
        case 'new': return '<span class="badge badge-primary">⏳ Новая</span>';
        case 'accepted': return '<span class="badge badge-secondary" style="background: var(--color-primary); color: #fff;">🤝 Принята</span>';
        case 'cooking': return '<span class="badge badge-warning">👨‍🍳 Готовится</span>';
        case 'ready': return '<span class="badge badge-accent">🍱 Готов</span>';
        case 'on_way': return '<span class="badge badge-secondary" style="background: #0284c7; color: #fff;">🚚 В пути</span>';
        case 'delivered': return '<span class="badge badge-success">🎉 Доставлен</span>';
        case 'cancelled': return '<span class="badge badge-error">❌ Отменён</span>';
        default: return `<span class="badge badge-secondary">${status}</span>`;
      }
    };

    container.innerHTML = `
      <div class="container">
        <!-- Шапка заказчика -->
        <div class="corporate-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--space-4);">
          <div>
            <div style="display: flex; gap: var(--space-2); margin-bottom: 4px;">
              <span class="badge badge-primary">Корпоративный портал</span>
              <span class="badge badge-success">Договор активен</span>
            </div>
            <h1 style="font-size: var(--font-size-2xl); margin: 0;">🏢 ${org.name}</h1>
            <p class="text-xs text-muted" style="margin-top: 2px;">
              Штат: <strong>${org.employeesCount || org.employeeCount || 45} сотрудников</strong> · Договор до ${org.contractEnd || '2026-12-31'}
            </p>
          </div>

          <button class="btn btn-accent btn-lg" id="btn-create-corp-request">
            🍱 Сформировать заявку на питание →
          </button>
        </div>

        <!-- Карточка бюджета компании -->
        <div class="corp-budget-card">
          <div>
            <span class="text-xs text-muted">Ежемесячный лимит на питание компании:</span>
            <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-extrabold); color: var(--color-text);">
              ${(org.budgetMonthly || org.monthlyLimit || 120000).toLocaleString('ru-RU')} сом / мес
            </div>
            <div class="budget-progress-track">
              <div class="budget-progress-bar" style="width: ${spentPercent}%; background-color: ${spentPercent > 85 ? 'var(--color-warning)' : 'var(--color-primary)'};"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 4px;" class="text-muted">
              <span>Израсходовано: ${spentBudget.toLocaleString('ru-RU')} сом (${spentPercent}%)</span>
              <span>Лимит: ${(org.budgetMonthly || 120000).toLocaleString('ru-RU')} сом</span>
            </div>
          </div>

          <div style="background: var(--color-surface-alt); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--color-border); text-align: center;">
            <span class="text-xs text-muted">Доступный остаток:</span>
            <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-extrabold); color: var(--color-success); margin-top: 2px;">
              ${(org.currentBalance || 0).toLocaleString('ru-RU')} сом
            </div>
          </div>

          <div style="background: var(--color-surface-alt); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--color-border); text-align: center;">
            <span class="text-xs text-muted">Всего заявок:</span>
            <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-extrabold); color: var(--color-primary); margin-top: 2px;">
              ${requests.length} шт
            </div>
          </div>
        </div>

        <!-- Таблица истории заявок на питание -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);">
          <h3 style="margin: 0; font-size: var(--font-size-lg);">📋 Реестр заявок на доставку обедов</h3>
          <span class="text-xs text-muted">Спеццены по договору B2B</span>
        </div>

        <div class="warehouse-table-container">
          <table class="corp-requests-table">
            <thead>
              <tr>
                <th>Номер</th>
                <th>Дата питания</th>
                <th>Время доставки</th>
                <th>Заведение-партнер</th>
                <th>Порций</th>
                <th>Сумма заявки</th>
                <th>Статус</th>
                <th style="text-align: right;">Управление</th>
              </tr>
            </thead>
            <tbody>
              ${requests.length === 0 ? `
                <tr>
                  <td colspan="8" style="text-align: center; padding: var(--space-8); color: var(--color-text-secondary);">
                    Активных корпоративных заявок пока нет. Создайте первую заявку!
                  </td>
                </tr>
              ` : requests.map(req => {
                const est = db.getById('establishments', req.estId) || { name: 'Столовая' };
                const totalPortions = (req.items || []).reduce((s, i) => s + (i.qty || i.portions || 1), 0);
                const canEditOrCancel = req.status === 'new';

                return `
                  <tr>
                    <td><strong>#${req.id.slice(-4)}</strong></td>
                    <td>${req.date || req.targetDate || '2026-08-19'}</td>
                    <td>⏰ ${req.timeSlot || '12:30'}</td>
                    <td>🏠 ${est.name}</td>
                    <td><strong>${totalPortions} порций</strong></td>
                    <td><strong style="color: var(--color-primary);">${req.totalSum.toLocaleString('ru-RU')} сом</strong></td>
                    <td>${getStatusBadge(req.status)}</td>
                    <td style="text-align: right;">
                      <div style="display: flex; gap: 4px; justify-content: flex-end;">
                        <button class="btn btn-secondary btn-sm btn-view-corp-req" data-req-id="${req.id}" title="Спецификация">
                          📄 Детали
                        </button>
                        ${canEditOrCancel ? `
                          <button class="btn btn-secondary btn-sm btn-edit-corp-req" data-req-id="${req.id}" title="Редактировать заявку">
                            ✏️ Изменить
                          </button>
                          <button class="btn btn-secondary btn-sm btn-cancel-corp-req" data-req-id="${req.id}" style="color: var(--color-error);" title="Отменить заявку">
                            ❌ Отмена
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

    this.bindEvents(container);
  }

  static bindEvents(container) {
    container.querySelector('#btn-create-corp-request').addEventListener('click', () => {
      CorpOrderModal.open(() => this.render(container));
    });

    container.querySelectorAll('.btn-view-corp-req').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.reqId;
        CorpDetailsModal.open(id, false, () => this.render(container));
      });
    });

    container.querySelectorAll('.btn-edit-corp-req').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.reqId;
        CorpOrderModal.open(() => this.render(container), id);
      });
    });

    container.querySelectorAll('.btn-cancel-corp-req').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.reqId;
        const req = db.getById('corpRequests', id);
        if (req && confirm(`Вы уверены, что хотите отменить заявку #${req.id.slice(-4)} на сумму ${req.totalSum} сом? Средства вернутся на баланс.`)) {
          db.update('corpRequests', req.id, { status: 'cancelled' });
          
          // Возврат средств на баланс
          const org = AuthManager.getActiveOrganization();
          if (org) {
            db.update('organizations', org.id, { currentBalance: (org.currentBalance || 0) + req.totalSum });
          }

          showToast(`Заявка #${req.id.slice(-4)} отменена. Средства (+${req.totalSum} сом) возвращены на баланс!`, 'info');
          this.render(container);
        }
      });
    });
  }
}
