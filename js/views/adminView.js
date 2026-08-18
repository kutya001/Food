/**
 * ADMIN-VIEW.JS — Главная панель суперадминистратора платформы FoodFlow
 */

import { db } from '../state/db.js';
import { ExportService } from '../services/exportService.js';
import { showToast } from '../components/toast.js';

export class AdminView {
  static activeTab = 'establishments'; // 'establishments' | 'orgs' | 'classifiers' | 'backup'

  static render(container) {
    const establishments = db.getCollection('establishments');
    const organizations = db.getCollection('organizations');
    const orders = db.getCollection('orders');
    const menuItems = db.getCollection('menuItems');

    // Расчет сводных метрик платформы в сомах
    const totalGmv = orders.reduce((sum, o) => sum + (o.totalSum || 0), 0);
    const platformCommission = Math.round(totalGmv * 0.10); // 10% комиссия платформы

    container.innerHTML = `
      <div class="container">
        <!-- Шапка администратора -->
        <div class="admin-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--space-4);">
          <div>
            <div style="display: flex; gap: var(--space-2); margin-bottom: 4px;">
              <span class="badge badge-accent">Суперадминистратор</span>
              <span class="badge badge-success">Система онлайн</span>
            </div>
            <h1 style="font-size: var(--font-size-2xl); margin: 0;">🛡️ Панель управления FoodFlow</h1>
            <p class="text-xs text-muted" style="margin-top: 2px;">Мониторинг GMV, верификация партнеров, управление B2B-контрактами и классификаторами</p>
          </div>

          <div style="display: flex; gap: var(--space-2);">
            <button class="btn btn-secondary btn-sm" id="btn-admin-export-db">
              📥 Резервная копия (JSON)
            </button>
            <a href="#/db-viewer" class="btn btn-primary btn-sm">
              🔍 Инспектор БД →
            </a>
          </div>
        </div>

        <!-- Сводные KPI платформы -->
        <div class="admin-kpi-grid">
          <div class="kpi-stat-card">
            <span class="text-xs text-muted">Совокупный GMV:</span>
            <div class="kpi-stat-value" style="color: var(--color-primary);">${totalGmv} сом</div>
            <small class="text-muted" style="font-size:11px; margin-top:4px;">Все транзакции платформы</small>
          </div>
          <div class="kpi-stat-card">
            <span class="text-xs text-muted">Комиссия сервиса (10%):</span>
            <div class="kpi-stat-value" style="color: var(--color-success);">${platformCommission} сом</div>
            <small class="text-muted" style="font-size:11px; margin-top:4px;">Выручка платформы</small>
          </div>
          <div class="kpi-stat-card">
            <span class="text-xs text-muted">Партнёров общепита:</span>
            <div class="kpi-stat-value">${establishments.length} объекта</div>
            <small class="text-muted" style="font-size:11px; margin-top:4px;">Верифицированные заведения</small>
          </div>
          <div class="kpi-stat-card">
            <span class="text-xs text-muted">B2B Корп. клиентов:</span>
            <div class="kpi-stat-value">${organizations.length} компаний</div>
            <small class="text-muted" style="font-size:11px; margin-top:4px;">Активные договоры</small>
          </div>
          <div class="kpi-stat-card">
            <span class="text-xs text-muted">Блюд в каталоге:</span>
            <div class="kpi-stat-value">${menuItems.length} поз.</div>
            <small class="text-muted" style="font-size:11px; margin-top:4px;">Агрегированное меню</small>
          </div>
        </div>

        <!-- Вкладки управления -->
        <div class="business-tabs">
          <button class="business-tab-btn ${this.activeTab === 'establishments' ? 'active' : ''}" data-admin-tab="establishments">
            🏪 Заведения общепита (${establishments.length})
          </button>
          <button class="business-tab-btn ${this.activeTab === 'orgs' ? 'active' : ''}" data-admin-tab="orgs">
            🏢 Корпоративные клиенты (${organizations.length})
          </button>
          <button class="business-tab-btn ${this.activeTab === 'classifiers' ? 'active' : ''}" data-admin-tab="classifiers">
            📚 Глобальные классификаторы
          </button>
        </div>

        <!-- Контейнер вкладки -->
        <div id="admin-tab-content" style="margin-top: var(--space-4);">
          <!-- Динамический рендер -->
        </div>
      </div>
    `;

    this.bindEvents(container);
    this.renderCurrentTab(container);
  }

