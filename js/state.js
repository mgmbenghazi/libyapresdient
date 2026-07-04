// إدارة حالة اللعبة والحفظ/التحميل، مع نظام ترحيل (migration) لأشكال الحفظ القديمة
const SAVE_KEY = 'rayyes_libya_save';

// تاريخ إصدارات شكل الحفظ (schema) - كل تغيير في بنية الحالة المحفوظة يجب أن يرفع هذا الرقم
// 1: الشكل الأساسي الأول (بدون شخصيات/وزراء، وبدون قطاعات الزراعة/السياحة/الصناعة/الميزان التجاري)
// 2: + نظام الشخصيات (characters) ومجلس الوزراء (cabinet)
// 3: + مؤشرات القطاعات الجديدة (agricultureLevel, tourismLevel, industryLevel, tradeBalance)
// 4: + شبكة علاقات الشخصيات (characterRelations) ونظام المهام (missions) وحقل busyUntil لكل شخصية
// 5: + مهلة تبريد للأحداث العشوائية (eventCooldowns) لمنع تكرارها المتتالي
// 6: + سياسات القطاعات الإنتاجية (sectorPolicies) وأسطر استثمارها في الميزانية (oilSector/agricultureSector/tourismSector/industrySector)
// 7: + مهلة تبريد إجراء "التواصل" المباشر مع كيانات العلاقات (relationsCooldowns)
// 8: + سياسة الاقتصاد الكلي الدائمة (macroPolicy): معدلات الضرائب الثلاثة، دعم المحروقات، استراتيجية الدين
// 9: + سلاسل الأزمات المجدولة (pendingFollowUps) وعدّادات المخاطرة النظامية (austerityStreak, securityNeglectStreak)
//    + الدورة الاقتصادية العالمية (economy.worldCycle, economy.worldCycleMonthsLeft) فوق مشي سعر النفط العشوائي
// 10: بنود الميزانية (budget.allocations) أصبحت مبالغ مطلقة بالمليون د.ل بدل نسب من الإيراد المتقلب،
//     مع خط أساس ثابت budget.baseline وإيراد مرجعي budget.referenceRevenue يُحسبان عند إنشاء اللعبة
// 11: + رأس المال السياسي (politicalCapital) ولوحة الإجراءات الرئاسية الاستباقية (actionCooldowns, actionsLog)
//     + المسار الدستوري اللارجعة (constitution) + المؤامرات (schemes) + منافس انتخابي حي (rival)
// 12: + معدِّلات التحدي الاختيارية النشطة لهذه اللعبة (activeChallenges) - جزء من إرث الرئاسة الدائم
// 13: + السياسة النقدية الدائمة (monetaryPolicy): سعر الفائدة الأساسي ونظام سعر الصرف، وخيار "طباعة نقدية"
//     ضمن استراتيجية تمويل العجز + عدّاد أزمة نفاد احتياطي (fxReserveCrisis) ضمن engineStreaks
// 14: + السيادة المنقسمة (sovereignty): سلطة موازية بجيشها وداعميها الأجانب، حصار نفطي، انقسام المصرف
//     المركزي وشركة النفط، ومسار انتخابات موحدة قابل للانهيار - يعكس واقع ليبيا منذ 2014
//     + عدّاد توتر السيادة (sovereigntyTension) ضمن engineStreaks
const CURRENT_SAVE_VERSION = 14;

