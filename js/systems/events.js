// نظام الأحداث العشوائية
const DEFAULT_EVENT_COOLDOWN = 6; // أشهر - يمنع تكرار نفس الحدث بعد وقوعه مباشرة

function rollEvent(state) {
  // سلاسل الأزمات المستحقة هذا الشهر (kind: 'event') تتجاوز التبريد والشروط المعتادة وتتصدّر الترجيح بقوة
  const dueFollowUpIds = (state.pendingFollowUps || [])
    .filter(f => f.kind === 'event' && state.month >= f.dueMonth)
    .map(f => f.id);

  const candidates = [];
  EVENTS.forEach(e => {
    const isDueFollowUp = dueFollowUpIds.includes(e.id);
    if (!isDueFollowUp) {
      if (e.minMonth && state.month < e.minMonth) return;
      if (state.eventCooldowns[e.id] && state.month < state.eventCooldowns[e.id]) return;
      if (e.condition && !e.condition(state)) return;
    }

    if (e.dynamicTarget) {
      const target = resolveDynamicTarget(state, e.dynamicTarget);
      if (!target) return;
      candidates.push({
        ...e,
        title: interpolateTarget(e.title, target),
        description: interpolateTarget(e.description, target),
        _target: target,
        _isFollowUp: isDueFollowUp
      });
    } else {
      candidates.push({ ...e, _isFollowUp: isDueFollowUp });
    }
  });
  if (candidates.length === 0) return null;

  // حدث مجدول ضمن سلسلة أزمة مستحق هذا الشهر يقع حتماً - لا يخضع لاحتمال الحدوث العام ولا للترجيح العشوائي
  const dueFollowUp = candidates.find(e => e._isFollowUp);
  if (dueFollowUp) {
    state.pendingFollowUps = state.pendingFollowUps.filter(f => !(f.kind === 'event' && f.id === dueFollowUp.id && state.month >= f.dueMonth));
    return dueFollowUp;
  }

  // احتمال حدوث حدث ديناميكي بدل 45% ثابتة: يتحرك من 30% في دولة مستقرة تماماً حتى 75% في دولة متداعية -
  // جودة الحكم تصبح محسوسة آلياً في هدوء الأشهر أو تلاحقها، لا رقماً واحداً يتجاهل حال البلاد
  const risk = computeSystemicRisk(state);
  const eventChance = 0.30 + (risk / 100) * 0.45;
  if (Math.random() > eventChance) return null;

  // فئة "أزمة" تكتسب وزناً إضافياً يتناسب مع المخاطرة - المشاكل الكبرى ترجّح أكثر في الدول الهشة فعلياً
  const riskWeightBonus = 1 + (risk / 100) * 1.5;
  function effectiveWeight(e) { return (e.weight || 1) * (e.severity === 'crisis' ? riskWeightBonus : 1); }
  const totalWeight = candidates.reduce((a, e) => a + effectiveWeight(e), 0);
  let roll = Math.random() * totalWeight;
  for (const e of candidates) {
    roll -= effectiveWeight(e);
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

  // بعض الخيارات تفتح فصلاً تالياً في سلسلة أزمة بدل حلّها نهائياً - القرار اليوم يُرتّب لاحقة محتومة لاحقاً
  if (option.followUp) {
    scheduleFollowUp(state, option.followUp);
  }

  state.eventCooldowns[event.id] = state.month + (event.cooldown || DEFAULT_EVENT_COOLDOWN);
  state.eventsLog.push({ month: state.month, year: state.year, eventId: event.id, title: event.title, optionLabel: option.label });
}
