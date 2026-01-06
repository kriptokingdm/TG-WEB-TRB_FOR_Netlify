import { useState, useEffect } from 'react';
import './Help.css';

function Help({ navigateTo }) {
    const [activeSection, setActiveSection] = useState('faq');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [filteredFaqItems, setFilteredFaqItems] = useState([]);
    const [expandedFaqs, setExpandedFaqs] = useState({});

    /* TELEGRAM BACK BUTTON */
    useEffect(() => {
        const tg = window.Telegram?.WebApp;
        if (!tg) return;

        tg.BackButton.show();
        tg.BackButton.onClick(() => navigateTo('home'));

        return () => {
            tg.BackButton.offClick();
            tg.BackButton.hide();
        };
    }, [navigateTo]);

    /* DATA */
    const faqItems = [
        {
            id: 'faq-1',
            category: 'exchange',
            question: 'Как происходит обмен?',
            answer:
                '1. Выберите направление\n2. Укажите сумму\n3. Подтвердите\n4. Следуйте инструкциям оператора',
        },
        {
            id: 'faq-2',
            category: 'exchange',
            question: 'Сколько времени занимает обмен?',
            answer: 'Покупка: 5–15 минут\nПродажа: 15–30 минут',
        },
        {
            id: 'faq-3',
            category: 'security',
            question: 'Это безопасно?',
            answer: 'Мы не храним ключи и используем защищенные каналы.',
        },
    ];

    const rulesContent = [
        {
            id: 'rule-1',
            title: 'Общие положения',
            content: 'Сервис предоставляет услуги обмена цифровых активов.',
        },
    ];

    const categories = [
        { id: 'all', name: 'Все', icon: '📚' },
        { id: 'exchange', name: 'Обмен', icon: '💱' },
        { id: 'security', name: 'Безопасность', icon: '🔐' },
    ];

    /* FILTER */
    useEffect(() => {
        setFilteredFaqItems(
            selectedCategory === 'all'
                ? faqItems
                : faqItems.filter(i => i.category === selectedCategory)
        );
    }, [selectedCategory]);

    /* SEARCH */
    useEffect(() => {
        if (!searchQuery.trim()) {
            setShowSearchResults(false);
            return;
        }

        const q = searchQuery.toLowerCase();
        const res = faqItems.filter(
            i =>
                i.question.toLowerCase().includes(q) ||
                i.answer.toLowerCase().includes(q)
        );

        setSearchResults(res);
        setShowSearchResults(res.length > 0);
    }, [searchQuery]);

    /* HANDLERS */
    const toggleFaq = id =>
        setExpandedFaqs(prev => ({ ...prev, [id]: !prev[id] }));

    return (
        <div className="telegram-help">
            {/* SEARCH */}
            <div className="tg-search-container">
                <div className="tg-search-input">
                    <input
                        className="tg-search"
                        placeholder="Поиск"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* CATEGORIES */}
            <div className="tg-categories">
                {categories.map(c => (
                    <button
                        key={c.id}
                        className={`tg-chip ${
                            selectedCategory === c.id ? 'active' : ''
                        }`}
                        onClick={() => setSelectedCategory(c.id)}
                    >
                        {c.icon} {c.name}
                    </button>
                ))}
            </div>

            {/* FAQ */}
            <div className="tg-section">
                <div className="tg-section-header">
                    <span>❓ Часто задаваемые вопросы</span>
                </div>

                <div className="tg-list">
                    {filteredFaqItems.map(item => (
                        <div
                            key={item.id}
                            className={`tg-faq ${
                                expandedFaqs[item.id] ? 'open' : ''
                            }`}
                        >
                            <div
                                className="tg-faq-header"
                                onClick={() => toggleFaq(item.id)}
                            >
                                <span>{item.question}</span>
                                <span className="arrow">⌄</span>
                            </div>

                            <div className="tg-faq-body">
                                {item.answer.split('\n').map((l, i) => (
                                    <div key={i}>{l}</div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Help;
