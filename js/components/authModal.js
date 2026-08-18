/**
 * AUTH-MODAL.JS — Модальное окно входа, регистрации, PIN-кода и быстрого выбора демо-профилей
 */

import { AuthManager, DEMO_ACCOUNTS, ROLE_HOME_ROUTES } from '../state/auth.js';
import { Router } from '../router.js';
import { showToast } from './toast.js';

export class AuthModal {
  static activeTab = 'demo'; // 'login' | 'pin' | 'register' | 'demo'
  static currentPin = '';

  static open(tab = 'demo') {
    this.activeTab = tab;
    this.currentPin = '';

    let backdrop = document.getElementById('auth-modal-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'auth-modal-backdrop';
      backdrop.className = 'modal-backdrop';
      document.body.appendChild(backdrop);
    }

    const currentUser = AuthManager.getActiveUser();

    backdrop.innerHTML = `
      <div class="modal-dialog" style="max-width: 520px;" role="dialog">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">🔐 Авторизация и Смена Роли</h3>
            <p class="text-xs text-muted">Текущий пользователь: <strong>${currentUser?.name || 'Гость'}</strong> (${currentUser?.roleName || 'B2C'})</p>
          </div>
          <button class="modal-close-btn" id="close-auth-modal-btn">✕</button>
        </div>

        <div class="modal-body">
          <!-- Вкладки авторизации -->
          <div class="auth-tabs">
            <button class="auth-tab-btn ${this.activeTab === 'demo' ? 'active' : ''}" data-auth-tab="demo">
              ⚡ Демо-профили
            </button>
            <button class="auth-tab-btn ${this.activeTab === 'login' ? 'active' : ''}" data-auth-tab="login">
              🔑 Логин / Пароль
            </button>
            <button class="auth-tab-btn ${this.activeTab === 'pin' ? 'active' : ''}" data-auth-tab="pin">
              📱 PIN-код (POS)
            </button>
            <button class="auth-tab-btn ${this.activeTab === 'register' ? 'active' : ''}" data-auth-tab="register">
              📝 Регистрация
            </button>
          </div>

          <!-- Содержимое активной вкладки -->
          <div id="auth-tab-content">
            <!-- Динамический рендер таба -->
          </div>
        </div>
      </div>
    `;

    setTimeout(() => backdrop.classList.add('open'), 10);

    this.bindEvents(backdrop);
    this.renderCurrentTab(backdrop);
  }

