import React, { useEffect, useMemo, useState } from 'react';
import PinCode from './PinCode';
import './PinCode.css';

const BUILD_VERSION = 'PIN_BUILD_2026_03_12_1838';

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
    const tg = window.Telegram?.WebApp;

    const payload = {
      success: true,
      action,
      userId,
      token,
      ts: Date.now(),
      build: BUILD_VERSION
    };

    try {
      const json = JSON.stringify(payload);
      console.log('SEND DATA:', json);
      setDebug(`sending: ${json}`);

      if (!tg) {
        setDebug(`ERROR: Telegram WebApp missing | ${BUILD_VERSION}`);
        alert('Telegram WebApp недоступен');
        return;
      }

      tg.sendData(json);
      setSent(true);
      setDebug(`data sent successfully | ${BUILD_VERSION}`);
    } catch (error) {
      console.error('sendData error:', error);
      setDebug(`send error: ${error.message} | ${BUILD_VERSION}`);
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
    return <div style={{ padding: 20 }}>Загрузка...</div>;
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

        <div style={{ marginTop: 20, fontSize: 12, color: '#666', wordBreak: 'break-word' }}>
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

      <div style={{ marginTop: 20, padding: 12, fontSize: 12, color: '#666', wordBreak: 'break-word' }}>
        version: {BUILD_VERSION}
        <br />
        debug: {debug}
      </div>
    </div>
  );
}

export default PinPage;