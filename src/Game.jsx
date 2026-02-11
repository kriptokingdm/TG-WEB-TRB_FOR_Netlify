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
      drawGame(ctx, g, highScore);

      // синхронизируем React-стейт редко (чтобы не лагало)
      if (g._dirty) {
        g._dirty = false;
        setGame({ ...g, player: { ...g.player } });
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [highScore]);

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
    <div className="wk-container">
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        onPointerDown={onTap}
      />

      {!game.player.alive && (
        <button className="wk-restart" onClick={onRestart}>
          Play Again
        </button>
      )}

      {!game.started && game.player.alive && (
        <div className="wk-start-hint">Tap anywhere to start</div>
      )}
    </div>
  );
}
