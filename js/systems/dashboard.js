// منطق مركز القيادة: تنبيهات "يتطلب الانتباه"، مؤشر الحوكمة الحي، وطبقات الخريطة
const ALL_DASHBOARD_KEYS = INDICATOR_DOMAINS.flatMap(d => d.keys);

// أسوأ عدد محدد من المؤشرات فقط - وليس كل المؤشرات - هذا هو الفارق بين "عرض بيانات" و"مركز إدارة"
// يمتد أيضاً لأسوأ كيانات العلاقات (قبيلة/حزب/مؤسسة/دولة/منظمة) لا الـ21 مؤشراً الوطنية فقط -
// إهمال قبيلة كاملة حتى الانهيار كان يمر بصمت قبل هذا التمديد
function getAttentionAlerts(state, limit) {
  const ind = state.indicators;
  const hist = state.history;
  const prev = hist.length > 1 ? hist[hist.length - 2] : hist[hist.length - 1];

  const indicatorAlerts = ALL_DASHBOARD_KEYS.map(key => {
    const score = normalizedIndicatorScore(key, ind[key]);
    const delta = prev ? ind[key] - prev[key] : 0;
    return { kind: 'indicator', key, name: INDICATOR_META[key].name, score, value: ind[key], delta, severity: score < 30 ? 'crit' : 'warn' };
  }).filter(a => a.score < 45);

  const relationsAlerts = [];
  Object.entries(RELATIONS_KIND_META).forEach(([relKind, meta]) => {
    state.relations[meta.list].forEach(entity => {
      const value = entity[meta.valueKey];
      if (value < 45) {
        relationsAlerts.push({ kind: 'relations', relKind, relId: entity.id, name: entity.name, score: value, value, delta: 0, severity: value < 30 ? 'crit' : 'warn' });
      }
    });
  });

  // تنبيهات السياسة الاقتصادية الكلية: دعم وقود يستنزف الخزينة، أو معدل ضريبي متطرف يُبطئ الصناعة
  const macroAlerts = [];
  const revenue = estimateMonthlyRevenue(state);
  const fuelCostRatio = revenue.fuelSubsidyCost / Math.max(revenue.totalRevenue, 1);
  if (fuelCostRatio > 0.015) {
    const score = Math.max(0, 45 - fuelCostRatio * 1500);
    macroAlerts.push({ kind: 'macro', name: 'دعم الوقود يستنزف الخزينة', score, value: fuelCostRatio * 100, delta: 0, severity: score < 30 ? 'crit' : 'warn' });
  }
  const macro = state.macroPolicy;
  if (macro.corporateTaxRate > 38) {
    const score = Math.max(0, 45 - (macro.corporateTaxRate - 20));
    macroAlerts.push({ kind: 'macro', name: 'ضريبة شركات متطرفة تُبطئ الصناعة', score, value: macro.corporateTaxRate, delta: 0, severity: score < 30 ? 'crit' : 'warn' });
  }

  const alerts = [...indicatorAlerts, ...relationsAlerts, ...macroAlerts];
  alerts.sort((a, b) => a.score - b.score);
  return alerts.slice(0, limit);
}

function getGovernanceVerdict(score) {
  if (score >= 80) return { label: 'حكم ممتاز', status: 'good' };
  if (score >= 65) return { label: 'حكم بنّاء', status: 'good' };
  if (score >= 50) return { label: 'مستقر نسبياً', status: 'medium' };
  if (score >= 35) return { label: 'في تراجع', status: 'medium' };
  return { label: 'في خطر حقيقي', status: 'bad' };
}

// أي قطاع إنتاجي يُنمّي أي إقليم أكثر - الزراعة تُنمّي الجنوب (واحات فزان)، النفط الشرق (الهلال النفطي)،
// السياحة والصناعة الغرب (طرابلس ومصراتة) أكثر من غيرها. يُستخدم في طبقة "التنمية" بالخريطة التفاعلية
const REGION_SECTOR_WEIGHTS = {
  west: { oil: 0.9, agriculture: 0.6, tourism: 1.0, industry: 1.1 },
  east: { oil: 1.2, agriculture: 0.5, tourism: 0.9, industry: 0.7 },
  south: { oil: 0.5, agriculture: 1.3, tourism: 0.6, industry: 0.3 }
};

// قيمة "الطبقة" المعروضة على الخريطة لكل منطقة - الولاء مُقاس مباشرة، والأمن/التنمية تقديريان
// (لا تتبع اللعبة بيانات أمن/تنمية منفصلة لكل منطقة، فتُشتق من المؤشر الوطني مع تفاوت إقليمي معقول)
function regionLayerValue(state, regionId, layer) {
  const region = REGIONS.find(r => r.id === regionId);
  const loyalty = regionAverageLoyalty(state, regionId);
  if (layer === 'security') {
    return Math.max(0, Math.min(100, state.indicators.security * 0.65 + loyalty * 0.35));
  }
  if (layer === 'development') {
    const w = REGION_SECTOR_WEIGHTS[regionId] || { oil: 1, agriculture: 1, tourism: 1, industry: 1 };
    const oilScore = normalizedIndicatorScore('oilProduction', state.indicators.oilProduction);
    const sectorMix = (
      oilScore * w.oil + state.indicators.agricultureLevel * w.agriculture +
      state.indicators.tourismLevel * w.tourism + state.indicators.industryLevel * w.industry
    ) / (w.oil + w.agriculture + w.tourism + w.industry);
    const base = ((state.indicators.infrastructureLevel + state.indicators.economicDevelopment) / 2) * 0.5 + sectorMix * 0.5;
    return Math.max(0, Math.min(100, base * (region.developmentWeight || 1)));
  }
  return loyalty; // 'loyalty' الافتراضي
}
