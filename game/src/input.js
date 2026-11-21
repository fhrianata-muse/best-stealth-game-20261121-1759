// input.js — one job: keyboard + mouse state, click-to-move, sneak, mute.
// The game reads this object each frame; it never touches game state itself.
export const input = {
  up: false,
  down: false,
  left: false,
  right: false,
  sneak: false,
  clickTarget: null, // {x, y} in world coordinates, or null
  interactPressed: false,
  restartPressed: false,
  mutePressed: false,
};

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

export function bindInput(canvas) {
  window.addEventListener('keydown', (e) => {
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') input.sneak = true;
    const dir = KEYMAP[e.code];
    if (dir) {
      input[dir] = true;
      input.clickTarget = null; // keys override click-to-move
      e.preventDefault();
    }
    if (e.code === 'KeyE') input.interactPressed = true;
    if (e.code === 'KeyR') input.restartPressed = true;
    if (e.code === 'KeyM') input.mutePressed = true;
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') input.sneak = false;
    const dir = KEYMAP[e.code];
    if (dir) input[dir] = false;
  });
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    input.clickTarget = { x, y };
  });
  // Keep the page from scrolling on arrows/space while playing.
  window.addEventListener('keydown', (e) => {
    if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
  });
}

export function consumeFlags() {
  const f = {
    interact: input.interactPressed,
    restart: input.restartPressed,
    mute: input.mutePressed,
  };
  input.interactPressed = false;
  input.restartPressed = false;
  input.mutePressed = false;
  return f;
}
