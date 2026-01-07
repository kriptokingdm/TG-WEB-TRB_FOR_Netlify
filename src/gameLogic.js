export const GAME_WIDTH = 360;
export const GAME_HEIGHT = 640;
const GRAVITY = 0.4;
const JUMP_FORCE = 11;
const WALL_SLIDE_SPEED = 2;
const WALL_JUMP_FORCE_X = 8;
const WALL_JUMP_FORCE_Y = -10;

/* ======================
   PLAYER
====================== */
export function createPlayer() {
  return {
    x: GAME_WIDTH / 2 - 12,
    y: GAME_HEIGHT - 150,
    width: 24,
    height: 24,
    velocityX: 0,
    velocityY: 0,
    onWall: false,
    wallSide: 0, // -1 left, 1 right, 0 none
    alive: true,
    score: 0,
    combo: 0,
    isJumping: false,
    trail: []
  };
}

/* ======================
   PLATFORMS (вертикальные - как стены)
====================== */
export function generatePlatforms(count = 15, startY = GAME_HEIGHT - 100) {
  const platforms = [];
  let y = startY;

  for (let i = 0; i < count; i++) {
    platforms.push(createPlatform(y));
    y -= 120; // Вертикальное расстояние между платформами
  }

  // Добавляем стартовую платформу
  platforms.push({
    x: GAME_WIDTH / 2 - 40,
    y: GAME_HEIGHT - 50,
    width: 80,
    height: 12,
    type: 'normal',
    isStart: true
  });

  return platforms;
}

