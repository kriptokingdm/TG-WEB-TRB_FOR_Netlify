// PinCode.js - Компонент для ввода 6-значного PIN-кода
import React, { useState, useEffect, useRef } from 'react';
import './PinCode.css';

// Функция для вибрации
const vibrate = (pattern = 10) => {
  if (window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(pattern);
  }
};

const PinCode = ({ onSuccess, onBack, mode = 'setup', userId }) => {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState(mode === 'setup' ? 'create' : 'enter');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const inputRefs = useRef([]);

  // Загружаем PIN из localStorage при монтировании
  useEffect(() => {
    if (mode === 'enter') {
      const savedPin = localStorage.getItem(`user_pin_${userId}`);
      if (!savedPin) {
        setError('ПИН-код не установлен. Сначала создайте его.');
        setStep('create');
      }
    }
  }, [mode, userId]);

  // Автофокус на следующий инпут
  useEffect(() => {
    const currentStep = step === 'create' ? pin : confirmPin;
    const emptyIndex = currentStep.findIndex(d => d === '');
    if (emptyIndex !== -1 && inputRefs.current[emptyIndex]) {
      inputRefs.current[emptyIndex].focus();
    }
  }, [pin, confirmPin, step]);

  // Обработка ввода цифры
  const handleDigitPress = (digit, index, type) => {
    vibrate(6);
    
    if (type === 'create') {
      const newPin = [...pin];
      newPin[index] = digit;
      setPin(newPin);
      
      // Если это последняя цифра, переходим к подтверждению
      if (index === 5 && step === 'create') {
        setTimeout(() => setStep('confirm'), 100);
      }
    } else {
      const newConfirm = [...confirmPin];
      newConfirm[index] = digit;
      setConfirmPin(newConfirm);
      
      // Если это последняя цифра, проверяем совпадение
      if (index === 5 && step === 'confirm') {
        setTimeout(() => handleConfirm(), 100);
      }
    }
  };

  // Обработка удаления
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

  // Подтверждение ПИН-кода
  const handleConfirm = () => {
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
    
    // Сохраняем в localStorage
    localStorage.setItem(`user_pin_${userId}`, pinString);
    
    vibrate(12);
    setSuccess(true);
    setTimeout(() => {
      onSuccess();
    }, 1000);
  };

  // Ввод существующего ПИН-кода
  const handleEnter = () => {
    const pinString = pin.join('');
    const savedPin = localStorage.getItem(`user_pin_${userId}`);
    
    if (pinString === savedPin) {
      vibrate(12);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } else {
      vibrate(20);
      setError('Неверный ПИН-код');
      setPin(['', '', '', '', '', '']);
    }
  };

  // Очистка ошибки при вводе
  useEffect(() => {
    if (error) setError('');
  }, [pin, confirmPin]);

  // Рендер цифровой клавиатуры
  const renderKeypad = (type) => {
    const buttons = [];
    for (let i = 1; i <= 9; i++) {
      buttons.push(
        <button
          key={i}
          className="pin-key"
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
        onClick={() => handleDelete(type)}
      >
        ⌫
      </button>
    );
    
    return buttons;
  };

  // Если успех — показываем анимацию
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
          <p>ПИН-код подтверждён</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pin-container">
      {/* Header */}
      <div className="pin-header">
        <button className="pin-back" onClick={onBack}>
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
        {mode === 'enter' && step === 'enter' && 'Введите ваш ПИН-код'}
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

      {/* Клавиатура */}
      <div className="pin-keypad">
        {renderKeypad(step === 'create' ? 'create' : 'confirm')}
      </div>

      {/* Кнопка подтверждения (для режима ввода) */}
      {mode === 'enter' && step === 'enter' && pin.every(d => d !== '') && (
        <button
          className="pin-submit"
          onClick={handleEnter}
        >
          Подтвердить
        </button>
      )}
    </div>
  );
};

export default PinCode;