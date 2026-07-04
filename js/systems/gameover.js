// شروط نهاية اللعبة والتقييم النهائي
function checkGameOver(state) {
  const ind = state.indicators;

  if (ind.satisfaction < 12) {
    state.lowSatisfactionStreak = (state.lowSatisfactionStreak || 0) + 1;
  } else {
    state.lowSatisfactionStreak = 0;
  }
  if (state.lowSatisfactionStreak >= 3) {
    return { over: true, reason: 'overthrow', title: 'انتفاضة شعبية أطاحت بالرئاسة بسبب انهيار الرضا الشعبي.' };
  }

  if (ind.treasury < -20000 && ind.forexReserves < 2000) {
    state.bankruptcyStreak = (state.bankruptcyStreak || 0) + 1;
  } else {
    state.bankruptcyStreak = 0;
  }
  if (state.bankruptcyStreak >= 3) {
    return { over: true, reason: 'bankruptcy', title: 'إفلاس اقتصادي كامل أدى إلى انهيار الدولة مالياً.' };
  }

  if (ind.security < 10) {
    state.securityStreak = (state.securityStreak || 0) + 1;
  } else {
    state.securityStreak = 0;
  }
  if (state.securityStreak >= 3) {
    return { over: true, reason: 'occupation', title: 'الانهيار الأمني أدى إلى تدخل خارجي والسيطرة على أجزاء من البلاد.' };
  }

  if (state.month >= 48) {
    return { over: true, reason: 'completed', title: 'أكملت فترتك الرئاسية بنجاح!' };
  }

  return { over: false };
}

function computeFinalScore(state) {
  const ind = state.indicators;
  const score = (
    ind.satisfaction * 0.25 +
    ind.politicalStability * 0.2 +
    ind.internationalSupport * 0.15 +
    ind.economicDevelopment * 0.15 +
    ind.security * 0.1 +
    (100 - ind.poverty) * 0.1 +
    (100 - ind.unemployment) * 0.05
  );
  return Math.round(score);
}

// نهاية سردية مخصصة لكل سبب سقوط تستشهد بآخر قرار/حدث فعلي دفع اللاعب لهذه النهاية -
// بدل شاشة عامة موحدة، فيشعر اللاعب أن اختياراته الفعلية هي من كتبت نهايته لا نص جاهز مسبقاً
function buildEpilogue(state, reason) {
  const notableDecision = state.decisionsLog[state.decisionsLog.length - 1];
  const notableEvent = state.eventsLog[state.eventsLog.length - 1];
  const citeDecision = notableDecision ? `آخر قرار اتخذته كان "${notableDecision.title}" (اخترت: ${notableDecision.optionLabel}).` : '';
  const citeEvent = notableEvent ? `آخر أزمة واجهتها كانت "${notableEvent.title}" (تعاملت معها بـ: ${notableEvent.optionLabel}).` : '';

  if (reason === 'overthrow') {
    return `انهار الرضا الشعبي عن حكمك حتى بلغ نقطة اللاعودة، وخرجت الحشود للمطالبة برحيلك. ${citeEvent} ${citeDecision} لم يكن كافياً لاحتواء الغضب المتراكم على مدى أشهر.`.trim();
  }
  if (reason === 'bankruptcy') {
    return `استُنزفت الخزينة العامة والاحتياطي الأجنبي معاً حتى عجزت الدولة عن الوفاء بالتزاماتها الأساسية. ${citeDecision} جاء أمام أزمة كانت تتفاقم شهراً بعد شهر دون معالجة جذرية.`.trim();
  }
  if (reason === 'occupation') {
    return `تدهور الوضع الأمني إلى درجة فقدت فيها الدولة سيطرتها على أجزاء من أراضيها، ودخلت قوى خارجية لملء الفراغ. ${citeEvent} كشف هشاشة أمنية لم تُعالَج في الوقت المناسب.`.trim();
  }
  const score = computeFinalScore(state);
  let base;
  if (score >= 80) base = 'أكملت فترتك الرئاسية وأنت تترك خلفك دولة أكثر استقراراً وازدهاراً مما ورثتها - إرث يُحتذى به في تاريخ البلاد.';
  else if (score >= 50) base = 'أكملت فترتك الرئاسية بأداء متوازن، رغم أزمات لم تُحسم جميعها بالشكل الأمثل خلال سنوات حكمك.';
  else base = 'أكملت فترتك الرئاسية، لكنك تترك خلفك دولة تواجه تحديات جسيمة لم تفلح سياساتك في احتوائها بالكامل.';

  // السيادة المنقسمة: خاتمة إضافية تحدد إن كانت أهم أزمة بنيوية في البلاد - الانقسام نفسه - قد حُلّت أم بقيت كما ورثتها
  const sov = state.sovereignty;
  let sovNote = '';
  if (sov) {
    if (sov.reunified) sovNote = ' وفي إنجاز تاريخي نادر، نجحت فيما فشل فيه من سبقوك لأكثر من عقد: أعدت توحيد سيادة الدولة على كامل ترابها الوطني.';
    else if (sov.territoryControl >= 65) sovNote = ` غير أن الانقسام السياسي ظل قائماً حتى نهاية عهدك، وإن كانت سلطتك الفعلية قد اتسعت إلى ${Math.round(sov.territoryControl)}% من البلاد.`;
    else sovNote = ` أما الانقسام الذي ورثته - سلطة موازية شرقاً ومؤسسات سيادية مبتورة - فبقي إلى حد بعيد كما كان، دون حل حقيقي خلال فترتك.`;
  }
  return base + sovNote;
}

function getTitle(state, reason) {
  const score = computeFinalScore(state);
  if (reason === 'overthrow') return 'الرئيس المخلوع';
  if (reason === 'bankruptcy') return 'رئيس الإفلاس';
  if (reason === 'occupation') return 'الرئيس الذي فقد السيادة';

  if (score >= 80) return 'المُصلح العظيم';
  if (score >= 65) return 'الرئيس البنّاء';
  if (score >= 50) return 'الحاكم المتوازن';
  if (score >= 35) return 'الرئيس المتردد';
  return 'الحاكم الفاشل';
}
