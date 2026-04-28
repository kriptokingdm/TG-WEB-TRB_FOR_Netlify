// Game.jsx
import { useEffect, useRef, useState } from 'react';
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  createGame,
  stepGame,
  jumpAction,
  drawGame,
  restartGame,
} from './gameLogic';
import './Game.css';

export default function Game() {
  const canvasRef = useRef(null);

  const [game, setGame] = useState(() => createGame());
  const gameRef = useRef(game);

  const [highScore, setHighScore] = useState(() => {
    const v = localStorage.getItem('wallKickersHighScore');
    return v ? parseInt(v, 10) : 0;
  });

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });

    let raf = 0;
    let lastTs = performance.now();

    const loop = (ts) => {
      const dtMs = ts - lastTs;
      lastTs = ts;

      const dt = Math.min(32, Math.max(8, dtMs)) / 16.666;

      const g = gameRef.current;

      if (g.running && g.started && g.player.alive) {
        stepGame(g, dt);
      }

      drawGame(ctx, g, highScore);

      if (g._dirty) {
        g._dirty = false;
        setGame({ ...g, player: { ...g.player } });
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [highScore]);

  const getTapX = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches?.[0]?.clientX ?? rect.left + rect.width / 2);
    const x = ((clientX - rect.left) / rect.width) * GAME_WIDTH; // в координатах канваса
    return Math.max(0, Math.min(GAME_WIDTH, x));
  };

  // Тап = прыжок в сторону тапа (во время игры)
  const onTap = (e) => {
    const g = gameRef.current;
    if (!g.started || !g.player.alive) return;

    const tapX = getTapX(e);
    jumpAction(g, tapX);

    g._dirty = true;
    setGame({ ...g, player: { ...g.player } });
  };

  const onStart = () => {
    const g = gameRef.current;
    if (g.started) return;

    g.started = true;
    g.running = true;
    g._dirty = true;
    setGame({ ...g, player: { ...g.player } });
  };

  const onRestart = () => {
    const g = gameRef.current;

    if (g.player.score > highScore) {
      setHighScore(g.player.score);
      localStorage.setItem('wallKickersHighScore', String(g.player.score));
    }

    restartGame(g);
    g._dirty = true;
    setGame({ ...g, player: { ...g.player } });
  };

  return (
    <div className="dj-page">
      <div className="dj-shell">
        <div className="dj-topbar">
          <div className="dj-stat">
            <div className="dj-stat-label">SCORE</div>
            <div className="dj-stat-value">{game.player.score}</div>
          </div>

          <div className="dj-logo">
            DOODLE<span>JUMP</span>
            <div className="dj-logo-sub">dark mode</div>
          </div>

          <div className="dj-stat">
            <div className="dj-stat-label">BEST</div>
            <div className="dj-stat-value">{highScore}</div>
          </div>
        </div>

        <div className="dj-container">
          <canvas
            ref={canvasRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            onPointerDown={onTap}
          />

          {!game.started && game.player.alive && (
            <div className="dj-overlay">
              <div className="dj-card">
                <div className="dj-card-title">Start</div>
                <div className="dj-card-text">
                  Тапай слева/справа — прыжок летит в сторону тапа.<br />
                  Стены не липнут (wrap как Doodle Jump).
                </div>

                <button className="dj-btn dj-btn-primary" onClick={onStart}>
                  ▶ START
                </button>

                <div className="dj-card-hint">Рекорд: {highScore}</div>
              </div>
            </div>
          )}

          {!game.player.alive && (
            <div className="dj-overlay">
              <div className="dj-card">
                <div className="dj-card-title dj-danger">GAME OVER</div>
                <div className="dj-card-text">
                  Score: <b>{game.player.score}</b><br />
                  Best: <b>{Math.max(highScore, game.player.score)}</b>
                </div>

                <button className="dj-btn dj-btn-primary" onClick={onRestart}>
                  ↻ PLAY AGAIN
                </button>
              </div>
            </div>
          )}

          {game.started && game.player.alive && (
            <div className="dj-hud-hint">tap left/right to steer</div>
          )}
        </div>
      </div>
    </div>
  );
}