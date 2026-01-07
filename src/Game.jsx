import { useEffect, useRef, useState } from 'react';
import {
  createPlayer,
  generatePlatforms,
  updatePlayer,
  handleJump,
  updatePlatforms,
  GAME_HEIGHT,
  GAME_WIDTH
} from './gameLogic';
import './Game.css';

export default function Game() {
  const canvasRef = useRef(null);
  const [player, setPlayer] = useState(createPlayer());
  const [platforms, setPlatforms] = useState(generatePlatforms());
  const [running, setRunning] = useState(true);

  const playerRef = useRef(player);
  const platformsRef = useRef(platforms);

  // Синхронизация ref с state
  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { platformsRef.current = platforms; }, [platforms]);

  // Главный игровой цикл
  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    let animationId;

    const loop = () => {
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      if (playerRef.current.alive && running) {
        updatePlayer(playerRef.current, platformsRef.current);
        updatePlatforms(platformsRef.current, playerRef.current.score);

        // Скролл вверх
        if (playerRef.current.y < GAME_HEIGHT / 3) {
          const diff = GAME_HEIGHT / 3 - playerRef.current.y;
          playerRef.current.y = GAME_HEIGHT / 3;
          platformsRef.current.forEach(p => (p.y += diff));
          playerRef.current.score += Math.floor(diff);
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
    handleJump(playerRef.current);
  };

  const restart = () => {
    const newPlatforms = generatePlatforms();
    const newPlayer = createPlayer();
    setPlatforms(newPlatforms);
    platformsRef.current = newPlatforms;
    setPlayer(newPlayer);
    playerRef.current = newPlayer;
    setRunning(true);
  };

  const draw = ctx => {
    // Фон
    ctx.fillStyle = '#1c1c1e';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

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

    // Game Over
    if (!playerRef.current.alive) {
      ctx.fillStyle = '#ff3b30';
      ctx.font = '24px system-ui';
      ctx.fillText('GAME OVER', 110, 300);
    }
  };

  return (
    <div className="wk-container" onClick={handleTap}>
      <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} />
      {!playerRef.current.alive && (
        <button className="wk-restart" onClick={restart}>
          Restart
        </button>
      )}
    </div>
  );
}
