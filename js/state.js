// إدارة حالة اللعبة والحفظ/التحميل، مع نظام ترحيل (migration) لأشكال الحفظ القديمة
const SAVE_KEY = 'rayyes_libya_save';

// تاريخ إصدارات شكل الحفظ (schema) - كل تغيير في بنية الحالة المحفوظة يجب أن يرفع هذا الرقم
// 1: الشكل الأساسي الأول (بدون شخصيات/وزراء، وبدون قطاعات الزراعة/السياحة/الصناعة/الميزان التجاري)
// 2: + نظام الشخصيات (characters) ومجلس الوزراء (cabinet)
// 3: + مؤشرات القطاعات الجديدة (agricultureLevel, tourismLevel, industryLevel, tradeBalance)
// 4: + شبكة علاقات الشخصيات (characterRelations) ونظام المهام (missions) وحقل busyUntil لكل شخصية
// 5: + مهلة تبريد للأحداث العشوائية (eventCooldowns) لمنع تكرارها المتتالي
const CURRENT_SAVE_VERSION = 5;

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
      allocations: { education: 15, health: 15, security: 15, infrastructure: 15, subsidies: 15, salaries: 15, debtService: 5, economicDev: 5 }
    },
    economy: { oilPrice: 100 },
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
    ['budget', 'allocations'], ['economy', 'oilPrice'],
    ['relations', 'tribes'], ['relations', 'countries'],
    ['characters'], ['cabinet'], ['characterRelations'], ['missions'],
    ['scheduledEffects'], ['eventCooldowns'], ['decisionsLog'], ['eventsLog'], ['history'], ['achievements']
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
