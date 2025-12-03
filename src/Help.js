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

        // Поиск по правилам
        rules.forEach((rule, index) => {
            if (rule.title.toLowerCase().includes(lowerQuery) || 
                rule.description.toLowerCase().includes(lowerQuery)) {
                results.push({
                    type: 'rule',
                    title: rule.title,
                    content: rule.description,
                    section: 'rules',
                    index
                });
            }
        });

        // Поиск по контактам
        contacts.forEach((contact, index) => {
            if (contact.type.toLowerCase().includes(lowerQuery) || 
                contact.value.toLowerCase().includes(lowerQuery)) {
                results.push({
                    type: 'contact',
                    title: contact.type,
                    content: contact.value,
                    section: 'contacts',
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
            answer: "Минимальная сумма: 10 USDT или 1 000 RUB. Максимальная сумма : 10 000 USDT или 1 000 000 RUB"
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

    const rules = [
        {
            title: "✅ Верификация аккаунта",
            description: "Для совершения операций требуется верификация аккаунта на площадке"
        },
        {
            title: "⚡ Время выполнения операций",
            description: "Стандартное время обработки заявки - 5-30 минут."
        },
        {
            title: "💰 Лимиты операций",
            description: "Минимальная сумма обмена: 1000 RUB / 10 USDT. Максимальная сумма для новых пользователей: 100,000 RUB."
        },
        {
            title: "🔐 Безопасность операций",
            description: "Запрещены операции с целью отмывания денег, финансирования терроризма и других незаконных деяний."
        },
        {
            title: "📝 Требования к платежам",
            description: "Платежи должны осуществляться только с банковских счетов, принадлежащих владельцу аккаунта."
        },
        {
            title: "⏰ Авто-отмена заявок",
            description: "Неоплаченные заявки автоматически отменяются через 15 минут."
        },
        {
            title: "🔄 Возвраты и отмены",
            description: "Отмена операции возможна только до момента подтверждения платежа."
        },
        {
            title: "📊 Курс обмена",
            description: "Курс фиксируется на момент создания заявки."
        },
        {
            title: "🚫 Запрещенные операции",
            description: "Запрещены попытки обмана, использование чужих платежных средств."
        },
        {
            title: "🎯 Ответственность пользователя",
            description: "Пользователь несет ответственность за правильность введенных реквизитов."
        }
    ];

    const contacts = [
        { type: "Telegram", value: "@tetherbot_support", link: "https://t.me/tetherbot_support" },
        { type: "Email", value: "support@tetherbot.com", link: "mailto:support@tetherbot.com" },
        { type: "Время работы", value: "круглосуточно" }
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
                                        <div className="result-type">
                                            {result.type === 'faq' ? '❓' : result.type === 'rule' ? '📋' : '📞'}
                                        </div>
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

            {/* Main Content */}
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
                    {activeSection === 'faq' && (
                        <div className="section-content">
                            <div className="faq-grid">
                                {faqItems.map((item, index) => (
                                    <div key={index} id={item.id} className="faq-card">
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
                    )}
                </div>

                {/* Rules Section */}
                <div className={`help-section ${activeSection === 'rules' ? 'active' : ''}`}>
                    <div className="section-header" onClick={() => toggleSection('rules')}>
                        <div className="section-title">
                            <span className="section-icon">⚖️</span>
                            <h3>Правила использования</h3>
                        </div>
                        <span className="toggle-icon">{activeSection === 'rules' ? '−' : '+'}</span>
                    </div>
                    {activeSection === 'rules' && (
                        <div className="section-content">
                            <div className="rules-grid">
                                {rules.map((rule, index) => (
                                    <div key={index} id={`rules-${index}`} className="rule-card">
                                        <div className="rule-icon">📌</div>
                                        <div className="rule-content">
                                            <h4 className="rule-title">{rule.title}</h4>
                                            <p className="rule-description">{rule.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="important-note">
                                <div className="note-icon">⚠️</div>
                                <div className="note-text">
                                    <strong>Важно:</strong> Нарушение правил может привести к блокировке аккаунта и заморозке средств.
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Contacts Section */}
                <div className={`help-section ${activeSection === 'contacts' ? 'active' : ''}`}>
                    <div className="section-header" onClick={() => toggleSection('contacts')}>
                        <div className="section-title">
                            <span className="section-icon">📞</span>
                            <h3>Контакты поддержки</h3>
                        </div>
                        <span className="toggle-icon">{activeSection === 'contacts' ? '−' : '+'}</span>
                    </div>
                    {activeSection === 'contacts' && (
                        <div className="section-content">
                            <div className="contacts-grid">
                                {contacts.map((contact, index) => (
                                    <div key={index} id={`contacts-${index}`} className="contact-card">
                                        <div className="contact-icon">
                                            {contact.type === 'Telegram' ? '📱' : 
                                             contact.type === 'Email' ? '📧' : '⏰'}
                                        </div>
                                        <div className="contact-content">
                                            <div className="contact-type">{contact.type}</div>
                                            {contact.link ? (
                                                <a 
                                                    href={contact.link} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="contact-value"
                                                >
                                                    {contact.value}
                                                </a>
                                            ) : (
                                                <div className="contact-value">{contact.value}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="response-time">
                                <span className="time-icon">⏱️</span>
                                <span className="time-text">Среднее время ответа: ~10 минут</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Guide Section */}
                <div className={`help-section ${activeSection === 'guide' ? 'active' : ''}`}>
                    <div className="section-header" onClick={() => toggleSection('guide')}>
                        <div className="section-title">
                            <span className="section-icon">🎯</span>
                            <h3>Как пользоваться обменником</h3>
                        </div>
                        <span className="toggle-icon">{activeSection === 'guide' ? '−' : '+'}</span>
                    </div>
                    {activeSection === 'guide' && (
                        <div className="section-content">
                            <div className="guide-steps">
                                <div className="guide-step">
                                    <div className="step-number">1</div>
                                    <div className="step-content">
                                        <h4>Выберите направление</h4>
                                        <p>Нажмите "Покупка" или "Продажа" USDT</p>
                                    </div>
                                </div>
                                <div className="guide-step">
                                    <div className="step-number">2</div>
                                    <div className="step-content">
                                        <h4>Введите сумму</h4>
                                        <p>Укажите сумму для обмена в соответствующем поле</p>
                                    </div>
                                </div>
                                <div className="guide-step">
                                    <div className="step-number">3</div>
                                    <div className="step-content">
                                        <h4>Выберите способ оплаты</h4>
                                        <p>Выберите подходящий банк/сеть для перевода</p>
                                    </div>
                                </div>
                                <div className="guide-step">
                                    <div className="step-number">4</div>
                                    <div className="step-content">
                                        <h4>Подтвердите операцию</h4>
                                        <p>Нажмите кнопку обмена и следуйте инструкциям оператора</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Security Notice */}
                <div className="security-card">
                    <div className="security-icon">🛡️</div>
                    <div className="security-content">
                        <h4>Безопасность прежде всего</h4>
                        <p>Никогда не сообщайте свои пароли и приватные ключи третьим лицам. Существует только один аккаунт для оффициального обращения @tetherrabbit_support.</p>
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