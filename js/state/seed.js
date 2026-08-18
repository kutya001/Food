/**
 * SEED.JS — Начальный демонстрационный датасет платформы FoodFlow
 * Все цены и учет строго в сомах.
 */

export const INITIAL_SEED_DATA = {
  version: 1,
  
  // Пользователи системы с единым профилем
  users: [
    {
      id: 'usr_main',
      name: 'Канат Омуралиев',
      email: 'kanat@foodflow.kg',
      phone: '+996 555 12-34-56',
      activeRole: 'client',
      roles: ['client', 'business', 'pos', 'corporate', 'admin'],
      themePreference: 'fresh',
      currentEstablishmentId: 'est_1',
      currentOrganizationId: 'org_1'
    }
  ],

  // Заведения общепита
  establishments: [
    {
      id: 'est_1',
      ownerId: 'usr_main',
      name: 'Столовая «Свежесть»',
      type: 'canteen',
      category: 'Столовая & Кафе',
      address: 'г. Бишкек, ул. Токтогула, 125',
      phone: '+996 312 66-77-88',
      rating: 4.9,
      reviewsCount: 142,
      openHours: '08:00 - 20:00',
      themeKey: 'fresh',
      icon: '🍲',
      status: 'open',
      description: 'Домашняя кухня, свежие национальные и европейские блюда каждый день.'
    },
    {
      id: 'est_2',
      ownerId: 'usr_main',
      name: 'Бургерная & Гриль «TaomGo»',
      type: 'fastfood',
      category: 'Фастфуд & Гриль',
      address: 'г. Бишкек, пр. Чуй, 178',
      phone: '+996 312 44-55-66',
      rating: 4.8,
      reviewsCount: 98,
      openHours: '10:00 - 23:00',
      themeKey: 'appetite',
      icon: '🍔',
      status: 'open',
      description: 'Сочные крафтовые бургеры из фермерской говядины и шашлыки на углях.'
    },
    {
      id: 'est_3',
      ownerId: 'usr_main',
      name: 'Ресторан «GastroHall»',
      type: 'restaurant',
      category: 'Премиум Ресторан',
      address: 'г. Бишкек, бул. Эркиндик, 45',
      phone: '+996 312 90-90-90',
      rating: 4.95,
      reviewsCount: 64,
      openHours: '12:00 - 01:00',
      themeKey: 'premium',
      icon: '🍷',
      status: 'open',
      description: 'Изысканная гастрономия, мраморные стейки dry-aged и морепродукты.'
    }
  ],

  // Корпоративные организации-заказчики
  organizations: [
    {
      id: 'org_1',
      name: 'ОсОО «Alfa Tech IT Group»',
      taxId: '01205202110254',
      employeesCount: 45,
      dailyBudgetPerPerson: 350,
      monthlySpent: 315000,
      monthlyLimit: 450000,
      address: 'IT Park, блок B, 4 этаж',
      contactPerson: 'Азамат Ибраев (+996 550 11-22-33)',
      activeMenuContractEstId: 'est_1'
    },
    {
      id: 'org_2',
      name: 'ОАО «Бишкек Финанс Банк»',
      taxId: '00908201810432',
      employeesCount: 120,
      dailyBudgetPerPerson: 400,
      monthlySpent: 960000,
      monthlyLimit: 1200000,
      address: 'ул. Киевская, 96',
      contactPerson: 'Елена Смирнова (+996 700 99-88-77)',
      activeMenuContractEstId: 'est_1'
    }
  ],

  // Склады
  warehouses: [
    { id: 'wh_1', estId: 'est_1', name: 'Основной продуктовый склад', type: 'main' },
    { id: 'wh_2', estId: 'est_2', name: 'Склад охлаждённого мяса и полуфабрикатов', type: 'main' },
    { id: 'wh_3', estId: 'est_3', name: 'Винный и мясной погреб', type: 'main' }
  ],

  // Справочник ингредиентов (сырьё)
  ingredients: [
    { id: 'ing_1', estId: 'est_1', name: 'Говядина мякоть (халяль)', category: 'Мясо', unit: 'кг', purchasePrice: 620, calories: 250, protein: 26, fat: 15, carbs: 0, allergens: [], stockQty: 45.5, minStockQty: 10 },
    { id: 'ing_2', estId: 'est_1', name: 'Рис Лазер (узбекский)', category: 'Крупы', unit: 'кг', purchasePrice: 160, calories: 360, protein: 7, fat: 1, carbs: 78, allergens: [], stockQty: 80.0, minStockQty: 20 },
    { id: 'ing_3', estId: 'est_1', name: 'Морковь жёлтая', category: 'Овощи', unit: 'кг', purchasePrice: 45, calories: 35, protein: 1.3, fat: 0.1, carbs: 7, allergens: [], stockQty: 60.0, minStockQty: 15 },
    { id: 'ing_4', estId: 'est_1', name: 'Лук репчатый', category: 'Овощи', unit: 'кг', purchasePrice: 30, calories: 41, protein: 1.4, fat: 0.2, carbs: 8.2, allergens: [], stockQty: 55.0, minStockQty: 10 },
    { id: 'ing_5', estId: 'est_1', name: 'Масло хлопковое рафинированное', category: 'Масла', unit: 'л', purchasePrice: 190, calories: 899, protein: 0, fat: 99.9, carbs: 0, allergens: [], stockQty: 35.0, minStockQty: 8 },
    { id: 'ing_6', estId: 'est_1', name: 'Нут отборный', category: 'Бобовые', unit: 'кг', purchasePrice: 180, calories: 364, protein: 19, fat: 6, carbs: 61, allergens: [], stockQty: 25.0, minStockQty: 5 },
    { id: 'ing_7', estId: 'est_1', name: 'Зира таджикская ароматная', category: 'Специи', unit: 'кг', purchasePrice: 850, calories: 375, protein: 18, fat: 22, carbs: 44, allergens: [], stockQty: 4.5, minStockQty: 1 },
    { id: 'ing_8', estId: 'est_1', name: 'Куриное филе охлаждённое', category: 'Птица', unit: 'кг', purchasePrice: 380, calories: 165, protein: 31, fat: 3.6, carbs: 0, allergens: [], stockQty: 32.0, minStockQty: 10 },
    { id: 'ing_9', estId: 'est_1', name: 'Мука пшеничная высший сорт', category: 'Бакалея', unit: 'кг', purchasePrice: 65, calories: 334, protein: 10.3, fat: 1.1, carbs: 68.9, allergens: ['Глютен'], stockQty: 120.0, minStockQty: 30 },
    { id: 'ing_10', estId: 'est_1', name: 'Свекла свежая', category: 'Овощи', unit: 'кг', purchasePrice: 40, calories: 43, protein: 1.5, fat: 0.1, carbs: 8.8, allergens: [], stockQty: 40.0, minStockQty: 10 },
    { id: 'ing_11', estId: 'est_1', name: 'Капуста белокочанная', category: 'Овощи', unit: 'кг', purchasePrice: 35, calories: 25, protein: 1.8, fat: 0.1, carbs: 4.7, allergens: [], stockQty: 50.0, minStockQty: 15 },
    { id: 'ing_12', estId: 'est_1', name: 'Картофель фермерский', category: 'Овощи', unit: 'кг', purchasePrice: 38, calories: 77, protein: 2, fat: 0.4, carbs: 16.3, allergens: [], stockQty: 140.0, minStockQty: 25 },
    { id: 'ing_13', estId: 'est_1', name: 'Томатная паста 25%', category: 'Бакалея', unit: 'кг', purchasePrice: 210, calories: 82, protein: 4.8, fat: 0.5, carbs: 15.8, allergens: [], stockQty: 18.0, minStockQty: 5 },
    { id: 'ing_14', estId: 'est_1', name: 'Помидоры сочные Южные', category: 'Овощи', unit: 'кг', purchasePrice: 120, calories: 20, protein: 1.1, fat: 0.2, carbs: 3.7, allergens: [], stockQty: 30.0, minStockQty: 8 },
    { id: 'ing_15', estId: 'est_1', name: 'Огурцы грунтовые', category: 'Овощи', unit: 'кг', purchasePrice: 90, calories: 15, protein: 0.8, fat: 0.1, carbs: 2.8, allergens: [], stockQty: 25.0, minStockQty: 6 },
    { id: 'ing_16', estId: 'est_1', name: 'Зелень свежая (кинза, укроп)', category: 'Зелень', unit: 'кг', purchasePrice: 220, calories: 38, protein: 2.5, fat: 0.5, carbs: 5.2, allergens: [], stockQty: 8.0, minStockQty: 2 },
    { id: 'ing_17', estId: 'est_1', name: 'Яйцо куриное С0', category: 'Яйца', unit: 'шт', purchasePrice: 11, calories: 74, protein: 6.3, fat: 5.2, carbs: 0.4, allergens: ['Яйца'], stockQty: 360, minStockQty: 60 },
    { id: 'ing_18', estId: 'est_1', name: 'Сметана 20%', category: 'Молочные', unit: 'кг', purchasePrice: 240, calories: 206, protein: 2.8, fat: 20, carbs: 3.2, allergens: ['Лактоза'], stockQty: 15.0, minStockQty: 4 },
    { id: 'ing_19', estId: 'est_2', name: 'Булочки бриошь для бургеров', category: 'Хлеб', unit: 'шт', purchasePrice: 26, calories: 185, protein: 5.5, fat: 4.8, carbs: 29.5, allergens: ['Глютен', 'Лактоза'], stockQty: 85, minStockQty: 20 },
    { id: 'ing_20', estId: 'est_2', name: 'Сыр Чеддер слайсы', category: 'Сыр', unit: 'кг', purchasePrice: 680, calories: 402, protein: 25, fat: 33, carbs: 1.3, allergens: ['Лактоза'], stockQty: 12.0, minStockQty: 3 },
    { id: 'ing_21', estId: 'est_2', name: 'Соус барбекю крафтовый', category: 'Соусы', unit: 'л', purchasePrice: 260, calories: 140, protein: 1.2, fat: 0.5, carbs: 32, allergens: [], stockQty: 10.0, minStockQty: 2 },
    { id: 'ing_22', estId: 'est_3', name: 'Стейк Рибай мраморная говядина', category: 'Мясо Premium', unit: 'кг', purchasePrice: 1450, calories: 290, protein: 24, fat: 21, carbs: 0, allergens: [], stockQty: 18.5, minStockQty: 5 },
    { id: 'ing_23', estId: 'est_3', name: 'Креветки тигровые 16/20', category: 'Морепродукты', unit: 'кг', purchasePrice: 1100, calories: 95, protein: 21, fat: 1.2, carbs: 0.5, allergens: ['Морепродукты'], stockQty: 14.0, minStockQty: 4 },
    { id: 'ing_24', estId: 'est_3', name: 'Сливки кулинарные 33%', category: 'Молочные', unit: 'л', purchasePrice: 340, calories: 314, protein: 2.5, fat: 33, carbs: 4.0, allergens: ['Лактоза'], stockQty: 16.0, minStockQty: 4 }
  ],

  // Технологические карты и калькуляция (с полуфабрикатами)
  techCards: [
    // --- ПОЛУФАБРИКАТЫ ---
    {
      id: 'tc_semi_1',
      estId: 'est_1',
      name: 'Бульон говяжий крепкий',
      isSemiFinished: true,
      yieldNetto: 1000, // грамм
      calculatedCost: 72,
      calculatedKbju: { calories: 45, protein: 5.2, fat: 2.4, carbs: 0.6 },
      version: 1,
      items: [
        { ingredientId: 'ing_1', grossQty: 0.15, lossPercent: 10, netQty: 0.135 },
        { ingredientId: 'ing_4', grossQty: 0.05, lossPercent: 15, netQty: 0.0425 }
      ]
    },
    {
      id: 'tc_semi_2',
      estId: 'est_1',
      name: 'Фарш домашний со специями',
      isSemiFinished: true,
      yieldNetto: 1000,
      calculatedCost: 440,
      calculatedKbju: { calories: 240, protein: 22, fat: 16, carbs: 2 },
      version: 1,
      items: [
        { ingredientId: 'ing_1', grossQty: 0.70, lossPercent: 5, netQty: 0.665 },
        { ingredientId: 'ing_4', grossQty: 0.25, lossPercent: 15, netQty: 0.212 },
        { ingredientId: 'ing_7', grossQty: 0.01, lossPercent: 0, netQty: 0.01 }
      ]
    },

    // --- ГОТОВЫЕ БЛЮДА ---
    {
      id: 'tc_1',
      estId: 'est_1',
      name: 'Плов чайханский',
      isSemiFinished: false,
      yieldNetto: 350,
      calculatedCost: 118,
      calculatedKbju: { calories: 520, protein: 22, fat: 26, carbs: 48 },
      version: 2,
      items: [
        { ingredientId: 'ing_1', grossQty: 0.12, lossPercent: 20, netQty: 0.096 },
        { ingredientId: 'ing_2', grossQty: 0.10, lossPercent: 0, netQty: 0.10 },
        { ingredientId: 'ing_3', grossQty: 0.10, lossPercent: 20, netQty: 0.08 },
        { ingredientId: 'ing_4', grossQty: 0.05, lossPercent: 15, netQty: 0.042 },
        { ingredientId: 'ing_5', grossQty: 0.03, lossPercent: 0, netQty: 0.03 },
        { ingredientId: 'ing_6', grossQty: 0.02, lossPercent: 0, netQty: 0.02 },
        { ingredientId: 'ing_7', grossQty: 0.002, lossPercent: 0, netQty: 0.002 }
      ]
    },
    {
      id: 'tc_2',
      estId: 'est_1',
      name: 'Борщ с говядиной и сметаной',
      isSemiFinished: false,
      yieldNetto: 350,
      calculatedCost: 82,
      calculatedKbju: { calories: 260, protein: 18, fat: 12, carbs: 20 },
      version: 1,
      items: [
        { ingredientId: 'ing_1', grossQty: 0.08, lossPercent: 15, netQty: 0.068 },
        { ingredientId: 'ing_10', grossQty: 0.06, lossPercent: 20, netQty: 0.048 },
        { ingredientId: 'ing_11', grossQty: 0.06, lossPercent: 15, netQty: 0.051 },
        { ingredientId: 'ing_12', grossQty: 0.06, lossPercent: 20, netQty: 0.048 },
        { ingredientId: 'ing_13', grossQty: 0.02, lossPercent: 0, netQty: 0.02 },
        { ingredientId: 'ing_18', grossQty: 0.03, lossPercent: 0, netQty: 0.03 }
      ]
    },
    {
      id: 'tc_3',
      estId: 'est_1',
      name: 'Салат Ачучук',
      isSemiFinished: false,
      yieldNetto: 180,
      calculatedCost: 36,
      calculatedKbju: { calories: 85, protein: 1.5, fat: 4.5, carbs: 9.0 },
      version: 1,
      items: [
        { ingredientId: 'ing_14', grossQty: 0.12, lossPercent: 10, netQty: 0.108 },
        { ingredientId: 'ing_4', grossQty: 0.04, lossPercent: 15, netQty: 0.034 },
        { ingredientId: 'ing_16', grossQty: 0.015, lossPercent: 10, netQty: 0.0135 }
      ]
    },
    {
      id: 'tc_4',
      estId: 'est_1',
      name: 'Манты с рубленым мясом (5 шт)',
      isSemiFinished: false,
      yieldNetto: 320,
      calculatedCost: 104,
      calculatedKbju: { calories: 490, protein: 21, fat: 22, carbs: 52 },
      version: 1,
      items: [
        { ingredientId: 'ing_1', grossQty: 0.13, lossPercent: 10, netQty: 0.117 },
        { ingredientId: 'ing_4', grossQty: 0.08, lossPercent: 15, netQty: 0.068 },
        { ingredientId: 'ing_9', grossQty: 0.09, lossPercent: 5, netQty: 0.0855 }
      ]
    },
    {
      id: 'tc_5',
      estId: 'est_2',
      name: 'Бургер Двойной Чизбургер',
      isSemiFinished: false,
      yieldNetto: 330,
      calculatedCost: 172,
      calculatedKbju: { calories: 680, protein: 34, fat: 38, carbs: 46 },
      version: 1,
      items: [
        { ingredientId: 'ing_19', grossQty: 1, lossPercent: 0, netQty: 1 },
        { ingredientId: 'ing_1', grossQty: 0.18, lossPercent: 15, netQty: 0.153 },
        { ingredientId: 'ing_20', grossQty: 0.04, lossPercent: 0, netQty: 0.04 },
        { ingredientId: 'ing_21', grossQty: 0.03, lossPercent: 0, netQty: 0.03 }
      ]
    },
    {
      id: 'tc_6',
      estId: 'est_3',
      name: 'Стейк Рибай с пряными травами',
      isSemiFinished: false,
      yieldNetto: 320,
      calculatedCost: 510,
      calculatedKbju: { calories: 620, protein: 52, fat: 44, carbs: 6 },
      version: 1,
      items: [
        { ingredientId: 'ing_22', grossQty: 0.35, lossPercent: 12, netQty: 0.308 },
        { ingredientId: 'ing_16', grossQty: 0.02, lossPercent: 10, netQty: 0.018 }
      ]
    }
  ],

  // Меню готовых блюд
  menuItems: [
    {
      id: 'menu_1',
      estId: 'est_1',
      techCardId: 'tc_1',
      name: 'Плов чайханский с говядиной',
      category: 'Вторые блюда',
      retailPrice: 280,
      corpPrice: 240,
      photoIcon: '🍛',
      inStopList: false,
      dietary: ['halal'],
      isDaily: true,
      portionWeight: '350 г',
      description: 'Ароматный узбекский плов на хлопковом масле с мясом, нутом и зирой.'
    },
    {
      id: 'menu_2',
      estId: 'est_1',
      techCardId: 'tc_2',
      name: 'Борщ по-домашнему со сметаной',
      category: 'Супы',
      retailPrice: 210,
      corpPrice: 180,
      photoIcon: '🍲',
      inStopList: false,
      dietary: ['halal'],
      isDaily: true,
      portionWeight: '350 г',
      description: 'Наваристый борщ на говяжьем бульоне со свежей капустой и сметаной.'
    },
    {
      id: 'menu_3',
      estId: 'est_1',
      techCardId: 'tc_3',
      name: 'Салат «Ачучук»',
      category: 'Салаты',
      retailPrice: 120,
      corpPrice: 100,
      photoIcon: '🥗',
      inStopList: false,
      dietary: ['vegan', 'gluten_free', 'halal'],
      isDaily: true,
      portionWeight: '180 г',
      description: 'Тонко нарезанные сочные томаты с луком и зеленью к плову.'
    },
    {
      id: 'menu_4',
      estId: 'est_1',
      techCardId: 'tc_4',
      name: 'Манты с рубленым мясом (5 шт)',
      category: 'Вторые блюда',
      retailPrice: 260,
      corpPrice: 230,
      photoIcon: '🥟',
      inStopList: false,
      dietary: ['halal'],
      isDaily: true,
      portionWeight: '320 г',
      description: 'Традиционные сочные манты на пару из тонкого теста с рубленым мясом.'
    },
    {
      id: 'menu_5',
      estId: 'est_2',
      techCardId: 'tc_5',
      name: 'Бургер «Double Cheddar»',
      category: 'Бургеры',
      retailPrice: 380,
      corpPrice: 340,
      photoIcon: '🍔',
      inStopList: false,
      dietary: ['halal'],
      isDaily: true,
      portionWeight: '330 г',
      description: 'Две котлеты из сочной говядины, двойной сыр Чеддер и фирменный соус в бриоши.'
    },
    {
      id: 'menu_6',
      estId: 'est_3',
      techCardId: 'tc_6',
      name: 'Стейк Рибай Premium Dry-Aged',
      category: 'Стейки & Гриль',
      retailPrice: 1200,
      corpPrice: 1050,
      photoIcon: '🥩',
      inStopList: false,
      dietary: ['halal', 'gluten_free'],
      isDaily: true,
      portionWeight: '320 г',
      description: 'Премиальный отруб мраморной говядины с прожаркой medium и пряным розмарином.'
    }
  ],

  // Кассовые смены POS
  posShifts: [
    {
      id: 'shift_42',
      estId: 'est_1',
      cashierName: 'Алина К.',
      openedAt: '2026-08-18T08:00:00.000Z',
      closedAt: null,
      cashRevenue: 18400,
      cardRevenue: 24100,
      totalRevenue: 42500,
      receiptsCount: 38,
      status: 'open'
    }
  ],

  // Заказы
  orders: [
    {
      id: 'ord_101',
      userId: 'usr_main',
      estId: 'est_1',
      type: 'b2c_retail',
      items: [
        { menuItemId: 'menu_1', name: 'Плов чайханский', qty: 2, price: 280, total: 560 },
        { menuItemId: 'menu_3', name: 'Салат «Ачучук»', qty: 2, price: 120, total: 240 }
      ],
      totalSum: 800,
      paymentMethod: 'card',
      status: 'delivered',
      createdAt: '2026-08-18T09:15:00.000Z'
    }
  ],

  // Корпоративные заявки
  corpRequests: [
    {
      id: 'req_201',
      orgId: 'org_1',
      estId: 'est_1',
      targetDate: '2026-08-19',
      items: [
        { menuItemId: 'menu_1', name: 'Плов чайханский', portions: 30, corpPrice: 240, dept: 'Отдел разработки' },
        { menuItemId: 'menu_2', name: 'Борщ по-домашнему', portions: 15, corpPrice: 180, dept: 'Отдел маркетинга' }
      ],
      totalSum: 9900,
      status: 'confirmed',
      comments: 'Доставка к 12:30, упаковать порционно в био-боксы.'
    }
  ]
};

export const SeedService = {
  getInitialData: () => JSON.parse(JSON.stringify(INITIAL_SEED_DATA)),
  seedAll: () => INITIAL_SEED_DATA
};

