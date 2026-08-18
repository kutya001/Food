/**
 * MAP-COMPONENT.JS — Полноценный интерактивный картографический модуль Бишкека
 * Поддержка Pan & Drag, Zoom In/Out, GPS геолокации, фильтрации и расчета дистанций в км.
 */

import { db } from '../state/db.js';
import { showToast } from './toast.js';

export class MapComponent {
  static points = [
    {
      id: 'est_1',
      type: 'establishment',
      categoryType: 'canteen',
      name: 'Столовая «Свежесть»',
      category: 'Столовая & Кафе',
      icon: '🍲',
      address: 'ул. Токтогула, 125',
      lat: 42.8710,
      lng: 74.5950,
      rating: 4.9,
      avgCheck: 250,
      hours: '08:00 - 20:00',
      status: 'open',
      top: '48%',
      left: '34%'
    },
    {
      id: 'est_2',
      type: 'establishment',
      categoryType: 'fastfood',
      name: 'Бургерная «TaomGo»',
      category: 'Фастфуд & Гриль',
      icon: '🍔',
      address: 'пр. Чуй, 178',
      lat: 42.8755,
      lng: 74.5820,
      rating: 4.8,
      avgCheck: 380,
      hours: '10:00 - 23:00',
      status: 'open',
      top: '32%',
      left: '60%'
    },
    {
      id: 'est_3',
      type: 'establishment',
      categoryType: 'restaurant',
      name: 'Ресторан «GastroHall»',
      category: 'Премиум Ресторан',
      icon: '🍷',
      address: 'бул. Эркиндик, 45',
      lat: 42.8680,
      lng: 74.6060,
      rating: 4.95,
      avgCheck: 850,
      hours: '12:00 - 01:00',
      status: 'open',
      top: '60%',
      left: '46%'
    },
    {
      id: 'org_1',
      type: 'organization',
      categoryType: 'corporate',
      name: 'ОсОО «Alfa Tech IT»',
      category: 'IT Офис (45 чел)',
      icon: '🏢',
      address: 'IT Park, блок B',
      lat: 42.8790,
      lng: 74.6180,
      rating: 5.0,
      avgCheck: 350,
      hours: '09:00 - 18:00',
      status: 'open',
      top: '22%',
      left: '76%'
    },
    {
      id: 'org_2',
      type: 'organization',
      categoryType: 'corporate',
      name: 'ОАО «Бишкек Банк»',
      category: 'Банк (120 чел)',
      icon: '🏦',
      address: 'ул. Киевская, 96',
      lat: 42.8730,
      lng: 74.5910,
      rating: 4.9,
      avgCheck: 400,
      hours: '08:30 - 17:30',
      status: 'open',
      top: '40%',
      left: '42%'
    }
  ];

  static scale = 1.0;
  static panX = 0;
  static panY = 0;
  static isDragging = false;
  static startX = 0;
  static startY = 0;
  static activeCategory = 'all';
  static userCoords = null; // { lat, lng }

