// طبقة العرض - دوال بناء الواجهة من حالة اللعبة
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  target.classList.add('active');
  target.classList.remove('screen-enter');
  // إعادة تشغيل الرسم المتحرك للدخول في كل مرة تُعرض فيها الشاشة
  void target.offsetWidth;
  target.classList.add('screen-enter');
}

function fmtNum(n, decimals) {
  if (n === undefined || n === null || isNaN(n)) return '-';
  const d = decimals === undefined ? 1 : decimals;
  return Number(n).toLocaleString('ar-LY', { maximumFractionDigits: d, minimumFractionDigits: 0 });
}

function renderScenarioList() {
  const wrap = document.getElementById('scenario-list');
  wrap.innerHTML = '';
  SCENARIOS.forEach(sc => {
    const card = document.createElement('div');
    card.className = 'option-card';
    card.dataset.id = sc.id;
    card.innerHTML = `<h3>${sc.name}</h3><p>${sc.description}</p><span class="tag">الصعوبة: ${sc.difficulty}</span>`;
    card.addEventListener('click', () => {
      wrap.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      Game.selectedScenario = sc.id;
      showScreen('screen-character');
      renderBackgroundList();
    });
    wrap.appendChild(card);
  });
}

function renderBackgroundList() {
  const wrap = document.getElementById('background-list');
  wrap.innerHTML = '';
  POLITICAL_BACKGROUNDS.forEach(b => {
    const card = document.createElement('div');
    card.className = 'option-card';
    card.innerHTML = `<h3>${b.name}</h3><p>${b.desc}</p>`;
    card.addEventListener('click', () => {
      wrap.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      Game.selectedBackground = b.id;
    });
    wrap.appendChild(card);
  });
}

function renderIntro() {
  const sc = SCENARIOS.find(s => s.id === Game.selectedScenario);
  document.getElementById('intro-title').textContent = `تهانينا يا سيادة الرئيس ${Game.state.presidentName}`;
  document.getElementById('intro-text').textContent =
    `توليت اليوم رئاسة ليبيا في ظل سيناريو "${sc.name}".\n${sc.description}\n${sc.startTreasuryNote}\n\nأمامك أربع سنوات (48 شهراً) لإدارة شؤون البلاد، موازناً بين الاقتصاد والأمن ورضا الشعب والعلاقات الدولية.\nستُعرض عليك تقارير شهرية وقرارات وأحداث عليك التعامل معها بحكمة. حظاً موفقاً.`;
}

function renderHUD() {
  const s = Game.state;
  document.getElementById('hud-president').textContent = `الرئيس ${s.presidentName}`;
  document.getElementById('hud-date').textContent = `السنة ${s.year} - الشهر ${((s.month - 1) % 12) + 1} من ${s.month}/48`;
}