  static renderCurrentTab(backdrop) {
    const tabContent = backdrop.querySelector('#auth-tab-content');
    if (!tabContent) return;

    if (this.activeTab === 'demo') {
      tabContent.innerHTML = `
        <div class="demo-accounts-grid">
          ${DEMO_ACCOUNTS.map(acc => `
            <div class="demo-user-card" data-user-id="${acc.id}">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.8rem;">${acc.icon}</span>
                <div>
                  <div style="font-weight: bold; font-size: var(--font-size-sm);">${acc.name}</div>
                  <div class="text-xs text-muted">${acc.roleName} · <code>${acc.email}</code></div>
                </div>
              </div>
              <span class="badge badge-primary">Войти →</span>
            </div>
          `).join('')}
        </div>
      `;

      tabContent.querySelectorAll('.demo-user-card').forEach(card => {
        card.addEventListener('click', () => {
          const user = DEMO_ACCOUNTS.find(a => a.id === card.dataset.userId);
          if (user) {
            AuthManager.switchUser(user);
            this.close(backdrop);
            const homeRoute = ROLE_HOME_ROUTES[user.role] || 'showcase';
            Router.navigate(homeRoute);
          }
        });
      });

    } else if (this.activeTab === 'login') {
      tabContent.innerHTML = `
        <form id="auth-login-form" style="display: flex; flex-direction: column; gap: var(--space-3);">
          <div class="form-group">
            <label class="form-label">Email или Телефон:</label>
            <input type="text" class="input" id="login-email-input" placeholder="chef@svezhest.kg" required>
          </div>
          <div class="form-group">
            <label class="form-label">Пароль:</label>
            <input type="password" class="input" id="login-password-input" placeholder="••••••••" required>
            <small class="text-muted" style="font-size:11px;">Демо-пароль для всех аккаунтов: <strong>pass</strong> (для админа: <strong>admin</strong>)</small>
          </div>
          <button type="submit" class="btn btn-primary btn-lg" style="margin-top: var(--space-2);">
            Войти в систему →
          </button>
        </form>
      `;

      tabContent.querySelector('#auth-login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = tabContent.querySelector('#login-email-input').value;
        const pass = tabContent.querySelector('#login-password-input').value;
        const res = AuthManager.login(email, pass);
        if (res.success) {
          this.close(backdrop);
          const homeRoute = ROLE_HOME_ROUTES[res.user.role] || 'showcase';
          Router.navigate(homeRoute);
        } else {
          showToast(res.error, 'error');
        }
      });

    } else if (this.activeTab === 'pin') {
      tabContent.innerHTML = `
        <div class="pin-numpad-container">
          <p class="text-xs text-muted" style="text-align:center;">Введите 4-значный PIN-код кассира (Демо: <strong>1234</strong>):</p>

          <div class="pin-display-dots">
            <div class="pin-dot ${this.currentPin.length >= 1 ? 'filled' : ''}"></div>
            <div class="pin-dot ${this.currentPin.length >= 2 ? 'filled' : ''}"></div>
            <div class="pin-dot ${this.currentPin.length >= 3 ? 'filled' : ''}"></div>
            <div class="pin-dot ${this.currentPin.length >= 4 ? 'filled' : ''}"></div>
          </div>

          <div class="pin-keypad-grid">
            <button class="pin-key-btn" data-key="1">1</button>
            <button class="pin-key-btn" data-key="2">2</button>
            <button class="pin-key-btn" data-key="3">3</button>
            <button class="pin-key-btn" data-key="4">4</button>
            <button class="pin-key-btn" data-key="5">5</button>
            <button class="pin-key-btn" data-key="6">6</button>
            <button class="pin-key-btn" data-key="7">7</button>
            <button class="pin-key-btn" data-key="8">8</button>
            <button class="pin-key-btn" data-key="9">9</button>
            <button class="pin-key-btn" data-key="C" style="color:var(--color-error); font-size:1.1rem;">C</button>
            <button class="pin-key-btn" data-key="0">0</button>
            <button class="pin-key-btn" data-key="⌫" style="font-size:1.1rem;">⌫</button>
          </div>
        </div>
      `;

      tabContent.querySelectorAll('.pin-key-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const key = btn.dataset.key;
          if (key === 'C') {
            this.currentPin = '';
          } else if (key === '⌫') {
            this.currentPin = this.currentPin.slice(0, -1);
          } else if (this.currentPin.length < 4) {
            this.currentPin += key;
            if (this.currentPin.length === 4) {
              setTimeout(() => {
                const res = AuthManager.loginWithPin(this.currentPin);
                if (res.success) {
                  this.close(backdrop);
                  Router.navigate('pos');
                } else {
                  showToast('Неверный PIN-код!', 'error');
                  this.currentPin = '';
                  this.renderCurrentTab(backdrop);
                }
              }, 150);
            }
          }
          this.renderCurrentTab(backdrop);
        });
      });

    } else if (this.activeTab === 'register') {
      tabContent.innerHTML = `
        <form id="auth-register-form" style="display: flex; flex-direction: column; gap: var(--space-2);">
          <div class="form-group">
            <label class="form-label">Тип создаваемого аккаунта:</label>
            <select class="select" id="reg-role-select">
              <option value="client">👤 Частный покупатель (B2C Клиент)</option>
              <option value="business">🍳 Владелец общепита / Кафе (B2B)</option>
              <option value="corporate">🏢 Организация / Юрлицо (Корп. питание)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Имя / Название организации:</label>
            <input type="text" class="input" id="reg-name-input" placeholder="ОсОО «Бишкек Фуд»" required>
          </div>
          <div class="grid grid-cols-2" style="gap: var(--space-2);">
            <div class="form-group">
              <label class="form-label">Email:</label>
              <input type="email" class="input" id="reg-email-input" placeholder="info@company.kg" required>
            </div>
            <div class="form-group">
              <label class="form-label">Телефон:</label>
              <input type="tel" class="input" id="reg-phone-input" placeholder="+996 555 00-00-00" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Пароль:</label>
            <input type="password" class="input" id="reg-pass-input" placeholder="••••••••" required>
          </div>
          <button type="submit" class="btn btn-primary btn-lg" style="margin-top: var(--space-2);">
            Зарегистрироваться →
          </button>
        </form>
      `;

      tabContent.querySelector('#auth-register-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const role = tabContent.querySelector('#reg-role-select').value;
        const name = tabContent.querySelector('#reg-name-input').value;
        const email = tabContent.querySelector('#reg-email-input').value;
        const phone = tabContent.querySelector('#reg-phone-input').value;
        const pass = tabContent.querySelector('#reg-pass-input').value;

        const res = AuthManager.register({ role, name, email, phone, password: pass });
        if (res.success) {
          this.close(backdrop);
          const homeRoute = ROLE_HOME_ROUTES[res.user.role] || 'showcase';
          Router.navigate(homeRoute);
        }
      });
    }
  }

  static bindEvents(backdrop) {
    backdrop.querySelectorAll('[data-auth-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.authTab;
        backdrop.querySelectorAll('[data-auth-tab]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderCurrentTab(backdrop);
      });
    });

    backdrop.querySelector('#close-auth-modal-btn').addEventListener('click', () => {
      this.close(backdrop);
    });
  }

  static close(backdrop) {
    backdrop.classList.remove('open');
    setTimeout(() => backdrop.remove(), 250);
  }
}
