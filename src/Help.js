import { useState, useEffect } from 'react';
import './Help.css';
import Game from './Game';

function Help({ navigateTo }) {
    const [activeTab, setActiveTab] = useState('help');
    const [activeSection, setActiveSection] = useState('faq');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [filteredFaqItems, setFilteredFaqItems] = useState([]);
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
            id: 'faq-0',
            category: 'exchange',
            question: "Как происходит обмен?",
            answer: "1. Выберите направление\n2. Введите сумму\n3. Подтвердите\n4. Оператор завершает обмен"
        },
        {
            id: 'faq-1',
            category: 'exchange',
            question: "Сколько времени занимает обмен?",
            answer: "Покупка: 5–15 минут\nПродажа: 15–30 минут"
        },
        {
            id: 'faq-2',
            category: 'security',
            question: "Это безопасно?",
            answer: "Мы не храним средства и не используем приватные ключи."
        }
    ];

    const rulesContent = [
        {
            id: 'rule-1',
            title: "Общие положения",
            content: "Сервис предоставляет услуги обмена. Все операции модерируются."
        }
    ];

    const categories = [
        { id: 'all', name: 'Все', icon: '📚' },
        { id: 'exchange', name: 'Обмен', icon: '💱' },
        { id: 'security', name: 'Безопасность', icon: '🔐' }
    ];

    /* ===============================
       FILTERS / SEARCH
    =============================== */
    useEffect(() => {
        setFilteredFaqItems(
            selectedCategory === 'all'
                ? faqItems
                : faqItems.filter(i => i.category === selectedCategory)
        );
    }, [selectedCategory]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        const q = searchQuery.toLowerCase();
        const res = faqItems.filter(i =>
            i.question.toLowerCase().includes(q) ||
            i.answer.toLowerCase().includes(q)
        );

        setSearchResults(res);
        setShowSearchResults(res.length > 0);
    }, [searchQuery]);

    /* ===============================
       HANDLERS
    =============================== */
    const toggleFaq = (id) => {
        setExpandedFaqs(p => ({ ...p, [id]: !p[id] }));
    };

    /* ===============================
       RENDER
    =============================== */
    return (
        <div className="telegram-help">

            {/* TABS */}
            <div className="tg-tabs">
                <button className={activeTab === 'help' ? 'active' : ''} onClick={() => setActiveTab('help')}>📚</button>
                <button className={activeTab === 'exchange' ? 'active' : ''} onClick={() => setActiveTab('exchange')}>💱</button>
                <button className={activeTab === 'security' ? 'active' : ''} onClick={() => setActiveTab('security')}>🔐</button>
                <button className={activeTab === 'game' ? 'active' : ''} onClick={() => setActiveTab('game')}>🎮</button>
            </div>

            {activeTab === 'game' && <Game />}

            {activeTab !== 'game' && (
                <>
                    {/* SEARCH */}
                    <div className="tg-search-container">
                        <input
                            className="tg-search"
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
                                className={`tg-chip ${selectedCategory === c.id ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(c.id)}
                            >
                                {c.icon} {c.name}
                            </button>
                        ))}
                    </div>

                    {/* CONTENT */}
                    <div className="tg-content">
                        {filteredFaqItems.map(item => (
                            <div key={item.id} className="tg-list-item">
                                <div className="tg-list-item-header" onClick={() => toggleFaq(item.id)}>
                                    {item.question}
                                    <span className={expandedFaqs[item.id] ? 'rotated' : ''}>⌄</span>
                                </div>
                                {expandedFaqs[item.id] && (
                                    <div className="tg-list-item-content">
                                        {item.answer.split('\n').map((l, i) => (
                                            <div key={i} className="tg-text">{l}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default Help;
