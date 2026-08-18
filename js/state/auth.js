/**
 * AUTH.JS — Полноценный менеджер аутентификации, сессий и ролевого доступа (RBAC)
 */

import { db } from './db.js';
import { ThemeManager } from '../theme/themeManager.js';
import { showToast } from '../components/toast.js';

const AUTH_SESSION_KEY = 'foodflow_auth_session_v2';

export const DEMO_ACCOUNTS = [
  {
    id: 'usr_client',
    name: 'Канат Омуралиев',
    email: 'client@foodflow.kg',
    phone: '+996 555 12-34-56',
    password: 'pass',
    pinCode: '1111',
    role: 'client',
    roleName: 'Покупатель (B2C)',
    icon: '👤',
    establishmentId: 'est_1',
    organizationId: 'org_1'
  },
  {
    id: 'usr_business',
    name: 'Шеф-управляющий Азат',
    email: 'chef@svezhest.kg',
    phone: '+996 550 99-88-77',
    password: 'pass',
    pinCode: '2222',
    role: 'business',
    roleName: 'Владелец общепита (B2B)',
    icon: '🍳',
    establishmentId: 'est_1',
    organizationId: null
  },
  {
    id: 'usr_pos',
    name: 'Кассир Айтматов Э.',
    email: 'pos@svezhest.kg',
    phone: '+996 700 33-44-55',
    password: 'pass',
    pinCode: '1234',
    role: 'pos',
    roleName: 'Кассир POS-терминала',
    icon: '💻',
    establishmentId: 'est_1',
    organizationId: null
  },
  {
    id: 'usr_corp',
    name: 'HR-директор Елена Смирнова',
    email: 'hr@alfatech.kg',
    phone: '+996 555 77-66-55',
    password: 'pass',
    pinCode: '4444',
    role: 'corporate',
    roleName: 'Корпоративный заказчик',
    icon: '🏢',
    establishmentId: 'est_1',
    organizationId: 'org_1'
  },
  {
    id: 'usr_admin',
    name: 'Суперадминистратор Руслан',
    email: 'admin@foodflow.kg',
    phone: '+996 312 00-00-00',
    password: 'admin',
    pinCode: '9999',
    role: 'admin',
    roleName: 'Администратор платформы',
    icon: '🛡️',
    establishmentId: 'est_1',
    organizationId: null
  }
];

// Домашние маршруты для каждой роли
export const ROLE_HOME_ROUTES = {
  'client': 'showcase',
  'business': 'business',
  'pos': 'pos',
  'corporate': 'corporate',
  'admin': 'admin'
};

// Матрица доступных разделов
export const ROLE_ACCESS_MATRIX = {
  'client': ['showcase', 'db-viewer'],
  'business': ['business', 'showcase', 'db-viewer'],
  'pos': ['pos', 'db-viewer'],
  'corporate': ['corporate', 'showcase', 'db-viewer'],
  'admin': ['showcase', 'business', 'pos', 'corporate', 'admin', 'db-viewer']
};

export class AuthManager {
  static currentUser = null;

  static init() {
    try {
      const saved = localStorage.getItem(AUTH_SESSION_KEY);
      if (saved) {
        this.currentUser = JSON.parse(saved);
      } else {
        // По умолчанию активен B2C клиент
        this.currentUser = DEMO_ACCOUNTS[0];
        this.saveSession();
      }
    } catch (e) {
      this.currentUser = DEMO_ACCOUNTS[0];
    }
  }

  static saveSession() {
    if (this.currentUser) {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem(AUTH_SESSION_KEY);
    }
  }

  static getCurrentUser() {
    if (!this.currentUser) this.init();
    return this.currentUser;
  }

  static getActiveUser() {
    return this.getCurrentUser();
  }

  static getActiveRole() {
    const user = this.getCurrentUser();
    return user ? user.role : 'client';
  }

  /**
   * Проверка прав доступа роли к указанному роуту
   */
  static canAccessRoute(route) {
    const role = this.getActiveRole();
    const allowed = ROLE_ACCESS_MATRIX[role] || ['showcase'];
    return allowed.includes(route);
  }

