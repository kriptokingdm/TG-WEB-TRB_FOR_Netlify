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

  // Рефы для актуального состояния
  const playerRef = useRef(player);
  const platformsRef = useRef(platforms);

  const tapTimeout = useRef(null);
  const tapCount = useRef(0);

  // Синхронизация рефов с state
  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { platformsRef.current = platforms; }, [platforms]);

  // Садим игрока на стартовую платформу
  useEffect(() => {
    const startPlatform = platformsRef.current[platformsRef.current.length - 1];
    setPlayer(p => ({
      ...p,
      y: startPlatform.y - p.height,
      alive: true,
      velocityY: 0,
      score: 0,
    }));
  }, [platforms]);

  // Главный игровой цикл
  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    let animationId;

    const loop = () => {
      ctx.clearRect(0, 0, 360, GAME_HEIGHT);

      if (playerRef.current.alive && running) {
        updatePlayer(playerRef.current);
        updatePlatforms(platformsRef.current);

        // Скролл вверх при подъеме
        if (playerRef.current.y < GAME_HEIGHT / 3) {
          const diff = GAME_HEIGHT / 3 - playerRef.current.y;
          playerRef.current.y = GAME_HEIGHT / 3;
          platformsRef.current.forEach(p => (p.y += diff));
          playerRef.current.score += Math.floor(diff);
        }

        // Проверка смерти
        if (playerRef.current.y > GAME_HEIGHT) {
          playerRef.current.alive = false;
          setRunning(false);
        }
      }

      draw(ctx);
      animationId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationId);
  }, [running]);

  const handleTap = () => {
    if (!playerRef.current.alive) return;

    tapCount.current++;
    if (!tapTimeout.current) {
      tapTimeout.current = setTimeout(() => {
        handleJump(playerRef.current, platformsRef.current);
        tapCount.current = 0;
        tapTimeout.current = null;
      }, 180);
    }
  };

  const restart = () => {
    const newPlatforms = generatePlatforms();
    const newPlayer = createPlayer();

    setPlatforms(newPlatforms);
    platformsRef.current = newPlatforms;

    setPlayer(newPlayer);
    playerRef.current = newPlayer;

    setRunning(true);

    // Садим игрока на стартовую платформу
    const startPlatform = newPlatforms[newPlatforms.length - 1];
    playerRef.current.y = startPlatform.y - playerRef.current.height;
  };

  const draw = ctx => {
    ctx.fillStyle = '#1c1c1e';
    ctx.fillRect(0, 0, 360, GAME_HEIGHT);

    // Платформы
    platformsRef.current.forEach(p => {
      if (p.type === 'spike') ctx.fillStyle = '#ff3b30';
      else if (p.type === 'spring') ctx.fillStyle = '#34c759';
      else ctx.fillStyle = '#8e8e93';

      ctx.fillRect(p.x, p.y, p.width, p.height);
    });

    // Игрок
    ctx.fillStyle = '#3390ec';
    ctx.fillRect(playerRef.current.x, playerRef.current.y, playerRef.current.width, playerRef.current.height);

    // Счёт
    ctx.fillStyle = '#fff';
    ctx.font = '16px system-ui';
    ctx.fillText(`Score: ${playerRef.current.score}`, 12, 24);

    // Game over
    if (!playerRef.current.alive) {
      ctx.fillStyle = '#ff3b30';
      ctx.font = '24px system-ui';
      ctx.fillText('GAME OVER', 110, 300);
    }
  };

  return (
    <div className="wk-container" onClick={handleTap}>
      <canvas ref={canvasRef} width="360" height="640" />
      {!playerRef.current.alive && (
        <button className="wk-restart" onClick={restart}>
          Restart
        </button>
      )}
    </div>
  );
}
