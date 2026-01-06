// gameLogic.js

export const GAME_WIDTH = 360;
export const GAME_HEIGHT = 640;
export const GRAVITY = 0.6;
export const JUMP_FORCE = -12;
export const SPRING_FORCE = -18;

export const PLATFORM_TYPES = {
  NORMAL: 'normal',
  SPRING: 'spring',
  SPIKE: 'spike',
  MOVING: 'moving',
};

export function createPlayer() {
  return {
    x: GAME_WIDTH / 2 - 15,
    y: GAME_HEIGHT - 80,
    width: 30,
    height: 30,
    velocityY: 0,
    side: 'left',
    alive: true,
    score: 0,
  };
}

export function createPlatform(y, side) {
  const rand = Math.random();
  let type = PLATFORM_TYPES.NORMAL;

  if (rand > 0.85) type = PLATFORM_TYPES.SPIKE;
  else if (rand > 0.7) type = PLATFORM_TYPES.MOVING;
  else if (rand > 0.55) type = PLATFORM_TYPES.SPRING;

  return {
    x: side === 'left' ? 40 : GAME_WIDTH - 100,
    y,
    width: 80,
    height: 12,
    type,
    direction: 1,
  };
}

export function generatePlatforms() {
  const platforms = [];
  let y = GAME_HEIGHT - 40;
  let side = 'left';

  for (let i = 0; i < 10; i++) {
    platforms.push(createPlatform(y, side));
    y -= 70;
    side = side === 'left' ? 'right' : 'left';
  }

  return platforms;
}

export function updatePlayer(player) {
  player.velocityY += GRAVITY;
  player.y += player.velocityY;
}

export function handleJump(player, platforms) {
  player.velocityY = JUMP_FORCE;
  player.side = player.side === 'left' ? 'right' : 'left';

  platforms.forEach(p => {
    if (
      player.y + player.height <= p.y &&
      player.y + player.height + player.velocityY >= p.y &&
      player.x < p.x + p.width &&
      player.x + player.width > p.x
    ) {
      if (p.type === PLATFORM_TYPES.SPIKE) {
        player.alive = false;
      } else if (p.type === PLATFORM_TYPES.SPRING) {
        player.velocityY = SPRING_FORCE;
      }
    }
  });
}

export function updatePlatforms(platforms) {
  platforms.forEach(p => {
    if (p.type === PLATFORM_TYPES.MOVING) {
      p.x += p.direction * 1.2;
      if (p.x < 20 || p.x > GAME_WIDTH - 100) {
        p.direction *= -1;
      }
    }
  });
}
