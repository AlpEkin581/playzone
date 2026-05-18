import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || '';
const WS_URL  = API_URL || 'http://localhost:5000';

const BUTTONS = [
  { action: 'punch',   label: '👊',  sublabel: 'YUMRUK',  color: '#ffcc00', bg: '#33290a' },
  { action: 'kick',    label: '🦵',  sublabel: 'TEKME',   color: '#ff8800', bg: '#331a00' },
  { action: 'block',   label: '🛡️',  sublabel: 'BLOK',    color: '#4488ff', bg: '#0a1833' },
  { action: 'special', label: '⚡',  sublabel: 'ÖZEL',    color: '#ff00ff', bg: '#330033' },
];

export default function Gamepad() {
  const socketRef = useRef(null);
  const [screen, setScreen]   = useState('join'); // join | connected | error
  const [code, setCode]       = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [lastAction, setLastAction] = useState('');
  const [gameState, setGameState]   = useState(null);

  useEffect(() => {
    const sock = io(WS_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = sock;

    sock.on('room-joined',       (code) => { setRoomCode(code); setScreen('connected'); });
    sock.on('room-error',        (msg)  => { alert(msg); setScreen('join'); });
    sock.on('host-disconnected', ()     => { alert('PC bağlantısı kesildi!'); setScreen('join'); });
    sock.on('game-state',        (s)    => setGameState(s));

    return () => sock.disconnect();
  }, []);

  const join = () => {
    if (code.length !== 4) return;
    socketRef.current?.emit('join-room', code);
  };

  const press = (action) => {
    socketRef.current?.emit('button', { roomCode, action });
    setLastAction(action);
    setTimeout(() => setLastAction(''), 400);
    // Vibrate if supported
    if (navigator.vibrate) navigator.vibrate(30);
  };

  // ── JOIN SCREEN ──────────────────────────────────────────────
  if (screen === 'join') return (
    <div style={{
      width: '100vw', height: '100vh', background: '#0a0a14',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 24,
      fontFamily: 'Inter, sans-serif', padding: 24,
    }}>
      <div style={{ fontSize: 64 }}>🎮</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: 'white', fontSize: 24, fontWeight: 900 }}>GAMEPAD</div>
        <div style={{ color: '#6c63ff', fontSize: 12, letterSpacing: 4, marginTop: 4 }}>FIGHT ZONE</div>
      </div>

      <div style={{ textAlign: 'center', color: '#9090a8', fontSize: 13 }}>
        PC'deki oda kodunu gir
      </div>

      <input
        type="number"
        maxLength={4}
        value={code}
        onChange={(e) => setCode(e.target.value.slice(0, 4))}
        placeholder="1234"
        style={{
          background: '#1e1e2a', border: '2px solid #6c63ff',
          borderRadius: 12, padding: '16px 24px',
          color: 'white', fontSize: 36, fontWeight: 900,
          textAlign: 'center', outline: 'none', width: 180,
          fontFamily: 'Inter, sans-serif', letterSpacing: 8,
        }}
      />

      <button
        onClick={join}
        disabled={code.length !== 4}
        style={{
          background: code.length === 4 ? 'linear-gradient(135deg, #6c63ff, #ff4f5e)' : '#1e1e2a',
          color: 'white', border: 'none', borderRadius: 50,
          padding: '16px 48px', fontSize: 18, fontWeight: 900,
          cursor: code.length === 4 ? 'pointer' : 'not-allowed',
          fontFamily: 'Inter, sans-serif', transition: 'all .2s',
        }}
      >
        BAĞLAN
      </button>
    </div>
  );

  // ── GAMEPAD SCREEN ───────────────────────────────────────────
  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#0a0a14',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, sans-serif', overflow: 'hidden',
      userSelect: 'none',
    }}>
      {/* Top bar */}
      <div style={{
        padding: '10px 20px', background: '#111',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid #2a2a3a',
      }}>
        <div style={{ color: '#3ecf8e', fontSize: 13, fontWeight: 700 }}>✓ Bağlandı</div>
        <div style={{ color: '#6c63ff', fontSize: 16, fontWeight: 900, letterSpacing: 4 }}>KOD: {roomCode}</div>
        <div style={{ color: '#9090a8', fontSize: 12 }}>🎮 Gamepad</div>
      </div>

      {/* Last action flash */}
      <div style={{
        textAlign: 'center', padding: '8px',
        color: lastAction ? '#ffcc00' : 'transparent',
        fontSize: 14, fontWeight: 700, letterSpacing: 2,
        transition: 'color .1s',
      }}>
        {BUTTONS.find(b => b.action === lastAction)?.sublabel || '—'}
      </div>

      {/* Buttons grid */}
      <div style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12, padding: '12px 16px 24px',
      }}>
        {BUTTONS.map((btn) => (
          <button
            key={btn.action}
            onTouchStart={(e) => { e.preventDefault(); press(btn.action); }}
            onMouseDown={() => press(btn.action)}
            style={{
              background: lastAction === btn.action ? btn.color + '33' : btn.bg,
              border: `3px solid ${lastAction === btn.action ? btn.color : btn.color + '55'}`,
              borderRadius: 20,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer',
              transition: 'all .08s',
              transform: lastAction === btn.action ? 'scale(0.94)' : 'scale(1)',
              boxShadow: lastAction === btn.action ? `0 0 24px ${btn.color}88` : 'none',
            }}
          >
            <span style={{ fontSize: 52, lineHeight: 1 }}>{btn.label}</span>
            <span style={{ color: btn.color, fontSize: 14, fontWeight: 900, letterSpacing: 2 }}>
              {btn.sublabel}
            </span>
          </button>
        ))}
      </div>

      {/* Tip */}
      <div style={{ textAlign: 'center', padding: '8px', color: '#333', fontSize: 11 }}>
        Butonlara bas — titreşim ile tepki alırsın
      </div>
    </div>
  );
}