  /**
   * Вход по логину и паролю
   */
  static login(emailOrPhone, password) {
    const found = DEMO_ACCOUNTS.find(u => 
      (u.email.toLowerCase() === emailOrPhone.toLowerCase().trim() || u.phone === emailOrPhone.trim()) &&
      u.password === password
    );

    if (found) {
      this.currentUser = found;
      this.saveSession();
      ThemeManager.applyRoleDefaultTheme(found.role);
      window.dispatchEvent(new CustomEvent('roleChanged', { detail: { role: found.role, user: found } }));
      showToast(`Добро пожаловать, ${found.name} (${found.roleName})!`, 'success');
      return { success: true, user: found };
    }

    return { success: false, error: 'Неверный логин или пароль' };
  }

  /**
   * Вход по PIN-коду (для POS кассира)
   */
  static loginWithPin(pin) {
    const found = DEMO_ACCOUNTS.find(u => u.pinCode === pin);
    if (found) {
      this.currentUser = found;
      this.saveSession();
      ThemeManager.applyRoleDefaultTheme(found.role);
      window.dispatchEvent(new CustomEvent('roleChanged', { detail: { role: found.role, user: found } }));
      showToast(`Успешный вход по PIN: ${found.name}`, 'success');
      return { success: true, user: found };
    }
    return { success: false, error: 'Неверный PIN-код' };
  }

  /**
   * Быстрое переключение профиля
   */
  static switchUser(userObj) {
    this.currentUser = userObj;
    this.saveSession();
    ThemeManager.applyRoleDefaultTheme(userObj.role);
    window.dispatchEvent(new CustomEvent('roleChanged', { detail: { role: userObj.role, user: userObj } }));
    showToast(`Профиль переключен: ${userObj.roleName}`, 'info');
  }

  /**
   * Быстрое переключение роли
   */
  static switchRole(roleKey) {
    const account = DEMO_ACCOUNTS.find(a => a.role === roleKey) || DEMO_ACCOUNTS[0];
    this.switchUser(account);
  }

  /**
   * Регистрация нового пользователя
   */
  static register(userData) {
    const newUser = {
      id: `usr_${Date.now()}`,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
      pinCode: '0000',
      role: userData.role || 'client',
      roleName: userData.role === 'business' ? 'Владелец общепита' : (userData.role === 'corporate' ? 'Корпоративный заказчик' : 'Клиент (B2C)'),
      icon: userData.role === 'business' ? '🍳' : (userData.role === 'corporate' ? '🏢' : '👤'),
      establishmentId: 'est_1',
      organizationId: 'org_1'
    };

    DEMO_ACCOUNTS.push(newUser);
    this.currentUser = newUser;
    this.saveSession();
    ThemeManager.applyRoleDefaultTheme(newUser.role);
    window.dispatchEvent(new CustomEvent('roleChanged', { detail: { role: newUser.role, user: newUser } }));
    showToast(`Регистрация успешна! Добро пожаловать, ${newUser.name}`, 'success');
    return { success: true, user: newUser };
  }

  static logout() {
    this.currentUser = DEMO_ACCOUNTS[0]; // Возврат к клиенту по умолчанию
    this.saveSession();
    ThemeManager.applyRoleDefaultTheme('client');
    window.dispatchEvent(new CustomEvent('roleChanged', { detail: { role: 'client', user: this.currentUser } }));
    showToast('Вы вышли из учетной записи', 'info');
  }

  static getActiveEstablishment() {
    const user = this.getCurrentUser();
    const estId = user?.establishmentId || 'est_1';
    return db.getById('establishments', estId);
  }

  static setActiveEstablishment(estId) {
    if (this.currentUser) {
      this.currentUser.establishmentId = estId;
      this.saveSession();
    }
    window.dispatchEvent(new CustomEvent('establishmentChanged', { detail: { establishmentId: estId } }));
    const est = db.getById('establishments', estId);
    if (est) showToast(`Выбрано заведение: ${est.name}`, 'success');
  }

  static getActiveOrganization() {
    const user = this.getCurrentUser();
    const orgId = user?.organizationId || 'org_1';
    return db.getById('organizations', orgId);
  }

  static setActiveOrganization(orgId) {
    if (this.currentUser) {
      this.currentUser.organizationId = orgId;
      this.saveSession();
    }
    window.dispatchEvent(new CustomEvent('organizationChanged', { detail: { organizationId: orgId } }));
    const org = db.getById('organizations', orgId);
    if (org) showToast(`Выбрана организация: ${org.name}`, 'success');
  }
}
