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

const INDICATOR_KEYS = ['satisfaction', 'budgetBalance', 'treasury', 'gdpGrowth', 'unemployment', 'inflation',
  'publicDebt', 'forexReserves', 'poverty', 'politicalStability', 'internationalSupport',
  'oilProduction', 'educationLevel', 'healthLevel', 'infrastructureLevel', 'security', 'economicDevelopment',
  'agricultureLevel', 'tourismLevel', 'industryLevel', 'tradeBalance'];

function renderIndicatorCards() {
  const s = Game.state;
  const wrap = document.getElementById('indicator-cards');
  const isFirstRender = wrap.children.length === 0;
  if (!Game.prevIndicators) Game.prevIndicators = {};

  if (isFirstRender) {
    wrap.innerHTML = '';
    INDICATOR_KEYS.forEach(key => {
      const meta = INDICATOR_META[key];
      const val = s.indicators[key];
      const card = document.createElement('div');
      card.className = `ind-card ${indicatorColor(key, val)}`;
      card.dataset.key = key;
      card.innerHTML = `<div class="ind-name">${meta.name}</div><div class="ind-value" data-num>${fmtNum(val)}</div><div class="ind-unit">${meta.unit}</div>`;
      wrap.appendChild(card);
      Game.prevIndicators[key] = val;
    });
    return;
  }

  INDICATOR_KEYS.forEach(key => {
    const meta = INDICATOR_META[key];
    const newVal = s.indicators[key];
    const oldVal = Game.prevIndicators[key] !== undefined ? Game.prevIndicators[key] : newVal;
    const card = wrap.querySelector(`.ind-card[data-key="${key}"]`);
    if (!card) return;
    card.className = `ind-card ${indicatorColor(key, newVal)}`;
    const numEl = card.querySelector('[data-num]');
    if (Math.abs(newVal - oldVal) > 0.001) {
      const good = meta.good === 'low' ? newVal < oldVal : newVal > oldVal;
      card.classList.add(good ? 'flash-good' : 'flash-bad');
      setTimeout(() => card.classList.remove('flash-good', 'flash-bad'), 1200);
      animateNumber(numEl, oldVal, newVal, 600);
    } else {
      numEl.textContent = fmtNum(newVal);
    }
    Game.prevIndicators[key] = newVal;
  });
}

function animateNumber(el, from, to, duration) {
  const start = performance.now();
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const current = from + (to - from) * eased;
    el.textContent = fmtNum(current);
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
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
  const html = `
    <span class="modal-tag">تكليف بمهمة</span>
    <h2>اختر نوع المهمة لـ ${ch.name}</h2>
    <div class="decision-options">
      ${MISSION_TYPES.map(t => `
        <div class="decision-option" data-mission="${t.id}">
          <div class="opt-label">${t.name}</div>
          <div class="opt-advisor">تستغرق ${t.duration} أشهر، تؤثر على ${INDICATOR_META[t.effectKey].name}${t.requiresCountry ? ' تجاه دولة محددة' : ''}.</div>
        </div>`).join('')}
    </div>`;
  showModal(html);
  document.querySelectorAll('[data-mission]').forEach(el => {
    el.addEventListener('click', () => {
      const type = MISSION_TYPES.find(t => t.id === el.dataset.mission);
      if (type.requiresCountry) {
        hideModal();
        openMissionCountryModal(charId, type.id);
      } else {
        const res = assignMission(Game.state, charId, type.id);
        hideModal();
        renderCharacterGrid();
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
    });
  });
}

function refreshCharModal(charId, opinionHtml) {
  const ch = getCharacter(Game.state, charId);
  document.getElementById('modal-box').innerHTML = characterModalHtml(ch);
  if (opinionHtml) document.getElementById('char-opinion-slot').innerHTML = opinionHtml;
  bindCharacterModalActions(charId);
  renderCabinetGrid(); renderCharacterGrid(); renderIndicatorCards();
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
function showModal(html, isCrisis) {
  const box = document.getElementById('modal-box');
  box.innerHTML = html;
  box.classList.toggle('crisis-modal', !!isCrisis);
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
          ${o.advisor ? `<div class="opt-advisor">💬 ${o.advisor}</div>` : ''}
          ${effectPreviewHtml(o.immediate)}
        </div>`).join('')}
    </div>`;
  showModal(html, isCrisis);
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
  showModal(html, isCrisis);
  document.querySelectorAll('.decision-option').forEach(el => {
    el.addEventListener('click', () => {
      const idx = Number(el.dataset.idx);
      hideModal();
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
  showModal(html);
  document.getElementById('modal-continue').addEventListener('click', () => { hideModal(); onClose(); });
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
