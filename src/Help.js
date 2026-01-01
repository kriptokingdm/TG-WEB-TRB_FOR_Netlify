import { useState, useEffect } from 'react';
import './Help.css';

function Help({ navigateTo }) {
    const tg = window.Telegram?.WebApp;

    /* =======================
       STATE
    ======================= */
    const [activeSection, setActiveSection] = useState('faq');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [filteredFaqItems, setFilteredFaqItems] = useState([]);
    const [expandedFaqs, setExpandedFaqs] = useState({});

    /* =======================
       🔥 TELEGRAM INIT (FIX BLACK SCREEN)
    ======================= */
    useEffect(() => {
        if (!tg) return;

        tg.ready();
        tg.expand();

        // Фикс чёрного экрана
        const bg = tg.themeParams?.bg_color || '#ffffff';
        document.body.style.background = bg;
        document.documentElement.style.background = bg;

        // BackButton
        if (tg.BackButton) {
            tg.BackButton.show();
            tg.BackButton.onClick(() => navigateTo('profile'));
        }

        return () => {
            tg.BackButton?.hide();
        };
    }, [tg, navigateTo]);

    /* =======================
       DATA
    ======================= */
    const categories = [
        { id: 'all', name: 'Все', icon: '📚' },
        { id: 'exchange', name: 'Обмен', icon: '💱' },
        { id: 'rules', name: 'Правила', icon: '📋' },
        { id: 'security', name: 'Безопасность', icon: '🔐' },
        { id: 'referral', name: 'Рефералы', icon: '👥' },
        { id: 'support', name: 'Поддержка', icon: '💬' }
    ];

    const faqItems = [
        {
            id: 'faq-1',
            category: 'exchange',
            question: 'Как происходит обмен?',
            answer:
                '1. Выберите направление обмена\n' +
                '2. Введите сумму\n' +
                '3. Подтвердите заявку\n' +
                '4. Следуйте инструкциям оператора'
        },
        {
            id: 'faq-2',
            category: 'exchange',
            question: 'Сколько времени занимает обмен?',
            answer:
                '• Покупка USDT: 5–15 минут\n' +
                '• Продажа USDT: 15–30 минут'
        },
        {
            id: 'faq-3',
            category: 'security',
            question: 'Как обезопасить себя?',
            answer:
                '• Никому не передавайте данные\n' +
                '• Проверяйте адреса\n' +
                '• Общайтесь только через официальный чат'
        }
    ];

    const rulesContent = [
        {
            id: 'rule-1',
            title: 'Общие положения',
            content:
                '1. Все операции легальны\n' +
                '2. Администрация может отказать в обслуживании'
        },
        {
            id: 'rule-2',
            title: 'Обмены',
            content:
                '1. Курс фиксируется при создании заявки\n' +
                '2. Время выполнения до 30 минут'
        }
    ];

    /* =======================
       FILTER FAQ
    ======================= */
    useEffect(() => {
        if (selectedCategory === 'all') {
            setFilteredFaqItems(faqItems);
        } else {
            setFilteredFaqItems(
                faqItems.filter(f => f.category === selectedCategory)
            );
        }
    }, [selectedCategory]);

    /* =======================
       SEARCH
    ======================= */
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        const q = searchQuery.toLowerCase();
        const results = [];

        faqItems.forEach(item => {
            if (
                item.question.toLowerCase().includes(q) ||
                item.answer.toLowerCase().includes(q)
            ) {
                results.push({
                    id: item.id,
                    title: item.question,
                    content: item.answer,
                    section: 'faq'
                });
            }
        });

        rulesContent.forEach(item => {
            if (
                item.title.toLowerCase().includes(q) ||
                item.content.toLowerCase().includes(q)
            ) {
                results.push({
                    id: item.id,
                    title: item.title,
                    content: item.content,
                    section: 'rules'
                });
            }
        });

        setSearchResults(results);
        setShowSearchResults(true);
    }, [searchQuery]);

    /* =======================
       HANDLERS
    ======================= */
    const toggleFaq = id => {
        setExpandedFaqs(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleSection = section => {
        setActiveSection(prev => (prev === section ? null : section));
    };

    const handleResultClick = r => {
        setActiveSection(r.section);
        setSearchQuery('');
        setShowSearchResults(false);

        setTimeout(() => {
            document.getElementById(r.id)?.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }, 150);
    };

    /* =======================
       RENDER
    ======================= */
    return (
        <div className="tg-help">

            {/* HEADER */}
            <div className="tg-help-header">
                <h1>Помощь</h1>
                <p>Ответы на частые вопросы</p>
            </div>

            {/* SEARCH */}
            <div className="tg-search">
                <span>🔍</span>
                <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Спросите у кролика…"
                />
            </div>

            {showSearchResults && (
                <div className="tg-search-results">
                    {searchResults.map((r, i) => (
                        <div
                            key={i}
                            className="tg-search-item"
                            onClick={() => handleResultClick(r)}
                        >
                            <div className="title">{r.title}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* CATEGORIES */}
            {!searchQuery && (
                <div className="tg-categories">
                    {categories.map(c => (
                        <button
                            key={c.id}
                            className={selectedCategory === c.id ? 'active' : ''}
                            onClick={() => {
                                setSelectedCategory(c.id);
                                setActiveSection('faq');
                            }}
                        >
                            {c.icon} {c.name}
                        </button>
                    ))}
                </div>
            )}

            {/* FAQ */}
            <div className="tg-section">
                <div className="tg-section-header" onClick={() => toggleSection('faq')}>
                    <h3>FAQ</h3>
                    <span>{activeSection === 'faq' ? '−' : '+'}</span>
                </div>

                <div className={`tg-section-body ${activeSection === 'faq' ? 'open' : ''}`}>
                    {filteredFaqItems.map(item => (
                        <div key={item.id} id={item.id} className="tg-faq">
                            <button
                                className="tg-faq-q"
                                onClick={() => toggleFaq(item.id)}
                            >
                                {item.question}
                                <span className={expandedFaqs[item.id] ? 'rot' : ''}>▼</span>
                            </button>

                            <div className={`tg-faq-a ${expandedFaqs[item.id] ? 'open' : ''}`}>
                                {item.answer.split('\n').map((l, i) => (
                                    <div key={i}>{l}</div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RULES */}
            <div className="tg-section">
                <div className="tg-section-header" onClick={() => toggleSection('rules')}>
                    <h3>Правила</h3>
                    <span>{activeSection === 'rules' ? '−' : '+'}</span>
                </div>

                <div className={`tg-section-body ${activeSection === 'rules' ? 'open' : ''}`}>
                    {rulesContent.map(rule => (
                        <div key={rule.id} id={rule.id} className="tg-rule">
                            <h4>{rule.title}</h4>
                            {rule.content.split('\n').map((l, i) => (
                                <div key={i}>{l}</div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}

export default Help;
