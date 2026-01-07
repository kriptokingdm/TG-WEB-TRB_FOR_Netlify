// src/gameLogic.js

export const GAME_WIDTH = 360;
export const GAME_HEIGHT = 640;
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const PLATFORM_GAP = 90;

/* ======================
   PLAYER
====================== */
export function createPlayer() {
  return {
    x: GAME_WIDTH / 2 - 12,
    y: GAME_HEIGHT - 80,
    width: 24,
    height: 24,
    velocityY: 0,
    direction: 1, // 1 → вправо, -1 → влево
    alive: true,
    score: 0,
  };
}

/* ======================
   PLATFORMS
====================== */
export function generatePlatforms() {
  const platforms = [];
  let y = GAME_HEIGHT - 40;

  for (let i = 0; i < 8; i++) {
    platforms.push(createPlatform(y));
    y -= PLATFORM_GAP;
  }

  return platforms;
}

function createPlatform(y) {
  const types = ['normal', 'spring', 'spike', 'moving'];
  const type = types[Math.floor(Math.random() * types.length)];

  return {
    x: Math.random() > 0.5 ? 40 : GAME_WIDTH - 100,
    y,
    width: 80,
    height: 12,
    type,
    dir: Math.random() > 0.5 ? 1 : -1,
  };
}

/* ======================
   UPDATE PLAYER
====================== */
export function updatePlayer(player) {
  player.velocityY += GRAVITY;
  player.y += player.velocityY;
}

/* ======================
   UPDATE PLATFORMS (ВОТ ОН!)
====================== */
export function updatePlatforms(platforms) {
  platforms.forEach(p => {
    if (p.type === 'moving') {
      p.x += p.dir * 1.2;

      if (p.x < 20 || p.x + p.width > GAME_WIDTH - 20) {
        p.dir *= -1;
      }
    }
  });
}

/* ======================
   JUMP LOGIC (WALL KICKERS)
====================== */
export function handleJump(player, platforms) {
  player.direction *= -1;
  player.velocityY = JUMP_FORCE;

  platforms.forEach(p => {
    const hit =
      player.x < p.x + p.width &&
      player.x + player.width > p.x &&
      player.y + player.height >= p.y &&
      player.y + player.height <= p.y + p.height + 10;

    if (hit) {
      if (p.type === 'spike') {
        player.alive = false;
      }

      if (p.type === 'spring') {
        player.velocityY = JUMP_FORCE * 1.4;
      }
    }
  });
}
