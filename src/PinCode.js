// PinCode.js - Компонент для ввода 6-значного PIN-кода (РАБОЧАЯ ВЕРСИЯ)
import React, { useState, useEffect, useRef } from 'react';
import './PinCode.css';

const API_BASE_URL = 'https://tethrab.shop';

const vibrate = (pattern = 10) => {
  if (window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(pattern);
  }
};

const PinCode = ({ userId, onSuccess, onBack, mode = 'setup', requiredAction }) => {
  // Логируем userId при монтировании компонента
  useEffect(() => {
    console.log('🔍 PinCode получил userId:', userId);
    console.log('📌 Режим:', mode);
    console.log('🎯 Действие:', requiredAction);
  }, [userId, mode, requiredAction]);

  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState(mode === 'setup' ? 'create' : 'enter');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [lockTime, setLockTime] = useState(null);
  const [firstPinValue, setFirstPinValue] = useState('');
  
  const inputRefs = useRef([]);

  // Автофокус
  useEffect(() => {
    const currentStep = step === 'create' || step === 'enter' ? pin : confirmPin;
    const emptyIndex = currentStep.findIndex(d => d === '');
    if (emptyIndex !== -1 && inputRefs.current[emptyIndex]) {
      inputRefs.current[emptyIndex].focus();
    }
  }, [pin, confirmPin, step]);

  const handleDigitPress = (digit, index, type) => {
    vibrate(6);
    
    if (type === 'pin') {
      const newPin = [...pin];
      newPin[index] = digit;
      setPin(newPin);
      
      // Если заполнили все 6 цифр в режиме создания
      if (index === 5 && step === 'create') {
        const fullPin = newPin.join('');
        console.log('✅ Первый PIN введён полностью:', fullPin);
        setFirstPinValue(fullPin);
        setTimeout(() => {
          setStep('confirm');
          setConfirmPin(['', '', '', '', '', '']);
        }, 100);
      }
      
      // Если заполнили все 6 цифр в режиме ввода
      if (index === 5 && step === 'enter') {
        setTimeout(() => handleVerify(), 100);
      }
    } else if (type === 'confirm') {
      const newConfirm = [...confirmPin];
      newConfirm[index] = digit;
      setConfirmPin(newConfirm);
      
      // Если заполнили все 6 цифр подтверждения
      if (index === 5) {
        const fullConfirm = newConfirm.join('');
        console.log('✅ Второй PIN введён полностью:', fullConfirm);
        setTimeout(() => handleCreate(fullConfirm), 50);
      }
    }
  };

  const handleDelete = (type) => {
    vibrate(8);
    
    if (type === 'pin') {
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

  // СОЗДАНИЕ PIN
  const handleCreate = async (confirmPinValue) => {
    // ПРОВЕРЯЕМ userId перед отправкой
    if (!userId) {
      setError('Ошибка: пользователь не идентифицирован');
      return;
    }

    console.log('📝 PIN из первого ввода:', firstPinValue);
    console.log('📝 PIN из подтверждения:', confirmPinValue);
    
    if (firstPinValue !== confirmPinValue) {
      vibrate(20);
      setError('ПИН-коды не совпадают');
      // Возвращаемся к первому шагу
      setStep('create');
      setPin(['', '', '', '', '', '']);
      setConfirmPin(['', '', '', '', '', '']);
      setFirstPinValue('');
      return;
    }

    setLoading(true);
    try {
      console.log('📤 Отправка запроса на создание PIN:', { userId, pin: firstPinValue });
      
      const response = await fetch(`${API_BASE_URL}/api/pin/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, pin: firstPinValue })
      });

      const data = await response.json();
      console.log('📥 Ответ сервера:', data);

      if (data.success) {
        vibrate(12);
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1000);
      } else {
        setError(data.error || 'Ошибка создания PIN');
        // Возвращаемся к первому шагу
        setStep('create');
        setPin(['', '', '', '', '', '']);
        setConfirmPin(['', '', '', '', '', '']);
        setFirstPinValue('');
      }
    } catch (error) {
      console.error('❌ Ошибка:', error);
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  // ПРОВЕРКА PIN
  // ПРОВЕРКА PIN
const handleVerify = async () => {
  if (!userId) {
    setError('Ошибка: пользователь не идентифицирован');
    return;
  }

  const pinString = pin.join('');
  
  setLoading(true);
  try {
    console.log('📤 Отправка запроса на проверку PIN:', { userId, pin: pinString });
    
    const response = await fetch(`${API_BASE_URL}/api/pin/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, pin: pinString })
    });

    const data = await response.json();
    console.log('📥 Ответ сервера:', data);

    if (data.success) {
      vibrate(12);
      setSuccess(true);
      
      localStorage.setItem(`user_token_${userId}`, data.token);
      localStorage.setItem(`user_token_expires_${userId}`, Date.now() + data.expires_in * 1000);
      
      setTimeout(() => {
        onSuccess(data.token);
      }, 1000);
    } else {
      // ЕСЛИ PIN НЕ НАЙДЕН (404) - ПРЕДЛАГАЕМ СОЗДАТЬ
      if (data.error && data.error.includes('PIN not set')) {
        setError('PIN-код не установлен. Создайте новый.');
        setStep('create');
        setPin(['', '', '', '', '', '']);
        setConfirmPin(['', '', '', '', '', '']);
      } else {
        vibrate(20);
        setError(data.error || 'Неверный PIN');
        setPin(['', '', '', '', '', '']);
        if (data.attempts_left !== undefined) {
          setAttemptsLeft(data.attempts_left);
        }
        if (data.error && data.error.includes('через')) {
          setLockTime(new Date());
        }
      }
    }
  } catch (error) {
    console.error('❌ Ошибка:', error);
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
            const currentStep = type === 'pin' ? pin : confirmPin;
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
          const currentStep = type === 'pin' ? pin : confirmPin;
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
        {(step === 'create' || step === 'enter' ? pin : confirmPin).map((digit, index) => (
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
        {renderKeypad(step === 'create' || step === 'enter' ? 'pin' : 'confirm')}
      </div>

      {/* Загрузка */}
      {loading && <div className="pin-loading">Проверка...</div>}
    </div>
  );
};

export default PinCode;