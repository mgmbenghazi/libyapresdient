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
const CURRENT_SAVE_VERSION = 8;

function createInitialState(scenarioId, presidentName, backgroundId, advisorChoices) {
  const scenario = SCENARIOS.find(s => s.id === scenarioId);
  const background = POLITICAL_BACKGROUNDS.find(b => b.id === backgroundId);
  const indicators = { ...scenario.startIndicators };

  if (background) {
    Object.entries(background.bonus || {}).forEach(([k, v]) => indicators[k] = clampIndicator(k, (indicators[k] || 0) + v));
    Object.entries(background.malus || {}).forEach(([k, v]) => indicators[k] = clampIndicator(k, (indicators[k] || 0) + v));
  }

  const state = {
    version: CURRENT_SAVE_VERSION,
    scenarioId, presidentName, backgroundId,
    advisors: advisorChoices,
    month: 1, year: 1,
    gameOver: false, gameOverReason: null,
    indicators,
    budget: {
      allocations: {
        education: 11, health: 11, security: 11, infrastructure: 11, subsidies: 11, salaries: 11, debtService: 4, economicDev: 4,
        oilSector: 10, agricultureSector: 6, tourismSector: 5, industrySector: 5
      }
    },
    economy: { oilPrice: 100 },
    sectorPolicies: {
      oil: { ownership: 'state', orientation: 75 },
      agriculture: { ownership: 'privatized', orientation: 30 },
      tourism: { ownership: 'privatized', orientation: 40 },
      industry: { ownership: 'state', orientation: 45 }
    },
    macroPolicy: {
      corporateTaxRate: 20, consumptionTaxRate: 8, customsTariffRate: 15,
      fuelSubsidyLevel: 75, debtStrategy: 'domestic',
      _prevFuelSubsidy: 75 // خط أساس صدمة خفض الدعم - يُهيَّأ هنا لا عند أول دورة شهرية، وإلا فات رصد أول تعديل يجريه اللاعب قبل الشهر الأول
    },
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
    decisionsUsed: [], // oneTime ids used
    decisionsLog: [],
    eventsLog: [],
    projects: [],
    achievements: [],
    history: [], // snapshots per month for charts
    pendingDecisions: [],
    pendingEvent: null
  };
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
    ['budget', 'allocations'], ['economy', 'oilPrice'], ['sectorPolicies', 'oil'], ['macroPolicy', 'fuelSubsidyLevel'],
    ['relations', 'tribes'], ['relations', 'countries'],
    ['characters'], ['cabinet'], ['characterRelations'], ['missions'],
    ['scheduledEffects'], ['eventCooldowns'], ['relationsCooldowns'], ['decisionsLog'], ['eventsLog'], ['history'], ['achievements']
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
