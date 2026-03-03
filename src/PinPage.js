// PinPage.js - Страница для ввода PIN-кода перед созданием чека
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PinCode from './PinCode';
import './PinCode.css'; // 👈 Импортируем те же стили

const API_BASE_URL = 'https://tethrab.shop';

function PinPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [theme, setTheme] = useState('light');

  const userId = searchParams.get('userId');
  const action = searchParams.get('action');

  // Получаем тему из Telegram
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      const theme = tg.colorScheme || 'light';
      setTheme(theme);
      document.documentElement.setAttribute('data-theme', theme);
      console.log('🎨 Тема Telegram:', theme);
    }
  }, []);

  useEffect(() => {
    console.log('🔍 PinPage загружена:', { userId, action });
  }, [userId, action]);

  const handlePinSuccess = async (token) => {
    setStatus('success');
    setMessage('PIN подтверждён! Закрываю окно...');

    // Отправляем результат обратно в бота
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.sendData(JSON.stringify({
        success: true,
        token: token
      }));
    }

    // Закрываем WebApp
    setTimeout(() => {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.close();
      }
    }, 1500);
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