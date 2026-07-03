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
  economicDevelopment: { name: 'التنمية الاقتصادية', unit: '%', min: 0, max: 100, good: 'high' }
};

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