  static render(container, onSelectEstablishment = null) {
    this.scale = 1.0;
    this.panX = 0;
    this.panY = 0;

    container.innerHTML = `
      <div class="map-container-wrapper">
        <!-- Верхняя панель быстрых фильтров карты -->
        <div class="map-filter-bar">
          <button class="map-chip ${this.activeCategory === 'all' ? 'active' : ''}" data-map-cat="all">
            ✨ Все объекты (${this.points.length})
          </button>
          <button class="map-chip ${this.activeCategory === 'canteen' ? 'active' : ''}" data-map-cat="canteen">
            🍲 Столовые
          </button>
          <button class="map-chip ${this.activeCategory === 'fastfood' ? 'active' : ''}" data-map-cat="fastfood">
            🍔 Бургеры & Гриль
          </button>
          <button class="map-chip ${this.activeCategory === 'restaurant' ? 'active' : ''}" data-map-cat="restaurant">
            🍷 Рестораны
          </button>
          <button class="map-chip ${this.activeCategory === 'corporate' ? 'active' : ''}" data-map-cat="corporate">
            🏢 B2B Офисы
          </button>
          <button class="map-chip ${this.activeCategory === 'nearby' ? 'active' : ''}" data-map-cat="nearby">
            📍 Поблизости (< 3 км)
          </button>
        </div>

        <!-- Интерактивная область холста -->
        <div class="map-canvas-area" id="map-canvas">
          <div class="map-pan-layer" id="map-pan-layer">
            <!-- Векторная сетка улиц Бишкека (Чуй, Токтогула, Киевская, Эркиндик, Манаса, Советская) -->
            <svg style="position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none;" xmlns="http://www.w3.org/2000/svg">
              <!-- Магистрали Запад-Восток (пр. Чуй, ул. Киевская, ул. Токтогула, ул. Московская) -->
              <line x1="0" y1="32%" x2="100%" y2="32%" stroke="currentColor" stroke-width="5" stroke-opacity="0.18" />
              <text x="2%" y="30%" fill="currentColor" fill-opacity="0.35" font-size="11" font-weight="bold">пр. Чуй</text>

              <line x1="0" y1="40%" x2="100%" y2="40%" stroke="currentColor" stroke-width="3" stroke-opacity="0.14" />
              <text x="2%" y="39%" fill="currentColor" fill-opacity="0.3" font-size="10">ул. Киевская</text>

              <line x1="0" y1="48%" x2="100%" y2="48%" stroke="currentColor" stroke-width="4" stroke-opacity="0.16" />
              <text x="2%" y="47%" fill="currentColor" fill-opacity="0.3" font-size="10">ул. Токтогула</text>

              <line x1="0" y1="60%" x2="100%" y2="60%" stroke="currentColor" stroke-width="4" stroke-opacity="0.16" />
              <text x="2%" y="59%" fill="currentColor" fill-opacity="0.3" font-size="10">ул. Московская</text>

              <!-- Меридианы Север-Юг (пр. Манаса, ул. Логвиненко, бул. Эркиндик, ул. Абдрахманова) -->
              <line x1="34%" y1="0" x2="34%" y2="100%" stroke="currentColor" stroke-width="4" stroke-opacity="0.16" />
              <text x="35%" y="6%" fill="currentColor" fill-opacity="0.3" font-size="10">пр. Манаса</text>

              <line x1="46%" y1="0" x2="46%" y2="100%" stroke="currentColor" stroke-width="5" stroke-opacity="0.18" />
              <text x="47%" y="6%" fill="currentColor" fill-opacity="0.35" font-size="11" font-weight="bold">бул. Эркиндик</text>

              <line x1="60%" y1="0" x2="60%" y2="100%" stroke="currentColor" stroke-width="4" stroke-opacity="0.16" />
              <text x="61%" y="6%" fill="currentColor" fill-opacity="0.3" font-size="10">ул. Абдрахманова</text>

              <line x1="76%" y1="0" x2="76%" y2="100%" stroke="currentColor" stroke-width="3" stroke-opacity="0.14" />
              <text x="77%" y="6%" fill="currentColor" fill-opacity="0.3" font-size="10">ул. 7 Апреля</text>
            </svg>

            <!-- Контейнер маркеров -->
            <div id="map-markers-root">
              ${this.renderMarkersHtml()}
            </div>

            <!-- Точка GPS пользователя -->
            <div id="map-user-gps" class="user-gps-marker" style="display: none;">
              <div class="user-gps-dot"></div>
            </div>
          </div>

          <!-- Всплывающая карточка заведения -->
          <div id="map-active-popup"></div>
        </div>

        <!-- Плавающие кнопки управления картой -->
        <div class="map-controls-bar">
          <button class="map-ctrl-btn" id="btn-map-zoom-in" title="Приблизить">➕</button>
          <button class="map-ctrl-btn" id="btn-map-zoom-out" title="Отдалить">➖</button>
          <button class="map-ctrl-btn" id="btn-map-gps" title="Моя геопозиция">📍</button>
          <button class="map-ctrl-btn" id="btn-map-reset" title="Сброс масштаба">🎯</button>
        </div>
      </div>
    `;

    this.bindEvents(container, onSelectEstablishment);
    this.showPopup(container, this.points[0], onSelectEstablishment);
  }

