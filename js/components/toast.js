/**
 * TOAST.JS — Всплывающие уведомления
 */

export function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-root');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-root';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = {
    success: '✅',
    warning: '⚠️',
    error: '❌',
    info: '💡'
  };

  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || '🔔'}</span>
    <span class="toast-text">${message}</span>
  `;

  container.appendChild(toast);

  // Анимация появления
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Автоматическое скрытие
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}
