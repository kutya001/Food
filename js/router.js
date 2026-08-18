/**
 * ROUTER.JS — Hash-роутер для статического SPA (GitHub Pages Ready)
 * Обеспечивает навигацию без перезагрузок страниц и 404 ошибок.
 */

export class Router {
  static routes = {};
  static currentRoute = 'showcase';

  static register(routeName, renderCallback) {
    this.routes[routeName] = renderCallback;
  }

  static init() {
    window.addEventListener('hashchange', () => this.handleRoute());
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
    const route = this.getRouteFromHash();
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
