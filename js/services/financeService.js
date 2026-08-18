/**
 * FINANCE-SERVICE.JS — Сервис расчета P&L (Отчет о прибылях и убытках) и структуры доходов/расходов
 */

import { db } from '../state/db.js';

export class FinanceService {
  /**
   * Полный P&L расчет для заведения общепита
   * @param {string} estId - ID заведения
   */
  static getProfitAndLossReport(estId) {
    const orders = db.query('orders', o => !estId || o.estId === estId);
    const corpRequests = db.query('corpRequests', r => !estId || r.estId === estId);
    const techCards = db.query('techCards', tc => !estId || tc.estId === estId);

    // 1. ВЫРУЧКА (REVENUE)
    const b2cOrders = orders.filter(o => o.type === 'b2c_retail');
    const posOrders = orders.filter(o => o.type === 'pos_cashier');
    const validCorpStatuses = ['accepted', 'cooking', 'ready', 'on_way', 'delivered'];
    const completedCorp = corpRequests.filter(r => validCorpStatuses.includes(r.status));

    const b2cRevenue = b2cOrders.reduce((sum, o) => sum + (o.totalSum || 0), 0);
    const posRevenue = posOrders.reduce((sum, o) => sum + (o.totalSum || 0), 0);
    const b2bRevenue = completedCorp.reduce((sum, r) => sum + (r.totalSum || 0), 0);

    const totalRevenue = b2cRevenue + posRevenue + b2bRevenue;

    // 2. СЕБЕСТОИМОСТЬ СЫРЬЯ (COGS / FOOD COST)
    // Подсчет себестоимости по техкартам для пробитых заказов
    let cogsFoodCost = 0;

    orders.forEach(o => {
      (o.items || []).forEach(item => {
        const dish = db.getById('menuItems', item.menuItemId || item.id);
        const tc = db.getById('techCards', dish?.techCardId);
        const unitCost = tc ? (tc.costPrice || 100) : (item.price * 0.35);
        cogsFoodCost += unitCost * item.qty;
      });
    });

    completedCorp.forEach(r => {
      (r.items || []).forEach(item => {
        const dish = db.getById('menuItems', item.menuItemId || item.id);
        const tc = db.getById('techCards', dish?.techCardId);
        const unitCost = tc ? (tc.costPrice || 100) : (item.price * 0.35);
        cogsFoodCost += unitCost * item.qty;
      });
    });

    cogsFoodCost = Math.round(cogsFoodCost);

    // 3. ВАЛОВАЯ ПРИБЫЛЬ (GROSS PROFIT)
    const grossProfit = Math.max(0, totalRevenue - cogsFoodCost);
    const grossMarginPercent = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 1000) / 10 : 0;

    // 4. ОПЕРАЦИОННЫЕ РАСХОДЫ (OPEX)
    const opexSalaries = 38000; // ФОТ поваров и кассиров
    const opexRent = 25000;     // Аренда помещения
    const opexUtilities = 6500; // Коммунальные платежи и электричество
    const opexPackaging = Math.round(totalRevenue * 0.03); // Упаковка и расходники (3%)

    const totalOpex = opexSalaries + opexRent + opexUtilities + opexPackaging;

    // 5. ЧИСТАЯ ПРИБЫЛЬ (NET PROFIT)
    const netProfit = grossProfit - totalOpex;
    const netMarginPercent = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 1000) / 10 : 0;

    // Доли каналов выручки (%)
    const b2cShare = totalRevenue > 0 ? Math.round((b2cRevenue / totalRevenue) * 100) : 33;
    const posShare = totalRevenue > 0 ? Math.round((posRevenue / totalRevenue) * 100) : 34;
    const b2bShare = totalRevenue > 0 ? Math.max(0, 100 - b2cShare - posShare) : 33;

    return {
      revenue: {
        b2c: b2cRevenue,
        pos: posRevenue,
        b2b: b2bRevenue,
        total: totalRevenue,
        shares: { b2c: b2cShare, pos: posShare, b2b: b2bShare }
      },
      cogs: {
        foodCost: cogsFoodCost,
        percent: totalRevenue > 0 ? Math.round((cogsFoodCost / totalRevenue) * 1000) / 10 : 0
      },
      grossProfit: {
        amount: grossProfit,
        marginPercent: grossMarginPercent
      },
      opex: {
        salaries: opexSalaries,
        rent: opexRent,
        utilities: opexUtilities,
        packaging: opexPackaging,
        total: totalOpex
      },
      netProfit: {
        amount: netProfit,
        marginPercent: netMarginPercent
      }
    };
  }
}
