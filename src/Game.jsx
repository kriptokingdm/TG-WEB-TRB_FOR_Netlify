import { useEffect, useRef, useState } from 'react';
import {
  createPlayer,
  generatePlatforms,
  updatePlayer,
  handleJump,
  updatePlatforms,
  createParticles,
  updateParticles,
  GAME_HEIGHT,
  GAME_WIDTH
} from './gameLogic';
import './Game.css';

export default function Game() {
  const canvasRef = useRef(null);
  const [player, setPlayer] = useState(createPlayer());
  const [platforms, setPlatforms] = useState(generatePlatforms());
  const [particles, setParticles] = useState([]);
  const [running, setRunning] = useState(true);
  const [highScore, setHighScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const playerRef = useRef(player);
  const platformsRef = useRef(platforms);
  const particlesRef = useRef(particles);
  const lastPlayerY = useRef(player.y);

  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { platformsRef.current = platforms; }, [platforms]);
  useEffect(() => { particlesRef.current = particles; }, [particles]);

  // Главный игровой цикл
  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    let animationId;
    
    const storedHighScore = localStorage.getItem('wallKickersHighScore');
    if (storedHighScore) {
      setHighScore(parseInt(storedHighScore));
    }

    const loop = () => {
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      if (playerRef.current.alive && running && gameStarted) {
        updatePlayer(playerRef.current, platformsRef.current);
        updateParticles(particlesRef.current);
        
        // Если игрок поднялся выше - двигаем платформы вниз
        if (playerRef.current.y < lastPlayerY.current) {
          const diff = lastPlayerY.current - playerRef.current.y;
          platformsRef.current.forEach(p => {
            p.y += diff;
          });
          lastPlayerY.current = playerRef.current.y;
          
          // Обновляем счет на основе высоты
          const heightScore = Math.floor((GAME_HEIGHT - playerRef.current.y) / 5);
          playerRef.current.score = Math.max(playerRef.current.score, heightScore);
        }
        
        updatePlatforms(platformsRef.current, playerRef.current.y);
        
        setPlayer({...playerRef.current});
        setPlatforms([...platformsRef.current]);
        setParticles([...particlesRef.current]);
      }

      draw(ctx);
      animationId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationId);
  }, [running, gameStarted, highScore]);

  const handleTap = () => {
    if (!gameStarted) {
      setGameStarted(true);
      return;
    }
    
    if (!playerRef.current.alive) return;
    
    // Создаем частицы при прыжке
    const jumpParticles = createParticles(
      playerRef.current.x + playerRef.current.width / 2,
      playerRef.current.y + playerRef.current.height,
      playerRef.current.onWall ? '#ff9500' : '#3390ec',
      8
    );
    setParticles([...particlesRef.current, ...jumpParticles]);
    
    handleJump(playerRef.current);
  };

  const restart = () => {
    if (playerRef.current.score > highScore) {
      setHighScore(playerRef.current.score);
      localStorage.setItem('wallKickersHighScore', playerRef.current.score.toString());
    }
    
    const newPlatforms = generatePlatforms();
    const newPlayer = createPlayer();
    setPlatforms(newPlatforms);
    platformsRef.current = newPlatforms;
    setPlayer(newPlayer);
    playerRef.current = newPlayer;
    lastPlayerY.current = newPlayer.y;
    setParticles([]);
    particlesRef.current = [];
    setGameStarted(false);
    setRunning(true);
  };

  const draw = (ctx) => {
    // Градиентный фон
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Сетка для фона
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    
    // Вертикальные линии
    for (let x = 0; x < GAME_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_HEIGHT);
      ctx.stroke();
    }
    
    // Горизонтальные линии
    for (let y = 0; y < GAME_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_WIDTH, y);
      ctx.stroke();
    }

    // Частицы
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Платформы
    platformsRef.current.forEach(p => {
      if (p.broken && p.height <= 0) return;
      
      // Тень
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(p.x, p.y + 2, p.width, p.height);
      
      // Сама платформа
      switch(p.type) {
        case 'spike':
          ctx.fillStyle = '#ff3b30';
          ctx.fillRect(p.x, p.y, p.width, p.height);
          // Шипы
          ctx.fillStyle = '#ff6b66';
          const spikeCount = Math.floor(p.width / 15);
          for (let i = 0; i < spikeCount; i++) {
            const spikeX = p.x + i * (p.width / spikeCount) + 8;
            ctx.beginPath();
            ctx.moveTo(spikeX, p.y);
            ctx.lineTo(spikeX - 4, p.y - 8);
            ctx.lineTo(spikeX + 4, p.y - 8);
            ctx.closePath();
            ctx.fill();
          }
          break;
        case 'breakable':
          ctx.fillStyle = p.broken ? '#8a8a8e' : '#ff9500';
          ctx.fillRect(p.x, p.y, p.width, p.height);
          if (!p.broken) {
            // Трещины
            ctx.strokeStyle = '#cc5500';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x + 15, p.y + 3);
            ctx.lineTo(p.x + 25, p.y + 9);
            ctx.moveTo(p.x + 35, p.y + 4);
            ctx.lineTo(p.x + 45, p.y + 8);
            ctx.stroke();
          }
          break;
        case 'moving':
          ctx.fillStyle = '#5856d6';
          ctx.fillRect(p.x, p.y, p.width, p.height);
          // Стрелки направления
          ctx.fillStyle = '#4846c6';
          const arrowCount = Math.floor(p.width / 20);
          for (let i = 0; i < arrowCount; i++) {
            const arrowX = p.x + i * 20 + 10;
            ctx.beginPath();
            ctx.moveTo(arrowX, p.y + 6);
            ctx.lineTo(arrowX + 4 * p.dir, p.y + 3);
            ctx.lineTo(arrowX + 4 * p.dir, p.y + 9);
            ctx.closePath();
            ctx.fill();
          }
          break;
        default:
          if (p.isStart) {
            // Стартовая платформа
            ctx.fillStyle = '#34c759';
            ctx.fillRect(p.x, p.y, p.width, p.height);
            // Текст "START"
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText('START', p.x + p.width/2, p.y + 9);
            ctx.textAlign = 'left';
          } else {
            ctx.fillStyle = '#8e8e93';
            ctx.fillRect(p.x, p.y, p.width, p.height);
          }
      }
    });

    // Трейл игрока
    playerRef.current.trail.forEach((pos, i) => {
      ctx.globalAlpha = pos.alpha;
      ctx.fillStyle = '#3390ec';
      ctx.fillRect(pos.x, pos.y, playerRef.current.width, playerRef.current.height);
    });
    ctx.globalAlpha = 1;

    // Игрок
    ctx.fillStyle = playerRef.current.onWall ? '#ff9500' : '#3390ec';
    ctx.fillRect(playerRef.current.x, playerRef.current.y, playerRef.current.width, playerRef.current.height);
    
    // Глаза
    ctx.fillStyle = '#fff';
    const eyeOffset = playerRef.current.onWall ? 
      (playerRef.current.wallSide * 4) : 
      (playerRef.current.velocityX > 0 ? 4 : -4);
    
    ctx.fillRect(
      playerRef.current.x + playerRef.current.width/2 + eyeOffset - 2,
      playerRef.current.y + 8,
      4, 4
    );

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px system-ui';
    ctx.fillText(`Score: ${playerRef.current.score}`, 12, 26);
    
    ctx.font = '14px system-ui';
    ctx.fillText(`High: ${highScore}`, 12, 48);
    
    // Комбо
    if (playerRef.current.combo > 1) {
      ctx.fillStyle = `hsl(${Math.min(playerRef.current.combo * 15, 60)}, 100%, 60%)`;
      ctx.font = 'bold 16px system-ui';
      ctx.fillText(`${playerRef.current.combo}x`, GAME_WIDTH - 50, 30);
    }
    
    // Индикатор на стене
    if (playerRef.current.onWall) {
      ctx.fillStyle = 'rgba(255, 149, 0, 0.3)';
      const wallX = playerRef.current.wallSide === -1 ? 0 : GAME_WIDTH - 10;
      ctx.fillRect(wallX, 0, 10, GAME_HEIGHT);
    }

    // Начальный экран
    if (!gameStarted) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 28px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('WALL KICKERS', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60);
      
      ctx.font = '18px system-ui';
      ctx.fillText('Tap to jump from walls', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
      ctx.fillText('Reach the highest score!', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
      
      ctx.fillStyle = '#3390ec';
      ctx.font = 'bold 20px system-ui';
      ctx.fillText('TAP TO START', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60);
      
      ctx.font = '14px system-ui';
      ctx.fillStyle = '#8e8e93';
      ctx.fillText(`Best Score: ${highScore}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100);
      ctx.textAlign = 'left';
    }

    // Game Over
    if (!playerRef.current.alive) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      
      ctx.fillStyle = '#ff3b30';
      ctx.font = 'bold 28px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
      
      ctx.fillStyle = '#fff';
      ctx.font = '20px system-ui';
      ctx.fillText(`Score: ${playerRef.current.score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2);
      ctx.fillText(`Best: ${highScore}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
      
      ctx.fillStyle = '#3390ec';
      ctx.font = 'bold 18px system-ui';
      ctx.fillText('TAP RESTART BUTTON', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);
      ctx.textAlign = 'left';
    }
  };

  return (
    <div className="wk-container">
      <canvas 
        ref={canvasRef} 
        width={GAME_WIDTH} 
        height={GAME_HEIGHT} 
        onClick={handleTap}
      />
      {!playerRef.current.alive && (
        <button className="wk-restart" onClick={restart}>
          Play Again
        </button>
      )}
      {!gameStarted && playerRef.current.alive && (
        <div className="wk-start-hint">
          Tap anywhere to start
        </div>
      )}
    </div>
  );
}