import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

// ─── Sabitler ────────────────────────────────────────────────────────────────
const WEAPONS = [
  { name: 'PISTOL',   emoji: '🔫', damage: 25,  fireRate: 350,  ammo: Infinity, spread: 0.04, pellets: 1,  speed: 15, color: '#ffcc00' },
  { name: 'SHOTGUN',  emoji: '💥', damage: 14,  fireRate: 750,  ammo: 40,       spread: 0.22, pellets: 6,  speed: 12, color: '#ff6600' },
  { name: 'RAILGUN',  emoji: '⚡', damage: 90,  fireRate: 1100, ammo: 20,       spread: 0,    pellets: 1,  speed: 28, color: '#00ccff' },
];

const RANK_TABLE = [
  { name: 'D',   min: 0,     color: '#888' },
  { name: 'C',   min: 500,   color: '#88cc88' },
  { name: 'B',   min: 1500,  color: '#4488ff' },
  { name: 'A',   min: 3000,  color: '#ff8800' },
  { name: 'S',   min: 6000,  color: '#ff2200' },
  { name: 'SS',  min: 12000, color: '#ff00ff' },
  { name: 'SSS', min: 25000, color: '#ffffff' },
];

const STYLE_WORDS = ['STYLE!', 'CRISPY!', 'EXCELLENT!', 'BRUTAL!', 'ULTRAKILL!'];

const getRank = (score) => {
  for (let i = RANK_TABLE.length - 1; i >= 0; i--) {
    if (score >= RANK_TABLE[i].min) return RANK_TABLE[i];
  }
  return RANK_TABLE[0];
};

