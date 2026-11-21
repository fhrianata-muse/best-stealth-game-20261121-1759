// audio.js — one job: every sound, synthesised with WebAudio (no audio files).
// Guard footsteps get louder and panned by how close the guard is, so the
// player can hear where a guard is without seeing it.
let ctx = null;
let master = null;
let muted = false;

export function ensureAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
}

export function setMuted(m) {
  muted = m;
  if (master) master.gain.value = m ? 0 : 0.5;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type, vol, when = 0, slideTo = null) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, vol, filterFreq, pan = 0) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const gain = ctx.createGain();
  gain.gain.value = vol;
  const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  src.connect(filter);
  filter.connect(gain);
  if (panner) {
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    gain.connect(panner);
    panner.connect(master);
  } else {
    gain.connect(master);
  }
  src.start(t0);
}

// Soft paper step for the player; quieter while sneaking.
export function stepPlayer(sneaking) {
  noiseBurst(0.07, sneaking ? 0.05 : 0.11, sneaking ? 500 : 900);
}

// A guard's step: volume falls with distance, panned left/right by dx.
export function stepGuard(dist, dx) {
  const vol = Math.max(0, 0.34 * (1 - dist / 520));
  if (vol <= 0.01) return;
  const pan = Math.max(-0.8, Math.min(0.8, dx / 260));
  noiseBurst(0.09, vol, 420, pan);
}

export function alarmSting() {
  tone(220, 0.22, 'sawtooth', 0.16);
  tone(311, 0.3, 'sawtooth', 0.16, 0.16);
  tone(220, 0.3, 'sawtooth', 0.14, 0.34, 180);
}

export function pickupChime() {
  tone(660, 0.12, 'sine', 0.18);
  tone(880, 0.12, 'sine', 0.18, 0.09);
  tone(1320, 0.2, 'sine', 0.14, 0.18);
}

export function clearJingle() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.16, i * 0.11));
}

export function caughtThud() {
  tone(110, 0.4, 'sawtooth', 0.2, 0, 55);
  noiseBurst(0.25, 0.2, 300);
}

export function clickBlip() {
  tone(520, 0.06, 'sine', 0.1);
}
