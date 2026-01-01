import { useState, useEffect } from 'react';
import './Help.css';

function Help({ navigateTo }) {
    const [activeSection, setActiveSection] = useState('faq');
    const [expandedFaqs, setExpandedFaqs] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    
    // Простые данные для теста
    const faqItems = [
        {
            id: 'faq1',
            question: 'Как начать обмен?',
            answer: '1. Выберите криптовалюту\n2. Введите сумму\n3. Укажите адрес кошелька\n4. Подтвердите транзакцию'
        },
        {
            id: 'faq2',
            question: 'Какие комиссии?',
            answer: 'Комиссия 0.5% от суммы обмена.'
        }
    ];

    const rulesContent = [
        {
            id: 'rule1',
            title: 'Общие правила',
            content: 'Минимальная сумма обмена: $10.'
        }
    ];

    // Telegram Back Button
    useEffect(() => {
        const tg = window.Telegram?.WebApp;
        if (!tg?.BackButton) return;

        tg.BackButton.show();
        tg.BackButton.onClick(() => navigateTo('home'));

        return () => {
            if (tg.BackButton) {
                tg.BackButton.offClick();
            }
        };
    }, [navigateTo]);

    // Обработчики
    const toggleSection = (section) => {
        setActiveSection(prev => prev === section ? null : section);
    };

    const toggleFaq = (faqId) => {
        setExpandedFaqs(prev => ({
            ...prev,
            [faqId]: !prev[faqId]
        }));
    };

    const handleContactSupport = () => {
        window.open('https://t.me/TetherRabbit_Chat', '_blank');
    };

    const handleOpenChannel = () => {
        window.open('https://t.me/TetherRabbit', '_blank');
    };

    return (
        <div className="help-container-new">
            {/* Шапка */}
            <div className="help-header-new">
                <h1 className="header-title-new">Помощь</h1>
                <p className="header-subtitle">Ответы на ваши вопросы</p>
                
                {/* Поиск */}
                <div className="search-container-new">
                    <span className="search-icon-new">🔍</span>
                    <input
                        className="search-input-new"
                        placeholder="Поиск..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* FAQ секция */}
            <div className="help-section-new">
                <div 
                    className="section-header-new" 
                    onClick={() => toggleSection('faq')}
                >
                    <h3>Частые вопросы</h3>
                    <span>{activeSection === 'faq' ? '−' : '+'}</span>
                </div>

                {activeSection === 'faq' && (
                    <div className="section-content-new">
                        {faqItems.map(item => (
                            <div key={item.id} className="faq-item-new">
                                <button
                                    className="faq-question-new"
                                    onClick={() => toggleFaq(item.id)}
                                >
                                    {item.question}
                                    <span className={expandedFaqs[item.id] ? 'rot' : ''}>▼</span>
                                </button>
                                
                                {expandedFaqs[item.id] && (
                                    <div className="faq-answer-new">
                                        {item.answer.split('\n').map((line, i) => (
                                            <div key={i}>{line}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Правила секция */}
            <div className="help-section-new">
                <div 
                    className="section-header-new" 
                    onClick={() => toggleSection('rules')}
                >
                    <h3>Правила</h3>
                    <span>{activeSection === 'rules' ? '−' : '+'}</span>
                </div>

                {activeSection === 'rules' && (
                    <div className="section-content-new">
                        {rulesContent.map(rule => (
                            <div key={rule.id} className="rule-item-new">
                                <h4>{rule.title}</h4>
                                <div>{rule.content}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Кнопки поддержки */}
            <div className="support-section-new">
                <button 
                    className="support-btn-new primary"
                    onClick={handleContactSupport}
                >
                    💬 Чат поддержки
                </button>
                <button 
                    className="support-btn-new secondary"
                    onClick={handleOpenChannel}
                >
                    📢 Наш канал
                </button>
            </div>
        </div>
    );
}

export default Help;