function createInitialState(scenarioId, presidentName, backgroundId, advisorChoices, challengeIds) {
  const scenario = SCENARIOS.find(s => s.id === scenarioId);
  const background = POLITICAL_BACKGROUNDS.find(b => b.id === backgroundId);
  const indicators = { ...scenario.startIndicators };

  if (background) {
    Object.entries(background.bonus || {}).forEach(([k, v]) => indicators[k] = clampIndicator(k, (indicators[k] || 0) + v));
    Object.entries(background.malus || {}).forEach(([k, v]) => indicators[k] = clampIndicator(k, (indicators[k] || 0) + v));
  }

  const economy = { oilPrice: 100, worldCycle: 'normal', worldCycleMonthsLeft: 4 + Math.floor(Math.random() * 7) };
  const sectorPolicies = {
    oil: { ownership: 'state', orientation: 75 },
    agriculture: { ownership: 'privatized', orientation: 30 },
    tourism: { ownership: 'privatized', orientation: 40 },
    industry: { ownership: 'state', orientation: 45 }
  };
  const macroPolicy = {
    corporateTaxRate: 20, consumptionTaxRate: 8, customsTariffRate: 15,
    fuelSubsidyLevel: 75, debtStrategy: 'domestic',
    _prevFuelSubsidy: 75 // خط أساس صدمة خفض الدعم - يُهيَّأ هنا لا عند أول دورة شهرية، وإلا فات رصد أول تعديل يجريه اللاعب قبل الشهر الأول
  };
  const monetaryPolicy = {
    interestRate: 5, // % - الحياد المرجعي؛ رفعه يكبح التضخم ويبطئ النمو قليلاً، خفضه عكس ذلك
    exchangeRegime: 'managed' // 'fixed' (تثبيت) | 'managed' (تعويم مُدار) | 'float' (تعويم حر)
  };
  // السيادة المنقسمة: لا رئيس منذ أكثر من 14 عاماً سيطر على ليبيا بالكامل - سلطة موازية حقيقية بجيشها
  // وداعميها الأجانب (لا مجرد منافس انتخابي)، ومؤسستان سياديتان منقسمتان (المصرف المركزي وشركة النفط)
  // تُستخدمان كأداة ضغط سياسي عبر حصار نفطي دوري، ومسار انتخابات موحدة قابل للانهيار مراراً كما حدث فعلياً
  const sovereignty = { ...(scenario.sovereignty || DEFAULT_SOVEREIGNTY) };
  // إيراد مرجعي محسوب من مؤشرات بداية السيناريو الفعلية (لا رقم عالمي ثابت) - يُستخدم فقط لاشتقاق
  // خط أساس التمويل "الكافي" لكل بند ميزانية، ويبقى ثابتاً طوال اللعبة كي لا يتحرك الهدف مع كل تقلب إيراد لحظي
  const referenceRevenue = estimateMonthlyRevenue({ indicators, sectorPolicies, macroPolicy, economy }).totalRevenue;
  const baseline = computeBaselineAllocations(referenceRevenue);

  const state = {
    version: CURRENT_SAVE_VERSION,
    scenarioId, presidentName, backgroundId,
    advisors: advisorChoices,
    month: 1, year: 1,
    gameOver: false, gameOverReason: null,
    indicators,
    budget: {
      allocations: { ...baseline },
      baseline,
      referenceRevenue
    },
    economy,
    sectorPolicies,
    macroPolicy,
    monetaryPolicy,
    sovereignty,
    relations: {
      tribes: TRIBES.map(t => ({ ...t })),
      parties: PARTIES.map(p => ({ ...p })),
      institutions: INSTITUTIONS.map(i => ({ ...i })),
      countries: ALL_COUNTRIES.map(c => ({ ...c })),
      orgs: ORGANIZATIONS.map(o => ({ ...o }))
    },
    ...initCharacterState(),
    scheduledEffects: [], // {applyAtMonth, effects}
    decisionCooldowns: {}, // id -> month usable again
    eventCooldowns: {}, // id -> month usable again
    relationsCooldowns: {}, // "kind:id" -> month usable again لإجراء "تواصل" المباشر
    pendingFollowUps: [], // {id, kind:'decision'|'event', dueMonth} - سلاسل أزمات مجدولة من قرارات/أحداث سابقة
    engineStreaks: { austerity: 0, securityNeglect: 0, fxReserveCrisis: 0, sovereigntyTension: 0 }, // عدّادات أشهر متتالية تغذّي سلاسل الأزمات
    politicalCapital: 50, // مورد يُنفَق على الإجراءات الرئاسية الاستباقية (ACTIONS في data/actions.js)
    actionCooldowns: {}, // actionId -> month usable again
    actionsLog: [],
    constitution: { governmentType: null, decentralization: null, stateCharacter: null }, // يُحدَّد بقرارات تأسيسية لا رجعة فيها أول اللعبة
    schemes: [], // {id, initiatorId, kind:'coup'|'defect'|'smear', progress, discovered, startedMonth} - مؤامرة واحدة نشطة كحد أقصى
    rival: null, // {characterId, name, approval} - يُهيَّأ لاحقاً بواسطة initRival عند تعريف MINISTRIES/CHARACTERS بالكامل
    activeChallenges: [], // معرّفات معدِّلات التحدي المُفعَّلة لهذه اللعبة تحديداً (CHALLENGE_MODIFIERS في systems/legacy.js)
    decisionsUsed: [], // oneTime ids used
    decisionsLog: [],
    eventsLog: [],
    projects: [],
    achievements: [],
    history: [], // snapshots per month for charts
    pendingDecisions: [],
    pendingEvent: null
  };
  state.rival = initRival(state);
  applyChallengeModifiers(state, challengeIds);
  return state;
}