// ─── Yardımcı Fonksiyonlar ───────────────────────────────────────────────────
const rand = (min, max) => Math.random() * (max - min) + min;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ─── Oyun Motoru ─────────────────────────────────────────────────────────────
const GameEngine = ({ gameId, onGameOver }) => {
  const canvasRef = useRef(null);
  const stateRef  = useRef(null);
  const animRef   = useRef(null);
  const keysRef   = useRef({});
  const mouseRef  = useRef({ x: 0, y: 0, clicked: false });

  const initState = useCallback((W, H) => ({
    phase: 'playing',           // playing | dead
    player: {
      x: W / 2, y: H / 2,
      vx: 0, vy: 0,
      hp: 100, maxHp: 100,
      speed: 200,
      radius: 10,
      angle: 0,
    },
    weaponIdx:   0,
    weapons:     WEAPONS.map(w => ({ ...w })),
    dashCharges: 3,
    dashCooldown: 0,
    lastFire: 0,
    bullets:   [],
    enemies:   [],
    particles: [],
    floaters:  [],             // skor popup'ları
    score:     0,
    wave:      1,
    killCount: 0,
    styleLevel: 0,
    styleTimer: 0,
    styleFade:  0,
    bossAlive:  false,
    boss:       null,
    waveClear:  false,
    waveClearTimer: 0,
    spawnTimer: 0,
    running:    true,
  }), []);

  const spawnWave = useCallback((s, W, H) => {
    s.bossAlive = false;
    s.boss = null;
    const isBoss = s.wave % 5 === 0;
    const count  = isBoss ? 0 : s.wave * 3 + 2;

    if (isBoss) {
      s.bossAlive = true;
      s.boss = {
        x: W * 0.15, y: H / 2,
        hp: 300 + s.wave * 60, maxHp: 300 + s.wave * 60,
        radius: 32, speed: 55 + s.wave * 4,
        color: '#cc0000', isBoss: true,
        shootTimer: 0, phase: 0, angle: 0,
      };
    } else {
      for (let i = 0; i < count; i++) spawnEnemy(s, W, H);
    }
  }, []);

  const spawnEnemy = (s, W, H) => {
    const side = Math.floor(Math.random() * 4);
    let ex, ey;
    if (side === 0) { ex = rand(0, W); ey = -30; }
    else if (side === 1) { ex = W + 30; ey = rand(0, H); }
    else if (side === 2) { ex = rand(0, W); ey = H + 30; }
    else { ex = -30; ey = rand(0, H); }

    const tier = Math.min(Math.floor(s.wave / 3), 3);
    const colors  = ['#cc3333', '#cc7700', '#9900cc', '#0055cc'];
    const hps     = [30, 55, 90, 140];
    const speeds  = [75, 95, 65, 115];
    s.enemies.push({
      x: ex, y: ey,
      hp: hps[tier] + s.wave * 4,
      maxHp: hps[tier] + s.wave * 4,
      radius: 11 + tier * 4,
      speed: speeds[tier] + s.wave * 2,
      color: colors[tier],
      shootTimer: rand(1, 3),
      isBoss: false,
    });
  };

  const addParticles = (s, x, y, color, n, speed = 120) => {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(speed * 0.4, speed);
      s.particles.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: rand(0.3, 0.6), maxLife: 0.6,
        color, size: rand(2, 5),
      });
    }
  };

  const addFloater = (s, x, y, text, color) => {
    s.floaters.push({ x, y, vy: -60, text, color, life: 1.2, maxLife: 1.2 });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;
    canvas.width  = W;
    canvas.height = H;

    const s = initState(W, H);
    stateRef.current = s;
    spawnWave(s, W, H);

    // ── Input handlers ───────────────────────────────────────────────────────
    const onKey = (e, down) => {
      keysRef.current[e.code] = down;
      // Silah değiştirme
      if (down) {
        if (e.code === 'Digit1') s.weaponIdx = 0;
        if (e.code === 'Digit2') s.weaponIdx = 1;
        if (e.code === 'Digit3') s.weaponIdx = 2;
      }
      // Dash
      if (down && e.code === 'ShiftLeft' && s.dashCharges > 0 && s.dashCooldown <= 0) {
        const k = keysRef.current;
        let dx = 0, dy = 0;
        if (k['KeyW'] || k['ArrowUp'])    dy -= 1;
        if (k['KeyS'] || k['ArrowDown'])  dy += 1;
        if (k['KeyA'] || k['ArrowLeft'])  dx -= 1;
        if (k['KeyD'] || k['ArrowRight']) dx += 1;
        if (dx === 0 && dy === 0) { dx = Math.cos(s.player.angle); dy = Math.sin(s.player.angle); }
        const len = Math.hypot(dx, dy) || 1;
        s.player.vx += (dx / len) * 600;
        s.player.vy += (dy / len) * 600;
        s.dashCharges--;
        s.dashCooldown = 1.5;
        addParticles(s, s.player.x, s.player.y, '#00ccff', 8, 80);
      }
      e.preventDefault();
    };

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - rect.left) * (W / rect.width);
      mouseRef.current.y = (e.clientY - rect.top)  * (H / rect.height);
      s.player.angle = Math.atan2(mouseRef.current.y - s.player.y, mouseRef.current.x - s.player.x);
    };

    const onMouseDown = () => { mouseRef.current.down = true; };
    const onMouseUp   = () => { mouseRef.current.down = false; };

    const onResize = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width  = W;
      canvas.height = H;
    };

    canvas.addEventListener('mousemove',   onMouseMove);
    canvas.addEventListener('mousedown',   onMouseDown);
    canvas.addEventListener('mouseup',     onMouseUp);
    window.addEventListener('keydown',  e => onKey(e, true));
    window.addEventListener('keyup',    e => onKey(e, false));
    window.addEventListener('resize',   onResize);

    // ── Game Loop ────────────────────────────────────────────────────────────
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (!s.running) return;

      update(s, dt, W, H);
      draw(ctx, s, W, H);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup',   onMouseUp);
      window.removeEventListener('keydown',   e => onKey(e, true));
      window.removeEventListener('keyup',     e => onKey(e, false));
      window.removeEventListener('resize',    onResize);
    };
  }, []); // eslint-disable-line

  // ── Update ─────────────────────────────────────────────────────────────────
  const update = (s, dt, W, H) => {
    if (s.phase === 'dead') return;

    const p  = s.player;
    const k  = keysRef.current;
    const m  = mouseRef.current;
    const wep = s.weapons[s.weaponIdx];

    // Hareket
    let mx = 0, my = 0;
    if (k['KeyW'] || k['ArrowUp'])    my -= 1;
    if (k['KeyS'] || k['ArrowDown'])  my += 1;
    if (k['KeyA'] || k['ArrowLeft'])  mx -= 1;
    if (k['KeyD'] || k['ArrowRight']) mx += 1;
    const mLen = Math.hypot(mx, my) || 1;
    if (mx !== 0 || my !== 0) {
      p.vx += (mx / mLen) * p.speed * 8 * dt;
      p.vy += (my / mLen) * p.speed * 8 * dt;
    }
    // Sürtünme
    p.vx *= Math.pow(0.02, dt);
    p.vy *= Math.pow(0.02, dt);

    p.x = clamp(p.x + p.vx * dt, p.radius, W - p.radius);
    p.y = clamp(p.y + p.vy * dt, p.radius, H - p.radius);

    // Ateş
    const now = performance.now();
    if (m.down && now - s.lastFire > wep.fireRate) {
      s.lastFire = now;
      if (wep.ammo === Infinity || wep.ammo > 0) {
        if (wep.ammo !== Infinity) wep.ammo--;

        for (let i = 0; i < wep.pellets; i++) {
          const spreadAngle = p.angle + rand(-wep.spread, wep.spread);
          s.bullets.push({
            x: p.x, y: p.y,
            vx: Math.cos(spreadAngle) * wep.speed * 60,
            vy: Math.sin(spreadAngle) * wep.speed * 60,
            damage: wep.damage, color: wep.color, life: 1.8, size: wep === WEAPONS[2] ? 5 : 3,
          });
        }
        addParticles(s, p.x + Math.cos(p.angle) * 14, p.y + Math.sin(p.angle) * 14, wep.color, 4, 60);
      }
    }

    // Dash cooldown
    if (s.dashCooldown > 0) s.dashCooldown -= dt;
    if (s.dashCooldown <= 0 && s.dashCharges < 3) {
      s.dashCharges = Math.min(3, s.dashCharges + dt * 0.8);
    }

    // Mermiler
    s.bullets = s.bullets.filter(b => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.x < 0 || b.x > W || b.y < 0 || b.y > H || b.life <= 0) return false;

      // Düşman çarpışması
      const targets = s.bossAlive ? [s.boss, ...s.enemies] : s.enemies;
      for (const e of targets) {
        if (!e) continue;
        if (dist(b, e) < e.radius + b.size) {
          e.hp -= b.damage;
          addParticles(s, b.x, b.y, b.color, 5, 80);
          addFloater(s, e.x, e.y - e.radius - 10, `-${b.damage}`, '#ff4444');

          if (e.hp <= 0) killEnemy(s, e, W, H);
          return false;
        }
      }
      return true;
    });

    // Düşman hareketi & ateş
    s.enemies = s.enemies.filter(e => {
      if (e.hp <= 0) return false;
      const angle = Math.atan2(p.y - e.y, p.x - e.x);
      e.angle = angle;
      e.x += Math.cos(angle) * e.speed * dt;
      e.y += Math.sin(angle) * e.speed * dt;

      // Oyuncuya hasar
      if (dist(e, p) < e.radius + p.radius) {
        p.hp -= 15 * dt;
        if (p.hp <= 0) { s.phase = 'dead'; s.running = false; onGameOver(s.score); }
      }

      // Düşman ateşi
      e.shootTimer -= dt;
      if (e.shootTimer <= 0) {
        e.shootTimer = rand(2, 4);
        s.bullets.push({
          x: e.x, y: e.y,
          vx: Math.cos(angle) * 420,
          vy: Math.sin(angle) * 420,
          damage: 12, color: '#ff4444', life: 2, size: 4,
          isEnemy: true,
        });
      }
      return true;
    });

    // Mermi — oyuncuya çarpma
    s.bullets = s.bullets.filter(b => {
      if (!b.isEnemy) return true;
      if (dist(b, p) < p.radius + b.size) {
        p.hp -= b.damage;
        addParticles(s, p.x, p.y, '#ff4444', 6, 60);
        if (p.hp <= 0) { s.phase = 'dead'; s.running = false; onGameOver(s.score); }
        return false;
      }
      return true;
    });

    // Boss hareketi
    if (s.bossAlive && s.boss) {
      const b = s.boss;
      const angle = Math.atan2(p.y - b.y, p.x - b.x);
      b.x += Math.cos(angle) * b.speed * dt;
      b.y += Math.sin(angle) * b.speed * dt;

      b.shootTimer -= dt;
      if (b.shootTimer <= 0) {
        b.shootTimer = 0.8;
        for (let i = 0; i < 5; i++) {
          const a = angle + (i - 2) * 0.25;
          s.bullets.push({ x: b.x, y: b.y, vx: Math.cos(a) * 350, vy: Math.sin(a) * 350, damage: 18, color: '#ff0000', life: 2, size: 5, isEnemy: true });
        }
      }
      if (dist(b, p) < b.radius + p.radius) {
        p.hp -= 30 * dt;
        if (p.hp <= 0) { s.phase = 'dead'; s.running = false; onGameOver(s.score); }
      }
      if (b.hp <= 0) {
        s.bossAlive = false;
        s.boss = null;
        s.score += 2000;
        addFloater(s, W / 2, H / 2, 'BOSS ÖLDÜ! +2000', '#ff00ff');
        addParticles(s, W / 2, H / 2, '#ff0000', 50, 200);
        endWave(s, W, H);
      }
    }

    // Dalga bitti mi?
    if (!s.bossAlive && s.enemies.length === 0 && !s.waveClear) {
      endWave(s, W, H);
    }
    if (s.waveClear) {
      s.waveClearTimer -= dt;
      if (s.waveClearTimer <= 0) {
        s.waveClear = false;
        s.wave++;
        spawnWave(s, W, H);
      }
    }

    // HP rejenerasyon (küçük)
    p.hp = Math.min(p.maxHp, p.hp + 2 * dt);

    // Partiküller
    s.particles = s.particles.filter(pt => {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= Math.pow(0.01, dt);
      pt.vy *= Math.pow(0.01, dt);
      pt.life -= dt;
      return pt.life > 0;
    });

    // Floaters
    s.floaters = s.floaters.filter(f => {
      f.y += f.vy * dt;
      f.life -= dt;
      return f.life > 0;
    });

    // Style timer
    if (s.styleTimer > 0) { s.styleTimer -= dt; s.styleFade = s.styleTimer / 1.5; }
    else s.styleFade = 0;
  };

  const killEnemy = (s, e, W, H) => {
    if (e.isBoss) return; // boss ayrı işleniyor
    s.enemies = s.enemies.filter(x => x !== e);
    const pts = (e.radius * 10) + s.wave * 20;
    s.score += pts;
    s.killCount++;
    s.styleLevel = Math.min(4, Math.floor(s.killCount / 5));
    s.styleTimer = 1.5;
    addParticles(s, e.x, e.y, e.color, 14, 130);
    addFloater(s, e.x, e.y, `+${pts}`, '#6c63ff');
    if (s.killCount % 5 === 0) addFloater(s, W / 2, H * 0.35, STYLE_WORDS[s.styleLevel], '#ff8800');
  };

  const endWave = (s, W, H) => {
    s.waveClear = true;
    s.waveClearTimer = 2.5;
    const bonus = s.wave * 300;
    s.score += bonus;
    addFloater(s, W / 2, H * 0.4, `DALGA ${s.wave} TAMAM! +${bonus}`, '#3ecf8e');
  };

  // ── Draw ───────────────────────────────────────────────────────────────────
  const draw = (ctx, s, W, H) => {
    // Arkaplan
    ctx.fillStyle = '#0f0f13';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = '#1a1a22';
    ctx.lineWidth = 1;
    const gSize = 48;
    for (let x = 0; x < W; x += gSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += gSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Partiküller
    for (const pt of s.particles) {
      const a = pt.life / pt.maxLife;
      ctx.globalAlpha = a;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Düşmanlar
    for (const e of s.enemies) {
      // Gövde
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();

      // HP bar
      const bw = e.radius * 2;
      ctx.fillStyle = '#333';
      ctx.fillRect(e.x - bw / 2, e.y - e.radius - 8, bw, 4);
      ctx.fillStyle = e.color;
      ctx.fillRect(e.x - bw / 2, e.y - e.radius - 8, bw * (e.hp / e.maxHp), 4);

      // Yön oku
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(e.x + Math.cos(e.angle) * e.radius * 0.7, e.y + Math.sin(e.angle) * e.radius * 0.7);
      ctx.stroke();
    }

    // Boss
    if (s.bossAlive && s.boss) {
      const b = s.boss;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ff0000';
      ctx.fillStyle = '#cc0000';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Boss HP
      const bw = 200;
      ctx.fillStyle = '#1a0000';
      ctx.fillRect(W / 2 - bw / 2, 36, bw, 8);
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(W / 2 - bw / 2, 36, bw * (b.hp / b.maxHp), 8);
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 11px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('BOSS', W / 2, 30);
    }

    // Mermiler
    for (const b of s.bullets) {
      ctx.fillStyle = b.color;
      if (b.size > 3) {
        ctx.shadowBlur = 8; ctx.shadowColor = b.color;
      }
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Oyuncu
    const p = s.player;
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#6c63ff';
    ctx.fillStyle = '#6c63ff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Silah yönü
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + Math.cos(p.angle) * 18, p.y + Math.sin(p.angle) * 18);
    ctx.stroke();

    // Floaters
    for (const f of s.floaters) {
      const alpha = Math.min(1, f.life / f.maxLife * 2);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = f.color;
      ctx.font = 'bold 14px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;

    // ── HUD ────────────────────────────────────────────────────────────────
    // HP bar
    ctx.fillStyle = '#1a0000';
    ctx.fillRect(20, H - 40, 160, 10);
    ctx.fillStyle = p.hp > 50 ? '#3ecf8e' : p.hp > 25 ? '#f59e0b' : '#ff4f5e';
    ctx.fillRect(20, H - 40, 160 * (p.hp / p.maxHp), 10);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, H - 40, 160, 10);
    ctx.fillStyle = '#e8e8f0';
    ctx.font = 'bold 13px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(`HP  ${Math.ceil(p.hp)}`, 20, H - 48);

    // Skor
    const rank = getRank(s.score);
    ctx.fillStyle = rank.color;
    ctx.font = 'bold 48px Inter';
    ctx.textAlign = 'right';
    ctx.fillText(rank.name, W - 20, 56);
    ctx.fillStyle = '#9090a8';
    ctx.font = '11px Inter';
    ctx.fillText('RANK', W - 20, 66);

    ctx.fillStyle = '#e8e8f0';
    ctx.font = 'bold 18px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(s.score.toLocaleString(), 20, 28);

    // Dalga
    ctx.fillStyle = '#9090a8';
    ctx.font = '11px Inter';
    ctx.fillText('DALGA', 20, 44);
    ctx.fillStyle = '#ff8800';
    ctx.font = 'bold 15px Inter';
    ctx.fillText(s.wave, 64, 44);

    // Silah
    const wep = s.weapons[s.weaponIdx];
    ctx.fillStyle = '#9090a8';
    ctx.font = '11px Inter';
    ctx.textAlign = 'right';
    ctx.fillText(wep.name, W - 20, H - 48);
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 20px Inter';
    ctx.fillText(wep.ammo === Infinity ? '∞' : wep.ammo, W - 20, H - 28);

    // Dash şarjları
    for (let i = 0; i < 3; i++) {
      const filled = i < Math.floor(s.dashCharges);
      ctx.fillStyle = filled ? '#00ccff' : '#1a2a33';
      ctx.fillRect(20 + i * 22, H - 16, 16, 5);
    }

    // Style göstergesi
    if (s.styleFade > 0) {
      ctx.globalAlpha = s.styleFade;
      ctx.fillStyle = rank.color;
      ctx.font = `bold 22px Inter`;
      ctx.textAlign = 'center';
      ctx.fillText(STYLE_WORDS[s.styleLevel], W / 2, H * 0.25);
      ctx.globalAlpha = 1;
    }

    // Dalga temizlendi
    if (s.waveClear) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#3ecf8e';
      ctx.font = 'bold 36px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(`DALGA ${s.wave} TAMAM!`, W / 2, H / 2 - 10);
      ctx.fillStyle = '#9090a8';
      ctx.font = '14px Inter';
      ctx.fillText('Sonraki dalga hazırlanıyor...', W / 2, H / 2 + 22);
    }

    // Silah seçici (alt orta)
    const slotW = 52, slotGap = 8;
    const totalW = s.weapons.length * slotW + (s.weapons.length - 1) * slotGap;
    let sx = W / 2 - totalW / 2;
    for (let i = 0; i < s.weapons.length; i++) {
      const active = i === s.weaponIdx;
      ctx.fillStyle = active ? '#1e1e2a' : '#12121a';
      ctx.strokeStyle = active ? s.weapons[i].color : '#333';
      ctx.lineWidth = active ? 2 : 1;
      ctx.beginPath();
      ctx.roundRect(sx, H - 54, slotW, 42, 6);
      ctx.fill(); ctx.stroke();
      ctx.font = '18px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(s.weapons[i].emoji, sx + slotW / 2, H - 30);
      ctx.fillStyle = '#555';
      ctx.font = '10px Inter';
      ctx.fillText(`[${i + 1}]`, sx + slotW / 2, H - 16);
      sx += slotW + slotGap;
    }

    // Cross
    const cx = W / 2, cy = H / 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx - 10, cy); ctx.lineTo(cx + 10, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - 10); ctx.lineTo(cx, cy + 10); ctx.stroke();
  };

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair' }}
    />
  );
};

