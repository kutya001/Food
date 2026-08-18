# План № 021: План устранения ошибки undefined coordinates в adminView.js

**Дата и время:** 2026-08-18 11:30

---

## План действий:
1. **Шаг 1:** В `js/views/adminView.js` заменить обращение `est.coordinates.lat` на безопасный вывод телефона, режима работы и рейтинга заведения (`est.phone`, `est.openHours`, `est.rating`).
2. **Шаг 2:** Проверить и обезопасить рендеринг таблицы организаций `organizations` в `adminView.js` (поддержка `employeesCount` / `employeeCount`, `monthlyLimit` / `budgetMonthly`, `contactPerson`).
3. **Шаг 3:** Зафиксировать отчет в `.artifacts/Выполнено/` и отправить коммит на GitHub.
