# Запрос № 020: Исправление ошибки экспорта seed.js и устранение 404 favicon.ico

**Дата и время:** 2026-08-18 11:26

## Текст запроса пользователя
> dbViewerView.js:7 Uncaught SyntaxError: The requested module '../state/seed.js' does not provide an export named 'SeedService' (at dbViewerView.js:7:10)
> favicon.ico:1  GET https://kutya001.github.io/favicon.ico 404 (Not Found)

## Задачи:
1. Устранить ошибку импорта в `js/views/dbViewerView.js` и добавить экспорт `SeedService` в `js/state/seed.js`.
2. В `index.html` добавить инлайн векторный SVG-favicon (🍲 FoodFlow) для полного предотвращения ошибок 404 в браузере.
3. Зафиксировать изменения, протестировать и отправить в GitHub.
