// المتحكم الرئيسي في اللعبة
const Game = {
  state: null,
  selectedScenario: null,
  selectedBackground: null,
  queue: [],
  modalDismiss: null // الدالة التي تُستدعى لإغلاق النافذة المنبثقة الحالية (null إن كانت تتطلب اختياراً إجبارياً)
};

document.addEventListener('DOMContentLoaded', () => {
  bindStartScreen();
  bindCharacterScreen();
  bindGameScreen();
  bindEndScreen();
  bindBackButtons();
  bindThemeToggle();
  bindSoundToggle();
  bindGlobalClickSound();
  bindModalBackdropClose();

  document.getElementById('btn-continue').disabled = !hasSavedGame();
});

function bindModalBackdropClose() {
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay' && Game.modalDismiss) {
      Game.modalDismiss();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && Game.modalDismiss) {
      Game.modalDismiss();
    }
  });
}

function applyMuteIcon() {
  const icon = Sound.muted ? '🔇' : '🔊';
  const t1 = document.getElementById('btn-sound-toggle');
  const t2 = document.getElementById('btn-sound-toggle-start');
  if (t1) t1.textContent = icon;
  if (t2) t2.textContent = icon + ' الصوت';
}

function bindSoundToggle() {
  applyMuteIcon();
  function toggle() { toggleMute(); applyMuteIcon(); }
  document.getElementById('btn-sound-toggle').addEventListener('click', toggle);
  document.getElementById('btn-sound-toggle-start').addEventListener('click', toggle);
}

function bindGlobalClickSound() {
  document.addEventListener('click', (e) => {
    if (e.target.closest('.btn, .decision-option, .option-card, .tab-btn, .char-filter-btn')) {
      playClick();
    }
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = theme === 'light' ? '☀️' : '🌙';
  const t1 = document.getElementById('btn-theme-toggle');
  const t2 = document.getElementById('btn-theme-toggle-start');
  if (t1) t1.textContent = icon;
  if (t2) t2.textContent = icon + ' الوضع الليلي/النهاري';
  localStorage.setItem('rayyes_libya_theme', theme);
}

function bindThemeToggle() {
  const saved = localStorage.getItem('rayyes_libya_theme') || 'dark';
  applyTheme(saved);
  function toggle() {
    const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(current);
  }
  document.getElementById('btn-theme-toggle').addEventListener('click', toggle);
  document.getElementById('btn-theme-toggle-start').addEventListener('click', toggle);
}

function bindBackButtons() {
  document.querySelectorAll('[data-back]').forEach(btn => {
    btn.addEventListener('click', () => showScreen(btn.dataset.back));
  });
}

function bindStartScreen() {
  document.getElementById('btn-new-game').addEventListener('click', () => {
    showScreen('screen-scenario');
    renderScenarioList();
  });
  document.getElementById('btn-continue').addEventListener('click', () => {
    const result = loadGame();
    if (!result.ok) {
      showCorruptSaveModal(result.reason);
      return;
    }
    Game.state = result.state;
    Game.prevGovernanceScore = undefined;
    Game.mapLayer = 'loyalty';
    Game.selectedTrendKeys = ['satisfaction'];
    showScreen('screen-game');
    renderGameScreen();
  });
  document.getElementById('btn-how-to-play').addEventListener('click', () => {
    showModal(`
      <span class="modal-tag">دليل اللعبة</span>
      <h2>كيف ألعب رئيس ليبيا؟</h2>
      <p class="modal-desc">
      تتولى منصب رئيس ليبيا لمدة أربع سنوات (48 شهراً). كل شهر ستحصل على تقرير موجز، وقد تواجه قرارات استراتيجية أو تكتيكية وأحداثاً عشوائية تتطلب استجابتك.
      وزّع الميزانية العامة بين القطاعات من تبويب "الميزانية"، وراقب مؤشرات الرضا الشعبي والاقتصاد والأمن والعلاقات الدولية من لوحة المؤشرات.
      إهمال قطاع ما لفترة طويلة يضر بمؤشراته، والإنفاق المفرط دون إيرادات كافية يقود لعجز وديون. حافظ على التوازن لتُكمل فترتك الرئاسية بنجاح!
      </p>
      <div class="nav-row"><button class="btn btn-primary" id="modal-continue">فهمت</button></div>`);
    document.getElementById('modal-continue').addEventListener('click', hideModal);
  });
}

function bindCharacterScreen() {
  document.getElementById('btn-start-intro').addEventListener('click', () => {
    const nameInput = document.getElementById('input-president-name');
    const name = nameInput.value.trim() || 'الرئيس';
    if (!Game.selectedScenario) { showScreen('screen-scenario'); return; }
    if (!Game.selectedBackground) Game.selectedBackground = POLITICAL_BACKGROUNDS[0].id;

    Game.state = createInitialState(Game.selectedScenario, name, Game.selectedBackground, {});
    Game.state.history.push(snapshotIndicators(Game.state));
    Game.prevGovernanceScore = undefined;
    Game.mapLayer = 'loyalty';
    Game.selectedTrendKeys = ['satisfaction'];
    renderIntro();
    showScreen('screen-intro');
  });
  document.getElementById('btn-begin-rule').addEventListener('click', () => {
    showScreen('screen-game');
    renderGameScreen();
  });
}

function snapshotIndicators(state, tickSummary) {
  return {
    month: state.month, ...state.indicators, oilPrice: state.economy.oilPrice,
    totalRevenue: tickSummary ? tickSummary.totalRevenue : 0,
    totalExpenditure: tickSummary ? tickSummary.totalExpenditure : 0
  };
}

function bindGameScreen() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });

  document.getElementById('btn-save').addEventListener('click', () => {
    saveGame(Game.state);
    flashSaveButton();
  });

  document.getElementById('btn-next-month').addEventListener('click', () => {
    document.getElementById('btn-next-month').disabled = true;
    advanceMonth();
  });

  bindMapLayerToggle();
  bindDashboardQuickNav();
  bindEconomySubTabs();
}

