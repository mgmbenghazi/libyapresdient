// نظام العلاقات الداخلية والدولية - انجراف شهري بسيط يعكس الوضع العام
function monthlyRelationsTick(state) {
  const ind = state.indicators;

  state.relations.tribes.forEach(t => {
    t.loyalty = clampIndicator('security', t.loyalty * 0.95 + (ind.satisfaction * 0.5 + ind.politicalStability * 0.5) * 0.05 + (Math.random() - 0.5) * 2);
  });
  state.relations.parties.forEach(p => {
    p.support = clampIndicator('security', p.support * 0.95 + ind.politicalStability * 0.05 + (Math.random() - 0.5) * 2);
  });
  state.relations.institutions.forEach(i => {
    i.legitimacy = clampIndicator('security', i.legitimacy * 0.96 + ind.politicalStability * 0.04 + (Math.random() - 0.5) * 1.5);
  });
  state.relations.countries.forEach(c => {
    c.relation = clampIndicator('security', c.relation * 0.97 + ind.internationalSupport * 0.03 + (Math.random() - 0.5) * 1.5);
  });
  state.relations.orgs.forEach(o => {
    o.relation = clampIndicator('security', o.relation * 0.97 + ind.internationalSupport * 0.03 + (Math.random() - 0.5) * 1.5);
  });
}

// ------- دوال قراءة الوضع السياسي/الدولي - تتيح لقرارات وأحداث اللعبة الاستجابة الفعلية لهذه البيانات -------
function pct(v) { return Math.max(0, Math.min(100, v)); }

function avgTribalLoyalty(state) {
  const t = state.relations.tribes;
  return t.length ? t.reduce((a, x) => a + x.loyalty, 0) / t.length : 50;
}
function lowestTribe(state) {
  const t = state.relations.tribes;
  return t.length ? t.reduce((min, x) => (x.loyalty < min.loyalty ? x : min)) : null;
}
function lowestParty(state) {
  const p = state.relations.parties;
  return p.length ? p.reduce((min, x) => (x.support < min.support ? x : min)) : null;
}
function lowestInstitution(state) {
  const i = state.relations.institutions;
  return i.length ? i.reduce((min, x) => (x.legitimacy < min.legitimacy ? x : min)) : null;
}
function countriesInGroup(state, group) {
  return state.relations.countries.filter(c => c.group === group);
}
function lowestCountryInGroup(state, group) {
  const list = countriesInGroup(state, group);
  return list.length ? list.reduce((min, c) => (c.relation < min.relation ? c : min)) : null;
}
function highestCountryInGroup(state, group) {
  const list = countriesInGroup(state, group);
  return list.length ? list.reduce((max, c) => (c.relation > max.relation ? c : max)) : null;
}

// كتابة تأثير على شبكة العلاقات (قبيلة/تيار/مؤسسة/دولة) - يُستخدم من داخل خيارات القرارات والأحداث
function applyRelationsEffect(state, effect) {
  if (!effect) return;
  if (effect.type === 'tribe' && effect.id) {
    const t = state.relations.tribes.find(x => x.id === effect.id);
    if (t) t.loyalty = pct(t.loyalty + effect.delta);
  } else if (effect.type === 'allTribes') {
    state.relations.tribes.forEach(t => { t.loyalty = pct(t.loyalty + effect.delta); });
  } else if (effect.type === 'party' && effect.id) {
    const p = state.relations.parties.find(x => x.id === effect.id);
    if (p) p.support = pct(p.support + effect.delta);
  } else if (effect.type === 'institution' && effect.id) {
    const i = state.relations.institutions.find(x => x.id === effect.id);
    if (i) i.legitimacy = pct(i.legitimacy + effect.delta);
  } else if (effect.type === 'country' && effect.id) {
    const c = state.relations.countries.find(x => x.id === effect.id);
    if (c) c.relation = pct(c.relation + effect.delta);
  } else if (effect.type === 'org' && effect.id) {
    const o = state.relations.orgs.find(x => x.id === effect.id);
    if (o) o.relation = pct(o.relation + effect.delta);
  }
}

// ------- تفعيل تبويب العلاقات: وصول موحّد لأي كيان علاقات بغض النظر عن نوعه -------
const RELATIONS_KIND_META = {
  tribe: { list: 'tribes', valueKey: 'loyalty', ministry: 'interior', label: 'الولاء' },
  party: { list: 'parties', valueKey: 'support', ministry: 'pm', label: 'التأييد' },
  institution: { list: 'institutions', valueKey: 'legitimacy', ministry: 'interior', label: 'الشرعية' },
  country: { list: 'countries', valueKey: 'relation', ministry: 'foreign', label: 'العلاقة' },
  org: { list: 'orgs', valueKey: 'relation', ministry: 'foreign', label: 'العلاقة' }
};