function animateNumber(el, from, to, duration) {
  const start = performance.now();
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const current = from + (to - from) * eased;
    el.textContent = Math.round(current);
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ------- شريط القيادة -------
function renderCommandBar() {
  const s = Game.state;
  const scenario = SCENARIOS.find(sc => sc.id === s.scenarioId);
  const background = POLITICAL_BACKGROUNDS.find(b => b.id === s.backgroundId);
  document.getElementById('cmd-president-name').textContent = `الرئيس ${s.presidentName}`;
  document.getElementById('cmd-president-title').textContent =
    `${scenario ? scenario.name : ''}${background ? ' · خلفية ' + background.name : ''}`;
  const monthInYear = ((s.month - 1) % 12) + 1;
  document.getElementById('cmd-term-label').textContent = `السنة ${s.year} — الشهر ${monthInYear} من ${s.month}/48`;
  document.getElementById('cmd-term-fill').style.width = Math.min(100, (s.month / 48) * 100) + '%';

  const score = computeFinalScore(s);
  const verdict = getGovernanceVerdict(score);
  const gaugeNumEl = document.getElementById('cmd-gauge-num');
  const prevScore = Game.prevGovernanceScore !== undefined ? Game.prevGovernanceScore : score;
  if (Math.abs(score - prevScore) > 0.5) animateNumber(gaugeNumEl, prevScore, score, 700);
  else gaugeNumEl.textContent = Math.round(score);
  Game.prevGovernanceScore = score;

  const gaugeEl = document.getElementById('cmd-gauge');
  const statusColorVar = verdict.status === 'good' ? 'var(--good)' : verdict.status === 'medium' ? 'var(--medium)' : 'var(--bad)';
  gaugeEl.style.background = `conic-gradient(${statusColorVar} calc(${score} * 1%), rgba(128,128,128,.18) 0)`;
  const gaugeLabelEl = document.getElementById('cmd-gauge-label');
  gaugeLabelEl.textContent = `مؤشر الحوكمة — ${verdict.label}`;
  gaugeLabelEl.className = `gauge-label ${verdict.status}`;
}

// ------- شريط "يتطلب انتباهك الآن" -------
function renderAttentionStrip() {
  const s = Game.state;
  const alerts = getAttentionAlerts(s, 4);
  const section = document.getElementById('attention-section');
  const wrap = document.getElementById('attention-strip');
  const countBadge = document.getElementById('cmd-alerts-count');

  countBadge.style.display = alerts.length ? '' : 'none';
  countBadge.textContent = alerts.length;
  section.style.display = alerts.length ? '' : 'none';
  if (!alerts.length) return;

  wrap.innerHTML = alerts.map(a => {
    if (a.kind === 'indicator') {
      const meta = INDICATOR_META[a.key];
      const sign = a.delta > 0 ? '+' : '';
      return `<div class="alert-chip ${a.severity}" data-kind="indicator" data-key="${a.key}">
        <span class="alert-dot"></span> ${meta.name}: ${fmtNum(a.value)}${meta.unit === '%' ? '%' : ''}
        <span class="ac-delta">(${sign}${fmtNum(a.delta)})</span>
      </div>`;
    }
    if (a.kind === 'relations') {
      return `<div class="alert-chip ${a.severity}" data-kind="relations" data-rel-kind="${a.relKind}" data-rel-id="${a.relId}">
        <span class="alert-dot"></span> ${a.name}: ${fmtNum(a.value)}%
      </div>`;
    }
    return `<div class="alert-chip ${a.severity}" data-kind="macro">
      <span class="alert-dot"></span> ${a.name}
    </div>`;
  }).join('');
  wrap.querySelectorAll('.alert-chip').forEach(el => {
    el.addEventListener('click', () => {
      if (el.dataset.kind === 'indicator') openIndicatorDetailModal(el.dataset.key);
      else if (el.dataset.kind === 'relations') openRelationsEntityModal(el.dataset.relKind, el.dataset.relId);
      else goToMacroPolicyTab();
    });
  });
}

// ينتقل من أي مكان في اللعبة إلى تبويب "الاقتصاد ← السياسة الاقتصادية" مباشرة
function goToMacroPolicyTab() {
  const economyTabBtn = document.querySelector('.tab-btn[data-tab="economy"]');
  if (economyTabBtn) economyTabBtn.click();
  const macroSubtabBtn = document.querySelector('.subtab-btn[data-subtab="macro"]');
  if (macroSubtabBtn) macroSubtabBtn.click();
}

// ------- عناقيد المجالات -------
function sparklineColor(key) {
  const status = indicatorColor(key, Game.state.indicators[key]);
  return status === 'good' ? '#3fbf5e' : status === 'medium' ? '#e0a72b' : '#e5484d';
}

const OWNERSHIP_BADGE_ICON = { state: '🏛️', partnership: '🤝', privatized: '🏢' };

// شارة صغيرة بنموذج الملكية الحالي - تظهر فقط على صفوف القطاعات الإنتاجية الأربعة القابلة لضبط ملكيتها
function ownershipBadgeFor(key) {
  const entry = Object.entries(PRODUCTIVE_SECTOR_META).find(([, meta]) => meta.indicatorKey === key);
  if (!entry) return '';
  const [sectorId] = entry;
  const ownership = Game.state.sectorPolicies[sectorId].ownership;
  return `<span class="metric-ownership-badge" title="نموذج الملكية: ${PRODUCTIVE_SECTOR_META[sectorId].ownershipLabels[ownership]}">${OWNERSHIP_BADGE_ICON[ownership]}</span>`;
}

function metricRowHtml(key) {
  const meta = INDICATOR_META[key];
  const val = Game.state.indicators[key];
  const hist = Game.state.history;
  const prev = hist.length > 1 ? hist[hist.length - 2][key] : val;
  const delta = val - prev;
  const deltaGood = meta.good === 'low' ? delta < 0 : delta > 0;
  const deltaCls = Math.abs(delta) < 0.05 ? 'flat' : (deltaGood ? 'up' : 'down');
  const arrow = Math.abs(delta) < 0.05 ? '~' : (delta > 0 ? '↑' : '↓');
  return `
    <div class="metric-row" data-key="${key}">
      <div class="metric-name">${meta.name}${ownershipBadgeFor(key)}</div>
      <canvas class="spark" data-spark="${key}" width="54" height="22"></canvas>
      <div class="metric-value">${fmtNum(val)}</div>
      <div class="metric-delta ${deltaCls}">${arrow}${fmtNum(Math.abs(delta))}</div>
    </div>`;
}

function renderDomainGrid() {
  const s = Game.state;
  const wrap = document.getElementById('domain-grid');
  wrap.innerHTML = INDICATOR_DOMAINS.map(domain => {
    const score = domainScore(s, domain);
    const status = domainStatus(score);
    return `
      <div class="domain-panel">
        <div class="domain-head">
          <div class="domain-head-left"><div class="domain-icon ${status}">${domain.icon}</div><div class="domain-title">${domain.name}</div></div>
          <div class="domain-score ${status}">${score}</div>
        </div>
        <div class="metric-list">${domain.keys.map(metricRowHtml).join('')}</div>
      </div>`;
  }).join('');

  INDICATOR_DOMAINS.flatMap(d => d.keys).forEach(key => {
    const canvas = wrap.querySelector(`canvas[data-spark="${key}"]`);
    if (!canvas) return;
    const series = s.history.slice(-10).map(h => h[key]);
    drawSparkline(canvas, series, sparklineColor(key));
  });
  wrap.querySelectorAll('.metric-row').forEach(row => {
    row.addEventListener('click', () => openIndicatorDetailModal(row.dataset.key));
  });
}

function openIndicatorDetailModal(key) {
  const s = Game.state;
  const meta = INDICATOR_META[key];
  if (!meta) return;
  const val = s.indicators[key];
  const status = indicatorColor(key, val);
  const lineColor = status === 'good' ? '#3fbf5e' : status === 'medium' ? '#e0a72b' : '#e5484d';
  const html = `
    <span class="modal-tag">مؤشر</span>
    <h2>${meta.name}</h2>
    <div class="ind-detail-value ${status}">${fmtNum(val)}<span class="ind-detail-unit">${meta.unit}</span></div>
    <div class="char-stats-grid" style="grid-template-columns:1fr">${statMiniBar('التقييم العام', normalizedIndicatorScore(key, val))}</div>
    <div class="chart-box" style="margin-top:14px;padding:0"><canvas id="ind-detail-chart"></canvas></div>
    <div class="nav-row"><button class="btn btn-primary" id="modal-continue">إغلاق</button></div>`;
  showModal(html);
  document.getElementById('modal-continue').addEventListener('click', hideModal);
  drawLineChart(document.getElementById('ind-detail-chart'), s.history.map(h => h[key]), { color: lineColor });
}

// ------- الخريطة التفاعلية بطبقات -------
function regionAverageLoyalty(state, regionId) {
  const tribesInRegion = state.relations.tribes.filter(t => t.region === regionId);
  const charsInRegion = state.characters.filter(c => c.region === regionId);
  const values = [...tribesInRegion.map(t => t.loyalty), ...charsInRegion.map(c => c.stats.loyalty)];
  return values.length ? values.reduce((a, v) => a + v, 0) / values.length : 50;
}

function renderLibyaMap() {
  const s = Game.state;
  const layer = Game.mapLayer || 'loyalty';
  REGIONS.forEach(r => {
    const el = document.getElementById('map-' + r.id);
    if (!el) return;
    const val = regionLayerValue(s, r.id, layer);
    el.classList.remove('good', 'medium', 'bad');
    el.classList.add(indicatorColor('satisfaction', val));
    el.onclick = () => openRegionModal(r.id);
  });
  renderRegionPulseList();
}

function renderRegionPulseList() {
  const s = Game.state;
  const layer = Game.mapLayer || 'loyalty';
  const wrap = document.getElementById('region-pulse-list');
  if (!wrap) return;
  wrap.innerHTML = REGIONS.map(r => {
    const val = regionLayerValue(s, r.id, layer);
    const color = `var(--${indicatorColor('satisfaction', val)})`;
    return `<div class="region-pulse-item"><span class="rp-name">${r.name}</span><div class="rp-bar"><div class="rp-fill" style="width:${val}%;background:${color}"></div></div><span class="rp-val">${Math.round(val)}</span></div>`;
  }).join('');
}

function bindMapLayerToggle() {
  document.querySelectorAll('#map-layer-toggle span').forEach(el => {
    el.addEventListener('click', () => {
      Game.mapLayer = el.dataset.layer;
      document.querySelectorAll('#map-layer-toggle span').forEach(s => s.classList.remove('active'));
      el.classList.add('active');
      renderLibyaMap();
    });
  });
}

// ------- لوحة الاتجاهات القابلة للاختيار -------
const TREND_CANDIDATES = [
  { key: 'satisfaction', label: 'رضا الشعب' },
  { key: 'politicalStability', label: 'الاستقرار' },
  { key: 'security', label: 'الأمن' },
  { key: 'publicDebt', label: 'الدين العام' },
  { key: 'gdpGrowth', label: 'النمو الاقتصادي' },
  { key: 'unemployment', label: 'البطالة' },
  { key: 'internationalSupport', label: 'الدعم الدولي' },
  { key: 'oilProduction', label: 'إنتاج النفط' }
];
const TREND_COLORS = ['#3fbf5e', '#c9a227', '#4aa8e0', '#e5484d'];

function renderTrendChips() {
  const wrap = document.getElementById('trend-chips');
  if (!wrap) return;
  if (!Game.selectedTrendKeys) Game.selectedTrendKeys = ['satisfaction'];
  wrap.innerHTML = TREND_CANDIDATES.map(t =>
    `<span class="${Game.selectedTrendKeys.includes(t.key) ? 'active' : ''}" data-key="${t.key}">${t.label}</span>`
  ).join('');
  wrap.querySelectorAll('span').forEach(el => {
    el.addEventListener('click', () => {
      const key = el.dataset.key;
      const idx = Game.selectedTrendKeys.indexOf(key);
      if (idx >= 0) {
        if (Game.selectedTrendKeys.length > 1) Game.selectedTrendKeys.splice(idx, 1);
      } else if (Game.selectedTrendKeys.length < 4) {
        Game.selectedTrendKeys.push(key);
      }
      renderTrendChips();
      renderTrendChart();
    });
  });
}

function renderTrendChart() {
  const canvas = document.getElementById('chart-trend');
  if (!canvas) return;
  const keys = Game.selectedTrendKeys || ['satisfaction'];
  const seriesList = keys.map(k => Game.state.history.map(h => h[k]));
  drawMultiLineChart(canvas, seriesList, TREND_COLORS);
}

// ------- شريط النشاط الحي -------
function renderActivityTicker() {
  const s = Game.state;
  const wrap = document.getElementById('activity-ticker');
  if (!wrap) return;
  const combined = [
    ...s.decisionsLog.map(d => ({ ...d, kind: 'decision' })),
    ...s.eventsLog.map(e => ({ ...e, kind: 'event' }))
  ].sort((a, b) => b.month - a.month).slice(0, 4);

  if (combined.length === 0) {
    wrap.innerHTML = '<p class="hint" style="padding:14px">لا يوجد نشاط بعد.</p>';
    return;
  }
  wrap.innerHTML = combined.map(item => {
    const icon = item.kind === 'decision' ? '📜' : '⚡';
    const bg = item.kind === 'decision' ? 'var(--good-glow)' : 'var(--medium-glow)';
    const kindLabel = item.kind === 'decision' ? 'قرار' : 'حدث';
    return `<div class="activity-item">
      <div class="activity-icon" style="background:${bg}">${icon}</div>
      <div class="activity-text"><b>${kindLabel}:</b> ${item.title} — ${item.optionLabel}</div>
      <div class="activity-time">الشهر ${item.month}</div>
    </div>`;
  }).join('');
}

// ------- وصول سريع من شريط القيادة -------
function bindDashboardQuickNav() {
  document.querySelectorAll('[data-goto-tab]').forEach(el => {
    el.addEventListener('click', () => {
      const btn = document.querySelector(`.tab-btn[data-tab="${el.dataset.gotoTab}"]`);
      if (btn) btn.click();
    });
  });
  const alertsIcon = document.getElementById('cmd-alerts-icon');
  if (alertsIcon) alertsIcon.addEventListener('click', () => {
    const section = document.getElementById('attention-section');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function openRegionModal(regionId) {
  const s = Game.state;
  const region = REGIONS.find(r => r.id === regionId);
  const avgLoyalty = regionAverageLoyalty(s, regionId);
  const tribesInRegion = s.relations.tribes.filter(t => t.region === regionId);
  const charsInRegion = s.characters.filter(c => c.region === regionId);
  const html = `
    <span class="modal-tag">منطقة</span>
    <h2>${region.name}</h2>
    <div class="char-stats-grid">${statMiniBar('متوسط الولاء', avgLoyalty)}</div>
    <div class="field-label" style="margin-top:14px">القبائل في المنطقة</div>
    <div class="effect-preview">${tribesInRegion.map(t => `<span class="effect-chip ${indicatorColor('satisfaction', t.loyalty) === 'bad' ? 'chip-bad' : 'chip-good'}">${t.name} (${Math.round(t.loyalty)})</span>`).join('') || '<span class="hint">لا توجد قبائل مسجلة</span>'}</div>
    <div class="field-label" style="margin-top:14px">شخصيات مؤثرة من المنطقة</div>
    <div class="effect-preview">${charsInRegion.map(c => `<span class="trait-chip">${c.name} - ${c.role}</span>`).join('') || '<span class="hint">لا توجد شخصيات مسجلة</span>'}</div>
    <div class="nav-row"><button class="btn btn-primary" id="modal-continue">إغلاق</button></div>`;
  showModal(html);
  document.getElementById('modal-continue').addEventListener('click', hideModal);
}

function renderBudgetTab() {
  const s = Game.state;
  const wrap = document.getElementById('budget-sliders');
  wrap.innerHTML = '';
  SECTORS.forEach(sec => {
    const row = document.createElement('div');
    row.className = 'slider-row';
    const val = s.budget.allocations[sec.id];
    row.innerHTML = `
      <label>${sec.icon} ${sec.name}</label>
      <input type="range" min="2" max="35" value="${val}" data-sector="${sec.id}">
      <span class="slider-val">${val}%</span>`;
    wrap.appendChild(row);
    const input = row.querySelector('input');
    const span = row.querySelector('.slider-val');
    input.addEventListener('input', () => {
      s.budget.allocations[sec.id] = Number(input.value);
      span.textContent = input.value + '%';
      renderBudgetSummary();
    });
  });
  bindBudgetPresets();
  renderBudgetSummary();
  renderRevenueExpenditureChart();
}

function applyBudgetPreset(targetTotal) {
  const s = Game.state;
  const keys = Object.keys(s.budget.allocations);
  const currentTotal = keys.reduce((a, k) => a + s.budget.allocations[k], 0) || 1;
  const scale = targetTotal / currentTotal;
  keys.forEach(k => {
    s.budget.allocations[k] = Math.max(2, Math.min(35, Math.round(s.budget.allocations[k] * scale)));
  });
  renderBudgetTab();
  renderSectorsTab();
}

function bindBudgetPresets() {
  const balanced = document.getElementById('preset-balanced');
  const austerity = document.getElementById('preset-austerity');
  const expansion = document.getElementById('preset-expansion');
  if (balanced) balanced.onclick = () => {
    Game.state.budget.allocations = {
      education: 11, health: 11, security: 11, infrastructure: 11, subsidies: 11, salaries: 11, debtService: 4, economicDev: 4,
      oilSector: 10, agricultureSector: 6, tourismSector: 5, industrySector: 5
    };
    renderBudgetTab();
    renderSectorsTab();
  };
  if (austerity) austerity.onclick = () => applyBudgetPreset(85);
  if (expansion) expansion.onclick = () => applyBudgetPreset(115);
}

function renderBudgetSummary() {
  const s = Game.state;
  const budget = estimateBudget(s);
  const wrap = document.getElementById('budget-summary');
  wrap.innerHTML = `
    <div>الخزينة العامة: <b>${fmtNum(s.indicators.treasury, 0)}</b> مليون د.ل</div>
    <div>سعر النفط الحالي: <b>${fmtNum(s.economy.oilPrice, 0)}</b> (مؤشر نسبي)</div>
    <div>إيرادات النفط المتوقعة: <b>${fmtNum(budget.oilRevenue, 0)}</b> مليون د.ل</div>
    <div>الإيرادات الضريبية المتوقعة: <b>${fmtNum(budget.taxRevenue, 0)}</b> مليون د.ل</div>`;
  renderBudgetLiveSummary(budget);
}

function renderBudgetLiveSummary(budget) {
  const wrap = document.getElementById('budget-live-summary');
  if (!wrap) return;
  const totalPct = budget.totalAllocPct;
  let statusClass = 'good', statusLabel = 'ميزانية متوازنة';
  if (totalPct > 130 || totalPct < 60) { statusClass = 'bad'; statusLabel = totalPct > 100 ? 'عجز كبير جداً' : 'فائض كبير جداً'; }
  else if (totalPct > 108) { statusClass = 'medium'; statusLabel = 'عجز'; }
  else if (totalPct < 92) { statusClass = 'medium'; statusLabel = 'فائض'; }

  const balanceClass = budget.balance >= 0 ? 'good' : (budget.balance > -budget.totalRevenue * 0.15 ? 'medium' : 'bad');

  wrap.innerHTML = `
    <div class="budget-live-card">
      <div class="blc-item">
        <div class="blc-label">إجمالي التخصيص</div>
        <div class="blc-value ${statusClass}">${fmtNum(totalPct, 0)}%</div>
        <div class="blc-tag ${statusClass}">${statusLabel}</div>
      </div>
      <div class="blc-item">
        <div class="blc-label">الإيرادات المتوقعة / شهر</div>
        <div class="blc-value">${fmtNum(budget.totalRevenue, 0)}</div>
      </div>
      <div class="blc-item">
        <div class="blc-label">النفقات المتوقعة / شهر</div>
        <div class="blc-value">${fmtNum(budget.totalExpenditure, 0)}</div>
      </div>
      <div class="blc-item">
        <div class="blc-label">الرصيد الشهري المتوقع</div>
        <div class="blc-value ${balanceClass}">${budget.balance >= 0 ? '+' : ''}${fmtNum(budget.balance, 0)}</div>
      </div>
    </div>`;
}

function renderRevenueExpenditureChart() {
  const canvas = document.getElementById('chart-revenue-expenditure');
  if (!canvas) return;
  const hist = Game.state.history;
  drawDualLineChart(canvas, hist.map(h => h.totalRevenue || 0), hist.map(h => h.totalExpenditure || 0), '#3fbf5e', '#e5484d');
}

// ------- تبويب القطاعات الإنتاجية الفرعي -------
function renderSectorsTab() {
  const s = Game.state;
  const wrap = document.getElementById('sector-cards');
  if (!wrap) return;
  wrap.innerHTML = Object.keys(PRODUCTIVE_SECTOR_META).map(sectorCardHtml).join('');
  Object.keys(PRODUCTIVE_SECTOR_META).forEach(sectorId => {
    const meta = PRODUCTIVE_SECTOR_META[sectorId];
    const canvas = wrap.querySelector(`canvas[data-spark-sector="${sectorId}"]`);
    if (!canvas) return;
    const series = s.history.slice(-10).map(h => h[meta.indicatorKey]);
    drawSparkline(canvas, series, sparklineColor(meta.indicatorKey));
  });
  bindSectorCardEvents();
  renderSectorLivePreviews();
}

function sectorCardHtml(sectorId) {
  const meta = PRODUCTIVE_SECTOR_META[sectorId];
  const s = Game.state;
  const policy = s.sectorPolicies[sectorId];
  const val = s.indicators[meta.indicatorKey];
  const investPct = s.budget.allocations[meta.budgetKey];
  return `
    <div class="sector-ctrl-card">
      <div class="sc-head">
        <div class="sc-head-left"><span class="sc-icon">${meta.icon}</span><span class="sc-name">${meta.name}</span></div>
        <div class="sc-value">${fmtNum(val)}</div>
      </div>
      <canvas class="sc-spark" data-spark-sector="${sectorId}" width="240" height="34"></canvas>

      <div class="sc-lever">
        <div class="sc-lever-label"><span>الاستثمار</span><span class="sc-lever-val" data-invest-val="${sectorId}">${investPct}%</span></div>
        <input type="range" class="sc-slider" data-invest-slider="${sectorId}" min="2" max="35" value="${investPct}">
      </div>

      <div class="sc-lever">
        <div class="sc-lever-label"><span>نموذج الملكية</span></div>
        <div class="seg-control" data-ownership-group="${sectorId}">
          ${['state', 'partnership', 'privatized'].map(o => `<button type="button" class="seg-btn ${policy.ownership === o ? 'active' : ''}" data-sector="${sectorId}" data-ownership="${o}">${meta.ownershipLabels[o]}</button>`).join('')}
        </div>
      </div>

      <div class="sc-lever">
        <div class="sc-lever-label"><span>${meta.orientationLabel}</span><span class="sc-lever-val" data-orient-val="${sectorId}">${policy.orientation}%</span></div>
        <input type="range" class="sc-slider" data-orient-slider="${sectorId}" min="0" max="100" value="${policy.orientation}">
        <div class="sc-orient-labels"><span>${meta.orientationLow}</span><span>${meta.orientationHigh}</span></div>
      </div>

      <div class="sc-preview" data-preview="${sectorId}"></div>
    </div>`;
}

function bindSectorCardEvents() {
  const wrap = document.getElementById('sector-cards');
  if (!wrap) return;
  wrap.querySelectorAll('[data-invest-slider]').forEach(input => {
    input.addEventListener('input', () => {
      const sectorId = input.dataset.investSlider;
      const meta = PRODUCTIVE_SECTOR_META[sectorId];
      Game.state.budget.allocations[meta.budgetKey] = Number(input.value);
      wrap.querySelector(`[data-invest-val="${sectorId}"]`).textContent = input.value + '%';
      renderSectorLivePreviews();
      renderBudgetSummary();
    });
  });
  wrap.querySelectorAll('[data-orient-slider]').forEach(input => {
    input.addEventListener('input', () => {
      const sectorId = input.dataset.orientSlider;
      Game.state.sectorPolicies[sectorId].orientation = Number(input.value);
      wrap.querySelector(`[data-orient-val="${sectorId}"]`).textContent = input.value + '%';
      renderSectorLivePreviews();
    });
  });
  wrap.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sectorId = btn.dataset.sector;
      Game.state.sectorPolicies[sectorId].ownership = btn.dataset.ownership;
      wrap.querySelectorAll(`.seg-control[data-ownership-group="${sectorId}"] .seg-btn`).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderSectorLivePreviews();
      renderBudgetSummary();
    });
  });
}

