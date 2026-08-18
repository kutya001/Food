/**
 * THEME-MANAGER.JS — Управление 5 темами платформы
 * Полное соответствие документу "Дизайн и Цветовая Политика.md"
 */

import { showToast } from '../components/toast.js';

export const THEMES = {
  'fresh': {
    key: 'fresh',
    name: 'Свежий рынок',
    tag: 'Рекомендовано для MVP',
    desc: 'Зелёный и тёплый оранжевый: свежесть, польза, ЗОЖ и B2C-витрина',
    primary: '#22A05B',
    accent: '#FF8A3D',
    bg: '#F6F9F3',
    surface: '#FFFFFF',
    text: '#1C2B22',
    recommendedRole: 'Клиент (B2C)'
  },
  'appetite': {
    key: 'appetite',
    name: 'Тёплый аппетит',
    tag: 'Классика foodtech',
    desc: 'Красный и янтарный: аппетит, энергия, доставка еды и стрит-фуд',
    primary: '#E63946',
    accent: '#F8A24B',
    bg: '#FFF6EE',
    surface: '#FFFFFF',
    text: '#33221B',
    recommendedRole: 'Витрина / Доставка'
  },
  'neo-dark': {
    key: 'neo-dark',
    name: 'Нео-дарк',
    tag: 'Технологичный UI',
    desc: 'Глубокий тёмный и неоновый лайм: POS-терминал, снижение усталости глаз',
    primary: '#C2F04C',
    accent: '#C2F04C',
    bg: '#0F141A',
    surface: '#1B242E',
    text: '#F2F6FA',
    recommendedRole: 'POS-терминал / Касса'
  },
  'corporate': {
    key: 'corporate',
    name: 'Корпоративный баланс',
    tag: 'Сильный B2B',
    desc: 'Бирюзовый и золото: B2B-заявки, финансовый учёт, договоры и Админ',
    primary: '#0F7B84',
    accent: '#F5A524',
    bg: '#F3F8F9',
    surface: '#FFFFFF',
    text: '#16303A',
    recommendedRole: 'Бизнес / Заказчик / Админ'
  },
  'premium': {
    key: 'premium',
    name: 'Гастро-премиум',
    tag: 'Ресторанный сегмент',
    desc: 'Бордовый и благородное золото: рестораны, банкеты и кейтеринг',
    primary: '#6D2144',
    accent: '#D2A24C',
    bg: '#FBF6F0',
    surface: '#FFFFFF',
    text: '#2E1A22',
    recommendedRole: 'Рестораны / Банкеты'
  }
};

const STORAGE_KEY = 'food_app_theme';

export class ThemeManager {
  static getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'fresh';
  }

  static setTheme(themeKey, notify = true) {
    if (!THEMES[themeKey]) {
      console.warn(`Неизвестная тема: ${themeKey}, переключаем на fresh`);
      themeKey = 'fresh';
    }

    document.documentElement.setAttribute('data-theme', themeKey);
    localStorage.setItem(STORAGE_KEY, themeKey);

    // Событие для обновления всех компонентов
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: themeKey } }));

    // Обновляем визуальный индикатор в кнопке шапки
    const currentThemeData = THEMES[themeKey];
    const headerBtnText = document.getElementById('header-theme-name');
    const headerBtnSwatch = document.getElementById('header-theme-swatch');

    if (headerBtnText) headerBtnText.textContent = currentThemeData.name;
    if (headerBtnSwatch) headerBtnSwatch.style.backgroundColor = currentThemeData.primary;

    if (notify) {
      showToast(`Тема «${currentThemeData.name}» активирована`, 'info');
    }
  }

  static applyRoleDefaultTheme(role) {
    const roleDefaults = {
      'client': 'fresh',
      'business': 'corporate',
      'pos': 'neo-dark',
      'corporate': 'corporate',
      'admin': 'corporate'
    };

    const targetTheme = roleDefaults[role] || 'fresh';
    this.setTheme(targetTheme, false);
  }

  static openThemeModal() {
    let modalBackdrop = document.getElementById('theme-modal-backdrop');
    if (!modalBackdrop) {
      modalBackdrop = document.createElement('div');
      modalBackdrop.id = 'theme-modal-backdrop';
      modalBackdrop.className = 'modal-backdrop';
      document.body.appendChild(modalBackdrop);
    }

    const currentTheme = this.getCurrentTheme();

    modalBackdrop.innerHTML = `
      <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="theme-modal-title">
        <div class="modal-header">
          <div>
            <h3 class="modal-title" id="theme-modal-title">🎨 Выбор цветовой темы</h3>
            <p class="text-sm text-muted" style="margin-top:4px;">5 равноправных палитр. Переключение мгновенное без перезагрузки.</p>
          </div>
          <button class="modal-close-btn" id="close-theme-modal" aria-label="Закрыть">✕</button>
        </div>
        <div class="modal-body">
          <div class="themes-grid">
            ${Object.values(THEMES).map(t => `
              <div class="theme-card-option ${t.key === currentTheme ? 'active' : ''}" data-theme-key="${t.key}">
                <div class="theme-preview-palette" style="background:${t.bg}; border:1px solid ${t.key === 'neo-dark' ? '#2E3A47' : '#DCE5D7'}">
                  <div class="palette-swatches-mini">
                    <div class="swatch-box" style="background:${t.primary};"></div>
                    <div class="swatch-box" style="background:${t.accent};"></div>
                  </div>
                  <div class="palette-swatches-mini">
                    <div class="swatch-box" style="background:${t.surface}; border:1px solid rgba(0,0,0,0.06);"></div>
                    <div class="swatch-box" style="background:${t.text};"></div>
                  </div>
                </div>

                <div class="theme-info-col">
                  <h4>
                    <span>${t.name}</span>
                    <span class="badge ${t.key === 'fresh' ? 'badge-primary' : 'badge-accent'}" style="font-size:10px;">${t.tag}</span>
                  </h4>
                  <p>${t.desc}</p>
                  <small class="text-muted">🎯 Контекст: ${t.recommendedRole}</small>
                </div>

                <div class="theme-check-icon">✓</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Активация модалки
    setTimeout(() => modalBackdrop.classList.add('open'), 10);

    // Слушатели кликов
    modalBackdrop.querySelectorAll('.theme-card-option').forEach(card => {
      card.addEventListener('click', () => {
        const themeKey = card.dataset.themeKey;
        this.setTheme(themeKey, true);
        this.closeThemeModal();
      });
    });

    modalBackdrop.querySelector('#close-theme-modal').addEventListener('click', () => {
      this.closeThemeModal();
    });

    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        this.closeThemeModal();
      }
    });
  }

  static closeThemeModal() {
    const modalBackdrop = document.getElementById('theme-modal-backdrop');
    if (modalBackdrop) {
      modalBackdrop.classList.remove('open');
      setTimeout(() => modalBackdrop.remove(), 250);
    }
  }

  static init() {
    const saved = localStorage.getItem(STORAGE_KEY) || 'fresh';
    this.setTheme(saved, false);
  }
}
