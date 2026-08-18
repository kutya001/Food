# Запрос № 021: Исправление ошибки TypeError: Cannot read properties of undefined (reading 'lat') в adminView.js

**Дата и время:** 2026-08-18 11:30

## Текст ошибки:
> adminView.js:123 Uncaught TypeError: Cannot read properties of undefined (reading 'lat')
> at adminView.js:123:67
> at Array.map (<anonymous>)
> at AdminView.renderCurrentTab (adminView.js:118:22)

## Цели:
1. Исправить небезопасное обращение к `est.coordinates.lat` в `js/views/adminView.js`, добавив проверку и вывод телефона/часов работы заведения.
2. Унифицировать чтение полей заведений и корпоративных организаций с защитой от `undefined` (safe navigation / fallbacks).
3. Зафиксировать изменения в истории и отправить в репозиторий GitHub.