// معاينة حية مبنية على المحرك الفعلي: تستنسخ الحالة وتُشغّل شهراً افتراضياً واحداً بلا أي تأثير على اللعبة الحقيقية
function previewSectorOutlook(sectorId) {
  const meta = PRODUCTIVE_SECTOR_META[sectorId];
  const clone = JSON.parse(JSON.stringify(Game.state));
  const before = clone.indicators[meta.indicatorKey];
  const revenue = estimateMonthlyRevenue(clone);
  monthlyEconomicTick(clone);
  const after = clone.indicators[meta.indicatorKey];
  return { delta: after - before, monthlyRevenue: revenue[meta.revenueKey] };
}

function renderSectorLivePreviews() {
  Object.keys(PRODUCTIVE_SECTOR_META).forEach(sectorId => {
    const el = document.querySelector(`[data-preview="${sectorId}"]`);
    if (!el) return;
    const outlook = previewSectorOutlook(sectorId);
    const trendCls = outlook.delta > 0.05 ? 'good' : outlook.delta < -0.05 ? 'bad' : 'medium';
    const arrow = outlook.delta > 0.05 ? '↑' : outlook.delta < -0.05 ? '↓' : '~';
    el.innerHTML = `
      <div class="sc-preview-item"><span class="sc-preview-label">إيراد شهري متوقع</span><span class="sc-preview-value">${fmtNum(outlook.monthlyRevenue, 0)}</span></div>
      <div class="sc-preview-item"><span class="sc-preview-label">الاتجاه المتوقع</span><span class="sc-preview-value ${trendCls}">${arrow} ${fmtNum(Math.abs(outlook.delta), 2)}/شهر</span></div>`;
  });
}