function getRelationsEntity(state, kind, id) {
  const meta = RELATIONS_KIND_META[kind];
  if (!meta) return null;
  const entity = state.relations[meta.list].find(x => x.id === id);
  if (!entity) return null;
  return { entity, valueKey: meta.valueKey, label: meta.label, value: entity[meta.valueKey] };
}

// أثر مهمة موجَّهة على الكيان نفسه (لا مؤشراً وطنياً فقط) - يُستخدم من resolveMissions عند وجود targetEntity
function applyMissionOutcomeToEntity(state, targetEntity, magnitude) {
  if (!targetEntity) return null;
  const found = getRelationsEntity(state, targetEntity.kind, targetEntity.id);
  if (!found) return null;
  found.entity[found.valueKey] = pct(found.entity[found.valueKey] + magnitude);
  return found.entity.name;
}

// إجراء "تواصل" مباشر ومحدود التكرار من تبويب العلاقات - وكالة حقيقية للاعب بدل الانتظار السلبي
const OUTREACH_COOLDOWN_MONTHS = 3;
const OUTREACH_COST = { tribe: 0, party: 0, institution: 0, country: 800, org: 800 };

function canOutreach(state, kind, id) {
  const key = kind + ':' + id;
  const readyMonth = state.relationsCooldowns[key] || 0;
  return state.month >= readyMonth;
}

function outreachToEntity(state, kind, id) {
  const found = getRelationsEntity(state, kind, id);
  if (!found) return { ok: false, msg: 'كيان غير موجود.' };
  const key = kind + ':' + id;
  if (!canOutreach(state, kind, id)) {
    return { ok: false, msg: `التواصل مع ${found.entity.name} ما زال في فترة تهدئة حتى الشهر ${state.relationsCooldowns[key]}.` };
  }
  const cost = OUTREACH_COST[kind] || 0;
  if (cost > 0 && state.indicators.treasury < cost) {
    return { ok: false, msg: 'الخزينة لا تكفي لتغطية تكلفة هذا التواصل الدبلوماسي.' };
  }
  if (cost > 0) state.indicators.treasury -= cost;

  const ministryId = RELATIONS_KIND_META[kind].ministry;
  const minister = state.cabinet[ministryId] ? getCharacter(state, state.cabinet[ministryId]) : null;
  const ministerBonus = minister ? (minister.stats.competence - 50) / 50 * 2 : 0;
  const delta = 4 + Math.random() * 3 + ministerBonus;

  found.entity[found.valueKey] = pct(found.entity[found.valueKey] + delta);
  state.relationsCooldowns[key] = state.month + OUTREACH_COOLDOWN_MONTHS;

  return { ok: true, msg: `تواصلت مع ${found.entity.name}. ارتفع مؤشر ${found.label} بمقدار ${delta.toFixed(1)}.`, delta };
}

// محلّل الأهداف الديناميكية: يحدد وقت عرض القرار/الحدث للاعب أي كيان بالضبط يستهدفه هذه المرة
// يُرجع null إذا لم يكن هناك هدف صالح حالياً (يُستبعد القرار/الحدث تلقائياً من القائمة عندها)
function resolveDynamicTarget(state, kind) {
  switch (kind) {
    case 'lowestTribeLoyalty': {
      const t = lowestTribe(state);
      return t && t.loyalty < 35 ? { type: 'tribe', id: t.id, name: t.name, value: t.loyalty } : null;
    }
    case 'lowestPartySupport': {
      const p = lowestParty(state);
      return p && p.support < 25 ? { type: 'party', id: p.id, name: p.name, value: p.support } : null;
    }
    case 'lowestInstitutionLegitimacy': {
      const i = lowestInstitution(state);
      return i && i.legitimacy < 30 ? { type: 'institution', id: i.id, name: i.name, value: i.legitimacy } : null;
    }
    case 'lowestNeighborRelation': {
      const c = lowestCountryInGroup(state, 'neighbor');
      return c && c.relation < 35 ? { type: 'country', id: c.id, name: c.name, value: c.relation } : null;
    }
    case 'highestGlobalRelation': {
      const c = highestCountryInGroup(state, 'global');
      return c && c.relation > 70 ? { type: 'country', id: c.id, name: c.name, value: c.relation } : null;
    }
    default:
      return null;
  }
}

// يستبدل عنصر النائب {target} في العنوان/الوصف باسم الكيان المستهدف فعلياً هذه المرة
function interpolateTarget(text, target) {
  if (!text || !target) return text;
  return text.replace(/\{target\}/g, target.name);
}
