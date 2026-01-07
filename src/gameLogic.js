export const GAME_HEIGHT = 640;
const GRAVITY = 0.6;

export function createPlayer() {
  return {
    x: 170,
    y: 500,
    vx: 0,
    vy: -12,
    size: 22,
    alive: true,
    score: 0,
    squash: 1,
  };
}

export function generatePlatforms() {
  return Array.from({ length: 8 }, (_, i) => ({
    x: Math.random() * 260 + 40,
    y: GAME_HEIGHT - i * 90,
    w: 80,
    h: 10,
  }));
}

export function updatePlayer(p) {
  p.vy += GRAVITY;
  p.y += p.vy;
  p.squash += (1 - p.squash) * 0.1;
}

export function handleJump(p) {
  p.vy = -14;
  p.squash = 0.7;
}