// ------- تبويب السياسة الاقتصادية الفرعي: ضرائب، دعم وقود، استراتيجية دين -------
const MACRO_TAX_META = [
  { key: 'corporateTaxRate', name: 'ضريبة الشركات', min: 0, max: 50, revenueKey: 'corporateTaxRevenue', sideEffect: 'فوق 20% تُبطئ نمو الصناعة والتنمية الاقتصادية تدريجياً، ودونها تُسرّعه قليلاً.' },
  { key: 'consumptionTaxRate', name: 'ضريبة الاستهلاك', min: 0, max: 25, revenueKey: 'consumptionTaxRevenue', sideEffect: 'فوق 8% ترفع مستوى الفقر مباشرة - عبء يقع على الأقل دخلاً.' },
  { key: 'customsTariffRate', name: 'التعرفة الجمركية', min: 0, max: 40, revenueKey: 'customsRevenue', sideEffect: 'فوق 15% تحمي الصناعة المحلية لكنها ترفع التضخم وتخاطر بانتقام تجاري يضر الميزان التجاري.' }
];

function renderMacroTaxCards() {
  const s = Game.state;
  const wrap = document.getElementById('macro-tax-cards');
  if (!wrap) return;
  const revenue = estimateMonthlyRevenue(s);
  wrap.innerHTML = MACRO_TAX_META.map(meta => `
    <div class="dial-ctrl-card">
      <div class="dial-head"><span class="dial-name">${meta.name}</span><span class="dial-val" data-tax-val="${meta.key}">${s.macroPolicy[meta.key]}%</span></div>
      <input type="range" class="sc-slider" data-tax-slider="${meta.key}" min="${meta.min}" max="${meta.max}" value="${s.macroPolicy[meta.key]}">
      <div class="dial-revenue">إيراد شهري متوقع: <b data-tax-revenue="${meta.key}">${fmtNum(revenue[meta.revenueKey], 0)}</b></div>
      <div class="dial-side-effect">${meta.sideEffect}</div>
    </div>`).join('');
  wrap.querySelectorAll('[data-tax-slider]').forEach(input => {
    input.addEventListener('input', () => {
      const key = input.dataset.taxSlider;
      Game.state.macroPolicy[key] = Number(input.value);
      wrap.querySelector(`[data-tax-val="${key}"]`).textContent = input.value + '%';
      const rev = estimateMonthlyRevenue(Game.state);
      MACRO_TAX_META.forEach(m => {
        const el = wrap.querySelector(`[data-tax-revenue="${m.key}"]`);
        if (el) el.textContent = fmtNum(rev[m.revenueKey], 0);
      });
      renderBudgetSummary();
    });
  });
}

function renderFuelSubsidyPanel() {
  const s = Game.state;
  const wrap = document.getElementById('fuel-subsidy-panel');
  if (!wrap) return;
  const revenue = estimateMonthlyRevenue(s);
  const level = s.macroPolicy.fuelSubsidyLevel;
  wrap.innerHTML = `
    <div class="fuel-head"><span>نسبة الدعم (100% = شبه مجاني، 0% = سعر السوق)</span><span class="fuel-val" id="fuel-val">${level}%</span></div>
    <input type="range" class="sc-slider" id="fuel-slider" min="0" max="100" value="${level}">
    <div class="sc-preview" style="margin-top:12px">
      <div class="sc-preview-item"><span class="sc-preview-label">كلفة شهرية</span><span class="sc-preview-value" id="fuel-cost">${fmtNum(revenue.fuelSubsidyCost, 0)}</span></div>
      <div class="sc-preview-item"><span class="sc-preview-label">تسرّب تهريب تقديري</span><span class="sc-preview-value bad" id="fuel-leak">${fmtNum(estimateSmugglingLeakage(s), 0)}</span></div>
    </div>
    <div class="risk-strip" id="fuel-risk-strip" style="display:none">⚠ خفض الدعم أكثر من 15 نقطة دفعة واحدة يُحدث صدمة فورية في الرضا والاستقرار السياسي</div>`;
  const slider = document.getElementById('fuel-slider');
  slider.addEventListener('input', () => {
    const val = Number(slider.value);
    Game.state.macroPolicy.fuelSubsidyLevel = val;
    document.getElementById('fuel-val').textContent = val + '%';
    const rev = estimateMonthlyRevenue(Game.state);
    document.getElementById('fuel-cost').textContent = fmtNum(rev.fuelSubsidyCost, 0);
    document.getElementById('fuel-leak').textContent = fmtNum(estimateSmugglingLeakage(Game.state), 0);
    const drop = Game.state.macroPolicy._prevFuelSubsidy - val;
    document.getElementById('fuel-risk-strip').style.display = drop > 15 ? '' : 'none';
    renderBudgetSummary();
  });
}

const DEBT_STRATEGY_META = [
  { id: 'domestic', name: 'اقتراض داخلي', desc: 'تضخم أعلى قليلاً، بلا تبعية خارجية' },
  { id: 'external', name: 'تمويل خارجي', desc: 'دين أسرع نمواً لكنه يدعم الاحتياطي ويقرّب من صندوق النقد' },
  { id: 'austerity', name: 'تقشف فوري', desc: 'يؤلم الرضا الشعبي لكن يبقي الدين منضبطاً' }
];

