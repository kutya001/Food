/**
 * APP.JS — Главная точка входа приложения FoodFlow
 * Инициализирует базу данных, роли, темы, SPA-роутер и экраны
 */

import { db } from './state/db.js';
import { AuthManager } from './state/auth.js';
import { ThemeManager, THEMES } from './theme/themeManager.js';
import { Header } from './components/header.js';
import { Router } from './router.js';
import { ExportService } from './services/exportService.js';
import { showToast } from './components/toast.js';

class App {
  static init() {
    // 1. Инициализация базы данных и темы
    ThemeManager.init();

    // 2. Рендер шапки
    const headerRoot = document.getElementById('header-root');
    if (headerRoot) {
      Header.render(headerRoot);
    }

    // 3. Регистрация маршрутов в Router
    this.registerRoutes();

    // 4. Запуск роутера
    Router.init();

    console.log('🚀 FoodFlow — Этап 2: База данных, Мультиролевость и Роутер запущены');
  }

  static registerRoutes() {
    // 1. Витрина (Showcase)
    Router.register('showcase', (container) => this.renderShowcaseView(container));

    // 2. Бизнес (Общепит)
    Router.register('business', (container) => this.renderBusinessView(container));

    // 3. POS-Касса
    Router.register('pos', (container) => this.renderPosView(container));

    // 4. Корпоративное (Организация-заказчик)
    Router.register('corporate', (container) => this.renderCorporateView(container));

    // 5. Админ (Управление платформой)
    Router.register('admin', (container) => this.renderAdminView(container));

    // 6. Управление базой данных (DB Viewer & JSON Backup)
    Router.register('db-viewer', (container) => this.renderDbViewerView(container));
  }

