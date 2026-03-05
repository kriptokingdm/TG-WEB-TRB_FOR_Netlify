// SecurityPage.js - Полная система безопасности
import React, { useState, useEffect } from 'react';
import PinCode from './PinCode';
import './PinCode.css';

const API_BASE_URL = 'https://tethrab.shop';

const vibrate = (pattern = 10) => {
  if (window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(pattern);
  }
};

const SecurityPage = ({ userId, onBack }) => {
  const [mode, setMode] = useState('main');
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [resetToken, setResetToken] = useState(null);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState('question');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasPin, setHasPin] = useState(null);
  const [hasQuestion, setHasQuestion] = useState(false);
  const [pinAttempts, setPinAttempts] = useState(0);
  const [showRecovery, setShowRecovery] = useState(false);

  // Проверяем есть ли PIN и вопрос у пользователя
  useEffect(() => {
    const checkUserData = async () => {
      try {
        // Проверяем PIN
        const pinResponse = await fetch(`${API_BASE_URL}/api/pin/check/${userId}`);
        const pinData = await pinResponse.json();
        setHasPin(pinData.exists);

        // Проверяем вопрос
        const questionResponse = await fetch(`${API_BASE_URL}/api/security/user/${userId}`);
        const questionData = await questionResponse.json();
        setHasQuestion(questionData.hasQuestion);
        
        console.log('📌 PIN существует:', pinData.exists);
        console.log('📌 Вопрос существует:', questionData.hasQuestion);
      } catch (error) {
        console.error('❌ Ошибка проверки:', error);
      }
    };
    checkUserData();
  }, [userId]);

  // Загружаем список вопросов
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/security/questions`);
        const data = await response.json();
        if (data.success) setQuestions(data.questions);
      } catch (error) {
        console.error('❌ Ошибка загрузки вопросов:', error);
      }
    };
    fetchQuestions();
  }, []);

  // Успешный PIN-код
  const handlePinSuccess = (token) => {
    vibrate(12);
    
    // Если у пользователя уже есть вопрос - просто закрываем
    if (hasQuestion) {
      setSuccess(true);
      setTimeout(() => onBack(), 1500);
    } else {
      // Если нет вопроса - предлагаем установить
      setMode('setupQuestion');
      setSuccess(false);
    }
  };

  // Неудачный PIN-код
  // Обработчик ошибок от PinCode
const handlePinError = (errorData) => {
  setPinAttempts(prev => prev + 1);
  
  if (errorData.error === 'Invalid PIN' && errorData.attempts_left) {
    if (errorData.attempts_left === 0) {
      setShowRecovery(true);
    }
  } else if (pinAttempts >= 2) { // После 3 неудачных попыток показываем восстановление
    setShowRecovery(true);
  }
};

  // Сохранение секретного вопроса
  const handleSaveQuestion = async () => {
    if (!selectedQuestion || !answer) {
      setError('Выберите вопрос и введите ответ');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/security/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          questionId: selectedQuestion,
          answer 
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        setTimeout(() => onBack(), 2000);
      } else {
        setError(data.error || 'Ошибка сохранения');
      }
    } catch (err) {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  // Восстановление PIN через вопрос
  const handleRecovery = async () => {
    if (!selectedQuestion || !answer) {
      setError('Выберите вопрос и введите ответ');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/security/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, answer })
      });

      const data = await response.json();
      
      if (data.success) {
        setResetToken(data.resetToken);
        setStep('newPin');
        setError('');
      } else {
        setError('Неверный ответ');
      }
    } catch (err) {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  // Установка нового PIN после восстановления
  const handleSetNewPin = async () => {
    if (newPin.length !== 6 || newPin !== confirmPin) {
      setError('ПИН-коды не совпадают или не 6 цифр');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/security/reset-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, resetToken, newPin })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        setTimeout(() => onBack(), 2000);
      } else {
        setError('Ошибка сброса');
      }
    } catch (err) {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  

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
          <p>Операция выполнена успешно!</p>
        </div>
      </div>
    );
  }

  // Режим создания/ввода PIN
  if (mode === 'pin' || mode === 'main' && hasPin === false) {
    return (
      <PinCode
        userId={userId}
        mode={hasPin === false ? 'setup' : 'enter'}
        requiredAction="безопасности"
        onSuccess={handlePinSuccess}
        onError={handlePinError}
        onBack={() => setMode('main')}
        showRecovery={showRecovery}
        onRecovery={() => setMode('recovery')}
      />
    );
  }

  // Режим установки вопроса (после создания PIN)
  if (mode === 'setupQuestion') {
    return (
      <div className="pin-container">
        <div className="pin-header">
          <button className="pin-back" onClick={() => setMode('main')}>← Назад</button>
          <h2 className="pin-title">Настройка безопасности</h2>
          <div className="pin-spacer"></div>
        </div>

        <p className="pin-instruction">
          Для восстановления PIN-кода выберите вопрос и дайте ответ
        </p>

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
          onClick={handleSaveQuestion}
          disabled={!selectedQuestion || !answer || loading}
        >
          {loading ? 'Сохранение...' : 'Сохранить вопрос'}
        </button>

        <button
          className="security-skip"
          onClick={() => onBack()}
        >
          Пропустить (можно настроить позже)
        </button>
      </div>
    );
  }

  // Режим восстановления (забыл PIN)
  if (mode === 'recovery') {
    if (step === 'question') {
      return (
        <div className="pin-container">
          <div className="pin-header">
            <button className="pin-back" onClick={() => setMode('main')}>← Назад</button>
            <h2 className="pin-title">Восстановление доступа</h2>
            <div className="pin-spacer"></div>
          </div>

          <p className="pin-instruction">
            Ответьте на секретный вопрос, чтобы сбросить PIN-код
          </p>

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
            <small>
              {hasPin === false 
                ? 'Установить код безопасности' 
                : hasPin === true 
                  ? hasQuestion 
                    ? 'Изменить код безопасности' 
                    : 'Установить код и вопрос'
                  : 'Загрузка...'}
            </small>
          </span>
          <span className="security-arrow">›</span>
        </button>

        <button
          className="security-main-btn"
          onClick={() => setMode('recovery')}
        >
          <span className="security-icon">🔄</span>
          <span className="security-text">
            <strong>Забыли PIN?</strong>
            <small>Восстановите доступ через секретный вопрос</small>
          </span>
          <span className="security-arrow">›</span>
        </button>
      </div>
    </div>
  );
};

export default SecurityPage;