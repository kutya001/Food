/**
 * DB-VIEWER-VIEW.JS — Инспектор локальной базы данных, просмотр коллекций и резервное копирование
 */

import { db } from '../state/db.js';
import { ExportService } from '../services/exportService.js';
import { showToast } from '../components/toast.js';

export class DbViewerView {
  static activeCollection = 'menuItems';
  static searchQuery = '';

  static render(container) {
    const collections = [
      'users', 'establishments', 'organizations',
      'ingredients', 'techCards', 'menuItems',
      'orders', 'posShifts', 'corpRequests'
    ];

    const currentData = db.getCollection(this.activeCollection);

    container.innerHTML = `
      <div class="container">
        <!-- Шапка инспектора БД -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--space-4); margin-bottom: var(--space-4);">
          <div>
            <div style="display: flex; gap: var(--space-2); margin-bottom: 4px;">
              <span class="badge badge-accent">Mock-DB</span>
              <span class="badge badge-secondary">Клиентский LocalStorage</span>
            </div>
            <h1 style="font-size: var(--font-size-2xl); margin: 0;">🗄️ Инспектор базы данных (JSON)</h1>
            <p class="text-xs text-muted" style="margin-top: 2px;">Инспекция схем, выгрузка резервных копий и восстановление состояния</p>
          </div>

          <div style="display: flex; gap: var(--space-2); flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" id="btn-db-export-json">
              📥 Экспорт БД (.json)
            </button>
            <label class="btn btn-secondary btn-sm" style="cursor: pointer;">
              📤 Импорт БД (.json)
              <input type="file" id="input-db-import-json" accept=".json" style="display: none;">
            </label>
            <button class="btn btn-secondary btn-sm" id="btn-db-reset-seed" style="color: var(--color-error);">
              🔄 Сброс к Seed Data
            </button>
          </div>
        </div>

        <!-- Переключатели коллекций -->
        <div class="category-chips" style="margin-bottom: var(--space-4); flex-wrap: wrap;">
          ${collections.map(col => `
            <button class="category-chip ${this.activeCollection === col ? 'active' : ''}" data-col="${col}">
              📁 ${col} (${db.getCollection(col).length})
            </button>
          `).join('')}
        </div>

        <!-- Поиск по коллекции -->
        <div style="margin-bottom: var(--space-3);">
          <input type="text" class="input" id="db-search-input" placeholder="🔍 Фильтрация по содержимому JSON..." value="${this.searchQuery}">
        </div>

        <!-- Отображение содержимого коллекции -->
        <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-4); box-shadow: var(--shadow-card);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2);">
            <strong style="font-size: var(--font-size-sm);">Коллекция: <code>${this.activeCollection}</code></strong>
            <span class="text-xs text-muted">Записей: ${currentData.length} шт</span>
          </div>

          <pre style="background: var(--color-surface-alt); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--color-border); max-height: 500px; overflow-y: auto; font-family: monospace; font-size: 12px; line-height: 1.5; color: var(--color-text); margin: 0;" id="db-json-pre">${JSON.stringify(currentData, null, 2)}</pre>
        </div>
      </div>
    `;

    this.bindEvents(container);
  }

  static bindEvents(container) {
    // Переключение коллекций
    container.querySelectorAll('.category-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.activeCollection = chip.dataset.col;
        this.render(container);
      });
    });

    // Поиск
    const searchInput = container.querySelector('#db-search-input');
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      const pre = container.querySelector('#db-json-pre');
      let data = db.getCollection(this.activeCollection);

      if (this.searchQuery) {
        data = data.filter(item => JSON.stringify(item).toLowerCase().includes(this.searchQuery));
      }

      pre.textContent = JSON.stringify(data, null, 2);
    });

    // Экспорт
    container.querySelector('#btn-db-export-json').addEventListener('click', () => {
      ExportService.exportDatabaseToFile();
      showToast('База данных успешно сохранена в JSON-файл!', 'success');
    });

    // Импорт
    const fileInput = container.querySelector('#input-db-import-json');
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        const success = await ExportService.importDatabaseFromFile(file);
        if (success) {
          showToast('База данных успешно восстановлена!', 'success');
          this.render(container);
        } else {
          showToast('Ошибка импорта JSON-файла', 'error');
        }
      }
    });

    // Сброс к Seed Data
    container.querySelector('#btn-db-reset-seed').addEventListener('click', () => {
      if (confirm('Сбросить базу данных к начальному демонстрационному датасету (Seed Data)?')) {
        db.reset();
        showToast('База данных сброшена к исходному состоянию!', 'info');
        this.render(container);
      }
    });
  }
}
