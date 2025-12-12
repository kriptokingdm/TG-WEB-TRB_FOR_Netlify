import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Home from './Home';
import History from './History';
import Profile from './Profile';
import Help from './Help';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [prevPage, setPrevPage] = useState(null);
  const [telegramUser, setTelegramUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    console.log('🚀 Запуск TetherRabbit App...');
    
    // Предотвращаем масштабирование на мобильных
    const preventZoom = () => {
      document.addEventListener('touchmove', (e) => {
        if (e.scale !== 1) {
          e.preventDefault();
        }
      }, { passive: false });
      
      let lastTouchEnd = 0;
      document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      }, false);
    };

    preventZoom();

    // 1. Проверяем есть ли Telegram WebApp
    // В App.js замените блок получения пользователя Telegram:
// В useEffect в App.js:
if (window.Telegram && window.Telegram.WebApp) {
  console.log('🤖 Telegram WebApp найден');
  const tg = window.Telegram.WebApp;
  
  tg.ready();
  tg.expand();
  
  // Показываем всю информацию для отладки
  console.log('Telegram WebApp объект:', tg);
  console.log('Init Data Raw:', tg.initData);
  console.log('Init Data Unsafe:', tg.initDataUnsafe);
  console.log('Platform:', tg.platform);
  console.log('Color Scheme:', tg.colorScheme);
  
  // Получаем пользователя
  if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    const tgUser = tg.initDataUnsafe.user;
    console.log('✅ Telegram User найден:', tgUser);
    
    const userData = {
      id: tgUser.id.toString(),
      telegramId: tgUser.id,
      username: tgUser.username || `user_${tgUser.id}`,
      firstName: tgUser.first_name || 'Пользователь',
      lastName: tgUser.last_name || '',
      languageCode: tgUser.language_code || 'ru',
      isPremium: tgUser.is_premium || false,
      photoUrl: tgUser.photo_url || null
    };
    
    console.log('📱 Подготовленные данные:', userData);
    setTelegramUser(userData);
    
    // Сохраняем
    localStorage.setItem('telegramUser', JSON.stringify(userData));
    localStorage.setItem('currentUser', JSON.stringify(userData));
    
    // Также сохраняем raw данные для отладки
    localStorage.setItem('telegramRawData', JSON.stringify(tg.initDataUnsafe));
  } else {
    console.log('❌ Пользователь не найден в initDataUnsafe');
    console.log('Проверяем query параметры...');
    
    // Пробуем получить из URL параметров (для тестирования)
    const urlParams = new URLSearchParams(window.location.search);
    const testUserId = urlParams.get('test_user_id');
    
    if (testUserId) {
      console.log('🧪 Тестовый пользователь из URL:', testUserId);
      const testUser = {
        id: testUserId,
        telegramId: parseInt(testUserId),
        username: `test_${testUserId}`,
        firstName: 'Тестовый',
        lastName: 'Пользователь'
      };
      setTelegramUser(testUser);
      localStorage.setItem('telegramUser', JSON.stringify(testUser));
    }
  }
} else {
  console.log('⚠️ Telegram WebApp не найден');
}
    
    // 2. Проверяем localStorage
    const savedUser = localStorage.getItem('telegramUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('✅ Пользователь из localStorage:', userData);
        
        if (!telegramUser) {
          setTelegramUser(userData);
        }
      } catch (error) {
        console.error('❌ Ошибка парсинга localStorage:', error);
      }
    }
    
    // 3. Если всё ещё нет пользователя, создаём тестового
    setTimeout(() => {
      if (!telegramUser) {
        console.log('⚠️ Создаём тестового пользователя');
        const testUser = {
          id: 7879866656,
          username: 'Rabbit',
          first_name: 'Rabbit',
          last_name: '',
          photo_url: null
        };
        setTelegramUser(testUser);
        localStorage.setItem('telegramUser', JSON.stringify(testUser));
      }
      
      setIsLoading(false);
      console.log('🎉 Инициализация завершена');
    }, 500);
    
  }, []);

  // Плавная навигация
  const navigateTo = useCallback((page) => {
    if (page === currentPage || isAnimating) return;
    
    console.log(`📍 Навигация на: ${page}`);
    
    // Анимация перехода
    setIsAnimating(true);
    setPrevPage(currentPage);
    
    // Небольшая задержка для начала анимации
    setTimeout(() => {
      setCurrentPage(page);
      setIsAnimating(false);
    }, 150);
  }, [currentPage, isAnimating]);

  // Показываем страницу с анимацией
  const renderPage = () => {
    // Общие пропсы для всех компонентов
    const commonProps = {
      navigateTo: navigateTo,
      telegramUser: telegramUser
    };
    
    const getAnimationClass = () => {
      if (!prevPage || isAnimating) return '';
      
      const pages = ['home', 'profile', 'history', 'help'];
      const currentIndex = pages.indexOf(currentPage);
      const prevIndex = pages.indexOf(prevPage);
      
      if (currentIndex > prevIndex) {
        return 'slide-in-left';
      } else {
        return 'slide-in-right';
      }
    };
    
    return (
      <div className={`page-container ${getAnimationClass()}`}>
        {(() => {
          switch (currentPage) {
            case 'history':
              return <History key="history" {...commonProps} />;
            case 'profile':
              return <Profile key="profile" {...commonProps} />;
            case 'help':
              return <Help key="help" {...commonProps} />;
            case 'home':
            default:
              return <Home key="home" {...commonProps} />;
          }
        })()}
      </div>
    );
  };

  // Лоадер пока инициализируем
  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Инициализация TetherRabbit...</p>
        <p className="loading-subtext">Подключение к Telegram</p>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-content">
        {renderPage()}
      </div>
    </div>
  );
}

export default App;