// ─── Ana Oyun Sayfası ─────────────────────────────────────────────────────────
const GamePage = () => {
  const [gameData, setGameData]   = useState(null);
  const [phase, setPhase]         = useState('loading'); // loading | playing | dead
  const [finalScore, setFinalScore] = useState(0);
  const [key, setKey]             = useState(0);
  const { user, token }           = useAuth();

  useEffect(() => {
    fetch('/api/games/hellblast')
      .then(r => r.json())
      .then(data => { setGameData(data); setPhase('start'); });
  }, []);

  const handleGameOver = useCallback(async (score) => {
    setFinalScore(score);
    setPhase('dead');
    if (user && token && gameData) {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ game_id: gameData.id, score }),
      });
    }
  }, [user, token, gameData]);

  const handleRestart = () => {
    setPhase('playing');
    setKey(k => k + 1);
  };

  if (phase === 'loading') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)', color: '#9090a8' }}>
      Yükleniyor...
    </div>
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      {/* Başlık */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 36 }}>{gameData?.thumbnail}</div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>{gameData?.title}</h1>
          <p style={{ fontSize: 13, color: '#9090a8', marginTop: 2 }}>{gameData?.description}</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {!user && <span style={{ fontSize: 12, color: '#9090a8' }}>Giriş yap → skor kaydedilsin</span>}
          <span className="tag tag-fps">{gameData?.genre}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Oyun Ekranı */}
        <div className="card" style={{
          height: 520, position: 'relative', overflow: 'hidden', padding: 0,
        }}>
          {phase === 'start' && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.88)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              zIndex: 10,
            }}>
              <div style={{ fontSize: 52 }}>🔫</div>
              <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1, marginBottom: 8 }}>HELLBLAST</h2>
              <p style={{ color: '#9090a8', fontSize: 13, marginBottom: 28, textAlign: 'center' }}>
                WASD → Hareket &nbsp;·&nbsp; Mouse → Nişan &nbsp;·&nbsp; Sol Tık → Ateş<br />
                Shift → Dash &nbsp;·&nbsp; 1/2/3 → Silah değiştir
              </p>
              <button className="btn-primary" style={{ fontSize: 16, padding: '12px 36px' }}
                onClick={() => setPhase('playing')}>
                OYNA
              </button>
            </div>
          )}

          {phase === 'dead' && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.92)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              zIndex: 10,
            }}>
              <div style={{ fontSize: 48 }}>💀</div>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: '#ff4f5e', marginBottom: 8 }}>ÖLDÜn</h2>
              <div style={{ fontSize: 36, fontWeight: 900, color: getRank(finalScore).color, marginBottom: 4,
                textShadow: `0 0 20px ${getRank(finalScore).color}` }}>
                {getRank(finalScore).name}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#e8e8f0', marginBottom: 4 }}>
                {finalScore.toLocaleString()} puan
              </div>
              {!user && <p style={{ color: '#9090a8', fontSize: 12, marginBottom: 16 }}>Skor kaydedilmedi — giriş yap!</p>}
              {user && <p style={{ color: '#3ecf8e', fontSize: 12, marginBottom: 16 }}>✓ Skor kaydedildi</p>}
              <button className="btn-primary" style={{ fontSize: 15, padding: '11px 32px' }}
                onClick={handleRestart}>
                TEKRAR OYNA
              </button>
            </div>
          )}

          {(phase === 'playing' || phase === 'dead') && (
            <GameEngine key={key} gameId={gameData?.id} onGameOver={handleGameOver} />
          )}
        </div>

        {/* Yan panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Kontroller */}
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#9090a8', letterSpacing: 1 }}>
              KONTROLLER
            </h3>
            {[
              ['WASD / ↑↓←→', 'Hareket'],
              ['Mouse', 'Nişan al'],
              ['Sol Tık', 'Ateş et'],
              ['Shift', 'Dash (3 şarj)'],
              ['1 / 2 / 3', 'Silah seç'],
            ].map(([key, val]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <kbd style={{
                  background: '#1e1e2a', border: '1px solid #2a2a3a',
                  borderRadius: 4, padding: '2px 8px', fontSize: 11, color: '#e8e8f0',
                }}>{key}</kbd>
                <span style={{ fontSize: 12, color: '#9090a8' }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Rank tablosu */}
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#9090a8', letterSpacing: 1 }}>
              RANK SİSTEMİ
            </h3>
            {RANK_TABLE.slice().reverse().map(r => (
              <div key={r.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, color: r.color, textShadow: `0 0 6px ${r.color}`, fontSize: 14 }}>
                  {r.name}
                </span>
                <span style={{ fontSize: 12, color: '#9090a8' }}>{r.min.toLocaleString()}+</span>
              </div>
            ))}
          </div>

          {/* Leaderboard */}
          {gameData && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e1e2a' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#9090a8', letterSpacing: 1 }}>
                  LİDERLİK TABLOSU
                </h3>
              </div>
              <LeaderboardMini gameId={gameData.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Mini leaderboard (GamePage içinde kullanılır)
const LeaderboardMini = ({ gameId }) => {
  const [scores, setScores] = useState([]);
  useEffect(() => {
    fetch(`/api/scores/leaderboard/${gameId}`)
      .then(r => r.json())
      .then(setScores);
  }, [gameId]);

  if (scores.length === 0) return (
    <div style={{ padding: 16, color: '#9090a8', fontSize: 12, textAlign: 'center' }}>
      Henüz kayıt yok
    </div>
  );

  const RANK_COLORS = { SSS: '#fff', SS: '#ff00ff', S: '#ff2200', A: '#ff8800', B: '#4488ff', C: '#44cc44', D: '#888' };

  return (
    <div>
      {scores.slice(0, 8).map((s, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 16px', borderBottom: i < 7 ? '1px solid #1a1a26' : 'none',
          background: i === 0 ? '#1a1a26' : 'transparent',
        }}>
          <span style={{ fontSize: 11, color: i < 3 ? '#f59e0b' : '#555', width: 18, textAlign: 'center' }}>
            {i + 1}
          </span>
          <span style={{ fontSize: 16 }}>{s.avatar}</span>
          <span style={{ flex: 1, fontSize: 12, color: '#e8e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {s.username}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: RANK_COLORS[s.rank] || '#888', minWidth: 28, textAlign: 'center' }}>
            {s.rank}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#6c63ff' }}>
            {s.score.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

export default GamePage;
