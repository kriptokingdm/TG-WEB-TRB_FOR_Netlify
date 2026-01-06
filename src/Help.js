import { useEffect, useState } from 'react';
import './Help.css';

function Help({ navigateTo }) {
    const [tab, setTab] = useState('help');
    const [expanded, setExpanded] = useState(null);
    const [search, setSearch] = useState('');

    /* TELEGRAM BACK */
    useEffect(() => {
        const tg = window.Telegram?.WebApp;
        if (!tg) return;

        tg.BackButton.show();
        tg.BackButton.onClick(() => navigateTo('home'));

        return () => {
            tg.BackButton.hide();
            tg.BackButton.offClick();
        };
    }, [navigateTo]);

    const faq = [
        {
            id: 1,
            q: 'Как проходит обмен?',
            a: 'Вы выбираете направление → вводите сумму → подтверждаете → оператор завершает сделку.'
        },
        {
            id: 2,
            q: 'Сколько времени занимает обмен?',
            a: 'В среднем от 5 до 30 минут.'
        },
        {
            id: 3,
            q: 'Это безопасно?',
            a: 'Мы не храним средства и не используем приватные ключи.'
        }
    ];

    /* GAME */
    const [pos, setPos] = useState(50);
    const [dir, setDir] = useState(1);
    const [score, setScore] = useState(0);

    const jump = () => {
        setDir(d => -d);
        setScore(s => s + 1);
    };

    useEffect(() => {
        if (tab !== 'game') return;
        const t = setInterval(() => {
            setPos(p => {
                let np = p + dir * 2;
                if (np <= 0 || np >= 90) {
                    setDir(d => -d);
                }
                return np;
            });
        }, 16);
        return () => clearInterval(t);
    }, [dir, tab]);

    return (
        <div className="tg-root">
            {/* TABS */}
            <div className="tg-tabs">
                <button onClick={() => setTab('help')} className={tab === 'help' ? 'active' : ''}>📚</button>
                <button onClick={() => setTab('exchange')} className={tab === 'exchange' ? 'active' : ''}>💱</button>
                <button onClick={() => setTab('security')} className={tab === 'security' ? 'active' : ''}>🔐</button>
                <button onClick={() => setTab('game')} className={tab === 'game' ? 'active' : ''}>🎮</button>
            </div>

            {/* HELP */}
            {tab === 'help' && (
                <div className="tg-section">
                    <input
                        className="tg-search"
                        placeholder="Поиск"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />

                    {faq
                        .filter(i =>
                            i.q.toLowerCase().includes(search.toLowerCase())
                        )
                        .map(item => (
                            <div key={item.id} className={`tg-faq ${expanded === item.id ? 'open' : ''}`}>
                                <div
                                    className="tg-faq-header"
                                    onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                                >
                                    {item.q}
                                    <span>⌄</span>
                                </div>
                                <div className="tg-faq-body">{item.a}</div>
                            </div>
                        ))}
                </div>
            )}

            {/* EXCHANGE */}
            {tab === 'exchange' && (
                <div className="tg-section text">
                    💱 Здесь будет информация об обмене, курсах и лимитах.
                </div>
            )}

            {/* SECURITY */}
            {tab === 'security' && (
                <div className="tg-section text">
                    🔐 Мы не храним средства, не используем приватные ключи и работаем вручную.
                </div>
            )}

            {/* GAME */}
            {tab === 'game' && (
                <div className="tg-game" onClick={jump}>
                    <div className="tg-score">Score: {score}</div>
                    <div className="tg-wall left" />
                    <div className="tg-wall right" />
                    <div className="tg-player" style={{ left: `${pos}%` }} />
                    <div className="tg-game-hint">Тапай чтобы отскакивать</div>
                </div>
            )}
        </div>
    );
}

export default Help;
