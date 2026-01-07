export const GAME_WIDTH = 360;
export const GAME_HEIGHT = 640;
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const PLATFORM_GAP = 90;
const MAX_SPEED = 8;

/* ======================
   PLAYER
====================== */
export function createPlayer() {
  return {
    x: GAME_WIDTH / 2 - 12,
    y: GAME_HEIGHT - 100,
    width: 24,
    height: 24,
    velocityY: 0,
    velocityX: 0,
    direction: 1,
    alive: true,
    score: 0,
    combo: 0,
    lastPlatformY: 0,
    dashCooldown: 0,
    dashCharges: 2,
    invincible: 0,
    trail: []
  };
}

/* ======================
   PLATFORMS
====================== */
export function generatePlatforms(count = 12, startY = GAME_HEIGHT - 40) {
  const platforms = [];
  let y = startY;

  for (let i = 0; i < count; i++) {
    platforms.push(createPlatform(y, i));
    y -= PLATFORM_GAP;
  }

  return platforms;
}

function createPlatform(y, index) {
  const types = ['normal', 'spring', 'spike', 'moving', 'breakable', 'bouncy'];
  const weights = [4, 1, 1, 1, 1, 1]; // Веса для разных типов
  
  // Первые 3 платформы всегда нормальные
  if (index < 3) {
    return createPlatformByType(y, 'normal');
  }
  
  // Случайный выбор с учетом весов
  let totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  let typeIndex = 0;
  
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      typeIndex = i;
      break;
    }
  }
  
  return createPlatformByType(y, types[typeIndex]);
}

function createPlatformByType(y, type) {
  const platform = {
    x: Math.random() * (GAME_WIDTH - 80),
    y,
    width: 80,
    height: 12,
    type,
    dir: Math.random() > 0.5 ? 1 : -1,
    speed: 1.2 + Math.random() * 0.8,
    broken: false,
    bounceForce: JUMP_FORCE * 1.3
  };
  
  // Разные размеры для разных типов
  if (type === 'breakable') platform.width = 60;
  if (type === 'spike') platform.width = 50;
  
  return platform;
}

/* ======================
   UPDATES
====================== */
export function updatePlayer(player, platforms, deltaTime) {
  // Обновление таймеров
  if (player.dashCooldown > 0) player.dashCooldown -= deltaTime;
  if (player.invincible > 0) player.invincible -= deltaTime;
  
  // Добавление позиции в трейл
  player.trail.unshift({
    x: player.x,
    y: player.y,
    alpha: 1
  });
  
  // Ограничение длины трейла
  if (player.trail.length > 10) {
    player.trail.pop();
  }
  
  // Обновление альфы трейла
  player.trail.forEach((pos, i) => {
    pos.alpha = 1 - (i / player.trail.length);
  });
  
  // Гравитация
  player.velocityY += GRAVITY;
  player.velocityY = Math.min(player.velocityY, MAX_SPEED);
  
  // Движение по горизонтали
  player.x += player.velocityX;
  player.velocityX *= 0.92; // Замедление
  
  // Ограничение экрана по горизонтали
  if (player.x < 0) {
    player.x = 0;
    player.velocityX = Math.abs(player.velocityX) * 0.5;
  }
  if (player.x + player.width > GAME_WIDTH) {
    player.x = GAME_WIDTH - player.width;
    player.velocityX = -Math.abs(player.velocityX) * 0.5;
  }
  
  let onPlatform = false;
  let platformUsed = false;
  
  // Проверка столкновений
  platforms.forEach(p => {
    if (p.broken) return;
    
    const isFalling = player.velocityY > 0;
    const hit =
      isFalling &&
      player.x + player.width - 2 > p.x &&
      player.x + 2 < p.x + p.width &&
      player.y + player.height >= p.y &&
      player.y + player.height <= p.y + p.height + 10;
    
    if (hit && !platformUsed) {
      platformUsed = true;
      
      // Проверка на шипы
      if (p.type === 'spike' && player.invincible <= 0) {
        player.alive = false;
        return;
      }
      
      // Прыжок с платформы
      let jumpForce = JUMP_FORCE;
      
      switch(p.type) {
        case 'spring':
          jumpForce = JUMP_FORCE * 1.8;
          player.combo++;
          break;
        case 'bouncy':
          jumpForce = p.bounceForce;
          player.combo++;
          break;
        case 'breakable':
          jumpForce = JUMP_FORCE;
          p.broken = true;
          break;
        default:
          jumpForce = JUMP_FORCE;
          player.combo = Math.max(0, player.combo - 0.5);
      }
      
      // Бонус за комбо
      if (player.combo > 5) {
        jumpForce *= (1 + player.combo * 0.05);
      }
      
      player.velocityY = jumpForce;
      player.y = p.y - player.height;
      onPlatform = true;
      
      // Обновление счета
      const heightDiff = Math.abs(p.y - player.lastPlatformY);
      if (heightDiff > PLATFORM_GAP * 0.8) {
        player.score += Math.floor(10 + player.combo);
      }
      player.lastPlatformY = p.y;
    }
  });
  
  // Сброс комбо если не на платформе
  if (!onPlatform && player.velocityY > 0) {
    player.combo = Math.max(0, player.combo - 0.1);
  }
  
  // Смерть за экраном
  if (player.y > GAME_HEIGHT + 100) {
    player.alive = false;
  }
}

export function updatePlatforms(platforms, playerScore) {
  platforms.forEach(p => {
    if (p.type === 'moving' && !p.broken) {
      p.x += p.dir * p.speed;
      if (p.x < 0 || p.x + p.width > GAME_WIDTH) p.dir *= -1;
    }
    
    // Плавное исчезновение сломанных платформ
    if (p.broken) {
      p.height = Math.max(0, p.height - 2);
    }
  });
  
  // Удаление старых платформ
  while (platforms.length && platforms[0].y > GAME_HEIGHT + 100) {
    platforms.shift();
  }
  
  // Добавление новых
  const neededPlatforms = 12 + Math.min(Math.floor(playerScore / 1000), 8);
  while (platforms.length < neededPlatforms) {
    const lastY = platforms[platforms.length - 1]?.y || 0;
    platforms.push(createPlatform(lastY - PLATFORM_GAP, platforms.length));
  }
}

/* ======================
   CONTROLS
====================== */
export function handleJump(player, platforms, dashMode = false) {
  if (!player.alive) return;
  
  if (dashMode && player.dashCharges > 0 && player.dashCooldown <= 0) {
    // Дэш в сторону
    player.velocityX = 15 * player.direction;
    player.velocityY = -3;
    player.dashCharges--;
    player.dashCooldown = 1.0;
    player.invincible = 0.3;
    return;
  }
  
  // Обычный прыжок от стены
  player.direction *= -1;
  player.velocityX = 4 * player.direction;
  player.velocityY = JUMP_FORCE * 0.8;
  
  // Перезарядка дэша при касании стены
  if (player.x <= 2 || player.x + player.width >= GAME_WIDTH - 2) {
    player.dashCharges = Math.min(2, player.dashCharges + 1);
  }
}

/* ======================
   PARTICLES
====================== */
export function createParticles(x, y, color, count = 5) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 1,
      color
    });
  }
  return particles;
}

export function updateParticles(particles, deltaTime) {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].x += particles[i].vx;
    particles[i].y += particles[i].vy;
    particles[i].vy += 0.1;
    particles[i].life -= 0.02;
    
    if (particles[i].life <= 0) {
      particles.splice(i, 1);
    }
  }
}