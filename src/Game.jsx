import { useEffect, useRef, useState } from 'react';
import {
  createPlayer,
  generatePlatforms,
  updatePlayer,
  handleJump,
  updatePlatforms,
  GAME_HEIGHT,
} from './gameLogic';
import './Game.css';

export default function Game() {
  const canvasRef = useRef(null);
  const [player, setPlayer] = useState(createPlayer());
  const [platforms, setPlatforms] = useState(generatePlatforms());
  const [running, setRunning] = useState(true);

  const tapTimeout = useRef(null);
  const tapCount = useRef(0);

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    let animationId;

    const loop = () => {
      ctx.clearRect(0, 0, 360, GAME_HEIGHT);

      if (player.alive && running) {
        updatePlayer(player);
        updatePlatforms(platforms);

        if (player.y < GAME_HEIGHT / 3) {
          const diff = GAME_HEIGHT / 3 - player.y;
          player.y = GAME_HEIGHT / 3;
          platforms.forEach(p => (p.y += diff));
          player.score += Math.floor(diff);
        }

        if (player.y > GAME_HEIGHT) {
          player.alive = false;
        }
      }

      draw(ctx);
      animationId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationId);
  }, [player, platforms, running]);

  const handleTap = () => {
    if (!player.alive) return;

    tapCount.current++;

    if (!tapTimeout.current) {
      tapTimeout.current = setTimeout(() => {
        handleJump(player, platforms);
        tapCount.current = 0;
        tapTimeout.current = null;
      }, 180);
    }
  };

  const restart = () => {
    setPlayer(createPlayer());
    setPlatforms(generatePlatforms());
    setRunning(true);
  };

  const draw = ctx => {
    ctx.fillStyle = '#1c1c1e';
    ctx.fillRect(0, 0, 360, GAME_HEIGHT);

    platforms.forEach(p => {
      if (p.type === 'spike') ctx.fillStyle = '#ff3b30';
      else if (p.type === 'spring') ctx.fillStyle = '#34c759';
      else ctx.fillStyle = '#8e8e93';

      ctx.fillRect(p.x, p.y, p.width, p.height);
    });

    ctx.fillStyle = '#3390ec';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    ctx.fillStyle = '#fff';
    ctx.font = '16px system-ui';
    ctx.fillText(`Score: ${player.score}`, 12, 24);

    if (!player.alive) {
      ctx.fillText('GAME OVER', 120, 300);
    }
  };

  return (
    <div className="wk-container" onClick={handleTap}>
      <canvas ref={canvasRef} width="360" height="640" />
      {!player.alive && (
        <button className="wk-restart" onClick={restart}>
          Restart
        </button>
      )}
    </div>
  );
}
