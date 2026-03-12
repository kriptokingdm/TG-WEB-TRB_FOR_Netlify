// PinPage.js - Максимально простой и стабильный для iPhone / Telegram WebApp
import React, { useEffect, useMemo, useState } from 'react';
import PinCode from './PinCode';
import './PinCode.css';

function PinPage() {
  const [userId, setUserId] = useState('');
  const [action, setAction] = useState('create_check');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg) {
      try {
        tg.ready();
        tg.expand();
      } catch (e) {
        console.error('Telegram WebApp init error:', e);
      }
    }

    const params = new URLSearchParams(window.location.search);
    const queryUserId = params.get('userId') || '';
    const queryAction = params.get('action') || 'create_check';

    setUserId(queryUserId);
    setAction(queryAction);
    setIsReady(true);
  }, []);

  const requiredActionText = useMemo(() => {
    switch (action) {
      case 'create_check':
        return 'создание чека';
      default:
        return 'подтверждение действия';
    }
  }, [action]);

  const handlePinSuccess = (token) => {
    console.log('✅ PIN подтверждён', { action, userId });

    const tg = window.Telegram?.WebApp;

    const payload = {
      success: true,
      action,
      userId,
      token
    };

    if (!tg) {
      console.error('❌ Telegram WebApp недоступен');
      alert('Ошибка: Telegram WebApp недоступен');
      return;
    }

    try {
      const json = JSON.stringify(payload);
      console.log('📤 Отправка данных в бот:', json);

      tg.sendData(json);

      // Небольшая задержка полезна на iPhone, чтобы данные успели уйти
      setTimeout(() => {
        try {
          tg.close();
        } catch (e) {
          console.error('Ошибка закрытия WebApp:', e);
        }
      }, 300);
    } catch (error) {
      console.error('❌ Ошибка отправки данных в бот:', error);
      alert('Ошибка отправки данных');
    }
  };

  const handleBack = () => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      try {
        tg.close();
      } catch (e) {
        console.error('Ошибка закрытия WebApp:', e);
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

  return (
    <PinCode
      userId={userId}
      mode="enter"
      requiredAction={requiredActionText}
      onSuccess={handlePinSuccess}
      onBack={handleBack}
    />
  );
}

export default PinPage;