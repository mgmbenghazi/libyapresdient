// المحرك الاقتصادي - يُحسب مرة كل شهر لعبة
function rnd(min, max) { return Math.random() * (max - min) + min; }

// تسرّب التهريب الشهري التقديري لدعم الوقود - دالة نقية تُستخدم من المعاينة الحية في الواجهة ومن الدورة الشهرية الفعلية معاً
function estimateSmugglingLeakage(state) {
  const oilPriceFactor = state.economy.oilPrice / 100;
  return Math.pow(state.macroPolicy.fuelSubsidyLevel / 100, 2) * 700 * oilPriceFactor;
}

// مؤشر المخاطرة النظامية 0-100 (الأعلى = أخطر) - قلب المحرك الجديد: يُغذّي احتمال الأحداث ووزنها
// ومخاطرة الانقلاب بدل أرقام ثابتة، فتصبح جودة الحكم محسوسة آلياً لا مجرد رقم على الشاشة
function computeSystemicRisk(state) {
  const ind = state.indicators;
  const instabilityComponent = (100 - ind.politicalStability) * 0.3;
  const dissatisfactionComponent = (100 - ind.satisfaction) * 0.25;
  const insecurityComponent = (100 - ind.security) * 0.2;
  const debtComponent = Math.min(100, ind.publicDebt) * 0.15;
  const ministers = Object.values(state.cabinet).filter(Boolean).map(id => getCharacter(state, id)).filter(Boolean);
  const avgCorruption = ministers.length ? ministers.reduce((a, c) => a + c.stats.corruption, 0) / ministers.length : 30;
  const corruptionComponent = avgCorruption * 0.1;
  return Math.max(0, Math.min(100, instabilityComponent + dissatisfactionComponent + insecurityComponent + debtComponent + corruptionComponent));
}

// تقدير الإيرادات الشهرية بناءً على الحالة الراهنة - دالة نقية بلا أي تعديل على الحالة
// تُستخدم لعرض معاينة حية في تبويب الميزانية، وأيضاً من داخل monthlyEconomicTick نفسها لضمان تطابق المعاينة مع الواقع
// كل قطاع إنتاجي يُولّد عائداً مباشراً يعكس نموذج ملكيته: الدولة تحصل على العائد كاملاً إن أدارته بنفسها،
// حصة أقل عند الشراكة أو الخصخصة مقابل نمو أسرع (انظر OWNERSHIP_PROFILES في data/sectors.js)
function estimateMonthlyRevenue(state) {
  const ind = state.indicators;
  const sp = state.sectorPolicies;
  const macro = state.macroPolicy;
  const oilPriceFactor = state.economy.oilPrice / 100;
  const oilShare = OWNERSHIP_PROFILES[sp.oil.ownership].revenueShare;
  const agriShare = OWNERSHIP_PROFILES[sp.agriculture.ownership].revenueShare;
  const tourismShare = OWNERSHIP_PROFILES[sp.tourism.ownership].revenueShare;
  const industryShare = OWNERSHIP_PROFILES[sp.industry.ownership].revenueShare;

  let oilRevenue = ind.oilProduction * 30 * oilPriceFactor * 0.9 * oilShare;
  // السيادة المنقسمة: حصار نفطي من قوات موالية للسلطة الموازية يشلّ التصدير شبه كلياً (كما حدث فعلياً
  // في 2020)، وانقسام المصرف المركزي/شركة النفط يؤخر جزءاً من العائد حتى مع تدفق التصدير طبيعياً
  const sov = state.sovereignty;
  if (sov) {
    if (sov.oilBlockade && sov.oilBlockade.active) oilRevenue *= 0.12;
    if (sov.nocSplit) oilRevenue *= 0.94;
    if (sov.centralBankSplit) oilRevenue *= 0.94;
  }
  const agricultureRevenue = ind.agricultureLevel * 12 * agriShare * (0.5 + sp.agriculture.orientation / 200);
  const tourismRevenue = ind.tourismLevel * 15 * tourismShare;
  const industryRevenue = ind.industryLevel * 14 * industryShare;
  const sectorRevenue = agricultureRevenue + tourismRevenue + industryRevenue;

  const nonOilBoost = 1 + ((ind.agricultureLevel + ind.tourismLevel + ind.industryLevel) / 3) / 200;
  // ثلاث ضرائب دائمة بدل رقم ضريبي واحد ثابت - كل معدل يُضبط من تبويب السياسة الاقتصادية ويُقرأ هنا فعلياً
  const businessBase = (ind.industryLevel + ind.economicDevelopment) / 2;
  const corporateTaxRevenue = businessBase * (macro.corporateTaxRate / 100) * 60;
  const consumptionBase = ind.economicDevelopment * (1 - ind.unemployment / 150) * nonOilBoost;
  const consumptionTaxRevenue = consumptionBase * (macro.consumptionTaxRate / 100) * 111;
  const tradeBase = ((ind.agricultureLevel + ind.tourismLevel + ind.industryLevel) / 3) + ind.oilProduction / 50;
  const customsRevenue = tradeBase * (macro.customsTariffRate / 100) * 35;
  const taxRevenue = corporateTaxRevenue + consumptionTaxRevenue + customsRevenue;

  // دعم أسعار المحروقات المحلية: سطر إنفاق مستقل تماماً عن شريحة "الدعم" العامة في الميزانية -
  // كلفته الفعلية تتناسب مع حجم الاقتصاد وسعر النفط العالمي (الفجوة بين السعر المدعوم والعالمي)
  const domesticFuelBase = 400 + ind.economicDevelopment * 3;
  const fuelSubsidyCost = domesticFuelBase * (macro.fuelSubsidyLevel / 100) * oilPriceFactor;

  return {
    oilRevenue, corporateTaxRevenue, consumptionTaxRevenue, customsRevenue, taxRevenue,
    agricultureRevenue, tourismRevenue, industryRevenue, sectorRevenue, fuelSubsidyCost,
    totalRevenue: oilRevenue + taxRevenue + sectorRevenue
  };
}

