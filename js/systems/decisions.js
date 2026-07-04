// نظام اختيار وتطبيق القرارات
// حدود كل معدل في السياسة الاقتصادية الكلية - تطابق حدود الأشرطة في تبويب "الاقتصاد ← السياسة الاقتصادية"
const MACRO_RATE_BOUNDS = {
  corporateTaxRate: { min: 0, max: 50 },
  consumptionTaxRate: { min: 0, max: 25 },
  customsTariffRate: { min: 0, max: 40 },
  fuelSubsidyLevel: { min: 0, max: 100 }
};

function getAvailableDecisions(state, count) {
  // سلاسل الأزمات المستحقة هذا الشهر (kind: 'decision') تتجاوز التبريد والشروط المعتادة - القرار وصل موعده حتماً
  const dueFollowUpIds = (state.pendingFollowUps || [])
    .filter(f => f.kind === 'decision' && state.month >= f.dueMonth)
    .map(f => f.id);

  const candidates = [];
  DECISIONS.forEach(d => {
    const isDueFollowUp = dueFollowUpIds.includes(d.id);
    if (!isDueFollowUp) {
      if (d.oneTime && state.decisionsUsed.includes(d.id)) return;
      if (d.minMonth && state.month < d.minMonth) return;
      if (d.cooldown && state.decisionCooldowns[d.id] && state.month < state.decisionCooldowns[d.id]) return;
      if (d.condition && !d.condition(state)) return;
    }

    if (d.dynamicTarget) {
      // قرارات تستهدف كياناً محدداً (قبيلة/دولة) يُحدَّد وقت العرض بناءً على الوضع الحالي
      const target = resolveDynamicTarget(state, d.dynamicTarget);
      if (!target) return; // لا يوجد هدف صالح حالياً - هذا القرار غير متاح هذا الشهر
      candidates.push({
        ...d,
        title: interpolateTarget(d.title, target),
        description: interpolateTarget(d.description, target),
        _target: target,
        _isFollowUp: isDueFollowUp
      });
    } else {
      candidates.push({ ...d, _isFollowUp: isDueFollowUp });
    }
  });

  // القرارات "الإجبارية" (مثل الانتخابات) أو المجدولة كسلسلة أزمة مستحقة يجب أن تظهر حتماً
  const forced = candidates.filter(d => (d.forcedByMonth && state.month >= d.forcedByMonth) || d._isFollowUp);
  const rest = candidates.filter(d => !forced.includes(d));
  const shuffledRest = rest.sort(() => Math.random() - 0.5);

  const result = [...forced, ...shuffledRest].slice(0, Math.max(count, forced.length));
  if (dueFollowUpIds.length) {
    state.pendingFollowUps = state.pendingFollowUps.filter(f => !(f.kind === 'decision' && dueFollowUpIds.includes(f.id) && state.month >= f.dueMonth));
  }
  return result;
}

function applyDecisionOption(state, decision, optionIndex) {
  const option = decision.options[optionIndex];
  applyEffects(state, option.immediate);
  scheduleEffects(state, option.medium, 6);
  scheduleEffects(state, option.long, 18);

  if (option.relationsEffect) {
    const effect = { ...option.relationsEffect };
    if (!effect.id && decision._target) effect.id = decision._target.id;
    applyRelationsEffect(state, effect);
  }

  // أثر على علاقة ثنائية بين شخصيتين (يُستخدم مع dynamicTarget: 'severeCabinetRivalry')
  if (option.characterRelationsEffect && decision._target && decision._target.type === 'characterPair') {
    applyCharacterRelationsEffect(state, decision._target.aId, decision._target.bId, option.characterRelationsEffect.delta);
  }

  // قرار دستوري تأسيسي لا رجعة فيه - يُحسم مرة واحدة ويُقفل/يفتح قرارات وأحداث حصرية لاحقاً حسب المحور المختار
  if (option.constitutionEffect) {
    state.constitution[option.constitutionEffect.axis] = option.constitutionEffect.value;
  }

  // تعديل سياسة قطاع إنتاجي بشكل دائم (ملكية/توجّه/استثمار) بدل أثر لمرة واحدة يُنسى
  if (option.sectorPolicyEffect) {
    const eff = option.sectorPolicyEffect;
    const policy = state.sectorPolicies[eff.sector];
    if (policy) {
      if (eff.ownership) policy.ownership = eff.ownership;
      if (eff.orientationDelta !== undefined) policy.orientation = Math.max(0, Math.min(100, policy.orientation + eff.orientationDelta));
      if (eff.investDelta !== undefined) {
        // investDelta نسبة مئوية من خط الأساس الثابت لهذا البند (لا نقاط مئوية مباشرة على مقياس نسبي قديم) -
        // تُترجم هنا إلى مبلغ مطلق بالمليون د.ل يُضاف لتخصيص القطاع الفعلي
        const budgetKey = PRODUCTIVE_SECTOR_META[eff.sector].budgetKey;
        const base = (state.budget.baseline && state.budget.baseline[budgetKey]) || state.budget.allocations[budgetKey] || 1;
        const amountDelta = base * eff.investDelta / 100;
        state.budget.allocations[budgetKey] = Math.max(0, state.budget.allocations[budgetKey] + amountDelta);
      }
    }
  }

  // تعديل معدل ضريبي أو دعم وقود دائم في السياسة الاقتصادية الكلية بدل أثر لمرة واحدة يُنسى
  if (option.macroPolicyEffect) {
    const eff = option.macroPolicyEffect;
    const macro = state.macroPolicy;
    if (macro[eff.rateKey] !== undefined) {
      const bounds = MACRO_RATE_BOUNDS[eff.rateKey] || { min: 0, max: 100 };
      macro[eff.rateKey] = Math.max(bounds.min, Math.min(bounds.max, macro[eff.rateKey] + eff.delta));
    }
  }

  // أثر مباشر على شعبية المنافس الانتخابي (تأجيل الانتخابات، تنازلات سياسية...) دون خوض استحقاق فعلي
  if (option.rivalApprovalDelta !== undefined && state.rival) {
    state.rival.approval = Math.max(5, Math.min(95, state.rival.approval + option.rivalApprovalDelta));
  }

  // استحقاق انتخابي فعلي: نتيجة حقيقية تُحسم من رضاك مقابل شعبية منافسك الحي - راجع js/systems/rival.js
  let electionResult = null;
  if (option.electionResolution) {
    electionResult = resolveElection(state, option.electionResolution);
  }

  if (decision.oneTime) state.decisionsUsed.push(decision.id);
  if (decision.cooldown) state.decisionCooldowns[decision.id] = state.month + decision.cooldown;

  state.decisionsLog.push({
    month: state.month, year: state.year, decisionId: decision.id,
    title: decision.title, optionLabel: option.label, advisor: option.advisor || null
  });

  return electionResult ? { electionResult } : undefined;
}
