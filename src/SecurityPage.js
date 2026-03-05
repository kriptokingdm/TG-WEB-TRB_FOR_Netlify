// SecurityPage.js - Страница безопасности с PIN и восстановлением
import React, { useState, useEffect } from 'react';
import PinCode from './PinCode'; // 👈 ВАЖНО! ИМПОРТИРУЕМ PINCODE
import './PinCode.css';

const API_BASE_URL = 'https://tethrab.shop';

const vibrate = (pattern = 10) => {
  if (window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(pattern);
  }
};

const SecurityPage = ({ userId, onBack }) => {
  const [mode, setMode] = useState('main'); // main, pin, recovery
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [resetToken, setResetToken] = useState(null);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState('question');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        console.log('📥 Загрузка вопросов для пользователя:', userId);
        const response = await fetch(`${API_BASE_URL}/api/security/questions`);
        const data = await response.json();
        console.log('📥 Ответ от API:', data);
        if (data.success) setQuestions(data.questions);
      } catch (error) {
        console.error('❌ Ошибка загрузки вопросов:', error);
        setError('Не удалось загрузить вопросы. Проверьте соединение.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [userId]);

  const handleRecovery = async () => {
    if (!selectedQuestion || !answer) {
      setError('Выберите вопрос и введите ответ');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/security/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, answer })
      });

      const data = await response.json();
      console.log('📥 Ответ verify:', data);
      
      if (data.success) {
        setResetToken(data.resetToken);
        setStep('newPin');
        setError('');
      } else {
        setError('Неверный ответ');
      }
    } catch (err) {
      console.error('❌ Ошибка verify:', err);
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPin = async () => {
    if (newPin.length !== 6 || newPin !== confirmPin) {
      setError('ПИН-коды не совпадают или не 6 цифр');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/security/reset-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, resetToken, newPin })
      });

      const data = await response.json();
      console.log('📥 Ответ reset:', data);
      
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        setError('Ошибка сброса');
      }
    } catch (err) {
      console.error('❌ Ошибка reset:', err);
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  if (loading && mode === 'recovery') {
    return (
      <div className="pin-container">
        <div className="pin-header">
          <button className="pin-back" onClick={() => setMode('main')}>← Назад</button>
          <h2 className="pin-title">Загрузка...</h2>
          <div className="pin-spacer"></div>
        </div>
        <div className="pin-loading">Пожалуйста, подождите</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="pin-container">
        <div className="pin-header">
          <button className="pin-back" onClick={onBack}>← Назад</button>
          <h2 className="pin-title">Успешно!</h2>
          <div className="pin-spacer"></div>
        </div>
        <div className="pin-success">
          <div className="pin-success-icon">✓</div>
          <p>ПИН-код успешно изменён!</p>
        </div>
      </div>
    );
  }

  if (mode === 'pin') {
    return (
      <PinCode
        userId={userId}
        mode="enter"
        requiredAction="безопасности"
        onSuccess={() => setMode('main')}
        onBack={() => setMode('main')}
      />
    );
  }

  if (mode === 'recovery') {
    if (step === 'question') {
      return (
        <div className="pin-container">
          <div className="pin-header">
            <button className="pin-back" onClick={() => setMode('main')}>← Назад</button>
            <h2 className="pin-title">Восстановление</h2>
            <div className="pin-spacer"></div>
          </div>

          <p className="pin-instruction">Выберите вопрос и дайте ответ</p>

          {error && <p className="pin-error">{error}</p>}

          <div className="security-questions">
            {questions.map(q => (
              <button
                key={q.id}
                className={`security-question-btn ${selectedQuestion === q.id ? 'selected' : ''}`}
                onClick={() => setSelectedQuestion(q.id)}
              >
                {q.text}
              </button>
            ))}
          </div>

          <input
            type="text"
            className="security-answer"
            placeholder="Ваш ответ"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />

          <button
            className="security-submit"
            onClick={handleRecovery}
            disabled={!selectedQuestion || !answer || loading}
          >
            {loading ? 'Проверка...' : 'Проверить ответ'}
          </button>
        </div>
      );
    }

    if (step === 'newPin') {
      return (
        <div className="pin-container">
          <div className="pin-header">
            <button className="pin-back" onClick={() => setStep('question')}>← Назад</button>
            <h2 className="pin-title">Новый ПИН-код</h2>
            <div className="pin-spacer"></div>
          </div>

          <p className="pin-instruction">Придумайте новый 6-значный код</p>

          <div className="pin-dots">
            {newPin.split('').concat(Array(6 - newPin.length).fill('')).map((digit, i) => (
              <div key={i} className={`pin-dot ${digit ? 'filled' : ''}`} />
            ))}
          </div>

          <p className="pin-instruction">Подтвердите код</p>

          <div className="pin-dots">
            {confirmPin.split('').concat(Array(6 - confirmPin.length).fill('')).map((digit, i) => (
              <div key={i} className={`pin-dot ${digit ? 'filled' : ''}`} />
            ))}
          </div>

          {error && <p className="pin-error">{error}</p>}

          <div className="pin-keypad">
            {[1,2,3,4,5,6,7,8,9,0].map(num => (
              <button
                key={num}
                className="pin-key"
                onClick={() => {
                  vibrate();
                  if (newPin.length < 6) {
                    setNewPin(newPin + num);
                  } else if (confirmPin.length < 6) {
                    setConfirmPin(confirmPin + num);
                  }
                }}
              >
                {num}
              </button>
            ))}
          </div>

          <div className="pin-keypad">
            <button
              key="delete"
              className="pin-key delete"
              onClick={() => {
                vibrate();
                if (confirmPin.length > 0) {
                  setConfirmPin(confirmPin.slice(0, -1));
                } else if (newPin.length > 0) {
                  setNewPin(newPin.slice(0, -1));
                }
              }}
            >
              ⌫
            </button>
          </div>

          <button
            className="security-submit"
            onClick={handleSetNewPin}
            disabled={newPin.length !== 6 || confirmPin.length !== 6 || loading}
          >
            {loading ? 'Установка...' : 'Установить новый PIN'}
          </button>
        </div>
      );
    }
  }

  // Главное меню безопасности
  return (
    <div className="pin-container">
      <div className="pin-header">
        <button className="pin-back" onClick={onBack}>← Назад</button>
        <h2 className="pin-title">Безопасность</h2>
        <div className="pin-spacer"></div>
      </div>

      <div className="security-main">
        <button
          className="security-main-btn"
          onClick={() => setMode('pin')}
        >
          <span className="security-icon">🔐</span>
          <span className="security-text">
            <strong>ПИН-код</strong>
            <small>Установить или изменить код</small>
          </span>
          <span className="security-arrow">›</span>
        </button>

        <button
          className="security-main-btn"
          onClick={() => setMode('recovery')}
        >
          <span className="security-icon">🔄</span>
          <span className="security-text">
            <strong>Восстановление</strong>
            <small>Забыли PIN? Восстановите через вопросы</small>
          </span>
          <span className="security-arrow">›</span>
        </button>
      </div>
    </div>
  );
};

export default SecurityPage;