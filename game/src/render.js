// render.js — one job: draw the whole archive (floor, light, cones, actors).
// Also owns the geometry helpers main.js uses for sight and collision.
import { WORLD } from './config.js';
import { mulberry32 } from './random.js';

// ---- geometry helpers (shared with main.js) ----
export function rectsCollideCircle(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

function rayHitRect(ox, oy, dx, dy, rect) {
  // Slab method; returns distance t along the ray, or Infinity.
  let tmin = 0;
  let tmax = Infinity;
  const axes = [
    [ox, dx, rect.x, rect.x + rect.w],
    [oy, dy, rect.y, rect.y + rect.h],
  ];
  for (const [o, d, lo, hi] of axes) {
    if (Math.abs(d) < 1e-9) {
      if (o < lo || o > hi) return Infinity;
    } else {
      let t1 = (lo - o) / d;
      let t2 = (hi - o) / d;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return Infinity;
    }
  }
  return tmin;
}

export function segmentBlocked(x1, y1, x2, y2, blockers) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return false;
  const ux = dx / len;
  const uy = dy / len;
  for (const b of blockers) {
    const t = rayHitRect(x1, y1, ux, uy, b);
    if (t < len) return true;
  }
  return false;
}

export function sightBlockers(level) {
  return [...level.walls, ...level.cover.filter((c) => c.tall)];
}

export function moveBlockers(level) {
  return [...level.walls, ...level.cover];
}

function coneRayLength(ox, oy, angle, range, blockers) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let best = range;
  for (const b of blockers) {
    const t = rayHitRect(ox, oy, dx, dy, b);
    if (t < best) best = Math.max(8, t);
  }
  return best;
}

// ---- static grain overlay (seeded, drawn once per page load) ----
let grainCanvas = null;
function getGrain() {
  if (grainCanvas) return grainCanvas;
  grainCanvas = document.createElement('canvas');
  grainCanvas.width = WORLD.w;
  grainCanvas.height = WORLD.h;
  const g = grainCanvas.getContext('2d');
  const rng = mulberry32(20261122);
  g.fillStyle = 'rgba(255,255,255,0.03)';
  for (let i = 0; i < 900; i += 1) {
    g.fillRect(rng() * WORLD.w, rng() * WORLD.h, 1.4, 1.4);
  }
  g.fillStyle = 'rgba(0,0,0,0.05)';
  for (let i = 0; i < 700; i += 1) {
    g.fillRect(rng() * WORLD.w, rng() * WORLD.h, 1.4, 1.4);
  }
  return grainCanvas;
}

