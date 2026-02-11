// gameLogic.js
export const GAME_WIDTH = 360;
export const GAME_HEIGHT = 640;

/* =========================
   BASE PHYSICS (будет скейлиться сложностью)
========================= */
const BASE_GRAVITY = 0.55;
const BASE_MAX_FALL = 14;
const BASE_WALL_SLIDE = 2.2;

// Прыжки
const BASE_WALL_KICK_X = 9.2;
const BASE_WALL_KICK_Y = 12.0; // вверх
const BASE_GROUND_JUMP = 11.2;
const AIR_NUDGE = 0.7;

// Генерация мира
const MARGIN_X = 18;
const PLATFORM_H = 12;

// Платформы-уступы (короткие "ступеньки" у стен как в Wall Kickers)
const LEDGE_W_MIN = 34;
const LEDGE_W_MAX = 68;

// “обычные” платформы (чуть длиннее)
const PLATFORM_W_MIN = 54;
const PLATFORM_W_MAX = 96;

// Гап по Y (будет увеличиваться с прогрессом, но без тупиков)
const GAP_Y_MIN = 78;
const GAP_Y_MAX = 118;

// Сколько держать игрока в верхней трети
const TARGET_SCREEN_Y = GAME_HEIGHT * 0.35;

// Спавн/деспавн
const DESPAWN_BELOW = 260;
const SPAWN_AHEAD = 240;

// Safety: гарантируем “спасательную” платформу
const SAFETY_EVERY = 5;

/* =========================
   UTILS
========================= */
function rand(min, max) {
  return min + Math.random() * (max - min);
}
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function pickWeighted(items) {
  // items: [{v, w}]
  let sum = 0;
  for (const it of items) sum += it.w;
  let r = Math.random() * sum;
  for (const it of items) {
    r -= it.w;
    if (r <= 0) return it.v;
  }
  return items[items.length - 1].v;
}
function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
function id() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

/* =========================
   DIFFICULTY (по score/высоте)
   - больше spike/moving
   - меньше ширина
   - больше gap
   - чуть сильнее гравитация/скорости
========================= */
function difficultyFromScore(score) {
  // 0..1.2 примерно
  const t = clamp(score / 350, 0, 1);
  return {
    t,
    gravity: BASE_GRAVITY + 0.08 * t,
    maxFall: BASE_MAX_FALL + 3.5 * t,
    wallSlide: BASE_WALL_SLIDE + 0.6 * t,
    wallKickX: BASE_WALL_KICK_X + 0.8 * t,
    wallKickY: BASE_WALL_KICK_Y + 0.6 * t, // чуть выше на сложности
    groundJump: BASE_GROUND_JUMP + 0.3 * t,

    gapY: clamp(rand(GAP_Y_MIN, GAP_Y_MAX) + 18 * t, GAP_Y_MIN, GAP_Y_MAX + 26),
    widthMul: 1 - 0.22 * t,

    spikeChance: 0.06 + 0.18 * t,
    breakChance: 0.10 + 0.12 * t,
    movingChance: 0.10 + 0.16 * t,

    movingSpeedMul: 1 + 0.65 * t,
  };
}

/* =========================
   PLAYER
========================= */
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

/* =========================
   PLATFORMS
   Типы:
   - ledge: короткая у стены (основа Wall Kickers)
   - normal: обычная
   - moving: движется по X
   - breakable: ломается
   - spike: убивает при касании сверху
   - start: стартовая
========================= */

function createStartPlatform(y) {
  return {
    id: id(),
    x: GAME_WIDTH / 2 - 46,
    y,
    w: 92,
    h: PLATFORM_H,
    type: 'start',
    broken: false,
    dir: 1,
    speed: 0,
    crumble: 0,
    safe: true,
  };
}

function createLedge(y, side, diff, forceSafe = false) {
  // side: -1 left wall, 1 right wall
  const w = clamp(rand(LEDGE_W_MIN, LEDGE_W_MAX) * diff.widthMul, 26, LEDGE_W_MAX);
  const x = side === -1 ? MARGIN_X : (GAME_WIDTH - MARGIN_X - w);

  const type = forceSafe
    ? 'ledge'
    : pickPlatformType(diff, /*preferLedge*/ true);

  return buildPlatform({ x, y, w, type, diff, safe: forceSafe });
}

