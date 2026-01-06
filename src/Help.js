import { useState, useEffect } from 'react';
import './Help.css';
import Game from './Game';

function Help({ navigateTo }) {
    const [activeTab, setActiveTab] = useState('help');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [expandedFaqs, setExpandedFaqs] = useState({});

    /* ===============================
       TELEGRAM BACK BUTTON
    =============================== */
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

    /* ===============================
       DATA
    =============================== */
    const faqItems = [
        {
            id: '1',
            category: 'exchange',
            question: 'Как происходит обмен?',
            answer: 'Вы создаёте заявку, переводите средства, оператор завершает обмен.'
        },
        {
            id: '2',
            category: 'exchange',
            question: 'Сколько времени занимает обмен?',
            answer: 'В среднем от 5 до 30 минут.'
        },
        {
            id: '3',
            category: 'security',
            question: 'Это безопасно?',
            answer: 'Мы не храним средства и не используем приватные ключи.'
        }
    ];

    const categories = [
        { id: 'all', label: 'Все' },
        { id: 'exchange', label: 'Обмен' },
        { id: 'security', label: 'Безопасность' }
    ];

    const filteredFaq = faqItems.filter(item => {
        const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const matchSearch =
            item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    const toggleFaq = id => {
        setExpandedFaqs(prev => ({ ...prev, [id]: !prev[id] }));
    };

    /* ===============================
       GAME TAB — ВАЖНО
       ПОЛНОЕ ОТКЛЮЧЕНИЕ HELP
    =============================== */
    if (activeTab === 'game') {
        return (
            <div className="telegram-help">
                <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
                <Game />
            </div>
        );
    }

    /* ===============================
       HELP CONTENT
    =============================== */
    return (
        <div className="telegram-help">
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* SEARCH */}
            <div className="tg-search">
                <input
                    placeholder="Поиск"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>

            {/* CATEGORIES */}
            <div className="tg-categories">
                {categories.map(c => (
                    <button
                        key={c.id}
                        className={selectedCategory === c.id ? 'active' : ''}
                        onClick={() => setSelectedCategory(c.id)}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            {/* FAQ */}
            <div className="tg-list">
                {filteredFaq.map(item => (
                    <div key={item.id} className="tg-item">
                        <div
                            className="tg-item-header"
                            onClick={() => toggleFaq(item.id)}
                        >
                            {item.question}
                            <span className={expandedFaqs[item.id] ? 'rotated' : ''}>⌄</span>
                        </div>

                        {expandedFaqs[item.id] && (
                            <div className="tg-item-body">
                                {item.answer}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ===============================
   TABS — ВЫНЕСЕНЫ
=============================== */
function Tabs({ activeTab, setActiveTab }) {
    return (
        <div className="tg-tabs">
            <button onClick={() => setActiveTab('help')} className={activeTab === 'help' ? 'active' : ''}>📚</button>
            <button onClick={() => setActiveTab('exchange')} className={activeTab === 'exchange' ? 'active' : ''}>💱</button>
            <button onClick={() => setActiveTab('security')} className={activeTab === 'security' ? 'active' : ''}>🔐</button>
            <button onClick={() => setActiveTab('game')} className={activeTab === 'game' ? 'active' : ''}>🎮</button>
        </div>
    );
}

export default Help;
