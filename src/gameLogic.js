// gameLogic.js
export const GAME_WIDTH = 360;
export const GAME_HEIGHT = 640;

// Физика
const GRAVITY = 0.55;
const MAX_FALL = 14;
const WALL_SLIDE_SPEED = 2.2;

// Прыжки
const WALL_KICK_X = 9.2;
const WALL_KICK_Y = 12.0; // вверх
const GROUND_JUMP = 11.2;
const AIR_NUDGE = 0.7;

// Генерация
const PLATFORM_GAP_Y = 105;
const PLATFORM_MIN_W = 56;
const PLATFORM_MAX_W = 94;

const DESPAWN_BELOW = 260; // запас снизу
const SPAWN_AHEAD = 220;   // запас сверху

function rand(min, max) {
  return min + Math.random() * (max - min);
}
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function createPlayer() {
  return {
    x: GAME_WIDTH / 2 - 12,
    y: GAME_HEIGHT - 140, // world Y
    w: 24,
    h: 24,
    vx: 0,
    vy: 0,
    alive: true,

    onWall: false,
    wallSide: 0, // -1 left, 1 right
    onGround: false,

    score: 0,
    bestY: GAME_HEIGHT - 140,

    combo: 1,
    trail: [],
  };
}

function createPlatform(y, isStart = false) {
  if (isStart) {
    return {
      id: cryptoRandomId(),
      x: GAME_WIDTH / 2 - 46,
      y,
      w: 92,
      h: 12,
      type: 'start',
      broken: false,
      dir: 1,
      speed: 0,
    };
  }

  const types = ['normal', 'normal', 'normal', 'moving', 'breakable', 'spike'];
  const type = types[Math.floor(Math.random() * types.length)];

  // чаще слева/справа как в wall kickers
  const side = Math.random() > 0.5 ? 'left' : 'right';
  const w = rand(PLATFORM_MIN_W, PLATFORM_MAX_W);

  const margin = 20;
  let x;
  if (side === 'left') {
    x = rand(margin, 140);
  } else {
    x = rand(GAME_WIDTH - 140, GAME_WIDTH - margin - w);
  }

  return {
    id: cryptoRandomId(),
    x,
    y,
    w,
    h: 12,
    type,
    broken: false,
    // moving
    dir: Math.random() > 0.5 ? 1 : -1,
    speed: rand(0.6, 1.3),
    // breakable anim
    crumble: 0, // 0..1
  };
}

function cryptoRandomId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function generatePlatforms(count = 16, startY = GAME_HEIGHT - 90) {
  const platforms = [];
  platforms.push(createPlatform(GAME_HEIGHT - 50, true));

  let y = startY;
  for (let i = 0; i < count; i++) {
    platforms.push(createPlatform(y));
    y -= PLATFORM_GAP_Y;
  }
  return platforms;
}

/** Частицы */
export function createParticles(x, y, color, count = 7) {
  const parts = [];
  for (let i = 0; i < count; i++) {
    parts.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.8) * 7,
      life: 1,
      size: rand(2, 4.6),
      color,
    });
  }
  return parts;
}

