import { useState, useEffect } from 'react';
import './Help.css';

export default function Help({ navigateTo }) {
  const [activeSection, setActiveSection] = useState('faq');
  const [expandedFaqs, setExpandedFaqs] = useState({});
  const tg = window.Telegram?.WebApp;

  useEffect(() => {
    if (!tg?.BackButton) return;
    tg.BackButton.show();
    tg.BackButton.onClick(() => navigateTo('home'));
    return () => tg.BackButton.hide();
  }, [navigateTo, tg]);

  const faqItems = [
    { id: 1, q: 'Как происходит обмен?', a: 'Выбираете направление → вводите сумму → подтверждаете.' },
    { id: 2, q: 'Сколько длится обмен?', a: 'В среднем от 5 до 30 минут.' },
    { id: 3, q: 'Это безопасно?', a: 'Да. Мы не храним приватные ключи.' },
  ];

  return (
    <div className="tg-help fade-in">
      <header className="tg-header">
        <button onClick={() => navigateTo('home')} className="tg-back">←</button>
        <h1>Помощь</h1>
      </header>

      <section className="tg-section">
        <div className="tg-section-header" onClick={() => setActiveSection(activeSection === 'faq' ? null : 'faq')}>
          <span>❓ Частые вопросы</span>
          <span className={activeSection === 'faq' ? 'rotated' : ''}>⌄</span>
        </div>

        {activeSection === 'faq' && (
          <div className="tg-list slide-down">
            {faqItems.map(f => (
              <div key={f.id} className="tg-item">
                <div
                  className="tg-item-title"
                  onClick={() => setExpandedFaqs(p => ({ ...p, [f.id]: !p[f.id] }))}
                >
                  {f.q}
                  <span className={expandedFaqs[f.id] ? 'rotated' : ''}>⌄</span>
                </div>

                {expandedFaqs[f.id] && (
                  <div className="tg-item-body fade-in">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
