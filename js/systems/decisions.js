// نظام اختيار وتطبيق القرارات
function getAvailableDecisions(state, count) {
  const available = DECISIONS.filter(d => {
    if (d.oneTime && state.decisionsUsed.includes(d.id)) return false;
    if (d.minMonth && state.month < d.minMonth) return false;
    if (d.cooldown && state.decisionCooldowns[d.id] && state.month < state.decisionCooldowns[d.id]) return false;
    if (d.condition && !d.condition(state)) return false;
    return true;
  });

  // القرارات "الإجبارية" (مثل الانتخابات) يجب أن تظهر حتماً عند بلوغ شهرها المحدد
  const forced = available.filter(d => d.forcedByMonth && state.month >= d.forcedByMonth);
  const rest = available.filter(d => !forced.includes(d));
  const shuffledRest = rest.sort(() => Math.random() - 0.5);

  const result = [...forced, ...shuffledRest].slice(0, Math.max(count, forced.length));
  return result;
}

function applyDecisionOption(state, decision, optionIndex) {
  const option = decision.options[optionIndex];
  applyEffects(state, option.immediate);
  scheduleEffects(state, option.medium, 6);
  scheduleEffects(state, option.long, 18);

  if (decision.oneTime) state.decisionsUsed.push(decision.id);
  if (decision.cooldown) state.decisionCooldowns[decision.id] = state.month + decision.cooldown;

  state.decisionsLog.push({
    month: state.month, year: state.year, decisionId: decision.id,
    title: decision.title, optionLabel: option.label, advisor: option.advisor || null
  });
}
