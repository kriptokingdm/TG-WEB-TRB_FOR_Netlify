import React, { useEffect, useState } from 'react';

const BUILD_VERSION = 'IOS_TEST_001';

function PinPage() {
  const [debug, setDebug] = useState('init');
  const [userId, setUserId] = useState('');
  const [action, setAction] = useState('create_check');

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg) {
      try {
        tg.ready();
        tg.expand();
        setDebug(`WebApp ready | ${BUILD_VERSION}`);
      } catch (e) {
        setDebug(`WebApp init error: ${e.message}`);
      }
    } else {
      setDebug(`WebApp NOT FOUND | ${BUILD_VERSION}`);
    }

    const params = new URLSearchParams(window.location.search);
    setUserId(params.get('userId') || '');
    setAction(params.get('action') || 'create_check');
  }, []);

  const sendTestData = () => {
    const tg = window.Telegram?.WebApp;

    if (!tg) {
      alert('Telegram WebApp not found');
      setDebug('send failed: no Telegram WebApp');
      return;
    }

    const payload = {
      success: true,
      action,
      userId,
      token: 'TEST_TOKEN_FROM_IPHONE',
      ts: Date.now(),
      build: BUILD_VERSION
    };

    try {
      const json = JSON.stringify(payload);
      tg.sendData(json);
      setDebug(`DATA SENT: ${json}`);
    } catch (e) {
      setDebug(`sendData error: ${e.message}`);
      alert(e.message);
    }
  };

  const closeApp = () => {
    const tg = window.Telegram?.WebApp;
    if (tg) tg.close();
  };

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h2>TEST PIN PAGE</h2>

      <div style={{ marginBottom: 12 }}>
        <b>Version:</b> {BUILD_VERSION}
      </div>

      <div style={{ marginBottom: 12 }}>
        <b>User ID:</b> {userId || 'empty'}
      </div>

      <div style={{ marginBottom: 12 }}>
        <b>Action:</b> {action}
      </div>

      <div
        style={{
          marginBottom: 20,
          padding: 12,
          background: '#f3f3f3',
          borderRadius: 8,
          wordBreak: 'break-word',
          fontSize: 12
        }}
      >
        {debug}
      </div>

      <button
        onClick={sendTestData}
        style={{
          width: '100%',
          padding: 16,
          borderRadius: 10,
          border: 'none',
          background: '#2AABEE',
          color: '#fff',
          fontSize: 16,
          marginBottom: 12
        }}
      >
        SEND TEST DATA
      </button>

      <button
        onClick={closeApp}
        style={{
          width: '100%',
          padding: 16,
          borderRadius: 10,
          border: '1px solid #ccc',
          background: '#fff',
          color: '#000',
          fontSize: 16
        }}
      >
        CLOSE
      </button>
    </div>
  );
}

export default PinPage;