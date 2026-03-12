import React, { useEffect, useMemo, useState } from 'react';
import PinCode from './PinCode';
import './PinCode.css';

function PinPage() {
  const [userId, setUserId] = useState('');
  const [action, setAction] = useState('create_check');
  const [debug, setDebug] = useState('init');
  const [isReady, setIsReady] = useState(false);

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
      console.error(e);
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

  const handlePinSuccess = async (token) => {
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
      console.log('SEND DATA:', json);
      setDebug(`sending: ${json}`);

      if (!tg) {
        setDebug('ERROR: Telegram WebApp missing');
        alert('Telegram WebApp недоступен');
        return;
      }

      tg.sendData(json);

      // На iPhone нельзя закрывать сразу
      setDebug('data sent, waiting before close...');

      setTimeout(() => {
        try {
          tg.close();
        } catch (e) {
          console.error('close error', e);
          setDebug(`close error: ${e.message}`);
        }
      }, 1200);
    } catch (error) {
      console.error('sendData error', error);
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
        console.error(e);
      }
    } else {
      window.history.back();
    }
  };

  if (!isReady) {
    return <div style={{ padding: 20 }}>Загрузка...</div>;
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