function renderDebtStrategyPanel() {
  const s = Game.state;
  const wrap = document.getElementById('debt-strategy-panel');
  if (!wrap) return;
  wrap.innerHTML = DEBT_STRATEGY_META.map(d => `
    <button type="button" class="seg-btn debt-seg-btn ${s.macroPolicy.debtStrategy === d.id ? 'active' : ''}" data-debt="${d.id}">
      <span class="debt-seg-name">${d.name}</span><span class="debt-seg-desc">${d.desc}</span>
    </button>`).join('');
  wrap.querySelectorAll('.debt-seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      Game.state.macroPolicy.debtStrategy = btn.dataset.debt;
      wrap.querySelectorAll('.debt-seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function renderMacroTab() {
  renderMacroTaxCards();
  renderFuelSubsidyPanel();
  renderDebtStrategyPanel();
}

function bindEconomySubTabs() {
  document.querySelectorAll('.subtab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('.tab-panel');
      group.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));
      group.querySelectorAll('.subtab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      group.querySelector('#subtab-' + btn.dataset.subtab).classList.add('active');
    });
  });
}

function relColor(v) { return v >= 60 ? 'var(--good)' : v >= 35 ? 'var(--medium)' : 'var(--bad)'; }

// صف كيان علاقات قابل للنقر - بديل الشريط الثابت القديم: يفتح نافذة تفصيل بإجراءات فعلية
function relationsRowHtml(kind, it, valKey, flag) {
  const v = it[valKey];
  const onCooldown = !canOutreach(Game.state, kind, it.id);
  return `
    <div class="rel-item rel-item-clickable" data-rel-kind="${kind}" data-rel-id="${it.id}">
      <span>${flag || ''}${it.name}${onCooldown ? ' <span class="rel-cooldown-badge" title="في فترة تهدئة">⏳</span>' : ''}</span>
      <div class="rel-bar"><div class="rel-bar-fill" style="width:${v}%;background:${relColor(v)}"></div></div>
    </div>`;
}

function bindRelationsRows(wrap) {
  wrap.querySelectorAll('[data-rel-kind]').forEach(row => {
    row.addEventListener('click', () => openRelationsEntityModal(row.dataset.relKind, row.dataset.relId));
  });
}

function renderRelationsTab() {
  const s = Game.state;
  function fillList(elId, kind, items, valKey, flagMap) {
    const wrap = document.getElementById(elId);
    wrap.innerHTML = items.map(it => relationsRowHtml(kind, it, valKey, flagMap && flagMap[it.id])).join('');
    bindRelationsRows(wrap);
  }
  fillList('rel-tribes', 'tribe', s.relations.tribes, 'loyalty');
  fillList('rel-parties', 'party', s.relations.parties, 'support');
  fillList('rel-institutions', 'institution', s.relations.institutions, 'legitimacy');
  fillList('rel-orgs', 'org', s.relations.orgs, 'relation');

  const countriesWrap = document.getElementById('rel-countries');
  countriesWrap.innerHTML = COUNTRY_GROUPS.map(g => {
    const items = s.relations.countries.filter(c => c.group === g.id);
    if (!items.length) return '';
    return `<div class="rel-group-header">${g.name}</div>` +
      items.map(it => relationsRowHtml('country', it, 'relation', COUNTRY_FLAGS[it.id])).join('');
  }).join('');
  bindRelationsRows(countriesWrap);
}

function relationsEntityFlavor(kind, entity) {
  if (kind === 'tribe') return `الإقليم: ${regionName(entity.region)}`;
  if (kind === 'country') return `المجموعة: ${(COUNTRY_GROUPS.find(g => g.id === entity.group) || {}).name || entity.group}`;
  return '';
}

function openRelationsEntityModal(kind, id) {
  const s = Game.state;
  const found = getRelationsEntity(s, kind, id);
  if (!found) return;
  const flavor = relationsEntityFlavor(kind, found.entity);
  const cooldownKey = kind + ':' + id;
  const onCooldown = !canOutreach(s, kind, id);
  const readyMonth = s.relationsCooldowns[cooldownKey];
  const cost = OUTREACH_COST[kind] || 0;

  const html = `
    <span class="modal-tag">علاقات</span>
    <h2>${found.entity.name}</h2>
    ${flavor ? `<p class="modal-desc">${flavor}</p>` : ''}
    <div class="char-stats-grid" style="grid-template-columns:1fr">${statMiniBar(found.label, found.value)}</div>
    <div id="rel-outreach-msg"></div>
    <div class="nav-row">
      <button class="btn btn-primary" id="act-outreach" ${onCooldown ? 'disabled' : ''}>
        تواصل ${cost > 0 ? `(${cost} مليون د.ل)` : ''}${onCooldown ? ` — متاح من الشهر ${readyMonth}` : ''}
      </button>
      <button class="btn" id="act-send-mission">أرسل مهمة</button>
    </div>`;
  showModal(html);
  document.getElementById('act-outreach').addEventListener('click', () => {
    const res = outreachToEntity(Game.state, kind, id);
    document.getElementById('rel-outreach-msg').innerHTML = `<div class="opinion-box">${res.msg}</div>`;
    if (res.ok) {
      document.getElementById('act-outreach').setAttribute('disabled', 'disabled');
      renderRelationsTab();
    }
  });
  document.getElementById('act-send-mission').addEventListener('click', () => {
    hideModal();
    openTargetedMissionCharModal(kind, id);
  });
}

// أنسب نوع مهمة موجودة لكل نوع كيان علاقات - "توعية ومصالحة" للكيانات الداخلية، "دبلوماسية" للدول والمنظمات
const TARGET_KIND_MISSION_TYPE = { tribe: 'social', party: 'social', institution: 'social', country: 'diplomatic', org: 'diplomatic' };

function openTargetedMissionCharModal(kind, id) {
  const s = Game.state;
  const found = getRelationsEntity(s, kind, id);
  if (!found) return;
  const typeId = TARGET_KIND_MISSION_TYPE[kind];
  const type = MISSION_TYPES.find(t => t.id === typeId);
  const eligible = s.characters.filter(c => !isCharacterBusy(s, c.id) && missionTypesForCharacter(c).some(t => t.id === typeId));

  const optionsHtml = eligible.length
    ? eligible.map(c => {
        const chance = Math.round(computeMissionSuccessChance(c, type));
        return `<div class="decision-option" data-char="${c.id}">
          <div class="opt-label">${c.name}</div>
          <div class="opt-advisor">${c.role} · نسبة النجاح المتوقعة: ${chance}%</div>
        </div>`;
      }).join('')
    : `<p class="hint">لا توجد شخصية مناسبة متاحة حالياً لإرسال مهمة نحو ${found.entity.name}.</p>`;

  const html = `
    <span class="modal-tag">مهمة موجَّهة</span>
    <h2>أرسل مهمة نحو ${found.entity.name}</h2>
    <p class="modal-desc">${type.desc}</p>
    <div class="decision-options" style="max-height:50vh;overflow-y:auto">${optionsHtml}</div>
    <div class="nav-row"><button class="btn btn-ghost" id="modal-cancel">إلغاء</button></div>`;
  showModal(html);
  document.getElementById('modal-cancel').addEventListener('click', hideModal);
  document.querySelectorAll('[data-char]').forEach(el => {
    el.addEventListener('click', () => {
      assignMission(Game.state, el.dataset.char, typeId, null, { kind, id });
      hideModal();
      renderCharacterGrid();
      renderActiveMissionsPanel();
    });
  });
}

function renderLogTab() {
  const s = Game.state;
  const wrap = document.getElementById('log-list');
  wrap.innerHTML = '';
  const combined = [
    ...s.decisionsLog.map(d => ({ ...d, kind: 'قرار' })),
    ...s.eventsLog.map(e => ({ ...e, kind: 'حدث' }))
  ].sort((a, b) => b.month - a.month);
  if (combined.length === 0) {
    wrap.innerHTML = '<p class="hint">لا يوجد سجل بعد.</p>';
    return;
  }
  combined.forEach(item => {
    const div = document.createElement('div');
    div.className = 'log-item';
    div.innerHTML = `<div class="log-meta">${item.kind} - السنة ${item.year} / الشهر ${item.month}</div><b>${item.title}</b><br>الاختيار: ${item.optionLabel}`;
    wrap.appendChild(div);
  });
}

function renderGameScreen() {
  renderHUD();
  renderCommandBar();
  renderAttentionStrip();
  renderDomainGrid();
  renderLibyaMap();
  renderTrendChips();
  renderTrendChart();
  renderActivityTicker();
  renderBudgetTab();
  renderSectorsTab();
  renderMacroTab();
  renderActiveMissionsPanel();
  renderCabinetGrid();
  renderCharacterFilters();
  renderCharacterGrid();
  renderRelationsTab();
  renderLogTab();
}