  static renderMarkersHtml() {
    const filtered = this.getFilteredPoints();

    return filtered.map(pt => {
      let distText = '';
      if (this.userCoords) {
        const km = this.calcDistanceKm(this.userCoords.lat, this.userCoords.lng, pt.lat, pt.lng);
        distText = ` · ${km.toFixed(1)} км`;
      }

      return `
        <div class="map-marker-pin" style="top: ${pt.top}; left: ${pt.left};" data-point-id="${pt.id}">
          <div class="marker-bubble">
            <span class="marker-live-dot"></span>
            <span>${pt.icon}</span>
            <span>${pt.name}</span>
            <span class="badge ${pt.type === 'establishment' ? 'badge-success' : 'badge-primary'}" style="font-size:9px; padding:2px 5px;">
              ${pt.type === 'establishment' ? `${pt.avgCheck} сом` : 'B2B'}
            </span>
          </div>
          <div class="marker-point"></div>
        </div>
      `;
    }).join('');
  }

  static getFilteredPoints() {
    if (this.activeCategory === 'all') return this.points;
    if (this.activeCategory === 'nearby') {
      if (!this.userCoords) return this.points;
      return this.points.filter(p => this.calcDistanceKm(this.userCoords.lat, this.userCoords.lng, p.lat, p.lng) <= 3.0);
    }
    return this.points.filter(p => p.categoryType === this.activeCategory);
  }

  static isRafPending = false;

  static scheduleTransform(panLayer) {
    if (this.isRafPending) return;
    this.isRafPending = true;
    requestAnimationFrame(() => {
      this.updateTransform(panLayer);
      this.isRafPending = false;
    });
  }

