/**
 * AUTH.JS — Менеджер мультиролевой аутентификации и сессий
 * Реализует концепцию "Единый аккаунт — множество ролей" без повторной аутентификации.
 */

import { db } from './db.js';
import { ThemeManager } from '../theme/themeManager.js';
import { showToast } from '../components/toast.js';

export class AuthManager {
  static getCurrentUser() {
    const users = db.getCollection('users');
    return users[0] || null;
  }

  static getActiveRole() {
    const user = this.getCurrentUser();
    return user ? user.activeRole : 'client';
  }

  static switchRole(roleKey) {
    const user = this.getCurrentUser();
    if (!user) return;

    db.update('users', user.id, { activeRole: roleKey });

    // Автоматическая адаптация темы оформления
    ThemeManager.applyRoleDefaultTheme(roleKey);

    // Оповещение интерфейса о смене роли
    window.dispatchEvent(new CustomEvent('roleChanged', { detail: { role: roleKey, user } }));

    const roleNames = {
      'client': 'Клиент (B2C)',
      'business': 'Общепит (B2B Учёт)',
      'pos': 'POS-Терминал (Касса)',
      'corporate': 'Организация-заказчик',
      'admin': 'Администратор платформы'
    };

    showToast(`Активная роль: ${roleNames[roleKey] || roleKey}`, 'info');
  }

  static getActiveEstablishment() {
    const user = this.getCurrentUser();
    const estId = user?.currentEstablishmentId || 'est_1';
    return db.getById('establishments', estId);
  }

  static setActiveEstablishment(estId) {
    const user = this.getCurrentUser();
    if (!user) return;

    db.update('users', user.id, { currentEstablishmentId: estId });
    window.dispatchEvent(new CustomEvent('establishmentChanged', { detail: { establishmentId: estId } }));
    
    const est = db.getById('establishments', estId);
    if (est) {
      showToast(`Выбрано заведение: ${est.name}`, 'success');
    }
  }

  static getActiveOrganization() {
    const user = this.getCurrentUser();
    const orgId = user?.currentOrganizationId || 'org_1';
    return db.getById('organizations', orgId);
  }

  static setActiveOrganization(orgId) {
    const user = this.getCurrentUser();
    if (!user) return;

    db.update('users', user.id, { currentOrganizationId: orgId });
    window.dispatchEvent(new CustomEvent('organizationChanged', { detail: { organizationId: orgId } }));
    
    const org = db.getById('organizations', orgId);
    if (org) {
      showToast(`Выбрана организация: ${org.name}`, 'success');
    }
  }
}
