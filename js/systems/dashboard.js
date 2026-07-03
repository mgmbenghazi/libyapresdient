// منطق مركز القيادة: تنبيهات "يتطلب الانتباه"، مؤشر الحوكمة الحي، وطبقات الخريطة
const ALL_DASHBOARD_KEYS = INDICATOR_DOMAINS.flatMap(d => d.keys);

// أسوأ عدد محدد من المؤشرات فقط - وليس كل المؤشرات - هذا هو الفارق بين "عرض بيانات" و"مركز إدارة"
function getAttentionAlerts(state, limit) {
  const ind = state.indicators;
  const hist = state.history;
  const prev = hist.length > 1 ? hist[hist.length - 2] : hist[hist.length - 1];

  const alerts = ALL_DASHBOARD_KEYS.map(key => {
    const score = normalizedIndicatorScore(key, ind[key]);
    const delta = prev ? ind[key] - prev[key] : 0;
    return { key, score, value: ind[key], delta, severity: score < 30 ? 'crit' : 'warn' };
  }).filter(a => a.score < 45);

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

// قيمة "الطبقة" المعروضة على الخريطة لكل منطقة - الولاء مُقاس مباشرة، والأمن/التنمية تقديريان
// (لا تتبع اللعبة بيانات أمن/تنمية منفصلة لكل منطقة، فتُشتق من المؤشر الوطني مع تفاوت إقليمي معقول)
function regionLayerValue(state, regionId, layer) {
  const region = REGIONS.find(r => r.id === regionId);
  const loyalty = regionAverageLoyalty(state, regionId);
  if (layer === 'security') {
    return Math.max(0, Math.min(100, state.indicators.security * 0.65 + loyalty * 0.35));
  }
  if (layer === 'development') {
    const base = (state.indicators.infrastructureLevel + state.indicators.economicDevelopment) / 2;
    return Math.max(0, Math.min(100, base * (region.developmentWeight || 1)));
  }
  return loyalty; // 'loyalty' الافتراضي
}
