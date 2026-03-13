import React, { useEffect, useMemo, useState } from 'react';
import PinCode from './PinCode';
import './PinCode.css';

const BUILD_VERSION = 'PIN_REAL_2026_03_12_1905';

function PinPage() {
  const [userId, setUserId] = useState('');
  const [action, setAction] = useState('create_check');
  const [debug, setDebug] = useState('init');
  const [isReady, setIsReady] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    try {
      if (tg) {
        tg.ready();
        tg.expand();
        setDebug(`Telegram WebApp ready | ${BUILD_VERSION}`);
      } else {
        setDebug(`Telegram WebApp NOT found | ${BUILD_VERSION}`);
      }
    } catch (e) {
      console.error('WebApp init error:', e);
      setDebug(`WebApp init error: ${e.message} | ${BUILD_VERSION}`);
    }

    const params = new URLSearchParams(window.location.search);
    const queryUserId = params.get('userId') || '';
    const queryAction = params.get('action') || 'create_check';

    setUserId(queryUserId);
    setAction(queryAction);
    setIsReady(true);
  }, []);

  const requiredActionText = useMemo(() => {
    if (action === 'create_check') return 'создание чека';
    return 'подтверждение действия';
  }, [action]);

  const handlePinSuccess = (token) => {
  console.log('✅ PIN подтверждён');
  
  if (window.Telegram?.WebApp) {
    // Очищаем старые токены
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('user_token_')) {
        localStorage.removeItem(key);
      }
    });
    
    // Сохраняем новый токен с меткой времени
    const now = Date.now();
    localStorage.setItem(`user_token_${userId}`, token);
    localStorage.setItem(`user_token_expires_${userId}`, now + 15 * 60 * 1000);
    
    // Отправляем данные
    const data = JSON.stringify({ 
      success: true, 
      token: token 
    });
    
    window.Telegram.WebApp.sendData(data);
    window.Telegram.WebApp.close();
  }
};

  const handleBack = () => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      try {
        tg.close();
      } catch (e) {
        console.error('close error:', e);
      }
    } else {
      window.history.back();
    }
  };

  if (!isReady) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        Загрузка...
      </div>
    );
  }

  if (sent) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h3>✅ PIN подтверждён</h3>
        <p>Данные отправлены в бота.</p>
        <p style={{ fontSize: 12, color: '#666' }}>
          Версия: {BUILD_VERSION}
        </p>

        <button
          onClick={handleBack}
          style={{
            marginTop: 20,
            padding: '12px 18px',
            borderRadius: 10,
            border: 'none',
            background: '#2AABEE',
            color: '#fff',
            fontSize: 16
          }}
        >
          Закрыть
        </button>

        <div
          style={{
            marginTop: 20,
            fontSize: 12,
            color: '#666',
            wordBreak: 'break-word',
            textAlign: 'left'
          }}
        >
          debug: {debug}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PinCode
        userId={userId}
        mode="enter"
        requiredAction={requiredActionText}
        onSuccess={handlePinSuccess}
        onBack={handleBack}
      />

      <div
        style={{
          marginTop: 20,
          padding: 12,
          fontSize: 12,
          color: '#666',
          wordBreak: 'break-word'
        }}
      >
        version: {BUILD_VERSION}
        <br />
        debug: {debug}
      </div>
    </div>
  );
}

export default PinPage;