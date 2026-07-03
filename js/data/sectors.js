// تعريف القطاعات والمؤشرات الأساسية
const SECTORS = [
  { id: 'education', name: 'التعليم', icon: '🎓' },
  { id: 'health', name: 'الصحة', icon: '🏥' },
  { id: 'security', name: 'الأمن', icon: '🛡️' },
  { id: 'infrastructure', name: 'البنية التحتية', icon: '🏗️' },
  { id: 'subsidies', name: 'الدعم', icon: '🛒' },
  { id: 'salaries', name: 'الرواتب', icon: '💼' },
  { id: 'debtService', name: 'خدمة الديون', icon: '🏦' },
  { id: 'economicDev', name: 'التنمية الاقتصادية', icon: '📈' }
];

const REGIONS = [
  { id: 'west', name: 'طرابلس والغرب', developmentWeight: 1.1 },
  { id: 'east', name: 'بنغازي والشرق', developmentWeight: 1.0 },
  { id: 'south', name: 'فزان والجنوب', developmentWeight: 0.8 }
];

// تجميع المؤشرات الـ21 إلى خمسة مجالات لعرضها في مركز القيادة بدل شبكة مسطحة موحدة
const INDICATOR_DOMAINS = [
  { id: 'macro', name: 'الاقتصاد الكلي', icon: '📈', keys: ['gdpGrowth', 'inflation', 'budgetBalance', 'publicDebt', 'treasury', 'forexReserves', 'economicDevelopment', 'unemployment'] },
  { id: 'sectors', name: 'القطاعات الإنتاجية', icon: '🛢️', keys: ['oilProduction', 'agricultureLevel', 'tourismLevel', 'industryLevel'] },
  { id: 'society', name: 'المجتمع والخدمات', icon: '🏛️', keys: ['satisfaction', 'poverty', 'educationLevel', 'healthLevel', 'infrastructureLevel'] },
  { id: 'security', name: 'الأمن والاستقرار', icon: '🛡️', keys: ['security', 'politicalStability'] },
  { id: 'international', name: 'المكانة الدولية', icon: '🌍', keys: ['internationalSupport', 'tradeBalance'] }
];

// وصف واجهة القطاعات الإنتاجية الأربعة القابلة للتحكم الكامل: كل قطاع يُدار بثلاثة أذرع دائمة -
// استثمار (سطر ميزانية حقيقي ضمن budget.allocations)، نموذج ملكية (state/partnership/privatized)، وتوجّه إنتاج (0 محلي - 100 تصدير/انفتاح)
const PRODUCTIVE_SECTOR_META = {
  oil: {
    name: 'النفط والغاز', icon: '🛢️', indicatorKey: 'oilProduction', budgetKey: 'oilSector', revenueKey: 'oilRevenue',
    ownershipLabels: { state: 'حكومي بالكامل', partnership: 'شراكة مع شركات أجنبية', privatized: 'خصخصة' },
    orientationLabel: 'وجهة الإنتاج', orientationLow: 'استخدام محلي', orientationHigh: 'تصدير'
  },
  agriculture: {
    name: 'الزراعة', icon: '🌾', indicatorKey: 'agricultureLevel', budgetKey: 'agricultureSector', revenueKey: 'agricultureRevenue',
    ownershipLabels: { state: 'إدارة حكومية', partnership: 'تعاونيات مدعومة', privatized: 'مزارع خاصة كبرى' },
    orientationLabel: 'توجّه الإنتاج', orientationLow: 'اكتفاء ذاتي', orientationHigh: 'محاصيل تصديرية'
  },
  tourism: {
    name: 'السياحة', icon: '🏖️', indicatorKey: 'tourismLevel', budgetKey: 'tourismSector', revenueKey: 'tourismRevenue',
    ownershipLabels: { state: 'حكومي', partnership: 'شراكة قطاع خاص محلي', privatized: 'منتجعات أجنبية' },
    orientationLabel: 'سياسة الانفتاح', orientationLow: 'مقيّدة', orientationHigh: 'منفتحة'
  },
  industry: {
    name: 'الصناعة', icon: '🏭', indicatorKey: 'industryLevel', budgetKey: 'industrySector', revenueKey: 'industryRevenue',
    ownershipLabels: { state: 'حكومي', partnership: 'شراكة مختلطة', privatized: 'خصخصة كاملة' },
    orientationLabel: 'توجّه الإنتاج', orientationLow: 'إحلال الواردات', orientationHigh: 'تصنيع تصديري'
  }
};

