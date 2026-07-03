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
