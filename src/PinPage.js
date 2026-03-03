// PinPage.js - Страница для ввода PIN-кода перед созданием чека
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PinCode from './PinCode';

const API_BASE_URL = 'https://tethrab.shop';

function PinPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  const userId = searchParams.get('userId');
  const action = searchParams.get('action');

  useEffect(() => {
    console.log('🔍 PinPage загружена:', { userId, action });
  }, [userId, action]);

  const handlePinSuccess = async (token) => {
    setStatus('success');
    setMessage('PIN подтверждён! Создаю чек...');

    // Сохраняем токен в localStorage
    if (token) {
      localStorage.setItem(`user_token_${userId}`, token);
      localStorage.setItem(`user_token_expires_${userId}`, Date.now() + 15 * 60 * 1000);
    }

    // Перенаправляем обратно в бота с подтверждением
    setTimeout(() => {
      window.Telegram?.WebApp?.close();
    }, 1500);
  };

  const handlePinBack = () => {
    window.Telegram?.WebApp?.close();
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'var(--tg-theme-bg-color, #ffffff)',
      color: 'var(--tg-theme-text-color, #000000)',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: status === 'success' ? '#34c759' : '#ff3b30',
        color: 'white',
        fontSize: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px'
      }}>
        {status === 'success' ? '✓' : '✗'}
      </div>
      <h2>{message}</h2>
      <p style={{ marginTop: '20px', color: 'var(--tg-theme-hint-color)' }}>
        Вернитесь в бота через несколько секунд...
      </p>
    </div>
  );
}

export default PinPage;