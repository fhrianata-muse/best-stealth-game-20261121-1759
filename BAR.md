# BAR.md — Judging bar for Mothlight (best-stealth-game-20261121-1759)

## Judge
AI pairwise (superbot → z-ai/glm-5.3-flash) on the screenshot contact sheet
+ a 1,536-token source outline. The judge sees the game mostly through its
screenshots. Criteria, most important first:

1. **A complete stealth game, shown in screenshots** — a level seen from
   above, guards with vision cones, cover to hide behind, and an exit to
   reach unseen. An entry that is not a playable game loses to one that is.
2. **Fun and depth** — patrols you can learn, routes that reward patience,
   a detection system that gives you a chance to recover.
3. **Feel and polish** — a cone that reacts as you expect, a near miss
   that raises the alarm, footsteps that tell you where a guard is.
4. **Look and originality** — cover readable at a glance, guards visible
   against the floor, lighting that shows what is safe.
5. **Structure** — the source split into files with one clear job each,
   named for what they do.

## Pass gate (every screenshot must show all of these)
- A top-down level (floor, walls, rooms).
- At least one guard with a visible vision cone.
- Cover (shelf/crate/plant) the player can hide behind.
- The exit door, visible and glowing when unlocked.
- HUD: level name, artifacts counter, suspicion meter.

## Scorecard (0-3 per category, gate: every category >= 2, average >= 2.3)
- **Completeness** — 3 levels, title/clear/caught/win overlays, HUD,
  pickups, exit, restart, mute; all four screenshots are real renders.
- **Depth** — waypoint patrols with pauses and scans, LOS-blocked cones,
  shadow halves detection, sneak halves it again, alarm + chase + return
  to patrol (recovery), 3 levels of rising difficulty.
- **Feel** — suspicion rises/falls smoothly, alarm sting + red vignette,
  guard footsteps louder when near (positional audio), pickup chime,
  clear jingle, click-to-move + keyboard.
- **Look** — LOOK.md palette and safety language; cones amber and soft,
  guards navy+brass on ink floor, light pools vs shadow zones.
- **Structure** — one job per file: config, random, levels, audio,
  render, input, shots, main; main.ts entrypoint; names say what they do.
