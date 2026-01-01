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

    /* ===========================
       TELEGRAM BACK BUTTON
    ============================ */
    useEffect(() => {
        if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;

            tg.BackButton.show();
            tg.BackButton.onClick(() => {
                navigateTo('profile');
            });

            return () => {
                tg.BackButton.hide();
                tg.BackButton.offClick();
            };
        }
    }, [navigateTo]);

    const toggleSection = (section) => {
        setActiveSection(activeSection === section ? null : section);
    };

    const toggleFaq = (faqId) => {
        setExpandedFaqs(prev => ({
            ...prev,
            [faqId]: !prev[faqId]
        }));
    };

    const categories = [
        { id: 'all', name: 'Все', icon: '📚' },
        { id: 'exchange', name: 'Обмен', icon: '💱' },
        { id: 'rules', name: 'Правила', icon: '📋' },
        { id: 'security', name: 'Безопасность', icon: '🔐' },
        { id: 'referral', name: 'Рефералы', icon: '👥' },
        { id: 'support', name: 'Поддержка', icon: '💬' }
    ];

    /* === ДАННЫЕ FAQ / RULES — БЕЗ ИЗМЕНЕНИЙ === */
    // (я их не трогал вообще)
    // ↓↓↓ ТВОЙ КОД ↓↓↓

    const faqItems = [ /* … ТВОЙ МАССИВ БЕЗ ИЗМЕНЕНИЙ … */ ];
    const rulesContent = [ /* … ТВОЙ МАССИВ БЕЗ ИЗМЕНЕНИЙ … */ ];
    const popularQuestions = [
        "Как купить USDT?",
        "Как продать USDT?",
        "Сколько времени обмен?",
        "Какие лимиты?",
        "Как работает реферальная система?",
        "Как обратиться в поддержку?"
    ];

    /* ===========================
       ФИЛЬТРАЦИЯ / ПОИСК
    ============================ */
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
            if (
                item.question.toLowerCase().includes(q) ||
                item.answer.toLowerCase().includes(q)
            ) {
                results.push({
                    type: 'faq',
                    title: item.question,
                    content: item.answer,
                    section: 'faq',
                    id: item.id,
                    category: item.category
                });
            }
        });

        rulesContent.forEach(item => {
            if (
                item.title.toLowerCase().includes(q) ||
                item.content.toLowerCase().includes(q)
            ) {
                results.push({
                    type: 'rules',
                    title: item.title,
                    content: item.content,
                    section: 'rules',
                    id: item.id
                });
            }
        });

        setSearchResults(results);
        setShowSearchResults(results.length > 0);
    }, [searchQuery]);

    const handleResultClick = (result) => {
        setActiveSection(result.section);
        setSearchQuery('');
        setShowSearchResults(false);

        setTimeout(() => {
            const el = document.getElementById(result.id);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('highlight-result');
                setTimeout(() => el.classList.remove('highlight-result'), 2000);
            }
        }, 100);
    };

    const handleContactSupport = () => {
        window.Telegram?.WebApp?.openTelegramLink('https://t.me/TetherRabbit_Chat');
    };

    const handleOpenChannel = () => {
        window.Telegram?.WebApp?.openTelegramLink('https://t.me/TetherRabbit');
    };

    /* ===========================
       RENDER
    ============================ */
    return (
        <div className="help-container-new">
            <div className="help-header-new">
                <h1 className="header-title-new">Помощь</h1>
                <p className="header-subtitle">Все ответы на ваши вопросы</p>

                <div className="search-container-new">
                    <span className="search-icon-new">🔍</span>
                    <input
                        className="search-input-new"
                        placeholder="Спросите у кролика…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {showSearchResults && (
                    <div className="search-results-new">
                        {searchResults.map((res, i) => (
                            <div
                                key={i}
                                className="search-result-item-new"
                                onClick={() => handleResultClick(res)}
                            >
                                <div className="result-title-new">{res.title}</div>
                                <div className="result-preview-new">
                                    {res.content.slice(0, 80)}…
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="help-content-new">
                {/* FAQ */}
                <div className="help-section-new active">
                    <div className="section-header-new" onClick={() => toggleSection('faq')}>
                        <h3>❓ Часто задаваемые вопросы</h3>
                    </div>

                    <div className="faq-list-new">
                        {filteredFaqItems.map(item => (
                            <div key={item.id} id={item.id} className="faq-item-new">
                                <button
                                    className="faq-question-new"
                                    onClick={() => toggleFaq(item.id)}
                                >
                                    {item.question}
                                </button>

                                {expandedFaqs[item.id] && (
                                    <div className="faq-answer-new">
                                        {item.answer.split('\n').map((l, i) => (
                                            <div key={i}>{l}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* SUPPORT */}
                <div className="support-section-new">
                    <button className="support-btn-new primary" onClick={handleContactSupport}>
                        💬 Чат поддержки
                    </button>
                    <button className="support-btn-new secondary" onClick={handleOpenChannel}>
                        📢 Официальный канал
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Help;
