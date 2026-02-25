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

      // clamp dt чтобы физика не развалилась при лаге/сворачивании
      const dt = Math.min(32, Math.max(8, dtMs)) / 16.666;

      const g = gameRef.current;

      // апдейт логики
      if (g.running && g.started && g.player.alive) {
        stepGame(g, dt);
      }

      // рендер
      drawGame(ctx, g);

      // синхронизируем React-стейт редко (чтобы не лагало)
      if (g._dirty) {
        g._dirty = false;
        setGame({ ...g, player: { ...g.player } });
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onTap = () => {
    const g = gameRef.current;

    if (!g.started) {
      g.started = true;
      g.running = true;
      g._dirty = true;
      setGame({ ...g, player: { ...g.player } });
      return;
    }

    if (!g.player.alive) return;

    jumpAction(g);
    g._dirty = true;
    setGame({ ...g, player: { ...g.player } });
  };

  const onRestart = () => {
    const g = gameRef.current;

    // обновляем рекорд
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
        <div className="dj-header">
          <div className="dj-badge">
            <span className="dj-badge-label">SCORE</span>
            <span className="dj-badge-value">{game.player.score}</span>
          </div>

          <div className="dj-title">
            DOODLE<br />JUMP
            <span className="dj-sub">wall kick edition</span>
          </div>

          <div className="dj-badge">
            <span className="dj-badge-label">BEST</span>
            <span className="dj-badge-value">
              {Math.max(highScore, game.player.score)}
            </span>
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
                <div className="dj-card-title">Tap to Start</div>
                <div className="dj-card-text">
                  Прыгай от стен как в Doodle Jump ✨
                </div>
                <div className="dj-pill">TAP ANYWHERE</div>
              </div>
            </div>
          )}

          {!game.player.alive && (
            <div className="dj-overlay">
              <div className="dj-card">
                <div className="dj-card-title dj-danger">Game Over</div>
                <div className="dj-card-text">
                  Score: <b>{game.player.score}</b>
                  <br />
                  Best: <b>{Math.max(highScore, game.player.score)}</b>
                </div>

                <button className="dj-restart" onClick={onRestart}>
                  Play Again
                </button>
              </div>
            </div>
          )}

          <div className="dj-hint">
            {game.started && game.player.alive ? 'Tap to jump' : ' '}
          </div>
        </div>
      </div>
    </div>
  );
}