// نظام تفاعلات الشخصيات: تعيين/إقالة، مكافأة/عقاب، استشارة
function initCharacterState() {
  const characters = CHARACTERS.map(c => ({
    ...c,
    stats: { ...c.stats },
    cooldownUntil: 0
  }));
  const cabinet = {};
  MINISTRIES.forEach(m => {
    const holder = characters.find(c => c.ministry === m.id);
    cabinet[m.id] = holder ? holder.id : null;
  });
  return { characters, cabinet };
}

function getCharacter(state, id) {
  return state.characters.find(c => c.id === id);
}

function clampStat(v) { return Math.max(0, Math.min(100, v)); }

function hasTrait(ch, traitId) { return ch.traits && ch.traits.includes(traitId); }

// استشارة شخصية - مجانية، ترفع الولاء قليلاً وتعطي رأياً
function consultCharacter(state, charId) {
  const ch = getCharacter(state, charId);
  if (!ch) return null;
  ch.stats.loyalty = clampStat(ch.stats.loyalty + 1);
  const opinions = [
    `${ch.name}: "أرى أن الأولوية يجب أن تكون لملف ${pickPriorityLabel(ch)}."`,
    `${ch.name}: "الوضع الحالي يتطلب حذراً، لكنني أدعم توجهاتك بشكل عام."`,
    `${ch.name}: "يجب الانتباه لمطالب ${ch.region ? regionName(ch.region) : 'مناطق عدة'} قبل فوات الأوان."`
  ];
  return opinions[Math.floor(Math.random() * opinions.length)];
}

function pickPriorityLabel(ch) {
  const map = { government: 'الإدارة والحوكمة', tribal: 'التنمية المحلية', business: 'الاستثمار', media: 'الشفافية', opposition: 'الإصلاح السياسي', religious: 'التماسك المجتمعي', civil: 'الحقوق والخدمات', foreign: 'العلاقات الدولية' };
  return map[ch.category] || 'الشأن العام';
}
function regionName(regionId) {
  const r = REGIONS.find(r => r.id === regionId);
  return r ? r.name : regionId;
}

// مكافأة مالية - تكلفة من الخزينة، ترفع الولاء والشعبية
const REWARD_COST = 1500;
function rewardCharacter(state, charId) {
  const ch = getCharacter(state, charId);
  if (!ch) return { ok: false, msg: 'شخصية غير موجودة' };
  if (state.indicators.treasury < REWARD_COST) return { ok: false, msg: 'الخزينة لا تكفي لتقديم مكافأة.' };
  state.indicators.treasury -= REWARD_COST;
  ch.stats.loyalty = clampStat(ch.stats.loyalty + 8);
  ch.stats.popularity = clampStat(ch.stats.popularity + 2);
  if (!hasTrait(ch, 'loyal_patriot') && Math.random() < 0.3) {
    ch.stats.corruption = clampStat(ch.stats.corruption + 3);
  }
  return { ok: true, msg: `منحت ${ch.name} مكافأة، ارتفع ولاؤه.` };
}

// عقاب - يخفض الولاء بشدة وقد يضر بالاستقرار حسب نفوذ الشخصية
function punishCharacter(state, charId) {
  const ch = getCharacter(state, charId);
  if (!ch) return { ok: false, msg: 'شخصية غير موجودة' };
  ch.stats.loyalty = clampStat(ch.stats.loyalty - 15);
  ch.stats.popularity = clampStat(ch.stats.popularity - 5);
  const stabilityHit = (ch.stats.influence / 100) * 4;
  state.indicators.politicalStability = clampIndicator('politicalStability', state.indicators.politicalStability - stabilityHit);
  return { ok: true, msg: `عاقبت ${ch.name}. تراجع ولاؤه، وتأثر الاستقرار السياسي قليلاً بحسب نفوذه.` };
}

// تعيين شخصية في منصب وزاري شاغر أو استبدال الحالي
function appointToMinistry(state, charId, ministryId) {
  const ch = getCharacter(state, charId);
  const ministry = MINISTRIES.find(m => m.id === ministryId);
  if (!ch || !ministry) return { ok: false, msg: 'بيانات غير صحيحة' };
  const previousId = state.cabinet[ministryId];
  if (previousId === charId) return { ok: false, msg: `${ch.name} يشغل هذا المنصب بالفعل.` };
  if (previousId) {
    const prev = getCharacter(state, previousId);
    if (prev) { prev.ministry = null; prev.stats.loyalty = clampStat(prev.stats.loyalty - 10); }
  }
  ch.ministry = ministryId;
  ch.category = 'government';
  state.cabinet[ministryId] = charId;
  ch.stats.loyalty = clampStat(ch.stats.loyalty + 5);
  return { ok: true, msg: `تم تعيين ${ch.name} في منصب ${ministry.name}.` };
}