// ------- تبويب الحكومة والشخصيات -------
function initials(name) { return name.trim().split(' ').slice(0, 2).map(w => w[0]).join(''); }

function statMiniBar(label, val) {
  return `<div class="stat-mini"><span>${label}</span><div class="stat-bar"><div class="stat-bar-fill" style="width:${val}%"></div><span></span></div><span>${Math.round(val)}</span></div>`;
}

// ------- لوحة المهام النشطة: تتبع مرئي دائم بدل تذكّر حالة كل شخصية يدوياً -------
function renderActiveMissionsPanel() {
  const s = Game.state;
  const wrap = document.getElementById('active-missions');
  if (!wrap) return;
  if (!s.missions.length) {
    wrap.innerHTML = '<p class="hint">لا توجد مهام جارية حالياً - كلّف شخصية بمهمة من نافذتها، أو من تبويب العلاقات لاستهداف كيان بعينه.</p>';
    return;
  }
  wrap.innerHTML = s.missions.map(m => {
    const ch = getCharacter(s, m.charId);
    const type = MISSION_TYPES.find(t => t.id === m.typeId);
    if (!ch || !type) return '';
    const monthsLeft = m.resolveAtMonth - s.month;
    const chance = Math.round(computeMissionSuccessChance(ch, type));
    const chanceCls = chance >= 60 ? 'good' : chance >= 35 ? 'medium' : 'bad';
    let targetName = null;
    if (m.targetEntity) {
      const found = getRelationsEntity(s, m.targetEntity.kind, m.targetEntity.id);
      if (found) targetName = found.entity.name;
    }
    return `<div class="mission-row">
      <div class="mission-row-main"><b>${ch.name}</b> — ${type.name}${targetName ? ` نحو ${targetName}` : ''}</div>
      <div class="mission-row-meta">
        <span class="mission-chance ${chanceCls}">نجاح متوقع ${chance}%</span>
        <span>يعود بعد ${monthsLeft} ${monthsLeft === 1 ? 'شهر' : 'أشهر'}</span>
      </div>
    </div>`;
  }).join('');
}

function renderMissionResultModal(result, onClose) {
  const cls = result.success ? 'good' : 'bad';
  const targetNote = result.targetName ? ` نحو ${result.targetName}` : '';
  const html = `
    <span class="modal-tag">نتيجة مهمة ${result.success ? '✓' : '✗'}</span>
    <h2>${result.typeName}${targetNote}</h2>
    <p class="modal-desc">${result.charName} ${result.success ? 'نجح في مهمته.' : 'فشل في مهمته.'}</p>
    <div class="ind-detail-value ${cls}">${result.magnitude >= 0 ? '+' : ''}${fmtNum(result.magnitude)}<span class="ind-detail-unit">${result.effectName}</span></div>
    <div class="nav-row"><button class="btn btn-primary" id="modal-continue">حسناً</button></div>`;
  const dismiss = () => { hideModal(); onClose(); };
  showModal(html, { onDismiss: dismiss });
  document.getElementById('modal-continue').addEventListener('click', dismiss);
}

function renderTurnoverModal(result, onClose) {
  const html = `
    <span class="modal-tag">تغيّر في الوجوه المؤثرة 🔄</span>
    <h2>${result.newName}</h2>
    <p class="modal-desc">تنحّى ${result.oldName} عن دوره في ${result.categoryName}، وبرز ${result.newName} (${result.newRole}) كوجه جديد.</p>
    <div class="nav-row"><button class="btn btn-primary" id="modal-continue">حسناً</button></div>`;
  const dismiss = () => { hideModal(); onClose(); };
  showModal(html, { onDismiss: dismiss });
  document.getElementById('modal-continue').addEventListener('click', dismiss);
}

function renderCabinetGrid() {
  const wrap = document.getElementById('cabinet-grid');
  if (!wrap) return;
  wrap.innerHTML = '';
  MINISTRIES.forEach(m => {
    const charId = Game.state.cabinet[m.id];
    const ch = charId ? getCharacter(Game.state, charId) : null;
    const card = document.createElement('div');
    card.className = 'cabinet-card' + (ch ? ' filled' : '');
    card.innerHTML = `<div class="cab-role">${m.name}</div><div class="cab-holder">${ch ? ch.name : 'شاغر'}</div>
      <div class="cab-actions">
        <button class="btn btn-small" data-assign="${m.id}">${ch ? 'استبدال' : 'تعيين'}</button>
        ${ch ? `<button class="btn btn-small btn-ghost" data-dismiss="${m.id}">إقالة</button>` : ''}
      </div>`;
    wrap.appendChild(card);
  });
  wrap.querySelectorAll('[data-assign]').forEach(btn => btn.addEventListener('click', () => openAssignModal(btn.dataset.assign)));
  wrap.querySelectorAll('[data-dismiss]').forEach(btn => btn.addEventListener('click', () => {
    dismissFromMinistry(Game.state, btn.dataset.dismiss);
    renderCabinetGrid(); renderCharacterGrid();
  }));
}

function renderCharacterFilters() {
  const wrap = document.getElementById('character-filters');
  if (!wrap) return;
  const cats = [{ id: 'all', name: 'الكل' }, ...CHARACTER_CATEGORIES];
  wrap.innerHTML = cats.map(c => `<button class="char-filter-btn ${((Game.charFilter || 'all') === c.id) ? 'active' : ''}" data-cat="${c.id}">${c.name}</button>`).join('');
  wrap.querySelectorAll('.char-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => { Game.charFilter = btn.dataset.cat; renderCharacterFilters(); renderCharacterGrid(); });
  });
}

function renderCharacterGrid() {
  const wrap = document.getElementById('character-grid');
  if (!wrap) return;
  wrap.innerHTML = '';
  const filter = Game.charFilter || 'all';
  const list = Game.state.characters.filter(c => filter === 'all' || c.category === filter);
  list.forEach(ch => {
    const busy = isCharacterBusy(Game.state, ch.id);
    const card = document.createElement('div');
    card.className = 'option-card char-card';
    card.innerHTML = `<div class="char-avatar">${initials(ch.name)}</div>
      <h3>${ch.name}</h3>
      <div class="char-role">${ch.role}</div>
      ${busy ? `<span class="trait-chip busy-chip">🕓 في مهمة</span>` : ''}
      ${statMiniBar('الولاء', ch.stats.loyalty)}
      ${statMiniBar('الشعبية', ch.stats.popularity)}
      ${statMiniBar('الكفاءة', ch.stats.competence)}`;
    card.addEventListener('click', () => openCharacterModal(ch.id));
    wrap.appendChild(card);
  });
}

function relationsListHtml(ch) {
  const rels = getCharacterRelations(Game.state, ch.id).slice(0, 3);
  if (rels.length === 0) return '';
  const items = rels.map(r => {
    const other = getCharacter(Game.state, r.otherId);
    if (!other) return '';
    const label = r.value >= 0 ? 'تحالف' : 'خصومة';
    const cls = r.value >= 0 ? 'chip-good' : 'chip-bad';
    return `<span class="effect-chip ${cls}">${other.name} (${label} ${Math.abs(Math.round(r.value))})</span>`;
  }).join('');
  return `<div class="field-label" style="margin-top:14px">أبرز العلاقات</div><div class="effect-preview">${items}</div>`;
}

function characterModalHtml(ch) {
  const traitsHtml = (ch.traits || []).map(t => `<span class="trait-chip">${TRAITS[t] ? TRAITS[t].name : t}</span>`).join('');
  const busy = isCharacterBusy(Game.state, ch.id);
  return `
    <span class="modal-tag">${CHARACTER_CATEGORIES.find(c => c.id === ch.category) ? CHARACTER_CATEGORIES.find(c => c.id === ch.category).name : ''}</span>
    <div class="char-modal-header">
      <div class="char-avatar-lg">${initials(ch.name)}</div>
      <div><h2 style="margin:0">${ch.name}</h2><div class="char-role">${ch.role}</div></div>
    </div>
    <p class="modal-desc">${ch.bio}</p>
    <div>${traitsHtml || '<span class="hint">لا توجد سمات خاصة</span>'}</div>
    ${busy ? `<div class="opinion-box">🕓 مشغول بمهمة حتى الشهر ${ch.busyUntil}.</div>` : ''}
    <div class="char-stats-grid">
      ${statMiniBar('الولاء', ch.stats.loyalty)}
      ${statMiniBar('الكفاءة', ch.stats.competence)}
      ${statMiniBar('الشعبية', ch.stats.popularity)}
      ${statMiniBar('النفوذ', ch.stats.influence)}
      ${statMiniBar('الطموح', ch.stats.ambition)}
      ${statMiniBar('الفساد', ch.stats.corruption)}
    </div>
    ${relationsListHtml(ch)}
    <div id="char-opinion-slot"></div>
    <div class="char-actions-row">
      <button class="btn" id="act-consult">استشارة</button>
      <button class="btn" id="act-reward">مكافأة (${REWARD_COST} مليون د.ل)</button>
      <button class="btn btn-ghost" id="act-punish">عقاب</button>
      <button class="btn" id="act-mission" ${busy ? 'disabled' : ''}>تكليف بمهمة</button>
      ${ch.category === 'government' || !ch.ministry ? `<button class="btn btn-primary" id="act-appoint">تعيين وزارياً</button>` : ''}
      ${ch.ministry ? `<button class="btn btn-ghost" id="act-dismiss">إقالة من المنصب</button>` : ''}
    </div>`;
}

