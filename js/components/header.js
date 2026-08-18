/**
 * HEADER.JS — Компонент шапки приложения с динамической RBAC-навигацией, ролями и темами
 */

import { ThemeManager, THEMES } from '../theme/themeManager.js';
import { AuthManager, ROLE_ACCESS_MATRIX } from '../state/auth.js';
import { CartDrawer } from './cartDrawer.js';
import { UserNutritionModal } from './userNutritionModal.js';
import { AuthModal } from './authModal.js';
import { showToast } from './toast.js';

export const ALL_NAV_ROUTES = [
  { key: 'showcase', label: 'Витрина', icon: '🍲' },
  { key: 'business', label: 'Бизнес', icon: '🍳' },
  { key: 'pos', label: 'POS-Касса', icon: '💻' },
  { key: 'corporate', label: 'Корпоративное', icon: '🏢' },
  { key: 'admin', label: 'Админ', icon: '🛡️' },
  { key: 'db-viewer', label: '💾 База данных', icon: '🗄️' }
];

export class Header {
  static render(container) {
    const currentThemeKey = ThemeManager.getCurrentTheme();
    const currentTheme = THEMES[currentThemeKey] || THEMES.fresh;
    const currentUser = AuthManager.getActiveUser();
    const activeRoleKey = currentUser?.role || 'client';

    // Фильтрация доступных ссылок в навигации под активную роль
    const allowedRoutes = ROLE_ACCESS_MATRIX[activeRoleKey] || ['showcase'];
    const visibleNavLinks = ALL_NAV_ROUTES.filter(r => allowedRoutes.includes(r.key));

    const currentHash = window.location.hash.slice(2).split('?')[0] || 'showcase';

    container.innerHTML = `
      <header class="site-header">
        <div class="container header-container">
          <!-- Логотип -->
          <a href="#/showcase" class="brand-logo">
            <div class="brand-icon">🍲</div>
            <span>FoodFlow</span>
          </a>

          <!-- Навигация: только разрешенные для роли разделы -->
          <nav class="main-nav" id="header-nav">
            ${visibleNavLinks.map(link => `
              <a href="#/${link.key}" class="nav-link ${currentHash === link.key ? 'active' : ''}" data-route="${link.key}">
                ${link.label}
              </a>
            `).join('')}
          </nav>

          <!-- Действия -->
          <div class="header-actions">
            <!-- КБЖУ дневник здоровья (для клиентов) -->
            ${activeRoleKey === 'client' || activeRoleKey === 'admin' ? `
              <button class="btn btn-secondary btn-sm" id="header-nutrition-btn" title="Дневник питания и КБЖУ">
                🍏 КБЖУ
              </button>
            ` : ''}

            <!-- Селектор роли / профиля пользователя -->
            <button class="role-pill" id="role-selector-btn" title="Авторизация и выбор профиля">
              <span class="role-dot"></span>
              <span id="header-role-name">${currentUser?.icon || '👤'} ${currentUser?.name ? currentUser.name.split(' ')[0] : 'Профиль'} (${currentUser?.roleName || 'B2C'})</span>
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
    // Выбор темы
    const themeBtn = container.querySelector('#theme-selector-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        ThemeManager.openThemeModal();
      });
    }

    // Авторизация / смена роли
    const roleBtn = container.querySelector('#role-selector-btn');
    if (roleBtn) {
      roleBtn.addEventListener('click', () => {
        AuthModal.open('demo');
      });
    }

    // КБЖУ дневник
    const nutritionBtn = container.querySelector('#header-nutrition-btn');
    if (nutritionBtn) {
      nutritionBtn.addEventListener('click', () => {
        UserNutritionModal.open();
      });
    }

    // Корзина
    const cartBtn = container.querySelector('#header-cart-btn');
    if (cartBtn) {
      cartBtn.addEventListener('click', () => {
        CartDrawer.open();
      });
    }

    CartDrawer.updateHeaderBadge();

    // Глобальные слушатели регистрируются строго один раз
    if (!this.isListenersInitialized) {
      this.isListenersInitialized = true;

      // Слушатель смены темы
      window.addEventListener('themeChanged', (e) => {
        const themeKey = e.detail.theme;
        const themeData = THEMES[themeKey];
        const nameEl = document.getElementById('header-theme-name');
        const swatchEl = document.getElementById('header-theme-swatch');

        if (nameEl && themeData) nameEl.textContent = themeData.name;
        if (swatchEl && themeData) swatchEl.style.backgroundColor = themeData.primary;
      });

      // Слушатель смены роли — перерендер шапки для обновления ссылок меню
      window.addEventListener('roleChanged', () => {
        const headerRoot = document.getElementById('header-root');
        if (headerRoot) {
          Header.render(headerRoot);
        }
      });
    }
  }
}