  static renderCurrentTab(container) {
    const tabRoot = container.querySelector('#admin-tab-content');
    if (!tabRoot) return;

    if (this.activeTab === 'establishments') {
      const list = db.getCollection('establishments');
      tabRoot.innerHTML = `
        <div class="warehouse-table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Наименование заведения</th>
                <th>Тип</th>
                <th>Адрес</th>
                <th>Координаты</th>
                <th>Статус</th>
                <th style="text-align: right;">Модерация</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(est => `
                <tr>
                  <td><strong>🏠 ${est.name}</strong></td>
                  <td><span class="badge badge-secondary">${est.type}</span></td>
                  <td>${est.address}</td>
                  <td><small class="text-muted">${est.coordinates.lat}, ${est.coordinates.lng}</small></td>
                  <td>
                    <span class="badge ${est.status === 'active' ? 'badge-success' : 'badge-warning'}">
                      ${est.status === 'active' ? 'Активно' : 'На модерации'}
                    </span>
                  </td>
                  <td style="text-align: right;">
                    <button class="btn btn-secondary btn-sm btn-toggle-est-status" data-est-id="${est.id}">
                      ${est.status === 'active' ? '⏸️ Приостановить' : '✅ Активировать'}
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      tabRoot.querySelectorAll('.btn-toggle-est-status').forEach(btn => {
        btn.addEventListener('click', () => {
          const est = db.getById('establishments', btn.dataset.estId);
          if (est) {
            const nextStatus = est.status === 'active' ? 'pending' : 'active';
            db.update('establishments', est.id, { status: nextStatus });
            showToast(`Статус заведения «${est.name}» изменён на: ${nextStatus}`, 'info');
            this.renderCurrentTab(container);
          }
        });
      });

    } else if (this.activeTab === 'orgs') {
      const orgs = db.getCollection('organizations');
      tabRoot.innerHTML = `
        <div class="warehouse-table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Организация</th>
                <th>Сотрудников</th>
                <th>Месячный лимит</th>
                <th>Остаток баланса</th>
                <th>Договор до</th>
                <th style="text-align: right;">Управление</th>
              </tr>
            </thead>
            <tbody>
              ${orgs.map(org => `
                <tr>
                  <td><strong>🏢 ${org.name}</strong></td>
                  <td>${org.employeeCount} чел.</td>
                  <td><strong>${org.budgetMonthly} сом</strong></td>
                  <td><strong style="color: var(--color-success);">${org.currentBalance} сом</strong></td>
                  <td>${org.contractEnd}</td>
                  <td style="text-align: right;">
                    <button class="btn btn-secondary btn-sm btn-topup-org" data-org-id="${org.id}">
                      💳 Пополнить лимит (+10 000 сом)
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      tabRoot.querySelectorAll('.btn-topup-org').forEach(btn => {
        btn.addEventListener('click', () => {
          const org = db.getById('organizations', btn.dataset.orgId);
          if (org) {
            db.update('organizations', org.id, { currentBalance: org.currentBalance + 10000 });
            showToast(`Лимит компании «${org.name}» пополнен на +10 000 сом!`, 'success');
            this.renderCurrentTab(container);
          }
        });
      });

    } else if (this.activeTab === 'classifiers') {
      tabRoot.innerHTML = `
        <div class="grid grid-cols-3" style="gap: var(--space-4);">
          <!-- Категории -->
          <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-4);">
            <h4 style="margin: 0 0 var(--space-3) 0;">📂 Категории блюд:</h4>
            <ul style="padding-left: 20px; font-size: var(--font-size-sm); display: flex; flex-direction: column; gap: 6px;">
              <li>🍲 Первые блюда и Супы</li>
              <li>🥗 Свежие салаты и закуски</li>
              <li>🍛 Вторые горячие блюда</li>
              <li>🍔 Бургеры и Фастфуд</li>
              <li>🥩 Стейки & Мангал</li>
            </ul>
          </div>

          <!-- Единицы измерения -->
          <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-4);">
            <h4 style="margin: 0 0 var(--space-3) 0;">⚖️ Единицы измерения:</h4>
            <ul style="padding-left: 20px; font-size: var(--font-size-sm); display: flex; flex-direction: column; gap: 6px;">
              <li><strong>кг</strong> — Килограмм (масса брутто/нетто)</li>
              <li><strong>л</strong> — Литр (жидкие ингредиенты)</li>
              <li><strong>шт</strong> — Штучные компоненты (булочки, яйца)</li>
              <li><strong>порц</strong> — Готовые порции выхода</li>
            </ul>
          </div>

          <!-- Аллергены -->
          <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-4);">
            <h4 style="margin: 0 0 var(--space-3) 0;">⚠️ Справочник аллергенов:</h4>
            <ul style="padding-left: 20px; font-size: var(--font-size-sm); display: flex; flex-direction: column; gap: 6px;">
              <li>🌾 Глютен (злаковые)</li>
              <li>🥛 Лактоза (молочные продукты)</li>
              <li>🥜 Орехи и арахис</li>
              <li>🥚 Яйца и меланж</li>
              <li>🐟 Рыба и морепродукты</li>
            </ul>
          </div>
        </div>
      `;
    }
  }

  static bindEvents(container) {
    container.querySelectorAll('[data-admin-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.adminTab;
        container.querySelectorAll('[data-admin-tab]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderCurrentTab(container);
      });
    });

    container.querySelector('#btn-admin-export-db').addEventListener('click', () => {
      ExportService.exportDatabaseToFile();
      showToast('База данных платформы FoodFlow выгружена в JSON', 'success');
    });
  }
}