export function updateParticles(particles, dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 0.28 * dt;
    p.life -= 0.045 * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

/** GAME */
export function createGame() {
  return {
    started: false,
    running: true,

    cameraY: 0, // world -> screen offset
    player: createPlayer(),
    platforms: generatePlatforms(),
    particles: [],

    _dirty: true,
  };
}

export function restartGame(game) {
  game.started = false;
  game.running = true;
  game.cameraY = 0;
  game.player = createPlayer();
  game.platforms = generatePlatforms();
  game.particles = [];
  game._dirty = true;
}

/**
 * Прыжок: wall-kick / jump-from-platform / air nudge
 */
export function jumpAction(game) {
  const pl = game.player;
  if (!pl.alive) return;

  // частицы
  const px = pl.x + pl.w / 2;
  const py = pl.y + pl.h;
  const color = pl.onWall ? '#ff9500' : '#3390ec';
  game.particles.push(...createParticles(px, py, color, 8));

  if (pl.onWall) {
    // wall kick
    pl.vx = WALL_KICK_X * -pl.wallSide;
    pl.vy = -WALL_KICK_Y;
    pl.onWall = false;
    pl.wallSide = 0;
    pl.onGround = false;

    // комбо за серию wall kicks
    pl.combo = clamp(pl.combo + 1, 1, 99);
    return;
  }

  if (pl.onGround) {
    // обычный прыжок с платформы
    pl.vy = -GROUND_JUMP;
    // слегка толкаем в сторону последнего движения
    if (Math.abs(pl.vx) < 1) pl.vx = (Math.random() > 0.5 ? 1 : -1) * 1.8;
    pl.onGround = false;
    pl.combo = 1;
    return;
  }

  // воздух: маленький nudge (чтобы было “живее”, но не ломало)
  if (pl.vx > 0) pl.vx += AIR_NUDGE;
  else if (pl.vx < 0) pl.vx -= AIR_NUDGE;
  else pl.vx = (Math.random() > 0.5 ? 1 : -1) * AIR_NUDGE;
}

export function stepGame(game, dt = 1) {
  const pl = game.player;
  const platforms = game.platforms;

  // trail
  pl.trail.unshift({ x: pl.x, y: pl.y, a: 0.22 });
  if (pl.trail.length > 10) pl.trail.pop();
  pl.trail.forEach((t, i) => (t.a = Math.max(0, 0.26 - i * 0.022)));

  // particles
  updateParticles(game.particles, dt);

  // platform movement + crumble
  for (const p of platforms) {
    if (p.type === 'moving' && !p.broken) {
      p.x += p.dir * p.speed * dt;
      const left = 18;
      const right = GAME_WIDTH - 18 - p.w;
      if (p.x < left) { p.x = left; p.dir *= -1; }
      if (p.x > right) { p.x = right; p.dir *= -1; }
    }

    if (p.type === 'breakable' && p.broken) {
      p.crumble = clamp(p.crumble + 0.08 * dt, 0, 1);
      p.h = clamp(12 * (1 - p.crumble), 0, 12);
    }
  }

  // physics
  const prevX = pl.x;
  const prevY = pl.y;

  pl.vy += GRAVITY * dt;
  pl.vy = clamp(pl.vy, -50, MAX_FALL);

  // wall slide cap
  if (pl.onWall && pl.vy > 0) pl.vy = Math.min(pl.vy, WALL_SLIDE_SPEED);

  pl.x += pl.vx * dt;
  pl.y += pl.vy * dt;

  // немного трения в воздухе
  pl.vx *= Math.pow(0.992, dt);

  // world bounds walls
  pl.onWall = false;
  pl.wallSide = 0;

  if (pl.x <= 0) {
    pl.x = 0;
    pl.onWall = true;
    pl.wallSide = -1;
    pl.vx = 0;
  } else if (pl.x + pl.w >= GAME_WIDTH) {
    pl.x = GAME_WIDTH - pl.w;
    pl.onWall = true;
    pl.wallSide = 1;
    pl.vx = 0;
  }

  // collisions with platforms (mainly landing)
  pl.onGround = false;

  for (const p of platforms) {
    if (p.type === 'breakable' && p.broken && p.h <= 0.1) continue;

    // AABB now
    if (!aabb(pl.x, pl.y, pl.w, pl.h, p.x, p.y, p.w, p.h)) continue;

    // Landing check: was above and moving down
    const wasAbove = prevY + pl.h <= p.y + 1;
    const movingDown = pl.vy > 0;

    if (wasAbove && movingDown) {
      // land
      pl.y = p.y - pl.h;
      pl.vy = 0;
      pl.onGround = true;
      pl.onWall = false;
      pl.wallSide = 0;

      // spike kills on touch
      if (p.type === 'spike') {
        pl.alive = false;
        break;
      }

      // breakable breaks after landing
      if (p.type === 'breakable' && !p.broken) {
        p.broken = true;
        // бонус particles
        game.particles.push(...createParticles(pl.x + pl.w / 2, pl.y + pl.h, '#ff9500', 10));
      }

      // scoring: max height
      if (p.type !== 'start') {
        pl.bestY = Math.min(pl.bestY, pl.y);
        const height = Math.max(0, (GAME_HEIGHT - pl.bestY));
        pl.score = Math.max(pl.score, Math.floor(height / 6));
      } else {
        // на старте комбо сброс
        pl.combo = 1;
      }

      break;
    }

    // side push-out (мягко, чтобы не застревать)
    const fromLeft = prevX + pl.w <= p.x;
    const fromRight = prevX >= p.x + p.w;

    if (fromLeft) {
      pl.x = p.x - pl.w;
      pl.vx = 0;
    } else if (fromRight) {
      pl.x = p.x + p.w;
      pl.vx = 0;
    }
  }

  // camera: держим игрока примерно в верхней трети экрана
  const targetScreenY = GAME_HEIGHT * 0.35;
  const desiredCam = pl.y - targetScreenY;
  // камера только "вверх" (как в wall kickers), вниз не догоняет резко
  game.cameraY = Math.min(game.cameraY, desiredCam);

  // despawn below camera
  const killLine = game.cameraY + GAME_HEIGHT + DESPAWN_BELOW;
  for (let i = platforms.length - 1; i >= 0; i--) {
    if (platforms[i].y > killLine) platforms.splice(i, 1);
  }

  // spawn above camera
  let topMostY = Infinity;
  for (const p of platforms) topMostY = Math.min(topMostY, p.y);

  const wantTop = game.cameraY - SPAWN_AHEAD;
  while (topMostY > wantTop) {
    topMostY -= PLATFORM_GAP_Y;
    platforms.push(createPlatform(topMostY));
  }

  // death: fell below camera screen
  if (pl.y > game.cameraY + GAME_HEIGHT + 140) {
    pl.alive = false;
  }

  game._dirty = true;
}

/** DRAW */
export function drawGame(ctx, game, highScore) {
  // bg
  const g = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  g.addColorStop(0, '#11162a');
  g.addColorStop(0.5, '#101b35');
  g.addColorStop(1, '#0b2a4b');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // grid
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < GAME_WIDTH; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GAME_HEIGHT); ctx.stroke();
  }
  for (let y = 0; y < GAME_HEIGHT; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(GAME_WIDTH, y); ctx.stroke();
  }

  const camY = game.cameraY;

  // particles (screen space from world)
  for (const p of game.particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y - camY, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // platforms
  for (const p of game.platforms) {
    if (p.type === 'breakable' && p.broken && p.h <= 0.1) continue;

    const sx = p.x;
    const sy = p.y - camY;

    // skip offscreen
    if (sy > GAME_HEIGHT + 80 || sy < -80) continue;

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(sx, sy + 2, p.w, p.h);

    if (p.type === 'spike') {
      ctx.fillStyle = '#ff3b30';
      ctx.fillRect(sx, sy, p.w, p.h);

      ctx.fillStyle = '#ff6b66';
      const spikeCount = Math.max(3, Math.floor(p.w / 15));
      for (let i = 0; i < spikeCount; i++) {
        const spikeX = sx + i * (p.w / spikeCount) + 8;
        ctx.beginPath();
        ctx.moveTo(spikeX, sy);
        ctx.lineTo(spikeX - 4, sy - 8);
        ctx.lineTo(spikeX + 4, sy - 8);
        ctx.closePath();
        ctx.fill();
      }
    } else if (p.type === 'breakable') {
      ctx.fillStyle = p.broken ? '#7b7b82' : '#ff9500';
      ctx.fillRect(sx, sy, p.w, p.h);

      if (!p.broken) {
        ctx.strokeStyle = '#cc5500';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx + 14, sy + 3);
        ctx.lineTo(sx + 26, sy + 10);
        ctx.moveTo(sx + 36, sy + 4);
        ctx.lineTo(sx + 48, sy + 9);
        ctx.stroke();
      }
    } else if (p.type === 'moving') {
      ctx.fillStyle = '#5856d6';
      ctx.fillRect(sx, sy, p.w, p.h);

      ctx.fillStyle = '#4846c6';
      const arrowCount = Math.max(2, Math.floor(p.w / 20));
      for (let i = 0; i < arrowCount; i++) {
        const ax = sx + i * 20 + 10;
        ctx.beginPath();
        ctx.moveTo(ax, sy + 6);
        ctx.lineTo(ax + 4 * p.dir, sy + 3);
        ctx.lineTo(ax + 4 * p.dir, sy + 9);
        ctx.closePath();
        ctx.fill();
      }
    } else if (p.type === 'start') {
      ctx.fillStyle = '#34c759';
      ctx.fillRect(sx, sy, p.w, p.h);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('START', sx + p.w / 2, sy + 10);
      ctx.textAlign = 'left';
    } else {
      ctx.fillStyle = '#8e8e93';
      ctx.fillRect(sx, sy, p.w, p.h);
    }
  }

  // player trail
  const pl = game.player;
  for (let i = 0; i < pl.trail.length; i++) {
    const t = pl.trail[i];
    ctx.globalAlpha = t.a;
    ctx.fillStyle = '#3390ec';
    ctx.fillRect(t.x, t.y - camY, pl.w, pl.h);
  }
  ctx.globalAlpha = 1;

  // player
  const px = pl.x;
  const py = pl.y - camY;
  ctx.fillStyle = pl.onWall ? '#ff9500' : '#3390ec';
  ctx.fillRect(px, py, pl.w, pl.h);

  // eye
  ctx.fillStyle = '#fff';
  const eyeOffset = pl.onWall ? pl.wallSide * 4 : (pl.vx >= 0 ? 4 : -4);
  ctx.fillRect(px + pl.w / 2 + eyeOffset - 2, py + 8, 4, 4);

  // wall indicator
  if (pl.onWall) {
    ctx.fillStyle = 'rgba(255,149,0,0.20)';
    const wx = pl.wallSide === -1 ? 0 : GAME_WIDTH - 10;
    ctx.fillRect(wx, 0, 10, GAME_HEIGHT);
  }

  // UI
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px system-ui';
  ctx.fillText(`Score: ${pl.score}`, 12, 26);

  ctx.font = '14px system-ui';
  ctx.fillText(`High: ${highScore}`, 12, 48);

  if (pl.combo > 1) {
    ctx.fillStyle = `hsl(${Math.min(pl.combo * 14, 70)}, 100%, 60%)`;
    ctx.font = 'bold 16px system-ui';
    ctx.fillText(`${pl.combo}x`, GAME_WIDTH - 55, 30);
  }

  // overlays
  if (!game.started) {
    overlay(ctx, highScore, 'WALL KICKERS', 'Tap to jump from walls', 'TAP TO START');
  }

  if (!pl.alive) {
    overlay(ctx, highScore, 'GAME OVER', `Score: ${pl.score}`, 'Press Restart');
  }
}

function overlay(ctx, highScore, title, line1, line2) {
  ctx.fillStyle = 'rgba(0,0,0,0.78)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.fillStyle = title === 'GAME OVER' ? '#ff3b30' : '#fff';
  ctx.font = 'bold 28px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(title, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60);

  ctx.fillStyle = '#fff';
  ctx.font = '18px system-ui';
  ctx.fillText(line1, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);

  ctx.fillStyle = '#3390ec';
  ctx.font = 'bold 20px system-ui';
  ctx.fillText(line2, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);

  ctx.fillStyle = '#8e8e93';
  ctx.font = '14px system-ui';
  ctx.fillText(`Best Score: ${highScore}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70);

  ctx.textAlign = 'left';
}
