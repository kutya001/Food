import { ThemeManager, THEMES } from '../theme/themeManager.js';
import { AuthManager } from '../state/auth.js';
import { CartDrawer } from './cartDrawer.js';
import { UserNutritionModal } from './userNutritionModal.js';
import { showToast } from './toast.js';

export const ROLES = {
  'client': { key: 'client', name: 'Клиент (B2C)', icon: '👤', defaultTheme: 'fresh' },
  'business': { key: 'business', name: 'Общепит (B2B Учёт)', icon: '🍳', defaultTheme: 'corporate' },
  'pos': { key: 'pos', name: 'POS Касса', icon: '💻', defaultTheme: 'neo-dark' },
  'corporate': { key: 'corporate', name: 'Орг.-заказчик', icon: '🏢', defaultTheme: 'corporate' },
  'admin': { key: 'admin', name: 'Администратор', icon: '⚙️', defaultTheme: 'corporate' }
};

export class Header {
  static render(container) {
    const currentThemeKey = ThemeManager.getCurrentTheme();
    const currentTheme = THEMES[currentThemeKey] || THEMES.fresh;
    const activeRoleKey = AuthManager.getActiveRole();
    const roleData = ROLES[activeRoleKey] || ROLES.client;

    container.innerHTML = `
      <header class="site-header">
        <div class="container header-container">
          <!-- Логотип -->
          <a href="#/showcase" class="brand-logo">
            <div class="brand-icon">🍲</div>
            <span>FoodFlow</span>
          </a>

          <!-- Навигация -->
          <nav class="main-nav" id="header-nav">
            <a href="#/showcase" class="nav-link active" data-route="showcase">Витрина</a>
            <a href="#/business" class="nav-link" data-route="business">Бизнес</a>
            <a href="#/pos" class="nav-link" data-route="pos">POS-Касса</a>
            <a href="#/corporate" class="nav-link" data-route="corporate">Корпоративное</a>
            <a href="#/admin" class="nav-link" data-route="admin">Админ</a>
            <a href="#/db-viewer" class="nav-link" data-route="db-viewer" title="Управление базой данных">💾 База данных</a>
          </nav>

          <!-- Действия -->
          <div class="header-actions">
            <!-- КБЖУ дневник здоровья -->
            <button class="btn btn-secondary btn-sm" id="header-nutrition-btn" title="Дневник питания и КБЖУ">
              🍏 КБЖУ
            </button>

            <!-- Селектор роли -->
            <button class="role-pill" id="role-selector-btn" title="Переключить контекст роли">
              <span class="role-dot"></span>
              <span id="header-role-name">${roleData.icon} ${roleData.name}</span>
            </button>

            <!-- Кнопка выбора темы -->
            <button class="theme-toggle-btn" id="theme-selector-btn" title="Выбрать цветовую тему">
              <span class="theme-swatch-icon" id="header-theme-swatch" style="background-color: ${currentTheme.primary}"></span>
              <span id="header-theme-name">${currentTheme.name}</span>
            </button>

            <!-- Корзина -->
            <button class="cart-btn" id="header-cart-btn" title="Корзина заказа">
              🛒
              <span class="cart-badge" id="cart-count">2</span>
            </button>
          </div>
        </div>
      </header>
    `;

    this.bindEvents(container);
  }

  static bindEvents(container) {
    // Кнопка выбора темы
    const themeBtn = container.querySelector('#theme-selector-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        ThemeManager.openThemeModal();
      });
    }

    // Кнопка смены роли
    const roleBtn = container.querySelector('#role-selector-btn');
    if (roleBtn) {
      roleBtn.addEventListener('click', () => {
        this.openRoleModal();
      });
    }

    // Кнопка КБЖУ дневника
    const nutritionBtn = container.querySelector('#header-nutrition-btn');
    if (nutritionBtn) {
      nutritionBtn.addEventListener('click', () => {
        UserNutritionModal.open();
      });
    }

    // Кнопка корзины
    const cartBtn = container.querySelector('#header-cart-btn');
    if (cartBtn) {
      cartBtn.addEventListener('click', () => {
        CartDrawer.open();
      });
    }

    CartDrawer.updateHeaderBadge();

    // Слушатель смены темы
    window.addEventListener('themeChanged', (e) => {
      const themeKey = e.detail.theme;
      const themeData = THEMES[themeKey];
      const nameEl = document.getElementById('header-theme-name');
      const swatchEl = document.getElementById('header-theme-swatch');

      if (nameEl && themeData) nameEl.textContent = themeData.name;
      if (swatchEl && themeData) swatchEl.style.backgroundColor = themeData.primary;
    });

    // Слушатель смены роли
    window.addEventListener('roleChanged', (e) => {
      const roleKey = e.detail.role;
      const roleData = ROLES[roleKey] || ROLES.client;
      const roleNameEl = document.getElementById('header-role-name');
      if (roleNameEl) {
        roleNameEl.textContent = `${roleData.icon} ${roleData.name}`;
      }
    });
  }

  static openRoleModal() {
    let modalBackdrop = document.getElementById('role-modal-backdrop');
    if (!modalBackdrop) {
      modalBackdrop = document.createElement('div');
      modalBackdrop.id = 'role-modal-backdrop';
      modalBackdrop.className = 'modal-backdrop';
      document.body.appendChild(modalBackdrop);
    }

    const activeRole = AuthManager.getActiveRole();
    const activeEst = AuthManager.getActiveEstablishment();
    const activeOrg = AuthManager.getActiveOrganization();

    modalBackdrop.innerHTML = `
      <div class="modal-dialog" style="max-width:540px;">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">🔄 Переключение роли и профиля</h3>
            <p class="text-sm text-muted" style="margin-top:4px;">Единый аккаунт — мгновенное переключение контекста</p>
          </div>
          <button class="modal-close-btn" id="close-role-modal">✕</button>
        </div>
        <div class="modal-body">
          <div class="themes-grid" style="margin-bottom: var(--space-4);">
            ${Object.values(ROLES).map(r => `
              <div class="theme-card-option ${r.key === activeRole ? 'active' : ''}" data-role-key="${r.key}" style="grid-template-columns: 36px 1fr auto;">
                <div style="font-size: 24px; display:grid; place-items:center;">${r.icon}</div>
                <div class="theme-info-col">
                  <h4>${r.name}</h4>
                  <small class="text-muted">Тема по умолчанию: ${THEMES[r.defaultTheme].name}</small>
                </div>
                <div class="theme-check-icon">✓</div>
              </div>
            `).join('')}
          </div>

          <!-- Дополнительный контекст -->
          <div style="padding: var(--space-3); background: var(--color-surface-alt); border-radius: var(--radius-md); border: 1px solid var(--color-border); font-size: var(--font-size-xs);">
            <div style="margin-bottom: 4px;"><strong>Активное заведение (Общепит):</strong> ${activeEst ? activeEst.name : '—'}</div>
            <div><strong>Активная организация (Заказчик):</strong> ${activeOrg ? activeOrg.name : '—'}</div>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => modalBackdrop.classList.add('open'), 10);

    modalBackdrop.querySelectorAll('.theme-card-option').forEach(card => {
      card.addEventListener('click', () => {
        const roleKey = card.dataset.roleKey;
        AuthManager.switchRole(roleKey);
        modalBackdrop.classList.remove('open');
        setTimeout(() => modalBackdrop.remove(), 250);
      });
    });

    modalBackdrop.querySelector('#close-role-modal').addEventListener('click', () => {
      modalBackdrop.classList.remove('open');
      setTimeout(() => modalBackdrop.remove(), 250);
    });
  }
}
