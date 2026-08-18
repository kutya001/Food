/**
 * SHOWCASE-VIEW.JS — Главный экран витрины каталога блюд, мультифильтров и карты
 */

import { db } from '../state/db.js';
import { DishDetailModal } from '../components/dishDetailModal.js';
import { CartDrawer } from '../components/cartDrawer.js';
import { MapComponent } from '../components/mapComponent.js';

export class ShowcaseView {
  static currentViewMode = 'grid'; // 'grid' | 'map'
  static activeCategory = 'all';
  static activeEstablishment = 'all';
  static priceFilter = 'all'; // 'all' | 'under200' | '200to500' | 'over500'
  static caloriesFilter = 'all'; // 'all' | 'under300' | '300to600' | 'over600'
  static sortBy = 'popular'; // 'popular' | 'price_asc' | 'price_desc' | 'calories_asc'
  static searchQuery = '';
  static activeDietary = {
    halal: false,
    vegan: false,
    gluten_free: false
  };

  static render(container) {
    const establishments = db.getCollection('establishments');
    const categories = ['all', 'Вторые блюда', 'Супы', 'Салаты', 'Бургеры', 'Стейки & Гриль'];

    container.innerHTML = `
      <div class="container">
        <!-- Шапка витрины с переключателем режимов -->
        <div class="showcase-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-4);">
          <div>
            <div style="display: flex; gap: var(--space-2); margin-bottom: 4px;">
              <span class="badge badge-primary">B2C Онлайн-витрина</span>
              <span class="badge badge-accent">Бишкек</span>
            </div>
            <h1 style="font-size: var(--font-size-2xl);">🍽️ Меню общепита и доставка еды</h1>
          </div>

          <!-- Переключатель режима: Каталог / Карта -->
          <div class="view-mode-toggle">
            <button class="view-mode-btn ${this.currentViewMode === 'grid' ? 'active' : ''}" id="btn-view-grid">
              📋 Каталог блюд
            </button>
            <button class="view-mode-btn ${this.currentViewMode === 'map' ? 'active' : ''}" id="btn-view-map">
              🗺️ Карта общепитов
            </button>
          </div>
        </div>

        <!-- Контейнер Карты (если выбран режим карты) -->
        <div id="showcase-map-container" style="display: ${this.currentViewMode === 'map' ? 'block' : 'none'};">
          <!-- Рендерится через MapComponent -->
        </div>

        <!-- Панель мультифильтров (для режима каталога) -->
        <div class="filters-panel" id="showcase-filters-panel" style="display: ${this.currentViewMode === 'grid' ? 'block' : 'none'};">
          <!-- Верхняя строка фильтров: Поиск + Заведение + Сортировка -->
          <div class="filters-row-primary">
            <div>
              <input type="text" class="input" id="filter-search-input" placeholder="🔍 Найти плов, лагман, борщ, бургер, стейк..." value="${this.searchQuery}">
            </div>
            <div>
              <select class="select" id="filter-establishment-select">
                <option value="all">🏠 Все заведения</option>
                ${establishments.map(e => `
                  <option value="${e.id}" ${this.activeEstablishment === e.id ? 'selected' : ''}>${e.name}</option>
                `).join('')}
              </select>
            </div>
            <div>
              <select class="select" id="filter-sort-select">
                <option value="popular" ${this.sortBy === 'popular' ? 'selected' : ''}>🔥 По популярности</option>
                <option value="price_asc" ${this.sortBy === 'price_asc' ? 'selected' : ''}>💰 Сначала дешевле</option>
                <option value="price_desc" ${this.sortBy === 'price_desc' ? 'selected' : ''}>💎 Сначала дороже</option>
                <option value="calories_asc" ${this.sortBy === 'calories_asc' ? 'selected' : ''}>🥗 Меньше калорий</option>
              </select>
            </div>
            <div>
              <button class="btn btn-secondary btn-sm" id="btn-reset-filters" style="height: 42px;">
                Сбросить
              </button>
            </div>
          </div>

          <!-- Горизонтальные чипы категорий -->
          <div class="category-chips" style="margin-bottom: var(--space-4);">
            ${categories.map(cat => `
              <button class="category-chip ${this.activeCategory === cat ? 'active' : ''}" data-category="${cat}">
                ${cat === 'all' ? '✨ Все категории' : cat}
              </button>
            `).join('')}
          </div>

          <!-- Нижняя панель: Диапазон цен, Калории и Диетические чекбоксы -->
          <div class="advanced-filters-row">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="text-xs text-muted">Цена:</span>
              <select class="select btn-sm" id="filter-price-select" style="width: auto;">
                <option value="all" ${this.priceFilter === 'all' ? 'selected' : ''}>Любая цена</option>
                <option value="under200" ${this.priceFilter === 'under200' ? 'selected' : ''}>до 200 сом</option>
                <option value="200to500" ${this.priceFilter === '200to500' ? 'selected' : ''}>200 — 500 сом</option>
                <option value="over500" ${this.priceFilter === 'over500' ? 'selected' : ''}>от 500 сом</option>
              </select>
            </div>

            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="text-xs text-muted">КБЖУ (калории):</span>
              <select class="select btn-sm" id="filter-calories-select" style="width: auto;">
                <option value="all" ${this.caloriesFilter === 'all' ? 'selected' : ''}>Все калории</option>
                <option value="under300" ${this.caloriesFilter === 'under300' ? 'selected' : ''}>Лёгкие (&lt;300 ккал)</option>
                <option value="300to600" ${this.caloriesFilter === '300to600' ? 'selected' : ''}>Сытные (300–600 ккал)</option>
                <option value="over600" ${this.caloriesFilter === 'over600' ? 'selected' : ''}>Плотные (&gt;600 ккал)</option>
              </select>
            </div>

            <label class="filter-tag-checkbox">
              <input type="checkbox" id="check-halal" ${this.activeDietary.halal ? 'checked' : ''}>
              <span>✅ Халяль</span>
            </label>

            <label class="filter-tag-checkbox">
              <input type="checkbox" id="check-vegan" ${this.activeDietary.vegan ? 'checked' : ''}>
              <span>🌱 Веган</span>
            </label>

            <label class="filter-tag-checkbox">
              <input type="checkbox" id="check-gluten-free" ${this.activeDietary.gluten_free ? 'checked' : ''}>
              <span>🌾 Без глютена</span>
            </label>
          </div>
        </div>

        <!-- Сетка карточек блюд -->
        <div id="showcase-grid-container" style="display: ${this.currentViewMode === 'grid' ? 'block' : 'none'};">
          <div class="grid grid-cols-3" id="dishes-cards-grid">
            <!-- Динамический рендер карточек -->
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container);
    this.renderDishesList(container);

    if (this.currentViewMode === 'map') {
      const mapRoot = container.querySelector('#showcase-map-container');
      MapComponent.render(mapRoot, (estId) => {
        this.activeEstablishment = estId;
        this.currentViewMode = 'grid';
        this.render(container);
      });
    }
  }

  static getFilteredDishes() {
    let list = db.getCollection('menuItems');

    // 1. Поиск по тексту
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(i => 
        i.name.toLowerCase().includes(q) || 
        i.category.toLowerCase().includes(q) || 
        i.description.toLowerCase().includes(q)
      );
    }

    // 2. Категория
    if (this.activeCategory !== 'all') {
      list = list.filter(i => i.category === this.activeCategory);
    }

    // 3. Заведение
    if (this.activeEstablishment !== 'all') {
      list = list.filter(i => i.estId === this.activeEstablishment);
    }

    // 4. Фильтр цены
    if (this.priceFilter === 'under200') {
      list = list.filter(i => i.retailPrice <= 200);
    } else if (this.priceFilter === '200to500') {
      list = list.filter(i => i.retailPrice > 200 && i.retailPrice <= 500);
    } else if (this.priceFilter === 'over500') {
      list = list.filter(i => i.retailPrice > 500);
    }

    // 5. Диетические теги
    if (this.activeDietary.halal) {
      list = list.filter(i => i.dietary?.includes('halal'));
    }
    if (this.activeDietary.vegan) {
      list = list.filter(i => i.dietary?.includes('vegan'));
    }
    if (this.activeDietary.gluten_free) {
      list = list.filter(i => i.dietary?.includes('gluten_free'));
    }

    // 6. Сортировка
    if (this.sortBy === 'price_asc') {
      list.sort((a, b) => a.retailPrice - b.retailPrice);
    } else if (this.sortBy === 'price_desc') {
      list.sort((a, b) => b.retailPrice - a.retailPrice);
    }

    return list;
  }

  static renderDishesList(container) {
    const grid = container.querySelector('#dishes-cards-grid');
    if (!grid) return;

    const dishes = this.getFilteredDishes();
    const establishments = db.getCollection('establishments');

    if (dishes.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: var(--space-10) var(--space-4); color: var(--color-text-secondary); background: var(--color-surface); border-radius: var(--radius-lg); border: 1px dashed var(--color-border);">
          <div style="font-size: 3rem; margin-bottom: var(--space-3);">🔍</div>
          <h3>Ничего не найдено</h3>
          <p class="text-sm" style="margin-top: 4px;">Попробуйте смягчить условия поиска или сбросить фильтры</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = dishes.map(dish => {
      const est = establishments.find(e => e.id === dish.estId) || { name: 'Общепит', rating: 4.8 };
      const techCard = db.getById('techCards', dish.techCardId) || { calculatedKbju: { calories: 350, protein: 15, fat: 12, carbs: 30 } };
      const kbju = techCard.calculatedKbju;

      return `
        <div class="dish-catalog-card" data-dish-id="${dish.id}">
          <div class="dish-image-header">
            <span>${dish.photoIcon || '🍲'}</span>
            ${dish.inStopList ? '<span class="badge badge-error dish-stop-badge">Стоп-лист</span>' : ''}
          </div>
          <div class="dish-content-body">
            <div class="dish-meta-row">
              <span>🏠 ${est.name}</span>
              <span>•</span>
              <span>⭐ ${est.rating}</span>
            </div>
            <h3 class="dish-title">${dish.name}</h3>
            <p class="dish-desc-text">${dish.description}</p>
            
            <div class="dish-nutrition-tags">
              <span class="badge badge-primary">${kbju.calories} ккал</span>
              <span class="badge badge-secondary" style="background:var(--color-surface-alt);">Б: ${kbju.protein}г</span>
              <span class="badge badge-secondary" style="background:var(--color-surface-alt);">Ж: ${kbju.fat}г</span>
              <span class="badge badge-secondary" style="background:var(--color-surface-alt);">У: ${kbju.carbs}г</span>
              ${dish.dietary?.includes('halal') ? '<span class="badge badge-success">Халяль</span>' : ''}
            </div>

            <div class="dish-card-footer">
              <div>
                <span class="text-xs text-muted" style="display:block;">${dish.portionWeight || '350 г'}</span>
                <span class="dish-price-som">${dish.retailPrice} сом</span>
              </div>
              <button class="btn btn-accent btn-sm quick-add-to-cart" data-quick-id="${dish.id}">
                🛒 В заказ
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Клик по карточке -> Детализация блюда
    grid.querySelectorAll('.dish-catalog-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.quick-add-to-cart')) return;
        const dishId = card.dataset.dishId;
        DishDetailModal.open(dishId);
      });
    });

    // Клик по кнопке "В заказ" на карточке
    grid.querySelectorAll('.quick-add-to-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dishId = btn.dataset.quickId;
        const dish = db.getById('menuItems', dishId);
        const techCard = db.getById('techCards', dish?.techCardId);
        if (dish) {
          CartDrawer.addItem({
            id: dish.id,
            name: dish.name,
            retailPrice: dish.retailPrice,
            photoIcon: dish.photoIcon,
            portionWeight: dish.portionWeight,
            kbju: techCard?.calculatedKbju || { calories: 350, protein: 15, fat: 12, carbs: 30 }
          }, 1);
        }
      });
    });
  }

  static bindEvents(container) {
    // Переключение режимов: Каталог / Карта
    container.querySelector('#btn-view-grid').addEventListener('click', () => {
      this.currentViewMode = 'grid';
      this.render(container);
    });

    container.querySelector('#btn-view-map').addEventListener('click', () => {
      this.currentViewMode = 'map';
      this.render(container);
    });

    // Поиск
    const searchInput = container.querySelector('#filter-search-input');
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.renderDishesList(container);
    });

    // Фильтр по заведению
    const estSelect = container.querySelector('#filter-establishment-select');
    estSelect.addEventListener('change', (e) => {
      this.activeEstablishment = e.target.value;
      this.renderDishesList(container);
    });

    // Сортировка
    const sortSelect = container.querySelector('#filter-sort-select');
    sortSelect.addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      this.renderDishesList(container);
    });

    // Диапазон цен
    const priceSelect = container.querySelector('#filter-price-select');
    priceSelect.addEventListener('change', (e) => {
      this.priceFilter = e.target.value;
      this.renderDishesList(container);
    });

    // Категории
    container.querySelectorAll('.category-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.activeCategory = chip.dataset.category;
        container.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.renderDishesList(container);
      });
    });

    // Чекбоксы диет
    container.querySelector('#check-halal').addEventListener('change', (e) => {
      this.activeDietary.halal = e.target.checked;
      this.renderDishesList(container);
    });

    container.querySelector('#check-vegan').addEventListener('change', (e) => {
      this.activeDietary.vegan = e.target.checked;
      this.renderDishesList(container);
    });

    container.querySelector('#check-gluten-free').addEventListener('change', (e) => {
      this.activeDietary.gluten_free = e.target.checked;
      this.renderDishesList(container);
    });

    // Сброс фильтров
    container.querySelector('#btn-reset-filters').addEventListener('click', () => {
      this.searchQuery = '';
      this.activeCategory = 'all';
      this.activeEstablishment = 'all';
      this.priceFilter = 'all';
      this.caloriesFilter = 'all';
      this.sortBy = 'popular';
      this.activeDietary = { halal: false, vegan: false, gluten_free: false };
      this.render(container);
    });
  }
}