// ------- ترحيل الحفظ (Migrations) -------
// كل دالة تأخذ حالة من إصدار N وتُرجعها مُطابقة لشكل الإصدار N+1، بإضافة الحقول الناقصة فقط
// دون المساس بتقدم اللاعب الحالي (أرقام المؤشرات، السجلات، إلخ)
const SAVE_MIGRATIONS = {
  1: function migrateV1toV2(s) {
    if (!s.characters || !s.cabinet) {
      const base = initCharacterState();
      s.characters = base.characters.map(c => {
        const clone = { ...c, stats: { ...c.stats } };
        delete clone.busyUntil; // لم يكن هذا الحقل موجوداً في هذا الإصدار بعد
        return clone;
      });
      s.cabinet = base.cabinet;
    }
    s.version = 2;
    return s;
  },
  2: function migrateV2toV3(s) {
    const sectorDefaults = { agricultureLevel: 35, tourismLevel: 25, industryLevel: 30, tradeBalance: -10 };
    if (!s.indicators) s.indicators = {};
    Object.entries(sectorDefaults).forEach(([key, def]) => {
      if (s.indicators[key] === undefined) s.indicators[key] = def;
    });
    s.version = 3;
    return s;
  },
  3: function migrateV3toV4(s) {
    if (!Array.isArray(s.characterRelations)) {
      s.characterRelations = CHARACTER_RELATIONS.map(r => ({ ...r }));
    }
    if (!Array.isArray(s.missions)) {
      s.missions = [];
    }
    (s.characters || []).forEach(c => {
      if (c.busyUntil === undefined) c.busyUntil = 0;
    });
    s.version = 4;
    return s;
  },
  4: function migrateV4toV5(s) {
    if (!s.eventCooldowns || typeof s.eventCooldowns !== 'object') {
      s.eventCooldowns = {};
    }
    s.version = 5;
    return s;
  },
  5: function migrateV5toV6(s) {
    if (!s.sectorPolicies || typeof s.sectorPolicies !== 'object') {
      s.sectorPolicies = {
        oil: { ownership: 'state', orientation: 75 },
        agriculture: { ownership: 'privatized', orientation: 30 },
        tourism: { ownership: 'privatized', orientation: 40 },
        industry: { ownership: 'state', orientation: 45 }
      };
    }
    const sectorInvestDefaults = { oilSector: 10, agricultureSector: 6, tourismSector: 5, industrySector: 5 };
    if (!s.budget) s.budget = { allocations: {} };
    if (!s.budget.allocations) s.budget.allocations = {};
    Object.entries(sectorInvestDefaults).forEach(([key, def]) => {
      if (s.budget.allocations[key] === undefined) s.budget.allocations[key] = def;
    });
    s.version = 6;
    return s;
  },
  6: function migrateV6toV7(s) {
    if (!s.relationsCooldowns || typeof s.relationsCooldowns !== 'object') {
      s.relationsCooldowns = {};
    }
    s.version = 7;
    return s;
  },
  7: function migrateV7toV8(s) {
    if (!s.macroPolicy || typeof s.macroPolicy !== 'object') {
      s.macroPolicy = { corporateTaxRate: 20, consumptionTaxRate: 8, customsTariffRate: 15, fuelSubsidyLevel: 75, debtStrategy: 'domestic', _prevFuelSubsidy: 75 };
    }
    if (s.macroPolicy._prevFuelSubsidy === undefined) s.macroPolicy._prevFuelSubsidy = s.macroPolicy.fuelSubsidyLevel;
    s.version = 8;
    return s;
  },
  8: function migrateV8toV9(s) {
    if (!Array.isArray(s.pendingFollowUps)) s.pendingFollowUps = [];
    if (!s.engineStreaks || typeof s.engineStreaks !== 'object') {
      s.engineStreaks = { austerity: 0, securityNeglect: 0 };
    }
    if (!s.economy) s.economy = { oilPrice: 100 };
    if (!s.economy.worldCycle) s.economy.worldCycle = 'normal';
    if (s.economy.worldCycleMonthsLeft === undefined) s.economy.worldCycleMonthsLeft = 4 + Math.floor(Math.random() * 7);
    s.version = 9;
    return s;
  },
  9: function migrateV9toV10(s) {
    // بنود الميزانية القديمة كانت نسباً مئوية من الإيراد (2-35 عادةً تجمع قرابة 100%) - نحوّلها هنا إلى مبالغ
    // مطلقة فعلية باستخدام إيراد اللاعب الحالي (لا يعتمد على budget.allocations إطلاقاً فاستخدامه هنا آمن)،
    // كي لا يقفز الإنفاق الفعلي فجأة عند فتح حفظ قديم
    const revenue = estimateMonthlyRevenue(s);
    if (s.budget && s.budget.allocations) {
      Object.keys(s.budget.allocations).forEach(k => {
        s.budget.allocations[k] = Math.max(0, Math.round((s.budget.allocations[k] / 100) * revenue.totalRevenue));
      });
    } else {
      s.budget = { allocations: computeBaselineAllocations(revenue.totalRevenue) };
    }
    if (!s.budget.baseline) s.budget.baseline = computeBaselineAllocations(revenue.totalRevenue);
    if (s.budget.referenceRevenue === undefined) s.budget.referenceRevenue = revenue.totalRevenue;
    s.version = 10;
    return s;
  },
  10: function migrateV10toV11(s) {
    if (s.politicalCapital === undefined) s.politicalCapital = 50;
    if (!s.actionCooldowns || typeof s.actionCooldowns !== 'object') s.actionCooldowns = {};
    if (!Array.isArray(s.actionsLog)) s.actionsLog = [];
    if (!s.constitution || typeof s.constitution !== 'object') {
      s.constitution = { governmentType: null, decentralization: null, stateCharacter: null };
    }
    if (!Array.isArray(s.schemes)) s.schemes = [];
    if (!s.rival) s.rival = initRival(s);
    s.version = 11;
    return s;
  },
  11: function migrateV11toV12(s) {
    if (!Array.isArray(s.activeChallenges)) s.activeChallenges = [];
    s.version = 12;
    return s;
  },
  12: function migrateV12toV13(s) {
    if (!s.monetaryPolicy || typeof s.monetaryPolicy !== 'object') {
      s.monetaryPolicy = { interestRate: 5, exchangeRegime: 'managed' };
    }
    if (!s.engineStreaks || typeof s.engineStreaks !== 'object') s.engineStreaks = { austerity: 0, securityNeglect: 0, fxReserveCrisis: 0 };
    if (s.engineStreaks.fxReserveCrisis === undefined) s.engineStreaks.fxReserveCrisis = 0;
    s.version = 13;
    return s;
  },
  13: function migrateV13toV14(s) {
    if (!s.sovereignty || typeof s.sovereignty !== 'object') {
      const scenario = SCENARIOS.find(sc => sc.id === s.scenarioId);
      s.sovereignty = { ...((scenario && scenario.sovereignty) || DEFAULT_SOVEREIGNTY) };
    }
    if (!s.engineStreaks || typeof s.engineStreaks !== 'object') s.engineStreaks = { austerity: 0, securityNeglect: 0, fxReserveCrisis: 0, sovereigntyTension: 0 };
    if (s.engineStreaks.sovereigntyTension === undefined) s.engineStreaks.sovereigntyTension = 0;
    s.version = 14;
    return s;
  }
};

