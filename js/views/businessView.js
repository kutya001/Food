/**
 * BUSINESS-VIEW.JS — Главный экран кабинета заведения общепита (B2B Учёт)
 */

import { db } from '../state/db.js';
import { AuthManager } from '../state/auth.js';
import { CalculationService } from '../services/calculationService.js';
import { BusinessWarehouseView } from './businessWarehouseView.js';
import { BusinessRecipesView } from './businessRecipesView.js';
import { BusinessMenuView } from './businessMenuView.js';

export class BusinessView {
  static activeTab = 'warehouse'; // 'warehouse' | 'recipes' | 'menu'

  static render(container) {
    const est = AuthManager.getActiveEstablishment() || { id: 'est_1', name: 'Столовая «Свежесть»', address: 'ул. Токтогула, 125' };

    const totalStockSom = CalculationService.calculateTotalWarehouseValue(est.id);
    const techCards = db.query('techCards', tc => tc.estId === est.id);
    const menuItems = db.query('menuItems', m => m.estId === est.id);
    const stopListCount = menuItems.filter(m => m.inStopList).length;

    container.innerHTML = `
      <div class="container">
        <!-- Шапка заведения -->
        <div class="business-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--space-4);">
          <div>
            <div style="display: flex; gap: var(--space-2); margin-bottom: 4px;">
              <span class="badge badge-primary">Кабинет общепита</span>
              <span class="badge badge-secondary">Учёт и производство</span>
            </div>
            <h1 style="font-size: var(--font-size-2xl); margin: 0;">🏢 ${est.name}</h1>
            <p class="text-xs text-muted" style="margin-top: 2px;">📍 ${est.address} · Склад, калькуляция техкарт и прейскурант</p>
          </div>
        </div>

        <!-- Карточки KPI заведения -->
        <div class="kpi-cards-grid">
          <div class="kpi-stat-card">
            <span class="text-xs text-muted">Запасы на складе:</span>
            <div class="kpi-stat-value" style="color: var(--color-primary);">${totalStockSom} сом</div>
            <small class="text-muted" style="font-size: 11px; margin-top: 4px;">Оценка по закупочным ценам</small>
          </div>
          <div class="kpi-stat-card">
            <span class="text-xs text-muted">Технологических карт:</span>
            <div class="kpi-stat-value">${techCards.length} шт</div>
            <small class="text-muted" style="font-size: 11px; margin-top: 4px;">
              ${techCards.filter(c => c.isSemiFinished).length} полуфабрикатов
            </small>
          </div>
          <div class="kpi-stat-card">
            <span class="text-xs text-muted">Позиций в меню:</span>
            <div class="kpi-stat-value">${menuItems.length} блюд</div>
            <small class="text-muted" style="font-size: 11px; margin-top: 4px;">Активный ассортимент</small>
          </div>
          <div class="kpi-stat-card">
            <span class="text-xs text-muted">В Стоп-листе:</span>
            <div class="kpi-stat-value" style="color: ${stopListCount > 0 ? 'var(--color-error)' : 'var(--color-success)'};">
              ${stopListCount} поз.
            </div>
            <small class="text-muted" style="font-size: 11px; margin-top: 4px;">Скрыты от продажи</small>
          </div>
        </div>

        <!-- Вкладки управления -->
        <div class="business-tabs">
          <button class="business-tab-btn ${this.activeTab === 'warehouse' ? 'active' : ''}" data-tab="warehouse">
            📦 Склад и накладные
          </button>
          <button class="business-tab-btn ${this.activeTab === 'recipes' ? 'active' : ''}" data-tab="recipes">
            📄 Технологические карты и калькуляция
          </button>
          <button class="business-tab-btn ${this.activeTab === 'menu' ? 'active' : ''}" data-tab="menu">
            🍽️ Прейскурант и Стоп-лист
          </button>
        </div>

        <!-- Контейнер активной вкладки -->
        <div id="business-tab-content">
          <!-- Динамический рендер выбранного таба -->
        </div>
      </div>
    `;

    this.bindEvents(container);
    this.renderCurrentTab(container);
  }

  static renderCurrentTab(container) {
    const tabRoot = container.querySelector('#business-tab-content');
    if (!tabRoot) return;

    if (this.activeTab === 'warehouse') {
      BusinessWarehouseView.render(tabRoot);
    } else if (this.activeTab === 'recipes') {
      BusinessRecipesView.render(tabRoot);
    } else if (this.activeTab === 'menu') {
      BusinessMenuView.render(tabRoot);
    }
  }

  static bindEvents(container) {
    container.querySelectorAll('.business-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.tab;
        container.querySelectorAll('.business-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderCurrentTab(container);
      });
    });
  }
}
