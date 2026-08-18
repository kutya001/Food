/**
 * MOBILE-NAV.JS — Компонент нижней панели навигации (Bottom Navigation Bar) и бокового Drawer
 */

import { AuthManager, ROLE_ACCESS_MATRIX } from '../state/auth.js';
import { ThemeManager, THEMES } from '../theme/themeManager.js';
import { CartDrawer } from './cartDrawer.js';
import { UserNutritionModal } from './userNutritionModal.js';
import { AuthModal } from './authModal.js';
import { Router } from '../router.js';

export class MobileNav {
  static render(container) {
    const user = AuthManager.getActiveUser();
    const role = user?.role || 'client';
    const currentHash = window.location.hash.slice(2).split('?')[0] || 'showcase';

    container.innerHTML = `
      <nav class="mobile-bottom-nav">
        <!-- 1. Главная кнопка роли -->
        <a href="#/showcase" class="mobile-nav-item ${currentHash === 'showcase' ? 'active' : ''}" data-route="showcase">
          <span class="mobile-nav-icon">🍲</span>
          <span>Меню</span>
        </a>

        <!-- 2. Вторая кнопка роли -->
        ${role === 'business' ? `
          <a href="#/business" class="mobile-nav-item ${currentHash === 'business' ? 'active' : ''}" data-route="business">
            <span class="mobile-nav-icon">🍳</span>
            <span>Бизнес</span>
          </a>
        ` : (role === 'pos' ? `
          <a href="#/pos" class="mobile-nav-item ${currentHash === 'pos' ? 'active' : ''}" data-route="pos">
            <span class="mobile-nav-icon">💻</span>
            <span>POS Касса</span>
          </a>
        ` : (role === 'corporate' ? `
          <a href="#/corporate" class="mobile-nav-item ${currentHash === 'corporate' ? 'active' : ''}" data-route="corporate">
            <span class="mobile-nav-icon">🏢</span>
            <span>Корп. портал</span>
          </a>
        ` : (role === 'admin' ? `
          <a href="#/admin" class="mobile-nav-item ${currentHash === 'admin' ? 'active' : ''}" data-route="admin">
            <span class="mobile-nav-icon">🛡️</span>
            <span>Админ</span>
          </a>
        ` : `
          <!-- Для B2C клиента: КБЖУ дневник -->
          <button class="mobile-nav-item" id="mobile-nav-nutrition-btn">
            <span class="mobile-nav-icon">🍏</span>
            <span>КБЖУ</span>
          </button>
        `)))}

        <!-- 3. Кнопка Корзины -->
        <button class="mobile-nav-item" id="mobile-nav-cart-btn">
          <span class="mobile-nav-icon">🛒</span>
          <span>Корзина</span>
          <span class="mobile-nav-badge" id="mobile-cart-badge">0</span>
        </button>

        <!-- 4. Кнопка Профиля / Авторизации -->
        <button class="mobile-nav-item" id="mobile-nav-profile-btn">
          <span class="mobile-nav-icon">${user?.icon || '👤'}</span>
          <span>${user?.roleName ? user.roleName.split(' ')[0] : 'Профиль'}</span>
        </button>

        <!-- 5. Гамбургер меню (Больше) -->
        <button class="mobile-nav-item" id="mobile-nav-more-btn">
          <span class="mobile-nav-icon">≡</span>
          <span>Ещё</span>
        </button>
      </nav>
    `;

    this.bindEvents(container);
    this.updateCartBadge();
  }

  static bindEvents(container) {
    // Корзина
    const cartBtn = container.querySelector('#mobile-nav-cart-btn');
    if (cartBtn) {
      cartBtn.addEventListener('click', () => CartDrawer.open());
    }

    // КБЖУ
    const nutrBtn = container.querySelector('#mobile-nav-nutrition-btn');
    if (nutrBtn) {
      nutrBtn.addEventListener('click', () => UserNutritionModal.open());
    }

    // Профиль / Авторизация
    const profBtn = container.querySelector('#mobile-nav-profile-btn');
    if (profBtn) {
      profBtn.addEventListener('click', () => AuthModal.open('demo'));
    }

    // Меню «Ещё» (Drawer)
    const moreBtn = container.querySelector('#mobile-nav-more-btn');
    if (moreBtn) {
      moreBtn.addEventListener('click', () => this.openDrawer());
    }

    // Обновление бейджа корзины и слушатели
    if (!this.isListenersInitialized) {
      this.isListenersInitialized = true;
      window.addEventListener('cartUpdated', () => this.updateCartBadge());
      window.addEventListener('roleChanged', () => {
        const root = document.getElementById('mobile-nav-root');
        if (root) this.render(root);
      });
      window.addEventListener('routeChanged', () => {
        const root = document.getElementById('mobile-nav-root');
        if (root) this.render(root);
      });
    }
  }

