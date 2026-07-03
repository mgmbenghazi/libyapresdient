// نظام الأحداث العشوائية
function rollEvent(state) {
  const candidates = EVENTS.filter(e => {
    if (e.minMonth && state.month < e.minMonth) return false;
    if (e.condition && !e.condition(state)) return false;
    return true;
  });
  if (candidates.length === 0) return null;

  // احتمال حدوث حدث هذا الشهر ~45%
  if (Math.random() > 0.45) return null;

  const totalWeight = candidates.reduce((a, e) => a + (e.weight || 1), 0);
  let roll = Math.random() * totalWeight;
  for (const e of candidates) {
    roll -= (e.weight || 1);
    if (roll <= 0) return e;
  }
  return candidates[candidates.length - 1];
}

function applyEventOption(state, event, optionIndex) {
  const option = event.options[optionIndex];
  applyEffects(state, option.immediate);
  scheduleEffects(state, option.medium, 6);
  state.eventsLog.push({ month: state.month, year: state.year, eventId: event.id, title: event.title, optionLabel: option.label });
}
