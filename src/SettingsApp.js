import React, { useState, useEffect } from 'react';
import './SettingsApp.css';
import PinCode from './PinCode';

function SettingsApp({ navigateTo, telegramUser, showToast, hideHints, updateHideHints }) {
  const [localHideHints, setLocalHideHints] = useState(hideHints);
  const [showPin, setShowPin] = useState(false);
  const [pinMode, setPinMode] = useState('enter');
  const [pinVerified, setPinVerified] = useState(false);

  // Синхронизируем с App.js
  useEffect(() => {
    setLocalHideHints(hideHints);
  }, [hideHints]);

  // Проверяем, установлен ли ПИН-код при загрузке
  useEffect(() => {
    const hasPin = localStorage.getItem(`user_pin_${telegramUser?.id}`);
    if (!hasPin) {
      setPinMode('setup');
    }
  }, [telegramUser?.id]);

  const toggleHints = () => {
    const nextValue = !localHideHints;
    setLocalHideHints(nextValue);
    if (updateHideHints) {
      updateHideHints(nextValue);
    } else {
      localStorage.setItem('hideHints', nextValue.toString());
    }
    showToast(nextValue ? 'Подсказки скрыты' : 'Подсказки включены', 'success');
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`✅ ${label} скопирован`, 'success');
  };

  const handlePinSuccess = () => {
    setShowPin(false);
    setPinVerified(true);
    showToast('✅ ПИН-код подтверждён', 'success');
  };

  // Если показываем ПИН-код
  if (showPin) {
    return (
      <PinCode
        userId={telegramUser?.id}
        mode={pinMode}
        onSuccess={handlePinSuccess}
        onBack={() => setShowPin(false)}
      />
    );
  }

  return (
    <div className="settings-container">

      {/* Хедер (системный стиль) */}
      <div className="settings-header">
        <h1>Настройки</h1>
      </div>

      <div className="settings-content">

        {/* ==================== БЕЗОПАСНОСТЬ ==================== */}
        <div className="settings-section">
          <div className="settings-list">
            
            {/* КНОПКА ПИН-КОДА */}
            <button 
              className="settings-item" 
              onClick={() => {
                setPinMode('enter');
                setShowPin(true);
              }}
            >
              <div className="settings-item-text">
                <div className="title">🔐 ПИН-код</div>
                <div className="desc">
                  {localStorage.getItem(`user_pin_${telegramUser?.id}`) 
                    ? 'Изменить код безопасности' 
                    : 'Установить код для защиты операций'}
                </div>
              </div>
              <div className="settings-item-arrow">›</div>
            </button>

          </div>
        </div>

        {/* ==================== УВЕДОМЛЕНИЯ ==================== */}
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

        {/* ==================== АККАУНТ ==================== */}
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
              <div className="settings-item-arrow">›</div>
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

        {/* ==================== ИНФО ==================== */}
        <div className="settings-footer">
          <div>© 2024 TetherRabbit</div>
        </div>

      </div>
    </div>
  );
}

export default SettingsApp;