function migrateSaveState(state) {
  let s = state;
  if (!s.version || typeof s.version !== 'number') s.version = 1;
  let guard = 0; // حارس أمان يمنع أي حلقة لا نهائية في حال خطأ برمجي مستقبلي
  while (s.version < CURRENT_SAVE_VERSION && guard < 50) {
    const migrate = SAVE_MIGRATIONS[s.version];
    if (!migrate) break; // لا يوجد مسار ترحيل معروف لهذا الإصدار - سيتم رفضه لاحقاً عبر التحقق من الشكل
    s = migrate(s);
    guard++;
  }
  return s;
}

// تحقق دفاعي بسيط: هل الحالة (بعد الترحيل) تحتوي كل الحقول الأساسية التي يعتمد عليها المحرك؟
function validateStateShape(s) {
  if (!s || typeof s !== 'object') return { ok: false, reason: 'الحالة المحفوظة ليست كائناً صالحاً.' };
  const requiredPaths = [
    ['presidentName'], ['month'], ['year'],
    ['indicators', 'satisfaction'], ['indicators', 'treasury'],
    ['budget', 'allocations'], ['economy', 'oilPrice'], ['sectorPolicies', 'oil'], ['macroPolicy', 'fuelSubsidyLevel'], ['monetaryPolicy', 'interestRate'],
    ['sovereignty', 'territoryControl'], ['sovereignty', 'rivalMilitaryStrength'],
    ['relations', 'tribes'], ['relations', 'countries'],
    ['characters'], ['cabinet'], ['characterRelations'], ['missions'],
    ['scheduledEffects'], ['eventCooldowns'], ['relationsCooldowns'], ['decisionsLog'], ['eventsLog'], ['history'], ['achievements'],
    ['pendingFollowUps'], ['engineStreaks', 'austerity'], ['economy', 'worldCycle'],
    ['budget', 'baseline'], ['budget', 'referenceRevenue'],
    ['politicalCapital'], ['actionCooldowns'], ['constitution'], ['schemes'], ['rival'], ['activeChallenges']
  ];
  for (const path of requiredPaths) {
    let cur = s;
    for (const key of path) {
      if (cur === undefined || cur === null || !(key in cur)) {
        return { ok: false, reason: `حقل ناقص في الحفظ: ${path.join('.')}` };
      }
      cur = cur[key];
    }
  }
  if (!Array.isArray(s.characters) || !Array.isArray(s.relations.tribes)) {
    return { ok: false, reason: 'شكل بيانات غير متوافق في الحفظ.' };
  }
  return { ok: true };
}

