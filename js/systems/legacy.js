// إرث الرئاسة: سجل دائم يعيش في مفتاح localStorage مستقل تماماً عن حفظ اللعبة الجارية (SAVE_KEY) -
// كل حكومة مكتملة تترك أثراً يقارن به اللاعب أداءه القادم، بدل أن تبدأ كل لعبة جديدة من صفحة بيضاء
const LEGACY_KEY = 'rayyes_libya_legacy';
const LEGACY_MAX_RECORDS = 200;

function loadLegacy() {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return { records: [], unlockedAchievements: [] };
    const parsed = JSON.parse(raw);
    return {
      records: Array.isArray(parsed.records) ? parsed.records : [],
      unlockedAchievements: Array.isArray(parsed.unlockedAchievements) ? parsed.unlockedAchievements : []
    };
  } catch (e) {
    return { records: [], unlockedAchievements: [] };
  }
}

function saveLegacyState(legacy) {
  try { localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy)); } catch (e) { /* التخزين المحلي غير متاح - نتجاهل بصمت */ }
}

// يُستدعى مرة واحدة فقط لحظة انتهاء اللعبة - يضيف سجلاً جديداً ويوسّع مجموعة الإنجازات الدائمة،
// ويُرجع مقارنة فورية بالسجل السابق (المرتبة المئوية، الفرق عن أفضل نتيجة) لعرضها في شاشة النهاية
function recordCompletedGame(state, result) {
  const legacy = loadLegacy();
  const priorRecords = legacy.records.slice(); // نسخة قبل إضافة هذه اللعبة، للمقارنة العادلة معها لا مع نفسها
  const record = {
    presidentName: state.presidentName,
    scenarioId: state.scenarioId,
    reason: result.reason,
    score: computeFinalScore(state),
    months: state.month - 1,
    achievements: [...state.achievements],
    endedAt: Date.now()
  };
  legacy.records.push(record);
  if (legacy.records.length > LEGACY_MAX_RECORDS) legacy.records = legacy.records.slice(-LEGACY_MAX_RECORDS);
  state.achievements.forEach(id => { if (!legacy.unlockedAchievements.includes(id)) legacy.unlockedAchievements.push(id); });
  saveLegacyState(legacy);

  const beaten = priorRecords.filter(r => r.score < record.score).length;
  const percentile = priorRecords.length ? Math.round((beaten / priorRecords.length) * 100) : null;
  const bestPriorScore = priorRecords.length ? Math.max(...priorRecords.map(r => r.score)) : null;
  return { record, gamesPlayedBefore: priorRecords.length, percentile, bestPriorScore, isNewBest: bestPriorScore === null || record.score > bestPriorScore };
}

// معدِّلات تحدٍ اختيارية تُفتح تدريجياً مع تراكم الإرث - وسيلة لتجديد التحدي وإعادة اللعب
// دون الحاجة لمحتوى جديد: نفس المحرك، شروط بداية أقسى تختبر استراتيجية مختلفة
const CHALLENGE_MODIFIERS = [
  {
    id: 'iron_president', name: 'الرئيس الحديدي', icon: '⚙️', unlockAtGames: 1,
    desc: 'خزينة ابتدائية أقل بنسبة 30% واستقرار سياسي أضعف منذ اليوم الأول - حكم بلا شبكة أمان.',
    apply(indicators) {
      indicators.treasury = Math.round(indicators.treasury * 0.7);
      indicators.politicalStability = Math.max(0, indicators.politicalStability - 10);
    }
  },
  {
    id: 'inherited_crisis', name: 'أزمة موروثة', icon: '🔥', unlockAtGames: 3,
    desc: 'ترث ديناً عاماً مرتفعاً ورضاً شعبياً منهاراً منذ اليوم الأول - إرث الحكومة السابقة يلاحقك.',
    apply(indicators) {
      indicators.publicDebt = Math.min(200, indicators.publicDebt + 30);
      indicators.satisfaction = Math.max(0, indicators.satisfaction - 15);
    }
  },
  {
    id: 'hostile_neighbors', name: 'جوار معادٍ', icon: '🗺️', unlockAtGames: 5,
    desc: 'كل دول الجوار تبدأ العلاقة معها منخفضة جداً - دبلوماسية إقليمية صعبة منذ البداية.',
    applyRelations(relations) {
      relations.countries.forEach(c => { if (c.group === 'neighbor') c.relation = Math.max(5, c.relation - 30); });
    }
  }
];

function getUnlockedChallenges() {
  const stats = getLegacyStats();
  return CHALLENGE_MODIFIERS.filter(c => stats.gamesPlayed >= c.unlockAtGames);
}

function applyChallengeModifiers(state, challengeIds) {
  if (!challengeIds || !challengeIds.length) return;
  challengeIds.forEach(id => {
    const mod = CHALLENGE_MODIFIERS.find(c => c.id === id);
    if (!mod) return;
    if (mod.apply) mod.apply(state.indicators);
    if (mod.applyRelations) mod.applyRelations(state.relations);
  });
  state.activeChallenges = challengeIds.slice();
}

function getLegacyStats() {
  const legacy = loadLegacy();
  const records = legacy.records;
  if (!records.length) return { gamesPlayed: 0, bestScore: 0, avgScore: 0, longestSurvival: 0, records: [], unlockedAchievements: legacy.unlockedAchievements };
  const scores = records.map(r => r.score);
  return {
    gamesPlayed: records.length,
    bestScore: Math.max(...scores),
    avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    longestSurvival: Math.max(...records.map(r => r.months)),
    records,
    unlockedAchievements: legacy.unlockedAchievements
  };
}