function dismissFromMinistry(state, ministryId) {
  const ministry = MINISTRIES.find(m => m.id === ministryId);
  const charId = state.cabinet[ministryId];
  if (!charId) return { ok: false, msg: 'المنصب شاغر بالفعل.' };
  const ch = getCharacter(state, charId);
  ch.ministry = null;
  ch.stats.loyalty = clampStat(ch.stats.loyalty - 20);
  state.cabinet[ministryId] = null;
  return { ok: true, msg: `تمت إقالة ${ch.name} من منصب ${ministry.name}. تراجع ولاؤه بشدة.` };
}

// التأثير الشهري لأعضاء الحكومة على المؤشرات المرتبطة بمناصبهم
function applyCabinetMonthlyEffects(state) {
  MINISTRIES.forEach(m => {
    const charId = state.cabinet[m.id];
    if (!charId) {
      // منصب شاغر يضر قليلاً بمؤشره
      if (state.indicators[m.effectKey] !== undefined) {
        state.indicators[m.effectKey] = clampIndicator(m.effectKey, state.indicators[m.effectKey] - 0.3);
      }
      return;
    }
    const ch = getCharacter(state, charId);
    if (!ch) return;
    const competenceBonus = (ch.stats.competence - 50) / 50 * 0.35;
    const corruptionPenalty = (ch.stats.corruption / 100) * 0.25;
    let netEffect = competenceBonus - corruptionPenalty;
    if (hasTrait(ch, 'econ_expert') && ['budgetBalance', 'economicDevelopment'].includes(m.effectKey)) netEffect += 0.2;
    if (hasTrait(ch, 'diplomat') && m.effectKey === 'internationalSupport') netEffect += 0.3;
    if (hasTrait(ch, 'military_strategist') && m.effectKey === 'security') netEffect += 0.3;
    if (hasTrait(ch, 'tech_expert') && m.effectKey === 'infrastructureLevel') netEffect += 0.3;
    if (hasTrait(ch, 'charismatic')) state.indicators.satisfaction = clampIndicator('satisfaction', state.indicators.satisfaction + 0.15);

    if (state.indicators[m.effectKey] !== undefined) {
      state.indicators[m.effectKey] = clampIndicator(m.effectKey, state.indicators[m.effectKey] + netEffect);
    }

    // انجراف طبيعي لولاء وشعبية الوزراء
    let loyaltyDrift = (state.indicators.satisfaction - 50) / 300;
    if (hasTrait(ch, 'wide_network')) loyaltyDrift += 0.1;
    ch.stats.loyalty = clampStat(ch.stats.loyalty + loyaltyDrift + (Math.random() - 0.5));
    ch.stats.popularity = clampStat(ch.stats.popularity + (state.indicators.satisfaction - 50) / 400);
    if (hasTrait(ch, 'corrupt_prone') && Math.random() < 0.15) {
      ch.stats.corruption = clampStat(ch.stats.corruption + 1);
    }

    // خطر استقالة وزير غاضب (ولاء منخفض جداً لفترة طويلة)
    if (ch.stats.loyalty < 15 && Math.random() < 0.1) {
      dismissFromMinistry(state, m.id);
      state.eventsLog.push({ month: state.month, year: state.year, eventId: 'minister_resign', title: 'استقالة وزير', optionLabel: `استقال ${ch.name} من منصبه احتجاجاً على تراجع الثقة.` });
    }
  });

  // انجراف عام لبقية الشخصيات غير الحكومية بناء على الوضع العام
  state.characters.forEach(ch => {
    if (ch.ministry) return;
    let drift = (state.indicators.satisfaction - 50) / 400 + (state.indicators.politicalStability - 50) / 500;
    if (hasTrait(ch, 'wide_network')) drift += 0.05;
    ch.stats.loyalty = clampStat(ch.stats.loyalty + drift + (Math.random() - 0.5) * 0.8);
  });
}
