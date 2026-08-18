/**
 * BUSINESS-FINANCE-VIEW.JS — Финансовый отчёт P&L (прибыли и убытки) и Data-Viz аналитика
 */

import { db } from '../state/db.js';
import { AuthManager } from '../state/auth.js';
import { FinanceService } from '../services/financeService.js';

export class BusinessFinanceView {
  static render(container) {
    const est = AuthManager.getActiveEstablishment() || { id: 'est_1', name: 'Столовая «Свежесть»' };
    const pl = FinanceService.getProfitAndLossReport(est.id);

    container.innerHTML = `
      <div>
        <!-- Верхние KPI карточки финансов -->
        <div class="finance-kpi-grid">
          <div class="kpi-stat-card">
            <span class="text-xs text-muted">Выручка (Revenue):</span>
            <div class="kpi-stat-value" style="color: var(--color-primary);">${pl.revenue.total} сом</div>
            <small class="text-muted" style="font-size:11px; margin-top:4px;">B2C + POS + B2B</small>
          </div>
          <div class="kpi-stat-card">
            <span class="text-xs text-muted">Себестоимость сырья (COGS):</span>
            <div class="kpi-stat-value" style="color: var(--color-warning);">${pl.cogs.foodCost} сом</div>
            <small class="text-muted" style="font-size:11px; margin-top:4px;">Food Cost: ${pl.cogs.percent}%</small>
          </div>
          <div class="kpi-stat-card">
            <span class="text-xs text-muted">Валовая прибыль (Gross):</span>
            <div class="kpi-stat-value">${pl.grossProfit.amount} сом</div>
            <small class="text-muted" style="font-size:11px; margin-top:4px;">Маржа: ${pl.grossProfit.marginPercent}%</small>
          </div>
          <div class="kpi-stat-card">
            <span class="text-xs text-muted">Чистая прибыль (Net Profit):</span>
            <div class="kpi-stat-value" style="color: ${pl.netProfit.amount >= 0 ? 'var(--color-success)' : 'var(--color-error)'};">
              ${pl.netProfit.amount} сом
            </div>
            <small class="text-muted" style="font-size:11px; margin-top:4px;">Рентабельность: ${pl.netProfit.marginPercent}%</small>
          </div>
        </div>

        <!-- Data-Viz структура выручки -->
        <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-4); margin-bottom: var(--space-6); box-shadow: var(--shadow-card);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="font-size: var(--font-size-sm);">📊 Структура выручки по каналам продаж:</strong>
            <span class="text-xs text-muted">Всего: ${pl.revenue.total} сом</span>
          </div>

          <div class="dataviz-bar-container">
            <div class="dataviz-segment dataviz-seg-b2c" style="width: ${pl.revenue.shares.b2c}%;" title="B2C Доставка: ${pl.revenue.b2c} сом (${pl.revenue.shares.b2c}%)"></div>
            <div class="dataviz-segment dataviz-seg-pos" style="width: ${pl.revenue.shares.pos}%;" title="POS Касса: ${pl.revenue.pos} сом (${pl.revenue.shares.pos}%)"></div>
            <div class="dataviz-segment dataviz-seg-b2b" style="width: ${pl.revenue.shares.b2b}%;" title="B2B Корпоративное: ${pl.revenue.b2b} сом (${pl.revenue.shares.b2b}%)"></div>
          </div>

          <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: var(--space-2); font-size: var(--font-size-xs);">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="width: 10px; height: 10px; border-radius: 50%; background: var(--data-viz-1);"></span>
              <span>B2C Онлайн-витрина: <strong>${pl.revenue.b2c} сом (${pl.revenue.shares.b2c}%)</strong></span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="width: 10px; height: 10px; border-radius: 50%; background: var(--data-viz-2);"></span>
              <span>POS-Касса (зал и вынос): <strong>${pl.revenue.pos} сом (${pl.revenue.shares.pos}%)</strong></span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="width: 10px; height: 10px; border-radius: 50%; background: var(--data-viz-3);"></span>
              <span>B2B Корпоративное питание: <strong>${pl.revenue.b2b} сом (${pl.revenue.shares.b2b}%)</strong></span>
            </div>
          </div>
        </div>

        <!-- Отчёт о прибылях и убытках (P&L Statement) -->
        <div class="pl-statement-container">
          <div style="padding: var(--space-4); border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: var(--font-size-md);">📑 Отчёт о прибылях и убытках (P&L Statement)</h3>
            <span class="badge badge-primary">Валюта: сом (KGS)</span>
          </div>

          <table class="pl-table">
            <thead>
              <tr>
                <th style="width: 60%;">Статья доходов / расходов</th>
                <th style="width: 25%; text-align: right;">Сумма (сом)</th>
                <th style="width: 15%; text-align: right;">% от выручки</th>
              </tr>
            </thead>
            <tbody>
              <!-- 1. ДОХОДЫ -->
              <tr class="pl-row-header">
                <td colspan="3">1. ВЫРУЧКА ОТ РЕАЛИЗАЦИИ (REVENUE)</td>
              </tr>
              <tr>
                <td style="padding-left: 28px;">• B2C Онлайн-заказы (доставка и самовывоз)</td>
                <td style="text-align: right;">${pl.revenue.b2c} сом</td>
                <td style="text-align: right;">${pl.revenue.shares.b2c}%</td>
              </tr>
              <tr>
                <td style="padding-left: 28px;">• POS-терминал кассы (обслуживание в зале)</td>
                <td style="text-align: right;">${pl.revenue.pos} сом</td>
                <td style="text-align: right;">${pl.revenue.shares.pos}%</td>
              </tr>
              <tr>
                <td style="padding-left: 28px;">• B2B Корпоративные договоры питания</td>
                <td style="text-align: right;">${pl.revenue.b2b} сом</td>
                <td style="text-align: right;">${pl.revenue.shares.b2b}%</td>
              </tr>
              <tr class="pl-row-total">
                <td><strong>ИТОГО ВЫРУЧКА</strong></td>
                <td style="text-align: right; color: var(--color-primary);"><strong>${pl.revenue.total} сом</strong></td>
                <td style="text-align: right;"><strong>100.0%</strong></td>
              </tr>

              <!-- 2. СЕБЕСТОИМОСТЬ -->
              <tr class="pl-row-header">
                <td colspan="3">2. ПРЯМЫЕ ЗАТРАТЫ НА СЫРЬЕ (COGS / FOOD COST)</td>
              </tr>
              <tr>
                <td style="padding-left: 28px;">• Списание ингредиентов со склада по техкартам</td>
                <td style="text-align: right; color: var(--color-error);">- ${pl.cogs.foodCost} сом</td>
                <td style="text-align: right;">${pl.cogs.percent}%</td>
              </tr>
              <tr class="pl-row-total">
                <td><strong>ВАЛОВАЯ ПРИБЫЛЬ (GROSS PROFIT)</strong></td>
                <td style="text-align: right;"><strong>${pl.grossProfit.amount} сом</strong></td>
                <td style="text-align: right;"><strong>${pl.grossProfit.marginPercent}%</strong></td>
              </tr>

              <!-- 3. ОПЕРАЦИОННЫЕ РАСХОДЫ -->
              <tr class="pl-row-header">
                <td colspan="3">3. ОПЕРАЦИОННЫЕ РАСХОДЫ (OPEX)</td>
              </tr>
              <tr>
                <td style="padding-left: 28px;">• ФОТ персонала кухни и кассиров</td>
                <td style="text-align: right; color: var(--color-error);">- ${pl.opex.salaries} сом</td>
                <td style="text-align: right;">${pl.revenue.total ? Math.round((pl.opex.salaries / pl.revenue.total) * 100) : 0}%</td>
              </tr>
              <tr>
                <td style="padding-left: 28px;">• Аренда производственного помещения</td>
                <td style="text-align: right; color: var(--color-error);">- ${pl.opex.rent} сом</td>
                <td style="text-align: right;">${pl.revenue.total ? Math.round((pl.opex.rent / pl.revenue.total) * 100) : 0}%</td>
              </tr>
              <tr>
                <td style="padding-left: 28px;">• Коммунальные услуги и электричество</td>
                <td style="text-align: right; color: var(--color-error);">- ${pl.opex.utilities} сом</td>
                <td style="text-align: right;">${pl.revenue.total ? Math.round((pl.opex.utilities / pl.revenue.total) * 100) : 0}%</td>
              </tr>
              <tr>
                <td style="padding-left: 28px;">• Упаковка, боксы и расходные материалы (3%)</td>
                <td style="text-align: right; color: var(--color-error);">- ${pl.opex.packaging} сом</td>
                <td style="text-align: right;">3.0%</td>
              </tr>
              <tr class="pl-row-total">
                <td><strong>ИТОГО ОПЕРАЦИОННЫЕ РАСХОДЫ (OPEX)</strong></td>
                <td style="text-align: right; color: var(--color-error);"><strong>- ${pl.opex.total} сом</strong></td>
                <td style="text-align: right;"><strong>${pl.revenue.total ? Math.round((pl.opex.total / pl.revenue.total) * 100) : 0}%</strong></td>
              </tr>

              <!-- 4. ЧИСТАЯ ПРИБЫЛЬ -->
              <tr class="pl-row-total" style="background: var(--color-surface); font-size: var(--font-size-md); border-top: 3px solid var(--color-primary);">
                <td><strong style="color: var(--color-primary);">4. ЧИСТАЯ ПРИБЫЛЬ (NET PROFIT)</strong></td>
                <td style="text-align: right; font-size: var(--font-size-xl); color: ${pl.netProfit.amount >= 0 ? 'var(--color-success)' : 'var(--color-error)'};">
                  <strong>${pl.netProfit.amount} сом</strong>
                </td>
                <td style="text-align: right; font-size: var(--font-size-md);">
                  <strong>${pl.netProfit.marginPercent}%</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}
