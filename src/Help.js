import { useEffect, useMemo, useState } from 'react';
import './Help.css';

export default function Help({ navigateTo }) {
  const [activeSection, setActiveSection] = useState('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaqs, setExpandedFaqs] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');

  /* ===============================
     TELEGRAM BACK BUTTON (NATIVE)
  =============================== */
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.BackButton) return;

    tg.BackButton.show();
    tg.BackButton.onClick(() => navigateTo('home'));

    return () => tg.BackButton.hide();
  }, [navigateTo]);

  /* ===============================
     DATA
  =============================== */
  const faqItems = [
    {
      id: 'f1',
      category: 'exchange',
      question: 'Как происходит обмен?',
      answer:
        '1. Вы выбираете направление обмена\n' +
        '2. Указываете сумму\n' +
        '3. Подтверждаете заявку\n' +
        '4. Следуете инструкциям оператора',
    },
    {
      id: 'f2',
      category: 'exchange',
      question: 'Сколько времени занимает обмен?',
      answer:
        'Покупка USDT: 5–15 минут\n' +
        'Продажа USDT: 15–30 минут',
    },
    {
      id: 'f3',
      category: 'security',
      question: 'Это безопасно?',
      answer:
        'Да. Мы не храним приватные ключи.\n' +
        'Все операции проходят ручную проверку.',
    },
    {
      id: 'f4',
      category: 'referral',
      question: 'Как работает реферальная система?',
      answer:
        'Вы получаете 0.5% с каждой сделки приглашённого пользователя.\n' +
        'Минимальный вывод — 10 USDT.',
    },
  ];

  const rules = [
    {
      id: 'r1',
      title: 'Общие положения',
      content:
        '1. Сервис предоставляет услуги обмена цифровых активов\n' +
        '2. Пользователь обязан соблюдать законодательство\n' +
        '3. Все заявки проходят проверку',
    },
    {
      id: 'r2',
      title: 'Проведение обменов',
      content:
        '1. Заявка создаётся на фиксированную сумму\n' +
        '2. Резерв средств — 30 минут\n' +
        '3. Оплата должна быть произведена в течение 15 минут',
    },
    {
      id: 'r3',
      title: 'Ограничения и лимиты',
      content:
        'Минимум: 10 USDT / 1 000 RUB\n' +
        'Максимум: 10 000 USDT / 1 000 000 RUB',
    },
    {
      id: 'r4',
      title: 'Ответственность',
      content:
        'Сервис не несёт ответственности за ошибки пользователя\n' +
        'Неверные реквизиты приводят к потере средств',
    },
  ];

  const categories = [
    { id: 'all', label: 'Все' },
    { id: 'exchange', label: 'Обмен' },
    { id: 'security', label: 'Безопасность' },
    { id: 'referral', label: 'Рефералы' },
  ];

  /* ===============================
     SEARCH + FILTER
  =============================== */
  const filteredFaq = useMemo(() => {
    let data = faqItems;

    if (selectedCategory !== 'all') {
      data = data.filter(f => f.category === selectedCategory);
    }

    if (!searchQuery.trim()) return data;

    const q = searchQuery.toLowerCase();
    return data.filter(
      f =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q)
    );
  }, [faqItems, selectedCategory, searchQuery]);

  /* ===============================
     HANDLERS
  =============================== */
  const toggleFaq = id =>
    setExpandedFaqs(p => ({ ...p, [id]: !p[id] }));

  /* ===============================
     RENDER
  =============================== */
  return (
    <div className="telegram-help">

      {/* SEARCH */}
      <div className="tg-search-container">
        <input
          className="tg-search-input"
          placeholder="Поиск"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* CATEGORY CHIPS */}
      <div className="tg-categories">
        {categories.map(c => (
          <button
            key={c.id}
            className={`tg-chip ${selectedCategory === c.id ? 'active' : ''}`}
            onClick={() => {
              setSelectedCategory(c.id);
              setActiveSection('faq');
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* GAME BOX */}
      <div className="tg-box tg-game-box" onClick={() => navigateTo('game')}>
        <div className="tg-box-title">🎮 Mini Game</div>
        <div className="tg-box-subtitle">
          Играй и зарабатывай бонусы
        </div>
      </div>

      {/* FAQ */}
      <div className="tg-section">
        <div
          className="tg-section-header"
          onClick={() =>
            setActiveSection(activeSection === 'faq' ? null : 'faq')
          }
        >
          ❓ Часто задаваемые вопросы
        </div>

        {activeSection === 'faq' && (
          <div className="tg-list">
            {filteredFaq.map(f => (
              <div key={f.id} className="tg-list-item">
                <div
                  className="tg-list-title"
                  onClick={() => toggleFaq(f.id)}
                >
                  {f.question}
                  <span className={expandedFaqs[f.id] ? 'rotated' : ''}>⌄</span>
                </div>

                {expandedFaqs[f.id] && (
                  <div className="tg-list-content">
                    {f.answer.split('\n').map((l, i) => (
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
      <div className="tg-section">
        <div
          className="tg-section-header"
          onClick={() =>
            setActiveSection(activeSection === 'rules' ? null : 'rules')
          }
        >
          📋 Правила использования
        </div>

        {activeSection === 'rules' && (
          <div className="tg-list">
            {rules.map(r => (
              <div key={r.id} className="tg-rule">
                <div className="tg-rule-title">{r.title}</div>
                <div className="tg-rule-content">
                  {r.content.split('\n').map((l, i) => (
                    <div key={i}>{l}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
