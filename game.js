'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3, fugaz = false) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    this.fugaz = fugaz;
    this.ttlMax = fugaz ? rand(8, 12) : 0;
    this.ttl = this.ttlMax;

    const angle = rand(0, Math.PI * 2);
    const speed = (SPEEDS[size] + rand(-15, 15)) * (fugaz ? 2.2 : 1);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    if (this.dead) return;
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;

    // La estrella fugaz se desintegra al agotar su tiempo
    if (this.fugaz) {
      this.ttl -= dt;
      if (this.ttl <= 0) {
        this.dead = true;
        explode(this.x, this.y, 6);
      }
    }
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    if (this.fugaz) {
      // Parpadeo cuando la fugaz está por desintegrarse
      if (this.ttl / this.ttlMax < 0.2 && Math.floor(this.ttl * 8) % 2 === 0) return;

      // Cola de cometa sobre la velocidad
      const sp = Math.hypot(this.vx, this.vy) || 1;
      const ux = this.vx / sp;
      const uy = this.vy / sp;
      for (let i = 1; i <= 6; i++) {
        const f = i / 6;
        ctx.strokeStyle = `rgba(255, 170, 60, ${((1 - f) * 0.7).toFixed(2)})`;
        ctx.lineWidth = 2.4 - f * 1.4;
        ctx.beginPath();
        ctx.moveTo(this.x - ux * this.radius * f, this.y - uy * this.radius * f);
        ctx.lineTo(this.x - ux * (this.radius + 40 * f), this.y - uy * (this.radius + 40 * f));
        ctx.stroke();
      }
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = this.fugaz ? 'rgba(255, 170, 60, 0.95)' : '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Skins ─────────────────────────────────────────────────────────────────────
const SKINS = {
  clasica: {
    name: 'Clásica',
    stroke: '#fff',
    flame: 'rgba(255, 130, 0, 0.85)',
    flameSpeed: 'rgba(0, 255, 255, 0.85)',
    verts: [[20, 0], [-12, -9], [-7, 0], [-12, 9]],
  },
  vibora: {
    name: 'Víbora',
    stroke: '#40e0ff',
    flame: 'rgba(0, 220, 255, 0.85)',
    flameSpeed: 'rgba(255, 255, 255, 0.85)',
    verts: [[24, 0], [3, -6], [-8, -2], [-16, 0], [-8, 2], [3, 6]],
  },
  ala_ancha: {
    name: 'Ala ancha',
    stroke: '#ffd75e',
    flame: 'rgba(255, 200, 60, 0.85)',
    flameSpeed: 'rgba(0, 255, 255, 0.85)',
    verts: [[18, 0], [0, -7], [-14, -14], [-9, -3], [-18, 0], [-9, 3], [-14, 14], [0, 7]],
  },
  rombo: {
    name: 'Rombo',
    stroke: '#ff5ee8',
    flame: 'rgba(255, 60, 200, 0.85)',
    flameSpeed: 'rgba(0, 255, 255, 0.85)',
    verts: [[20, 0], [0, -10], [-14, 0], [0, 10]],
  },
  tanque: {
    name: 'Tanque',
    stroke: '#ff5e5e',
    flame: 'rgba(255, 70, 40, 0.85)',
    flameSpeed: 'rgba(0, 255, 255, 0.85)',
    verts: [[18, 0], [0, -8], [-10, -8], [-15, -4], [-15, 4], [-10, 8], [0, 8]],
  },
};

const SKIN_KEY = 'asteroids-skin';
let currentSkinId = 'clasica';

function storedSkin() {
  try { return localStorage.getItem(SKIN_KEY); } catch (e) { return null; }
}

function setSkin(id) {
  if (!SKINS[id]) return;
  currentSkinId = id;
  try { localStorage.setItem(SKIN_KEY, id); } catch (e) {}
}

function cycleSkin(dir) {
  const ids = Object.keys(SKINS);
  const i   = ids.indexOf(currentSkinId);
  setSkin(ids[(i + dir + ids.length) % ids.length]);
}

// ── Ship ──────────────────────────────────────────────────────────────────────
const SHIELD_MAX      = 100;
const SHIELD_DRAIN    = 30;   // energía/s en uso
const SHIELD_RECHARGE = 18;   // energía/s en reposo
const SHIELD_RADIUS   = 26;

class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedTimer    = 0;
    this.tripleTimer   = 0;
    this.shieldEnergy  = SHIELD_MAX;
    this.shieldActive  = false;
    this.time          = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedTimer    > 0) this.speedTimer    -= dt;
    if (this.tripleTimer   > 0) this.tripleTimer   -= dt;
    this.time += dt;

    // Escudo: se activa mientras se mantiene Shift y queda energía
    const shiftHeld = keys['ShiftLeft'] || keys['ShiftRight'];
    if (shiftHeld && this.shieldEnergy > 0) {
      this.shieldActive = true;
      this.shieldEnergy = Math.max(0, this.shieldEnergy - SHIELD_DRAIN * dt);
    } else {
      this.shieldActive = false;
      if (this.shieldEnergy < SHIELD_MAX)
        this.shieldEnergy = Math.min(SHIELD_MAX, this.shieldEnergy + SHIELD_RECHARGE * dt);
    }

    const ROT   = 3.5;   // rad/s
    const THRUST = 260;  // px/s²
    const DRAG   = 0.987;
    const thrust = this.speedTimer > 0 ? THRUST * 2 : THRUST;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * thrust * dt;
      this.vy += Math.sin(this.angle) * thrust * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.tripleTimer > 0) {
      // Triple shot: 3 balas paralelas en la dirección de la nave
      const SPREAD = 8;
      const px = Math.cos(this.angle + Math.PI / 2);
      const py = Math.sin(this.angle + Math.PI / 2);
      return [-1, 0, 1].map(k => new Bullet(
        ox + px * SPREAD * k,
        oy + py * SPREAD * k,
        this.angle
      ));
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const skin = SKINS[currentSkinId];
    const verts = skin.verts;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = skin.stroke;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Silueta según el skin elegido
    ctx.beginPath();
    ctx.moveTo(verts[0][0], verts[0][1]);
    for (let i = 1; i < verts.length; i++)
      ctx.lineTo(verts[i][0], verts[i][1]);
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor, anclada en la cola del skin
    if (this.thrusting && Math.random() > 0.35) {
      const tail = Math.min(...verts.map(p => p[0]));
      ctx.beginPath();
      ctx.moveTo(tail + 1, -4);
      ctx.lineTo(tail + 1 - rand(6, 13), 0);
      ctx.lineTo(tail + 1,  4);
      ctx.strokeStyle = this.speedTimer > 0 ? skin.flameSpeed : skin.flame;
      ctx.stroke();
    }

    ctx.restore();

    // Escudo: disco cian envolvente
    if (this.shieldActive) {
      const low = this.shieldEnergy < SHIELD_MAX * 0.15;
      if (!(low && Math.floor(this.time * 10) % 2 === 0)) {
        const r      = SHIELD_RADIUS + Math.sin(this.time * 6) * 2;
        const alpha  = (0.25 + (this.shieldEnergy / SHIELD_MAX) * 0.35).toFixed(2);
        ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `rgba(0, 255, 255, 0.05)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Power-up (Velocidad | Triple) ────────────────────────────────────────────
class PowerUp {
  constructor(x, y, type = 'speed') {
    this.x      = x;
    this.y      = y;
    this.type   = type;
    this.radius = 14;
    this.t      = 0;
    this.dead   = false;
  }

  update(dt) {
    this.t += dt;
  }

  draw() {
    const bob = Math.sin(this.t * 3) * 3;
    const pulse = 0.6 + Math.sin(this.t * 6) * 0.4;
    const color = this.type === 'speed'
      ? `rgba(0, 255, 255, ${pulse.toFixed(2)})`
      : `rgba(255, 180, 60, ${pulse.toFixed(2)})`;

    // Resplandor pulsante
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + bob, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    if (this.type === 'speed') {
      // Rayo
      ctx.beginPath();
      ctx.moveTo(this.x + 7, this.y - 12);
      ctx.lineTo(this.x - 3, this.y + 1);
      ctx.lineTo(this.x + 2, this.y + 1);
      ctx.lineTo(this.x - 7, this.y + 12);
      ctx.lineTo(this.x + 4, this.y - 2);
      ctx.lineTo(this.x - 1, this.y - 2);
      ctx.closePath();
      ctx.stroke();
    } else {
      // Tres balas paralelas
      for (const dx of [-9, 0, 9]) {
        ctx.beginPath();
        ctx.moveTo(this.x + dx, this.y + 10);
        ctx.lineTo(this.x + dx, this.y - 12);
        ctx.stroke();
      }
    }
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups;
let score, lives, level;
let state;      // 'menu' | 'playing' | 'dead' | 'gameover'
let deadTimer;
let menuT;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    // ~35% de que un asteroide del oleaje sea una estrella fugaz (mediana)
    asteroids.push(Math.random() < 0.35
      ? new Asteroid(x, y, 2, true)
      : new Asteroid(x, y, 3));
  }
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerups  = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerups  = [];
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  // Cambio de skin en cualquier momento con la tecla C
  if (pressed('KeyC')) cycleSkin(1);

  if (state === 'menu') {
    updateSkinMenu(dt);
    return;
  }

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerups.forEach(p => p.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);

  // Nave recoge el power-up
  for (const p of powerups) {
    if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      if (p.type === 'speed') ship.speedTimer = 5;
      else                    ship.tripleTimer = 5;
      explode(p.x, p.y, 6);
    }
  }
  powerups = powerups.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += POINTS[a.size];
        explode(a.x, a.y, a.size * 5);
        // Drop de power-up Velocidad o Triple (máx. 1 en el campo)
        if (powerups.length === 0 && Math.random() < 0.12)
          powerups.push(new PowerUp(a.x, a.y, Math.random() < 0.5 ? 'speed' : 'triple'));
        newAsteroids.push(...a.split());
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Escudo vs asteroide: los destruye y parte sin dar puntos
  if (ship.shieldActive) {
    for (const a of asteroids) {
      if (!a.dead && dist(ship, a) < SHIELD_RADIUS + a.radius * 0.82) {
        a.dead = true;
        explode(a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
      }
    }
    asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  }

  // Nave vs asteroide
  if (ship.invincible <= 0 && !ship.shieldActive) {
    for (const a of asteroids) {
      if (!a.dead && dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  const skin = SKINS[currentSkinId];
  const s = 0.45;   // escalado a ~9px de nariz, como el icono original
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = skin.stroke;
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo(skin.verts[0][0] * s, skin.verts[0][1] * s);
  for (let i = 1; i < skin.verts.length; i++)
    ctx.lineTo(skin.verts[i][0] * s, skin.verts[i][1] * s);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  // Barra de energía del escudo
  ctx.font      = '12px monospace';
  ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
  ctx.fillText('ESCUDO', 14, 44);
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.35)';
  ctx.lineWidth   = 1;
  ctx.strokeRect(14, 50, 110, 7);
  ctx.fillStyle = ship.shieldActive
    ? 'rgba(0, 255, 255, 0.95)'
    : 'rgba(0, 255, 255, 0.45)';
  ctx.fillRect(15, 51, 108 * (ship.shieldEnergy / SHIELD_MAX), 5);
  ctx.font      = '15px monospace';
  ctx.fillStyle = '#fff';

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  if (ship.speedTimer > 0) {
    ctx.fillStyle = 'rgba(0, 255, 255, 0.9)';
    ctx.fillText(`VELOCIDAD ${ship.speedTimer.toFixed(1)}s`, W / 2, 46);
    ctx.fillStyle = '#fff';
  }

  if (ship.tripleTimer > 0) {
    ctx.fillStyle = 'rgba(255, 180, 60, 0.9)';
    ctx.fillText(`TRIPLE ${ship.tripleTimer.toFixed(1)}s`, W / 2, 64);
    ctx.fillStyle = '#fff';
  }

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  if (state === 'menu') {
    drawSkinMenu();
    return;
  }

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  bullets.forEach(b => b.draw());
  powerups.forEach(p => p.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// ── Arranque: la partida comienza en el menú ─────────────────────────────────
state = 'menu';
menuT = 0;
const store = storedSkin();
if (store && SKINS[store]) currentSkinId = store;
requestAnimationFrame(loop);

// ── Menú de selección de nave ─────────────────────────────────────────────────
function drawSilhouette(id, x, y, scale, rot) {
  const verts = SKINS[id].verts;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(rot);
  ctx.strokeStyle = SKINS[id].stroke;
  ctx.lineWidth   = 1.5 / scale;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo(verts[0][0], verts[0][1]);
  for (let i = 1; i < verts.length; i++)
    ctx.lineTo(verts[i][0], verts[i][1]);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function updateSkinMenu(dt) {
  menuT += dt;
  if (pressed('ArrowLeft'))
    cycleSkin(-1);
  if (pressed('ArrowRight'))
    cycleSkin(1);
  if (pressed('Space') || pressed('Enter'))
    initGame();
}

function drawSkinMenu() {
  ctx.textAlign = 'center';

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 34px monospace';
  ctx.fillText('ELIGE TU NAVE', W / 2, 70);

  // Vista previa grande con balanceo
  const sway = Math.sin(menuT * 1.6) * 0.22;
  drawSilhouette(currentSkinId, W / 2, H / 2 - 20, 2.6, sway);

  ctx.fillStyle = SKINS[currentSkinId].stroke;
  ctx.font = 'bold 20px monospace';
  ctx.fillText(SKINS[currentSkinId].name, W / 2, H / 2 + 120);

  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '15px monospace';
  ctx.fillText('← → o C CAMBIAR   ·   ESPACIO JUGAR', W / 2, H / 2 + 150);

  // Miniaturas de todos los skins, con el activo resaltado
  const ids = Object.keys(SKINS);
  for (let i = 0; i < ids.length; i++) {
    const x = W / 2 + (i - (ids.length - 1) / 2) * 64;
    const y = H - 44;
    const active = ids[i] === currentSkinId;
    ctx.strokeStyle = active ? SKINS[ids[i]].stroke : '#333';
    ctx.lineWidth   = active ? 2 : 1;
    ctx.strokeRect(x - 24, y - 24, 48, 48);
    drawSilhouette(ids[i], x, y, 0.8, -Math.PI / 2);
  }
}