function createCenterishPlatform(y, sideHint, diff, forceSafe = false) {
  // иногда нужны “не у стены”, но так, чтобы не было тупика.
  // sideHint влияет на позицию (чтобы траектория читалась)
  const w = clamp(rand(PLATFORM_W_MIN, PLATFORM_W_MAX) * diff.widthMul, 42, PLATFORM_W_MAX);
  const rangeLeft = MARGIN_X + 20;
  const rangeRight = GAME_WIDTH - MARGIN_X - 20 - w;

  let x;
  if (sideHint === -1) {
    x = rand(rangeLeft, clamp(rangeLeft + 130, rangeLeft, rangeRight));
  } else if (sideHint === 1) {
    x = rand(clamp(rangeRight - 130, rangeLeft, rangeRight), rangeRight);
  } else {
    x = rand(rangeLeft, rangeRight);
  }

  const type = forceSafe
    ? 'normal'
    : pickPlatformType(diff, /*preferLedge*/ false);

  return buildPlatform({ x, y, w, type, diff, safe: forceSafe });
}

function pickPlatformType(diff, preferLedge) {
  // Чем выше сложность — тем больше moving/spike/breakable
  const spike = diff.spikeChance;
  const moving = diff.movingChance;
  const brk = diff.breakChance;

  // ledge — это форма, а type — поведение. Для ledge чаще делаем normal/ledge,
  // чтобы игра была честной.
  const baseNormal = preferLedge ? 0.78 : 0.62;

  return pickWeighted([
    { v: 'normal', w: baseNormal },
    { v: 'moving', w: moving },
    { v: 'breakable', w: brk },
    { v: 'spike', w: spike },
  ]);
}

function buildPlatform({ x, y, w, type, diff, safe }) {
  const p = {
    id: id(),
    x,
    y,
    w,
    h: PLATFORM_H,
    type,
    broken: false,
    crumble: 0,
    dir: Math.random() > 0.5 ? 1 : -1,
    speed: rand(0.6, 1.35) * diff.movingSpeedMul,
    safe: !!safe, // safe=true => никогда не spike
  };

  if (p.safe && p.type === 'spike') p.type = 'normal';
  return p;
}

export function generatePlatforms(count = 18, startY = GAME_HEIGHT - 90) {
  const platforms = [];
  platforms.push(createStartPlatform(GAME_HEIGHT - 50));

  let y = startY;
  let side = Math.random() > 0.5 ? 1 : -1;
  let safetyCounter = 0;

  // Ранние платформы — больше ledge, чтобы сразу “wall kick” чувствовался
  for (let i = 0; i < count; i++) {
    const diff = difficultyFromScore(0);
    const gap = diff.gapY;

    // чередуем стороны почти всегда
    side *= -1;

    const forceSafe = safetyCounter >= SAFETY_EVERY;
    const useLedge = Math.random() < 0.75;

    platforms.push(
      useLedge ? createLedge(y, side, diff, forceSafe) : createCenterishPlatform(y, side, diff, forceSafe)
    );

    safetyCounter = forceSafe ? 0 : safetyCounter + 1;
    y -= gap;
  }

  return platforms;
}

/* =========================
   PARTICLES
========================= */
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