// أثر نموذج الملكية على كل قطاع: حصة الدولة من عوائده مباشرة، ومضاعف سرعة نموه
// (حكومي: كل العائد للدولة لكن بطء بيروقراطي؛ شراكة: أسرع نمو بفضل الخبرة والرأسمال لكن حصة أقل؛ خصخصة: نمو جيد لكن عائد شبه ضريبي فقط)
const OWNERSHIP_PROFILES = {
  state: { revenueShare: 1.0, growthMult: 0.75 },
  partnership: { revenueShare: 0.65, growthMult: 1.3 },
  privatized: { revenueShare: 0.2, growthMult: 1.15 }
};

// الحدود الدنيا/القصوى الافتراضية للمؤشرات (0-100 إلا ما استثني)
const INDICATOR_META = {
  satisfaction: { name: 'رضا الشعب', unit: '%', min: 0, max: 100, good: 'high' },
  budgetBalance: { name: 'ميزان الميزانية', unit: '% من الناتج', min: -100, max: 100, good: 'high' },
  treasury: { name: 'الخزينة العامة', unit: 'مليون د.ل', min: -Infinity, max: Infinity, good: 'high' },
  gdpGrowth: { name: 'النمو الاقتصادي', unit: '%', min: -20, max: 20, good: 'high' },
  unemployment: { name: 'البطالة', unit: '%', min: 0, max: 100, good: 'low' },
  inflation: { name: 'التضخم', unit: '%', min: -10, max: 100, good: 'low' },
  forexReserves: { name: 'احتياطي النقد الأجنبي', unit: 'مليون $', min: 0, max: Infinity, good: 'high' },
  publicDebt: { name: 'الدين العام', unit: '% من الناتج', min: 0, max: 200, good: 'low' },
  poverty: { name: 'مستوى الفقر', unit: '%', min: 0, max: 100, good: 'low' },
  politicalStability: { name: 'الاستقرار السياسي', unit: '%', min: 0, max: 100, good: 'high' },
  internationalSupport: { name: 'الدعم الدولي', unit: '%', min: 0, max: 100, good: 'high' },
  oilProduction: { name: 'إنتاج النفط', unit: 'ألف برميل/يوم', min: 0, max: 3000, good: 'high' },
  educationLevel: { name: 'مستوى التعليم', unit: '%', min: 0, max: 100, good: 'high' },
  healthLevel: { name: 'مستوى الصحة', unit: '%', min: 0, max: 100, good: 'high' },
  infrastructureLevel: { name: 'البنية التحتية', unit: '%', min: 0, max: 100, good: 'high' },
  security: { name: 'الأمن', unit: '%', min: 0, max: 100, good: 'high' },
  economicDevelopment: { name: 'التنمية الاقتصادية', unit: '%', min: 0, max: 100, good: 'high' },
  agricultureLevel: { name: 'القطاع الزراعي', unit: '%', min: 0, max: 100, good: 'high' },
  tourismLevel: { name: 'القطاع السياحي', unit: '%', min: 0, max: 100, good: 'high' },
  industryLevel: { name: 'القطاع الصناعي', unit: '%', min: 0, max: 100, good: 'high' },
  tradeBalance: { name: 'الميزان التجاري', unit: '% من الناتج', min: -50, max: 50, good: 'high' }
};

