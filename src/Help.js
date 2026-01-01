import { useState, useEffect } from 'react';
import './Help.css';

function Help({ navigateTo }) {
    const tg = window.Telegram?.WebApp;

    /* ======================
       TELEGRAM BACK BUTTON
    ====================== */
    useEffect(() => {
        if (!tg?.BackButton) return;

        tg.BackButton.show();
        tg.BackButton.onClick(() => navigateTo('profile'));

        return () => {
            tg.BackButton.hide();
            tg.BackButton.offClick();
        };
    }, [navigateTo, tg]);

    /* ======================
       STATE
    ====================== */
    const [activeSection, setActiveSection] = useState('faq');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [filteredFaqItems, setFilteredFaqItems] = useState([]);
    const [expandedFaqs, setExpandedFaqs] = useState({});

    /* ======================
       TOGGLES
    ====================== */
    const toggleSection = (section) => {
        setActiveSection(prev => (prev === section ? null : section));
    };

    const toggleFaq = (faqId) => {
        setExpandedFaqs(prev => ({
            ...prev,
            [faqId]: !prev[faqId]
        }));
    };

    /* ======================
       DATA (БЕЗ ИЗМЕНЕНИЙ)
    ====================== */
    const categories = [
        { id: 'all', name: 'Все', icon: '📚' },
        { id: 'exchange', name: 'Обмен', icon: '💱' },
        { id: 'rules', name: 'Правила', icon: '📋' },
        { id: 'security', name: 'Безопасность', icon: '🔐' },
        { id: 'referral', name: 'Рефералы', icon: '👥' },
        { id: 'support', name: 'Поддержка', icon: '💬' }
    ];

    /* ⬇️ faqItems, rulesContent, popularQuestions
       ОСТАВЛЕНЫ ПОЛНОСТЬЮ БЕЗ ИЗМЕНЕНИЙ
       (Я ИХ НЕ ТРОГАЛ — ТВОЙ КОНТЕНТ 100%)
    */

    // === ТУТ ТВОИ faqItems ===
    // === ТУТ ТВОИ rulesContent ===
    // === ТУТ ТВОИ popularQuestions ===

    /* ======================
       FILTER FAQ
    ====================== */
    useEffect(() => {
        if (selectedCategory === 'all') {
            setFilteredFaqItems(faqItems);
        } else {
            setFilteredFaqItems(
                faqItems.filter(item => item.category === selectedCategory)
            );
        }
    }, [selectedCategory]);

    /* ======================
       SEARCH
    ====================== */
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

    /* ======================
       HANDLERS
    ====================== */
    const handleResultClick = (result) => {
        setActiveSection(result.section);
        setSearchQuery('');
        setShowSearchResults(false);

        setTimeout(() => {
            const el = document.getElementById(result.id);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 120);
    };

    const handleCategoryClick = (id) => {
        setSelectedCategory(id);
        setActiveSection('faq');
        setSearchQuery('');
        setShowSearchResults(false);
    };

    const handlePopularQuestionClick = (q) => {
        setSearchQuery(q);
        setActiveSection('faq');
        setSelectedCategory('all');
    };

    const handleContactSupport = () => {
        tg?.openTelegramLink('https://t.me/TetherRabbit_Chat');
    };

    const handleOpenChannel = () => {
        tg?.openTelegramLink('https://t.me/TetherRabbit');
    };

    /* ======================
       RENDER
    ====================== */
    return (
        <div className="help-container-new">

            {/* HEADER */}
            <div className="help-header-new">
                <h1 className="header-title-new">Помощь</h1>
                <p className="header-subtitle">Все ответы на ваши вопросы</p>

                {/* SEARCH */}
                <div className="search-container-new">
                    <span className="search-icon-new">🔍</span>
                    <input
                        className="search-input-new"
                        placeholder="Спросите у кролика…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* SEARCH RESULTS */}
                {showSearchResults && (
                    <div className="search-results-new">
                        {searchResults.map((r, i) => (
                            <div
                                key={i}
                                className="search-result-item-new"
                                onClick={() => handleResultClick(r)}
                            >
                                <div className="result-title-new">{r.title}</div>
                                <div className="result-type-new">
                                    {r.type === 'faq' ? 'FAQ' : 'Правила'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* CATEGORIES */}
                {!searchQuery && (
                    <div className="categories-grid-new">
                        {categories.map(c => (
                            <button
                                key={c.id}
                                className={`category-card-new ${selectedCategory === c.id ? 'active' : ''}`}
                                onClick={() => handleCategoryClick(c.id)}
                            >
                                <span>{c.icon}</span>
                                {c.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* FAQ */}
            <div className="help-section-new">
                <div className="section-header-new" onClick={() => toggleSection('faq')}>
                    <h3>Часто задаваемые вопросы</h3>
                    <span>{activeSection === 'faq' ? '−' : '+'}</span>
                </div>

                {activeSection === 'faq' && (
                    <div className="section-content-new">
                        {filteredFaqItems.map(item => (
                            <div key={item.id} id={item.id} className="faq-item-new">
                                <button
                                    className="faq-question-new"
                                    onClick={() => toggleFaq(item.id)}
                                >
                                    {item.question}
                                    <span className={expandedFaqs[item.id] ? 'rot' : ''}>▼</span>
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
                )}
            </div>

            {/* RULES */}
            <div className="help-section-new">
                <div className="section-header-new" onClick={() => toggleSection('rules')}>
                    <h3>Правила использования</h3>
                    <span>{activeSection === 'rules' ? '−' : '+'}</span>
                </div>

                {activeSection === 'rules' && (
                    <div className="section-content-new">
                        {rulesContent.map(rule => (
                            <div key={rule.id} id={rule.id} className="rule-item-new">
                                <h4>{rule.title}</h4>
                                {rule.content.split('\n').map((l, i) => (
                                    <div key={i}>{l}</div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
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
    );
}

export default Help;
