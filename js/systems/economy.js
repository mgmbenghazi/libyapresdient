// المحرك الاقتصادي - يُحسب مرة كل شهر لعبة
function rnd(min, max) { return Math.random() * (max - min) + min; }

// تقدير الإيرادات الشهرية بناءً على الحالة الراهنة - دالة نقية بلا أي تعديل على الحالة
// تُستخدم لعرض معاينة حية في تبويب الميزانية، وأيضاً من داخل monthlyEconomicTick نفسها لضمان تطابق المعاينة مع الواقع
function estimateMonthlyRevenue(state) {
  const ind = state.indicators;
  const oilPriceFactor = state.economy.oilPrice / 100;
  const oilRevenue = ind.oilProduction * 30 * oilPriceFactor * 0.9;
  const nonOilBoost = 1 + ((ind.agricultureLevel + ind.tourismLevel + ind.industryLevel) / 3) / 200;
  const taxRevenue = (ind.economicDevelopment * 25) * (1 - ind.unemployment / 150) * nonOilBoost;
  return { oilRevenue, taxRevenue, totalRevenue: oilRevenue + taxRevenue };
}

// تقدير كامل للميزانية الشهرية: كل شريحة تمثل نسبتها المئوية مباشرة من الإيرادات المتوقعة -
// فمجموع 100% يعني ميزانية متوازنة تماماً (إنفاق = إيراد)، وما دون ذلك فائض وما فوقه عجز.
// هذا هو المصدر الوحيد لحساب الإنفاق، مستخدم من المعاينة الحية في الواجهة ومن الدورة الشهرية الفعلية معاً.
function estimateBudget(state) {
  const revenue = estimateMonthlyRevenue(state);
  const alloc = state.budget.allocations;
  const totalAllocPct = Object.values(alloc).reduce((a, b) => a + b, 0);
  const spendBySector = {};
  Object.keys(alloc).forEach(key => {
    spendBySector[key] = revenue.totalRevenue * (alloc[key] / 100);
  });
  const totalExpenditure = Object.values(spendBySector).reduce((a, b) => a + b, 0);
  return { ...revenue, totalAllocPct, spendBySector, totalExpenditure, balance: revenue.totalRevenue - totalExpenditure };
}

