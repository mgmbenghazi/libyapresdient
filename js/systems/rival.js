// المنافس السياسي الحي: شخصية معارضة حقيقية بشعبية مستقلة تنمو أو تتراجع بمعزل عن أرقامك -
// لا مجرد رقم استفتاء يُحسب لحظة الانتخابات، بل خصم له مسار طوال فترة الحكم
function initRival(state) {
  const cabinetIds = new Set(Object.values(state.cabinet).filter(Boolean));
  const candidates = state.characters.filter(c => !cabinetIds.has(c.id));
  if (!candidates.length) return null;
  // الأعلى طموحاً وشعبية بين من هم خارج الحكومة - أقرب صورة لمعارض طبيعي يترقب فرصته
  const chosen = candidates.reduce((best, c) => {
    const score = c.stats.ambition * 0.5 + c.stats.popularity * 0.5;
    const bestScore = best.stats.ambition * 0.5 + best.stats.popularity * 0.5;
    return score > bestScore ? c : best;
  });
  return { characterId: chosen.id, name: chosen.name, approval: Math.round(chosen.stats.popularity * 0.6) };
}

// تحديث شهري لشعبية المنافس: تنمو إن كنت تحكم بشكل سيئ (رضا/استقرار منخفضان)، وتتراجع إن كنت تحكم بامتياز
function updateRivalApproval(state) {
  if (!state.rival) return;
  const ind = state.indicators;
  const performanceGap = (55 - (ind.satisfaction * 0.6 + ind.politicalStability * 0.4)) / 15; // موجب إن أداؤك دون المتوسط
  const drift = performanceGap * 1.5 + rnd(-1, 1);
  state.rival.approval = Math.max(5, Math.min(95, state.rival.approval + drift));
}

// حسم استحقاق انتخابي فعلي: رضاك الحقيقي مقابل شعبية منافسك المستقلة - لا فحص رقمي شكلي.
// التزوير خيار حقيقي بمخاطرة انكشاف حقيقية، لا مجرد نص سردي بلا أثر ميكانيكي
function resolveElection(state, opts) {
  if (!state.rival) return { won: true, contested: false, message: 'لا يوجد منافس سياسي بارز لمواجهته في هذا الاستحقاق.' };

  let yourScore = state.indicators.satisfaction;
  const rivalScore = state.rival.approval;
  let rigged = false, caught = false;

  if (opts.rig) {
    rigged = true;
    yourScore += 20; // التزوير يضمن نتيجة معلنة أفضل بصرف النظر عن الشعبية الحقيقية
    const exposureRisk = 0.35 + (100 - state.indicators.security) / 300; // الأمن الضعيف يسهّل انكشاف التزوير
    caught = Math.random() < exposureRisk;
  }

  const won = yourScore >= rivalScore;

  if (won) {
    applyEffects(state, rigged ? { politicalStability: -2, internationalSupport: -5 } : { politicalStability: 8, internationalSupport: 5 });
    if (caught) applyEffects(state, { internationalSupport: -15, satisfaction: -10, politicalStability: -8 });
  } else {
    // خسارة الاستحقاق: ضربة شرعية كبرى تُحاكي انتقال نفوذ جزئياً لصالح المعارضة، لا نهاية لعبة تلقائية
    applyEffects(state, { politicalStability: -15, satisfaction: -5 });
    state.rival.approval = Math.max(5, state.rival.approval - 20); // دخوله موقعاً مؤثراً يُهدّئ طموحه الفوري مؤقتاً
  }

  return { won, rigged, caught, yourScore: Math.round(yourScore), rivalScore: Math.round(rivalScore), rivalName: state.rival.name, contested: true };
}
