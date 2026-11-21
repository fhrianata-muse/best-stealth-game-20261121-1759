// levels.js — one job: the three hand-authored archive levels (fixed layouts,
// so screenshots are reproducible). Walls block movement and sight; tall
// cover blocks sight too; crates and plants block movement only.
import { WORLD, BORDER } from './config.js';

function borderWalls() {
  return [
    { x: 0, y: 0, w: WORLD.w, h: BORDER },
    { x: 0, y: WORLD.h - BORDER, w: WORLD.w, h: BORDER },
    { x: 0, y: 0, w: BORDER, h: WORLD.h },
    { x: WORLD.w - BORDER, y: 0, w: BORDER, h: WORLD.h },
  ];
}

export const LEVELS = [
  {
    name: 'Reading Room',
    subtitle: 'Level 1 — two guards, two seals',
    parSec: 150,
    walls: [
      ...borderWalls(),
      { x: 400, y: 16, w: 24, h: 220 }, // top divider, gap below
      { x: 560, y: 360, w: 384, h: 24 }, // bottom-right divider, gap left
    ],
    cover: [
      { x: 60, y: 170, w: 110, h: 30, kind: 'shelf', tall: true },
      { x: 640, y: 140, w: 120, h: 30, kind: 'shelf', tall: true },
      { x: 180, y: 430, w: 56, h: 56, kind: 'crate', tall: false },
      { x: 780, y: 390, w: 56, h: 56, kind: 'crate', tall: false },
      { x: 60, y: 300, w: 40, h: 40, kind: 'plant', tall: false },
      { x: 880, y: 300, w: 40, h: 40, kind: 'plant', tall: false },
    ],
    shadows: [
      { x: 56, y: 300, w: 170, h: 120 },
      { x: 700, y: 430, w: 180, h: 110 },
      { x: 450, y: 40, w: 150, h: 90 },
    ],
    lights: [
      { x: 250, y: 130, r: 120 },
      { x: 720, y: 230, r: 130 },
      { x: 480, y: 500, r: 120 },
    ],
    guards: [
      { waypoints: [[200, 100], [360, 100], [360, 300], [200, 300]], speed: 55, pause: 1.6, wide: false },
      { waypoints: [[620, 480], [880, 480], [880, 540], [620, 540]], speed: 58, pause: 1.4, wide: false },
    ],
    artifacts: [{ x: 890, y: 70 }, { x: 80, y: 520 }],
    exit: { x: 24, y: 16, w: 56, h: 36 },
    spawn: { x: 480, y: 560 },
  },
  {
    name: 'Map Vault',
    subtitle: 'Level 2 — three guards, three seals',
    parSec: 180,
    walls: [
      ...borderWalls(),
      { x: 470, y: 16, w: 24, h: 250 }, // vertical divider, gap below
      { x: 640, y: 330, w: 304, h: 24 }, // right divider, gap left
    ],
    cover: [
      { x: 220, y: 150, w: 130, h: 30, kind: 'shelf', tall: true },
      { x: 660, y: 130, w: 130, h: 30, kind: 'shelf', tall: true },
      { x: 150, y: 430, w: 130, h: 30, kind: 'shelf', tall: true },
      { x: 700, y: 460, w: 56, h: 56, kind: 'crate', tall: false },
      { x: 330, y: 450, w: 56, h: 56, kind: 'crate', tall: false },
      { x: 60, y: 90, w: 40, h: 40, kind: 'plant', tall: false },
      { x: 905, y: 470, w: 36, h: 36, kind: 'plant', tall: false },
    ],
    shadows: [
      { x: 60, y: 380, w: 170, h: 130 },
      { x: 700, y: 60, w: 180, h: 90 },
      { x: 430, y: 430, w: 150, h: 110 },
    ],
    lights: [
      { x: 300, y: 120, r: 120 },
      { x: 700, y: 250, r: 130 },
      { x: 500, y: 480, r: 110 },
      { x: 880, y: 120, r: 100 },
    ],
    guards: [
      { waypoints: [[180, 90], [420, 90], [420, 240], [180, 240]], speed: 65, pause: 1.4, wide: false },
      { waypoints: [[560, 420], [880, 420], [880, 540], [560, 540]], speed: 68, pause: 1.2, wide: false },
      { waypoints: [[560, 80], [880, 80], [880, 260], [560, 260]], speed: 62, pause: 1.6, wide: false },
    ],
    artifacts: [{ x: 905, y: 70 }, { x: 80, y: 300 }, { x: 480, y: 540 }],
    exit: { x: 880, y: 16, w: 56, h: 36 },
    spawn: { x: 60, y: 560 },
  },
  {
    name: "Director's Archive",
    subtitle: 'Level 3 — four guards, four seals, one wide-eyed watcher',
    parSec: 210,
    walls: [
      ...borderWalls(),
      { x: 300, y: 16, w: 24, h: 180 }, // top divider
      { x: 636, y: 404, w: 24, h: 180 }, // bottom divider
      { x: 480, y: 280, w: 220, h: 24 }, // middle shelf-wall
    ],
    cover: [
      { x: 120, y: 300, w: 130, h: 30, kind: 'shelf', tall: true },
      { x: 700, y: 120, w: 130, h: 30, kind: 'shelf', tall: true },
      { x: 380, y: 430, w: 130, h: 30, kind: 'shelf', tall: true },
      { x: 60, y: 500, w: 56, h: 56, kind: 'crate', tall: false },
      { x: 820, y: 300, w: 56, h: 56, kind: 'crate', tall: false },
      { x: 60, y: 120, w: 40, h: 40, kind: 'plant', tall: false },
      { x: 900, y: 180, w: 40, h: 40, kind: 'plant', tall: false },
    ],
    shadows: [
      { x: 60, y: 420, w: 160, h: 120 },
      { x: 740, y: 420, w: 170, h: 120 },
      { x: 380, y: 60, w: 160, h: 90 },
    ],
    lights: [
      { x: 200, y: 150, r: 120 },
      { x: 750, y: 300, r: 120 },
      { x: 480, y: 500, r: 120 },
      { x: 880, y: 90, r: 100 },
    ],
    guards: [
      { waypoints: [[140, 90], [260, 90], [260, 240], [140, 240]], speed: 70, pause: 1.2, wide: false },
      { waypoints: [[520, 90], [880, 90], [880, 240], [520, 240]], speed: 62, pause: 1.5, wide: true },
      { waypoints: [[140, 480], [420, 480], [420, 560], [140, 560]], speed: 72, pause: 1.1, wide: false },
      { waypoints: [[680, 420], [880, 420], [880, 540], [680, 540]], speed: 75, pause: 1.0, wide: false },
    ],
    artifacts: [{ x: 90, y: 80 }, { x: 905, y: 80 }, { x: 90, y: 520 }, { x: 905, y: 520 }],
    exit: { x: 24, y: 16, w: 56, h: 36 },
    spawn: { x: 480, y: 560 },
  },
];

// buildLevel returns a fresh mutable copy of a level with runtime guard state.
export function buildLevel(index) {
  const src = LEVELS[index];
  const level = JSON.parse(JSON.stringify(src));
  level.guards = level.guards.map((g) => {
    const start = g.waypoints[0];
    const next = g.waypoints[1];
    return {
      ...g,
      x: start[0],
      y: start[1],
      facing: Math.atan2(next[1] - start[1], next[0] - start[0]),
      wpIndex: 1,
      pauseTimer: 0,
      scanDir: 1,
      suspicion: 0,
      state: 'patrol', // patrol | chase | return
      unseenTimer: 0,
      stepAcc: 0,
      seesPlayer: false,
    };
  });
  level.artifacts = level.artifacts.map((a, i) => ({ ...a, id: i, taken: false }));
  return level;
}