function flashSaveButton() {
  const btn = document.getElementById('btn-save');
  const original = btn.textContent;
  btn.textContent = 'تم الحفظ ✓';
  setTimeout(() => { btn.textContent = original; }, 1500);
}

function bindEndScreen() {
  document.getElementById('btn-play-again').addEventListener('click', () => {
    clearSave();
    Game.state = null;
    Game.selectedScenario = null;
    Game.selectedBackground = null;
    showScreen('screen-scenario');
    renderScenarioList();
  });
  document.getElementById('btn-back-menu').addEventListener('click', () => {
    showScreen('screen-start');
  });
}

// ------- تدفق تقدم الشهر -------
function advanceMonth() {
  const s = Game.state;
  Game.queue = [];

  const isNewYearStart = s.month > 1 && (s.month - 1) % 12 === 0;
  if (isNewYearStart) {
    Game.queue.push({ type: 'yearstart' });
  }

  Game.queue.push({ type: 'tick' });
  Game.queue.push({ type: 'report' });

  const decisionCount = Math.random() < 0.35 ? 2 : 1;
  const decisions = getAvailableDecisions(s, decisionCount);
  decisions.forEach(d => Game.queue.push({ type: 'decision', payload: d }));

  const event = rollEvent(s);
  if (event) Game.queue.push({ type: 'event', payload: event });

  Game.queue.push({ type: 'checkend' });

  processQueue();
}

let lastTickSummary = null;

function processQueue() {
  if (Game.queue.length === 0) {
    document.getElementById('btn-next-month').disabled = false;
    renderGameScreen();
    return;
  }
  const step = Game.queue.shift();
  const s = Game.state;

  if (step.type === 'yearstart') {
    renderYearStartModal(() => processQueue());
    return;
  }

  if (step.type === 'tick') {
    processScheduledEffects(s);
    lastTickSummary = monthlyEconomicTick(s);
    monthlyRelationsTick(s);
    updatePoliticalCapital(s);
    updateRivalApproval(s);
    advanceSchemes(s);
    const cabinetResults = applyCabinetMonthlyEffects(s);
    s.history.push(snapshotIndicators(s, lastTickSummary));
    if (s.history.length > 60) s.history.shift();
    const unlocked = checkAchievements(s);
    unlocked.forEach(a => Game.queue.unshift({ type: 'achievement', payload: a }));
    (cabinetResults.missions || []).forEach(r => Game.queue.unshift({ type: 'missionResult', payload: r }));
    (cabinetResults.turnovers || []).forEach(r => Game.queue.unshift({ type: 'turnoverResult', payload: r }));
    processQueue();
    return;
  }

  if (step.type === 'missionResult') {
    renderMissionResultModal(step.payload, () => processQueue());
    return;
  }

  if (step.type === 'turnoverResult') {
    renderTurnoverModal(step.payload, () => processQueue());
    return;
  }

  if (step.type === 'report') {
    renderReportModal(lastTickSummary, () => processQueue());
    return;
  }

  if (step.type === 'achievement') {
    renderAchievementModal(step.payload, () => processQueue());
    return;
  }

  if (step.type === 'decision') {
    renderDecisionModal(step.payload, (idx) => {
      const outcome = applyDecisionOption(s, step.payload, idx);
      if (outcome && outcome.electionResult) {
        renderElectionResultModal(outcome.electionResult, () => processQueue());
      } else {
        processQueue();
      }
    });
    return;
  }

  if (step.type === 'event') {
    renderEventModal(step.payload, (idx) => {
      applyEventOption(s, step.payload, idx);
      processQueue();
    });
    return;
  }

  if (step.type === 'checkend') {
    const result = checkGameOver(s);
    s.month += 1;
    s.year = Math.min(4, Math.max(1, Math.ceil(s.month / 12)));
    if (result.over) {
      s.gameOver = true;
      s.gameOverReason = result.reason;
      saveGame(s);
      renderEndScreen(result);
      return;
    }
    saveGame(s);
    processQueue();
    return;
  }
}
