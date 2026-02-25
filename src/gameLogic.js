// gameLogic.js
export const GAME_WIDTH = 360;
export const GAME_HEIGHT = 640;

/* =========================
   BASE PHYSICS
========================= */
const BASE_GRAVITY = 0.55;
const BASE_MAX_FALL = 14;

// прыжок (как “дудл”)
const BASE_JUMP_Y = 12.0;

// управление по тапу
const TAP_HORZ_MAX = 8.8;      // максимальная горизонтальная скорость от тапа
const TAP_HORZ_SMOOTH = 0.55;  // насколько резко перестраиваем vx (0..1)

// Генерация мира
const MARGIN_X = 18;
const PLATFORM_H = 12;

const LEDGE_W_MIN = 34;
const LEDGE_W_MAX = 68;

const PLATFORM_W_MIN = 54;
const PLATFORM_W_MAX = 96;

const GAP_Y_MIN = 78;
const GAP_Y_MAX = 118;

const TARGET_SCREEN_Y = GAME_HEIGHT * 0.35;
const DESPAWN_BELOW = 260;
const SPAWN_AHEAD = 240;
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
   DIFFICULTY
========================= */
function difficultyFromScore(score) {
  const t = clamp(score / 350, 0, 1);
  return {
    t,
    gravity: BASE_GRAVITY + 0.08 * t,
    maxFall: BASE_MAX_FALL + 3.5 * t,
    jumpY: BASE_JUMP_Y + 0.6 * t,

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
    y: GAME_HEIGHT - 140,
    w: 24,
    h: 24,
    vx: 0,
    vy: 0,
    alive: true,

    // без стен
    onGround: false,

    score: 0,
    bestY: GAME_HEIGHT - 140,

    trail: [],
    _tapX: GAME_WIDTH / 2, // последняя цель по X
  };
}

/* =========================
   PLATFORMS
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
  const w = clamp(rand(LEDGE_W_MIN, LEDGE_W_MAX) * diff.widthMul, 26, LEDGE_W_MAX);
  const x = side === -1 ? MARGIN_X : (GAME_WIDTH - MARGIN_X - w);
  const type = forceSafe ? 'ledge' : pickPlatformType(diff, true);
  return buildPlatform({ x, y, w, type, diff, safe: forceSafe });
}

function createCenterishPlatform(y, sideHint, diff, forceSafe = false) {
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

  const type = forceSafe ? 'normal' : pickPlatformType(diff, false);
  return buildPlatform({ x, y, w, type, diff, safe: forceSafe });
}

function pickPlatformType(diff, preferLedge) {
  const spike = diff.spikeChance;
  const moving = diff.movingChance;
  const brk = diff.breakChance;

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
    safe: !!safe,
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

  for (let i = 0; i < count; i++) {
    const diff = difficultyFromScore(0);
    const gap = diff.gapY;

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
   TAP ACTION = jump + steer to tapX
========================= */
export function jumpAction(game, tapX) {
  const pl = game.player;
  if (!pl.alive) return;

  const diff = difficultyFromScore(pl.score);

  // сохраняем цель
  pl._tapX = clamp(tapX ?? GAME_WIDTH / 2, 0, GAME_WIDTH);

  // steering: vx тянем к нужной скорости (направление в сторону тапа)
  const center = pl.x + pl.w / 2;
  const dx = pl._tapX - center;

  // нормализуем: левый край -> -1, правый -> +1
  const dir = clamp(dx / (GAME_WIDTH * 0.5), -1, 1);
  const targetVx = dir * TAP_HORZ_MAX;

  pl.vx = pl.vx + (targetVx - pl.vx) * TAP_HORZ_SMOOTH;

  // прыжок — всегда (как “тап = прыжок”), но без стен
  // если хочешь “только когда на платформе” — скажи, сделаю.
  pl.vy = -diff.jumpY;
  pl.onGround = false;

  // particles
  game.particles.push(...createParticles(center, pl.y + pl.h, 'rgba(120,190,255,0.95)', 7));
}

