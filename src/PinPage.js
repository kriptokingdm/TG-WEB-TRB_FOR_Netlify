// PinPage.js - Страница для ввода PIN-кода (СПЕЦИАЛЬНО ДЛЯ iOS)
import React, { useState, useEffect } from 'react';
import PinCode from './PinCode';
import './PinCode.css';

function PinPage() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState(null);
  const [action, setAction] = useState(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get('userId');
    const actionParam = urlParams.get('action');
    
    console.log('🔍 PinPage загружена:', { userId: userIdParam, action: actionParam });
    setUserId(userIdParam);
    setAction(actionParam);
  }, []);

  const handlePinSuccess = async (token) => {
    console.log('✅ PIN успешно подтверждён, токен:', token);
    
    if (sent) return;
    setSent(true);
    
    setStatus('success');
    setMessage('PIN подтверждён!');

    const dataToSend = {
      success: true,
      token: token,
      userId: userId,
      action: action
    };
    
    const jsonString = JSON.stringify(dataToSend);
    console.log('📤 Отправка данных в бота:', jsonString);

    if (window.Telegram?.WebApp) {
      try {
        // iOS ХАК: отправляем и сразу закрываем
        window.Telegram.WebApp.sendData(jsonString);
        console.log('✅ Данные отправлены');
        
        // iPhone требует больше времени
        setTimeout(() => {
          console.log('📤 Закрываю окно');
          window.Telegram.WebApp.close();
        }, 500);
        
      } catch (e) {
        console.error('❌ Ошибка отправки:', e);
        setMessage('Ошибка');
        setTimeout(() => window.Telegram.WebApp.close(), 500);
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
        <h2 className="pin-title">Успешно!</h2>
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