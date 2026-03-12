import React, { useEffect, useMemo, useState } from 'react';
import PinCode from './PinCode';
import './PinCode.css';

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
        setDebug('Telegram WebApp ready');
      } else {
        setDebug('Telegram WebApp NOT found');
      }
    } catch (e) {
      console.error('WebApp init error:', e);
      setDebug(`WebApp init error: ${e.message}`);
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
    const tg = window.Telegram?.WebApp;

    const payload = {
      success: true,
      action,
      userId,
      token,
      ts: Date.now()
    };

    try {
      const json = JSON.stringify(payload);
      console.log('📤 SEND DATA:', json);
      setDebug(`sending: ${json}`);

      if (!tg) {
        setDebug('ERROR: Telegram WebApp missing');
        alert('Telegram WebApp недоступен');
        return;
      }

      tg.sendData(json);

      setSent(true);
      setDebug('data sent successfully, now return to chat manually');
    } catch (error) {
      console.error('sendData error:', error);
      setDebug(`send error: ${error.message}`);
      alert(`Ошибка отправки: ${error.message}`);
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
        <p style={{ marginTop: 12 }}>
          Данные отправлены в бота.
        </p>
        <p style={{ marginTop: 8, fontSize: 13, color: '#666' }}>
          Если вы на iPhone, не закрывайте окно мгновенно.
          Подождите 2–3 секунды и нажмите кнопку ниже.
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
            fontSize: 16,
            cursor: 'pointer'
          }}
        >
          Закрыть
        </button>

        <div
          style={{
            marginTop: 20,
            padding: 12,
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
        debug: {debug}
      </div>
    </div>
  );
}

export default PinPage;