function saveGame(state) {
  try {
    state.version = CURRENT_SAVE_VERSION;
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.error('save failed', e);
    return false;
  }
}

// يُرجع دائماً { ok: true, state } أو { ok: false, reason } - لا يُرمى أي استثناء لأعلى أبداً
function loadGame() {
  let raw;
  try {
    raw = localStorage.getItem(SAVE_KEY);
  } catch (e) {
    return { ok: false, reason: 'التخزين المحلي غير متاح في هذا المتصفح.' };
  }
  if (!raw) return { ok: false, reason: 'لا توجد لعبة محفوظة.' };

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return { ok: false, reason: 'ملف الحفظ تالف ولا يمكن قراءته.' };
  }

  let migrated;
  try {
    migrated = migrateSaveState(parsed);
  } catch (e) {
    console.error('migration failed', e);
    return { ok: false, reason: 'تعذر ترقية الحفظ القديم إلى الإصدار الحالي.' };
  }

  const validation = validateStateShape(migrated);
  if (!validation.ok) {
    return { ok: false, reason: validation.reason };
  }

  return { ok: true, state: migrated };
}

function hasSavedGame() {
  try {
    return !!localStorage.getItem(SAVE_KEY);
  } catch (e) {
    return false;
  }
}

function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) { /* ignore */ }
}
