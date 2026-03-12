// PinPage.js - Максимально простой для iPhone
import React, { useState, useEffect } from 'react';
import PinCode from './PinCode';
import './PinCode.css';

function PinPage() {
  const [status, setStatus] = useState('loading');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUserId(params.get('userId'));
  }, []);

  const handlePinSuccess = (token) => {
    console.log('✅ PIN подтверждён');
    
    if (window.Telegram?.WebApp) {
      // Максимально простые данные
      const data = JSON.stringify({ 
        success: true, 
        token: token 
      });
      
      // Отправляем и сразу закрываем
      window.Telegram.WebApp.sendData(data);
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
        onBack={() => window.Telegram?.WebApp?.close()}
      />
    );
  }

  return null;
}

export default PinPage;