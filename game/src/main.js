// main.js — one job: the game state machine (start, move, guards, detection,
// pickups, exit, clear/caught/win) and the HUD/overlay wiring.
import { WORLD, PLAYER, GUARD, DETECTION, SCORING } from './config.js';
import { LEVELS, buildLevel } from './levels.js';
import { drawScene, rectsCollideCircle, segmentBlocked, sightBlockers, moveBlockers } from './render.js';
import * as audio from './audio.js';
import { input, bindInput, consumeFlags } from './input.js';
import { readShotParam, applyShot } from './shots.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const $ = (id) => document.getElementById(id);
const hud = {
  level: $('level-name'),
  artifacts: $('artifact-count'),
  suspicion: $('suspicion-fill'),
  suspicionLabel: $('suspicion-label'),
  score: $('score'),
  timer: $('timer'),
  sneak: $('sneak-tag'),
  alarm: $('alarm-banner'),
};

const G = {
  levelIndex: 0,
  level: null,
  player: { x: 480, y: 560, facing: -Math.PI / 2, sneaking: false },
  state: 'title', // title | playing | clear | caught | win
  score: 0,
  alarms: 0,
  elapsed: 0,
  animTime: 0,
  clearStars: 3,
  clearTimeSec: 0,
  frozenTimer: null,
  shotMode: false,
  maxSuspicion: 0,
  hidden: false,
  stepAcc: 0,
};
// Debug/test handle: play-tests read suspicion and counters through it.
window.__mothlight = G;

function coneParams(guard) {
  const halfDeg = guard.wide ? GUARD.wideConeHalfAngleDeg : GUARD.coneHalfAngleDeg;
  return {
    half: (halfDeg * Math.PI) / 180,
    range: guard.wide ? GUARD.wideRange : GUARD.range,
  };
}

export function loadLevel(g, index) {
  g.levelIndex = index;
  g.level = buildLevel(index);
  for (const guard of g.level.guards) {
    const p = coneParams(guard);
    guard.coneHalf = p.half;
    guard.range = p.range;
  }
  g.player.x = g.level.spawn.x;
  g.player.y = g.level.spawn.y;
  g.player.facing = -Math.PI / 2;
  g.player.sneaking = false;
  g.elapsed = 0;
  g.alarms = 0;
  g.maxSuspicion = 0;
  g.hidden = false;
  input.clickTarget = null;
}

function resetLevel() {
  loadLevel(G, G.levelIndex);
  G.state = 'playing';
  syncOverlays();
}

