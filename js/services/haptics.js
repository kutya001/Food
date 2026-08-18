/**
 * HAPTICS.JS — Сервис тактильного виброотклика (Haptic Feedback API)
 * Соответствует стандартам Apple HIG (Taptic Engine) и Material Design 3
 */

export class Haptics {
  /**
   * Проверка поддержки вибрации браузером/устройством
   */
  static isSupported() {
    return typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function';
  }

  /**
   * Легкий щелчок при нажатии на кнопку, переключении таба или чипа (10мс)
   */
  static light() {
    if (this.isSupported()) {
      try {
        navigator.vibrate(10);
      } catch (e) {}
    }
  }

  /**
   * Средний тактильный отклик при переключении режима или открытии шторки (20мс)
   */
  static medium() {
    if (this.isSupported()) {
      try {
        navigator.vibrate(20);
      } catch (e) {}
    }
  }

  /**
   * Успешное действие: оплата чека, подтверждение заказа, вход в аккаунт ([15, 40, 15]мс)
   */
  static success() {
    if (this.isSupported()) {
      try {
        navigator.vibrate([15, 40, 15]);
      } catch (e) {}
    }
  }

  /**
   * Предупреждение: критический остаток, отмена заявки ([35, 60, 35]мс)
   */
  static warning() {
    if (this.isSupported()) {
      try {
        navigator.vibrate([35, 60, 35]);
      } catch (e) {}
    }
  }

  /**
   * Ошибка: превышение лимита, неверный пин-код ([60, 80, 60]мс)
   */
  static error() {
    if (this.isSupported()) {
      try {
        navigator.vibrate([60, 80, 60]);
      } catch (e) {}
    }
  }

  /**
   * Вибрация выбора при прокрутке списков/слайдеров (8мс)
   */
  static selection() {
    if (this.isSupported()) {
      try {
        navigator.vibrate(8);
      } catch (e) {}
    }
  }
}