// النسب الافتراضية الأصلية لبنود الميزانية - لا تُستخدم لحساب الإنفاق الفعلي (بات كل بند مبلغاً مطلقاً
// بالمليون د.ل يضبطه اللاعب مباشرة ولا يتغيّر تلقائياً مع الإيراد)، بل فقط لاشتقاق خط الأساس المرجعي
// لكل بند عند بدء اللعبة أو ترحيل حفظ قديم، ولتحديد ما يُعتبر "تمويلاً كافياً" لكل قطاع في المعادلات أدناه
const DEFAULT_BUDGET_PCT = {
  education: 11, health: 11, security: 11, infrastructure: 11, subsidies: 11, salaries: 11, debtService: 4, economicDev: 4,
  oilSector: 10, agricultureSector: 6, tourismSector: 5, industrySector: 5
};

function computeBaselineAllocations(referenceRevenue) {
  const result = {};
  Object.entries(DEFAULT_BUDGET_PCT).forEach(([k, pct]) => { result[k] = Math.round(referenceRevenue * pct / 100); });
  return result;
}

// تقدير كامل للميزانية الشهرية: كل بند الآن مبلغ مطلق حقيقي بالمليون د.ل يضبطه اللاعب مباشرة -
// لا نسبة تُعاد حسابها تلقائياً كل شهر من الإيراد المتقلب، فنمو الإيراد (نفط أو غيره) يتحول فعلياً
// إلى فائض ملموس في الخزينة ما لم يقرر اللاعب صراحة زيادة الإنفاق. كلفة دعم الوقود تبقى سطراً مستقلاً
// تماماً فوق بنود التخصيص - وليست جزءاً منها - لأنها من السياسة الاقتصادية الكلية لا الميزانية العامة
function estimateBudget(state) {
  const revenue = estimateMonthlyRevenue(state);
  const alloc = state.budget.allocations;
  const spendBySector = { ...alloc };
  const allocExpenditure = Object.values(spendBySector).reduce((a, b) => a + b, 0);
  const totalExpenditure = allocExpenditure + revenue.fuelSubsidyCost;
  // نسبة الإنفاق الإجمالي (بما فيه دعم الوقود) من الإيراد الفعلي - مؤشر معلوماتي لحالة التوازن المالي، لا مُدخلاً في الحساب
  const totalAllocPct = revenue.totalRevenue > 0 ? (totalExpenditure / revenue.totalRevenue) * 100 : 100;
  return { ...revenue, totalAllocPct, spendBySector, allocExpenditure, totalExpenditure, balance: revenue.totalRevenue - totalExpenditure };
}

