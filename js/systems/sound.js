// نظام صوتي بسيط مُصنَّع برمجياً عبر Web Audio API - لا يحتاج ملفات صوتية
const Sound = {
  ctx: null,
  muted: localStorage.getItem('rayyes_libya_muted') === '1'
};

function ensureAudioCtx() {
  if (!Sound.ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) Sound.ctx = new AC();
  }
  return Sound.ctx;
}

function beep(freq, duration, type, vol) {
  if (Sound.muted) return;
  const ctx = ensureAudioCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  gain.gain.value = vol !== undefined ? vol : 0.12;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;
  osc.start(now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.stop(now + duration);
}

function playClick() { beep(600, 0.05, 'square', 0.04); }
function playDecisionResolve() { beep(440, 0.12, 'sine', 0.1); setTimeout(() => beep(660, 0.14, 'sine', 0.1), 90); }
function playAchievement() { beep(523, 0.12, 'sine', 0.12); setTimeout(() => beep(659, 0.12, 'sine', 0.12), 110); setTimeout(() => beep(784, 0.22, 'sine', 0.12), 220); }
function playCrisisAlert() { beep(220, 0.25, 'sawtooth', 0.1); setTimeout(() => beep(196, 0.3, 'sawtooth', 0.1), 200); }
function playGameOverGood() { beep(392, 0.18, 'sine', 0.12); setTimeout(() => beep(523, 0.18, 'sine', 0.12), 180); setTimeout(() => beep(659, 0.35, 'sine', 0.12), 360); }
function playGameOverBad() { beep(220, 0.35, 'sawtooth', 0.12); setTimeout(() => beep(147, 0.5, 'sawtooth', 0.12), 280); }
function playMilestone() { beep(523, 0.12, 'sine', 0.12); setTimeout(() => beep(659, 0.12, 'sine', 0.12), 110); setTimeout(() => beep(784, 0.12, 'sine', 0.12), 220); setTimeout(() => beep(1046, 0.28, 'sine', 0.12), 330); }

function toggleMute() {
  Sound.muted = !Sound.muted;
  localStorage.setItem('rayyes_libya_muted', Sound.muted ? '1' : '0');
  return Sound.muted;
}
