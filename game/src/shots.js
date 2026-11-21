// shots.js — one job: stage deterministic screenshot states from ?shot=<name>.
// Each stage freezes the game at a readable frame: a cone, cover, the exit
// and the HUD are always in view. Frozen shots never advance the timer.
import { SHOT_TIMER } from './config.js';

export const SHOT_NAMES = ['cover', 'patrol', 'alarm', 'complete'];

export function readShotParam() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  return SHOT_NAMES.includes(shot) ? shot : null;
}

// Mutates G (built by main.js): loads the staged level, places the actors,
// sets suspicion/artifacts, and freezes the frame. main.js syncs HUD/overlays.
export function applyShot(G, name, loadLevel) {
  G.shotMode = true;
  G.frozenTimer = SHOT_TIMER[name];
  if (name === 'cover') {
    loadLevel(G, 1); // Map Vault
    // Player hides just below the tall shelf; guard C stands clear of it
    // (never inside cover, or the shelf would clip the cone to nothing)
    // and sweeps the cone down across the player.
    G.player.x = 725;
    G.player.y = 235;
    G.player.facing = -Math.PI / 2;
    const guard = G.level.guards[2];
    guard.x = 700;
    guard.y = 185;
    guard.facing = Math.PI / 2; // cone sweeps down across the hiding player
    guard.suspicion = 35;
    G.level.artifacts[0].taken = true;
    G.level.artifacts[1].taken = true;
    G.state = 'playing';
  } else if (name === 'patrol') {
    loadLevel(G, 0); // Reading Room
    G.player.x = 120;
    G.player.y = 370;
    G.player.facing = Math.PI / 4;
    G.player.sneaking = true;
    const guard = G.level.guards[0];
    guard.x = 200;
    guard.y = 250;
    guard.facing = Math.PI / 3; // cone passes just ahead of the player
    guard.suspicion = 0;
    G.state = 'playing';
  } else if (name === 'alarm') {
    loadLevel(G, 1); // Map Vault, alarm chase
    G.player.x = 500;
    G.player.y = 300;
    G.player.facing = Math.PI;
    const guard = G.level.guards[1];
    guard.x = 560;
    guard.y = 330;
    guard.facing = Math.atan2(G.player.y - guard.y, G.player.x - guard.x);
    guard.suspicion = 100;
    guard.state = 'chase';
    guard.unseenTimer = 0;
    G.level.artifacts[0].taken = true;
    G.state = 'playing';
  } else if (name === 'complete') {
    loadLevel(G, 0); // Reading Room, cleared
    G.player.x = 60;
    G.player.y = 60;
    G.player.facing = Math.PI / 2;
    for (const a of G.level.artifacts) a.taken = true;
    G.score = 700;
    G.state = 'clear';
    G.clearStars = 3;
    G.clearTimeSec = 185;
  }
}
