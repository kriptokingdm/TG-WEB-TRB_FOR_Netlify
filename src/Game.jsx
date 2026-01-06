import { useEffect, useState } from 'react';
import './Game.css';

export default function Game() {
    const [x, setX] = useState(50);
    const [dir, setDir] = useState(1);
    const [score, setScore] = useState(0);

    const jump = () => {
        setDir(d => -d);
        setScore(s => s + 1);
        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    };

    useEffect(() => {
        const i = setInterval(() => {
            setX(p => {
                let n = p + dir * 1.5;
                if (n <= 2 || n >= 92) {
                    setDir(d => -d);
                }
                return n;
            });
        }, 16);
        return () => clearInterval(i);
    }, [dir]);

    return (
        <div className="game" onClick={jump}>
            <div className="score">Score: {score}</div>
            <div className="wall left" />
            <div className="wall right" />
            <div className="player" style={{ left: `${x}%` }} />
            <div className="hint">Тапай, чтобы отскакивать</div>
        </div>
    );
}
