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

    /* ===============================
       TELEGRAM BACK BUTTON
    =============================== */
    useEffect(() => {
        if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.BackButton.show();
            tg.BackButton.onClick(() => navigateTo('home'));
            
            return () => {
                tg.BackButton.hide();
                tg.BackButton.offClick();
            };
        }
    }, [navigateTo]);

    /* ===============================
       FAQ DATA
    =============================== */
    const faqItems = [
        {
            id: 'faq-0',
            category: 'exchange',
            question: "Как происходит обмен?",
            answer: "1. Выберите направление обмена (покупка/продажа USDT)\n2. Введите сумму обмена\n3. Выберите способ оплаты/получения\n4. Подтвердите операцию\n5. Следуйте инструкциям оператора"
        },
        {
            id: 'faq-1',
            category: 'exchange',
            question: "Сколько времени занимает обмен?",
            answer: "Среднее время обмена:\n• Покупка USDT: 5-15 минут\n• Продажа USDT: 15-30 минут"
        },
        {
            id: 'faq-2',
            category: 'exchange',
            question: "Какие есть лимиты на обмен?",
            answer: "Лимиты на обмен:\n• Минимальная сумма: 10 USDT или 1,000 RUB\n• Максимальная сумма: 10,000 USDT или 1,000,000 RUB"
        },
        {
            id: 'faq-3',
            category: 'exchange',
            question: "Почему курс отличается от биржевого?",
            answer: "Наш курс включает:\n1. Комиссию за обслуживание\n2. Гарантию конвертации\n3. Защиту от колебаний"
        },
        {
            id: 'faq-4',
            category: 'exchange',
            question: "Что делать, если операция зависла?",
            answer: "Если операция не завершилась:\n1. Сохраните ID операции\n2. Обратитесь в поддержку через чат\n3. Укажите ID операции и сумму"
        },
        {
            id: 'faq-5',
            category: 'referral',
            question: "Как устроена реферальная система?",
            answer: "Реферальная система:\n1. Приглашайте друзей по вашей ссылке\n2. Получайте 0.5% от суммы сделки\n3. Минимальный вывод: 10$"
        },
        {
            id: 'faq-6',
            category: 'security',
            question: "Это безопасно?",
            answer: "Да! Мы не храним приватные ключи. Все транзакции защищены."
        }
    ];

    const rulesContent = [
        {
            id: 'rule-1',
            title: "Общие положения",
            content: "1. TetherRabbit предоставляет услуги обмена\n2. Пользователь обязан соблюдать законы\n3. Все операции проверяются"
        },
        {
            id: 'rule-2',
            title: "Порядок проведения обменов",
            content: "1. Заявка создается на точную сумму\n2. Резерв средств на 30 минут\n3. Оплата в течение 15 минут"
        },
        {
            id: 'rule-3',
            title: "Лимиты и ограничения",
            content: "1. Минимальная сумма: 1,000 RUB / 10 USDT\n2. Максимальная сумма: 1,000,000 RUB"
        }
    ];

    const categories = [
        { id: 'all', name: 'Все', icon: '📚' },
        { id: 'exchange', name: 'Обмен', icon: '💱' },
        { id: 'rules', name: 'Правила', icon: '📋' },
        { id: 'security', name: 'Безопасность', icon: '🔐' },
        { id: 'referral', name: 'Рефералы', icon: '👥' },
        { id: 'support', name: 'Поддержка', icon: '💬' }
    ];

    /* ===============================
       FILTERS / SEARCH
    =============================== */
    useEffect(() => {
        setFilteredFaqItems(
            selectedCategory === 'all'
                ? faqItems
                : faqItems.filter(item => item.category === selectedCategory)
        );
    }, [selectedCategory]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        const q = searchQuery.toLowerCase();
        const results = [];

        faqItems.forEach(item => {
            if (item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)) {
                results.push({ ...item, type: 'faq', section: 'faq' });
            }
        });

        rulesContent.forEach(item => {
            if (item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q)) {
                results.push({ ...item, type: 'rules', section: 'rules' });
            }
        });

        setSearchResults(results);
        setShowSearchResults(results.length > 0);
    }, [searchQuery]);

    /* ===============================
       HANDLERS
    =============================== */
    const toggleSection = (section) => {
        setActiveSection(activeSection === section ? null : section);
    };

    const toggleFaq = (faqId) => {
        setExpandedFaqs(prev => ({
            ...prev,
            [faqId]: !prev[faqId]
        }));
    };

    const handleResultClick = (result) => {
        setActiveSection(result.section);
        setSearchQuery('');
        setShowSearchResults(false);
    };

    const handleCategoryClick = (id) => {
        setSelectedCategory(id);
        setActiveSection('faq');
    };

    const handleContactSupport = () => {
        window.open('https://t.me/TetherRabbit_Chat', '_blank');
    };

    const handleOpenChannel = () => {
        window.open('https://t.me/TetherRabbit', '_blank');
    };

    /* ===============================
       RENDER - TELEGRAM UI
    =============================== */
    return (
        <div className="telegram-help">
            {/* Telegram Header */}
            <div className="tg-header">
                <button className="tg-back-btn" onClick={() => navigateTo('home')}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M15.5 19L8.5 12L15.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                <h1 className="tg-header-title">Помощь</h1>
            </div>

            {/* Search Bar - Telegram Style */}
            <div className="tg-search-container">
                <div className="tg-search-input">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="#8E8E93" strokeWidth="1.5"/>
                        <path d="M14 14L11.1 11.1" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <input
                        type="text"
                        placeholder="Поиск"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="tg-search"
                    />
                </div>
            </div>

            {/* Categories - Telegram Chips */}
            <div className="tg-categories">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        className={`tg-chip ${selectedCategory === cat.id ? 'active' : ''}`}
                        onClick={() => handleCategoryClick(cat.id)}
                    >
                        <span className="tg-chip-icon">{cat.icon}</span>
                        <span className="tg-chip-text">{cat.name}</span>
                    </button>
                ))}
            </div>

            {/* Search Results */}
            {showSearchResults && (
                <div className="tg-search-results">
                    {searchResults.map((result, index) => (
                        <div
                            key={index}
                            className="tg-search-item"
                            onClick={() => handleResultClick(result)}
                        >
                            <div className="tg-search-item-title">{result.question || result.title}</div>
                            <div className="tg-search-item-type">
                                {result.type === 'faq' ? 'FAQ' : 'Правила'}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Content - Telegram List Style */}
            <div className="tg-content">
                {/* FAQ Section */}
                <div className="tg-section">
                    <div className="tg-section-header" onClick={() => toggleSection('faq')}>
                        <div className="tg-section-title">
                            <span className="tg-section-icon">❓</span>
                            <span>Часто задаваемые вопросы</span>
                        </div>
                        <svg 
                            width="16" 
                            height="16" 
                            viewBox="0 0 16 16" 
                            fill="none"
                            className={activeSection === 'faq' ? 'rotated' : ''}
                            style={{ transition: 'transform 0.2s' }}
                        >
                            <path d="M4 6L8 10L12 6" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    
                    {activeSection === 'faq' && (
                        <div className="tg-list">
                            {filteredFaqItems.map(item => (
                                <div key={item.id} className="tg-list-item">
                                    <div 
                                        className="tg-list-item-header"
                                        onClick={() => toggleFaq(item.id)}
                                    >
                                        <div className="tg-list-item-title">{item.question}</div>
                                        <svg 
                                            width="16" 
                                            height="16" 
                                            viewBox="0 0 16 16" 
                                            fill="none"
                                            className={expandedFaqs[item.id] ? 'rotated' : ''}
                                        >
                                            <path d="M4 6L8 10L12 6" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    
                                    {expandedFaqs[item.id] && (
                                        <div className="tg-list-item-content">
                                            {item.answer.split('\n').map((line, idx) => (
                                                <div key={idx} className="tg-text">{line}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Rules Section */}
                <div className="tg-section">
                    <div className="tg-section-header" onClick={() => toggleSection('rules')}>
                        <div className="tg-section-title">
                            <span className="tg-section-icon">📋</span>
                            <span>Правила использования</span>
                        </div>
                        <svg 
                            width="16" 
                            height="16" 
                            viewBox="0 0 16 16" 
                            fill="none"
                            className={activeSection === 'rules' ? 'rotated' : ''}
                            style={{ transition: 'transform 0.2s' }}
                        >
                            <path d="M4 6L8 10L12 6" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    
                    {activeSection === 'rules' && (
                        <div className="tg-list">
                            {rulesContent.map(rule => (
                                <div key={rule.id} className="tg-rule-item">
                                    <div className="tg-rule-title">{rule.title}</div>
                                    <div className="tg-rule-content">
                                        {rule.content.split('\n').map((line, idx) => (
                                            <div key={idx} className="tg-text">{line}</div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Support Section */}
                <div className="tg-support">
                    <div className="tg-support-header">
                        <span className="tg-support-icon">💬</span>
                        <div className="tg-support-text">
                            <div className="tg-support-title">Нужна помощь?</div>
                            <div className="tg-support-subtitle">Наша поддержка всегда на связи</div>
                        </div>
                    </div>
                    
                    <div className="tg-support-buttons">
                        <button 
                            className="tg-button primary"
                            onClick={handleContactSupport}
                        >
                            Чат поддержки
                        </button>
                        <button 
                            className="tg-button secondary"
                            onClick={handleOpenChannel}
                        >
                            Наш канал
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Help;