function openCharacterModal(charId) {
  const ch = getCharacter(Game.state, charId);
  if (!ch) return;
  showModal(characterModalHtml(ch));
  bindCharacterModalActions(charId);
}

function bindCharacterModalActions(charId) {
  const ch = getCharacter(Game.state, charId);
  document.getElementById('act-consult').addEventListener('click', () => {
    const opinion = consultCharacter(Game.state, charId);
    refreshCharModal(charId, `<div class="opinion-box">${opinion}</div>`);
  });
  document.getElementById('act-reward').addEventListener('click', () => {
    const res = rewardCharacter(Game.state, charId);
    refreshCharModal(charId, `<div class="opinion-box">${res.msg}</div>`);
  });
  document.getElementById('act-punish').addEventListener('click', () => {
    const res = punishCharacter(Game.state, charId);
    refreshCharModal(charId, `<div class="opinion-box">${res.msg}</div>`);
  });
  const appointBtn = document.getElementById('act-appoint');
  if (appointBtn) appointBtn.addEventListener('click', () => { hideModal(); openAssignModal(null, charId); });
  const dismissBtn = document.getElementById('act-dismiss');
  if (dismissBtn) dismissBtn.addEventListener('click', () => {
    dismissFromMinistry(Game.state, ch.ministry);
    hideModal();
    renderCabinetGrid(); renderCharacterGrid();
  });
  const missionBtn = document.getElementById('act-mission');
  if (missionBtn) missionBtn.addEventListener('click', () => openMissionModal(charId));
}

function openMissionModal(charId) {
  const ch = getCharacter(Game.state, charId);
  const eligibleTypes = missionTypesForCharacter(ch);
  const ownCountryName = ch.country ? (Game.state.relations.countries.find(c => c.id === ch.country) || {}).name : null;

  const optionsHtml = eligibleTypes.length
    ? eligibleTypes.map(t => `
        <div class="decision-option" data-mission="${t.id}">
          <div class="opt-label">${t.name}</div>
          <div class="opt-advisor">${t.desc}${t.autoTargetOwnCountry && ownCountryName ? ` سيمثل بلده (${ownCountryName}) تلقائياً دون الحاجة لاختيار هدف.` : ''}</div>
        </div>`).join('')
    : `<p class="hint">لا توجد مهام مناسبة لدور ${ch.name} حالياً.</p>`;

  const html = `
    <span class="modal-tag">تكليف بمهمة</span>
    <h2>اختر نوع المهمة لـ ${ch.name}</h2>
    <div class="decision-options">${optionsHtml}</div>
    <div class="nav-row"><button class="btn btn-ghost" id="modal-cancel">إلغاء</button></div>`;
  showModal(html);
  document.getElementById('modal-cancel').addEventListener('click', hideModal);
  document.querySelectorAll('[data-mission]').forEach(el => {
    el.addEventListener('click', () => {
      const type = MISSION_TYPES.find(t => t.id === el.dataset.mission);
      if (type.requiresCountry && !type.autoTargetOwnCountry) {
        hideModal();
        openMissionCountryModal(charId, type.id);
      } else {
        assignMission(Game.state, charId, type.id);
        hideModal();
        renderCharacterGrid();
        renderActiveMissionsPanel();
      }
    });
  });
}

function openMissionCountryModal(charId, missionTypeId) {
  const ch = getCharacter(Game.state, charId);
  const html = `
    <span class="modal-tag">اختر الدولة المستهدفة</span>
    <h2>مهمة دبلوماسية لـ ${ch.name}</h2>
    <div class="decision-options" style="max-height:50vh;overflow-y:auto">
      ${Game.state.relations.countries.map(c => `
        <div class="decision-option" data-country="${c.id}">
          <div class="opt-label">${c.name}</div>
          <div class="opt-advisor">مستوى العلاقة الحالي: ${Math.round(c.relation)}</div>
        </div>`).join('')}
    </div>`;
  showModal(html);
  document.querySelectorAll('[data-country]').forEach(el => {
    el.addEventListener('click', () => {
      assignMission(Game.state, charId, missionTypeId, el.dataset.country);
      hideModal();
      renderCharacterGrid();
      renderActiveMissionsPanel();
    });
  });
}

function refreshCharModal(charId, opinionHtml) {
  const ch = getCharacter(Game.state, charId);
  showModal(characterModalHtml(ch));
  if (opinionHtml) document.getElementById('char-opinion-slot').innerHTML = opinionHtml;
  bindCharacterModalActions(charId);
  renderCabinetGrid(); renderCharacterGrid(); renderCommandBar(); renderAttentionStrip(); renderDomainGrid();
}

function openAssignModal(ministryId, preselectedCharId) {
  const eligible = Game.state.characters.filter(c => c.category !== 'foreign');
  const html = `
    <span class="modal-tag">تعيين وزاري</span>
    <h2>${ministryId ? 'اختر شخصية لمنصب ' + MINISTRIES.find(m => m.id === ministryId).name : 'اختر المنصب الوزاري لـ ' + getCharacter(Game.state, preselectedCharId).name}</h2>
    <div class="decision-options" style="max-height:50vh;overflow-y:auto">
      ${ministryId
        ? eligible.map(c => `<div class="decision-option" data-char="${c.id}"><div class="opt-label">${c.name}</div><div class="opt-advisor">${c.role} - الكفاءة: ${c.stats.competence} / الفساد: ${c.stats.corruption}</div></div>`).join('')
        : MINISTRIES.map(m => `<div class="decision-option" data-ministry="${m.id}"><div class="opt-label">${m.name}</div><div class="opt-advisor">${Game.state.cabinet[m.id] ? 'مشغول حالياً بـ ' + getCharacter(Game.state, Game.state.cabinet[m.id]).name : 'شاغر'}</div></div>`).join('')}
    </div>`;
  showModal(html);
  document.querySelectorAll('[data-char]').forEach(el => {
    el.addEventListener('click', () => {
      appointToMinistry(Game.state, el.dataset.char, ministryId);
      hideModal();
      renderCabinetGrid(); renderCharacterGrid();
    });
  });
  document.querySelectorAll('[data-ministry]').forEach(el => {
    el.addEventListener('click', () => {
      appointToMinistry(Game.state, preselectedCharId, el.dataset.ministry);
      hideModal();
      renderCabinetGrid(); renderCharacterGrid();
    });
  });
}

function renderEndScreen(result) {
  const s = Game.state;
  document.getElementById('end-title').textContent = getTitle(s, result.reason);
  document.getElementById('end-reason').textContent = result.title;
  if (result.reason === 'completed' && computeFinalScore(s) >= 50) playGameOverGood(); else playGameOverBad();
  const indWrap = document.getElementById('end-indicators');
  indWrap.innerHTML = '';
  ['satisfaction', 'politicalStability', 'internationalSupport', 'economicDevelopment', 'security', 'poverty', 'unemployment', 'gdpGrowth'].forEach(key => {
    const meta = INDICATOR_META[key];
    const p = document.createElement('p');
    p.textContent = `${meta.name}: ${fmtNum(s.indicators[key])} ${meta.unit}`;
    indWrap.appendChild(p);
  });
  const achievementsHtml = s.achievements.length
    ? `<div class="achievements-row">${s.achievements.map(id => {
        const a = ACHIEVEMENTS.find(x => x.id === id);
        return a ? `<span class="achievement-badge" title="${a.desc}">🏆 ${a.name}</span>` : '';
      }).join('')}</div>`
    : '<p class="hint">لم تحقق أي إنجازات خاصة في هذه الفترة الرئاسية.</p>';
  const sumWrap = document.getElementById('end-summary');
  sumWrap.innerHTML = `
    <p>المدة التي حكمت فيها: ${s.month - 1} شهراً</p>
    <p>عدد القرارات المتخذة: ${s.decisionsLog.length}</p>
    <p>عدد الأحداث التي واجهتها: ${s.eventsLog.length}</p>
    <p>الدرجة النهائية: ${computeFinalScore(s)} / 100</p>
    <h4 style="margin-top:14px">الإنجازات</h4>
    ${achievementsHtml}`;
  showScreen('screen-end');
}

