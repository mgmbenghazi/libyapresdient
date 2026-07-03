// نظام الأحداث العشوائية
const DEFAULT_EVENT_COOLDOWN = 6; // أشهر - يمنع تكرار نفس الحدث بعد وقوعه مباشرة

function rollEvent(state) {
  const candidates = [];
  EVENTS.forEach(e => {
    if (e.minMonth && state.month < e.minMonth) return;
    if (state.eventCooldowns[e.id] && state.month < state.eventCooldowns[e.id]) return;
    if (e.condition && !e.condition(state)) return;

    if (e.dynamicTarget) {
      const target = resolveDynamicTarget(state, e.dynamicTarget);
      if (!target) return;
      candidates.push({
        ...e,
        title: interpolateTarget(e.title, target),
        description: interpolateTarget(e.description, target),
        _target: target
      });
    } else {
      candidates.push(e);
    }
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

  if (option.relationsEffect) {
    const effect = { ...option.relationsEffect };
    if (!effect.id && event._target) effect.id = event._target.id;
    applyRelationsEffect(state, effect);
  }

  // أثر على علاقة ثنائية بين شخصيتين (يُستخدم مع dynamicTarget: 'severeCabinetRivalry')
  if (option.characterRelationsEffect && event._target && event._target.type === 'characterPair') {
    applyCharacterRelationsEffect(state, event._target.aId, event._target.bId, option.characterRelationsEffect.delta);
  }

  // إقالة فعلية للطرف الأقل ولاءً من زوج شخصيات مستهدف - لا مجرد وعد نصي بلا أثر ميكانيكي
  if (option.dismissLowerLoyaltyOfPair && event._target && event._target.type === 'characterPair') {
    const a = getCharacter(state, event._target.aId);
    const b = getCharacter(state, event._target.bId);
    if (a && b) {
      const loser = a.stats.loyalty <= b.stats.loyalty ? a : b;
      if (loser.ministry) dismissFromMinistry(state, loser.ministry);
    }
  }

  state.eventCooldowns[event.id] = state.month + (event.cooldown || DEFAULT_EVENT_COOLDOWN);
  state.eventsLog.push({ month: state.month, year: state.year, eventId: event.id, title: event.title, optionLabel: option.label });
}
