/**
 * EXPORT-SERVICE.JS — Экспорт, импорт и сброс базы данных в формате JSON
 */

import { db } from '../state/db.js';
import { showToast } from '../components/toast.js';

export class ExportService {
  /**
   * Выгрузка текущей базы данных в файл JSON
   */
  static exportToFile() {
    try {
      const jsonStr = db.exportJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const dateStr = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = url;
      a.download = `foodflow_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Резервная копия базы данных успешно выгружена в JSON', 'success');
    } catch (e) {
      console.error('Ошибка экспорта:', e);
      showToast('Ошибка при экспорте базы данных', 'error');
    }
  }

  /**
   * Загрузка базы данных из JSON файла
   */
  static importFromFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        showToast('Файл не выбран', 'warning');
        return reject('No file');
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          const res = db.importJSON(content);
          if (res.success) {
            showToast('База данных успешно восстановлена из резервной копии', 'success');
            resolve(true);
          } else {
            showToast(`Ошибка импорта: ${res.error}`, 'error');
            reject(res.error);
          }
        } catch (err) {
          showToast('Не удалось распарсить JSON файл', 'error');
          reject(err);
        }
      };

      reader.onerror = () => {
        showToast('Ошибка чтения файла', 'error');
        reject(reader.error);
      };

      reader.readAsText(file);
    });
  }

  /**
   * Сброс базы к эталонному демо-состоянию
   */
  static resetToSeed() {
    if (confirm('Сбросить базу данных к начальному демонстрационному датасету? Все внесённые изменения будут сброшены.')) {
      db.reset();
      showToast('База данных успешно сброшена к начальным демо-данным', 'info');
      // Обновляем страницу для чистого состояния
      setTimeout(() => window.location.reload(), 300);
    }
  }
}
