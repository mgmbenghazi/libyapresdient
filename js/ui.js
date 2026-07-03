// طبقة العرض - دوال بناء الواجهة من حالة اللعبة
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
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

function renderIndicatorCards() {
  const s = Game.state;
  const wrap = document.getElementById('indicator-cards');
  wrap.innerHTML = '';
  const keys = ['satisfaction', 'budgetBalance', 'treasury', 'gdpGrowth', 'unemployment', 'inflation',
    'publicDebt', 'forexReserves', 'poverty', 'politicalStability', 'internationalSupport',
    'oilProduction', 'educationLevel', 'healthLevel', 'infrastructureLevel', 'security', 'economicDevelopment'];
  keys.forEach(key => {
    const meta = INDICATOR_META[key];
    const val = s.indicators[key];
    const color = indicatorColor(key, val);
    const card = document.createElement('div');
    card.className = `ind-card ${color}`;
    card.innerHTML = `<div class="ind-name">${meta.name}</div><div class="ind-value">${fmtNum(val)}</div><div class="ind-unit">${meta.unit}</div>`;
    wrap.appendChild(card);
  });
}

function renderCharts() {
  const hist = Game.state.history;
  drawLineChart(document.getElementById('chart-satisfaction'), hist.map(h => h.satisfaction), { color: '#3fbf5e', min: 0, max: 100 });
  drawLineChart(document.getElementById('chart-growth'), hist.map(h => h.gdpGrowth), { color: '#C9A227' });
  drawLineChart(document.getElementById('chart-oil'), hist.map(h => h.oilProduction), { color: '#4aa8e0' });
}

function renderRegions() {
  const s = Game.state;
  const wrap = document.getElementById('regions-row');
  wrap.innerHTML = '';
  REGIONS.forEach(r => {
    const tribesInRegion = s.relations.tribes.filter(t => t.region === r.id);
    const avgLoyalty = tribesInRegion.length ? tribesInRegion.reduce((a, t) => a + t.loyalty, 0) / tribesInRegion.length : 50;
    const div = document.createElement('div');
    div.className = 'region-card';
    div.innerHTML = `<div class="rname">${r.name}</div><div class="region-bar"><div class="region-bar-fill" style="width:${avgLoyalty}%"></div></div><div style="margin-top:4px;font-size:.8rem;color:var(--text-dim)">الولاء: ${fmtNum(avgLoyalty, 0)}%</div>`;
    wrap.appendChild(div);
  });
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
  renderBudgetSummary();
}

function renderBudgetSummary() {
  const s = Game.state;
  const total = Object.values(s.budget.allocations).reduce((a, b) => a + b, 0);
  const wrap = document.getElementById('budget-summary');
  wrap.innerHTML = `
    <div>إجمالي النسب: <b>${total}%</b> (يُعاد توزيعها تناسبياً تلقائياً)</div>
    <div>الخزينة العامة: <b>${fmtNum(s.indicators.treasury, 0)}</b> مليون د.ل</div>
    <div>سعر النفط الحالي: <b>${fmtNum(s.economy.oilPrice, 0)}</b> (مؤشر نسبي)</div>`;
}

function relColor(v) { return v >= 60 ? 'var(--good)' : v >= 35 ? 'var(--medium)' : 'var(--bad)'; }

function renderRelationsTab() {
  const s = Game.state;
  function fillList(elId, items, nameKey, valKey) {
    const wrap = document.getElementById(elId);
    wrap.innerHTML = '';
    items.forEach(it => {
      const v = it[valKey];
      const row = document.createElement('div');
      row.className = 'rel-item';
      row.innerHTML = `<span>${it[nameKey]}</span><div class="rel-bar"><div class="rel-bar-fill" style="width:${v}%;background:${relColor(v)}"></div></div>`;
      wrap.appendChild(row);
    });
  }
  fillList('rel-tribes', s.relations.tribes, 'name', 'loyalty');
  fillList('rel-parties', s.relations.parties, 'name', 'support');
  fillList('rel-institutions', s.relations.institutions, 'name', 'legitimacy');
  fillList('rel-countries', s.relations.countries, 'name', 'relation');
  fillList('rel-orgs', s.relations.orgs, 'name', 'relation');
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
  renderIndicatorCards();
  renderCharts();
  renderRegions();
  renderBudgetTab();
  renderRelationsTab();
  renderLogTab();
}

