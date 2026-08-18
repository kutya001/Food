/**
 * CORP-DETAILS-MODAL.JS — Просмотр спецификации корпоративной заявки и управление статусом
 */

import { db } from '../state/db.js';
import { showToast } from './toast.js';

export class CorpDetailsModal {
  static open(requestId, canChangeStatus = false, onSuccess = null) {
    const req = db.getById('corpRequests', requestId);
    if (!req) return;

    const org = db.getById('organizations', req.orgId) || { name: 'Организация-заказчик', phone: '+996 555 11-22-33' };
    const est = db.getById('establishments', req.estId) || { name: 'Столовая «Свежесть»' };

    let backdrop = document.getElementById('corp-details-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'corp-details-backdrop';
      backdrop.className = 'modal-backdrop';
      document.body.appendChild(backdrop);
    }

    const getStatusBadge = (status) => {
      switch (status) {
        case 'new': return '<span class="badge badge-primary">⏳ Новая заявка</span>';
        case 'accepted': return '<span class="badge badge-secondary" style="background:var(--color-primary); color:#fff;">🤝 Принята</span>';
        case 'cooking': return '<span class="badge badge-warning">👨‍🍳 Готовится на кухне</span>';
        case 'ready': return '<span class="badge badge-accent">🍱 Готово к отправке</span>';
        case 'on_way': return '<span class="badge badge-secondary" style="background:#0284c7; color:#fff;">🚚 В пути (доставка)</span>';
        case 'delivered': return '<span class="badge badge-success">🎉 Доставлено / Выдано</span>';
        case 'cancelled': return '<span class="badge badge-error">❌ Отменена</span>';
        default: return `<span class="badge badge-secondary">${status}</span>`;
      }
    };

    backdrop.innerHTML = `
      <div class="modal-dialog" style="max-width: 620px;" role="dialog">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">📄 Спецификация заявки #${req.id.slice(-6)}</h3>
            <p class="text-xs text-muted">${org.name} · ${est.name} · Доставка на ${req.date || req.targetDate || '2026-08-19'} (${req.timeSlot || '12:30'})</p>
          </div>
          <button class="modal-close-btn" id="close-corp-details-modal">✕</button>
        </div>

        <div class="modal-body">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-4); background:var(--color-surface-alt); padding:var(--space-3); border-radius:var(--radius-md); border:1px solid var(--color-border);">
            <div>
              <span class="text-xs text-muted">Текущий статус:</span>
              <div style="margin-top:2px;">${getStatusBadge(req.status)}</div>
            </div>
            <div style="text-align:right;">
              <span class="text-xs text-muted">Сумма заявки:</span>
              <div style="font-size:var(--font-size-xl); font-weight:var(--font-weight-extrabold); color:var(--color-primary);">
                ${req.totalSum.toLocaleString('ru-RU')} сом
              </div>
            </div>
          </div>

          <!-- Спецификация блюд по отделам -->
          <h4 style="font-size:var(--font-size-xs); text-transform:uppercase; color:var(--color-text-secondary); margin-bottom:var(--space-2);">
            🍱 Позиции питания по отделам:
          </h4>
          <table class="recipe-builder-table" style="margin-bottom:var(--space-4);">
            <thead>
              <tr>
                <th>Наименование блюда</th>
                <th>Отдел</th>
                <th>Порций</th>
                <th style="text-align:right;">Сумма</th>
              </tr>
            </thead>
            <tbody>
              ${(req.items || []).map(item => `
                <tr>
                  <td><strong>${item.name}</strong></td>
                  <td><span class="badge badge-secondary">${item.department || item.dept || 'Офис'}</span></td>
                  <td>${item.qty || item.portions || 1} шт</td>
                  <td style="text-align:right;"><strong>${(item.total || ((item.price || item.corpPrice || 150) * (item.qty || item.portions || 1))).toLocaleString('ru-RU')} сом</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Управление статусом для общепита -->
          ${canChangeStatus ? `
            <div style="border-top:1px solid var(--color-border); padding-top:var(--space-3); margin-top:var(--space-4);">
              <label class="form-label">Изменить статус заявки:</label>
              <div style="display:flex; gap:var(--space-2); flex-wrap:wrap;">
                <button class="btn btn-primary btn-sm btn-set-status" data-status="accepted">
                  🤝 Принять
                </button>
                <button class="btn btn-warning btn-sm btn-set-status" data-status="cooking">
                  👨‍🍳 На кухню
                </button>
                <button class="btn btn-accent btn-sm btn-set-status" data-status="ready">
                  🍱 Готово к отправке
                </button>
                <button class="btn btn-primary btn-sm btn-set-status" data-status="on_way" style="background:#0284c7;">
                  🚚 В пути
                </button>
                <button class="btn btn-success btn-sm btn-set-status" data-status="delivered">
                  🎉 Доставлено
                </button>
                <button class="btn btn-secondary btn-sm btn-set-status" data-status="cancelled" style="color:var(--color-error);">
                  ❌ Отменить
                </button>
              </div>
            </div>
          ` : ''}

          <div style="margin-top:var(--space-4); display:flex; justify-content:flex-end;">
            <button class="btn btn-secondary" id="ok-corp-details-btn">
              Закрыть
            </button>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => backdrop.classList.add('open'), 10);

    backdrop.querySelectorAll('.btn-set-status').forEach(btn => {
      btn.addEventListener('click', () => {
        const newStatus = btn.dataset.status;
        db.update('corpRequests', req.id, { status: newStatus });
        
        if (newStatus === 'cancelled') {
          const org = db.getById('organizations', req.orgId);
          if (org) {
            db.update('organizations', org.id, { currentBalance: (org.currentBalance || 0) + req.totalSum });
          }
        }

        showToast('Статус корпоративной заявки обновлен!', 'success');
        backdrop.classList.remove('open');
        setTimeout(() => backdrop.remove(), 250);
        if (onSuccess) onSuccess();
      });
    });

    backdrop.querySelector('#close-corp-details-modal').addEventListener('click', () => {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);
    });

    backdrop.querySelector('#ok-corp-details-btn').addEventListener('click', () => {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);
    });
  }
}