// ---- the scene ----
export function drawScene(ctx, view) {
  const { level, player, guards, alarmActive, hidden, timeSec } = view;
  const blockers = sightBlockers(level);

  // Floor: two-tone boards.
  ctx.fillStyle = '#1a2233';
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  ctx.fillStyle = '#222c40';
  for (let y = 0; y < WORLD.h; y += 48) ctx.fillRect(0, y, WORLD.w, 2);
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  for (let y = 24; y < WORLD.h; y += 48) {
    for (let x = ((y / 48) % 2) * 120; x < WORLD.w; x += 240) {
      ctx.fillRect(x, y, 2, 48);
    }
  }

  // Lamp light pools (warm, soft).
  for (const l of level.lights) {
    const grad = ctx.createRadialGradient(l.x, l.y, 8, l.x, l.y, l.r);
    grad.addColorStop(0, 'rgba(242,165,65,0.16)');
    grad.addColorStop(1, 'rgba(242,165,65,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Shadow zones (the safe dark).
  for (const s of level.shadows) {
    ctx.fillStyle = 'rgba(10,16,28,0.62)';
    ctx.beginPath();
    ctx.roundRect(s.x, s.y, s.w, s.h, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,150,200,0.18)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Exit door (on the wall, glowing teal when unlocked).
  const exit = level.exit;
  const unlocked = level.artifacts.every((a) => a.taken);
  ctx.save();
  ctx.fillStyle = unlocked ? '#3ec9a7' : '#5a6478';
  ctx.shadowColor = unlocked ? '#3ec9a7' : 'transparent';
  ctx.shadowBlur = unlocked ? 18 + 6 * Math.sin(timeSec * 3) : 0;
  ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  ctx.restore();
  ctx.fillStyle = '#0d1420';
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', exit.x + exit.w / 2, exit.y + exit.h / 2 + 4);

  // Artifacts: gold moth-seals, glowing until taken.
  for (const a of level.artifacts) {
    if (a.taken) continue;
    const pulse = 0.75 + 0.25 * Math.sin(timeSec * 2.4 + a.id);
    ctx.save();
    ctx.shadowColor = '#e8b64c';
    ctx.shadowBlur = 14 * pulse;
    ctx.fillStyle = '#e8b64c';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y - 11);
    ctx.lineTo(a.x + 9, a.y);
    ctx.lineTo(a.x, a.y + 11);
    ctx.lineTo(a.x - 9, a.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#1a2233';
    ctx.beginPath();
    ctx.arc(a.x, a.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Vision cones (drawn under the actors, clipped by walls/tall cover).
  for (const g of guards) {
    const half = g.coneHalf;
    const rays = 26;
    const pts = [];
    for (let i = 0; i <= rays; i += 1) {
      const ang = g.facing - half + (2 * half * i) / rays;
      const len = coneRayLength(g.x, g.y, ang, g.range, blockers);
      pts.push([g.x + Math.cos(ang) * len, g.y + Math.sin(ang) * len]);
    }
    const alarmed = g.state === 'chase';
    const grad = ctx.createRadialGradient(g.x, g.y, 10, g.x, g.y, g.range);
    grad.addColorStop(0, alarmed ? 'rgba(224,72,62,0.48)' : 'rgba(242,165,65,0.44)');
    grad.addColorStop(1, alarmed ? 'rgba(224,72,62,0.08)' : 'rgba(242,165,65,0.08)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    for (const [px, py] of pts) ctx.lineTo(px, py);
    ctx.closePath();
    ctx.fill();
  }

  // Cover: shelves (tall, book spines), crates, plants.
  for (const c of level.cover) {
    if (c.kind === 'shelf') {
      ctx.fillStyle = '#4a3423';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = '#5d4229';
      ctx.fillRect(c.x, c.y, c.w, 6);
      const rng = mulberry32(c.x * 7 + c.y * 13);
      const cols = ['#7a4a3a', '#4a6a7a', '#8a7a4a', '#5a4a7a', '#a08a5a'];
      for (let x = c.x + 5; x < c.x + c.w - 6; x += 9) {
        ctx.fillStyle = cols[Math.floor(rng() * cols.length)];
        ctx.fillRect(x, c.y + 8, 6, c.h - 12);
      }
    } else if (c.kind === 'crate') {
      ctx.fillStyle = '#6b5432';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = '#4a3a22';
      ctx.lineWidth = 3;
      ctx.strokeRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x + c.w, c.y + c.h);
      ctx.moveTo(c.x + c.w, c.y);
      ctx.lineTo(c.x, c.y + c.h);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#2e5a3a';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3e7a4a';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2 - 6, c.y + c.h / 2 - 6, c.w / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6b4a2e';
      ctx.fillRect(c.x + c.w / 2 - 4, c.y + c.h - 8, 8, 8);
    }
  }

  // Walls: dark stone with a pale top edge.
  for (const w of level.walls) {
    ctx.fillStyle = '#0f1626';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#31405e';
    if (w.h <= 24) ctx.fillRect(w.x, w.y, w.w, 3);
    else ctx.fillRect(w.x, w.y, 3, w.h);
  }

  // Guards: navy body, brass helmet, facing nose, suspicion arc.
  for (const g of guards) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#2e3a55';
    ctx.beginPath();
    ctx.arc(g.x, g.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#c9a227';
    ctx.beginPath();
    ctx.arc(g.x, g.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f0e6d2';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.facing) * 15, g.y + Math.sin(g.facing) * 15);
    ctx.stroke();
    // Suspicion arc above the guard.
    if (g.suspicion > 4) {
      const frac = g.suspicion / 100;
      ctx.strokeStyle = frac > 0.66 ? '#e0483e' : '#f2a541';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(g.x, g.y, 19, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
    }
  }

  // Player: hooded figure with a moth-lantern glow.
  const glow = ctx.createRadialGradient(player.x, player.y, 4, player.x, player.y, 56);
  glow.addColorStop(0, 'rgba(232,182,76,0.36)');
  glow.addColorStop(1, 'rgba(232,182,76,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 56, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a2f4d';
  ctx.beginPath();
  ctx.arc(player.x, player.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f0e6d2';
  ctx.beginPath();
  ctx.arc(
    player.x + Math.cos(player.facing) * 4,
    player.y + Math.sin(player.facing) * 4,
    5.5, 0, Math.PI * 2,
  );
  ctx.fill();
  ctx.fillStyle = '#e8b64c';
  ctx.beginPath();
  ctx.arc(player.x + Math.cos(player.facing) * 12, player.y + Math.sin(player.facing) * 12, 3, 0, Math.PI * 2);
  ctx.fill();

  if (hidden) {
    ctx.fillStyle = 'rgba(13,20,32,0.85)';
    ctx.fillRect(player.x - 26, player.y - 34, 52, 16);
    ctx.fillStyle = '#9fc3e8';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIDDEN', player.x, player.y - 22);
  }

  // Grain + vignette over everything.
  ctx.drawImage(getGrain(), 0, 0);
  const vig = ctx.createRadialGradient(480, 300, 220, 480, 300, 640);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);

  // Alarm: red vignette pulse.
  if (alarmActive) {
    const pulse = 0.14 + 0.08 * Math.sin(timeSec * 5);
    const red = ctx.createRadialGradient(480, 300, 200, 480, 300, 620);
    red.addColorStop(0, 'rgba(224,72,62,0)');
    red.addColorStop(1, `rgba(224,72,62,${pulse})`);
    ctx.fillStyle = red;
    ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  }
}
