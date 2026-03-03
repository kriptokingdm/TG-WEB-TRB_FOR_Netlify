// PinCode.js - Компонент для ввода 6-значного PIN-кода (с сервером)
import React, { useState, useEffect, useRef } from 'react';
import './PinCode.css';

const API_BASE_URL = 'https://tethrab.shop';

const vibrate = (pattern = 10) => {
  if (window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(pattern);
  }
};

const PinCode = ({ userId, onSuccess, onBack, mode = 'setup', requiredAction }) => {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState(mode === 'setup' ? 'create' : 'enter');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [lockTime, setLockTime] = useState(null);
  
  const inputRefs = useRef([]);

  // Проверяем, есть ли PIN на сервере
  useEffect(() => {
    if (mode === 'enter') {
      // Можно сделать проверку, но пока просто показываем ввод
    }
  }, [mode]);

  // Автофокус
  useEffect(() => {
    const currentStep = step === 'create' ? pin : confirmPin;
    const emptyIndex = currentStep.findIndex(d => d === '');
    if (emptyIndex !== -1 && inputRefs.current[emptyIndex]) {
      inputRefs.current[emptyIndex].focus();
    }
  }, [pin, confirmPin, step]);

  const handleDigitPress = (digit, index, type) => {
    vibrate(6);
    
    if (type === 'create') {
      const newPin = [...pin];
      newPin[index] = digit;
      setPin(newPin);
      
      if (index === 5 && step === 'create') {
        setTimeout(() => setStep('confirm'), 100);
      }
    } else {
      const newConfirm = [...confirmPin];
      newConfirm[index] = digit;
      setConfirmPin(newConfirm);
      
      if (index === 5 && step === 'confirm') {
        setTimeout(() => handleCreate(), 100);
      }
      if (index === 5 && step === 'enter') {
        setTimeout(() => handleVerify(), 100);
      }
    }
  };

  const handleDelete = (type) => {
    vibrate(8);
    
    if (type === 'create') {
      const lastIndex = pin.findLastIndex(d => d !== '');
      if (lastIndex !== -1) {
        const newPin = [...pin];
        newPin[lastIndex] = '';
        setPin(newPin);
      }
    } else {
      const lastIndex = confirmPin.findLastIndex(d => d !== '');
      if (lastIndex !== -1) {
        const newConfirm = [...confirmPin];
        newConfirm[lastIndex] = '';
        setConfirmPin(newConfirm);
      }
    }
  };

  // Создание PIN
  const handleCreate = async () => {
    const pinString = pin.join('');
    const confirmString = confirmPin.join('');
    
    if (pinString !== confirmString) {
      vibrate(20);
      setError('ПИН-коды не совпадают');
      setPin(['', '', '', '', '', '']);
      setConfirmPin(['', '', '', '', '', '']);
      setStep('create');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/pin/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, pin: pinString })
      });

      const data = await response.json();

      if (data.success) {
        vibrate(12);
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1000);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  // Проверка PIN
  const handleVerify = async () => {
    const pinString = pin.join('');
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/pin/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, pin: pinString })
      });

      const data = await response.json();

      if (data.success) {
        vibrate(12);
        setSuccess(true);
        
        // Сохраняем токен в localStorage
        localStorage.setItem(`user_token_${userId}`, data.token);
        localStorage.setItem(`user_token_expires_${userId}`, Date.now() + data.expires_in * 1000);
        
        setTimeout(() => {
          onSuccess(data.token);
        }, 1000);
      } else {
        vibrate(20);
        setError(data.error);
        setPin(['', '', '', '', '', '']);
        if (data.attempts_left !== undefined) {
          setAttemptsLeft(data.attempts_left);
        }
        if (data.error.includes('через')) {
          setLockTime(new Date());
        }
      }
    } catch (error) {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  // Рендер клавиатуры
  const renderKeypad = (type) => {
    const buttons = [];
    for (let i = 1; i <= 9; i++) {
      buttons.push(
        <button
          key={i}
          className="pin-key"
          disabled={loading || lockTime}
          onClick={() => {
            const currentStep = step === 'create' ? pin : confirmPin;
            const emptyIndex = currentStep.findIndex(d => d === '');
            if (emptyIndex !== -1) {
              handleDigitPress(i.toString(), emptyIndex, type);
            }
          }}
        >
          {i}
        </button>
      );
    }
    
    buttons.push(
      <button key="empty" className="pin-key empty" disabled></button>
    );
    
    buttons.push(
      <button
        key="0"
        className="pin-key"
        disabled={loading || lockTime}
        onClick={() => {
          const currentStep = step === 'create' ? pin : confirmPin;
          const emptyIndex = currentStep.findIndex(d => d === '');
          if (emptyIndex !== -1) {
            handleDigitPress('0', emptyIndex, type);
          }
        }}
      >
        0
      </button>
    );
    
    buttons.push(
      <button
        key="delete"
        className="pin-key delete"
        disabled={loading || lockTime}
        onClick={() => handleDelete(type)}
      >
        ⌫
      </button>
    );
    
    return buttons;
  };

  if (success) {
    return (
      <div className="pin-container">
        <div className="pin-header">
          <button className="pin-back" onClick={onBack}>
            ← Назад
          </button>
          <h2 className="pin-title">Успешно!</h2>
          <div className="pin-spacer"></div>
        </div>
        
        <div className="pin-success">
          <div className="pin-success-icon">✓</div>
          <p>
            {mode === 'setup' 
              ? 'ПИН-код установлен' 
              : requiredAction 
                ? `Доступ к ${requiredAction} разрешён` 
                : 'ПИН-код подтверждён'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pin-container">
      {/* Header */}
      <div className="pin-header">
        <button className="pin-back" onClick={onBack} disabled={loading}>
          ← Назад
        </button>
        <h2 className="pin-title">
          {step === 'create' && 'Создание ПИН-кода'}
          {step === 'confirm' && 'Подтвердите ПИН-код'}
          {mode === 'enter' && step === 'enter' && 'Введите ПИН-код'}
        </h2>
        <div className="pin-spacer"></div>
      </div>

      {/* Инструкция */}
      <p className="pin-instruction">
        {step === 'create' && 'Придумайте 6-значный код'}
        {step === 'confirm' && 'Введите код ещё раз'}
        {mode === 'enter' && step === 'enter' && (
          lockTime ? 'Доступ заблокирован' : 'Введите ваш ПИН-код'
        )}
      </p>

      {/* Индикаторы ПИН-кода */}
      <div className="pin-dots">
        {(step === 'create' ? pin : confirmPin).map((digit, index) => (
          <div
            key={index}
            className={`pin-dot ${digit !== '' ? 'filled' : ''}`}
          />
        ))}
      </div>

      {/* Ошибка */}
      {error && <p className="pin-error">{error}</p>}

      {/* Осталось попыток */}
      {mode === 'enter' && step === 'enter' && attemptsLeft < 5 && !lockTime && (
        <p className="pin-attempts">
          Осталось попыток: {attemptsLeft}
        </p>
      )}

      {/* Клавиатура */}
      <div className="pin-keypad">
        {renderKeypad(step === 'create' ? 'create' : 'confirm')}
      </div>

      {/* Загрузка */}
      {loading && <div className="pin-loading">Проверка...</div>}
    </div>
  );
};

export default PinCode;