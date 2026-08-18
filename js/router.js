/**
 * ROUTER.JS — Hash-роутер с Route Guards и ролевой защитой (RBAC)
 * Обеспечивает безопасную навигацию на GitHub Pages без 404 ошибок.
 */

import { AuthManager, ROLE_HOME_ROUTES } from './state/auth.js';
import { showToast } from './components/toast.js';

export class Router {
  static routes = {};
  static currentRoute = 'showcase';

  static register(routeName, renderCallback) {
    this.routes[routeName] = renderCallback;
  }

  static init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('roleChanged', () => this.handleRoute());
    this.handleRoute();
  }

  static navigate(routeName) {
    window.location.hash = `#/${routeName}`;
  }

  static getRouteFromHash() {
    const hash = window.location.hash.slice(2); // убираем '#/'
    return hash.split('?')[0] || 'showcase';
  }

  static handleRoute() {
    let route = this.getRouteFromHash();
    const user = AuthManager.getActiveUser();
    const role = user?.role || 'client';

    // =========================================================================
    // ROUTE GUARD: Проверка прав доступа роли к маршруту
    // =========================================================================
    if (!AuthManager.canAccessRoute(route)) {
      const allowedHome = ROLE_HOME_ROUTES[role] || 'showcase';
      const routeNames = {
        'business': 'Кабинет общепита',
        'pos': 'POS-Касса',
        'corporate': 'Корпоративный портал',
        'admin': 'Панель администратора'
      };

      showToast(`⚠️ Доступ к разделу «${routeNames[route] || route}» ограничен для роли «${user?.roleName || role}»`, 'warning');
      
      // Автоматический редирект на разрешенный домашний раздел
      if (route !== allowedHome) {
        window.location.hash = `#/${allowedHome}`;
        return; // handleRoute вызовется повторно по hashchange
      }
    }

    this.currentRoute = route;

    // Обновляем активную ссылку в шапке
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      if (link.dataset.route === route) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Вызываем зарегистрированный рендерер страницы
    const handler = this.routes[route] || this.routes['showcase'];
    const appRoot = document.getElementById('app-root');

    if (handler && appRoot) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      handler(appRoot);
    }

    // Системное событие смены роута
    window.dispatchEvent(new CustomEvent('routeChanged', { detail: { route } }));
  }
}