  // =========================================================================
  // ЭКРАН 1: ВИТРИНА (SHOWCASE)
  // =========================================================================
  static renderShowcaseView(container) {
    const menuItems = db.getCollection('menuItems');
    const establishments = db.getCollection('establishments');
    const activeEst = AuthManager.getActiveEstablishment();

    container.innerHTML = `
      <div class="container">
        <!-- Hero баннер витрины -->
        <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: var(--space-8); margin-bottom: var(--space-8); box-shadow: var(--shadow-card); display: grid; grid-template-columns: 1fr auto; gap: var(--space-6); align-items: center;">
          <div>
            <div style="display: flex; gap: var(--space-2); margin-bottom: var(--space-2);">
              <span class="badge badge-primary">Онлайн-витрина общепита</span>
              <span class="badge badge-accent">B2C + B2B</span>
            </div>
            <h1 style="font-size: var(--font-size-2xl); margin-bottom: var(--space-2);">Горячая еда, меню столовых и ресторанов</h1>
            <p class="lead" style="margin-bottom: var(--space-4);">
              Выбирайте любимые блюда по заведениям, категориям и КБЖУ. Основной расчёт в сомах (сом).
            </p>
            <div style="display: flex; gap: var(--space-3); max-width: 540px;">
              <input type="text" class="input" placeholder="🔍 Найти плов, лагман, борщ, бургер..." id="showcase-search-input">
              <button class="btn btn-primary" id="search-btn">Найти</button>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: var(--space-2); background: var(--color-surface-alt); padding: var(--space-4); border-radius: var(--radius-lg); border: 1px solid var(--color-border); min-width: 220px;">
            <span class="text-xs text-muted">Заведений на платформе:</span>
            <div style="font-size: var(--font-size-xl); font-weight: var(--font-weight-extrabold); color: var(--color-primary);">${establishments.length} точки</div>
            <span class="text-xs text-muted">Блюд в каталоге:</span>
            <div style="font-size: var(--font-size-lg); font-weight: var(--font-weight-bold);">${menuItems.length} позиций</div>
          </div>
        </div>

        <!-- Каталог блюд из БД -->
        <div style="margin-bottom: var(--space-6); display: flex; justify-content: space-between; align-items: center;">
          <h2>🍽️ Популярные блюда дня</h2>
          <span class="text-sm text-muted">Синхронизировано с базой данных</span>
        </div>

        <div class="grid grid-cols-3" id="showcase-grid">
          ${menuItems.map(item => {
            const est = establishments.find(e => e.id === item.estId) || { name: 'Общепит' };
            const techCard = db.getById('techCards', item.techCardId) || { calculatedKbju: { calories: 350, protein: 15, fat: 12, carbs: 30 } };
            const kbju = techCard.calculatedKbju;

            return `
              <div class="card card-clickable">
                <div class="card-header">
                  <div style="display: flex; align-items: center; gap: var(--space-2);">
                    <span style="font-size: 2rem;">${item.photoIcon || '🍲'}</span>
                    <div>
                      <h3 style="font-size: var(--font-size-md); margin-bottom: 2px;">${item.name}</h3>
                      <small class="text-muted">${est.name} · ${item.category}</small>
                    </div>
                  </div>
                </div>
                <p style="font-size: var(--font-size-sm); color: var(--color-text-secondary); min-height: 40px;">
                  ${item.description}
                </p>
                <div style="display: flex; gap: 4px; margin-bottom: var(--space-4); flex-wrap: wrap;">
                  <span class="badge badge-primary">${kbju.calories} ккал</span>
                  <span class="badge badge-secondary" style="background:var(--color-surface-alt);">Б: ${kbju.protein}г</span>
                  <span class="badge badge-secondary" style="background:var(--color-surface-alt);">Ж: ${kbju.fat}г</span>
                  <span class="badge badge-secondary" style="background:var(--color-surface-alt);">У: ${kbju.carbs}г</span>
                  ${item.dietary?.includes('halal') ? '<span class="badge badge-success">Халяль</span>' : ''}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: var(--space-3); border-top: 1px solid var(--color-border);">
                  <div>
                    <span class="text-xs text-muted" style="display: block;">Порция ${item.portionWeight || '350 г'}</span>
                    <strong style="font-size: var(--font-size-lg); color: var(--color-primary);">${item.retailPrice} сом</strong>
                  </div>
                  <button class="btn btn-accent btn-sm add-order-btn" data-item-id="${item.id}">
                    🛒 В заказ
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Слушатели событий
    container.querySelectorAll('.add-order-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const itemId = btn.dataset.itemId;
        const item = db.getById('menuItems', itemId);
        if (item) {
          showToast(`«${item.name}» добавлен в корзину (${item.retailPrice} сом)`, 'success');
        }
      });
    });

    const searchInput = container.querySelector('#showcase-search-input');
    const searchBtn = container.querySelector('#search-btn');
    const runSearch = () => {
      const q = searchInput.value.toLowerCase().trim();
      const filtered = db.query('menuItems', i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
      showToast(`Найдено блюд: ${filtered.length}`, 'info');
    };
    if (searchBtn && searchInput) {
      searchBtn.addEventListener('click', runSearch);
      searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') runSearch(); });
    }
  }

  // =========================================================================
  // ЭКРАН 2: БИЗНЕС (ОБЩЕПИТ)
  // =========================================================================
  static renderBusinessView(container) {
    const activeEst = AuthManager.getActiveEstablishment();
    const ingredients = db.query('ingredients', i => i.estId === activeEst?.id) || [];
    const techCards = db.query('techCards', tc => tc.estId === activeEst?.id) || [];
    const menuItems = db.query('menuItems', m => m.estId === activeEst?.id) || [];
    const lowStockItems = ingredients.filter(i => i.stockQty <= i.minStockQty);

    container.innerHTML = `
      <div class="container">
        <!-- Шапка кабинета общепита -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-4);">
          <div>
            <span class="badge badge-primary" style="margin-bottom: var(--space-1);">Кабинет Общепита (B2B)</span>
            <h1>🍳 ${activeEst ? activeEst.name : 'Управление заведением'}</h1>
            <p class="text-sm text-muted">${activeEst ? activeEst.address : ''} · Статус: <span class="text-success text-bold">Открыто</span></p>
          </div>
          <div style="display: flex; gap: var(--space-2);">
            <button class="btn btn-primary btn-sm" id="biz-add-stock-btn">📦 Приход сырья</button>
            <button class="btn btn-secondary btn-sm" id="biz-add-recipe-btn">📝 Новая техкарта</button>
          </div>
        </div>

        <!-- Сводные метрики -->
        <div class="grid grid-cols-4" style="margin-bottom: var(--space-8);">
          <div class="card">
            <span class="text-xs text-muted">Сырьё на складе</span>
            <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-extrabold); color: var(--color-primary); margin: 4px 0;">${ingredients.length} поз.</div>
            <small class="text-muted">${lowStockItems.length > 0 ? `<span class="text-error">⚠️ ${lowStockItems.length} малый запас</span>` : '✅ Все остатки в норме'}</small>
          </div>
          <div class="card">
            <span class="text-xs text-muted">Технологических карт</span>
            <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-extrabold); color: var(--color-accent); margin: 4px 0;">${techCards.length} рецептов</div>
            <small class="text-muted">Включая полуфабрикаты</small>
          </div>
          <div class="card">
            <span class="text-xs text-muted">Позиций в меню</span>
            <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-extrabold); margin: 4px 0;">${menuItems.length} блюд</div>
            <small class="text-muted">Цены в сомах (сом)</small>
          </div>
          <div class="card">
            <span class="text-xs text-muted">Заказов за смену</span>
            <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-extrabold); color: var(--color-success); margin: 4px 0;">38 чеков</div>
            <small class="text-muted">Выручка: 42 500 сом</small>
          </div>
        </div>

        <!-- Таблица сырья и остатков -->
        <div class="card">
          <div class="card-header">
            <h3>📦 Складские остатки ингредиентов (в сомах)</h3>
            <span class="badge badge-info">Склад № 1</span>
          </div>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: var(--font-size-sm);">
              <thead>
                <tr style="border-bottom: 2px solid var(--color-border); text-align: left;">
                  <th style="padding: 10px;">Наименование сырья</th>
                  <th style="padding: 10px;">Категория</th>
                  <th style="padding: 10px;">Закупочная цена</th>
                  <th style="padding: 10px;">Текущий остаток</th>
                  <th style="padding: 10px;">Мин. запас</th>
                  <th style="padding: 10px;">Статус</th>
                </tr>
              </thead>
              <tbody>
                ${ingredients.map(ing => `
                  <tr style="border-bottom: 1px solid var(--color-border);">
                    <td style="padding: 10px; font-weight: var(--font-weight-bold);">${ing.name}</td>
                    <td style="padding: 10px; color: var(--color-text-secondary);">${ing.category}</td>
                    <td style="padding: 10px; font-weight: var(--font-weight-bold); color: var(--color-primary);">${ing.purchasePrice} сом / ${ing.unit}</td>
                    <td style="padding: 10px; font-weight: var(--font-weight-extrabold);">${ing.stockQty} ${ing.unit}</td>
                    <td style="padding: 10px; color: var(--color-text-secondary);">${ing.minStockQty} ${ing.unit}</td>
                    <td style="padding: 10px;">
                      ${ing.stockQty <= ing.minStockQty 
                        ? '<span class="badge badge-error">Мало</span>' 
                        : '<span class="badge badge-success">В норме</span>'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#biz-add-stock-btn').addEventListener('click', () => {
      showToast('Модуль полноценного складского учета будет развернут на Этапе 4', 'info');
    });

    container.querySelector('#biz-add-recipe-btn').addEventListener('click', () => {
      showToast('Конструктор техкарт будет развернут на Этапе 4', 'info');
    });
  }

  // =========================================================================
  // ЭКРАН 3: POS-ТЕРМИНАЛ (КАССА)
  // =========================================================================
  static renderPosView(container) {
    const shift = db.getById('posShifts', 'shift_42') || { cashierName: 'Кассир', totalRevenue: 42500, receiptsCount: 38, status: 'open' };
    const menuItems = db.getCollection('menuItems');

    container.innerHTML = `
      <div class="container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-4);">
          <div>
            <span class="badge badge-accent" style="margin-bottom: var(--space-1);">POS-Терминал (Touch UI)</span>
            <h1>💻 Рабочее место кассира</h1>
            <p class="text-sm text-muted">Смена № 42 · Кассир: ${shift.cashierName} · Режим: <span class="badge badge-success">Смена открыта</span></p>
          </div>
          <div style="display: flex; gap: var(--space-2);">
            <button class="btn btn-secondary btn-sm" id="pos-x-report">📊 X-Отчёт</button>
            <button class="btn btn-primary btn-sm" id="pos-z-report">🔒 Закрыть смену (Z-Отчёт)</button>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 340px; gap: var(--space-6);">
          <!-- Сетка быстрого выбора блюд -->
          <div>
            <div class="card" style="margin-bottom: var(--space-4);">
              <div style="display: flex; gap: var(--space-2); margin-bottom: var(--space-4); overflow-x: auto; padding-bottom: 4px;">
                <button class="btn btn-primary btn-sm">Все</button>
                <button class="btn btn-secondary btn-sm">Вторые блюда</button>
                <button class="btn btn-secondary btn-sm">Супы</button>
                <button class="btn btn-secondary btn-sm">Салаты</button>
                <button class="btn btn-secondary btn-sm">Бургеры</button>
              </div>
              <div class="grid grid-cols-3">
                ${menuItems.map(item => `
                  <div class="card card-clickable" style="padding: var(--space-3); text-align: center;" data-pos-item-id="${item.id}">
                    <div style="font-size: 2rem; margin-bottom: 4px;">${item.photoIcon || '🍲'}</div>
                    <strong style="font-size: var(--font-size-sm); display: block;">${item.name}</strong>
                    <div style="color: var(--color-primary); font-weight: var(--font-weight-extrabold); margin-top: 4px;">${item.retailPrice} сом</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Текущий чек -->
          <div>
            <div class="card" style="position: sticky; top: 80px;">
              <div class="card-header">
                <h3>🧾 Чек № 102</h3>
                <span class="badge badge-info">Новый чек</span>
              </div>
              <div style="min-height: 180px; border-bottom: 1px dashed var(--color-border); padding-bottom: var(--space-3); margin-bottom: var(--space-3);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: var(--font-size-sm);">
                  <span>1. Плов чайханский x1</span>
                  <strong>280 сом</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: var(--font-size-sm);">
                  <span>2. Салат «Ачучук» x1</span>
                  <strong>120 сом</strong>
                </div>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
                <span style="font-size: var(--font-size-md); font-weight: var(--font-weight-bold);">Итого к оплате:</span>
                <strong style="font-size: var(--font-size-2xl); color: var(--color-primary);">400 сом</strong>
              </div>
              <div style="display: flex; flex-direction: column; gap: var(--space-2);">
                <button class="btn btn-accent btn-lg" id="pos-pay-cash">💵 Оплата наличными</button>
                <button class="btn btn-primary" id="pos-pay-card">💳 Банковская карта</button>
                <button class="btn btn-secondary btn-sm" id="pos-pay-corp">🏢 Счёт организации</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll('[data-pos-item-id]').forEach(card => {
      card.addEventListener('click', () => {
        const itemId = card.dataset.posItemId;
        const item = db.getById('menuItems', itemId);
        if (item) {
          showToast(`Добавлено в кассовый чек: ${item.name}`, 'info');
        }
      });
    });

    container.querySelector('#pos-pay-cash').addEventListener('click', () => {
      showToast('Чек на 400 сом пробит! Списание сырья по техкартам выполнено.', 'success');
    });
    container.querySelector('#pos-pay-card').addEventListener('click', () => {
      showToast('Безналичная оплата 400 сом успешна.', 'success');
    });
    container.querySelector('#pos-x-report').addEventListener('click', () => {
      showToast('X-Отчёт: Наличные 18 400 сом, Безналичные 24 100 сом. Всего: 42 500 сом', 'info');
    });
    container.querySelector('#pos-z-report').addEventListener('click', () => {
      showToast('Z-Отчёт сформирован. Смена закрыта.', 'warning');
    });
  }

  // =========================================================================
  // ЭКРАН 4: КОРПОРАТИВНОЕ (ОРГАНИЗАЦИЯ-ЗАКАЗЧИК)
  // =========================================================================
  static renderCorporateView(container) {
    const activeOrg = AuthManager.getActiveOrganization();
    const corpRequests = db.getCollection('corpRequests');

    container.innerHTML = `
      <div class="container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-4);">
          <div>
            <span class="badge badge-primary" style="margin-bottom: var(--space-1);">Корпоративный портал</span>
            <h1>🏢 ${activeOrg ? activeOrg.name : 'Кабинет заказчика'}</h1>
            <p class="text-sm text-muted">Сотрудников: ${activeOrg?.employeesCount || 0} · Дневной лимит: ${activeOrg?.dailyBudgetPerPerson || 0} сом/чел</p>
          </div>
          <button class="btn btn-accent btn-sm" id="create-corp-req-btn">➕ Создать заявку на питание</button>
        </div>

        <div class="grid grid-cols-3" style="margin-bottom: var(--space-8);">
          <div class="card">
            <span class="text-xs text-muted">Дневной лимит на сотрудника</span>
            <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-extrabold); color: var(--color-primary); margin: 4px 0;">${activeOrg?.dailyBudgetPerPerson || 350} сом</div>
            <small class="text-muted">Штат: ${activeOrg?.employeesCount || 45} человек</small>
          </div>
          <div class="card">
            <span class="text-xs text-muted">Израсходовано в этом месяце</span>
            <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-extrabold); color: var(--color-accent); margin: 4px 0;">${(activeOrg?.monthlySpent || 315000).toLocaleString()} сом</div>
            <small class="text-muted">Лимит: ${(activeOrg?.monthlyLimit || 450000).toLocaleString()} сом</small>
          </div>
          <div class="card">
            <span class="text-xs text-muted">Активный поставщик питания</span>
            <div style="font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); margin: 4px 0;">Столовая «Свежесть»</div>
            <small class="text-success">Договор № 44-B2B активен</small>
          </div>
        </div>

        <!-- Заявки на питание -->
        <div class="card">
          <div class="card-header">
            <h3>📋 Реестр корпоративных заявок</h3>
            <span class="badge badge-info">B2B Заявки</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: var(--space-3);">
            ${corpRequests.map(req => `
              <div style="padding: var(--space-4); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface-alt); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-3);">
                <div>
                  <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: 4px;">
                    <strong>Заявка #${req.id} на дату: ${req.targetDate}</strong>
                    <span class="badge badge-success">Подтверждена</span>
                  </div>
                  <p style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin: 0;">
                    Состав: ${req.items.map(i => `${i.name} (${i.portions} порц.)`).join(', ')}
                  </p>
                  <small class="text-muted">Примечание: ${req.comments}</small>
                </div>
                <div style="text-align: right;">
                  <span class="text-xs text-muted" style="display: block;">Сумма по корпоративному прайсу</span>
                  <strong style="font-size: var(--font-size-xl); color: var(--color-primary);">${req.totalSum.toLocaleString()} сом</strong>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    container.querySelector('#create-corp-req-btn').addEventListener('click', () => {
      showToast('Модуль формирования заявок будет развернут на этапе 6', 'info');
    });
  }

  // =========================================================================
  // ЭКРАН 5: АДМИНИСТРАТОР (ПЛАТФОРМА)
  // =========================================================================
  static renderAdminView(container) {
    const establishments = db.getCollection('establishments');
    const organizations = db.getCollection('organizations');
    const users = db.getCollection('users');

    container.innerHTML = `
      <div class="container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6);">
          <div>
            <span class="badge badge-primary" style="margin-bottom: var(--space-1);">Панель Администратора</span>
            <h1>⚙️ Управление платформой FoodFlow</h1>
            <p class="text-sm text-muted">Мониторинг заведений, пользователей, классификаторов и транзакций</p>
          </div>
        </div>

        <div class="grid grid-cols-3" style="margin-bottom: var(--space-8);">
          <div class="card">
            <span class="text-xs text-muted">Зарегистрировано общепитов</span>
            <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-extrabold); color: var(--color-primary); margin: 4px 0;">${establishments.length}</div>
            <small class="text-success">Все верифицированы</small>
          </div>
          <div class="card">
            <span class="text-xs text-muted">Организаций-заказчиков</span>
            <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-extrabold); color: var(--color-accent); margin: 4px 0;">${organizations.length}</div>
            <small class="text-muted">165 сотрудников в системе</small>
          </div>
          <div class="card">
            <span class="text-xs text-muted">Пользовательских аккаунтов</span>
            <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-extrabold); margin: 4px 0;">${users.length}</div>
            <small class="text-muted">Единый мультиролевой профиль</small>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>🏢 Заведения общепита на платформе</h3>
            <span class="badge badge-success">Реестр</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: var(--space-3);">
            ${establishments.map(e => `
              <div style="padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: var(--space-3);">
                  <span style="font-size: 1.8rem;">${e.icon}</span>
                  <div>
                    <strong>${e.name}</strong>
                    <div class="text-xs text-muted">${e.address} · Рейтинг: ${e.rating} ★</div>
                  </div>
                </div>
                <span class="badge badge-success">Активно</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // ЭКРАН 6: УПРАВЛЕНИЕ БАЗОЙ ДАННЫХ (DB VIEWER & JSON BACKUP)
  // =========================================================================
  static renderDbViewerView(container) {
    const rawJSON = db.exportJSON();
    const stats = {
      establishments: db.getCollection('establishments').length,
      ingredients: db.getCollection('ingredients').length,
      techCards: db.getCollection('techCards').length,
      menuItems: db.getCollection('menuItems').length,
      organizations: db.getCollection('organizations').length,
      orders: db.getCollection('orders').length
    };

    container.innerHTML = `
      <div class="container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-4);">
          <div>
            <span class="badge badge-primary" style="margin-bottom: var(--space-1);">Служебный раздел</span>
            <h1>💾 Управление клиентской базой данных</h1>
            <p class="text-sm text-muted">Полная персистентность в localStorage с поддержкой выгрузки и загрузки JSON</p>
          </div>
          <div style="display: flex; gap: var(--space-2); flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" id="export-json-btn">📥 Скачать JSON бэкап</button>
            <label class="btn btn-secondary btn-sm" style="cursor: pointer;">
              📤 Загрузить JSON
              <input type="file" id="import-json-input" accept=".json" style="display: none;">
            </label>
            <button class="btn btn-ghost btn-sm text-error" id="reset-db-btn">🔄 Сбросить к демо</button>
          </div>
        </div>

        <!-- Сводка коллекций -->
        <div class="grid grid-cols-3" style="margin-bottom: var(--space-6);">
          <div class="card" style="text-align: center;">
            <span class="text-xs text-muted">Заведений</span>
            <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-extrabold); color: var(--color-primary);">${stats.establishments}</div>
          </div>
          <div class="card" style="text-align: center;">
            <span class="text-xs text-muted">Ингредиентов (Склад)</span>
            <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-extrabold); color: var(--color-accent);">${stats.ingredients}</div>
          </div>
          <div class="card" style="text-align: center;">
            <span class="text-xs text-muted">Технологических карт</span>
            <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-extrabold);">${stats.techCards}</div>
          </div>
          <div class="card" style="text-align: center;">
            <span class="text-xs text-muted">Блюд меню</span>
            <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-extrabold);">${stats.menuItems}</div>
          </div>
          <div class="card" style="text-align: center;">
            <span class="text-xs text-muted">Организаций B2B</span>
            <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-extrabold);">${stats.organizations}</div>
          </div>
          <div class="card" style="text-align: center;">
            <span class="text-xs text-muted">Заказов</span>
            <div style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-extrabold); color: var(--color-success);">${stats.orders}</div>
          </div>
        </div>

        <!-- Просмотр JSON кода -->
        <div class="card">
          <div class="card-header">
            <h3>📋 Текущий снимок базы данных (JSON)</h3>
            <span class="badge badge-info">${rawJSON.length} байт</span>
          </div>
          <pre style="background: var(--color-surface-alt); padding: var(--space-4); border-radius: var(--radius-md); overflow: auto; max-height: 420px; font-family: var(--font-mono); font-size: var(--font-size-xs); line-height: 1.4; color: var(--color-text);">${rawJSON}</pre>
        </div>
      </div>
    `;

    container.querySelector('#export-json-btn').addEventListener('click', () => {
      ExportService.exportToFile();
    });

    container.querySelector('#import-json-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        ExportService.importFromFile(file).then(() => {
          this.renderDbViewerView(container);
        });
      }
    });

    container.querySelector('#reset-db-btn').addEventListener('click', () => {
      ExportService.resetToSeed();
    });
  }
}

// Запуск приложения при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
