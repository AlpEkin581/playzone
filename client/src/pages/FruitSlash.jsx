import { useEffect, useRef, useState, useCallback } from 'react';

const FRUITS = ['🍎', '🍊', '🍋', '🍇', '🍉', '🍓', '🍑', '🥭', '🍍', '🥝'];
const BOMBS  = ['💣'];

export default function FruitSlash() {
  const canvasRef   = useRef(null);
  const stateRef    = useRef(null);
  const animRef     = useRef(null);
  const sliceRef    = useRef([]);
  const gameOverRef = useRef(false);

  const [screen, setScreen]   = useState('menu'); // menu | playing | over
  const [score, setScore]     = useState(0);
  const [lives, setLives]     = useState(3);
  const [combo, setCombo]     = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('fs_hi') || '0'));

  const initState = useCallback((W, H) => ({
    fruits: [],
    particles: [],
    sliceTrail: [],
    score: 0,
    lives: 3,
    combo: 0,
    comboTimer: 0,
    spawnTimer: 0,
    spawnRate: 1.8,
    level: 1,
    levelTimer: 0,
    running: true,
  }), []);

  const spawnFruit = (s, W, H) => {
    const isBomb = Math.random() < 0.12;
    const emoji  = isBomb ? BOMBS[0] : FRUITS[Math.floor(Math.random() * FRUITS.length)];
    const x      = 60 + Math.random() * (W - 120);
    const speedY = -(400 + Math.random() * 250 + s.level * 20);
    const speedX = (Math.random() - 0.5) * 180;
    s.fruits.push({
      x, y: H + 40,
      vx: speedX, vy: speedY,
      radius: 28 + Math.random() * 10,
      emoji, isBomb,
      rotation: 0, rotSpeed: (Math.random() - 0.5) * 4,
      sliced: false, slicedTimer: 0,
      half1: null, half2: null,
    });
  };

  const addParticles = (s, x, y, color, count = 12) => {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 80 + Math.random() * 180;
      s.particles.push({
        x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
        life: 0.6 + Math.random() * 0.4, maxLife: 1,
        color, size: 3 + Math.random() * 5,
      });
    }
  };

  const checkSlice = (s, x1, y1, x2, y2, W, H) => {
    let slicedAny = false;
    for (const f of s.fruits) {
      if (f.sliced) continue;
      // Line-circle intersection
      const dx = x2 - x1, dy = y2 - y1;
      const fx = f.x - x1,  fy = f.y - y1;
      const len2 = dx * dx + dy * dy;
      if (len2 === 0) continue;
      const t = Math.max(0, Math.min(1, (fx * dx + fy * dy) / len2));
      const nearX = x1 + t * dx, nearY = y1 + t * dy;
      const dist = Math.hypot(f.x - nearX, f.y - nearY);

      if (dist < f.radius) {
        f.sliced = true;
        f.slicedTimer = 0.5;
        if (f.isBomb) {
          s.lives = Math.max(0, s.lives - 1);
          setLives(s.lives);
          addParticles(s, f.x, f.y, '#ff4444', 20);
          if (s.lives <= 0) {
            s.running = false;
            gameOverRef.current = true;
            const hi = Math.max(s.score, parseInt(localStorage.getItem('fs_hi') || '0'));
            localStorage.setItem('fs_hi', hi);
            setHighScore(hi);
            setTimeout(() => setScreen('over'), 600);
          }
        } else {
          s.combo++;
          s.comboTimer = 1.2;
          const pts = s.combo >= 3 ? s.combo * 15 : 10;
          s.score += pts;
          setScore(s.score);
          setCombo(s.combo);
          addParticles(s, f.x, f.y, '#ffcc00', 14);
          slicedAny = true;
        }
      }
    }
    return slicedAny;
  };

  useEffect(() => {
    if (screen !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    gameOverRef.current = false;
    const s = initState(canvas.width, canvas.height);
    stateRef.current = s;
    setScore(0); setLives(3); setCombo(0);

    // ── Slice input ──────────────────────────────
    let lastX = null, lastY = null;

    const getXY = (e) => {
      const rect = canvas.getBoundingClientRect();
      const src  = e.touches ? e.touches[0] : e;
      return [
        (src.clientX - rect.left) * (canvas.width  / rect.width),
        (src.clientY - rect.top)  * (canvas.height / rect.height),
      ];
    };

    const onMove = (e) => {
      e.preventDefault();
      if (!stateRef.current?.running) return;
      const [cx, cy] = getXY(e);
      s.sliceTrail.push({ x: cx, y: cy, t: performance.now() });
      if (s.sliceTrail.length > 18) s.sliceTrail.shift();
      if (lastX !== null) checkSlice(s, lastX, lastY, cx, cy, canvas.width, canvas.height);
      lastX = cx; lastY = cy;
    };
    const onEnd = () => { lastX = null; lastY = null; };

    canvas.addEventListener('mousemove',  onMove, { passive: false });
    canvas.addEventListener('touchmove',  onMove, { passive: false });
    canvas.addEventListener('mouseup',    onEnd);
    canvas.addEventListener('touchend',   onEnd);

    // ── Game loop ────────────────────────────────
    let last = performance.now();

    const loop = (now) => {
      const dt  = Math.min((now - last) / 1000, 0.05);
      last = now;
      const W = canvas.width, H = canvas.height;

      if (!s.running) { animRef.current = requestAnimationFrame(loop); return; }

      // Spawn
      s.spawnTimer -= dt;
      if (s.spawnTimer <= 0) {
        const count = Math.random() < 0.3 ? 2 : 1;
        for (let i = 0; i < count; i++) spawnFruit(s, W, H);
        s.spawnTimer = s.spawnRate * (0.7 + Math.random() * 0.6);
      }

      // Level up
      s.levelTimer += dt;
      if (s.levelTimer > 20) { s.level++; s.levelTimer = 0; s.spawnRate = Math.max(0.6, s.spawnRate - 0.15); }

      // Combo decay
      if (s.comboTimer > 0) { s.comboTimer -= dt; if (s.comboTimer <= 0) { s.combo = 0; setCombo(0); } }

      // Fruits physics
      s.fruits = s.fruits.filter(f => {
        f.vy += 420 * dt; // gravity
        f.x  += f.vx * dt;
        f.y  += f.vy * dt;
        f.rotation += f.rotSpeed * dt;
        if (f.sliced) { f.slicedTimer -= dt; return f.slicedTimer > 0; }
        // Missed fruit
        if (f.y > H + 80 && !f.isBomb) {
          s.lives = Math.max(0, s.lives - 1);
          setLives(s.lives);
          if (s.lives <= 0) {
            s.running = false;
            gameOverRef.current = true;
            const hi = Math.max(s.score, parseInt(localStorage.getItem('fs_hi') || '0'));
            localStorage.setItem('fs_hi', hi);
            setHighScore(hi);
            setTimeout(() => setScreen('over'), 600);
          }
          return false;
        }
        return f.y < H + 100;
      });

      // Particles
      s.particles = s.particles.filter(p => {
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vy += 200 * dt;
        p.life -= dt;
        return p.life > 0;
      });

      // Slice trail decay
      const now2 = performance.now();
      s.sliceTrail = s.sliceTrail.filter(p => now2 - p.t < 120);

      // ── DRAW ──────────────────────────────────
      ctx.clearRect(0, 0, W, H);

      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#0a0a14');
      bg.addColorStop(1, '#12121e');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Slice trail
      if (s.sliceTrail.length > 1) {
        ctx.save();
        for (let i = 1; i < s.sliceTrail.length; i++) {
          const alpha = i / s.sliceTrail.length;
          ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.8})`;
          ctx.lineWidth   = alpha * 5;
          ctx.lineCap     = 'round';
          ctx.beginPath();
          ctx.moveTo(s.sliceTrail[i-1].x, s.sliceTrail[i-1].y);
          ctx.lineTo(s.sliceTrail[i].x,   s.sliceTrail[i].y);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Particles
      for (const p of s.particles) {
        const a = p.life / p.maxLife;
        ctx.globalAlpha = a;
        ctx.fillStyle   = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Fruits
      for (const f of s.fruits) {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rotation);
        if (f.sliced) ctx.globalAlpha = f.slicedTimer / 0.5;

        // Shadow
        ctx.shadowBlur  = f.isBomb ? 16 : 8;
        ctx.shadowColor = f.isBomb ? '#ff4444' : '#ffcc0066';
        ctx.font        = `${f.radius * 2}px serif`;
        ctx.textAlign   = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(f.emoji, 0, 0);
        ctx.shadowBlur  = 0;
        ctx.globalAlpha = 1;
        ctx.restore();

        // Slice flash
        if (f.sliced && !f.isBomb) {
          ctx.save();
          ctx.globalAlpha = f.slicedTimer / 0.5 * 0.6;
          ctx.fillStyle   = '#ffffff';
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.radius * 1.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Score popup for combo
      if (s.combo >= 3 && s.comboTimer > 0.8) {
        const a = (s.comboTimer - 0.8) / 0.4;
        ctx.globalAlpha = a;
        ctx.fillStyle   = '#ff8800';
        ctx.font        = 'bold 28px Inter, sans-serif';
        ctx.textAlign   = 'center';
        ctx.fillText(`${s.combo}x COMBO! 🔥`, W / 2, H * 0.35);
        ctx.globalAlpha = 1;
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener('mousemove',  onMove);
      canvas.removeEventListener('touchmove',  onMove);
      canvas.removeEventListener('mouseup',    onEnd);
      canvas.removeEventListener('touchend',   onEnd);
      window.removeEventListener('resize',     resize);
    };
  }, [screen]);

  // ── SCREENS ────────────────────────────────────────
  if (screen === 'menu') return (
    <div style={{
      width: '100%', height: '100vh', background: '#0a0a14',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 24,
      fontFamily: 'Inter, sans-serif',
    }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Floating fruits */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
        {['🍎','🍊','🍋','🍇','🍉'].map((f, i) => (
          <span key={i} style={{
            fontSize: 36,
            animation: `float ${1.2 + i * 0.2}s ease-in-out infinite`,
            animationDelay: `${i * 0.15}s`,
            display: 'inline-block',
          }}>{f}</span>
        ))}
      </div>

      <div style={{ textAlign: 'center', animation: 'fadeUp .5s ease' }}>
        <div style={{ fontSize: 'clamp(32px, 8vw, 56px)', fontWeight: 900, color: 'white', lineHeight: 1 }}>
          Fruit Slash
        </div>
        <div style={{ color: '#6c63ff', fontSize: 14, letterSpacing: 4, marginTop: 6, fontWeight: 700 }}>
          SLASH • COMBO • SURVIVE
        </div>
      </div>

      {highScore > 0 && (
        <div style={{
          background: '#1e1e2a', border: '1px solid #2a2a3a', borderRadius: 12,
          padding: '10px 24px', color: '#f5c518', fontWeight: 700, fontSize: 15,
        }}>
          🏆 En Yüksek: {highScore.toLocaleString()}
        </div>
      )}

      <div style={{ textAlign: 'center', color: '#9090a8', fontSize: 13, maxWidth: 280, lineHeight: 1.6 }}>
        Meyveleri keserek puan kazan.<br />
        Bombalara <strong style={{ color: '#ff4444' }}>dokunma</strong>! 3 kaçırırsan biter.
      </div>

      <button
        onClick={() => setScreen('playing')}
        style={{
          background: 'linear-gradient(135deg, #6c63ff, #ff4f5e)',
          color: 'white', border: 'none', borderRadius: 50,
          padding: '16px 48px', fontSize: 20, fontWeight: 900,
          cursor: 'pointer', letterSpacing: 2,
          boxShadow: '0 0 30px #6c63ff66',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        OYNA 🍉
      </button>

      <div style={{ color: '#555', fontSize: 12 }}>
        🖱️ Fare sürükle &nbsp;|&nbsp; 👆 Parmakla sürükle
      </div>
    </div>
  );

  if (screen === 'over') return (
    <div style={{
      width: '100%', height: '100vh', background: '#0a0a14',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ fontSize: 72 }}>💀</div>
      <div style={{ fontSize: 36, fontWeight: 900, color: '#ff4f5e', letterSpacing: 2 }}>GAME OVER</div>

      <div style={{ display: 'flex', gap: 32, marginTop: 8 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#9090a8', fontSize: 12, letterSpacing: 2 }}>SKOR</div>
          <div style={{ color: 'white', fontSize: 32, fontWeight: 900 }}>{score.toLocaleString()}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#9090a8', fontSize: 12, letterSpacing: 2 }}>EN YÜKSEK</div>
          <div style={{ color: '#f5c518', fontSize: 32, fontWeight: 900 }}>{highScore.toLocaleString()}</div>
        </div>
      </div>

      {score >= highScore && score > 0 && (
        <div style={{ color: '#f5c518', fontWeight: 700, fontSize: 16 }}>🎉 Yeni rekor!</div>
      )}

      <button
        onClick={() => { setScreen('playing'); }}
        style={{
          background: 'linear-gradient(135deg, #6c63ff, #ff4f5e)',
          color: 'white', border: 'none', borderRadius: 50,
          padding: '14px 40px', fontSize: 18, fontWeight: 900,
          cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          marginTop: 8,
        }}
      >
        TEKRAR OYNA
      </button>
      <button
        onClick={() => setScreen('menu')}
        style={{
          background: 'transparent', color: '#9090a8', border: '1px solid #2a2a3a',
          borderRadius: 50, padding: '10px 28px', fontSize: 14,
          cursor: 'pointer', fontFamily: 'Inter, sans-serif',
        }}
      >
        Ana Menü
      </button>
    </div>
  );

  // Playing screen
  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', background: '#0a0a14', overflow: 'hidden' }}>
      {/* HUD */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        padding: '12px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
        pointerEvents: 'none',
      }}>
        <div>
          <div style={{ color: '#9090a8', fontSize: 11, letterSpacing: 2 }}>SKOR</div>
          <div style={{ color: 'white', fontSize: 24, fontWeight: 900 }}>{score.toLocaleString()}</div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} style={{ fontSize: 22, opacity: i < lives ? 1 : 0.15, transition: 'opacity .3s' }}>❤️</span>
          ))}
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#9090a8', fontSize: 11, letterSpacing: 2 }}>COMBO</div>
          <div style={{
            fontSize: 24, fontWeight: 900,
            color: combo >= 5 ? '#ff4f5e' : combo >= 3 ? '#ff8800' : combo >= 2 ? '#f5c518' : 'white',
            transition: 'color .2s',
          }}>
            {combo > 1 ? `${combo}x 🔥` : '—'}
          </div>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        style={{
          display: 'block', width: '100%', height: '100%',
          cursor: 'crosshair', touchAction: 'none',
        }}
      />
    </div>
  );
}
