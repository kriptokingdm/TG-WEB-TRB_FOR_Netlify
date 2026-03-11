// PinPage.js - Страница для ввода PIN-кода перед созданием чека
import React, { useState, useEffect } from 'react';
import PinCode from './PinCode';
import './PinCode.css';

const API_BASE_URL = 'https://tethrab.shop';

function PinPage() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [theme, setTheme] = useState('light');
  const [userId, setUserId] = useState(null);
  const [action, setAction] = useState(null);

  // Получаем параметры из URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get('userId');
    const actionParam = urlParams.get('action');
    
    console.log('🔍 PinPage загружена:', { userId: userIdParam, action: actionParam });
    
    setUserId(userIdParam);
    setAction(actionParam);
  }, []);

  // Получаем тему из Telegram
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      const theme = tg.colorScheme || 'light';
      setTheme(theme);
      document.documentElement.setAttribute('data-theme', theme);
      console.log('🎨 Тема Telegram изменилась:', theme);
    }
  }, []);

 const handlePinSuccess = async (token) => {
  console.log('✅ PIN успешно подтверждён, токен:', token);
  setStatus('success');
  setMessage('PIN подтверждён! Закрываю окно...');

  // Подготавливаем данные для отправки
  const dataToSend = {
    success: true,
    token: token
  };
  
  const jsonString = JSON.stringify(dataToSend);
  console.log('📤 Отправка данных в бота:', jsonString);

  if (window.Telegram?.WebApp) {
    try {
      // Отправляем данные
      window.Telegram.WebApp.sendData(jsonString);
      console.log('✅ Данные отправлены в бота');
      
      // НЕ ЗАКРЫВАЕМ СРАЗУ! Даём время на отправку
      setTimeout(() => {
        console.log('📤 Закрываю окно');
        window.Telegram.WebApp.close();
      }, 2000); // Увеличили до 2 секунд
      
    } catch (e) {
      console.error('❌ Ошибка отправки данных:', e);
      setTimeout(() => window.Telegram.WebApp.close(), 1000);
    }
  }
};

  const handlePinBack = () => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
    }
  };

  if (status === 'loading') {
    return (
      <PinCode
        userId={userId}
        mode="enter"
        requiredAction="создание чека"
        onSuccess={handlePinSuccess}
        onBack={handlePinBack}
      />
    );
  }

  return (
    <div className="pin-container">
      <div className="pin-header">
        <button className="pin-back" onClick={handlePinBack}>← Назад</button>
        <h2 className="pin-title">
          {status === 'success' ? 'Успешно!' : 'Проверка PIN'}
        </h2>
        <div className="pin-spacer"></div>
      </div>
      
      <div className="pin-success">
        <div className="pin-success-icon">✓</div>
        <p>{message}</p>
      </div>
    </div>
  );
}

export default PinPage;