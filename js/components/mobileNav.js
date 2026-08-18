/**
 * MOBILE-NAV.JS — Компонент нижней панели навигации (Bottom Navigation Bar) и бокового Drawer
 * Стандарты Apple HIG (iOS) и Google Material Design 3 (Android) с тактильным откликом
 */

import { AuthManager } from '../state/auth.js';
import { ThemeManager, THEMES } from '../theme/themeManager.js';
import { CartDrawer } from './cartDrawer.js';
import { UserNutritionModal } from './userNutritionModal.js';
import { AuthModal } from './authModal.js';
import { Haptics } from '../services/haptics.js';

export class MobileNav {
  static isListenersInitialized = false;

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
    // Табы с тактильным откликом
    container.querySelectorAll('.mobile-nav-item').forEach(item => {
      item.addEventListener('click', () => {
        Haptics.light();
      });
    });

    // Корзина
    const cartBtn = container.querySelector('#mobile-nav-cart-btn');
    if (cartBtn) {
      cartBtn.addEventListener('click', () => {
        Haptics.medium();
        CartDrawer.open();
      });
    }

    // КБЖУ
    const nutrBtn = container.querySelector('#mobile-nav-nutrition-btn');
    if (nutrBtn) {
      nutrBtn.addEventListener('click', () => {
        Haptics.light();
        UserNutritionModal.open();
      });
    }

    // Профиль / Авторизация
    const profBtn = container.querySelector('#mobile-nav-profile-btn');
    if (profBtn) {
      profBtn.addEventListener('click', () => {
        Haptics.light();
        AuthModal.open('demo');
      });
    }

    // Меню «Ещё» (Drawer)
    const moreBtn = container.querySelector('#mobile-nav-more-btn');
    if (moreBtn) {
      moreBtn.addEventListener('click', () => {
        Haptics.medium();
        this.openDrawer();
      });
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
    const currentTheme = ThemeManager.getTheme();

    backdrop.innerHTML = `
      <div class="mobile-drawer-panel" role="dialog" aria-modal="true">
        <div class="mobile-drawer-header">
          <div style="display: flex; align-items: center; gap: var(--space-2);">
            <div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: var(--color-primary); color: #fff; display: grid; place-items: center; font-size: 1.2rem;">
              🍲
            </div>
            <div>
              <div style="font-weight: var(--font-weight-extrabold); font-size: var(--font-size-md);">FoodFlow</div>
              <div class="text-xs text-muted">Мобильная версия</div>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" id="close-drawer-btn" style="font-size: 1.2rem; min-height: 44px;">✕</button>
        </div>

        <div class="mobile-drawer-body">
          <!-- Карточка активного профиля -->
          <div style="background: var(--color-surface-alt); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--color-border);">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.4rem;">${user?.icon || '👤'}</span>
                <div>
                  <div style="font-weight: var(--font-weight-bold); font-size: var(--font-size-sm);">${user?.name || 'Гость'}</div>
                  <div class="text-xs text-muted">${user?.roleName || 'Клиент (B2C)'}</div>
                </div>
              </div>
              <button class="btn btn-secondary btn-sm" id="drawer-switch-user-btn">
                Сменить
              </button>
            </div>
          </div>

          <!-- Разделы навигации -->
          <div style="font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; color: var(--color-text-secondary); margin-top: 8px;">
            Навигация
          </div>
          <a href="#/showcase" class="mobile-menu-link drawer-nav-link">
            <span>🍲</span> Каталог блюд и заведений
          </a>
          <a href="#/business" class="mobile-menu-link drawer-nav-link">
            <span>🍳</span> Кабинет общепита (Склад, ТТК, P&L)
          </a>
          <a href="#/pos" class="mobile-menu-link drawer-nav-link">
            <span>💻</span> POS-терминал кассира
          </a>
          <a href="#/corporate" class="mobile-menu-link drawer-nav-link">
            <span>🏢</span> Корпоративный портал (B2B)
          </a>
          <a href="#/admin" class="mobile-menu-link drawer-nav-link">
            <span>🛡️</span> Панель администратора
          </a>
          <a href="#/db-viewer" class="mobile-menu-link drawer-nav-link">
            <span>🗄️</span> Просмотр базы данных
          </a>

          <!-- Темизация интерфейса -->
          <div style="font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; color: var(--color-text-secondary); margin-top: 12px;">
            Оформление (5 тем)
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            ${Object.entries(THEMES).map(([key, t]) => `
              <button class="btn btn-secondary btn-sm btn-drawer-theme ${key === currentTheme ? 'active' : ''}" data-theme="${key}" style="justify-content: flex-start; gap: 6px; padding: 8px 10px;">
                <span style="width: 12px; height: 12px; border-radius: 3px; background: ${t.primary}; display: inline-block;"></span>
                <span>${t.name}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    setTimeout(() => backdrop.classList.add('open'), 10);

    const closeDrawer = () => {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 300);
    };

    backdrop.querySelector('#close-drawer-btn').addEventListener('click', () => {
      Haptics.light();
      closeDrawer();
    });

    backdrop.querySelectorAll('.drawer-nav-link').forEach(link => {
      link.addEventListener('click', () => {
        Haptics.light();
        closeDrawer();
      });
    });

    backdrop.querySelector('#drawer-switch-user-btn').addEventListener('click', () => {
      Haptics.light();
      closeDrawer();
      setTimeout(() => AuthModal.open('demo'), 350);
    });

    backdrop.querySelectorAll('.btn-drawer-theme').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        ThemeManager.setTheme(theme);
        Haptics.selection();
        closeDrawer();
      });
    });

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeDrawer();
    });
  }
}
