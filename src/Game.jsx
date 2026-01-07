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
  const [lastTime, setLastTime] = useState(0);

  const playerRef = useRef(player);
  const platformsRef = useRef(platforms);
  const particlesRef = useRef(particles);

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

    const loop = (currentTime) => {
      const deltaTime = Math.min((currentTime - (lastTime || currentTime)) / 16.67, 2);
      setLastTime(currentTime);
      
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      if (playerRef.current.alive && running) {
        updatePlayer(playerRef.current, platformsRef.current, deltaTime);
        updatePlatforms(platformsRef.current, playerRef.current.score);
        updateParticles(particlesRef.current, deltaTime);
        
        setPlayer({...playerRef.current});
        setPlatforms([...platformsRef.current]);
        setParticles([...particlesRef.current]);

        // Автоскролл
        if (playerRef.current.y < GAME_HEIGHT / 3) {
          const diff = GAME_HEIGHT / 3 - playerRef.current.y;
          playerRef.current.y = GAME_HEIGHT / 3;
          platformsRef.current.forEach(p => (p.y += diff));
          particlesRef.current.forEach(p => (p.y += diff));
          playerRef.current.score += Math.floor(diff * 0.5);
        }
      }

      draw(ctx, deltaTime);
      animationId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationId);
  }, [running, lastTime, highScore]);

  const handleTap = (e) => {
    if (!playerRef.current.alive) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    const dashMode = tapX < GAME_WIDTH / 2; // Левая половина - дэш, правая - прыжок
    
    handleJump(playerRef.current, platformsRef.current, dashMode);
    
    // Частицы при прыжке
    const newParticles = createParticles(
      playerRef.current.x + playerRef.current.width / 2,
      playerRef.current.y + playerRef.current.height,
      dashMode ? '#ff9500' : '#3390ec',
      8
    );
    setParticles([...particlesRef.current, ...newParticles]);
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
    setParticles([]);
    particlesRef.current = [];
    setRunning(true);
  };

  const draw = (ctx, deltaTime) => {
    // Градиентный фон
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#0a0a0f');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Звезды (декор)
    for (let i = 0; i < 50; i++) {
      const star = platformsRef.current[i];
      if (star) {
        const alpha = 0.3 + Math.sin(Date.now() * 0.001 + i) * 0.2;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(
          Math.sin(Date.now() * 0.0005 + i) * GAME_WIDTH + GAME_WIDTH / 2,
          (star.y * 0.1 + i * 20) % GAME_HEIGHT,
          1, 1
        );
      }
    }

    // Частицы
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    });
    ctx.globalAlpha = 1;

    // Платформы
    platformsRef.current.forEach(p => {
      if (p.broken && p.height <= 0) return;
      
      // Тень платформы
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(p.x + 2, p.y + 2, p.width, p.height);
      
      // Сама платформа
      switch(p.type) {
        case 'spike':
          ctx.fillStyle = '#ff3b30';
          ctx.fillRect(p.x, p.y, p.width, p.height);
          // Шипы
          ctx.fillStyle = '#ff6b66';
          for (let i = 0; i < 5; i++) {
            const spikeX = p.x + i * (p.width / 5);
            ctx.beginPath();
            ctx.moveTo(spikeX + 4, p.y);
            ctx.lineTo(spikeX + 8, p.y - 8);
            ctx.lineTo(spikeX + 12, p.y);
            ctx.fill();
          }
          break;
        case 'spring':
          ctx.fillStyle = '#34c759';
          ctx.fillRect(p.x, p.y, p.width, p.height);
          // Пружина
          ctx.fillStyle = '#2da84e';
          for (let i = 0; i < 3; i++) {
            ctx.fillRect(p.x + 20 + i * 15, p.y - 4, 8, 4);
          }
          break;
        case 'breakable':
          ctx.fillStyle = p.broken ? '#8a8a8e' : '#ff9500';
          ctx.fillRect(p.x, p.y, p.width, p.height);
          // Трещины
          if (!p.broken) {
            ctx.strokeStyle = '#ff7700';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x + 10, p.y + 3);
            ctx.lineTo(p.x + 20, p.y + 9);
            ctx.moveTo(p.x + 40, p.y + 4);
            ctx.lineTo(p.x + 50, p.y + 8);
            ctx.stroke();
          }
          break;
        case 'bouncy':
          ctx.fillStyle = '#af52de';
          ctx.fillRect(p.x, p.y, p.width, p.height);
          // Полосы
          ctx.fillStyle = '#9b45c7';
          for (let i = 0; i < 4; i++) {
            ctx.fillRect(p.x + i * 20, p.y, 10, p.height);
          }
          break;
        case 'moving':
          ctx.fillStyle = '#5856d6';
          ctx.fillRect(p.x, p.y, p.width, p.height);
          // Стрелки направления
          ctx.fillStyle = '#4846c6';
          const arrowX = p.dir > 0 ? p.x + p.width - 10 : p.x + 10;
          ctx.beginPath();
          ctx.moveTo(arrowX, p.y + 6);
          ctx.lineTo(arrowX + 6 * p.dir, p.y + 3);
          ctx.lineTo(arrowX + 6 * p.dir, p.y + 9);
          ctx.closePath();
          ctx.fill();
          break;
        default:
          ctx.fillStyle = '#8e8e93';
          ctx.fillRect(p.x, p.y, p.width, p.height);
      }
    });

    // Трейл игрока
    playerRef.current.trail.forEach((pos, i) => {
      ctx.globalAlpha = pos.alpha * 0.5;
      ctx.fillStyle = '#3390ec';
      ctx.fillRect(pos.x, pos.y, playerRef.current.width, playerRef.current.height);
    });
    ctx.globalAlpha = 1;

    // Игрок
    const invAlpha = playerRef.current.invincible > 0 ? 0.5 + Math.sin(Date.now() * 0.1) * 0.5 : 1;
    ctx.globalAlpha = invAlpha;
    ctx.fillStyle = '#3390ec';
    ctx.fillRect(playerRef.current.x, playerRef.current.y, playerRef.current.width, playerRef.current.height);
    
    // Глаза игрока
    ctx.fillStyle = '#fff';
    const eyeX = playerRef.current.direction > 0 ? 4 : -4;
    ctx.fillRect(
      playerRef.current.x + playerRef.current.width / 2 + eyeX - 3,
      playerRef.current.y + 8,
      3, 3
    );
    ctx.globalAlpha = 1;

    // Счет и информация
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px system-ui';
    ctx.fillText(`Score: ${playerRef.current.score}`, 12, 26);
    
    ctx.font = '14px system-ui';
    ctx.fillText(`High: ${highScore}`, 12, 46);
    
    // Комбо
    if (playerRef.current.combo > 3) {
      ctx.fillStyle = `hsl(${Math.min(playerRef.current.combo * 10, 120)}, 100%, 60%)`;
      ctx.font = 'bold 16px system-ui';
      ctx.fillText(`${Math.floor(playerRef.current.combo)}x COMBO!`, GAME_WIDTH - 100, 26);
    }
    
    // Заряды дэша
    for (let i = 0; i < 2; i++) {
      ctx.fillStyle = i < playerRef.current.dashCharges ? '#ff9500' : '#555';
      ctx.fillRect(GAME_WIDTH - 40 - i * 15, 40, 12, 4);
    }

    // Game Over
    if (!playerRef.current.alive) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      
      ctx.fillStyle = '#ff3b30';
      ctx.font = 'bold 28px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
      
      ctx.fillStyle = '#fff';
      ctx.font = '18px system-ui';
      ctx.fillText(`Final Score: ${playerRef.current.score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2);
      ctx.fillText(`Best: ${highScore}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 25);
    }
    
    ctx.textAlign = 'left';
  };

  return (
    <div className="wk-container">
      <div className="wk-instructions">
        <div>← Tap left side to DASH</div>
        <div>→ Tap right side to JUMP</div>
      </div>
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
    </div>
  );
}