function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function pointInRects(x, y, rects) {
  return rects.some((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
}

function pointInCircles(x, y, circles) {
  return circles.some((c) => {
    const dx = x - c.x;
    const dy = y - c.y;
    return dx * dx + dy * dy < c.r * c.r;
  });
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

// Move a circle against the level's solid rects, axis by axis. Returns px moved.
function moveCircle(pos, radius, dx, dy, blockers) {
  let moved = 0;
  const nx = pos.x + dx;
  if (!blockers.some((b) => rectsCollideCircle(nx, pos.y, radius, b))) {
    pos.x = nx;
    moved += Math.abs(dx);
  }
  const ny = pos.y + dy;
  if (!blockers.some((b) => rectsCollideCircle(pos.x, ny, radius, b))) {
    pos.y = ny;
    moved += Math.abs(dy);
  }
  return moved;
}

function guardSeesPlayer(guard) {
  const dx = G.player.x - guard.x;
  const dy = G.player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > guard.range) return false;
  const ang = Math.atan2(dy, dx);
  if (angleDiff(ang, guard.facing) > guard.coneHalf) return false;
  if (segmentBlocked(guard.x, guard.y, G.player.x, G.player.y, sightBlockers(G.level))) return false;
  return true;
}

function detectionRate(guard, dist) {
  let rate = DETECTION.baseRate;
  if (pointInCircles(G.player.x, G.player.y, G.level.lights)) rate *= DETECTION.litMultiplier;
  if (pointInRects(G.player.x, G.player.y, G.level.shadows)) rate *= DETECTION.shadowMultiplier;
  if (G.player.sneaking) rate *= DETECTION.sneakMultiplier;
  rate *= 1 + DETECTION.nearBoost * (1 - dist / guard.range);
  return rate;
}

function updateGuards(dt) {
  const blockers = moveBlockers(G.level);
  for (const guard of G.level.guards) {
    const dist = Math.hypot(G.player.x - guard.x, G.player.y - guard.y);
    guard.seesPlayer = guardSeesPlayer(guard);

    // Suspicion rises when seen, falls when unseen.
    if (guard.seesPlayer) {
      guard.suspicion = Math.min(100, guard.suspicion + detectionRate(guard, dist) * dt);
      guard.unseenTimer = 0;
    } else {
      const decay = guard.state === 'chase' ? DETECTION.alarmDecayPerSec : DETECTION.decayPerSec;
      guard.suspicion = Math.max(0, guard.suspicion - decay * dt);
      guard.unseenTimer += dt;
    }

    if (guard.state === 'patrol') {
      if (guard.suspicion >= 100) {
        guard.state = 'chase';
        G.alarms += 1;
        G.score = Math.max(0, G.score + SCORING.perAlarm);
        audio.alarmSting();
      } else if (guard.pauseTimer > 0) {
        guard.pauseTimer -= dt;
        guard.scanPhase = (guard.scanPhase || 0) + dt;
        guard.facing = guard.scanBase + Math.sin(guard.scanPhase * 1.1) * (GUARD.scanSweepDeg * Math.PI / 180);
      } else {
        const target = guard.waypoints[guard.wpIndex];
        const dx = target[0] - guard.x;
        const dy = target[1] - guard.y;
        const d = Math.hypot(dx, dy);
        if (d < 6) {
          guard.wpIndex = (guard.wpIndex + 1) % guard.waypoints.length;
          guard.pauseTimer = guard.pause;
          guard.scanBase = guard.facing;
          guard.scanPhase = 0;
        } else {
          const step = (guard.speed * dt) / d;
          const moved = moveCircle(guard, 12, dx * step, dy * step, blockers);
          guard.facing = Math.atan2(dy, dx);
          guard.stepAcc += moved;
          if (guard.stepAcc > 30) {
            guard.stepAcc = 0;
            audio.stepGuard(dist, G.player.x - guard.x);
          }
        }
      }
    } else if (guard.state === 'chase') {
      if (guard.suspicion < DETECTION.returnThreshold && guard.unseenTimer > DETECTION.loseSightSec) {
        guard.state = 'return';
      } else {
        const dx = G.player.x - guard.x;
        const dy = G.player.y - guard.y;
        const d = Math.max(1, Math.hypot(dx, dy));
        const moved = moveCircle(guard, 12, (dx / d) * GUARD.chaseSpeed * dt, (dy / d) * GUARD.chaseSpeed * dt, blockers);
        guard.facing = Math.atan2(dy, dx);
        guard.stepAcc += moved;
        if (guard.stepAcc > 26) {
          guard.stepAcc = 0;
          audio.stepGuard(dist, G.player.x - guard.x);
        }
        if (d < DETECTION.catchRadius) {
          G.state = 'caught';
          audio.caughtThud();
          syncOverlays();
        }
      }
    } else {
      // return: walk back to the nearest waypoint, then resume patrol.
      let best = guard.waypoints[0];
      let bestD = Infinity;
      for (const w of guard.waypoints) {
        const d = Math.hypot(w[0] - guard.x, w[1] - guard.y);
        if (d < bestD) { bestD = d; best = w; }
      }
      const dx = best[0] - guard.x;
      const dy = best[1] - guard.y;
      if (bestD < 8) {
        guard.wpIndex = (guard.waypoints.indexOf(best) + 1) % guard.waypoints.length;
        guard.state = 'patrol';
        guard.pauseTimer = 0.5;
        guard.scanBase = guard.facing;
        guard.scanPhase = 0;
      } else {
        moveCircle(guard, 12, (dx / bestD) * guard.speed * dt, (dy / bestD) * guard.speed * dt, blockers);
        guard.facing = Math.atan2(dy, dx);
      }
    }
  }
  G.maxSuspicion = Math.max(0, ...G.level.guards.map((g) => g.suspicion));
  const anyChase = G.level.guards.some((g) => g.state === 'chase');
  G.hidden = pointInRects(G.player.x, G.player.y, G.level.shadows)
    && !G.level.guards.some((g) => g.seesPlayer);
  hud.alarm.style.display = anyChase ? 'block' : 'none';
}

function updatePlayer(dt) {
  let mx = 0;
  let my = 0;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (mx !== 0 || my !== 0) {
    input.clickTarget = null;
    const len = Math.hypot(mx, my);
    mx /= len;
    my /= len;
  } else if (input.clickTarget) {
    const dx = input.clickTarget.x - G.player.x;
    const dy = input.clickTarget.y - G.player.y;
    const d = Math.hypot(dx, dy);
    if (d < 6) {
      input.clickTarget = null;
    } else {
      mx = dx / d;
      my = dy / d;
    }
  }
  if (mx !== 0 || my !== 0) {
    const speed = input.sneak ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
    const moved = moveCircle(G.player, PLAYER.radius, mx * speed * dt, my * speed * dt, moveBlockers(G.level));
    G.player.facing = Math.atan2(my, mx);
    G.player.sneaking = !!input.sneak;
    G.stepAcc += moved;
    if (G.stepAcc > 26) {
      G.stepAcc = 0;
      audio.stepPlayer(G.player.sneaking);
    }
  } else {
    G.player.sneaking = !!input.sneak;
  }

  // Pick up artifacts by walking over them (E also grabs one nearby).
  const flags = consumeFlags();
  for (const a of G.level.artifacts) {
    if (a.taken) continue;
    const d = Math.hypot(a.x - G.player.x, a.y - G.player.y);
    if (d < PLAYER.pickupRadius || (flags.interact && d < 46)) {
      a.taken = true;
      G.score += SCORING.perArtifact;
      audio.pickupChime();
    }
  }
  if (flags.restart) resetLevel();
  if (flags.mute) toggleMute();

  // Exit: only open once every artifact is stolen.
  const allTaken = G.level.artifacts.every((a) => a.taken);
  if (allTaken) {
    const e = G.level.exit;
    const cx = Math.max(e.x, Math.min(G.player.x, e.x + e.w));
    const cy = Math.max(e.y, Math.min(G.player.y, e.y + e.h));
    const d = Math.hypot(G.player.x - cx, G.player.y - cy);
    if (d < PLAYER.radius + 4) clearLevel();
  }
}

function clearLevel() {
  const level = LEVELS[G.levelIndex];
  const timeBonus = Math.min(SCORING.maxTimeBonus, Math.max(0, level.parSec - G.elapsed) * SCORING.timeBonusPerSec);
  G.score += Math.round(timeBonus);
  G.clearStars = G.alarms === 0 ? 3 : G.alarms === 1 ? 2 : 1;
  G.clearTimeSec = G.elapsed;
  audio.clearJingle();
  G.state = G.levelIndex === LEVELS.length - 1 ? 'win' : 'clear';
  syncOverlays();
}

function updateHUD() {
  const taken = G.level.artifacts.filter((a) => a.taken).length;
  hud.level.textContent = `${G.level.name} — ${G.level.subtitle}`;
  hud.artifacts.textContent = `Artifacts ${taken}/${G.level.artifacts.length}`;
  const sus = Math.round(G.maxSuspicion);
  hud.suspicion.style.width = `${sus}%`;
  hud.suspicion.style.background = sus > 66 ? '#e0483e' : '#f2a541';
  hud.suspicionLabel.textContent = `Suspicion ${sus}%`;
  hud.score.textContent = `Score ${G.score}`;
  hud.timer.textContent = G.frozenTimer || fmtTime(G.elapsed);
  hud.sneak.style.visibility = G.player.sneaking ? 'visible' : 'hidden';
}

function syncOverlays() {
  $('title-overlay').style.display = G.state === 'title' ? 'flex' : 'none';
  $('clear-overlay').style.display = G.state === 'clear' ? 'flex' : 'none';
  $('caught-overlay').style.display = G.state === 'caught' ? 'flex' : 'none';
  $('win-overlay').style.display = G.state === 'win' ? 'flex' : 'none';
  if (G.state === 'clear') {
    $('clear-stars').textContent = '★'.repeat(G.clearStars) + '☆'.repeat(3 - G.clearStars);
    $('clear-score').textContent = `Score ${G.score}`;
    $('clear-time').textContent = `Time ${fmtTime(G.clearTimeSec)} — ${G.alarms === 0 ? 'never seen' : `alarmed ${G.alarms} time${G.alarms > 1 ? 's' : ''}`}`;
    $('next-btn').textContent = `Next: ${LEVELS[G.levelIndex + 1].name} →`;
  }
  if (G.state === 'win') {
    $('win-score').textContent = `Final score ${G.score} — every seal stolen, every guard fooled.`;
  }
  updateHUD();
}

function toggleMute() {
  const m = !audio.isMuted();
  audio.setMuted(m);
  $('mute-btn').textContent = m ? 'Sound: Off (M)' : 'Sound: On (M)';
}

function update(dt) {
  if (G.state !== 'playing') return;
  G.elapsed += dt;
  updatePlayer(dt);
  if (G.state === 'playing') updateGuards(dt);
  updateHUD();
}

let lastT = 0;
function frame(t) {
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0);
  lastT = t;
  G.animTime += dt;
  if (!G.shotMode) update(dt);
  drawScene(ctx, {
    level: G.level,
    player: G.player,
    guards: G.level.guards,
    alarmActive: G.level.guards.some((g) => g.state === 'chase'),
    hidden: G.hidden,
    timeSec: G.animTime,
  });
  requestAnimationFrame(frame);
}

function bindUI() {
  $('play-btn').addEventListener('click', () => {
    audio.ensureAudio();
    audio.clickBlip();
    resetLevel();
  });
  $('next-btn').addEventListener('click', () => {
    audio.ensureAudio();
    audio.clickBlip();
    loadLevel(G, G.levelIndex + 1);
    G.state = 'playing';
    syncOverlays();
  });
  $('retry-btn').addEventListener('click', () => {
    audio.ensureAudio();
    audio.clickBlip();
    resetLevel();
  });
  $('again-btn').addEventListener('click', () => {
    audio.ensureAudio();
    audio.clickBlip();
    G.score = 0;
    loadLevel(G, 0);
    G.state = 'playing';
    syncOverlays();
  });
  $('restart-btn').addEventListener('click', () => {
    audio.ensureAudio();
    resetLevel();
  });
  $('mute-btn').addEventListener('click', () => {
    audio.ensureAudio();
    toggleMute();
  });
  window.addEventListener('pointerdown', () => audio.ensureAudio(), { once: true });
}

bindInput(canvas);
bindUI();
loadLevel(G, 0);
G.state = 'title';

const shot = readShotParam();
if (shot) {
  applyShot(G, shot, loadLevel);
  // Frozen shots never run updateGuards, so sync the HUD state the staging
  // implies: suspicion meter, alarm banner, and the HIDDEN tag.
  G.maxSuspicion = Math.max(0, ...G.level.guards.map((g) => g.suspicion));
  G.hidden = pointInRects(G.player.x, G.player.y, G.level.shadows)
    && !G.level.guards.some((g) => guardSeesPlayer(g));
  hud.alarm.style.display = G.level.guards.some((g) => g.state === 'chase') ? 'block' : 'none';
  syncOverlays();
  updateHUD();
} else {
  syncOverlays();
}
requestAnimationFrame(frame);
