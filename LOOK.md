# LOOK.md — Mothlight: A Quiet Heist in the Paper Archive

## The game
Top-down stealth in a night archive. You are a small hooded thief with a
moth-lantern, stealing sealed artifacts from three paper archives while
guards patrol with lanterns of their own. Steal everything, reach the exit
unseen.

## Palette (named hex, used everywhere)
- Ink floor: `#1a2233` (deep ink blue) with plank tone `#222c40`
- Paper pale: `#e8dcc0` (old paper, artifacts and UI text accents)
- Moth gold: `#e8b64c` (artifacts, lantern glow, player lantern)
- Candle amber: `#f2a541` (guard vision cones, light pools)
- Shadow blue: `#0d1420` (shadow zones — the safe dark)
- Danger red: `#e0483e` (alarm, suspicion full)
- Exit teal: `#3ec9a7` (exit door glow — the way out)
- Guard navy: `#2e3a55` (guard bodies) with brass `#c9a227` (helmets/trim)
- Player cloak: `#3a2f4d` (deep violet hood) with pale face `#f0e6d2`

## Material language (flat illustration, layered)
- Floor: two-tone floorboard rows with faint grain speckles (seeded, static).
- Light pools: soft radial amber gradients on the floor under lamps —
  light is information, not decoration: lit floor = danger, dark = safe.
- Shadows: flat dark-blue zones with a soft edge; cover objects (shelves,
  crates, plants) are solid shapes with a darker shadow side.
- Grain + vignette: a light static grain and a corner vignette over the
  whole canvas, so the frame reads as one illustration.
- Typography: Georgia/serif for the title and overlays, system sans for
  HUD numbers and buttons.

## The safety language (must read at a glance)
- Lit floor (amber pool) = guards see fast here.
- Shadow zone (dark blue) = detection is halved; a small HIDDEN tag shows
  when the player stands in shadow unseen.
- Vision cone: bright amber wedge with a soft edge, clipped by walls and
  tall cover — what the cone touches, the guard can see.
- Exit door: glowing green-teal, locked grey until every artifact is
  stolen, then it glows and pulses.

## Checks (before any screenshot is accepted)
- Guards are readable against the floor at 1280x800 and at contact-sheet
  size (dark navy body + brass helmet + amber cone).
- Every vision cone is visible and clearly clipped by walls/cover.
- Cover objects cast clear shadow shapes; the player behind cover is
  partly hidden by the shelf, not floating on top of it.
- The exit door is visible in the cover shot; the artifacts counter and
  suspicion meter are visible in the HUD in every shot.
- The player is a small hooded figure with a moth-lantern glow — never a
  plain circle.
