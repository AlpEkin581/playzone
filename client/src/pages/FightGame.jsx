import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || '';
const WS_URL  = API_URL || 'http://localhost:5000';

// ── Karakter tanımları ─────────────────────────────────────────
const CHARS = [
  { name: 'KIRMIZI', color: '#ff4444', accent: '#ff8888', emoji: '🥊' },
  { name: 'MAVİ',    color: '#4488ff', accent: '#88bbff', emoji: '🥷' },
];

const MOVES = {
  punch:  { damage: 12, frames: 18, name: 'Yumruk',  color: '#ffcc00' },
  kick:   { damage: 18, frames: 25, name: 'Tekme',   color: '#ff8800' },
  block:  { damage: 0,  frames: 20, name: 'Blok',    color: '#4488ff' },
  special:{ damage: 30, frames: 35, name: 'ÖZEL!',   color: '#ff00ff' },
};

const makePlayer = (x, facing, charIdx) => ({
  x, y: 0, vy: 0,
  hp: 100, maxHp: 100,
  energy: 0, // for special
  action: null, actionTimer: 0,
  blocking: false,
  facing, charIdx,
  hitFlash: 0,
  comboCount: 0,
  comboTimer: 0,
  lastHit: null,
});

// ── Sayı üret (oda kodu) ──────────────────────────────────────
const genCode = () => Math.floor(1000 + Math.random() * 9000).toString();

