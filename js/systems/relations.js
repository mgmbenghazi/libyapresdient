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
  }
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