/* =========================
   GAME STATE
========================= */
export function createGame() {
  return {
    started: false,
    running: true,

    cameraY: 0,
    player: createPlayer(),
    platforms: generatePlatforms(),
    particles: [],

    // генератор
    nextSide: Math.random() > 0.5 ? 1 : -1,
    safetyCounter: 0,

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

  game.nextSide = Math.random() > 0.5 ? 1 : -1;
  game.safetyCounter = 0;

  game._dirty = true;
}

/* =========================
   JUMP ACTION (Wall kick feel)
========================= */
export function jumpAction(game) {
  const pl = game.player;
  if (!pl.alive) return;

  const diff = difficultyFromScore(pl.score);

  // particles
  const px = pl.x + pl.w / 2;
  const py = pl.y + pl.h;
  const color = pl.onWall ? '#ff9500' : '#3390ec';
  game.particles.push(...createParticles(px, py, color, 8));

  if (pl.onWall) {
    pl.vx = diff.wallKickX * -pl.wallSide;
    pl.vy = -diff.wallKickY;
    pl.onWall = false;
    pl.wallSide = 0;
    pl.onGround = false;
    pl.combo = clamp(pl.combo + 1, 1, 99);
    return;
  }

  if (pl.onGround) {
    pl.vy = -diff.groundJump;
    if (Math.abs(pl.vx) < 1) pl.vx = (Math.random() > 0.5 ? 1 : -1) * 1.8;
    pl.onGround = false;
    pl.combo = 1;
    return;
  }

  // air nudge (лёгкий контроль)
  if (pl.vx > 0) pl.vx += AIR_NUDGE;
  else if (pl.vx < 0) pl.vx -= AIR_NUDGE;
  else pl.vx = (Math.random() > 0.5 ? 1 : -1) * AIR_NUDGE;
}

/* =========================
   STEP
========================= */
export function stepGame(game, dt = 1) {
  const pl = game.player;
  const platforms = game.platforms;
  const diff = difficultyFromScore(pl.score);

  // trail
  pl.trail.unshift({ x: pl.x, y: pl.y, a: 0.22 });
  if (pl.trail.length > 10) pl.trail.pop();
  pl.trail.forEach((t, i) => (t.a = Math.max(0, 0.26 - i * 0.022)));

  updateParticles(game.particles, dt);

  // platform updates
  for (const p of platforms) {
    if (p.type === 'moving' && !p.broken) {
      p.x += p.dir * p.speed * dt;
      const left = MARGIN_X;
      const right = GAME_WIDTH - MARGIN_X - p.w;
      if (p.x < left) { p.x = left; p.dir *= -1; }
      if (p.x > right) { p.x = right; p.dir *= -1; }
    }

    if (p.type === 'breakable' && p.broken) {
      p.crumble = clamp(p.crumble + 0.08 * dt, 0, 1);
      p.h = clamp(PLATFORM_H * (1 - p.crumble), 0, PLATFORM_H);
    }
  }

  // physics
  const prevX = pl.x;
  const prevY = pl.y;

  pl.vy += diff.gravity * dt;
  pl.vy = clamp(pl.vy, -50, diff.maxFall);

  if (pl.onWall && pl.vy > 0) pl.vy = Math.min(pl.vy, diff.wallSlide);

  pl.x += pl.vx * dt;
  pl.y += pl.vy * dt;

  // air drag
  pl.vx *= Math.pow(0.992, dt);

  // walls bounds
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

  // collisions
  pl.onGround = false;

  for (const p of platforms) {
    if (p.type === 'breakable' && p.broken && p.h <= 0.1) continue;

    if (!aabb(pl.x, pl.y, pl.w, pl.h, p.x, p.y, p.w, p.h)) continue;

    // landing check
    const wasAbove = prevY + pl.h <= p.y + 1;
    const movingDown = pl.vy > 0;

    if (wasAbove && movingDown) {
      pl.y = p.y - pl.h;
      pl.vy = 0;
      pl.onGround = true;
      pl.onWall = false;
      pl.wallSide = 0;

      if (p.type === 'spike') {
        pl.alive = false;
        break;
      }

      if (p.type === 'breakable' && !p.broken) {
        p.broken = true;
        game.particles.push(...createParticles(pl.x + pl.w / 2, pl.y + pl.h, '#ff9500', 10));
      }

      // score by bestY
      if (p.type !== 'start') {
        pl.bestY = Math.min(pl.bestY, pl.y);
        const height = Math.max(0, (GAME_HEIGHT - pl.bestY));
        pl.score = Math.max(pl.score, Math.floor(height / 6));
      } else {
        pl.combo = 1;
      }

      // landing resets combo a bit (как “разрядка”)
      if (pl.combo > 1) pl.combo = Math.max(1, Math.floor(pl.combo * 0.9));

      break;
    }

    // side push-out
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

  // camera (только вверх)
  const desiredCam = pl.y - TARGET_SCREEN_Y;
  game.cameraY = Math.min(game.cameraY, desiredCam);

  // despawn below camera
  const killLine = game.cameraY + GAME_HEIGHT + DESPAWN_BELOW;
  for (let i = platforms.length - 1; i >= 0; i--) {
    if (platforms[i].y > killLine) platforms.splice(i, 1);
  }

  // spawn ahead (top)
  let topMostY = Infinity;
  for (const p of platforms) topMostY = Math.min(topMostY, p.y);

  const wantTop = game.cameraY - SPAWN_AHEAD;

  while (topMostY > wantTop) {
    topMostY -= diff.gapY;

    // Генерация без тупиков:
    // 1) почти всегда чередуем стороны
    // 2) иногда вставляем “центр”, но рядом со стороной
    game.nextSide *= -1;

    const forceSafe = game.safetyCounter >= SAFETY_EVERY;
    const mostlyLedge = Math.random() < 0.78; // как Wall Kickers

    // ограничиваем типы платформ если сложность низкая
    const p = mostlyLedge
      ? createLedge(topMostY, game.nextSide, diff, forceSafe)
      : createCenterishPlatform(topMostY, game.nextSide, diff, forceSafe);

    platforms.push(p);

    game.safetyCounter = forceSafe ? 0 : game.safetyCounter + 1;
  }

  // death if fell below screen
  if (pl.y > game.cameraY + GAME_HEIGHT + 140) {
    pl.alive = false;
  }

  game._dirty = true;
}

/* =========================
   DRAW
========================= */
export function drawGame(ctx, game, highScore) {
  // bg gradient
  const bg = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  bg.addColorStop(0, '#11162a');
  bg.addColorStop(0.5, '#101b35');
  bg.addColorStop(1, '#0b2a4b');
  ctx.fillStyle = bg;
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

  // particles
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
      // normal/ledge
      // чуть разный цвет, чтобы “ledge” читался визуально
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
