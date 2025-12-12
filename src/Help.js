import { useState, useEffect } from 'react';
import './Help.css';

function Help({ navigateTo }) {
    const [activeSection, setActiveSection] = useState('faq');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [filteredFaqItems, setFilteredFaqItems] = useState([]);

    const toggleSection = (section) => {
        setActiveSection(activeSection === section ? null : section);
    };

    const categories = [
        { id: 'all', name: 'Все темы', icon: '📚' },
        { id: 'exchange', name: 'Обмен', icon: '💱' },
        { id: 'rules', name: 'Правила', icon: '📋' },
        { id: 'security', name: 'Безопасность', icon: '🔐' },
        { id: 'referral', name: 'Рефералы', icon: '👥' },
        { id: 'support', name: 'Поддержка', icon: '💬' }
    ];

    const faqItems = [
        {
            id: 'faq-0',
            category: 'exchange',
            question: "Как происходит обмен?",
            answer: "1. Выберите направление обмена (покупка/продажа USDT)\n2. Введите сумму обмена\n3. Выберите способ оплаты/получения\n4. Подтвердите операцию\n5. Следуйте инструкциям оператора в открывшемся диалоговом окне  для завершения сделки"
        },
        {
            id: 'faq-1',
            category: 'exchange',
            question: "Сколько времени занимает обмен?",
            answer: "Среднее время обмена:\n• Покупка USDT: 5-15 минут\n• Продажа USDT: 15-30 минут\n• Время зависит от загрузки сети, банка и скорости обработки платежа"
        },
        {
            id: 'faq-2',
            category: 'exchange',
            question: "Какие есть лимиты на обмен?",
            answer: "Лимиты на обмен:\n• Минимальная сумма: 10 USDT или 1,000 RUB\n• Максимальная сумма: 10,000 USDT или 1,000,000 RUB\n• Суточный лимит: 50,000 USDT\n• Месячный лимит: 500,000 USDT"
        },
        {
            id: 'faq-3',
            category: 'exchange',
            question: "Почему курс отличается от биржевого?",
            answer: "Наш курс включает:\n1. Комиссию за обслуживание платформы\n2. Гарантию мгновенной конвертации\n3. Защиту от рыночных колебаний\n4. Бесперебойную работу системы\n5. Поддержку 24/7\n6. Сделка напрямую с площадкой без посторонних контрагентов"
        },
        {
            id: 'faq-4',
            category: 'exchange',
            question: "Что делать, если операция зависла?",
            answer: "Если операция не завершилась в течение 30 минут:\n1. Сохраните ID операции\n2. Обратитесь в поддержку через чат\n3. Укажите ID операции и сумму\n4. Приложите скриншот платежа\nОтвет поддержки: в течение 15 минут"
        },
        {
            id: 'faq-5',
            category: 'exchange',
            question: "Как узнать точный курс обмена?",
            answer: "Точный курс вы увидите:\n1. При выборе суммы обмена\n2. Перед подтверждением операции\n3. В заявке на обмен\nКурс фиксируется на момент создания заявки"
        },
        {
            id: 'faq-6',
            category: 'referral',
            question: "Как устроена реферальная система?",

            answer: "Реферальная система:\n1. Приглашайте друзей по вашей ссылке\n2. Реферал регистрируется и делает обмен\n3. Вы получаете 0.5% от суммы его сделки\n4. Выводы Реферам производяться 1 раз в неделю  \n5. Минимальный вывод: 10$"
        },
        {
            id: 'rules-1',
            category: 'rules',
            question: "Основные правила TetherRabbit",
            answer: "1. Все операции должны быть легальными\n2. Запрещены сделки с целью отмывания денег\n3. В случае подозрительных/спортных ситуаций пользователь обязан предоставить нужные подтверждения \n4. Заявки обрабатываются в порядке очереди\n5. Администрация оставляет право отказать в обслуживании заявки при критической необходимости"
        },
        {
            id: 'rules-2',
            category: 'rules',
            question: "Правила проведения обменов",
            answer: "1. Сумма к получению фиксируется при создании заявки\n2. Средства отправляются только после поступления оплаты\n3. Время выполнения: до 30 минут\n4. На момент обмена, средства замораживаються у трейдера проводившего сделку \n5. Отмена заявки возможна в течение 5 минут"
        },
        {
            id: 'rules-3',
            category: 'rules',
            question: "Подтверждение происхождения",
            answer: "Требуется для:\n1. Сумм свыше 500,000 RUB/5000$\n2. Повышения лимитов\n3. Подтверждения личности\n"
        },
        {
            id: 'security-1',
            category: 'security',
            question: "Меры безопасности",
            answer: "1. Не передавайте данные аккаунта третьим лицам\n2. Проверяйте адреса кошельков\n3. Сохраняйте квитанции об оплате\n4. При возникновении сложностей обращение происходит только через официальный чат поддержки"
        },
        {
            id: 'security-2',
            category: 'security',
            question: "Защита от мошенничества",
            answer: "1. Официальный бот: @TetherRabbitBot\n2. Официальный канал: @TetherRabbit\n3. Поддержка только в приложении\n4. Не доверяйте личные данные\n5. Проверяйте адреса кошельков перед отправкой"
        },
        {
            id: 'support-1',
            category: 'support',
            question: "Как обратиться в поддержку?",
            answer: "1. Через чат поддержки в приложении\n2. Через бота @TetherRabbitBot\n3. В группе @TetherRabbit_Chat\n4. Укажите ID заявки/пользователя\n5. Время ответа: 5-15 минут"
        },
        {
            id: 'support-2',
            category: 'support',
            question: "Что делать при спорной ситуации?",
            answer: "1. Сохраните все скриншоты\n2. Сохраните квитанции об оплате\n3. Обратитесь в поддержку с полной информацией\n4. Укажите ID транзакции\n5. Решение принимается в течение 24 часов"
        }
    ];

    const rulesContent = [
        {
            title: "Общие положения",
            content: "1. TetherRabbit предоставляет услуги обмена криптовалют\n2. Пользователь обязан соблюдать законодательство РФ\n3. Все операции проходят автоматическую проверку\n4. Администрация оставляет право блокировки аккаунта при нарушении правил"
        },
        {
            title: "Порядок проведения обменов",
            content: "1. Заявка создается на точную сумму\n2. Резерв средств осуществляется на 30 минут\n3. Оплата должна поступить в течение 15 минут\n4. При долгом ожидании курс может быть пересчитан\n5. Отмена заявки возможна до поступления оплаты"
        },
        {
            title: "Лимиты и ограничения",
            content: "1. Минимальная сумма обмена: 1,000 RUB / 10 USDT\n2. Максимальная сумма без верификации: 50,000 RUB\n3. Суточный лимит: 200,000 RUB\n4. Для повышения лимитов требуется верификация"
        },
        {
            title: "Комиссии и тарифы",
            content: "1. Комиссия обменника: 1-3% в зависимости от суммы\n2. Комиссия сети TRC-20: 1 USDT\n3. Комиссия банковских переводов: 0-50 ₽\n4. Реферальная комиссия: 0.5% от суммы сделки реферала"
        },
        {
            title: "Реферальная программа",
            content: "1. Приглашайте друзей по уникальной ссылке\n2. Получайте 0.5% от суммы каждой сделки реферала\n3. Минимальный вывод: 100 ₽\n. Вывод доступен после верификации\n5. Реферал должен совершить хотя бы одну сделку"
        },
        {
            title: "Безопасность и конфиденциальность",
            content: "1. Данные пользователей хранятся в зашифрованном виде\n2. Все транзакции проходят автоматическую проверку\n3. Рекомендуем использовать 2FA\n4. Не передавайте доступ к аккаунту третьим лицам"
        },
        {
            title: "Ответственность",
            content: "1. Пользователь несет ответственность за правильность реквизитов\n2. Администрация не несет ответственность за потери из-за ошибок пользователя\n3. При технических сбоях операции восстанавливаются вручную\n4. Спорные ситуации решаются в течение 24 часов"
        },
        {
            title: "Верификация аккаунта",
            content: "1. Требуется для операций свыше 50,000 RUB\n2. Необходимо предоставить фото документа\n3. Верификация занимает до 24 часов\n4. После верификации доступны повышенные лимиты"
        }
    ];

    const popularQuestions = [
        "Как купить USDT?",
        "Как продать USDT?",
        "Сколько времени обмен?",
        "Какие лимиты?",
        "Как работает реферальная система?",
        "Как обратиться в поддержку?"
    ];

    // Фильтрация FAQ по выбранной категории
    useEffect(() => {
        if (selectedCategory === 'all') {
            setFilteredFaqItems(faqItems);
        } else {
            setFilteredFaqItems(faqItems.filter(item => item.category === selectedCategory));
        }
    }, [selectedCategory]);

    // Поиск при изменении запроса
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        const lowerQuery = searchQuery.toLowerCase();
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
                    id: `faq-${index}`,
                    category: item.category
                });
            }
        });

        // Поиск по правилам
        rulesContent.forEach((item, index) => {
            if (item.title.toLowerCase().includes(lowerQuery) || 
                item.content.toLowerCase().includes(lowerQuery)) {
                results.push({
                    type: 'rules',
                    title: item.title,
                    content: item.content,
                    section: 'rules',
                    id: `rules-${index}`
                });
            }
        });

        setSearchResults(results);
        setShowSearchResults(results.length > 0);
    }, [searchQuery]);

    const handleSearch = (query) => {
        setSearchQuery(query);
    };

    const handleResultClick = (result) => {
        setActiveSection(result.section);
        setSearchQuery('');
        setShowSearchResults(false);
        
        setTimeout(() => {
            const element = document.getElementById(result.id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.style.backgroundColor = '#f0f7ff';
                setTimeout(() => {
                    element.style.backgroundColor = '';
                }, 2000);
            }
        }, 100);
    };

    const handleCategoryClick = (categoryId) => {
        setSelectedCategory(categoryId);
        setActiveSection('faq');
        setSearchQuery('');
        setShowSearchResults(false);
    };

    const handlePopularQuestionClick = (question) => {
        setSearchQuery(question);
        setActiveSection('faq');
        setSelectedCategory('all');
    };

    return (
        <div className="help-container">
            {/* Header */}
            <div className="help-header">
                <div className="header-top">
                    <button 
                        className="back-button"
                        onClick={() => navigateTo && navigateTo('/')}
                    >
                        ←
                    </button>
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
                                    <span>Найдено: {searchResults.length} результатов</span>
                                </div>
                                {searchResults.map((result, index) => (
                                    <div
                                        key={index}
                                        className="search-result-item"
                                        onClick={() => handleResultClick(result)}
                                    >
                                        <div className="result-type">
                                            {result.type === 'faq' ? '❓' : '📋'}
                                        </div>
                                        <div className="result-content">
                                            <div className="result-title">{result.title}</div>
                                            <div className="result-preview">{result.content.substring(0, 100)}...</div>
                                            <div className="result-category">
                                                {result.category === 'exchange' ? '💱 Обмен' :
                                                 result.category === 'rules' ? '📋 Правила' :
                                                 result.category === 'security' ? '🔐 Безопасность' :
                                                 result.category === 'referral' ? '👥 Рефералы' :
                                                 result.category === 'support' ? '💬 Поддержка' : '📚 Общее'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!searchQuery && (
                            <>
                                <div className="categories-tabs">
                                    {categories.map(category => (
                                        <button
                                            key={category.id}
                                            className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
                                            onClick={() => handleCategoryClick(category.id)}
                                        >
                                            <span className="tab-icon">{category.icon}</span>
                                            <span className="tab-name">{category.name}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="popular-questions">
                                    <h3>Популярные вопросы</h3>
                                    <div className="questions-grid">
                                        {popularQuestions.map((question, index) => (
                                            <button
                                                key={index}
                                                className="question-chip"
                                                onClick={() => handlePopularQuestionClick(question)}
                                                type="button"
                                            >
                                                {question}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
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
                            <h3>Часто задаваемые вопросы ({filteredFaqItems.length})</h3>
                        </div>
                        <span className="toggle-icon">{activeSection === 'faq' ? '−' : '+'}</span>
                    </div>
                    
                    <div className={`section-content ${activeSection === 'faq' ? 'expanded' : ''}`}>
                        <div className="faq-grid">
                            {filteredFaqItems.map((item, index) => (
                                <div key={index} id={`faq-${index}`} className="faq-card">
                                    <div className="faq-category-badge">
                                        {item.category === 'exchange' ? '💱 Обмен' :
                                         item.category === 'rules' ? '📋 Правила' :
                                         item.category === 'security' ? '🔐 Безопасность' :
                                         item.category === 'referral' ? '👥 Рефералы' :
                                         item.category === 'support' ? '💬 Поддержка' : '📚 Общее'}
                                    </div>
                                    <div className="faq-question">
                                        <div className="question-icon">Q</div>
                                        <div className="question-text">{item.question}</div>
                                    </div>
                                    <div className="faq-answer">
                                        <div className="answer-icon">A</div>
                                        <div className="answer-text">{item.answer.split('\n').map((line, i) => (
                                            <div key={i}>{line}</div>
                                        ))}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Правила Section */}
                <div className={`help-section ${activeSection === 'rules' ? 'active' : ''}`}>
                    <div className="section-header" onClick={() => toggleSection('rules')}>
                        <div className="section-title">
                            <span className="section-icon">📋</span>
                            <h3>Правила использования TetherRabbit ({rulesContent.length})</h3>
                        </div>
                        <span className="toggle-icon">{activeSection === 'rules' ? '−' : '+'}</span>
                    </div>
                    
                    <div className={`section-content ${activeSection === 'rules' ? 'expanded' : ''}`}>
                        <div className="rules-grid">
                            {rulesContent.map((item, index) => (
                                <div key={index} id={`rules-${index}`} className="rule-card">
                                    <div className="rule-header">
                                        <div className="rule-number">{index + 1}</div>
                                        <h4 className="rule-title">{item.title}</h4>
                                    </div>
                                    <div className="rule-content">
                                        {item.content.split('\n').map((line, i) => (
                                            <div key={i} className="rule-line">{line}</div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Контакты поддержки */}
                <div className="support-section">
                    <div className="support-card">
                        <div className="support-icon">💬</div>
                        <div className="support-content">
                            <h4>Нужна дополнительная помощь?</h4>
                            <p>Обратитесь в нашу поддержку:</p>
                            <div className="support-contacts">
                                <a href="https://t.me/TetherRabbit_Chat" target="_blank" rel="noopener noreferrer" className="support-link">
                                    💬 Чат поддержки
                                </a>
                                <a href="https://t.me/TetherRabbit" target="_blank" rel="noopener noreferrer" className="support-link">
                                    📢 Официальный канал
                                </a>
                            </div>
                            <p className="support-note">Время ответа: 5-15 минут</p>
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