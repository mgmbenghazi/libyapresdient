// نظام اختيار وتطبيق القرارات
function getAvailableDecisions(state, count) {
  const candidates = [];
  DECISIONS.forEach(d => {
    if (d.oneTime && state.decisionsUsed.includes(d.id)) return;
    if (d.minMonth && state.month < d.minMonth) return;
    if (d.cooldown && state.decisionCooldowns[d.id] && state.month < state.decisionCooldowns[d.id]) return;
    if (d.condition && !d.condition(state)) return;

    if (d.dynamicTarget) {
      // قرارات تستهدف كياناً محدداً (قبيلة/دولة) يُحدَّد وقت العرض بناءً على الوضع الحالي
      const target = resolveDynamicTarget(state, d.dynamicTarget);
      if (!target) return; // لا يوجد هدف صالح حالياً - هذا القرار غير متاح هذا الشهر
      candidates.push({
        ...d,
        title: interpolateTarget(d.title, target),
        description: interpolateTarget(d.description, target),
        _target: target
      });
    } else {
      candidates.push(d);
    }
  });

  // القرارات "الإجبارية" (مثل الانتخابات) يجب أن تظهر حتماً عند بلوغ شهرها المحدد
  const forced = candidates.filter(d => d.forcedByMonth && state.month >= d.forcedByMonth);
  const rest = candidates.filter(d => !forced.includes(d));
  const shuffledRest = rest.sort(() => Math.random() - 0.5);

  const result = [...forced, ...shuffledRest].slice(0, Math.max(count, forced.length));
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

  if (decision.oneTime) state.decisionsUsed.push(decision.id);
  if (decision.cooldown) state.decisionCooldowns[decision.id] = state.month + decision.cooldown;

  state.decisionsLog.push({
    month: state.month, year: state.year, decisionId: decision.id,
    title: decision.title, optionLabel: option.label, advisor: option.advisor || null
  });
}
