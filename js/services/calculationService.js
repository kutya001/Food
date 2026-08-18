/**
 * CALCULATION-SERVICE.JS — Движок расчета себестоимости, вложенных полуфабрикатов, КБЖУ и фудкоста
 */

import { db } from '../state/db.js';

export class CalculationService {
  /**
   * Полный рекурсивный расчёт технологической карты (включая полуфабрикаты)
   * @param {string|object} techCardOrId - Объект техкарты или её ID
   * @param {Set} visited - Защита от циклических зависимостей
   */
  static calculateTechCard(techCardOrId, visited = new Set()) {
    const techCard = typeof techCardOrId === 'string' 
      ? db.getById('techCards', techCardOrId) 
      : techCardOrId;

    if (!techCard) {
      return {
        costPrice: 0,
        outputWeight: 350,
        kbju: { calories: 0, protein: 0, fat: 0, carbs: 0 },
        kbjuPer100g: { calories: 0, protein: 0, fat: 0, carbs: 0 }
      };
    }

    if (techCard.id) {
      if (visited.has(techCard.id)) {
        console.warn('Обнаружена циклическая ссылка в техкартах:', techCard.id);
        return { costPrice: 0, kbju: { calories: 0, protein: 0, fat: 0, carbs: 0 } };
      }
      visited.add(techCard.id);
    }

    let totalCostSom = 0;
    let totalCalories = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;

    const items = techCard.items || [];

    for (const item of items) {
      // 1. Если это сырьевой ингредиент со склада
      if (item.ingredientId) {
        const ing = db.getById('ingredients', item.ingredientId);
        if (ing) {
          // Расчет стоимости: grossWeight в граммах переводим в кг (делим на 1000)
          const weightKg = item.grossWeight / 1000;
          const cost = weightKg * ing.purchasePrice;
          totalCostSom += cost;

          // Расчет КБЖУ по нетто весу (поддержка direct properties и kbjuPer100g)
          const netCoeff = (item.netWeight || item.grossWeight || 100) / 100;
          const cal = ing.kbjuPer100g?.calories ?? ing.calories ?? 0;
          const prot = ing.kbjuPer100g?.protein ?? ing.protein ?? 0;
          const fat = ing.kbjuPer100g?.fat ?? ing.fat ?? 0;
          const carbs = ing.kbjuPer100g?.carbs ?? ing.carbs ?? 0;

          totalCalories += cal * netCoeff;
          totalProtein += prot * netCoeff;
          totalFat += fat * netCoeff;
          totalCarbs += carbs * netCoeff;
        }
      }
      // 2. Если это вложенный полуфабрикат (другая техкарта)
      else if (item.semiFinishedCardId) {
        const semiCard = db.getById('techCards', item.semiFinishedCardId);
        if (semiCard) {
          const subCalc = this.calculateTechCard(semiCard, new Set(visited));
          const portionWeight = Math.max(1, semiCard.outputWeight || 100);
          const ratio = (item.grossWeight || portionWeight) / portionWeight;

          totalCostSom += (subCalc.costPrice * ratio);
          totalCalories += (subCalc.kbju.calories * ratio);
          totalProtein += (subCalc.kbju.protein * ratio);
          totalFat += (subCalc.kbju.fat * ratio);
          totalCarbs += (subCalc.kbju.carbs * ratio);
        }
      }
    }

    const outputWeight = techCard.outputWeight || 350;
    const factor100g = 100 / (outputWeight || 100);

    return {
      costPrice: Math.round(totalCostSom * 10) / 10,
      outputWeight: outputWeight,
      kbju: {
        calories: Math.round(totalCalories),
        protein: Math.round(totalProtein * 10) / 10,
        fat: Math.round(totalFat * 10) / 10,
        carbs: Math.round(totalCarbs * 10) / 10
      },
      kbjuPer100g: {
        calories: Math.round(totalCalories * factor100g),
        protein: Math.round(totalProtein * factor100g * 10) / 10,
        fat: Math.round(totalFat * factor100g * 10) / 10,
        carbs: Math.round(totalCarbs * factor100g * 10) / 10
      }
    };
  }

  /**
   * Расчет процента фудкоста (Food Cost %)
   */
  static calculateFoodCostPercent(costPrice, retailPrice) {
    if (!retailPrice || retailPrice <= 0) return 0;
    return Math.round((costPrice / retailPrice) * 1000) / 10;
  }

  /**
   * Рекомендуемая цена продажи на основе желаемого фудкоста (по умолчанию 30%)
   */
  static getRecommendedRetailPrice(costPrice, targetFoodCostPercent = 30) {
    if (!costPrice || costPrice <= 0) return 0;
    return Math.round(costPrice / (targetFoodCostPercent / 100));
  }

  /**
   * Суммарная стоимость складских запасов заведения в сомах
   */
  static calculateTotalWarehouseValue(estId) {
    const ingredients = db.query('ingredients', i => !estId || i.estId === estId);
    return Math.round(ingredients.reduce((sum, ing) => sum + (ing.currentStock * ing.purchasePrice), 0));
  }
}
