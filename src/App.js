import React, { useState, useEffect } from 'react';
import './App.css';
import Home from './Home';
import History from './History';
import Profile from './Profile';
import Help from './Help';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [telegramUser, setTelegramUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🚀 Запуск TetherRabbit App...');
    
    // 1. Проверяем есть ли Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
      console.log('🤖 Telegram WebApp найден');
      const tg = window.Telegram.WebApp;
      
      // Инициализируем WebApp
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation();
      
      console.log('📱 Telegram версия:', tg.version);
      
      // Получаем пользователя
      const user = tg.initDataUnsafe?.user;
      console.log('👤 Telegram User:', user);
      
      if (user) {
        console.log('✅ Пользователь Telegram найден');
        const userData = {
          id: user.id,
          username: user.username || `user_${user.id}`,
          first_name: user.first_name || 'Пользователь',
          last_name: user.last_name || '',
          language_code: user.language_code || 'ru',
          is_premium: user.is_premium || false,
          photo_url: user.photo_url || null
        };
        setTelegramUser(userData);
        
        // Сохраняем в localStorage
        localStorage.setItem('telegramUser', JSON.stringify(userData));
        
      } else {
        console.log('⚠️ Пользователь не найден в initDataUnsafe');
      }
      
    } else {
      console.log('⚠️ Telegram WebApp не найден, используем тестового пользователя');
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

  // Навигация
  const navigateTo = (page) => {
    console.log(`📍 Навигация на: ${page}`);
    setCurrentPage(page);
  };

  // Показываем страницу
  const renderPage = () => {
    console.log(`📄 Рендерим страницу: ${currentPage}`);
    
    // Общие пропсы для всех компонентов
    const commonProps = {
      navigateTo: navigateTo,
      telegramUser: telegramUser
    };
    
    switch (currentPage) {
      case 'history':
        return <History {...commonProps} />;
      case 'profile':
        return <Profile {...commonProps} />;
      case 'help':
        return <Help {...commonProps} />;
      case 'home':
      default:
        return <Home {...commonProps} />;
    }
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
      
      {/* Кнопка отладки */}
      {/* <button 
        onClick={() => {
          console.log('=== ОТЛАДКА ===');
          console.log('🔍 Telegram WebApp:', window.Telegram?.WebApp);
          console.log('👤 Telegram User:', telegramUser);
          console.log('📍 Current Page:', currentPage);
          console.log('🌐 API URL:', 'https://87.242.106.114');
          console.log('💾 LocalStorage:', {
            telegramUser: localStorage.getItem('telegramUser'),
            currentUser: localStorage.getItem('currentUser')
          });
          alert('Данные отправлены в консоль!');
        }}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '50px',
          padding: '12px 24px',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 9999,
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
          cursor: 'pointer',
          transition: 'all 0.3s'
        }}
        onMouseOver={(e) => {
          e.target.style.transform = 'scale(1.05)';
          e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
        }}
      >
        🔧 Отладка
      </button> */}
    </div>
  );
}

export default App;