import React, { useState, useEffect } from 'react';
import './SettingsApp.css';

function SettingsApp({ navigateTo, telegramUser, showToast, hideHints, updateHideHints }) {
  const [localHideHints, setLocalHideHints] = useState(hideHints);

  // Синхронизируем с App.js
  useEffect(() => {
    setLocalHideHints(hideHints);
  }, [hideHints]);

  const toggleHints = () => {
    const nextValue = !localHideHints;
    setLocalHideHints(nextValue);
    // Вызываем функцию из App.js для обновления глобального состояния
    if (updateHideHints) {
      updateHideHints(nextValue);
    } else {
      // Фолбэк если функция не передана
      localStorage.setItem('hideHints', nextValue.toString());
    }
    showToast(nextValue ? 'Подсказки скрыты' : 'Подсказки включены', 'success');
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`✅ ${label} скопирован`, 'success');
  };

  return (
    <div className="settings-container">

      {/* Хедер (системный стиль) */}
      <div className="settings-header">
        <h1>Настройки</h1>
      </div>

      <div className="settings-content">

        {/* Уведомления */}
        <div className="settings-section">
          <div className="settings-list">

            <button className="settings-item" onClick={toggleHints}>
              <div className="settings-item-text">
                <div className="title">Скрывать подсказки</div>
                <div className="desc">Не показывать обучающие сообщения</div>
              </div>
              <div className={`switch ${localHideHints ? 'on' : ''}`}>
                <span />
              </div>
            </button>

          </div>
        </div>

        {/* Аккаунт */}
        <div className="settings-section">
          <div className="settings-list">

            <button
              className="settings-item"
              onClick={() => copyToClipboard(telegramUser?.id, 'ID пользователя')}
            >
              <div className="settings-item-text">
                <div className="title">ID пользователя</div>
                <div className="desc">{telegramUser?.id || '—'}</div>
              </div>
            </button>

            <button
              className="settings-item"
              onClick={() => navigateTo('profile')}
            >
              <div className="settings-item-text">
                <div className="title">Мой профиль</div>
                <div className="desc">Рефералы и статистика</div>
              </div>
            </button>

            <button
              className="settings-item danger"
              onClick={() => {
                if (confirm('Выйти из аккаунта?')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
            >
              <div className="settings-item-text">
                <div className="title">Выйти</div>
                <div className="desc">Завершить сессию</div>
              </div>
            </button>

          </div>
        </div>

        {/* Инфо */}
        <div className="settings-footer">
          {/* <div>TetherRabbit</div> */}
          <div>© 2024 TetherRabbit</div>
        </div>

      </div>
    </div>
  );
}

export default SettingsApp;