// ------- نوافذ منبثقة -------
// opts: { crisis: bool, dismissible: bool (افتراضي true), onDismiss: fn }
// القرارات والأحداث تُمرَّر بـ dismissible:false لأنها تتطلب اختياراً لإكمال الشهر،
// أما كل النوافذ الإدارية الأخرى (تعيين وزير، مهام، تفاصيل شخصية...) فقابلة للإغلاق دائماً دون اتخاذ أي إجراء
function showModal(html, opts) {
  opts = opts || {};
  const dismissible = opts.dismissible !== false;
  Game.modalDismiss = dismissible ? (opts.onDismiss || hideModal) : null;

  const box = document.getElementById('modal-box');
  const closeBtn = dismissible ? '<button type="button" class="modal-close-x" id="modal-close-x" aria-label="إغلاق">✕</button>' : '';
  box.innerHTML = closeBtn + html;
  box.classList.toggle('crisis-modal', !!opts.crisis);
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('active');
  if (dismissible) {
    document.getElementById('modal-close-x').addEventListener('click', () => Game.modalDismiss());
  }
}
function hideModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  Game.modalDismiss = null;
}

function renderReportModal(summary, onClose) {
  const s = Game.state;
  const hist = s.history;
  const prev = hist.length > 1 ? hist[hist.length - 2] : hist[0];
  const cur = hist[hist.length - 1];
  function deltaSpan(key) {
    const d = (cur[key] - prev[key]);
    const cls = d > 0 ? 'delta-pos' : d < 0 ? 'delta-neg' : '';
    const sign = d > 0 ? '+' : '';
    return `<span class="${cls}">${sign}${fmtNum(d)}</span>`;
  }
  const html = `
    <span class="modal-tag">التقرير الشهري</span>
    <h2>تقرير السنة ${s.year} - الشهر ${((s.month - 1) % 12) + 1}</h2>
    <div class="report-grid">
      <div class="r-item"><span>الإيرادات</span><b>${fmtNum(summary.totalRevenue, 0)}</b></div>
      <div class="r-item"><span>النفقات</span><b>${fmtNum(summary.totalExpenditure, 0)}</b></div>
      <div class="r-item"><span>رضا الشعب</span>${deltaSpan('satisfaction')}</div>
      <div class="r-item"><span>الاستقرار السياسي</span>${deltaSpan('politicalStability')}</div>
      <div class="r-item"><span>البطالة</span>${deltaSpan('unemployment')}</div>
      <div class="r-item"><span>التضخم</span>${deltaSpan('inflation')}</div>
      <div class="r-item"><span>الأمن</span>${deltaSpan('security')}</div>
      <div class="r-item"><span>الدين العام</span>${deltaSpan('publicDebt')}</div>
    </div>
    <div class="nav-row"><button class="btn btn-primary" id="modal-continue">متابعة</button></div>`;
  const dismiss = () => { hideModal(); onClose(); };
  showModal(html, { onDismiss: dismiss });
  document.getElementById('modal-continue').addEventListener('click', dismiss);
}

function effectPreviewHtml(effects) {
  if (!effects) return '';
  const entries = Object.entries(effects).filter(([, v]) => Math.abs(v) > 0.001);
  if (entries.length === 0) return '';
  entries.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const chips = entries.slice(0, 4).map(([key, delta]) => {
    const meta = INDICATOR_META[key];
    if (!meta) return '';
    const good = meta.good === 'low' ? delta < 0 : delta > 0;
    const sign = delta > 0 ? '+' : '';
    return `<span class="effect-chip ${good ? 'chip-good' : 'chip-bad'}">${meta.name} ${sign}${fmtNum(delta)}</span>`;
  }).join('');
  return `<div class="effect-preview">${chips}</div>`;
}

function renderDecisionModal(decision, onChoose) {
  const isCrisis = decision.severity === 'crisis';
  const html = `
    <span class="modal-tag">${isCrisis ? '⚠️ قرار طارئ' : 'قرار ' + decisionTypeLabel(decision.type)}</span>
    <h2>${decision.title}</h2>
    <p class="modal-desc">${decision.description}</p>
    <div class="decision-options">
      ${decision.options.map((o, i) => `
        <div class="decision-option" data-idx="${i}">
          <div class="opt-label">${o.label}</div>
          ${o.advisor ? `<div class="opt-advisor">💬 ${resolveAdvisorText(Game.state, decision, o)}</div>` : ''}
          ${effectPreviewHtml(o.immediate)}
        </div>`).join('')}
    </div>`;
  showModal(html, { crisis: isCrisis, dismissible: false });
  if (isCrisis) playCrisisAlert();
  document.querySelectorAll('.decision-option').forEach(el => {
    el.addEventListener('click', () => {
      const idx = Number(el.dataset.idx);
      hideModal();
      playDecisionResolve();
      onChoose(idx);
    });
  });
}

function decisionTypeLabel(t) {
  return { strategic: 'استراتيجي', tactical: 'تكتيكي', emergency: 'طارئ', diplomatic: 'دبلوماسي' }[t] || t;
}

function renderEventModal(event, onChoose) {
  const isCrisis = event.severity === 'crisis';
  const html = `
    <span class="modal-tag">${isCrisis ? '⚠️ حالة طارئة' : 'حدث عاجل'}</span>
    <h2>${event.title}</h2>
    <p class="modal-desc">${event.description}</p>
    <div class="decision-options">
      ${event.options.map((o, i) => `
        <div class="decision-option" data-idx="${i}">
          <div class="opt-label">${o.label}</div>
          ${effectPreviewHtml(o.immediate)}
        </div>`).join('')}
    </div>`;
  showModal(html, { crisis: isCrisis, dismissible: false });
  if (isCrisis) playCrisisAlert();
  document.querySelectorAll('.decision-option').forEach(el => {
    el.addEventListener('click', () => {
      const idx = Number(el.dataset.idx);
      hideModal();
      playDecisionResolve();
      onChoose(idx);
    });
  });
}

function renderAchievementModal(achievement, onClose) {
  const html = `
    <span class="modal-tag">إنجاز جديد 🏆</span>
    <h2>${achievement.name}</h2>
    <p class="modal-desc">${achievement.desc}</p>
    <div class="nav-row"><button class="btn btn-primary" id="modal-continue">رائع!</button></div>`;
  const dismiss = () => { hideModal(); onClose(); };
  showModal(html, { onDismiss: dismiss });
  playAchievement();
  document.getElementById('modal-continue').addEventListener('click', dismiss);
}

function showCorruptSaveModal(reason) {
  const html = `
    <span class="modal-tag">⚠️ تعذر تحميل اللعبة المحفوظة</span>
    <h2>مشكلة في ملف الحفظ</h2>
    <p class="modal-desc">${reason || 'حدث خطأ غير معروف أثناء قراءة اللعبة المحفوظة.'}<br><br>
    قد يكون الحفظ من إصدار قديم غير متوافق أو تعرّض للتلف. يمكنك مسح هذا الحفظ وبدء لعبة جديدة، أو الإبقاء عليه ومحاولة التحميل لاحقاً بعد تحديث اللعبة.</p>
    <div class="nav-row">
      <button class="btn btn-primary" id="modal-clear-save">مسح الحفظ التالف وإغلاق</button>
      <button class="btn btn-ghost" id="modal-continue">إبقاء الحفظ وإغلاق</button>
    </div>`;
  showModal(html);
  document.getElementById('modal-clear-save').addEventListener('click', () => {
    clearSave();
    document.getElementById('btn-continue').disabled = true;
    hideModal();
  });
  document.getElementById('modal-continue').addEventListener('click', hideModal);
}

function renderYearStartModal(onContinue) {
  const s = Game.state;
  const html = `
    <span class="modal-tag">بداية سنة جديدة</span>
    <h2>مطلع السنة ${s.year} - خطاب الدولة السنوي</h2>
    <p class="modal-desc">سيادة الرئيس، حان وقت مراجعة توزيع الميزانية العامة للسنة القادمة قبل المتابعة. توجه إلى تبويب "الميزانية" لضبط التوزيع إن رغبت، ثم اضغط متابعة.</p>
    <div class="nav-row"><button class="btn btn-primary" id="modal-continue">متابعة إلى السنة الجديدة</button></div>`;
  const dismiss = () => { hideModal(); onContinue(); };
  showModal(html, { onDismiss: dismiss });
  document.getElementById('modal-continue').addEventListener('click', dismiss);
}