  static updateCartBadge() {
    const badge = document.getElementById('mobile-cart-badge');
    if (!badge) return;
    const items = CartDrawer.items || [];
    const count = items.reduce((s, i) => s + (i.qty || 1), 0);
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }

  static openDrawer() {
    let backdrop = document.getElementById('mobile-drawer-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'mobile-drawer-backdrop';
      backdrop.className = 'mobile-drawer-backdrop';
      document.body.appendChild(backdrop);
    }

    const user = AuthManager.getActiveUser();
    const currentTheme = ThemeManager.getCurrentTheme();

    backdrop.innerHTML = `
      <div class="mobile-drawer-panel">
        <div class="mobile-drawer-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.6rem;">${user?.icon || '👤'}</span>
            <div>
              <strong style="font-size: var(--font-size-sm);">${user?.name || 'Пользователь'}</strong>
              <div class="text-xs text-muted">${user?.roleName || 'B2C'}</div>
            </div>
          </div>
          <button class="modal-close-btn" id="close-mobile-drawer">✕</button>
        </div>

        <div class="mobile-drawer-body">
          <!-- Меню переходов -->
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <a href="#/showcase" class="mobile-menu-link drawer-nav-link">🍲 Витрина блюд</a>
            ${user?.role === 'business' || user?.role === 'admin' ? '<a href="#/business" class="mobile-menu-link drawer-nav-link">🍳 Кабинет общепита</a>' : ''}
            ${user?.role === 'pos' || user?.role === 'admin' ? '<a href="#/pos" class="mobile-menu-link drawer-nav-link">💻 POS Касса</a>' : ''}
            ${user?.role === 'corporate' || user?.role === 'admin' ? '<a href="#/corporate" class="mobile-menu-link drawer-nav-link">🏢 Корпоративный портал</a>' : ''}
            ${user?.role === 'admin' ? '<a href="#/admin" class="mobile-menu-link drawer-nav-link">🛡️ Панель администратора</a>' : ''}
            <a href="#/db-viewer" class="mobile-menu-link drawer-nav-link">💾 База данных Mock-DB</a>
          </div>

          <hr style="border:none; border-top:1px solid var(--color-border); margin:4px 0;">

          <!-- Быстрые действия -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button class="btn btn-secondary btn-sm" id="drawer-theme-btn" style="justify-content: flex-start;">
              🎨 Тема оформления (${THEMES[currentTheme]?.name || currentTheme})
            </button>
            <button class="btn btn-secondary btn-sm" id="drawer-switch-role-btn" style="justify-content: flex-start;">
              🔄 Сменить профиль / роль
            </button>
            <button class="btn btn-secondary btn-sm" id="drawer-logout-btn" style="justify-content: flex-start; color: var(--color-error);">
              🚪 Выйти из системы
            </button>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => backdrop.classList.add('open'), 10);

    backdrop.querySelector('#close-mobile-drawer').addEventListener('click', () => {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);
    });

    backdrop.querySelectorAll('.drawer-nav-link').forEach(link => {
      link.addEventListener('click', () => {
        backdrop.classList.remove('open');
        setTimeout(() => backdrop.remove(), 250);
      });
    });

    backdrop.querySelector('#drawer-theme-btn').addEventListener('click', () => {
      backdrop.classList.remove('open');
      setTimeout(() => {
        backdrop.remove();
        ThemeManager.openThemeModal();
      }, 250);
    });

    backdrop.querySelector('#drawer-switch-role-btn').addEventListener('click', () => {
      backdrop.classList.remove('open');
      setTimeout(() => {
        backdrop.remove();
        AuthModal.open('demo');
      }, 250);
    });

    backdrop.querySelector('#drawer-logout-btn').addEventListener('click', () => {
      AuthManager.logout();
      backdrop.classList.remove('open');
      setTimeout(() => {
        backdrop.remove();
        Router.navigate('showcase');
      }, 250);
    });
  }
}