// الدورة الاقتصادية العالمية: طبقة مستمرة فوق مشي سعر النفط العشوائي، تنحاز الاتجاه صعوداً في الرواج وهبوطاً في الركود
// بدل تذبذب عشوائي بحت لا معنى اقتصادياً له عبر الأشهر
const WORLD_CYCLE_META = {
  boom: { driftMin: -2, driftMax: 10, growthBonus: 0.15, label: 'رواج اقتصادي عالمي' },
  normal: { driftMin: -6, driftMax: 6, growthBonus: 0, label: 'استقرار اقتصادي عالمي نسبي' },
  recession: { driftMin: -10, driftMax: 2, growthBonus: -0.15, label: 'ركود اقتصادي عالمي' }
};

function advanceWorldCycle(state) {
  const eco = state.economy;
  if (eco.worldCycleMonthsLeft === undefined) eco.worldCycleMonthsLeft = 4 + Math.floor(Math.random() * 7);
  eco.worldCycleMonthsLeft--;
  if (eco.worldCycleMonthsLeft <= 0) {
    const roll = Math.random();
    eco.worldCycle = roll < 0.25 ? 'boom' : roll < 0.5 ? 'recession' : 'normal';
    eco.worldCycleMonthsLeft = 4 + Math.floor(Math.random() * 7);
  }
  return WORLD_CYCLE_META[eco.worldCycle] || WORLD_CYCLE_META.normal;
}

