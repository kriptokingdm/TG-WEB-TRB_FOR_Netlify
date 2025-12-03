import { useState } from 'react';
import './Help.css';

function Help({ navigateTo }) {
    const [activeSection, setActiveSection] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);

    const toggleSection = (section) => {
        setActiveSection(activeSection === section ? null : section);
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        
        if (query.trim() === '') {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const results = [];

        // Поиск по FAQ
        faqItems.forEach((item, index) => {
            if (item.question.toLowerCase().includes(lowerQuery) || 
                item.answer.toLowerCase().includes(lowerQuery)) {
                results.push({
                    type: 'faq',
                    title: item.question,
                    content: item.answer,
                    section: 'faq',
                    index
                });
            }
        });

        setSearchResults(results);
        setShowSearchResults(results.length > 0);
    };

    const handleResultClick = (result) => {
        setActiveSection(result.section);
        setSearchQuery('');
        setShowSearchResults(false);
        
        setTimeout(() => {
            const element = document.getElementById(`${result.section}-${result.index}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    const popularQuestions = [
        "Как купить USDT?",
        "Сколько времени занимает обмен?",
        "Какие есть лимиты?",
        "Курс обмена",
        "Поддержка",
        "Правила безопасности",
        "Как отменить заявку?",
        "Верификация аккаунта"
    ];

    const faqItems = [
        {
            id: 'faq-0',
            question: "Как происходит обмен?",
            answer: "Выберите направление обмена, введите сумму, выберите способ оплаты и нажмите кнопку 'Обмен'. Следуйте инструкциям для завершения операции."
        },
        {
            id: 'faq-1',
            question: "Сколько времени занимает обмен?",
            answer: "Обычно обмен занимает от 5 до 15 минут. Время зависит от загрузки сети и скорости обработки платежа банком."
        },
        {
            id: 'faq-2',
            question: "Какие есть лимиты?",
            answer: "Минимальная сумма: 5 USDT или 500 RUB. Максимальная сумма : 10 000 USDT или 1 000 000 RUB"
        },
        {
            id: 'faq-3',
            question: "Почему курс отличается от биржевого?",
            answer: "Наш курс включает комиссию за обслуживание и обеспечивает мгновенную конвертацию без риска колебаний рынка."
        },
        {
            id: 'faq-4',
            question: "Что делать, если операция зависла?",
            answer: "Если операция не завершилась в течение 1 часа, свяжитесь с поддержкой и предоставьте ID операции."
        },
        {
            id: 'faq-5',
            question: "Какой курс обмена?",
            answer: "Курс рассчитывается на основе биржевых данных с учетом нашей комиссии. Точный курс вы увидите перед подтверждением операции."
        }
    ];

    return (
        <div className="help-container">
            {/* Header */}
            <div className="help-header">
                <div className="header-top">
                    <h1 className="header-title">Помощь и поддержка</h1>
                </div>

                <div className="search-container-wrapper">
                    <div className="assistant-search">
                        <div className="search-box">
                            <div className="search-icon">🔍</div>
                            <input
                                type="text"
                                placeholder="Спросите у кролика..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="search-input"
                            />
                            {searchQuery && (
                                <button 
                                    className="clear-search"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setShowSearchResults(false);
                                    }}
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {showSearchResults && (
                            <div className="search-results">
                                <div className="results-header">
                                    <span>Найдено ответов: {searchResults.length}</span>
                                </div>
                                {searchResults.map((result, index) => (
                                    <div
                                        key={index}
                                        className="search-result-item"
                                        onClick={() => handleResultClick(result)}
                                    >
                                        <div className="result-type">❓</div>
                                        <div className="result-content">
                                            <div className="result-title">{result.title}</div>
                                            <div className="result-preview">{result.content}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!searchQuery && (
                            <div className="popular-questions">
                                <h3>Популярные вопросы</h3>
                                <div className="questions-grid">
                                    {popularQuestions.map((question, index) => (
                                        <div
                                            key={index}
                                            className="question-chip"
                                            onClick={() => handleSearch(question)}
                                        >
                                            {question}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content - только FAQ */}
            <div className="help-content">
                {/* FAQ Section */}
                <div className={`help-section ${activeSection === 'faq' ? 'active' : ''}`}>
                    <div className="section-header" onClick={() => toggleSection('faq')}>
                        <div className="section-title">
                            <span className="section-icon">❓</span>
                            <h3>Часто задаваемые вопросы</h3>
                        </div>
                        <span className="toggle-icon">{activeSection === 'faq' ? '−' : '+'}</span>
                    </div>
                    
                    <div className={`section-content ${activeSection === 'faq' ? 'expanded' : ''}`}>
                        <div className="faq-grid">
                            {faqItems.map((item, index) => (
                                <div key={index} id={`faq-${index}`} className="faq-card">
                                    <div className="faq-question">
                                        <div className="question-icon">Q</div>
                                        <div className="question-text">{item.question}</div>
                                    </div>
                                    <div className="faq-answer">
                                        <div className="answer-icon">A</div>
                                        <div className="answer-text">{item.answer}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="bottom-nav">
                <button className="nav-item" onClick={() => navigateTo('/')}>
                    <span className="nav-icon">💸</span>
                    <span className="nav-label">Обмен</span>
                </button>
                <button className="nav-item" onClick={() => navigateTo('/profile')}>
                    <span className="nav-icon">👤</span>
                    <span className="nav-label">Профиль</span>
                </button>
                <button className="nav-item" onClick={() => navigateTo('/history')}>
                    <span className="nav-icon">📊</span>
                    <span className="nav-label">История</span>
                </button>
                <button className="nav-item active">
                    <span className="nav-icon">❓</span>
                    <span className="nav-label">Помощь</span>
                </button>
            </div>
        </div>
    );
}

export default Help;