// إنجازات اللعبة
const ACHIEVEMENTS = [
  { id: 'debt_free', name: 'اقتصاد بلا ديون', desc: 'خفضت الدين العام إلى أقل من 10% من الناتج.', check: s => s.indicators.publicDebt < 10 },
  { id: 'full_employment', name: 'التشغيل الكامل', desc: 'خفضت البطالة إلى أقل من 8%.', check: s => s.indicators.unemployment < 8 },
  { id: 'beloved_leader', name: 'الزعيم المحبوب', desc: 'حافظت على رضا شعبي فوق 80%.', check: s => s.indicators.satisfaction > 80 },
  { id: 'diversified_economy', name: 'اقتصاد متنوع', desc: 'رفعت الزراعة والسياحة والصناعة جميعها فوق 60%.', check: s => s.indicators.agricultureLevel > 60 && s.indicators.tourismLevel > 60 && s.indicators.industryLevel > 60 },
  { id: 'oil_giant', name: 'عملاق النفط', desc: 'رفعت إنتاج النفط فوق 1800 ألف برميل/يوم.', check: s => s.indicators.oilProduction > 1800 },
  { id: 'diplomatic_master', name: 'سيد الدبلوماسية', desc: 'حققت دعماً دولياً فوق 80%.', check: s => s.indicators.internationalSupport > 80 },
  { id: 'iron_fist_security', name: 'قبضة أمنية', desc: 'حققت مستوى أمن فوق 90%.', check: s => s.indicators.security > 90 },
  { id: 'poverty_eradicated', name: 'القضاء على الفقر', desc: 'خفضت مستوى الفقر إلى أقل من 5%.', check: s => s.indicators.poverty < 5 },
  { id: 'trade_surplus', name: 'فائض تجاري', desc: 'حققت ميزاناً تجارياً موجباً فوق 10%.', check: s => s.indicators.tradeBalance > 10 },
  { id: 'survivor', name: 'الناجي', desc: 'أكملت فترة رئاسية كاملة رغم كل الأزمات.', check: s => s.month >= 48 }
];

function clampIndicator(key, value) {
  const meta = INDICATOR_META[key];
  if (!meta) return value;
  return Math.max(meta.min, Math.min(meta.max, value));
}

// يُرجع تقييماً موحداً 0-100 (100 = الأفضل دوماً، بصرف النظر عن كون "الأقل أفضل" أصلاً) -
// مصدر واحد يُستخدم لتلوين البطاقات، ولحساب نقاط المجالات المركّبة، ولتحديد تنبيهات "يتطلب الانتباه"
function normalizedIndicatorScore(key, value) {
  const meta = INDICATOR_META[key];
  if (!meta) return 50;
  if (meta.max === Infinity || meta.min === -Infinity) {
    // مؤشرات بلا سقف طبيعي (الخزينة، الاحتياطي) - تُقيَّم بمقياس تقريبي حول نقطة محايدة معقولة
    if (key === 'treasury') return Math.max(0, Math.min(100, 50 + value / 500));
    if (key === 'forexReserves') return Math.max(0, Math.min(100, value / 1400));
    return value >= 0 ? 70 : 30;
  }
  const pct = (value - meta.min) / (meta.max - meta.min) * 100;
  const norm = meta.good === 'low' ? 100 - pct : pct;
  return Math.max(0, Math.min(100, norm));
}

function indicatorColor(key, value) {
  const norm = normalizedIndicatorScore(key, value);
  if (norm >= 60) return 'good';
  if (norm >= 35) return 'medium';
  return 'bad';
}

function domainScore(state, domain) {
  const scores = domain.keys.map(k => normalizedIndicatorScore(k, state.indicators[k]));
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function domainStatus(score) {
  if (score >= 60) return 'good';
  if (score >= 40) return 'medium';
  return 'bad';
}