function renderEndScreen(result) {
  const s = Game.state;
  document.getElementById('end-title').textContent = getTitle(s, result.reason);
  document.getElementById('end-reason').textContent = result.title;
  const indWrap = document.getElementById('end-indicators');
  indWrap.innerHTML = '';
  ['satisfaction', 'politicalStability', 'internationalSupport', 'economicDevelopment', 'security', 'poverty', 'unemployment', 'gdpGrowth'].forEach(key => {
    const meta = INDICATOR_META[key];
    const p = document.createElement('p');
    p.textContent = `${meta.name}: ${fmtNum(s.indicators[key])} ${meta.unit}`;
    indWrap.appendChild(p);
  });
  const sumWrap = document.getElementById('end-summary');
  sumWrap.innerHTML = `
    <p>المدة التي حكمت فيها: ${s.month - 1} شهراً</p>
    <p>عدد القرارات المتخذة: ${s.decisionsLog.length}</p>
    <p>عدد الأحداث التي واجهتها: ${s.eventsLog.length}</p>
    <p>الدرجة النهائية: ${computeFinalScore(s)} / 100</p>`;
  showScreen('screen-end');
}

// ------- نوافذ منبثقة -------
function showModal(html, buttons) {
  document.getElementById('modal-box').innerHTML = html;
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('active');
}
function hideModal() {
  document.getElementById('modal-overlay').classList.remove('active');
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
  showModal(html);
  document.getElementById('modal-continue').addEventListener('click', () => { hideModal(); onClose(); });
}

function renderDecisionModal(decision, onChoose) {
  const html = `
    <span class="modal-tag">قرار ${decisionTypeLabel(decision.type)}</span>
    <h2>${decision.title}</h2>
    <p class="modal-desc">${decision.description}</p>
    <div class="decision-options">
      ${decision.options.map((o, i) => `
        <div class="decision-option" data-idx="${i}">
          <div class="opt-label">${o.label}</div>
          ${o.advisor ? `<div class="opt-advisor">💬 ${o.advisor}</div>` : ''}
        </div>`).join('')}
    </div>`;
  showModal(html);
  document.querySelectorAll('.decision-option').forEach(el => {
    el.addEventListener('click', () => {
      const idx = Number(el.dataset.idx);
      hideModal();
      onChoose(idx);
    });
  });
}

function decisionTypeLabel(t) {
  return { strategic: 'استراتيجي', tactical: 'تكتيكي', emergency: 'طارئ', diplomatic: 'دبلوماسي' }[t] || t;
}

function renderEventModal(event, onChoose) {
  const html = `
    <span class="modal-tag">حدث عاجل</span>
    <h2>${event.title}</h2>
    <p class="modal-desc">${event.description}</p>
    <div class="decision-options">
      ${event.options.map((o, i) => `
        <div class="decision-option" data-idx="${i}">
          <div class="opt-label">${o.label}</div>
        </div>`).join('')}
    </div>`;
  showModal(html);
  document.querySelectorAll('.decision-option').forEach(el => {
    el.addEventListener('click', () => {
      const idx = Number(el.dataset.idx);
      hideModal();
      onChoose(idx);
    });
  });
}

function renderYearStartModal(onContinue) {
  const s = Game.state;
  const html = `
    <span class="modal-tag">بداية سنة جديدة</span>
    <h2>مطلع السنة ${s.year} - خطاب الدولة السنوي</h2>
    <p class="modal-desc">سيادة الرئيس، حان وقت مراجعة توزيع الميزانية العامة للسنة القادمة قبل المتابعة. توجه إلى تبويب "الميزانية" لضبط التوزيع إن رغبت، ثم اضغط متابعة.</p>
    <div class="nav-row"><button class="btn btn-primary" id="modal-continue">متابعة إلى السنة الجديدة</button></div>`;
  showModal(html);
  document.getElementById('modal-continue').addEventListener('click', () => { hideModal(); onContinue(); });
}
