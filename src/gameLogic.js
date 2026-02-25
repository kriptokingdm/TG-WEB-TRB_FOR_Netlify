// gameLogic.js
export const GAME_WIDTH = 360;
export const GAME_HEIGHT = 640;

/* =========================
   BASE PHYSICS
========================= */
const BASE_GRAVITY = 0.55;
const BASE_MAX_FALL = 14;
const BASE_WALL_SLIDE = 2.2;

const BASE_WALL_KICK_X = 9.2;
const BASE_WALL_KICK_Y = 12.0;
const BASE_GROUND_JUMP = 11.2;
const AIR_NUDGE = 0.7;

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
    wallSlide: BASE_WALL_SLIDE + 0.6 * t,
    wallKickX: BASE_WALL_KICK_X + 0.8 * t,
    wallKickY: BASE_WALL_KICK_Y + 0.6 * t,
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
    y: GAME_HEIGHT - 140,
    w: 24,
    h: 24,
    vx: 0,
    vy: 0,
    alive: true,

    onWall: false,
    wallSide: 0,
    onGround: false,

    score: 0,
    bestY: GAME_HEIGHT - 140,

    combo: 1,
    trail: [],
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
   JUMP ACTION
========================= */
export function jumpAction(game) {
  const pl = game.player;
  if (!pl.alive) return;

  const diff = difficultyFromScore(pl.score);

  const px = pl.x + pl.w / 2;
  const py = pl.y + pl.h;
  const color = pl.onWall ? 'rgba(255,170,70,0.95)' : 'rgba(120,190,255,0.95)';
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

  pl.trail.unshift({ x: pl.x, y: pl.y, a: 0.18 });
  if (pl.trail.length > 10) pl.trail.pop();
  pl.trail.forEach((t, i) => (t.a = Math.max(0, 0.22 - i * 0.022)));

  updateParticles(game.particles, dt);

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

  pl.vy += diff.gravity * dt;
  pl.vy = clamp(pl.vy, -50, diff.maxFall);

  if (pl.onWall && pl.vy > 0) pl.vy = Math.min(pl.vy, diff.wallSlide);

  pl.x += pl.vx * dt;
  pl.y += pl.vy * dt;

  pl.vx *= Math.pow(0.992, dt);

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
      pl.onWall = false;
      pl.wallSide = 0;

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
      } else {
        pl.combo = 1;
      }

      if (pl.combo > 1) pl.combo = Math.max(1, Math.floor(pl.combo * 0.9));
      break;
    }

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

  const desiredCam = pl.y - TARGET_SCREEN_Y;
  game.cameraY = Math.min(game.cameraY, desiredCam);

  const killLine = game.cameraY + GAME_HEIGHT + DESPAWN_BELOW;
  for (let i = platforms.length - 1; i >= 0; i--) {
    if (platforms[i].y > killLine) platforms.splice(i, 1);
  }

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

  if (pl.y > game.cameraY + GAME_HEIGHT + 140) {
    pl.alive = false;
  }

  game._dirty = true;
}

/* =========================
   DRAW (dark doodle vibe)
========================= */

