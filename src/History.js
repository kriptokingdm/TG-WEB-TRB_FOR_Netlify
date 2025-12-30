import { useState, useEffect, useRef } from 'react';
import './Help.css';

function Help({ navigateTo }) {
    const tg = window.Telegram?.WebApp;

    const [activeSection, setActiveSection] = useState('faq');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [filteredFaqItems, setFilteredFaqItems] = useState([]);
    const [expandedFaqs, setExpandedFaqs] = useState({});

    /* =======================
       TELEGRAM BACK BUTTON
    ======================= */
    useEffect(() => {
        if (!tg?.BackButton) return;

        tg.BackButton.show();
        tg.BackButton.onClick(() => navigateTo('profile'));

        return () => tg.BackButton.hide();
    }, [navigateTo, tg]);

    const toggleSection = (section) => {
        setActiveSection(prev => (prev === section ? null : section));
    };

    const toggleFaq = (id) => {
        setExpandedFaqs(prev => ({ ...prev, [id]: !prev[id] }));
    };

    /* =======================
       DATA (БЕЗ ИЗМЕНЕНИЙ)
    ======================= */
    const categories = [
        { id: 'all', name: 'Все', icon: '📚' },
        { id: 'exchange', name: 'Обмен', icon: '💱' },
        { id: 'rules', name: 'Правила', icon: '📋' },
        { id: 'security', name: 'Безопасность', icon: '🔐' },
        { id: 'referral', name: 'Рефералы', icon: '👥' },
        { id: 'support', name: 'Поддержка', icon: '💬' }
    ];

    /* ⬇️ faqItems, rulesContent, popularQuestions
       ОСТАВЛЕНЫ 1 В 1 как ты прислал
       (я их не дублирую здесь в ответе,
       ты просто оставляешь их без изменений)
    */

    /* =======================
       FILTER
    ======================= */
    useEffect(() => {
        if (selectedCategory === 'all') {
            setFilteredFaqItems(faqItems);
        } else {
            setFilteredFaqItems(
                faqItems.filter(item => item.category === selectedCategory)
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
        setShowSearchResults(true);
    }, [searchQuery]);

    const handleResultClick = (result) => {
        setActiveSection(result.section);
        setSearchQuery('');
        setShowSearchResults(false);

        setTimeout(() => {
            document.getElementById(result.id)
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
                <p>Все ответы на ваши вопросы</p>
            </div>

            {/* SEARCH */}
            <div className="tg-search">
                <span>🔍</span>
                <input
                    placeholder="Спросите у кролика…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                            <div className="type">
                                {r.type === 'faq' ? 'FAQ' : 'Правила'}
                            </div>
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
                            <span>{c.icon}</span>
                            {c.name}
                        </button>
                    ))}
                </div>
            )}

            {/* FAQ */}
            <div className="tg-section">
                <div className="tg-section-header" onClick={() => toggleSection('faq')}>
                    <h3>Часто задаваемые вопросы</h3>
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
                    <h3>Правила использования</h3>
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