// ═══════════════════════════════════════════════════════════════
export default function FightGame() {
  const canvasRef = useRef(null);
  const stateRef  = useRef(null);
  const animRef   = useRef(null);
  const socketRef = useRef(null);

  const [screen, setScreen]   = useState('menu'); // menu | waiting | playing | over
  const [roomCode, setRoomCode] = useState('');
  const [connected, setConnected] = useState(false);
  const [winner, setWinner]   = useState(null);
  const [p1HP, setP1HP]       = useState(100);
  const [p2HP, setP2HP]       = useState(100);
  const [timeLeft, setTimeLeft] = useState(60);
  const [p1Action, setP1Action] = useState('');
  const [p2Action, setP2Action] = useState('');
  const [vsMode, setVsMode]   = useState('online'); // online | local
  const gameOverRef = useRef(false);
  const timerRef    = useRef(null);

  // ── Socket setup ──────────────────────────────────────────────
  useEffect(() => {
    const sock = io(WS_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = sock;

    sock.on('room-created',        (code) => { setRoomCode(code); setScreen('waiting'); });
    sock.on('controller-connected', () => { setConnected(true); startGame(); });
    sock.on('controller-disconnected', () => setConnected(false));
    sock.on('room-error',          (msg) => alert(msg));
    sock.on('button',              (action) => handleButton(action, 'p2'));

    return () => sock.disconnect();
  }, []);

  const handleButton = useCallback((action, player) => {
    const s = stateRef.current;
    if (!s || gameOverRef.current) return;
    const p = player === 'p1' ? s.p1 : s.p2;
    const opp = player === 'p1' ? s.p2 : s.p1;

    if (p.actionTimer > 0) return;
    const move = MOVES[action];
    if (!move) return;

    p.action = action;
    p.actionTimer = move.frames;
    p.blocking = action === 'block';

    if (action === 'special' && p.energy < 100) return;
    if (action === 'special') p.energy = 0;

    if (action !== 'block') {
      const dist = Math.abs(p.x - opp.x);
      if (dist < 140) {
        let dmg = move.damage;
        if (opp.blocking) dmg = Math.floor(dmg * 0.15);
        opp.hp = Math.max(0, opp.hp - dmg);
        opp.hitFlash = 8;
        p.energy = Math.min(100, p.energy + 15);
        p.comboCount++;
        p.comboTimer = 90;
        p.lastHit = action;
        setP1HP(s.p1.hp);
        setP2HP(s.p2.hp);
        if (player === 'p1') setP1Action(move.name);
        else setP2Action(move.name);
        setTimeout(() => { if (player === 'p1') setP1Action(''); else setP2Action(''); }, 500);

        if (opp.hp <= 0 && !gameOverRef.current) {
          gameOverRef.current = true;
          clearInterval(timerRef.current);
          setWinner(player === 'p1' ? 'P1' : 'P2');
          setTimeout(() => setScreen('over'), 800);
        }
      }
    }
  }, []);

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width  = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    gameOverRef.current = false;

    stateRef.current = {
      p1: makePlayer(W * 0.28, 1,  0),
      p2: makePlayer(W * 0.72, -1, 1),
    };
    setP1HP(100); setP2HP(100);
    setWinner(null);
    setTimeLeft(60);
    setScreen('playing');

    // Timer
    let t = 60;
    timerRef.current = setInterval(() => {
      t--;
      setTimeLeft(t);
      if (t <= 0) {
        clearInterval(timerRef.current);
        if (!gameOverRef.current) {
          gameOverRef.current = true;
          const s = stateRef.current;
          if (s.p1.hp > s.p2.hp) setWinner('P1');
          else if (s.p2.hp > s.p1.hp) setWinner('P2');
          else setWinner('DRAW');
          setTimeout(() => setScreen('over'), 500);
        }
      }
    }, 1000);

    // Keyboard for local mode
    const down = (e) => {
      if (vsMode === 'local') {
        // P2 keyboard
        if (e.code === 'ArrowUp')    handleButton('punch',   'p2');
        if (e.code === 'ArrowDown')  handleButton('kick',    'p2');
        if (e.code === 'ArrowLeft')  handleButton('block',   'p2');
        if (e.code === 'ArrowRight') handleButton('special', 'p2');
      }
      // P1 keyboard always
      if (e.code === 'KeyA') handleButton('punch',   'p1');
      if (e.code === 'KeyS') handleButton('kick',    'p1');
      if (e.code === 'KeyD') handleButton('block',   'p1');
      if (e.code === 'KeyF') handleButton('special', 'p1');
    };
    window.addEventListener('keydown', down);

    // Draw loop
    const ctx = canvas.getContext('2d');
    let last  = performance.now();

    const loop = (now) => {
      if (!stateRef.current) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const s = stateRef.current;

      // Update timers
      for (const p of [s.p1, s.p2]) {
        if (p.actionTimer > 0) p.actionTimer--;
        else p.blocking = false;
        if (p.hitFlash > 0) p.hitFlash--;
        if (p.comboTimer > 0) p.comboTimer--;
        else p.comboCount = 0;
      }

      // AI for online P2 (basic drift toward P1)
      if (vsMode === 'online' && !connected) {
        const dx = s.p1.x - s.p2.x;
        s.p2.x += Math.sign(dx) * 40 * dt;
        if (Math.abs(dx) < 120 && Math.random() < 0.012) {
          const acts = ['punch', 'kick', 'punch', 'block'];
          handleButton(acts[Math.floor(Math.random() * acts.length)], 'p2');
        }
      }

      // ── DRAW ─────────────────────────────────────────────────
      ctx.clearRect(0, 0, W, H);

      // Background
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#1a0a2e');
      bg.addColorStop(1, '#0a0a14');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Arena floor
      ctx.fillStyle = '#2a1a4a';
      ctx.fillRect(0, H * 0.75, W, H * 0.25);
      ctx.strokeStyle = '#6c63ff44';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, H * 0.75); ctx.lineTo(W, H * 0.75); ctx.stroke();

      // Center line
      ctx.strokeStyle = '#ffffff11';
      ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.moveTo(W/2, H * 0.5); ctx.lineTo(W/2, H * 0.75); ctx.stroke();
      ctx.setLineDash([]);

      // Draw characters
      for (const [idx, p] of [[0, s.p1], [1, s.p2]]) {
        const char  = CHARS[p.charIdx];
        const gndY  = H * 0.73;
        const bodyH = Math.min(H * 0.28, 140);
        const bodyW = bodyH * 0.55;
        const bx    = p.x - bodyW / 2;
        const by    = gndY - bodyH;

        // Hit flash
        if (p.hitFlash > 0) {
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(p.x, gndY - bodyH/2, bodyW * 0.8, bodyH * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(p.x, gndY + 4, bodyW * 0.6, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        const grad = ctx.createLinearGradient(bx, by, bx + bodyW, by + bodyH);
        grad.addColorStop(0, char.accent);
        grad.addColorStop(1, char.color);
        ctx.fillStyle = grad;
        ctx.shadowBlur  = 16;
        ctx.shadowColor = char.color;
        ctx.beginPath();
        ctx.roundRect(bx, by, bodyW, bodyH, 12);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Head
        ctx.fillStyle = char.accent;
        ctx.beginPath();
        ctx.arc(p.x, by - bodyW * 0.3, bodyW * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Action indicator
        if (p.actionTimer > 0 && p.action) {
          const move = MOVES[p.action];
          ctx.font      = 'bold 13px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = move.color;
          ctx.shadowBlur  = 8;
          ctx.shadowColor = move.color;
          ctx.fillText(move.name.toUpperCase(), p.x, by - bodyW * 0.7 - 8);
          ctx.shadowBlur = 0;
        }

        // Energy bar
        const eW = bodyW * 1.2;
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(p.x - eW/2, gndY + 14, eW, 5);
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(p.x - eW/2, gndY + 14, eW * (p.energy / 100), 5);

        // Combo
        if (p.comboTimer > 0 && p.comboCount >= 2) {
          ctx.font      = `bold ${14 + p.comboCount}px Inter, sans-serif`;
          ctx.fillStyle = '#ff8800';
          ctx.textAlign = 'center';
          ctx.fillText(`${p.comboCount} COMBO!`, p.x, by - bodyW * 0.7 - 28);
        }

        // Emoji
        ctx.font = `${bodyW * 0.55}px serif`;
        ctx.textAlign = 'center';
        ctx.fillText(char.emoji, p.x, gndY - bodyH * 0.45);
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('keydown', down);
    };
  }, [vsMode, connected, handleButton]);

  const createRoom = () => {
    const code = genCode();
    socketRef.current?.emit('create-room', code);
  };

  const startLocal = () => {
    setVsMode('local');
    startGame();
  };

  // ── MENU ──────────────────────────────────────────────────────
  if (screen === 'menu') return (
    <div style={{
      width: '100%', height: '100vh', background: '#0a0a14',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 28,
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ display: 'flex', gap: 40, fontSize: 64 }}>
        <span style={{ animation: 'bounce 1s infinite' }}>🥊</span>
        <span style={{ animation: 'bounce 1s .2s infinite' }}>🥷</span>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 42, fontWeight: 900, color: 'white', letterSpacing: -1 }}>FIGHT ZONE</div>
        <div style={{ color: '#6c63ff', letterSpacing: 4, fontSize: 13, marginTop: 4 }}>1v1 DÖVÜŞ OYUNU</div>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <button onClick={createRoom} style={{
          background: 'linear-gradient(135deg, #6c63ff, #ff4f5e)',
          color: 'white', border: 'none', borderRadius: 12,
          padding: '16px 28px', fontSize: 15, fontWeight: 900,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          📱 Telefon Gamepad
        </button>
        <button onClick={startLocal} style={{
          background: '#1e1e2a', color: 'white', border: '2px solid #2a2a3a',
          borderRadius: 12, padding: '16px 28px', fontSize: 15,
          fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          ⌨️ Yerel 2 Oyuncu
        </button>
      </div>

      <div style={{ color: '#555', fontSize: 12, textAlign: 'center', lineHeight: 2 }}>
        <div>P1: A Yumruk | S Tekme | D Blok | F Özel</div>
        <div>P2 (yerel): ← → ↑ ↓ tuşları</div>
      </div>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}`}</style>
    </div>
  );

  // ── WAITING ──────────────────────────────────────────────────
  if (screen === 'waiting') return (
    <div style={{
      width: '100%', height: '100vh', background: '#0a0a14',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 24,
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ fontSize: 48 }}>📱</div>
      <div style={{ color: 'white', fontSize: 22, fontWeight: 900 }}>Telefonu Bağla</div>
      <div style={{
        background: '#1e1e2a', border: '2px solid #6c63ff',
        borderRadius: 16, padding: '20px 40px', textAlign: 'center',
      }}>
        <div style={{ color: '#9090a8', fontSize: 12, letterSpacing: 3, marginBottom: 8 }}>ODA KODU</div>
        <div style={{ color: '#6c63ff', fontSize: 52, fontWeight: 900, letterSpacing: 8 }}>{roomCode}</div>
      </div>
      <div style={{ color: '#9090a8', fontSize: 13, textAlign: 'center', lineHeight: 1.8 }}>
        Telefonunda <strong style={{ color: 'white' }}>{window.location.origin}/gamepad</strong><br />
        adresine git ve kodu gir
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        color: connected ? '#3ecf8e' : '#9090a8',
        fontSize: 14, fontWeight: 700,
      }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: connected ? '#3ecf8e' : '#555', display: 'inline-block' }} />
        {connected ? 'Kontroller bağlandı!' : 'Bekleniyor...'}
      </div>
      <button onClick={() => setScreen('menu')} style={{
        background: 'transparent', color: '#555', border: '1px solid #333',
        borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontFamily: 'inherit',
      }}>← Geri</button>
    </div>
  );

  // ── OVER ─────────────────────────────────────────────────────
  if (screen === 'over') return (
    <div style={{
      width: '100%', height: '100vh', background: '#0a0a14',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ fontSize: 72 }}>{winner === 'DRAW' ? '🤝' : '🏆'}</div>
      <div style={{ fontSize: 36, fontWeight: 900, color: winner === 'P1' ? '#ff4444' : winner === 'P2' ? '#4488ff' : '#f5c518', letterSpacing: 3 }}>
        {winner === 'DRAW' ? 'BERABERE!' : `${winner} KAZANDI!`}
      </div>
      <div style={{ display: 'flex', gap: 40 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#ff4444', fontWeight: 700 }}>🥊 KIRMIZI</div>
          <div style={{ color: 'white', fontSize: 28, fontWeight: 900 }}>{p1HP} HP</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#4488ff', fontWeight: 700 }}>🥷 MAVİ</div>
          <div style={{ color: 'white', fontSize: 28, fontWeight: 900 }}>{p2HP} HP</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button onClick={() => { gameOverRef.current = false; startGame(); }} style={{
          background: 'linear-gradient(135deg, #6c63ff, #ff4f5e)',
          color: 'white', border: 'none', borderRadius: 12,
          padding: '14px 32px', fontSize: 16, fontWeight: 900,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>TEKRAR</button>
        <button onClick={() => setScreen('menu')} style={{
          background: '#1e1e2a', color: 'white', border: '1px solid #333',
          borderRadius: 12, padding: '14px 24px', fontSize: 14,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>Menü</button>
      </div>
    </div>
  );

  // ── PLAYING ──────────────────────────────────────────────────
  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', background: '#0a0a14', overflow: 'hidden' }}>
      {/* Top HUD */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'rgba(0,0,0,0.7)',
        pointerEvents: 'none',
      }}>
        {/* P1 HP */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: '#ff4444', fontWeight: 700, fontSize: 13 }}>🥊 KIRMIZI</span>
            <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{p1HP}</span>
          </div>
          <div style={{ height: 10, background: '#1a0000', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${p1HP}%`, background: 'linear-gradient(90deg,#ff4444,#ff8888)', borderRadius: 5, transition: 'width .15s' }} />
          </div>
          {p1Action && <div style={{ color: '#ffcc00', fontSize: 11, fontWeight: 700, marginTop: 2 }}>{p1Action}!</div>}
        </div>

        {/* Timer */}
        <div style={{
          background: '#1e1e2a', border: '2px solid #333',
          borderRadius: 8, padding: '4px 16px', textAlign: 'center', minWidth: 60,
        }}>
          <div style={{ color: timeLeft <= 10 ? '#ff4444' : 'white', fontSize: 24, fontWeight: 900 }}>{timeLeft}</div>
        </div>

        {/* P2 HP */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{p2HP}</span>
            <span style={{ color: '#4488ff', fontWeight: 700, fontSize: 13 }}>MAVİ 🥷</span>
          </div>
          <div style={{ height: 10, background: '#00001a', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${p2HP}%`, background: 'linear-gradient(90deg,#4488ff,#88bbff)', borderRadius: 5, transition: 'width .15s', marginLeft: 'auto' }} />
          </div>
          {p2Action && <div style={{ color: '#ffcc00', fontSize: 11, fontWeight: 700, marginTop: 2, textAlign: 'right' }}>{p2Action}!</div>}
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

      {/* Controls reminder */}
      <div style={{
        position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center',
        color: '#333', fontSize: 11, pointerEvents: 'none',
      }}>
        {vsMode === 'local' ? 'P1: A S D F  |  P2: ↑ ↓ ← →' : `Oda: ${roomCode} | ${connected ? '📱 Bağlı' : '📱 Bekliyor'}`}
      </div>
    </div>
  );
}