function prng(n) {
  // детерминированный 0..1
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
  // слой звёзд
  for (let i = 0; i < 80; i++) {
    const s = prng(i + 1);
    const x = Math.floor(s * (GAME_WIDTH - 2)) + 1;

    // “world y” скроллится медленнее для параллакса
    const wy = (i * 120) + Math.floor(camY * 0.25);
    const y = (wy % (GAME_HEIGHT + 140)) - 60;

    const a = 0.25 + prng(i * 17.7) * 0.55;
    const r = 0.8 + prng(i * 7.3) * 1.8;

    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(234,242,255,1)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawMoon(ctx) {
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = 'rgba(234,242,255,0.15)';
  ctx.beginPath();
  ctx.arc(GAME_WIDTH - 62, 70, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(10,16,32,0.90)';
  ctx.beginPath();
  ctx.arc(GAME_WIDTH - 52, 62, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawPlatform(ctx, x, y, w, h, type, p) {
  // тень
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  roundRect(ctx, x, y + 2, w, h, 6);
  ctx.fill();

  if (type === 'spike') {
    ctx.fillStyle = 'rgba(255, 90, 90, 0.95)';
    roundRect(ctx, x, y, w, h, 6);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    const spikeCount = Math.max(3, Math.floor(w / 15));
    for (let i = 0; i < spikeCount; i++) {
      const sx = x + i * (w / spikeCount) + 8;
      ctx.beginPath();
      ctx.moveTo(sx, y);
      ctx.lineTo(sx - 4, y - 7);
      ctx.lineTo(sx + 4, y - 7);
      ctx.closePath();
      ctx.fill();
    }
    return;
  }

  if (type === 'moving') {
    ctx.fillStyle = 'rgba(180, 120, 255, 0.92)';
    roundRect(ctx, x, y, w, h, 6);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    const n = Math.max(2, Math.floor(w / 22));
    for (let i = 0; i < n; i++) {
      const ax = x + i * 22 + 12;
      ctx.beginPath();
      ctx.moveTo(ax, y + h / 2);
      ctx.lineTo(ax + 5 * p.dir, y + 3);
      ctx.lineTo(ax + 5 * p.dir, y + h - 3);
      ctx.closePath();
      ctx.fill();
    }
    return;
  }

  if (type === 'breakable') {
    ctx.fillStyle = p.broken ? 'rgba(170, 150, 120, 0.75)' : 'rgba(255, 170, 70, 0.95)';
    roundRect(ctx, x, y, w, h, 6);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 3);
    ctx.lineTo(x + 22, y + h - 2);
    ctx.moveTo(x + 34, y + 2);
    ctx.lineTo(x + 44, y + h - 3);
    ctx.stroke();
    return;
  }

  if (type === 'start') {
    ctx.fillStyle = 'rgba(90, 220, 140, 0.92)';
    roundRect(ctx, x, y, w, h, 6);
    ctx.fill();

    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.font = '900 12px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('START', x + w / 2, y + h - 2);
    ctx.textAlign = 'left';
    return;
  }

  // normal / ledge (неон-лайм)
  ctx.fillStyle = 'rgba(120, 255, 150, 0.88)';
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();

  // верхняя подсветка
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  roundRect(ctx, x + 2, y + 2, w - 4, 3, 4);
  ctx.fill();

  // outline
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 1;
  roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 6);
  ctx.stroke();
}

function drawDoodler(ctx, x, y, w, h, onWall, wallSide, vx) {
  const cx = x + w / 2;
  const cy = y + h / 2;

  // soft shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, y + h + 3, w * 0.50, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // body
  ctx.fillStyle = 'rgba(234,242,255,0.92)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.52, h * 0.50, 0, 0, Math.PI * 2);
  ctx.fill();

  // visor/hat
  ctx.fillStyle = onWall ? 'rgba(255,170,70,0.95)' : 'rgba(120,190,255,0.95)';
  roundRect(ctx, x + 4, y + 2, w - 8, 7, 4);
  ctx.fill();

  // eyes
  const dir = onWall ? -wallSide : (vx >= 0 ? 1 : -1);
  const ex = cx + dir * 3;

  ctx.fillStyle = 'rgba(10,16,32,0.95)';
  ctx.beginPath();
  ctx.arc(ex - 4, y + 13, 2.2, 0, Math.PI * 2);
  ctx.arc(ex + 4, y + 13, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // little glow outline
  ctx.strokeStyle = 'rgba(255,255,255,0.20)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.52, h * 0.50, 0, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawGame(ctx, game, highScore) {
  // bg
  const bg = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  bg.addColorStop(0, '#070a14');
  bg.addColorStop(0.55, '#0a1020');
  bg.addColorStop(1, '#05060d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  const camY = game.cameraY;

  drawStars(ctx, camY);
  drawMoon(ctx);

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

  // player trail
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
  drawDoodler(ctx, pl.x, pl.y - camY, pl.w, pl.h, pl.onWall, pl.wallSide, pl.vx);

  // tiny in-canvas HUD (дополнительно, но не мешает)
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '900 16px system-ui';
  ctx.fillText(`Score ${pl.score}`, 12, 24);

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '12px system-ui';
  ctx.fillText(`Best ${highScore}`, 12, 42);

  // combo top-right
  if (pl.combo > 1 && pl.alive && game.started) {
    const txt = `${pl.combo}x`;
    ctx.font = '900 14px system-ui';
    const tw = ctx.measureText(txt).width;
    const bx = GAME_WIDTH - (tw + 22) - 10;
    const by = 10;

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 1;
    roundRect(ctx, bx, by, tw + 22, 26, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(txt, bx + 11, by + 18);
  }
  ctx.globalAlpha = 1;
}