function monthlyEconomicTick(state) {
  const ind = state.indicators;
  const eco = state.economy;
  const alloc = state.budget.allocations;

  // 1) تقلب سعر النفط العالمي (مشي عشوائي حول 100)
  eco.oilPrice = Math.max(30, Math.min(200, eco.oilPrice + rnd(-6, 6)));
  const oilPriceFactor = eco.oilPrice / 100;

  // 2+3+4) الإيرادات والإنفاق - كل شريحة ميزانية تُحسب كنسبة مباشرة من الإيرادات الفعلية،
  // بحيث يعكس تعديل الأشرطة فعلياً حجم الإنفاق الكلي (لا مجرد إعادة توزيع لمجموع ثابت)
  const budget = estimateBudget(state);
  const { oilRevenue, taxRevenue, totalRevenue, totalExpenditure } = budget;

  const monthlyBalance = totalRevenue - totalExpenditure; // مليون د.ل
  ind.treasury += monthlyBalance;
  ind.budgetBalance = clampIndicator('budgetBalance', (monthlyBalance / Math.max(totalRevenue, 1)) * 100);

  // 5) تأثير مستوى تمويل كل قطاع على مؤشراته (مقارنة بحصة متوازنة ~12.5%)
  const fairShare = 100 / 8;
  function sectorFundingEffect(sectorKey, indicatorKey, weight) {
    const pct = alloc[sectorKey];
    const delta = (pct - fairShare) / fairShare; // -1..+
    ind[indicatorKey] = clampIndicator(indicatorKey, ind[indicatorKey] + delta * weight);
  }
  sectorFundingEffect('education', 'educationLevel', 0.6);
  sectorFundingEffect('health', 'healthLevel', 0.6);
  sectorFundingEffect('security', 'security', 0.6);
  sectorFundingEffect('infrastructure', 'infrastructureLevel', 0.5);
  sectorFundingEffect('economicDev', 'economicDevelopment', 0.5);

  // نقص شديد في التمويل الأساسي يضر برضا الشعب
  ['education', 'health', 'security', 'infrastructure', 'subsidies'].forEach(key => {
    if (alloc[key] < 6) ind.satisfaction = clampIndicator('satisfaction', ind.satisfaction - 0.3);
  });

  // 6) البطالة والتضخم والنمو
  const growthDrift = (ind.economicDevelopment - 50) / 400 + (oilPriceFactor - 1) * 0.3;
  ind.gdpGrowth = clampIndicator('gdpGrowth', ind.gdpGrowth * 0.9 + growthDrift + rnd(-0.3, 0.3));
  ind.unemployment = clampIndicator('unemployment', ind.unemployment - ind.gdpGrowth * 0.15 + rnd(-0.2, 0.2));
  const subsidyPressure = (fairShare - alloc.subsidies) / fairShare;
  ind.inflation = clampIndicator('inflation', ind.inflation + (monthlyBalance < 0 ? 0.15 : -0.05) + subsidyPressure * 0.1 + rnd(-0.2, 0.2));

  // 7) احتياطي النقد الأجنبي والدين العام
  ind.forexReserves = Math.max(0, ind.forexReserves + oilRevenue * 0.15 - (ind.publicDebt > 60 ? 500 : 0) + rnd(-500, 500));
  if (monthlyBalance < 0) {
    ind.publicDebt = clampIndicator('publicDebt', ind.publicDebt + Math.abs(monthlyBalance) / Math.max(totalRevenue, 1) * 2);
  } else {
    ind.publicDebt = clampIndicator('publicDebt', ind.publicDebt - 0.1);
  }

  // 8) الفقر يتأثر بالبطالة والتضخم ودعم السلع
  ind.poverty = clampIndicator('poverty', ind.poverty + (ind.unemployment - 20) * 0.02 + (ind.inflation - 6) * 0.03 - subsidyPressure * -0.1);

  // 9) الرضا الشعبي العام - متوسط مرجّح لعدة مؤشرات
  const satisfactionTarget = (
    (100 - ind.poverty) * 0.25 +
    (100 - ind.unemployment) * 0.15 +
    ind.security * 0.15 +
    ind.healthLevel * 0.15 +
    ind.educationLevel * 0.1 +
    ind.infrastructureLevel * 0.1 +
    ind.politicalStability * 0.1
  );
  ind.satisfaction = clampIndicator('satisfaction', ind.satisfaction * 0.85 + satisfactionTarget * 0.15);

  // 10) الاستقرار السياسي يتأثر بالرضا والأمن
  ind.politicalStability = clampIndicator('politicalStability', ind.politicalStability * 0.92 + (ind.satisfaction * 0.5 + ind.security * 0.5) * 0.08);

  // 11) الأمن يتراجع قليلاً بشكل طبيعي دون صيانة (entropy)
  ind.security = clampIndicator('security', ind.security - 0.15);
  ind.infrastructureLevel = clampIndicator('infrastructureLevel', ind.infrastructureLevel - 0.1);

  // 12) القطاعات غير النفطية (زراعة/سياحة/صناعة) وميزان التجارة
  ind.agricultureLevel = clampIndicator('agricultureLevel', ind.agricultureLevel + (ind.infrastructureLevel - 50) / 500 - 0.1);
  ind.tourismLevel = clampIndicator('tourismLevel', ind.tourismLevel + (ind.security - 50) / 400 - 0.1);
  ind.industryLevel = clampIndicator('industryLevel', ind.industryLevel + (ind.economicDevelopment - 50) / 500 - 0.1);
  const nonOilDiversification = (ind.agricultureLevel + ind.tourismLevel + ind.industryLevel) / 3;
  ind.economicDevelopment = clampIndicator('economicDevelopment', ind.economicDevelopment + (nonOilDiversification - 50) / 800);
  ind.tradeBalance = clampIndicator('tradeBalance', ind.tradeBalance * 0.9 + ((oilPriceFactor - 1) * 15 + (nonOilDiversification - 40) / 4) * 0.1 + rnd(-0.5, 0.5));

  return { oilRevenue, taxRevenue, totalRevenue, totalExpenditure, monthlyBalance };
}

function applyEffects(state, effects) {
  if (!effects) return;
  Object.entries(effects).forEach(([key, delta]) => {
    if (state.indicators[key] === undefined) return;
    state.indicators[key] = clampIndicator(key, state.indicators[key] + delta);
  });
}

function scheduleEffects(state, effects, monthsFromNow) {
  if (!effects || Object.keys(effects).length === 0) return;
  state.scheduledEffects.push({ applyAtMonth: state.month + monthsFromNow, effects });
}

function processScheduledEffects(state) {
  const due = state.scheduledEffects.filter(e => e.applyAtMonth <= state.month);
  due.forEach(e => applyEffects(state, e.effects));
  state.scheduledEffects = state.scheduledEffects.filter(e => e.applyAtMonth > state.month);
}
