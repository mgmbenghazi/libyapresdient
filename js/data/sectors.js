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
  { id: 'west', name: 'طرابلس والغرب' },
  { id: 'east', name: 'بنغازي والشرق' },
  { id: 'south', name: 'فزان والجنوب' }
];

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

function indicatorColor(key, value) {
  const meta = INDICATOR_META[key];
  if (!meta || meta.max === Infinity || meta.min === -Infinity) {
    return value >= 0 ? 'good' : 'bad';
  }
  const pct = (value - meta.min) / (meta.max - meta.min);
  const norm = meta.good === 'low' ? 1 - pct : pct;
  if (norm >= 0.6) return 'good';
  if (norm >= 0.35) return 'medium';
  return 'bad';
}
