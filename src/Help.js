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

    const faqItems = [
        {
            id: 'faq-0',
            category: 'exchange',
            question: "Как происходит обмен?",
            answer: "1. Выберите направление обмена (покупка/продажа USDT)\n2. Введите сумму обмена\n3. Выберите способ оплаты/получения\n4. Подтвердите операцию\n5. Следуйте инструкциям оператора в открывшемся диалоговом окне для завершения сделки"
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
            answer: "Реферальная система:\n1. Приглашайте друзей по вашей ссылке\n2. Реферал регистрируется и делает обмен\n3. Вы получаете 0.5% от суммы его сделки\n4. Выводы реферам производятся 1 раз в неделю\n5. Минимальный вывод: 10$"
        },
        {
            id: 'rules-1',
            category: 'rules',
            question: "Основные правила TetherRabbit",
            answer: "1. Все операции должны быть легальными\n2. Запрещены сделки с целью отмывания денег\n3. В случае подозрительных ситуаций пользователь обязан предоставить нужные подтверждения\n4. Заявки обрабатываются в порядке очереди\n5. Администрация оставляет право отказать в обслуживании заявки при критической необходимости"
        },
        {
            id: 'rules-2',
            category: 'rules',
            question: "Правила проведения обменов",
            answer: "1. Сумма к получению фиксируется при создании заявки\n2. Средства отправляются только после поступления оплаты\n3. Время выполнения: до 30 минут\n4. На момент обмена средства замораживаются у трейдера\n5. Отмена заявки возможна в течение 5 минут"
        },
        {
            id: 'rules-3',
            category: 'rules',
            question: "Подтверждение происхождения",
            answer: "Требуется для:\n1. Сумм свыше 500,000 RUB/5000$\n2. Повышения лимитов\n3. Подтверждения личности"
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
            id: 'rule-1',
            title: "Общие положения",
            content: "1. TetherRabbit предоставляет услуги обмена криптовалют\n2. Пользователь обязан соблюдать законодательство РФ\n3. Все операции проходят автоматическую проверку\n4. Администрация оставляет право блокировки аккаунта при нарушении правил"
        },
        {
            id: 'rule-2',
            title: "Порядок проведения обменов",
            content: "1. Заявка создается на точную сумму\n2. Резерв средств осуществляется на 30 минут\n3. Оплата должна поступить в течение 15 минут\n4. При долгом ожидании обратитесь в поддержку \n5. Отмена заявки возможна до поступления оплаты"
        },      
        {
            id: 'rule-3',
            title: "Лимиты и ограничения",
            content: "1. Минимальная сумма обмена: 1,000 RUB / 10 USDT\n3. Суточный лимит для пользователя в данный момент 1 000,000 RUB\n4. Для повышения лимитов требуется активная торговля на площадке"
        },
        {
            id: 'rule-4',
            title: "Комиссии и тарифы",
            content: "1. Комиссия обменника уже включена перед расчетом суммы сделки: 1-3% в зависимости от суммы"
        },
        {
            id: 'rule-5',
            title: "Реферальная программа",
            content: "1. Приглашайте друзей по уникальной ссылке\n2. Получайте 1% от суммы каждой сделки реферала\n3. Минимальный вывод: 10 $\n4. Реферал должен совершить хотя бы одну сделку"
        },
        {
            id: 'rule-6',
            title: "Безопасность и конфиденциальность",
            content: "1. Данные пользователей хранятся в зашифрованном виде\n2. Все транзакции проходят автоматическую проверку\n3. Не передавайте доступ к аккаунту третьим лицам"
        },
        {
            id: 'rule-7',
            title: "Ответственность",
            content: "1. Пользователь несет ответственность за правильность реквизитов\n2. Администрация не несет ответственность за потери из-за ошибок пользователя при вводе некорректных данных \n3. При технических сбоях операции восстанавливаются вручную\n4. Спорные ситуации решаются в течение 24 часов"
        },
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
                    id: item.id,
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
                    id: item.id
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
                element.classList.add('highlight-result');
                setTimeout(() => {
                    element.classList.remove('highlight-result');
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

    const handleContactSupport = () => {
        window.open('https://t.me/TetherRabbit_Chat', '_blank');
    };

    const handleOpenChannel = () => {
        window.open('https://t.me/TetherRabbit', '_blank');
    };

    const handleOpenBot = () => {
        window.open('https://t.me/TetherRabbitBot', '_blank');
    };

    const getCategoryIcon = (categoryId) => {
        const category = categories.find(cat => cat.id === categoryId);
        return category ? category.icon : '📚';
    };

    const getCategoryName = (categoryId) => {
        const category = categories.find(cat => cat.id === categoryId);
        return category ? category.name : 'Общее';
    };

    // Автоматически открываем FAQ при загрузке
    useEffect(() => {
        if (!activeSection) {
            setActiveSection('faq');
        }
    }, []);

    return (
        <div className="help-container-new">
            {/* Хедер */}
            <div className="help-header-new">
                <div className="header-content">
                    <div className="header-left">
                        <h1 className="header-title-new">Помощь</h1>
                        <p className="header-subtitle">Все ответы на ваши вопросы</p>
                    </div>
                    <button 
                        className="back-button-new"
                        onClick={() => navigateTo('profile')}
                        title="Вернуться в профиль"
                    >
                        ← Назад
                    </button>
                </div>

                {/* Поиск */}
                <div className="help-search-section">
                    <div className="search-container-new">
                        <div className="search-icon-new">🔍</div>
                        <input
                            type="text"
                            placeholder="Спросите у кролика ..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="search-input-new"
                            autoComplete="off"
                        />
                        {searchQuery && (
                            <button 
                                className="clear-search-new"
                                onClick={() => {
                                    setSearchQuery('');
                                    setShowSearchResults(false);
                                }}
                                title="Очистить поиск"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {showSearchResults && (
                        <div className="search-results-new">
                            <div className="results-header-new">
                                <span>Найдено результатов: {searchResults.length}</span>
                            </div>
                            {searchResults.map((result, index) => (
                                <div
                                    key={`result-${index}`}
                                    className="search-result-item-new"
                                    onClick={() => handleResultClick(result)}
                                >
                                    <div className="result-icon-new">
                                        {result.type === 'faq' ? '❓' : '📋'}
                                    </div>
                                    <div className="result-content-new">
                                        <div className="result-title-new">{result.title}</div>
                                        <div className="result-preview-new">
                                            {result.content.substring(0, 80)}...
                                        </div>
                                        <div className="result-category-new">
                                            {result.category ? getCategoryName(result.category) : 'Правила'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Категории */}
                {!searchQuery && (
                    <div className="categories-grid-new">
                        {categories.map(category => (
                            <button
                                key={`category-${category.id}`}
                                className={`category-card-new ${selectedCategory === category.id ? 'active' : ''}`}
                                onClick={() => handleCategoryClick(category.id)}
                                title={`Категория: ${category.name}`}
                            >
                                <div className="category-icon-new">{category.icon}</div>
                                <div className="category-name-new">{category.name}</div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Популярные вопросы */}
                {!searchQuery && selectedCategory === 'all' && (
                    <div className="popular-section-new">
                        <h3 className="popular-title">Популярные вопросы</h3>
                        <div className="questions-grid-new">
                            {popularQuestions.map((question, index) => (
                                <button
                                    key={`popular-${index}`}
                                    className="question-chip-new"
                                    onClick={() => handlePopularQuestionClick(question)}
                                    title={`Поиск: ${question}`}
                                >
                                    {question}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Основной контент */}
            <div className="help-content-new">
                {/* FAQ секция */}
                <div className={`help-section-new ${activeSection === 'faq' ? 'active' : ''}`}>
                    <div className="section-header-new" onClick={() => toggleSection('faq')}>
                        <div className="section-title-new">
                            <span className="section-icon-new">❓</span>
                            <h3>Часто задаваемые вопросы</h3>
                        </div>
                        <span className="toggle-icon-new">
                            {activeSection === 'faq' ? '−' : '+'}
                        </span>
                    </div>

                    <div className={`section-content-new ${activeSection === 'faq' ? 'active' : ''}`}>
                        {filteredFaqItems.length === 0 ? (
                            <div className="empty-state-new">
                                <div className="empty-icon-new">📭</div>
                                <h4>Нет вопросов в этой категории</h4>
                                <p>Попробуйте выбрать другую категорию или использовать поиск</p>
                            </div>
                        ) : (
                            <div className="faq-list-new">
                                {filteredFaqItems.map((item) => (
                                    <div 
                                        key={item.id} 
                                        id={item.id}
                                        className="faq-item-new"
                                    >
                                        <button 
                                            className="faq-question-new"
                                            onClick={() => toggleFaq(item.id)}
                                            aria-expanded={expandedFaqs[item.id] || false}
                                        >
                                            <div className="question-content">
                                                <div className="question-icon-new">Q</div>
                                                <div className="question-text-new">{item.question}</div>
                                            </div>
                                            <span className={`faq-toggle ${expandedFaqs[item.id] ? 'expanded' : ''}`}>
                                                ▼
                                            </span>
                                        </button>
                                        
                                        {expandedFaqs[item.id] && (
                                            <div className="faq-answer-new">
                                                <div className="answer-content">
                                                    <div className="answer-icon-new">A</div>
                                                    <div className="answer-text-new">
                                                        {item.answer.split('\n').map((line, i) => (
                                                            <div key={i} className="answer-line">{line}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="faq-meta">
                                                    <span className="faq-category-new">
                                                        {getCategoryIcon(item.category)} {getCategoryName(item.category)}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Правила секция */}
                <div className={`help-section-new ${activeSection === 'rules' ? 'active' : ''}`}>
                    <div className="section-header-new" onClick={() => toggleSection('rules')}>
                        <div className="section-title-new">
                            <span className="section-icon-new">📋</span>
                            <h3>Правила использования</h3>
                        </div>
                        <span className="toggle-icon-new">
                            {activeSection === 'rules' ? '−' : '+'}
                        </span>
                    </div>

                    <div className={`section-content-new ${activeSection === 'rules' ? 'active' : ''}`}>
                        <div className="rules-list-new">
                            {rulesContent.map((rule) => (
                                <div key={rule.id} id={rule.id} className="rule-item-new">
                                    <div className="rule-header-new">
                                        <div className="rule-number-new">{rule.id.split('-')[1]}</div>
                                        <h4 className="rule-title-new">{rule.title}</h4>
                                    </div>
                                    <div className="rule-content-new">
                                        {rule.content.split('\n').map((line, i) => (
                                            <div key={i} className="rule-line-new">{line}</div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Секция поддержки */}
                <div className="support-section-new">
                    <div className="support-card-new">
                        <div className="support-header-new">
                            <div className="support-icon-new">💬</div>
                            <div className="support-titles">
                                <h3>Нужна помощь?</h3>
                                <p>Наша поддержка всегда на связи</p>
                            </div>
                        </div>
                        
                        <div className="support-contacts-new">
                            <button 
                                className="support-btn-new primary"
                                onClick={handleContactSupport}
                                title="Открыть чат поддержки"
                            >
                                <span className="btn-icon">💬</span>
                                Чат поддержки
                            </button>
                            <button 
                                className="support-btn-new secondary"
                                onClick={handleOpenChannel}
                                title="Открыть официальный канал"
                            >
                                <span className="btn-icon">📢</span>
                                Официальный канал
                            </button>
                        </div>
                        
                        <div className="support-info-new">
                            <div className="info-item">
                                <span className="info-icon">⏱️</span>
                                <span>Поддержка старается обработать каждую заявку от Вас как можно скорее!</span>
                            </div>
                            
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Help;