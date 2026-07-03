// إدارة حالة اللعبة والحفظ/التحميل
const SAVE_KEY = 'rayyes_libya_save';

function createInitialState(scenarioId, presidentName, backgroundId, advisorChoices) {
  const scenario = SCENARIOS.find(s => s.id === scenarioId);
  const background = POLITICAL_BACKGROUNDS.find(b => b.id === backgroundId);
  const indicators = { ...scenario.startIndicators };

  if (background) {
    Object.entries(background.bonus || {}).forEach(([k, v]) => indicators[k] = clampIndicator(k, (indicators[k] || 0) + v));
    Object.entries(background.malus || {}).forEach(([k, v]) => indicators[k] = clampIndicator(k, (indicators[k] || 0) + v));
  }

  const state = {
    version: 1,
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

function saveGame(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.error('save failed', e);
    return false;
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}
