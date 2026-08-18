/**
 * DB.JS — Автономная клиентская СУБД для платформы FoodFlow
 * Работает в localStorage с поддержкой транзакционности, поиска и Pub/Sub реактивности.
 */

import { INITIAL_SEED_DATA } from './seed.js';

const DB_STORAGE_KEY = 'foodflow_db_v1';

class Database {
  constructor() {
    this.data = null;
    this.listeners = new Map(); // collectionName -> Set of callbacks
    this.init();
  }

  /**
   * Инициализация базы данных
   */
  init() {
    try {
      const raw = localStorage.getItem(DB_STORAGE_KEY);
      if (raw) {
        this.data = JSON.parse(raw);
        // Проверка структуры
        if (!this.data.users || !this.data.establishments || !this.data.menuItems) {
          console.warn('⚠️ Структура БД повреждена, переинициализация сидовыми данными');
          this.reset();
        } else if (this.data.ingredients) {
          // Нормализация остатков и порогов сырья
          this.data.ingredients.forEach(i => {
            if (i.currentStock === undefined || i.currentStock === null) {
              i.currentStock = i.stockQty !== undefined ? i.stockQty : 25;
            }
            if (i.minStockAlert === undefined || i.minStockAlert === null) {
              i.minStockAlert = i.minStockQty !== undefined ? i.minStockQty : 5;
            }
            if (i.purchasePrice === undefined || i.purchasePrice === null) {
              i.purchasePrice = i.costPrice || 100;
            }
          });
        }
      } else {
        this.reset();
      }
    } catch (e) {
      console.error('Ошибка загрузки БД:', e);
      this.reset();
    }
  }

  /**
   * Сохранение состояния в localStorage и оповещение подписчиков
   */
  save(changedCollection = null) {
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(this.data));
      this.notify(changedCollection);
    } catch (e) {
      console.error('Ошибка сохранения БД в localStorage:', e);
    }
  }

  /**
   * Сброс базы к эталонным сидовым данным
   */
  reset() {
    this.data = JSON.parse(JSON.stringify(INITIAL_SEED_DATA));
    this.save('*');
    console.log('🔄 База данных успешно сброшена к начальному демонстрационному датасету');
  }

  /**
   * Получение всей коллекции
   */
  getCollection(name) {
    if (!this.data[name]) {
      this.data[name] = [];
    }
    return JSON.parse(JSON.stringify(this.data[name]));
  }

  /**
   * Поиск элемента по ID
   */
  getById(name, id) {
    const list = this.getCollection(name);
    return list.find(item => item.id === id) || null;
  }

  /**
   * Фильтрация коллекции
   */
  query(name, filterFn) {
    const list = this.getCollection(name);
    return filterFn ? list.filter(filterFn) : list;
  }

  /**
   * Добавление новой записи
   */
  insert(name, record) {
    if (!this.data[name]) {
      this.data[name] = [];
    }

    if (!record.id) {
      const prefix = name.substring(0, 3);
      record.id = `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }

    if (!record.createdAt) {
      record.createdAt = new Date().toISOString();
    }

    this.data[name].push(record);
    this.save(name);
    return JSON.parse(JSON.stringify(record));
  }

  /**
   * Обновление записи
   */
  update(name, id, changes) {
    if (!this.data[name]) return null;

    const index = this.data[name].findIndex(item => item.id === id);
    if (index === -1) return null;

    this.data[name][index] = {
      ...this.data[name][index],
      ...changes,
      updatedAt: new Date().toISOString()
    };

    this.save(name);
    return JSON.parse(JSON.stringify(this.data[name][index]));
  }

  /**
   * Удаление записи
   */
  delete(name, id) {
    if (!this.data[name]) return false;

    const initialLength = this.data[name].length;
    this.data[name] = this.data[name].filter(item => item.id !== id);

    if (this.data[name].length !== initialLength) {
      this.save(name);
      return true;
    }
    return false;
  }

  /**
   * Реактивная подписка на изменения коллекции (Pub/Sub)
   */
  subscribe(collectionName, callback) {
    if (!this.listeners.has(collectionName)) {
      this.listeners.set(collectionName, new Set());
    }
    this.listeners.get(collectionName).add(callback);

    // Возврат функции отписки
    return () => {
      if (this.listeners.has(collectionName)) {
        this.listeners.get(collectionName).delete(callback);
      }
    };
  }

  /**
   * Оповещение подписчиков
   */
  notify(collectionName) {
    // Оповещение конкретной коллекции
    if (collectionName && this.listeners.has(collectionName)) {
      this.listeners.get(collectionName).forEach(cb => {
        try { cb(this.getCollection(collectionName)); } catch (err) { console.error(err); }
      });
    }

    // Оповещение глобальных подписчиков ('*')
    if (this.listeners.has('*')) {
      this.listeners.get('*').forEach(cb => {
        try { cb(collectionName, this.data); } catch (err) { console.error(err); }
      });
    }

    // Системное окно событий браузера
    window.dispatchEvent(new CustomEvent('dbUpdated', { detail: { collection: collectionName } }));
  }

  /**
   * Экспорт всей БД в JSON строку
   */
  exportJSON() {
    return JSON.stringify(this.data, null, 2);
  }

  /**
   * Импорт и валидация БД из JSON строки
   */
  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.users || !parsed.establishments || !parsed.ingredients) {
        throw new Error('Некорректная структура резервной копии базы данных');
      }
      this.data = parsed;
      this.save('*');
      return { success: true };
    } catch (e) {
      console.error('Ошибка импорта БД:', e);
      return { success: false, error: e.message };
    }
  }
}

// Экспортируем единственный синглтон-экземпляр
export const db = new Database();
