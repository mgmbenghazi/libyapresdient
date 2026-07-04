// نظام المؤامرات: شبكة العلاقات كخصم نشط لا بيانات ساكنة - وزير منخفض الولاء قد يخطط فعلياً ضدك
// على مدى أشهر (تمرداً/انشقاقاً/تسريباً)، وتكتشفه عبر إجراء "تحرّك استخباراتي" (data/actions.js) أو يكتمل صامتاً إن أهملته.
// مؤامرة واحدة نشطة كحد أقصى في كل لحظة - يبقيها قابلة للفهم دون تعقيد إدارة عدة مؤامرات متوازية
const SCHEME_DISCOVERED_EVENT = { coup: 'scheme_coup_discovered', defect: 'scheme_defection_discovered', smear: 'scheme_smear_discovered' };
const SCHEME_EXECUTED_EVENT = { coup: 'scheme_coup_executed', defect: 'scheme_defection_executed', smear: 'scheme_smear_executed' };

function pickSchemeKind(initiator) {
  const roll = Math.random();
  const coupWeight = (initiator.ministry === 'defense' || initiator.ministry === 'interior') ? 0.5 : 0.2;
  if (roll < coupWeight) return 'coup';
  return roll < coupWeight + 0.4 ? 'defect' : 'smear';
}

function computeSchemeRate(state, scheme) {
  const initiator = getCharacter(state, scheme.initiatorId);
  if (!initiator) return 15; // الشخصية لم تعد موجودة (أُقيلت مثلاً) - أنهِ المؤامرة بسرعة اصطناعياً
  return 6 + (initiator.stats.ambition - 50) / 10 + computeSystemicRisk(state) / 12;
}

function advanceSchemes(state) {
  if (!state.schemes) state.schemes = [];

  if (state.schemes.length) {
    const scheme = state.schemes[0];
    if (!scheme.discovered && !scheme.triggered) {
      scheme.progress = Math.min(100, scheme.progress + computeSchemeRate(state, scheme));
      if (scheme.progress >= 100) {
        scheme.triggered = true;
        scheduleFollowUp(state, { id: SCHEME_EXECUTED_EVENT[scheme.kind], kind: 'event', monthsFromNow: 0 });
      }
    }
    return;
  }

  // لا مؤامرة نشطة حالياً - احتمال شهري ضئيل يتناسب مع المخاطرة النظامية أن يبدأ أقل الوزراء ولاءً بالتخطيط
  const candidate = leastLoyalCabinetMember(state);
  if (!candidate || candidate.stats.loyalty >= 50) return;
  const risk = computeSystemicRisk(state);
  const chance = 0.04 + (risk / 100) * 0.10;
  if (Math.random() > chance) return;

  state.schemes.push({
    id: `${candidate.id}-${state.month}`,
    initiatorId: candidate.id,
    kind: pickSchemeKind(candidate),
    progress: 10,
    discovered: false,
    triggered: false,
    startedMonth: state.month
  });
}

// يُستدعى من إجراء "تحرّك استخباراتي" (data/actions.js) - يكشف المؤامرة النشطة إن وُجدت فوراً
function revealActiveScheme(state) {
  const scheme = (state.schemes || []).find(s => !s.discovered && !s.triggered);
  if (!scheme) return { message: 'لم يكتشف جهاز الاستخبارات أي نشاط مشبوه حالياً.' };
  const initiator = getCharacter(state, scheme.initiatorId);
  scheme.discovered = true;
  scheduleFollowUp(state, { id: SCHEME_DISCOVERED_EVENT[scheme.kind], kind: 'event', monthsFromNow: 0 });
  const kindLabel = { coup: 'محاولة انقلاب', defect: 'خطة انشقاق', smear: 'حملة تسريبات' }[scheme.kind];
  return { message: `كشفت الاستخبارات ${kindLabel} يدبّرها ${initiator ? initiator.name : 'جهة مجهولة داخل الحكومة'}!` };
}
