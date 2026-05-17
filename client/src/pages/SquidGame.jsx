import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════
//  CONSTANTS & CONFIG
// ═══════════════════════════════════════════════
const STAGES = [
  { id: 1, name: "Kırmızı Işık Yeşil Işık", emoji: "🚦", desc: "Işık yeşilken koş, kırmızıda dur!" },
  { id: 2, name: "Dalgona", emoji: "🍬", desc: "Şekli kırmadan çıkar!" },
  { id: 3, name: "Halat Çekme", emoji: "🤝", desc: "Tıkla ve rakibini yık!" },
  { id: 4, name: "Misket", emoji: "🔮", desc: "10 misket topla, rakibini geç!" },
  { id: 5, name: "Cam Köprü", emoji: "🪟", desc: "Doğru camı seç, karşıya geç!" },
  { id: 6, name: "Squid Game", emoji: "🦑", desc: "Final arena — hayatta kal!" },
];

const PINK = "#E53888";
const DARK = "#0d0d0d";
const LIGHT_PINK = "#f472b6";
const GOLD = "#f5c518";

// ═══════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════
export default function SquidGame() {
  const [screen, setScreen] = useState("menu"); // menu | mode | stage | playing | dead | win | gameover
  const [mode, setMode] = useState("single"); // single | multi
  const [currentStage, setCurrentStage] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [playerName, setPlayerName] = useState("OYUNCU 1");
  const [player2Name, setPlayer2Name] = useState("OYUNCU 2");
  const [stageResult, setStageResult] = useState(null); // win | lose

  const goToStage = (idx) => {
    setCurrentStage(idx);
    setStageResult(null);
    setScreen("playing");
  };

  const handleStageEnd = (won, pts = 0) => {
    setStageResult(won ? "win" : "lose");
    if (won) {
      setScore((s) => s + pts);
      setTimeout(() => {
        if (currentStage >= STAGES.length - 1) setScreen("win");
        else setScreen("stage");
      }, 1800);
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      setTimeout(() => {
        if (newLives <= 0) setScreen("gameover");
        else setScreen("playing"); // retry
      }, 1800);
    }
  };

  const restart = () => {
    setCurrentStage(0);
    setLives(3);
    setScore(0);
    setStageResult(null);
    setScreen("menu");
  };

  return (
    <div style={{
      width: "100%", height: "100vh", background: DARK,
      fontFamily: "'Trebuchet MS', sans-serif",
      overflow: "hidden", position: "relative",
      display: "flex", flexDirection: "column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Noto+Sans+KR:wght@400;700;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow { 0%,100%{text-shadow:0 0 10px ${PINK}} 50%{text-shadow:0 0 40px ${PINK},0 0 80px ${PINK}} }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes flash { 0%,100%{background:${DARK}} 50%{background:#ff000033} }
        .btn-pink {
          background: ${PINK}; color: white; border: none; border-radius: 8px;
          padding: 14px 32px; font-size: 18px; font-weight: 900; cursor: pointer;
          letter-spacing: 2px; transition: all .2s; font-family: inherit;
          box-shadow: 0 0 20px ${PINK}66;
        }
        .btn-pink:hover { transform: scale(1.05); box-shadow: 0 0 40px ${PINK}; }
        .btn-ghost {
          background: transparent; color: white; border: 2px solid #333; border-radius: 8px;
          padding: 12px 28px; font-size: 16px; cursor: pointer; transition: all .2s;
          font-family: inherit; font-weight: 700;
        }
        .btn-ghost:hover { border-color: ${PINK}; color: ${PINK}; }
        .progress-bar { height: 8px; background: #222; border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, ${PINK}, ${GOLD}); transition: width .3s; border-radius: 4px; }
      `}</style>

      {/* HUD */}
      {screen === "playing" && (
        <div style={{
          padding: "8px 20px", background: "#111", display: "flex",
          justifyContent: "space-between", alignItems: "center",
          borderBottom: `2px solid ${PINK}33`,
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} style={{ fontSize: 20, opacity: i < lives ? 1 : 0.2 }}>❤️</span>
            ))}
          </div>
          <div style={{ color: PINK, fontWeight: 900, fontSize: 14, letterSpacing: 2 }}>
            ETAP {currentStage + 1} — {STAGES[currentStage]?.name}
          </div>
          <div style={{ color: GOLD, fontWeight: 900, fontSize: 16 }}>
            {score.toLocaleString()} P
          </div>
        </div>
      )}

      {/* SCREENS */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {screen === "menu" && <MenuScreen onStart={() => setScreen("mode")} />}
        {screen === "mode" && (
          <ModeScreen
            mode={mode} setMode={setMode}
            playerName={playerName} setPlayerName={setPlayerName}
            player2Name={player2Name} setPlayer2Name={setPlayer2Name}
            onStart={() => { setScreen("stage"); }}
          />
        )}
        {screen === "stage" && (
          <StageSelect
            stages={STAGES} current={currentStage}
            onSelect={(i) => goToStage(i)}
            score={score} lives={lives}
          />
        )}
        {screen === "playing" && (
          <StagePlayer
            stage={currentStage}
            mode={mode}
            playerName={playerName}
            player2Name={player2Name}
            onEnd={handleStageEnd}
            result={stageResult}
          />
        )}
        {screen === "win" && <WinScreen score={score} onRestart={restart} />}
        {screen === "gameover" && <GameOverScreen score={score} onRestart={restart} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  MENU SCREEN
// ═══════════════════════════════════════════════
function MenuScreen({ onStart }) {
  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 32,
      background: `radial-gradient(ellipse at 50% 0%, ${PINK}22 0%, ${DARK} 70%)`,
      animation: "fadeIn .6s ease",
    }}>
      {/* Şekiller */}
      <div style={{ display: "flex", gap: 24, marginBottom: 8 }}>
        {["▲", "⬛", "⬤"].map((s, i) => (
          <div key={i} style={{
            width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center",
            border: `2px solid ${PINK}`, borderRadius: i === 2 ? "50%" : i === 0 ? "0" : "4px",
            color: PINK, fontSize: 20, animation: `bounce ${1.2 + i * 0.3}s infinite`,
          }}>{s}</div>
        ))}
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{
          fontSize: "clamp(36px, 8vw, 72px)", fontWeight: 900, color: "white",
          fontFamily: "'Black Han Sans', sans-serif",
          animation: "glow 2s infinite",
          lineHeight: 1,
        }}>
          오징어 게임
        </div>
        <div style={{ fontSize: "clamp(14px, 3vw, 22px)", color: PINK, letterSpacing: 8, marginTop: 8, fontWeight: 700 }}>
          SQUID GAME
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <button className="btn-pink" onClick={onStart} style={{ fontSize: 20, padding: "16px 48px" }}>
          OYUNA BAŞLA
        </button>
        <div style={{ color: "#555", fontSize: 13, letterSpacing: 1 }}>
          6 ETABın TAMAMINI GEÇ — HAYATTA KAL
        </div>
      </div>

      <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
        {STAGES.map((s, i) => (
          <div key={i} style={{ textAlign: "center", opacity: 0.7 }}>
            <div style={{ fontSize: 24 }}>{s.emoji}</div>
            <div style={{ fontSize: 9, color: "#555", letterSpacing: 1, marginTop: 4 }}>ETAP {i + 1}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  MODE SCREEN
// ═══════════════════════════════════════════════
function ModeScreen({ mode, setMode, playerName, setPlayerName, player2Name, setPlayer2Name, onStart }) {
  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 28, padding: 24,
      animation: "fadeIn .4s ease",
    }}>
      <div style={{ color: "white", fontSize: 28, fontWeight: 900, letterSpacing: 3 }}>MOD SEÇ</div>

      <div style={{ display: "flex", gap: 20 }}>
        {[
          { id: "single", label: "TEK OYUNCU", icon: "👤", desc: "AI rakipler ile oyna" },
          { id: "multi", label: "2 OYUNCU", icon: "👥", desc: "Aynı klavyede oyna" },
        ].map((m) => (
          <div
            key={m.id}
            onClick={() => setMode(m.id)}
            style={{
              border: `3px solid ${mode === m.id ? PINK : "#333"}`,
              borderRadius: 16, padding: "24px 36px", cursor: "pointer",
              textAlign: "center", transition: "all .2s",
              background: mode === m.id ? `${PINK}11` : "transparent",
              transform: mode === m.id ? "scale(1.05)" : "scale(1)",
            }}
          >
            <div style={{ fontSize: 48 }}>{m.icon}</div>
            <div style={{ color: "white", fontWeight: 900, fontSize: 16, marginTop: 8, letterSpacing: 2 }}>{m.label}</div>
            <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>{m.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#888", fontSize: 12, marginBottom: 6, letterSpacing: 1 }}>OYUNCU 1 ADI</div>
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={12}
            style={{
              background: "#1a1a1a", border: `1px solid ${PINK}66`, borderRadius: 8,
              padding: "10px 16px", color: "white", fontSize: 16, fontFamily: "inherit",
              textAlign: "center", outline: "none", width: 180,
            }}
          />
        </div>
        {mode === "multi" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#888", fontSize: 12, marginBottom: 6, letterSpacing: 1 }}>OYUNCU 2 ADI</div>
            <input
              value={player2Name}
              onChange={(e) => setPlayer2Name(e.target.value)}
              maxLength={12}
              style={{
                background: "#1a1a1a", border: "1px solid #4488ff66", borderRadius: 8,
                padding: "10px 16px", color: "white", fontSize: 16, fontFamily: "inherit",
                textAlign: "center", outline: "none", width: 180,
              }}
            />
          </div>
        )}
      </div>

      <button className="btn-pink" onClick={onStart}>DEVAM →</button>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  STAGE SELECT
// ═══════════════════════════════════════════════
function StageSelect({ stages, current, onSelect, score, lives }) {
  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 24, padding: 20,
      animation: "fadeIn .4s ease",
    }}>
      <div style={{ color: "white", fontSize: 22, fontWeight: 900, letterSpacing: 3 }}>
        ETAP SEÇ
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        {stages.map((s, i) => {
          const unlocked = i <= current;
          const done = i < current;
          return (
            <div
              key={i}
              onClick={() => unlocked && onSelect(i)}
              style={{
                border: `2px solid ${done ? "#3ecf8e" : i === current ? PINK : "#333"}`,
                borderRadius: 16, padding: "20px 24px", width: 160, textAlign: "center",
                cursor: unlocked ? "pointer" : "not-allowed",
                opacity: unlocked ? 1 : 0.4,
                background: i === current ? `${PINK}11` : done ? "#3ecf8e11" : "transparent",
                transition: "all .2s",
                transform: i === current ? "scale(1.05)" : "scale(1)",
              }}
            >
              <div style={{ fontSize: 36 }}>{s.emoji}</div>
              <div style={{ color: done ? "#3ecf8e" : "white", fontWeight: 700, fontSize: 13, marginTop: 8, lineHeight: 1.3 }}>
                {s.name}
              </div>
              <div style={{ color: "#555", fontSize: 11, marginTop: 4 }}>ETAP {i + 1}</div>
              {done && <div style={{ color: "#3ecf8e", fontSize: 18, marginTop: 4 }}>✓</div>}
              {!unlocked && <div style={{ color: "#555", fontSize: 18, marginTop: 4 }}>🔒</div>}
            </div>
          );
        })}
      </div>
      <button className="btn-pink" onClick={() => onSelect(current)}>
        ETAP {current + 1}'E BAŞLA
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  STAGE PLAYER — routes to correct game
// ═══════════════════════════════════════════════
function StagePlayer({ stage, mode, playerName, player2Name, onEnd, result }) {
  const games = [Stage1, Stage2, Stage3, Stage4, Stage5, Stage6];
  const Game = games[stage];
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {result && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: result === "win" ? "#00ff0022" : "#ff000033",
          backdropFilter: "blur(4px)",
        }}>
          <div style={{ textAlign: "center", animation: "fadeIn .3s ease" }}>
            <div style={{ fontSize: 80 }}>{result === "win" ? "🎉" : "💀"}</div>
            <div style={{
              fontSize: 42, fontWeight: 900, color: result === "win" ? "#3ecf8e" : "#ff4444",
              letterSpacing: 4,
            }}>
              {result === "win" ? "GEÇTIN!" : "ELENDİN!"}
            </div>
          </div>
        </div>
      )}
      {Game && <Game mode={mode} playerName={playerName} player2Name={player2Name} onEnd={onEnd} />}
    </div>
  );
}

// ═══════════════════════════════════════════════
//  STAGE 1 — KIRMIZI IŞIK YEŞİL IŞIK
// ═══════════════════════════════════════════════
function Stage1({ mode, playerName, player2Name, onEnd }) {
  const [light, setLight] = useState("green"); // green | red | turning
  const [p1Pos, setP1Pos] = useState(0); // 0-100
  const [p2Pos, setP2Pos] = useState(0);
  const [p1Eliminated, setP1Eliminated] = useState(false);
  const [p2Eliminated, setP2Eliminated] = useState(false);
  const [timer, setTimer] = useState(30);
  const [message, setMessage] = useState("");
  const [doll, setDoll] = useState("back"); // back | front
  const lastLightRef = useRef("green");
  const p1MovingRef = useRef(false);
  const p2MovingRef = useRef(false);
  const gameOverRef = useRef(false);
  const lightRef = useRef("green");

  useEffect(() => {
    lightRef.current = light;
  }, [light]);

  // Light cycling
  useEffect(() => {
    let timeout;
    const cycle = () => {
      const greenTime = 1500 + Math.random() * 2000;
      const turningTime = 800;
      const redTime = 1500 + Math.random() * 2000;

      timeout = setTimeout(() => {
        setLight("turning");
        setDoll("front");
        setTimeout(() => {
          setLight("red");
          setTimeout(() => {
            setLight("green");
            setDoll("back");
            if (!gameOverRef.current) cycle();
          }, redTime);
        }, turningTime);
      }, greenTime);
    };
    cycle();
    return () => clearTimeout(timeout);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (gameOverRef.current) return;
    const t = setInterval(() => {
      setTimer((v) => {
        if (v <= 1) {
          clearInterval(t);
          if (!gameOverRef.current) {
            gameOverRef.current = true;
            onEnd(false, 0); // time up = lose
          }
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Keyboard
  useEffect(() => {
    const down = (e) => {
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") p1MovingRef.current = true;
      if ((e.key === "ArrowLeft" || e.key === "a" || e.key === "A") && mode === "multi") p2MovingRef.current = true;
    };
    const up = (e) => {
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") p1MovingRef.current = false;
      if ((e.key === "ArrowLeft" || e.key === "a" || e.key === "A") && mode === "multi") p2MovingRef.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [mode]);

  // Movement loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameOverRef.current) return;

      // AI for p2 in single mode
      if (mode === "single") {
        if (lightRef.current === "green" && !p2Eliminated) {
          setP2Pos((p) => {
            const newP = Math.min(100, p + 0.8 + Math.random() * 0.5);
            if (newP >= 100) {
              gameOverRef.current = true;
              onEnd(false, 0); // AI wins
            }
            return newP;
          });
        }
      }

      if (p1MovingRef.current && !p1Eliminated) {
        if (lightRef.current === "red" || lightRef.current === "turning") {
          setP1Eliminated(true);
          setMessage("❌ YAKALANDIN!");
          setTimeout(() => { gameOverRef.current = true; onEnd(false, 0); }, 1200);
        } else {
          setP1Pos((p) => {
            const newP = Math.min(100, p + 1.5);
            if (newP >= 100) {
              gameOverRef.current = true;
              onEnd(true, 500 + timer * 10);
            }
            return newP;
          });
        }
      }

      if (mode === "multi" && p2MovingRef.current && !p2Eliminated) {
        if (lightRef.current === "red" || lightRef.current === "turning") {
          setP2Eliminated(true);
        } else {
          setP2Pos((p) => {
            const newP = Math.min(100, p + 1.5);
            if (newP >= 100) {
              gameOverRef.current = true;
              onEnd(false, 0); // p2 wins in multi = p1 loses
            }
            return newP;
          });
        }
      }
    }, 50);
    return () => clearInterval(interval);
  }, [mode, p1Eliminated, p2Eliminated]);

  const lightColor = light === "green" ? "#00ff88" : light === "red" ? "#ff3344" : "#ffaa00";

  return (
    <div style={{
      width: "100%", height: "100%", position: "relative",
      background: "linear-gradient(180deg, #0a1a0a 0%, #0d0d0d 100%)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{
          padding: "8px 20px", borderRadius: 20, fontWeight: 900, fontSize: 18, letterSpacing: 2,
          background: lightColor + "22", border: `2px solid ${lightColor}`,
          color: lightColor, transition: "all .3s",
        }}>
          {light === "green" ? "🟢 YEŞİL IŞIK — KOŞA BİLİRSİN" : light === "red" ? "🔴 KIRMIZI IŞIK — DURMA!" : "🟡 DÖNÜYOR..."}
        </div>
        <div style={{ color: "#888", fontSize: 18, fontWeight: 700 }}>⏱ {timer}s</div>
      </div>

      {/* Doll */}
      <div style={{ textAlign: "center", fontSize: 64, transition: "transform .3s", transform: doll === "front" ? "scaleX(-1)" : "scaleX(1)" }}>
        🪆
      </div>

      {/* Track */}
      <div style={{ flex: 1, padding: "0 40px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 24 }}>
        {/* P1 */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: p1Eliminated ? "#ff4444" : "white", fontWeight: 700, fontSize: 14 }}>
              {p1Eliminated ? "💀 " : "🏃 "}{playerName}
              {mode === "single" && <span style={{ color: "#888", fontSize: 11, marginLeft: 8 }}>← → ya da A D tuşları</span>}
            </span>
            <span style={{ color: "#888", fontSize: 12 }}>{Math.round(p1Pos)}m / 100m</span>
          </div>
          <div className="progress-bar" style={{ height: 20, borderRadius: 10 }}>
            <div className="progress-fill" style={{
              width: `${p1Pos}%`, borderRadius: 10,
              background: p1Eliminated ? "#ff4444" : `linear-gradient(90deg, ${PINK}, ${GOLD})`,
            }} />
          </div>
        </div>

        {/* P2 / AI */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: p2Eliminated ? "#ff4444" : "#4488ff", fontWeight: 700, fontSize: 14 }}>
              {p2Eliminated ? "💀 " : "🤖 "}{mode === "multi" ? player2Name : "AI Rakip"}
              {mode === "multi" && <span style={{ color: "#888", fontSize: 11, marginLeft: 8 }}>← A tuşu</span>}
            </span>
            <span style={{ color: "#888", fontSize: 12 }}>{Math.round(p2Pos)}m / 100m</span>
          </div>
          <div className="progress-bar" style={{ height: 20, borderRadius: 10 }}>
            <div style={{
              height: "100%", width: `${p2Pos}%`, borderRadius: 10,
              background: p2Eliminated ? "#ff4444" : "linear-gradient(90deg, #4488ff, #00ccff)",
              transition: "width .1s",
            }} />
          </div>
        </div>

        {/* Finish line */}
        <div style={{ textAlign: "right", color: GOLD, fontSize: 13, fontWeight: 700 }}>🏁 BİTİŞ ÇİZGİSİ</div>
      </div>

      {message && (
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          background: "#ff000033", border: "2px solid #ff4444", borderRadius: 12,
          padding: "16px 32px", color: "#ff4444", fontSize: 24, fontWeight: 900,
          animation: "shake .5s",
        }}>{message}</div>
      )}

      <div style={{ padding: "12px 20px", color: "#555", fontSize: 12, textAlign: "center" }}>
        {mode === "single" ? "Sağ ok / D → İleri git | Kırmızı ışıkta durma!" : "P1: Sağ ok/D → İleri | P2: A tuşu → İleri"}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  STAGE 2 — DALGONA
// ═══════════════════════════════════════════════
const SHAPES = {
  circle: { path: "M 100 50 A 50 50 0 1 1 99.9 50", label: "⬤ Daire", points: [[100,50],[150,100],[100,150],[50,100],[100,50]] },
  triangle: { path: "M 100 30 L 170 150 L 30 150 Z", label: "▲ Üçgen", points: [[100,30],[170,150],[30,150],[100,30]] },
  star: { path: "M 100 20 L 120 80 L 180 80 L 130 120 L 150 180 L 100 140 L 50 180 L 70 120 L 20 80 L 80 80 Z", label: "★ Yıldız", points: [[100,20],[120,80],[180,80],[130,120],[150,180],[100,140],[50,180],[70,120],[20,80],[80,80],[100,20]] },
  umbrella: { path: "M 100 30 A 70 70 0 0 1 170 100 L 100 100 A 70 70 0 0 0 30 100 Z M 100 100 L 100 170 M 85 170 A 15 15 0 0 0 115 170", label: "☂ Şemsiye", points: [[100,30],[130,40],[155,65],[170,100],[100,100],[30,100],[45,65],[70,40],[100,30]] },
};

function Stage2({ playerName, onEnd }) {
  const canvasRef = useRef(null);
  const [shape] = useState(() => {
    const keys = Object.keys(SHAPES);
    return keys[Math.floor(Math.random() * keys.length)];
  });
  const [pressure, setPressure] = useState(100); // 0=broken
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("cut"); // cut | done
  const [timer, setTimer] = useState(45);
  const isDrawing = useRef(false);
  const lastPos = useRef(null);
  const progressRef = useRef(0);
  const gameOverRef = useRef(false);

  const shapeData = SHAPES[shape];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;

    // Draw candy
    ctx.fillStyle = "#d4a017";
    ctx.fillRect(0, 0, W, H);

    // Draw shape outline
    ctx.strokeStyle = "#8B6914";
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    const path = new Path2D(shapeData.path);
    ctx.stroke(path);

    // Dotted guide
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke(path);
    ctx.setLineDash([]);
  }, [shape]);

  // Pressure decay
  useEffect(() => {
    const t = setInterval(() => {
      setPressure((p) => Math.max(0, p - 0.3));
    }, 100);
    return () => clearInterval(t);
  }, []);

  // Timer
  useEffect(() => {
    const t = setInterval(() => {
      setTimer((v) => {
        if (v <= 1) {
          clearInterval(t);
          if (!gameOverRef.current) { gameOverRef.current = true; onEnd(false, 0); }
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0] || e;
    return {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const isNearPath = (x, y) => {
    const pts = shapeData.points;
    for (let i = 0; i < pts.length - 1; i++) {
      const dx = pts[i + 1][0] - pts[i][0];
      const dy = pts[i + 1][1] - pts[i][1];
      const len = Math.hypot(dx, dy);
      if (len === 0) continue;
      const t = Math.max(0, Math.min(1, ((x - pts[i][0]) * dx + (y - pts[i][1]) * dy) / (len * len)));
      const nearX = pts[i][0] + t * dx;
      const nearY = pts[i][1] + t * dy;
      if (Math.hypot(x - nearX, y - nearY) < 20) return true;
    }
    return false;
  };

  const handlePointer = (e, start) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    if (start) { isDrawing.current = true; lastPos.current = null; return; }
    if (!isDrawing.current) return;

    const pos = getPos(e, canvas);
    const onPath = isNearPath(pos.x, pos.y);

    if (!onPath && lastPos.current) {
      // Broke it!
      setPressure((p) => {
        const newP = p - 15;
        if (newP <= 0 && !gameOverRef.current) {
          gameOverRef.current = true;
          onEnd(false, 0);
        }
        return Math.max(0, newP);
      });
    } else if (onPath) {
      // Cut along path
      const ctx = canvas.getContext("2d");
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      if (lastPos.current) {
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }

      progressRef.current = Math.min(100, progressRef.current + 0.5);
      setProgress(progressRef.current);

      if (progressRef.current >= 100 && !gameOverRef.current) {
        gameOverRef.current = true;
        onEnd(true, 300 + timer * 8);
      }
    }
    lastPos.current = pos;
  };

  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", background: "#1a1008", padding: 16, gap: 12,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: 420 }}>
        <div style={{ color: GOLD, fontWeight: 900 }}>🍬 {shapeData.label}</div>
        <div style={{ color: "#888" }}>⏱ {timer}s</div>
      </div>

      <div style={{ display: "flex", gap: 16, width: "100%", maxWidth: 420 }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>İLERLEME</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#888", fontSize: 11, marginBottom: 4 }}>BASINÇ</div>
          <div className="progress-bar">
            <div style={{
              height: "100%", borderRadius: 4, transition: "width .2s",
              width: `${pressure}%`,
              background: pressure > 60 ? "#3ecf8e" : pressure > 30 ? "#f59e0b" : "#ff4444",
            }} />
          </div>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={300} height={300}
        style={{
          borderRadius: 16, cursor: "crosshair",
          border: `3px solid ${GOLD}`,
          touchAction: "none", maxWidth: "90vw", maxHeight: "45vh",
        }}
        onMouseDown={(e) => handlePointer(e, true)}
        onMouseMove={(e) => handlePointer(e, false)}
        onMouseUp={() => isDrawing.current = false}
        onTouchStart={(e) => handlePointer(e, true)}
        onTouchMove={(e) => handlePointer(e, false)}
        onTouchEnd={() => isDrawing.current = false}
      />

      <div style={{ color: "#555", fontSize: 12, textAlign: "center" }}>
        Fare/parmakla şeklin üzerindeki çizgiyi takip et. Dışına çıkma!
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  STAGE 3 — HALAT ÇEKME
// ═══════════════════════════════════════════════
function Stage3({ mode, playerName, player2Name, onEnd }) {
  const [ropePos, setRopePos] = useState(50); // 0=P2 wins, 100=P1 wins
  const [p1Power, setP1Power] = useState(0);
  const [p2Power, setP2Power] = useState(0);
  const [timer, setTimer] = useState(20);
  const gameOverRef = useRef(false);
  const p1Ref = useRef(0);
  const p2Ref = useRef(0);

  useEffect(() => {
    const t = setInterval(() => {
      setTimer((v) => {
        if (v <= 1) {
          clearInterval(t);
          if (!gameOverRef.current) {
            gameOverRef.current = true;
            // whoever has more rope pos wins
            onEnd(ropePos > 50, Math.abs(ropePos - 50) * 10);
          }
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [ropePos]);

  // AI for single mode
  useEffect(() => {
    if (mode !== "single") return;
    const t = setInterval(() => {
      if (gameOverRef.current) return;
      p2Ref.current = Math.max(0, p2Ref.current - 1.5);
      setP2Power(p2Ref.current);
      // AI pulls
      setRopePos((p) => {
        const aiForce = 0.3 + Math.random() * 0.3;
        return Math.max(10, Math.min(90, p - aiForce + p1Ref.current * 0.08));
      });
    }, 100);
    return () => clearInterval(t);
  }, [mode]);

  // Rope physics
  useEffect(() => {
    const t = setInterval(() => {
      if (gameOverRef.current) return;
      p1Ref.current = Math.max(0, p1Ref.current - 2);
      if (mode === "multi") p2Ref.current = Math.max(0, p2Ref.current - 2);
      setP1Power(p1Ref.current);
      setP2Power(p2Ref.current);
    }, 100);
    return () => clearInterval(t);
  }, [mode]);

  const pull = (player) => {
    if (gameOverRef.current) return;
    if (player === 1) {
      p1Ref.current = Math.min(100, p1Ref.current + 20);
      setP1Power(p1Ref.current);
      setRopePos((p) => {
        const newP = Math.min(95, p + 3);
        if (newP >= 90 && !gameOverRef.current) { gameOverRef.current = true; onEnd(true, 400 + timer * 15); }
        return newP;
      });
    } else {
      p2Ref.current = Math.min(100, p2Ref.current + 20);
      setP2Power(p2Ref.current);
      setRopePos((p) => {
        const newP = Math.max(5, p - 3);
        if (newP <= 10 && !gameOverRef.current) { gameOverRef.current = true; onEnd(false, 0); }
        return newP;
      });
    }
  };

  useEffect(() => {
    const down = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") pull(1);
      if (e.code === "KeyW" && mode === "multi") pull(2);
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [mode, timer]);

  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", background: "#0d1117", gap: 24, padding: 20,
    }}>
      <div style={{ color: "#888", fontSize: 14 }}>⏱ {timer} saniye kaldı</div>

      {/* Rope visualization */}
      <div style={{ width: "100%", maxWidth: 500, position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, fontWeight: 700 }}>
          <span style={{ color: PINK }}>{playerName}</span>
          <span style={{ color: "#4488ff" }}>{mode === "multi" ? player2Name : "🤖 AI"}</span>
        </div>

        {/* Rope track */}
        <div style={{
          height: 40, background: "#222", borderRadius: 20, position: "relative", overflow: "hidden",
          border: "2px solid #333",
        }}>
          {/* Rope */}
          <div style={{
            position: "absolute", top: "50%", transform: "translateY(-50%)",
            height: 8, background: GOLD, borderRadius: 4,
            left: 0, right: 0,
          }} />
          {/* Knot */}
          <div style={{
            position: "absolute", top: "50%", left: `${ropePos}%`,
            transform: "translate(-50%, -50%)",
            width: 32, height: 32, background: GOLD, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, transition: "left .1s", zIndex: 2,
            boxShadow: `0 0 12px ${GOLD}`,
          }}>🔘</div>
          {/* Center line */}
          <div style={{
            position: "absolute", top: 0, bottom: 0, left: "50%",
            width: 2, background: "#ff4444", transform: "translateX(-50%)",
          }} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <div className="progress-bar" style={{ width: "45%" }}>
            <div className="progress-fill" style={{ width: `${p1Power}%` }} />
          </div>
          <div style={{ color: "#555", fontSize: 11 }}>GÜÇ</div>
          <div className="progress-bar" style={{ width: "45%" }}>
            <div style={{ height: "100%", borderRadius: 4, width: `${p2Power}%`, background: "linear-gradient(90deg,#4488ff,#00ccff)" }} />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 32 }}>
        <div style={{ textAlign: "center" }}>
          <button
            className="btn-pink"
            onMouseDown={() => pull(1)}
            onTouchStart={(e) => { e.preventDefault(); pull(1); }}
            style={{ padding: "20px 40px", fontSize: 20 }}
          >
            ⬅ ÇEK!
          </button>
          <div style={{ color: "#555", fontSize: 11, marginTop: 6 }}>Space / ↑ tuşu</div>
        </div>

        {mode === "multi" && (
          <div style={{ textAlign: "center" }}>
            <button
              style={{ padding: "20px 40px", fontSize: 20, background: "#4488ff", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontWeight: 900, boxShadow: "0 0 20px #4488ff66" }}
              onMouseDown={() => pull(2)}
              onTouchStart={(e) => { e.preventDefault(); pull(2); }}
            >
              ÇEK! ➡
            </button>
            <div style={{ color: "#555", fontSize: 11, marginTop: 6 }}>W tuşu</div>
          </div>
        )}
      </div>

      <div style={{ color: "#555", fontSize: 12 }}>
        İpi kendi tarafına çek! Kırmızı çizgiyi geçersen kazanırsın.
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  STAGE 4 — MİSKET
// ═══════════════════════════════════════════════
function Stage4({ mode, playerName, player2Name, onEnd }) {
  const [p1Marbles, setP1Marbles] = useState(10);
  const [p2Marbles, setP2Marbles] = useState(10);
  const [phase, setPhase] = useState("guess"); // guess | throw | result
  const [round, setRound] = useState(1);
  const [guess, setGuess] = useState(null); // odd | even
  const [aiHidden, setAiHidden] = useState(Math.floor(Math.random() * 5) + 1);
  const [throwCount, setThrowCount] = useState(1);
  const [roundResult, setRoundResult] = useState(null);
  const [timer, setTimer] = useState(3);
  const gameOverRef = useRef(false);

  const makeGuess = (g) => {
    if (gameOverRef.current) return;
    setGuess(g);
    const hidden = aiHidden;
    const isOdd = hidden % 2 === 1;
    const correct = (g === "odd" && isOdd) || (g === "even" && !isOdd);
    setRoundResult({ correct, hidden, guess: g });
    setPhase("result");

    if (correct) {
      setP1Marbles((m) => m + 1);
      setP2Marbles((m) => m - 1);
    } else {
      setP1Marbles((m) => m - 1);
      setP2Marbles((m) => m + 1);
    }

    setTimeout(() => {
      const newP1 = correct ? p1Marbles + 1 : p1Marbles - 1;
      const newP2 = correct ? p2Marbles - 1 : p2Marbles + 1;
      if (newP1 <= 0) { gameOverRef.current = true; onEnd(false, 0); return; }
      if (newP2 <= 0) { gameOverRef.current = true; onEnd(true, 200 + round * 30); return; }
      setAiHidden(Math.floor(Math.random() * 5) + 1);
      setRound((r) => r + 1);
      setPhase("guess");
      setRoundResult(null);
    }, 2000);
  };

  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", background: "#0d0d1a", gap: 20, padding: 20,
    }}>
      <div style={{ color: PINK, fontWeight: 900, letterSpacing: 2 }}>TUR {round}</div>

      {/* Marble counts */}
      <div style={{ display: "flex", gap: 40 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "white", fontWeight: 700 }}>{playerName}</div>
          <div style={{ fontSize: 40, margin: "8px 0" }}>🔮</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: p1Marbles > 5 ? "#3ecf8e" : p1Marbles > 2 ? GOLD : "#ff4444" }}>
            {p1Marbles}
          </div>
          <div style={{ color: "#555", fontSize: 11 }}>MİSKET</div>
        </div>
        <div style={{ color: "#555", fontSize: 32, display: "flex", alignItems: "center" }}>VS</div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#4488ff", fontWeight: 700 }}>{mode === "multi" ? player2Name : "🤖 AI"}</div>
          <div style={{ fontSize: 40, margin: "8px 0" }}>🔮</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: p2Marbles > 5 ? "#4488ff" : p2Marbles > 2 ? GOLD : "#ff4444" }}>
            {p2Marbles}
          </div>
          <div style={{ color: "#555", fontSize: 11 }}>MİSKET</div>
        </div>
      </div>

      {phase === "guess" && (
        <div style={{ textAlign: "center", animation: "fadeIn .3s ease" }}>
          <div style={{ color: "#888", fontSize: 14, marginBottom: 16 }}>
            {mode === "single" ? "AI elinde kaç misket saklıyor?" : "Rakip elinde kaç misket saklıyor?"}
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <button className="btn-pink" onClick={() => makeGuess("odd")} style={{ padding: "16px 32px" }}>
              TEK (1,3,5...)
            </button>
            <button
              onClick={() => makeGuess("even")}
              style={{
                background: "#4488ff", color: "white", border: "none", borderRadius: 8,
                padding: "16px 32px", fontSize: 16, fontWeight: 900, cursor: "pointer",
                fontFamily: "inherit", boxShadow: "0 0 20px #4488ff66",
              }}
            >
              ÇİFT (2,4,6...)
            </button>
          </div>
        </div>
      )}

      {phase === "result" && roundResult && (
        <div style={{
          textAlign: "center", animation: "fadeIn .3s ease",
          background: roundResult.correct ? "#3ecf8e22" : "#ff444422",
          border: `2px solid ${roundResult.correct ? "#3ecf8e" : "#ff4444"}`,
          borderRadius: 16, padding: 24,
        }}>
          <div style={{ fontSize: 36 }}>{roundResult.correct ? "✅" : "❌"}</div>
          <div style={{ color: "white", fontWeight: 700, marginTop: 8 }}>
            AI'ın elinde: {roundResult.hidden} misket ({roundResult.hidden % 2 === 1 ? "TEK" : "ÇİFT"})
          </div>
          <div style={{ color: roundResult.correct ? "#3ecf8e" : "#ff4444", fontSize: 18, fontWeight: 900, marginTop: 4 }}>
            {roundResult.correct ? "+1 MİSKET KAZANDIN!" : "-1 MİSKET KAYBETTİN!"}
          </div>
        </div>
      )}

      <div style={{ color: "#555", fontSize: 12 }}>Rakibin elindeki misket sayısını tahmin et. Kim sıfırlanırsa kaybeder!</div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  STAGE 5 — CAM KÖPRÜ
// ═══════════════════════════════════════════════
function Stage5({ playerName, onEnd }) {
  const ROWS = 8;
  const [safeGlass, ] = useState(() =>
    Array.from({ length: ROWS }, () => Math.random() < 0.5 ? "left" : "right")
  );
  const [position, setPosition] = useState(-1); // -1 = start
  const [chosen, setChosen] = useState([]); // array of 'left'|'right' choices
  const [broken, setBroken] = useState(false);
  const [lives2, setLives2] = useState(2); // 3 tries
  const gameOverRef = useRef(false);

  const step = (side) => {
    if (gameOverRef.current || broken) return;
    const nextRow = position + 1;
    if (nextRow >= ROWS) return;

    setChosen((c) => [...c, side]);

    if (safeGlass[nextRow] === side) {
      const newPos = nextRow;
      setPosition(newPos);
      if (newPos >= ROWS - 1) {
        gameOverRef.current = true;
        onEnd(true, 600);
      }
    } else {
      // Fall!
      setBroken(true);
      const newLives = lives2 - 1;
      setLives2(newLives);
      setTimeout(() => {
        if (newLives <= 0) { gameOverRef.current = true; onEnd(false, 0); }
        else {
          setBroken(false);
          setPosition(-1);
          setChosen([]);
        }
      }, 1200);
    }
  };

  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", background: "#0a0a1a", padding: 16, gap: 12,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: 360 }}>
        <div style={{ color: "white", fontWeight: 700 }}>
          {Array.from({ length: lives2 }).map((_, i) => <span key={i}>❤️</span>)}
          {Array.from({ length: 2 - lives2 }).map((_, i) => <span key={i} style={{ opacity: 0.2 }}>❤️</span>)}
        </div>
        <div style={{ color: "#888", fontSize: 13 }}>ADIM {position + 1} / {ROWS}</div>
      </div>

      {/* Bridge */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, justifyContent: "center" }}>
        {Array.from({ length: ROWS }).map((_, row) => {
          const isCurrent = row === position;
          const isPast = row < position;
          const choice = chosen[row];
          const safe = safeGlass[row];
          const revealed = isPast;

          return (
            <div key={row} style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ color: "#555", fontSize: 11, width: 20, textAlign: "right" }}>{ROWS - row}</div>
              {["left", "right"].map((side) => {
                const isChosen = choice === side && (isPast || broken);
                const isSafe = safe === side && revealed;
                const isDanger = safe !== side && choice === side && (broken || isPast);

                return (
                  <div
                    key={side}
                    onClick={() => row === position + 1 && step(side)}
                    style={{
                      width: 80, height: 36, borderRadius: 8, cursor: row === position + 1 ? "pointer" : "default",
                      border: `2px solid ${
                        isDanger ? "#ff4444" :
                        isSafe ? "#3ecf8e" :
                        isCurrent ? "#888" :
                        row === position + 1 ? "#4488ff" : "#333"
                      }`,
                      background: isDanger ? "#ff444422" : isSafe ? "#3ecf8e22" :
                        row === position + 1 ? "#4488ff11" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, transition: "all .2s",
                      opacity: row > position + 1 ? 0.4 : 1,
                    }}
                  >
                    {isDanger ? "💥" : isSafe ? "✅" : row === position + 1 ? "🪟" : "▭"}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {broken && (
        <div style={{ color: "#ff4444", fontWeight: 900, fontSize: 20, animation: "shake .3s" }}>
          💥 CAM KIRDI! {lives2 > 0 ? "TEKRAR DENE!" : ""}
        </div>
      )}

      <div style={{ color: "#555", fontSize: 12 }}>Sol ya da sağ camı seç. Yanlış cam kırılır!</div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  STAGE 6 — SQUID GAME FINAL
// ═══════════════════════════════════════════════
function Stage6({ mode, playerName, player2Name, onEnd }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const animRef = useRef(null);
  const keysRef = useRef({});
  const gameOverRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;

    const initState = () => ({
      p1: { x: 80, y: H / 2, hp: 100, vx: 0, vy: 0, color: PINK, name: playerName, radius: 16, attacks: [] },
      p2: { x: W - 80, y: H / 2, hp: 100, vx: 0, vy: 0, color: "#4488ff", name: mode === "multi" ? player2Name : "🤖 AI", radius: 16, attacks: [] },
      bullets: [],
      aiTimer: 0,
    });

    stateRef.current = initState();

    const down = (e) => { keysRef.current[e.code] = true; };
    const up = (e) => { keysRef.current[e.code] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const s = stateRef.current;
      const k = keysRef.current;

      if (!gameOverRef.current) {
        // P1 movement
        if (k["ArrowUp"] || k["KeyW"]) s.p1.vy -= 500 * dt;
        if (k["ArrowDown"] || k["KeyS"]) s.p1.vy += 500 * dt;
        if (k["ArrowLeft"] || k["KeyA"]) s.p1.vx -= 500 * dt;
        if (k["ArrowRight"] || k["KeyD"]) s.p1.vx += 500 * dt;

        // P1 shoot
        if (k["Space"] && !s.p1._lastShot) {
          s.p1._lastShot = true;
          const angle = Math.atan2(s.p2.y - s.p1.y, s.p2.x - s.p1.x);
          s.bullets.push({ x: s.p1.x, y: s.p1.y, vx: Math.cos(angle) * 400, vy: Math.sin(angle) * 400, owner: 1, life: 3, r: 6 });
        }
        if (!k["Space"]) s.p1._lastShot = false;

        // P2 movement (multi)
        if (mode === "multi") {
          if (k["Numpad8"]) s.p2.vy -= 500 * dt;
          if (k["Numpad5"] || k["Numpad2"]) s.p2.vy += 500 * dt;
          if (k["Numpad4"]) s.p2.vx -= 500 * dt;
          if (k["Numpad6"]) s.p2.vx += 500 * dt;
          if (k["Numpad0"] && !s.p2._lastShot) {
            s.p2._lastShot = true;
            const angle = Math.atan2(s.p1.y - s.p2.y, s.p1.x - s.p2.x);
            s.bullets.push({ x: s.p2.x, y: s.p2.y, vx: Math.cos(angle) * 400, vy: Math.sin(angle) * 400, owner: 2, life: 3, r: 6 });
          }
          if (!k["Numpad0"]) s.p2._lastShot = false;
        }

        // AI
        if (mode === "single") {
          s.aiTimer -= dt;
          const dx = s.p1.x - s.p2.x, dy = s.p1.y - s.p2.y;
          const dist = Math.hypot(dx, dy);
          s.p2.vx += (dx / dist) * 200 * dt;
          s.p2.vy += (dy / dist) * 200 * dt;
          if (s.aiTimer <= 0) {
            s.aiTimer = 0.8 + Math.random() * 0.5;
            const angle = Math.atan2(dy, dx);
            s.bullets.push({ x: s.p2.x, y: s.p2.y, vx: Math.cos(angle) * 350, vy: Math.sin(angle) * 350, owner: 2, life: 2.5, r: 6 });
          }
        }

        // Physics
        for (const p of [s.p1, s.p2]) {
          p.vx *= Math.pow(0.05, dt);
          p.vy *= Math.pow(0.05, dt);
          p.x = Math.max(p.radius, Math.min(W - p.radius, p.x + p.vx * dt));
          p.y = Math.max(p.radius, Math.min(H - p.radius, p.y + p.vy * dt));
        }

        // Bullets
        s.bullets = s.bullets.filter((b) => {
          b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
          if (b.life <= 0 || b.x < 0 || b.x > W || b.y < 0 || b.y > H) return false;
          const target = b.owner === 1 ? s.p2 : s.p1;
          if (Math.hypot(b.x - target.x, b.y - target.y) < target.radius + b.r) {
            target.hp -= 10;
            if (target.hp <= 0 && !gameOverRef.current) {
              gameOverRef.current = true;
              onEnd(b.owner === 1, 800);
            }
            return false;
          }
          return true;
        });
      }

      // Draw
      ctx.fillStyle = "#0d0d1a";
      ctx.fillRect(0, 0, W, H);

      // Ground pattern
      ctx.strokeStyle = "#1a1a2a";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Bullets
      for (const b of stateRef.current.bullets) {
        ctx.shadowBlur = 10; ctx.shadowColor = b.owner === 1 ? PINK : "#4488ff";
        ctx.fillStyle = b.owner === 1 ? PINK : "#4488ff";
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Players
      for (const p of [stateRef.current.p1, stateRef.current.p2]) {
        // HP bar
        ctx.fillStyle = "#333";
        ctx.fillRect(p.x - 24, p.y - p.radius - 14, 48, 6);
        ctx.fillStyle = p.hp > 50 ? "#3ecf8e" : p.hp > 25 ? GOLD : "#ff4444";
        ctx.fillRect(p.x - 24, p.y - p.radius - 14, 48 * (p.hp / 100), 6);

        ctx.shadowBlur = 16; ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "white";
        ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center";
        ctx.fillText(p.name, p.x, p.y + p.radius + 14);
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [mode]);

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      <canvas ref={canvasRef} style={{ flex: 1, display: "block", width: "100%", cursor: "crosshair" }} />
      <div style={{ background: "#111", padding: "8px 16px", display: "flex", gap: 32, justifyContent: "center", fontSize: 12, color: "#555" }}>
        <span>P1: WASD hareket | SPACE ateş</span>
        {mode === "multi" && <span>P2: Numpad 8456 hareket | Numpad 0 ateş</span>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  WIN / GAME OVER SCREENS
// ═══════════════════════════════════════════════
function WinScreen({ score, onRestart }) {
  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 24,
      background: `radial-gradient(ellipse at 50%, ${GOLD}22, ${DARK} 70%)`,
      animation: "fadeIn .6s ease",
    }}>
      <div style={{ fontSize: 80, animation: "bounce 1s infinite" }}>🏆</div>
      <div style={{ fontSize: 48, fontWeight: 900, color: GOLD, letterSpacing: 4, animation: "glow 2s infinite" }}>
        KAZANDIN!
      </div>
      <div style={{ color: "white", fontSize: 24, fontWeight: 700 }}>
        TOPLAM PUAN: <span style={{ color: GOLD }}>{score.toLocaleString()}</span>
      </div>
      <div style={{ color: "#888", fontSize: 14, textAlign: "center", maxWidth: 300 }}>
        Tüm 6 etabı başarıyla geçtin. Hayatta kalmayı başardın!
      </div>
      <button className="btn-pink" onClick={onRestart} style={{ fontSize: 18, padding: "16px 40px" }}>
        TEKRAR OYNA
      </button>
    </div>
  );
}

function GameOverScreen({ score, onRestart }) {
  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 24,
      background: `radial-gradient(ellipse at 50%, #ff000022, ${DARK} 70%)`,
      animation: "fadeIn .6s ease",
    }}>
      <div style={{ fontSize: 80 }}>💀</div>
      <div style={{ fontSize: 48, fontWeight: 900, color: "#ff4444", letterSpacing: 4 }}>
        ELENDİN
      </div>
      <div style={{ color: "white", fontSize: 20, fontWeight: 700 }}>
        PUAN: <span style={{ color: GOLD }}>{score.toLocaleString()}</span>
      </div>
      <div style={{ color: "#888", fontSize: 14 }}>Hayatta kalamadın.</div>
      <button className="btn-pink" onClick={onRestart}>TEKRAR DENE</button>
    </div>
  );
}