function createPlatform(y) {
  const types = ['normal', 'normal', 'normal', 'moving', 'breakable', 'spike'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  // Платформы появляются то слева, то справа
  const side = Math.random() > 0.5 ? 'left' : 'right';
  let x;
  
  if (side === 'left') {
    x = 20 + Math.random() * 120;
  } else {
    x = GAME_WIDTH - 140 + Math.random() * 120;
  }

  return {
    x,
    y,
    width: 60 + Math.random() * 40,
    height: 12,
    type,
    dir: Math.random() > 0.5 ? 1 : -1,
    speed: 0.5 + Math.random() * 1,
    broken: false
  };
}

/* ======================
   ОБНОВЛЕНИЕ ИГРОКА
====================== */
export function updatePlayer(player, platforms) {
  // Сохраняем предыдущую позицию для трейла
  player.trail.unshift({
    x: player.x,
    y: player.y,
    alpha: 1
  });
  
  if (player.trail.length > 8) {
    player.trail.pop();
  }
  
  player.trail.forEach((pos, i) => {
    pos.alpha = 0.3 - (i * 0.04);
  });

  // Гравитация
  player.velocityY += GRAVITY;
  
  // Если на стене - замедляем падение
  if (player.onWall && player.velocityY > 0) {
    player.velocityY = Math.min(player.velocityY, WALL_SLIDE_SPEED);
  }

  // Обновление позиции
  player.x += player.velocityX;
  player.y += player.velocityY;

  // Проверка столкновения со стенами (границами экрана)
  let onWall = false;
  let wallSide = 0;
  
  if (player.x <= 0) {
    player.x = 0;
    player.onWall = true;
    player.wallSide = -1;
    onWall = true;
    wallSide = -1;
  } else if (player.x + player.width >= GAME_WIDTH) {
    player.x = GAME_WIDTH - player.width;
    player.onWall = true;
    player.wallSide = 1;
    onWall = true;
    wallSide = 1;
  }
  
  // Если не касаемся границ - сбрасываем состояние стены
  if (!onWall) {
    player.onWall = false;
    player.wallSide = 0;
  }

  // Проверка столкновения с платформами
  let landedOnPlatform = false;
  
  platforms.forEach(p => {
    if (p.broken) return;
    
    // Проверка приземления на платформу сверху
    const wasAbove = (player.y + player.height) <= p.y;
    const verticalCollision = 
      player.y + player.height >= p.y &&
      player.y + player.height <= p.y + p.height + 5 &&
      player.velocityY > 0;
    
    const horizontalCollision =
      player.x + player.width > p.x &&
      player.x < p.x + p.width;
    
    if (verticalCollision && horizontalCollision && wasAbove) {
      // Приземление на платформу
      player.y = p.y - player.height;
      player.velocityY = 0;
      player.onWall = false;
      player.wallSide = 0;
      landedOnPlatform = true;
      
      // Эффекты платформ
      if (p.type === 'spike') {
        player.alive = false;
      } else if (p.type === 'breakable') {
        p.broken = true;
      }
      
      // Обновление счета
      if (!p.isStart) {
        const heightScore = Math.floor((GAME_HEIGHT - p.y) / 10);
        player.score = Math.max(player.score, heightScore);
        player.combo++;
      }
    }
    
    // Проверка столкновения сбоку (при движении в сторону платформы)
    const sideCollision =
      player.x + player.width >= p.x &&
      player.x <= p.x + p.width &&
      player.y + player.height > p.y &&
      player.y < p.y + p.height;
    
    if (sideCollision && !landedOnPlatform) {
      if (player.velocityX > 0 && player.x + player.width > p.x) {
        // Столкновение справа
        player.x = p.x - player.width;
        player.velocityX = 0;
      } else if (player.velocityX < 0 && player.x < p.x + p.width) {
        // Столкновение слева
        player.x = p.x + p.width;
        player.velocityX = 0;
      }
    }
  });

  // Сброс комбо если упал с платформы
  if (!landedOnPlatform && !player.onWall && player.velocityY > 0) {
    player.combo = 0;
  }

  // Смерть если упал вниз
  if (player.y > GAME_HEIGHT + 100) {
    player.alive = false;
  }
}

/* ======================
   ОБНОВЛЕНИЕ ПЛАТФОРМ
====================== */
export function updatePlatforms(platforms, playerY) {
  // Двигаем платформы вниз (создаем иллюзию подъема игрока)
  platforms.forEach(p => {
    if (p.type === 'moving' && !p.broken) {
      p.x += p.dir * p.speed;
      if (p.x < 20 || p.x + p.width > GAME_WIDTH - 20) {
        p.dir *= -1;
      }
    }
    
    // Плавное исчезновение сломанных платформ
    if (p.broken) {
      p.height = Math.max(0, p.height - 1);
    }
  });
  
  // Удаляем платформы, которые ушли слишком далеко вниз
  while (platforms.length && platforms[0].y > GAME_HEIGHT + 200) {
    platforms.shift();
  }
  
  // Добавляем новые платформы сверху
  const highestPlatform = Math.min(...platforms.map(p => p.y));
  if (highestPlatform > 100) { // Если самая высокая платформа ниже 100px от верха
    platforms.push(createPlatform(highestPlatform - 120));
  }
}

/* ======================
   ПРЫЖОК
====================== */
export function handleJump(player) {
  if (!player.alive) return;
  
  if (player.onWall) {
    // Прыжок от стены
    player.velocityX = WALL_JUMP_FORCE_X * -player.wallSide;
    player.velocityY = WALL_JUMP_FORCE_Y;
    player.onWall = false;
    player.wallSide = 0;
  } else if (Math.abs(player.velocityY) < 3) {
    // Обычный прыжок с платформы
    player.velocityY = -JUMP_FORCE;
    // Немного случайного смещения в сторону
    player.velocityX = (Math.random() - 0.5) * 4;
  }
  
  player.isJumping = true;
  setTimeout(() => {
    player.isJumping = false;
  }, 200);
}

/* ======================
   ЧАСТИЦЫ
====================== */
export function createParticles(x, y, color, count = 6) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8 - 2,
      life: 1,
      size: 2 + Math.random() * 4,
      color
    });
  }
  return particles;
}

export function updateParticles(particles) {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].x += particles[i].vx;
    particles[i].y += particles[i].vy;
    particles[i].vy += 0.2;
    particles[i].life -= 0.03;
    
    if (particles[i].life <= 0) {
      particles.splice(i, 1);
    }
  }
}