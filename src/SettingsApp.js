// SettingsApp.js - Полная версия с PIN-защитой и проверкой наличия PIN
import React, { useState, useEffect } from 'react';
import './SettingsApp.css';
import PinCode from './PinCode';

const API_BASE_URL = 'https://tethrab.shop';

function SettingsApp({ navigateTo, telegramUser, showToast, hideHints, updateHideHints }) {
  const [localHideHints, setLocalHideHints] = useState(hideHints);
  const [showPin, setShowPin] = useState(false);
  const [pinMode, setPinMode] = useState('enter');
  const [pinAction, setPinAction] = useState(null);
  const [pinActionName, setPinActionName] = useState('');
  const [pinVerified, setPinVerified] = useState(false);
  const [hasPin, setHasPin] = useState(null); // null - не знаем, true/false - знаем

  // Синхронизируем с App.js
  useEffect(() => {
    setLocalHideHints(hideHints);
  }, [hideHints]);

  // Проверяем, установлен ли PIN на сервере
  useEffect(() => {
    const checkPinExists = async () => {
      if (!telegramUser?.id) return;
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/pin/check/${telegramUser.id}`);
        const data = await response.json();
        setHasPin(data.exists);
        console.log('📌 PIN существует:', data.exists);
      } catch (error) {
        console.error('❌ Ошибка проверки PIN:', error);
        setHasPin(false); // По умолчанию считаем что нет
      }
    };
    
    checkPinExists();
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

  // ==================== ЗАЩИТА ДЕЙСТВИЙ ====================
  const handleProtectedAction = (action, actionName) => {
    const token = localStorage.getItem(`user_token_${telegramUser?.id}`);
    const expires = localStorage.getItem(`user_token_expires_${telegramUser?.id}`);
    
    // Если токен есть и не истёк (меньше 15 минут)
    if (token && expires && Date.now() < parseInt(expires)) {
      // Проверяем токен на сервере
      fetch(`${API_BASE_URL}/api/pin/check-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: telegramUser?.id, 
          token: token 
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Токен валиден - сразу выполняем действие
          action();
        } else {
          // Токен недействителен - запрашиваем PIN
          openPinScreen(action, actionName);
        }
      })
      .catch(() => {
        // Ошибка сети - запрашиваем PIN для безопасности
        openPinScreen(action, actionName);
      });
    } else {
      // Нет токена или истёк - запрашиваем PIN
      openPinScreen(action, actionName);
    }
  };

  // Открытие экрана PIN с правильным режимом
  const openPinScreen = (action, actionName) => {
    setPinAction(() => action);
    setPinActionName(actionName);
    
    // Если PIN ещё не установлен - режим создания, иначе - ввод
    if (hasPin === false) {
      setPinMode('setup');
    } else {
      setPinMode('enter');
    }
    
    setShowPin(true);
  };

  // Обработчик успешного ввода PIN
  const handlePinSuccess = (token) => {
    setShowPin(false);
    setPinVerified(true);
    
    // Если токен получен, сохраняем
    if (token) {
      localStorage.setItem(`user_token_${telegramUser?.id}`, token);
      localStorage.setItem(`user_token_expires_${telegramUser?.id}`, Date.now() + 15 * 60 * 1000);
    }
    
    showToast(`✅ Доступ к ${pinActionName} разрешён`, 'success');
    
    // Обновляем статус наличия PIN
    if (pinMode === 'setup') {
      setHasPin(true);
    }
    
    // Выполняем защищённое действие
    if (pinAction) {
      setTimeout(() => {
        pinAction();
      }, 500);
    }
  };

  // Сброс PIN (только для админа)
  const resetPin = () => {
    if (window.confirm('Сбросить PIN-код? Это действие нельзя отменить.')) {
      fetch(`${API_BASE_URL}/api/pin/${telegramUser?.id}`, {
        method: 'DELETE',
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          localStorage.removeItem(`user_token_${telegramUser?.id}`);
          localStorage.removeItem(`user_token_expires_${telegramUser?.id}`);
          setHasPin(false);
          showToast('✅ PIN-код сброшен', 'success');
        }
      })
      .catch(() => {
        showToast('❌ Ошибка сброса', 'error');
      });
    }
  };

  // Если показываем PIN-код
  if (showPin) {
    return (
      <PinCode
        userId={telegramUser?.id}
        mode={pinMode}
        requiredAction={pinActionName}
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
                setPinActionName('настройкам безопасности');
                if (hasPin === false) {
                  setPinMode('setup');
                } else {
                  setPinMode('enter');
                }
                setShowPin(true);
              }}
            >
              <div className="settings-item-text">
                <div className="title">🔐 ПИН-код</div>
                <div className="desc">
                  {hasPin === false 
                    ? 'Установить код безопасности' 
                    : hasPin === true 
                      ? 'Изменить код безопасности' 
                      : 'Загрузка...'}
                </div>
              </div>
              <div className="settings-item-arrow">›</div>
            </button>

            {/* КНОПКА СБРОСА PIN (для админа/владельца) */}
            {telegramUser?.id === '7879866656' && (
              <button 
                className="settings-item danger" 
                onClick={resetPin}
              >
                <div className="settings-item-text">
                  <div className="title">🔄 Сбросить PIN-код</div>
                  <div className="desc">Для всех пользователей (только админ)</div>
                </div>
              </button>
            )}

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

        {/* ==================== ЗАЩИЩЁННЫЕ ДЕЙСТВИЯ ==================== */}
        <div className="settings-section">
          <div className="settings-section-header">ЗАЩИЩЁННЫЕ ДЕЙСТВИЯ</div>
          <div className="settings-list">

            <button
              className="settings-item"
              onClick={() => handleProtectedAction(() => {
                navigateTo('createCheck');
              }, 'создание чека')}
            >
              <div className="settings-item-text">
                <div className="title">🎫 Создать чек</div>
                <div className="desc">Требуется подтверждение PIN-кодом</div>
              </div>
              <div className="settings-item-arrow">›</div>
            </button>

            <button
              className="settings-item"
              onClick={() => handleProtectedAction(() => {
                navigateTo('withdraw');
              }, 'вывод средств')}
            >
              <div className="settings-item-text">
                <div className="title">💰 Вывод средств</div>
                <div className="desc">Требуется подтверждение PIN-кодом</div>
              </div>
              <div className="settings-item-arrow">›</div>
            </button>

            <button
              className="settings-item"
              onClick={() => handleProtectedAction(() => {
                navigateTo('p2p');
              }, 'P2P объявления')}
            >
              <div className="settings-item-text">
                <div className="title">🤝 P2P объявления</div>
                <div className="desc">Требуется подтверждение PIN-кодом</div>
              </div>
              <div className="settings-item-arrow">›</div>
            </button>

          </div>
        </div>

        {/* ==================== ИНФО ==================== */}
        <div className="settings-footer">
          <div>© 2025 TetherRabbit</div>
          <div>Версия 2.0.0</div>
        </div>

      </div>
    </div>
  );
}

export default SettingsApp;