  static bindEvents(container, onSelectEstablishment) {
    const canvas = container.querySelector('#map-canvas');
    const panLayer = container.querySelector('#map-pan-layer');

    // Оптимизированный Pan & Drag мышью
    const onMouseMove = (e) => {
      if (!this.isDragging) return;
      this.panX = e.clientX - this.startX;
      this.panY = e.clientY - this.startY;
      this.scheduleTransform(panLayer);
    };

    const onMouseUp = () => {
      this.isDragging = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    canvas.addEventListener('mousedown', (e) => {
      if (e.target.closest('.map-marker-pin') || e.target.closest('.map-ctrl-btn') || e.target.closest('.map-popup-card')) return;
      this.isDragging = true;
      this.startX = e.clientX - this.panX;
      this.startY = e.clientY - this.panY;
      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('mouseup', onMouseUp);
    });

    // Оптимизированный Pan & Drag на тач-экранах
    const onTouchMove = (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      this.panX = e.touches[0].clientX - this.startX;
      this.panY = e.touches[0].clientY - this.startY;
      this.scheduleTransform(panLayer);
    };

    const onTouchEnd = () => {
      this.isDragging = false;
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };

    canvas.addEventListener('touchstart', (e) => {
      if (e.target.closest('.map-marker-pin') || e.target.closest('.map-ctrl-btn') || e.target.closest('.map-popup-card')) return;
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.startX = e.touches[0].clientX - this.panX;
        this.startY = e.touches[0].clientY - this.panY;
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('touchend', onTouchEnd);
      }
    }, { passive: true });

    // Зум колесом мыши
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      this.scale = Math.min(Math.max(this.scale + delta, 0.7), 2.2);
      this.scheduleTransform(panLayer);
    }, { passive: false });

    // Кнопки зума и сброса
    container.querySelector('#btn-map-zoom-in').addEventListener('click', () => {
      this.scale = Math.min(this.scale + 0.2, 2.2);
      this.updateTransform(panLayer);
    });

    container.querySelector('#btn-map-zoom-out').addEventListener('click', () => {
      this.scale = Math.max(this.scale - 0.2, 0.7);
      this.updateTransform(panLayer);
    });

    container.querySelector('#btn-map-reset').addEventListener('click', () => {
      this.scale = 1.0;
      this.panX = 0;
      this.panY = 0;
      this.updateTransform(panLayer);
      showToast('Карта центрирована', 'info');
    });

    // GPS Геолокация
    container.querySelector('#btn-map-gps').addEventListener('click', () => {
      if (navigator.geolocation) {
        showToast('Определение координат GPS...', 'info');
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            this.userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            this.showUserGps(container);
            showToast('Ваше местоположение определено!', 'success');
            this.refreshMarkers(container, onSelectEstablishment);
          },
          (err) => {
            // Эмуляция координат в центре Бишкека при запрете GPS
            this.userCoords = { lat: 42.8746, lng: 74.5698 };
            this.showUserGps(container);
            showToast('Геолокация: Центр Бишкека (Чуй / Эркиндик)', 'info');
            this.refreshMarkers(container, onSelectEstablishment);
          }
        );
      }
    });

    // Клики по категориям
    container.querySelectorAll('[data-map-cat]').forEach(chip => {
      chip.addEventListener('click', () => {
        this.activeCategory = chip.dataset.mapCat;
        container.querySelectorAll('[data-map-cat]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.refreshMarkers(container, onSelectEstablishment);
      });
    });

    this.bindMarkerClicks(container, onSelectEstablishment);
  }

  static showUserGps(container) {
    const gpsEl = container.querySelector('#map-user-gps');
    if (gpsEl) {
      gpsEl.style.top = '44%';
      gpsEl.style.left = '48%';
      gpsEl.style.display = 'block';
    }
  }

  static updateTransform(panLayer) {
    if (panLayer) {
      panLayer.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`;
    }
  }

  static refreshMarkers(container, onSelectEstablishment) {
    const markersRoot = container.querySelector('#map-markers-root');
    if (markersRoot) {
      markersRoot.innerHTML = this.renderMarkersHtml();
      this.bindMarkerClicks(container, onSelectEstablishment);
    }
  }

  static bindMarkerClicks(container, onSelectEstablishment) {
    container.querySelectorAll('.map-marker-pin').forEach(pin => {
      pin.addEventListener('click', () => {
        const pt = this.points.find(p => p.id === pin.dataset.pointId);
        if (pt) {
          this.showPopup(container, pt, onSelectEstablishment);
        }
      });
    });
  }

  static showPopup(container, pt, onSelectEstablishment) {
    const popupRoot = container.querySelector('#map-active-popup');
    if (!popupRoot) return;

    let distInfo = '';
    if (this.userCoords) {
      const km = this.calcDistanceKm(this.userCoords.lat, this.userCoords.lng, pt.lat, pt.lng);
      distInfo = ` · 🚶 <strong>${km.toFixed(1)} км от вас</strong>`;
    }

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
          <span class="badge badge-success">🟢 Открыто</span>
        </div>
        <p class="text-xs text-muted" style="margin-bottom:8px;">
          📍 ${pt.address} · ⏰ ${pt.hours} · ⭐ ${pt.rating}${distInfo}
        </p>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; font-size:var(--font-size-xs);">
          <span>Средний чек:</span>
          <strong>${pt.avgCheck} сом</strong>
        </div>
        ${pt.type === 'establishment' ? `
          <button class="btn btn-primary btn-sm" id="map-filter-by-est-btn" style="width:100%;">
            🍽️ Перейти к меню заведения →
          </button>
        ` : `
          <div class="text-xs text-muted" style="background:var(--color-surface-alt); padding:8px; border-radius:6px; text-align:center;">
            🏢 Корпоративный B2B клиент платформы
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

  /**
   * Расчет расстояния по формуле гаверсинусов (Haversine formula) в километрах
   */
  static calcDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Радиус Земли в км
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