function monthlyEconomicTick(state) {
  const ind = state.indicators;
  const eco = state.economy;
  const alloc = state.budget.allocations;
  const sov = state.sovereignty;

  // 0) السيادة المنقسمة: يُحسب أولاً كي تنعكس حالة الحصار النفطي فوراً على إيراد هذا الشهر تحديداً
  monthlySovereigntyTick(state);

  // 1) تقلب سعر النفط العالمي (مشي عشوائي منحاز حسب الدورة الاقتصادية العالمية الجارية)
  const cycle = advanceWorldCycle(state);
  eco.oilPrice = Math.max(30, Math.min(200, eco.oilPrice + rnd(cycle.driftMin, cycle.driftMax)));
  const oilPriceFactor = eco.oilPrice / 100;

  // 2+3+4) الإيرادات والإنفاق - كل بند ميزانية الآن مبلغ مطلق ثابت لا يتغيّر تلقائياً مع الإيراد،
  // فنمو الإيراد (نفط أو غيره) يتحول فعلياً إلى فائض حقيقي في الخزينة ما لم يزد اللاعب الإنفاق صراحة
  const budget = estimateBudget(state);
  const { oilRevenue, taxRevenue, agricultureRevenue, tourismRevenue, industryRevenue, sectorRevenue, fuelSubsidyCost, totalRevenue, totalExpenditure } = budget;
  const macro = state.macroPolicy;

  const monthlyBalance = totalRevenue - totalExpenditure; // مليون د.ل
  ind.treasury += monthlyBalance;
  ind.budgetBalance = clampIndicator('budgetBalance', (monthlyBalance / Math.max(totalRevenue, 1)) * 100);

  // 5) تأثير مستوى تمويل كل قطاع على مؤشراته - يُقارَن المبلغ المطلق المخصَّص بخط أساس ثابت محسوب عند بداية اللعبة
  // (state.budget.baseline)، لا بنسبة من الإيراد المتقلب، فتظل معايرة "هل هذا القطاع ممول بما يكفي؟" مستقرة
  // بصرف النظر عن حجم الإيراد اللحظي
  const baseline = state.budget.baseline || computeBaselineAllocations(state.budget.referenceRevenue || totalRevenue);
  function sectorFundingEffect(sectorKey, indicatorKey, weight, growthMult) {
    const amount = alloc[sectorKey];
    const base = baseline[sectorKey] || 1;
    const delta = (amount - base) / base; // -1..+ (يمكن تجاوز +1 إن ضاعف اللاعب التمويل عدة مرات)
    ind[indicatorKey] = clampIndicator(indicatorKey, ind[indicatorKey] + delta * weight * (growthMult === undefined ? 1 : growthMult));
  }
  sectorFundingEffect('education', 'educationLevel', 0.6);
  sectorFundingEffect('health', 'healthLevel', 0.6);
  sectorFundingEffect('security', 'security', 0.6);
  sectorFundingEffect('infrastructure', 'infrastructureLevel', 0.5);
  sectorFundingEffect('economicDev', 'economicDevelopment', 0.5);

  // 5ب) القطاعات الإنتاجية الأربعة: الاستثمار المخصص × مضاعف نموذج الملكية (شراكة = أسرع، حكومي = أبطأ وأكثر بيروقراطية)
  const sp = state.sectorPolicies;
  const oilProfile = OWNERSHIP_PROFILES[sp.oil.ownership];
  const agriProfile = OWNERSHIP_PROFILES[sp.agriculture.ownership];
  const tourismProfile = OWNERSHIP_PROFILES[sp.tourism.ownership];
  const industryProfile = OWNERSHIP_PROFILES[sp.industry.ownership];
  sectorFundingEffect('oilSector', 'oilProduction', 22, oilProfile.growthMult);
  ind.oilProduction = Math.max(0, ind.oilProduction - 6); // استنزاف طبيعي للحقول القائمة دون استثمار متجدد
  sectorFundingEffect('agricultureSector', 'agricultureLevel', 0.55, agriProfile.growthMult);
  // الأمن شرط مسبق فعلي للسياحة: دون حد أدنى، يفقد الاستثمار معظم فعاليته مهما بلغت قيمته - لا مجرد وزن يُضاف
  const tourismSecurityFactor = ind.security < 40 ? Math.max(0.1, ind.security / 40) * 0.35 : 1;
  sectorFundingEffect('tourismSector', 'tourismLevel', 0.5, tourismProfile.growthMult * tourismSecurityFactor);
  sectorFundingEffect('industrySector', 'industryLevel', 0.55, industryProfile.growthMult);

  // الرمزية السياسية لملكية النفط تحديداً: الخصخصة الكاملة لثروة سيادية تثير حساسية شعبية، والشراكة الأجنبية تفتح أبواباً دولية
  if (sp.oil.ownership === 'privatized') ind.satisfaction = clampIndicator('satisfaction', ind.satisfaction - 0.08);
  if (sp.oil.ownership === 'partnership') ind.internationalSupport = clampIndicator('internationalSupport', ind.internationalSupport + 0.05);

  // نقص شديد في التمويل الأساسي يضر برضا الشعب - يُقاس الآن كنسبة من خط الأساس بدل عتبة مئوية مطلقة قديمة
  ['education', 'health', 'security', 'infrastructure', 'subsidies'].forEach(key => {
    if (alloc[key] < baseline[key] * 0.55) ind.satisfaction = clampIndicator('satisfaction', ind.satisfaction - 0.3);
  });

  // 6) البطالة والتضخم والنمو - الدورة الاقتصادية العالمية تنحاز النمو صعوداً في الرواج وهبوطاً في الركود
  const growthDrift = (ind.economicDevelopment - 50) / 400 + (oilPriceFactor - 1) * 0.3 + cycle.growthBonus;
  ind.gdpGrowth = clampIndicator('gdpGrowth', ind.gdpGrowth * 0.9 + growthDrift + rnd(-0.3, 0.3));
  ind.unemployment = clampIndicator('unemployment', ind.unemployment - ind.gdpGrowth * 0.15 + rnd(-0.2, 0.2));
  const subsidyPressure = (baseline.subsidies - alloc.subsidies) / baseline.subsidies;
  ind.inflation = clampIndicator('inflation', ind.inflation + (monthlyBalance < 0 ? 0.15 : -0.05) + subsidyPressure * 0.1 + rnd(-0.2, 0.2));

  // 6أ) السياسة النقدية: سعر الفائدة الأساسي ونظام سعر الصرف - أداتان حقيقيتان يتحكم بهما اللاعب مباشرة
  // في التضخم والاحتياطي الأجنبي، بدل انجرافهما التلقائي البحت وفق العجز والدعم فقط
  const monetary = state.monetaryPolicy || { interestRate: 5, exchangeRegime: 'managed' };
  const rateDeviation = monetary.interestRate - 5; // 5% هو الحياد المرجعي
  ind.inflation = clampIndicator('inflation', ind.inflation - rateDeviation * 0.1);
  ind.gdpGrowth = clampIndicator('gdpGrowth', ind.gdpGrowth - rateDeviation * 0.02);
  ind.economicDevelopment = clampIndicator('economicDevelopment', ind.economicDevelopment - rateDeviation * 0.03);
  // فائدة أعلى تجذب رؤوس أموال قصيرة الأجل تبحث عن عائد (تدفق ساخن)، وأدنى تطرد جزءاً منها
  ind.forexReserves = Math.max(0, ind.forexReserves + rateDeviation * 180);
  // كلفة خدمة الدين الفعلية: فائدة أعلى تُثقل خزينة أي دولة مديونة، بصرف النظر عن استراتيجية تمويل العجز المختارة
  const debtServiceCost = (monetary.interestRate / 100) * ind.publicDebt * 9;
  ind.treasury -= debtServiceCost;

  if (monetary.exchangeRegime === 'fixed') {
    // تثبيت سعر الصرف: يكبح التضخم المستورد لكن يستنزف الاحتياطي شهرياً للدفاع عن العملة
    ind.inflation = clampIndicator('inflation', ind.inflation - 0.25);
    const peggingCost = 300 + Math.max(0, ind.inflation - 5) * 120;
    ind.forexReserves = Math.max(0, ind.forexReserves - peggingCost);
  } else if (monetary.exchangeRegime === 'float') {
    // تعويم حر: يمتص صدمات ميزان التجارة مباشرة في الاحتياطي بدل الدفاع الاصطناعي، لكنه يضخّم التضخم عند الضغط
    ind.forexReserves = Math.max(0, ind.forexReserves + ind.tradeBalance * 45);
    ind.inflation = clampIndicator('inflation', ind.inflation + Math.max(0, -ind.tradeBalance) * 0.05);
  }

  // نفاد الاحتياطي تحت نظام التثبيت تحديداً هو أزمة عملة كلاسيكية - عدّاد أشهر متتالية دون احتياطٍ كافٍ للدفاع
  if (!state.engineStreaks) state.engineStreaks = { austerity: 0, securityNeglect: 0, fxReserveCrisis: 0 };
  if (monetary.exchangeRegime === 'fixed' && ind.forexReserves < 8000) {
    state.engineStreaks.fxReserveCrisis = (state.engineStreaks.fxReserveCrisis || 0) + 1;
  } else {
    state.engineStreaks.fxReserveCrisis = 0;
  }
  if (state.engineStreaks.fxReserveCrisis === 3) {
    scheduleFollowUp(state, { id: 'currency_devaluation_crisis', kind: 'event', monthsFromNow: 1 });
  }

  // 6ب) آثار جانبية لمعدلات الضرائب الثلاثة تتجاوز الإيراد المباشر - معدل 20/8/15% هو الحياد المرجعي
  const corporateTaxDrag = (macro.corporateTaxRate - 20) / 100;
  ind.economicDevelopment = clampIndicator('economicDevelopment', ind.economicDevelopment - corporateTaxDrag * 0.3);
  ind.industryLevel = clampIndicator('industryLevel', ind.industryLevel - corporateTaxDrag * 0.2);
  const consumptionTaxBurden = Math.max(0, (macro.consumptionTaxRate - 8) / 100);
  ind.poverty = clampIndicator('poverty', ind.poverty + consumptionTaxBurden * 0.4);
  const tariffProtection = (macro.customsTariffRate - 15) / 100;
  ind.industryLevel = clampIndicator('industryLevel', ind.industryLevel + tariffProtection * 0.25);
  ind.inflation = clampIndicator('inflation', ind.inflation + Math.max(0, tariffProtection) * 0.3);

  // 7) احتياطي النقد الأجنبي والدين العام - وجهة إنتاج النفط (تصدير مقابل استخدام محلي) تُحدد كم من عوائده يتحول لاحتياطي أجنبي
  const oilExportMult = 0.08 + (sp.oil.orientation / 100) * 0.14;
  ind.forexReserves = Math.max(0, ind.forexReserves + oilRevenue * oilExportMult - (ind.publicDebt > 60 ? 500 : 0) + rnd(-500, 500));

  // دعم الوقود: تسرّب تهريب يتصاعد بشكل غير خطي مع اتساع الفجوة بين السعر المحلي المدعوم والعالمي
  const smugglingLeakage = estimateSmugglingLeakage(state);
  ind.forexReserves = Math.max(0, ind.forexReserves - smugglingLeakage);

  // صدمة خفض مفاجئ لدعم الوقود: خفض حاد في شهر واحد يضرب الرضا والاستقرار مباشرة - التخفيض التدريجي آمن
  // (تُحسب هنا وتُطبَّق لاحقاً بعد إعادة حساب الرضا والاستقرار في الخطوتين 9 و10، وإلا ابتلعها المتوسط المرجّح فوراً)
  if (macro._prevFuelSubsidy === undefined) macro._prevFuelSubsidy = macro.fuelSubsidyLevel;
  const fuelDrop = macro._prevFuelSubsidy - macro.fuelSubsidyLevel;
  const fuelShockMagnitude = fuelDrop > 15 ? (fuelDrop - 15) * 0.4 : 0;
  macro._prevFuelSubsidy = macro.fuelSubsidyLevel;

  // استراتيجية تمويل العجز: داخلي (تضخمي أكثر) / خارجي (دين أسرع نمواً لكنه يدعم الاحتياطي ويقرّب من صندوق النقد) / تقشف (يؤلم الرضا لكن يبقي الدين منضبطاً)
  let austerityPenalty = 0;
  if (monthlyBalance < 0) {
    const deficitRatio = Math.abs(monthlyBalance) / Math.max(totalRevenue, 1);
    if (macro.debtStrategy === 'external') {
      ind.publicDebt = clampIndicator('publicDebt', ind.publicDebt + deficitRatio * 3);
      ind.forexReserves = Math.max(0, ind.forexReserves + deficitRatio * 400);
      const imf = state.relations.orgs.find(o => o.id === 'imf');
      if (imf) imf.relation = Math.max(0, Math.min(100, imf.relation + 0.3));
    } else if (macro.debtStrategy === 'austerity') {
      ind.publicDebt = clampIndicator('publicDebt', ind.publicDebt + deficitRatio * 0.8);
      austerityPenalty = deficitRatio * 3;
    } else if (macro.debtStrategy === 'printing') {
      // طباعة نقدية لتمويل العجز: يتجنب أي دين جديد كلياً، لكنه تضخمي بشدة ويضعف ثقة السوق بالعملة مباشرة
      ind.inflation = clampIndicator('inflation', ind.inflation + deficitRatio * 4);
      ind.forexReserves = Math.max(0, ind.forexReserves - deficitRatio * 250);
    } else {
      ind.publicDebt = clampIndicator('publicDebt', ind.publicDebt + deficitRatio * 2.2);
      ind.inflation = clampIndicator('inflation', ind.inflation + deficitRatio * 1.5);
    }
  } else {
    ind.publicDebt = clampIndicator('publicDebt', ind.publicDebt - 0.1);
  }

  // 7ب) عدّادات الأشهر المتتالية التي تغذّي سلاسل الأزمات - تصاعد الضغط المتكرر يُنتج تصعيداً سردياً حقيقياً لا مجرد أرقام تتآكل بصمت
  if (!state.engineStreaks) state.engineStreaks = { austerity: 0, securityNeglect: 0 };
  if (macro.debtStrategy === 'austerity' && monthlyBalance < 0) {
    state.engineStreaks.austerity++;
  } else {
    state.engineStreaks.austerity = 0;
  }
  if (state.engineStreaks.austerity === 3) {
    scheduleFollowUp(state, { id: 'austerity_protests', kind: 'event', monthsFromNow: 1 });
  }
  if (ind.security < 40) {
    state.engineStreaks.securityNeglect++;
  } else {
    state.engineStreaks.securityNeglect = 0;
  }
  if (state.engineStreaks.securityNeglect === 4) {
    scheduleFollowUp(state, { id: 'regional_security_crisis', kind: 'event', monthsFromNow: 1 });
  }

  // 8) الفقر يتأثر بالبطالة والتضخم ودعم السلع، وباكتفاء القطاع الزراعي ذاتياً بدل التصدير، ودعم الوقود يخفف عبء الفقراء مباشرة
  const agriSelfSufficiency = 1 - sp.agriculture.orientation / 100;
  ind.poverty = clampIndicator('poverty', ind.poverty + (ind.unemployment - 20) * 0.02 + (ind.inflation - 6) * 0.03 - subsidyPressure * -0.1 - agriSelfSufficiency * 0.12 - (macro.fuelSubsidyLevel / 100) * 0.15);

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

  // تُطبَّق صدمة خفض دعم الوقود وعقوبة التقشف هنا - بعد إعادة حساب الرضا والاستقرار، لا قبلها، وإلا ابتلعهما المتوسط المرجّح
  if (fuelShockMagnitude > 0) {
    ind.satisfaction = clampIndicator('satisfaction', ind.satisfaction - fuelShockMagnitude);
    ind.politicalStability = clampIndicator('politicalStability', ind.politicalStability - fuelShockMagnitude * 0.6);
  }
  if (austerityPenalty > 0) {
    ind.satisfaction = clampIndicator('satisfaction', ind.satisfaction - austerityPenalty);
  }

  // 11) الأمن يتراجع قليلاً بشكل طبيعي دون صيانة (entropy)
  ind.security = clampIndicator('security', ind.security - 0.15);
  ind.infrastructureLevel = clampIndicator('infrastructureLevel', ind.infrastructureLevel - 0.1);

  // 12) القطاعات غير النفطية (زراعة/سياحة/صناعة) - روابط متبادلة حقيقية مع بقية الاقتصاد، لا انجراف معزول
  // الزراعة: تستفيد من شبكات الري وطرق النقل (البنية التحتية)
  ind.agricultureLevel = clampIndicator('agricultureLevel', ind.agricultureLevel + (ind.infrastructureLevel - 50) / 500 - 0.1);
  // السياحة: الأمن شرط مسبق فعلي لا مجرد وزن - انهياره دون مستوى حرج يُنهي النمو مهما بلغ الاستثمار
  const tourismSecurityGate = ind.security < 40 ? -0.8 : (ind.security - 50) / 300;
  ind.tourismLevel = clampIndicator('tourismLevel', ind.tourismLevel + tourismSecurityGate - 0.1);
  // الصناعة: تستفيد من التنمية الاقتصادية العامة، ومن تعليم يرفع جودة اليد العاملة، ومن نفط رخيص كمادة خام بتروكيماوية
  const industryFeedstockBonus = (ind.oilProduction - 800) / 6000;
  const industryEduBonus = (ind.educationLevel - 50) / 600;
  ind.industryLevel = clampIndicator('industryLevel', ind.industryLevel + (ind.economicDevelopment - 50) / 500 + industryFeedstockBonus + industryEduBonus - 0.1);

  const nonOilDiversification = (ind.agricultureLevel + ind.tourismLevel + ind.industryLevel) / 3;
  ind.economicDevelopment = clampIndicator('economicDevelopment', ind.economicDevelopment + (nonOilDiversification - 50) / 800);
  // ميزان التجارة: تُضاف إليه وجهة الإنتاج المتوسطة (تصدير مقابل سوق محلي) عبر النفط والزراعة والصناعة، وخطر انتقام تجاري من تعرفة جمركية مرتفعة
  const exportOrientationAvg = (sp.oil.orientation + sp.agriculture.orientation + sp.industry.orientation) / 3;
  ind.tradeBalance = clampIndicator('tradeBalance', ind.tradeBalance * 0.9 + ((oilPriceFactor - 1) * 15 + (nonOilDiversification - 40) / 4 + (exportOrientationAvg - 50) / 8 - Math.max(0, tariffProtection) * 3) * 0.1 + rnd(-0.5, 0.5));

  // 13) شفافية سببية: لماذا تغيّرت الأرقام هذا الشهر - من بيانات محسوبة أصلاً أعلاه، لا حسابات إضافية موازية
  // قد تتباين نتائجها عن التقرير المعروض لاحقاً بشهر بسبب الآثار المؤجلة (scheduleEffects) - وهذا مقصود، فهي تشرح دورة الاقتصاد الكلي تحديداً لا كل مصدر تغيير في اللعبة
  const attributions = [];
  if (Math.abs(oilPriceFactor - 1) > 0.05) {
    attributions.push({
      label: oilPriceFactor > 1
        ? `ارتفاع سعر النفط العالمي إلى ${Math.round(eco.oilPrice)}$ رفع الإيرادات النفطية`
        : `تراجع سعر النفط العالمي إلى ${Math.round(eco.oilPrice)}$ خفض الإيرادات النفطية`,
      impact: Math.abs(oilPriceFactor - 1) * oilRevenue + 1
    });
  }
  if (eco.worldCycle !== 'normal') {
    attributions.push({ label: `الاقتصاد العالمي في مرحلة "${cycle.label}" تنعكس على النمو وسعر النفط`, impact: 35 });
  }
  if (sov && sov.oilBlockade && sov.oilBlockade.active) {
    attributions.push({ label: `حصار نفطي من قوات ${sov.rivalAuthorityName} يشلّ معظم الصادرات (يتبقى ${sov.oilBlockade.monthsLeft} شهراً)`, impact: 90 });
  }
  if (sov && (sov.centralBankSplit || sov.nocSplit) && !(sov.oilBlockade && sov.oilBlockade.active)) {
    attributions.push({ label: 'انقسام المصرف المركزي وشركة النفط يؤخر جزءاً من العائد النفطي الفعلي', impact: 25 });
  }
  if (sov && Math.round(sov.territoryControl) % 10 === 0 && sov.territoryControl >= 85) {
    attributions.push({ label: `سيطرتك الفعلية على البلاد بلغت ${Math.round(sov.territoryControl)}% - اقتراب حقيقي من إعادة التوحيد`, impact: 20 });
  }
  if (monetary.exchangeRegime === 'fixed' && state.engineStreaks.fxReserveCrisis >= 2) {
    attributions.push({ label: 'الدفاع عن سعر الصرف المثبَّت يستنزف الاحتياطي الأجنبي بسرعة', impact: 45 });
  }
  if (macro.debtStrategy === 'printing' && monthlyBalance < 0) {
    attributions.push({ label: 'تمويل العجز بالطباعة النقدية غذّى التضخم بقوة هذا الشهر', impact: 50 });
  }
  if (Math.abs(rateDeviation) >= 3) {
    attributions.push({
      label: rateDeviation > 0
        ? `رفع سعر الفائدة إلى ${monetary.interestRate}% كبح التضخم لكنه أبطأ النمو`
        : `خفض سعر الفائدة إلى ${monetary.interestRate}% حفّز النمو لكنه غذّى التضخم`,
      impact: Math.abs(rateDeviation) * 8
    });
  }
  if (fuelShockMagnitude > 0) {
    attributions.push({ label: 'صدمة خفض دعم الوقود المفاجئ ضربت الرضا والاستقرار السياسي', impact: fuelShockMagnitude * 40 });
  }
  if (austerityPenalty > 0) {
    attributions.push({ label: 'استمرار التقشف مع عجز الموازنة أضرّ برضا الشعب', impact: austerityPenalty * 40 });
  }
  if (smugglingLeakage > 50) {
    attributions.push({ label: 'تهريب الوقود المدعوم استنزف الاحتياطي الأجنبي', impact: smugglingLeakage });
  }
  if (monthlyBalance < 0) {
    attributions.push({ label: `عجز في الموازنة الشهرية بلغ ${Math.round(Math.abs(monthlyBalance))} مليون د.ل`, impact: Math.abs(monthlyBalance) });
  } else {
    attributions.push({ label: `فائض في الموازنة الشهرية بلغ ${Math.round(monthlyBalance)} مليون د.ل عزز الخزينة`, impact: monthlyBalance * 0.6 });
  }
  if (ind.security < 40) {
    attributions.push({ label: 'انهيار الأمن دون الحد الحرج أوقف نمو القطاع السياحي فعلياً', impact: 25 });
  }
  attributions.sort((a, b) => b.impact - a.impact);
  const topAttributions = attributions.slice(0, 3).map(a => a.label);

  return { oilRevenue, taxRevenue, agricultureRevenue, tourismRevenue, industryRevenue, sectorRevenue, fuelSubsidyCost, totalRevenue, totalExpenditure, monthlyBalance, attributions: topAttributions };
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

// جدولة سلسلة أزمة: قرار أو حدث معين يصبح مُلزَماً/مرجَّحاً بقوة بعد عدد أشهر محدد -
// تُستهلك من getAvailableDecisions/rollEvent عبر state.pendingFollowUps. يتجنب التكرار إن كانت نفس السلسلة مجدولة أصلاً
function scheduleFollowUp(state, opts) {
  if (!state.pendingFollowUps) state.pendingFollowUps = [];
  const already = state.pendingFollowUps.some(f => f.id === opts.id && f.kind === opts.kind);
  if (already) return;
  state.pendingFollowUps.push({ id: opts.id, kind: opts.kind, dueMonth: state.month + opts.monthsFromNow });
}

function processScheduledEffects(state) {
  const due = state.scheduledEffects.filter(e => e.applyAtMonth <= state.month);
  due.forEach(e => applyEffects(state, e.effects));
  state.scheduledEffects = state.scheduledEffects.filter(e => e.applyAtMonth > state.month);
}
