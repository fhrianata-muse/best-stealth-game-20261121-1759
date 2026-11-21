// config.js — one job: every tunable number for Mothlight.
export const WORLD = { w: 960, h: 600 };
export const BORDER = 16;

export const PLAYER = {
  radius: 13,
  walkSpeed: 140, // px per second
  sneakSpeed: 76,
  pickupRadius: 22,
};

export const GUARD = {
  coneHalfAngleDeg: 35, // half of the ~70 degree vision cone
  range: 175, // vision range in px
  wideConeHalfAngleDeg: 48,
  wideRange: 210,
  patrolSpeed: 55,
  chaseSpeed: 148,
  pauseAtWaypointSec: 1.6,
  scanSweepDeg: 42, // how far a guard turns while paused to scan
};

export const DETECTION = {
  baseRate: 52, // suspicion points per second, player seen in normal light
  litMultiplier: 1.25, // standing in a lamp light pool
  shadowMultiplier: 0.5, // standing in a shadow zone
  sneakMultiplier: 0.55, // moving while sneaking
  nearBoost: 0.6, // extra rate when the guard is very close
  decayPerSec: 30, // suspicion fall when unseen
  alarmDecayPerSec: 45, // suspicion fall while alarmed but unseen
  loseSightSec: 3.0, // unseen this long while alarmed -> guard gives up
  returnThreshold: 40, // suspicion below this -> guard returns to patrol
  catchRadius: 18, // guard touches player while alarmed -> caught
};

export const SCORING = {
  perArtifact: 200,
  perAlarm: -50,
  timeBonusPerSec: 5, // leftover-seconds bonus is capped in main.js
  maxTimeBonus: 300,
};

export const SHOT_TIMER = { cover: '03:41', patrol: '04:12', alarm: '02:58', complete: '03:05' };
