/**
 * MAP-COMPONENT.JS — Интерактивная векторная карта заведений и заказчиков Бишкека
 */

import { db } from '../state/db.js';

export class MapComponent {
  static points = [
    {
      id: 'est_1',
      type: 'establishment',
      name: 'Столовая «Свежесть»',
      category: 'Столовая & Кафе',
      icon: '🍲',
      address: 'ул. Токтогула, 125',
      rating: 4.9,
      hours: '08:00 - 20:00',
      status: 'open',
      top: '46%',
      left: '32%'
    },
    {
      id: 'est_2',
      type: 'establishment',
      name: 'Бургерная «TaomGo»',
      category: 'Фастфуд & Гриль',
      icon: '🍔',
      address: 'пр. Чуй, 178',
      rating: 4.8,
      hours: '10:00 - 23:00',
      status: 'open',
      top: '30%',
      left: '58%'
    },
    {
      id: 'est_3',
      type: 'establishment',
      name: 'Ресторан «GastroHall»',
      category: 'Премиум Ресторан',
      icon: '🍷',
      address: 'бул. Эркиндик, 45',
      rating: 4.95,
      hours: '12:00 - 01:00',
      status: 'open',
      top: '58%',
      left: '48%'
    },
    {
      id: 'org_1',
      type: 'organization',
      name: 'ОсОО «Alfa Tech»',
      category: 'IT Офис (45 чел)',
      icon: '🏢',
      address: 'IT Park, блок B',
      rating: 5.0,
      hours: '09:00 - 18:00',
      status: 'open',
      top: '20%',
      left: '74%'
    },
    {
      id: 'org_2',
      type: 'organization',
      name: 'ОАО «Бишкек Финанс»',
      category: 'Банковский центр (120 чел)',
      icon: '🏦',
      address: 'ул. Киевская, 96',
      rating: 4.9,
      hours: '08:30 - 17:30',
      status: 'open',
      top: '38%',
      left: '42%'
    }
  ];

  static render(container, onSelectEstablishment = null) {
    container.innerHTML = `
      <div class="map-container-wrapper">
        <div class="map-canvas-area" id="map-canvas">
          <!-- Сетка улиц Бишкека (векторные линии) -->
          <svg style="position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none;" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="30%" x2="100%" y2="30%" stroke="currentColor" stroke-width="4" stroke-opacity="0.15" />
            <line x1="0" y1="46%" x2="100%" y2="46%" stroke="currentColor" stroke-width="3" stroke-opacity="0.12" />
            <line x1="0" y1="58%" x2="100%" y2="58%" stroke="currentColor" stroke-width="3" stroke-opacity="0.12" />
            <line x1="32%" y1="0" x2="32%" y2="100%" stroke="currentColor" stroke-width="3" stroke-opacity="0.12" />
            <line x1="48%" y1="0" x2="48%" y2="100%" stroke="currentColor" stroke-width="4" stroke-opacity="0.15" />
            <line x1="74%" y1="0" x2="74%" y2="100%" stroke="currentColor" stroke-width="3" stroke-opacity="0.12" />
          </svg>

          <!-- Интерактивные маркеры -->
          ${this.points.map(pt => `
            <div class="map-marker-pin" style="top: ${pt.top}; left: ${pt.left};" data-point-id="${pt.id}">
              <div class="marker-bubble">
                <span>${pt.icon}</span>
                <span>${pt.name}</span>
                <span class="badge ${pt.type === 'establishment' ? 'badge-success' : 'badge-primary'}" style="font-size:9px; padding:2px 5px;">
                  ${pt.type === 'establishment' ? 'Общепит' : 'Заказчик'}
                </span>
              </div>
              <div class="marker-point"></div>
            </div>
          `).join('')}

          <!-- Контейнер для всплывающего поп-апа -->
          <div id="map-active-popup"></div>
        </div>

        <!-- Панель управления картой -->
        <div class="map-controls-bar">
          <button class="btn btn-secondary btn-sm" id="map-zoom-in" style="width:36px; height:36px; padding:0;">➕</button>
          <button class="btn btn-secondary btn-sm" id="map-zoom-out" style="width:36px; height:36px; padding:0;">➖</button>
        </div>
      </div>
    `;

    // Слушатель кликов по маркерам
    container.querySelectorAll('.map-marker-pin').forEach(pin => {
      pin.addEventListener('click', () => {
        const ptId = pin.dataset.pointId;
        const pt = this.points.find(p => p.id === ptId);
        if (pt) {
          this.showPopup(container, pt, onSelectEstablishment);
        }
      });
    });

    // Показ первой точки по умолчанию
    this.showPopup(container, this.points[0], onSelectEstablishment);
  }

  static showPopup(container, pt, onSelectEstablishment) {
    const popupRoot = container.querySelector('#map-active-popup');
    if (!popupRoot) return;

    popupRoot.innerHTML = `
      <div class="map-popup-card">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.8rem;">${pt.icon}</span>
            <div>
              <h4 style="margin:0; font-size:var(--font-size-md);">${pt.name}</h4>
              <small class="text-muted">${pt.category}</small>
            </div>
          </div>
          <span class="badge badge-success">${pt.status === 'open' ? 'Открыто' : 'Закрыто'}</span>
        </div>
        <p class="text-xs text-muted" style="margin-bottom:8px;">
          📍 ${pt.address} · ⏰ ${pt.hours} · ⭐ ${pt.rating}
        </p>
        ${pt.type === 'establishment' ? `
          <button class="btn btn-primary btn-sm" id="map-filter-by-est-btn" style="width:100%;">
            🍽️ Показать меню заведения
          </button>
        ` : `
          <div class="text-xs text-muted" style="background:var(--color-surface-alt); padding:6px; border-radius:6px;">
            Корпоративный клиент платформы FoodFlow
          </div>
        `}
      </div>
    `;

    const filterBtn = popupRoot.querySelector('#map-filter-by-est-btn');
    if (filterBtn && onSelectEstablishment) {
      filterBtn.addEventListener('click', () => {
        onSelectEstablishment(pt.id);
      });
    }
  }
}