/* =========================
   STEP
========================= */
export function stepGame(game, dt = 1) {
  const pl = game.player;
  const platforms = game.platforms;
  const diff = difficultyFromScore(pl.score);

  // trail
  pl.trail.unshift({ x: pl.x, y: pl.y, a: 0.18 });
  if (pl.trail.length > 10) pl.trail.pop();
  pl.trail.forEach((t, i) => (t.a = Math.max(0, 0.22 - i * 0.022)));

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

  const prevX = pl.x;
  const prevY = pl.y;

  // gravity
  pl.vy += diff.gravity * dt;
  pl.vy = clamp(pl.vy, -50, diff.maxFall);

  // integrate
  pl.x += pl.vx * dt;
  pl.y += pl.vy * dt;

  // air drag
  pl.vx *= Math.pow(0.992, dt);

  // === WRAP like Doodle Jump (no wall cling) ===
  if (pl.x < -pl.w) pl.x = GAME_WIDTH;
  if (pl.x > GAME_WIDTH) pl.x = -pl.w;

  // collisions with platforms (land only from above)
  pl.onGround = false;

  for (const p of platforms) {
    if (p.type === 'breakable' && p.broken && p.h <= 0.1) continue;
    if (!aabb(pl.x, pl.y, pl.w, pl.h, p.x, p.y, p.w, p.h)) continue;

    const wasAbove = prevY + pl.h <= p.y + 1;
    const movingDown = pl.vy > 0;

    if (wasAbove && movingDown) {
      pl.y = p.y - pl.h;
      pl.vy = 0;
      pl.onGround = true;

      if (p.type === 'spike') {
        pl.alive = false;
        break;
      }

      if (p.type === 'breakable' && !p.broken) {
        p.broken = true;
        game.particles.push(...createParticles(pl.x + pl.w / 2, pl.y + pl.h, 'rgba(255,170,70,0.95)', 10));
      }

      if (p.type !== 'start') {
        pl.bestY = Math.min(pl.bestY, pl.y);
        const height = Math.max(0, (GAME_HEIGHT - pl.bestY));
        pl.score = Math.max(pl.score, Math.floor(height / 6));
      }

      break;
    }

    // боковые выталкивания оставим, чтобы не застревал в платформе
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

  // camera up
  const desiredCam = pl.y - TARGET_SCREEN_Y;
  game.cameraY = Math.min(game.cameraY, desiredCam);

  // despawn
  const killLine = game.cameraY + GAME_HEIGHT + DESPAWN_BELOW;
  for (let i = platforms.length - 1; i >= 0; i--) {
    if (platforms[i].y > killLine) platforms.splice(i, 1);
  }

  // spawn ahead
  let topMostY = Infinity;
  for (const p of platforms) topMostY = Math.min(topMostY, p.y);

  const wantTop = game.cameraY - SPAWN_AHEAD;

  while (topMostY > wantTop) {
    topMostY -= diff.gapY;

    game.nextSide *= -1;

    const forceSafe = game.safetyCounter >= SAFETY_EVERY;
    const mostlyLedge = Math.random() < 0.78;

    const p = mostlyLedge
      ? createLedge(topMostY, game.nextSide, diff, forceSafe)
      : createCenterishPlatform(topMostY, game.nextSide, diff, forceSafe);

    platforms.push(p);
    game.safetyCounter = forceSafe ? 0 : game.safetyCounter + 1;
  }

  // death if fell
  if (pl.y > game.cameraY + GAME_HEIGHT + 140) {
    pl.alive = false;
  }

  game._dirty = true;
}

/* =========================
   DRAW (оставь твой тёмный рендер или любой)
   — тут можно оставить твой текущий drawGame.
   Я не ломаю его: просто добавь highScore параметр как раньше.
========================= */

function prng(n) {
  const x = Math.sin(n * 999.123) * 10000;
  return x - Math.floor(x);
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawStars(ctx, camY) {
  for (let i = 0; i < 80; i++) {
    const s = prng(i + 1);
    const x = Math.floor(s * (GAME_WIDTH - 2)) + 1;
    const wy = (i * 120) + Math.floor(camY * 0.25);
    const y = (wy % (GAME_HEIGHT + 140)) - 60;

    const a = 0.25 + prng(i * 17.7) * 0.55;
    const rr = 0.8 + prng(i * 7.3) * 1.8;

    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(234,242,255,1)';
    ctx.beginPath();
    ctx.arc(x, y, rr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawPlatform(ctx, x, y, w, h, type, p) {
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  roundRect(ctx, x, y + 2, w, h, 6);
  ctx.fill();

  if (type === 'spike') {
    ctx.fillStyle = 'rgba(255, 90, 90, 0.95)';
    roundRect(ctx, x, y, w, h, 6);
    ctx.fill();
    return;
  }

  if (type === 'moving') {
    ctx.fillStyle = 'rgba(180, 120, 255, 0.92)';
    roundRect(ctx, x, y, w, h, 6);
    ctx.fill();
    return;
  }

  if (type === 'breakable') {
    ctx.fillStyle = p.broken ? 'rgba(170, 150, 120, 0.75)' : 'rgba(255, 170, 70, 0.95)';
    roundRect(ctx, x, y, w, h, 6);
    ctx.fill();
    return;
  }

  if (type === 'start') {
    ctx.fillStyle = 'rgba(90, 220, 140, 0.92)';
    roundRect(ctx, x, y, w, h, 6);
    ctx.fill();
    return;
  }

  ctx.fillStyle = 'rgba(120, 255, 150, 0.88)';
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  roundRect(ctx, x + 2, y + 2, w - 4, 3, 4);
  ctx.fill();
}

function drawDoodler(ctx, x, y, w, h) {
  const cx = x + w / 2;
  const cy = y + h / 2;

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, y + h + 3, w * 0.50, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(234,242,255,0.92)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.52, h * 0.50, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(120,190,255,0.95)';
  roundRect(ctx, x + 4, y + 2, w - 8, 7, 4);
  ctx.fill();

  ctx.fillStyle = 'rgba(10,16,32,0.95)';
  ctx.beginPath();
  ctx.arc(cx - 4, y + 13, 2.2, 0, Math.PI * 2);
  ctx.arc(cx + 4, y + 13, 2.2, 0, Math.PI * 2);
  ctx.fill();
}

export function drawGame(ctx, game, highScore) {
  const bg = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  bg.addColorStop(0, '#070a14');
  bg.addColorStop(0.55, '#0a1020');
  bg.addColorStop(1, '#05060d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  const camY = game.cameraY;
  drawStars(ctx, camY);

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
    drawPlatform(ctx, sx, sy, p.w, p.h, p.type, p);
  }

  // trail
  const pl = game.player;
  for (let i = 0; i < pl.trail.length; i++) {
    const t = pl.trail[i];
    ctx.globalAlpha = t.a;
    ctx.fillStyle = 'rgba(120,190,255,0.18)';
    ctx.beginPath();
    ctx.ellipse(t.x + pl.w / 2, (t.y - camY) + pl.h / 2, pl.w * 0.44, pl.h * 0.40, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // player
  drawDoodler(ctx, pl.x, pl.y - camY, pl.w, pl.h);

  // tiny HUD
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '900 16px system-ui';
  ctx.fillText(`Score ${pl.score}`, 12, 24);

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '12px system-ui';
  ctx.fillText(`Best ${highScore}`, 12, 42);
}