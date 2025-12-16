// App.js - ИСПРАВЛЕННЫЙ
import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Home from './Home';
import History from './History';
import Profile from './Profile';
import Help from './Help';
import { ProfileIcon, ExchangeIcon, HistoryIcon } from './NavIcons';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [telegramUser, setTelegramUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState('light');

  // Функция для применения цветов Telegram
  const applyTelegramColors = useCallback(() => {
    console.log('🎨 Применяем цвета Telegram...');
    
    let buttonColor = '#3390ec';
    let buttonTextColor = '#ffffff';
    let successColor = '#34c759';
    let currentTheme = 'light';
    
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // Получаем тему (светлая/темная)
      currentTheme = tg.colorScheme || 'light';
      
      // Получаем цвет кнопки
      if (tg.themeParams?.button_color) {
        buttonColor = `#${tg.themeParams.button_color}`;
      } else if (tg.themeParams?.link_color) {
        buttonColor = `#${tg.themeParams.link_color}`;
      }
      
      // Получаем цвет текста кнопки
      if (tg.themeParams?.button_text_color) {
        buttonTextColor = `#${tg.themeParams.button_text_color}`;
      }
    }
    
    // Устанавливаем тему
    setTheme(currentTheme);
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('appTheme', currentTheme);
    
    // Устанавливаем CSS переменные
    const root = document.documentElement;
    root.style.setProperty('--tg-button-color', buttonColor);
    root.style.setProperty('--tg-button-text-color', buttonTextColor);
    root.style.setProperty('--tg-success', successColor);
    
  }, []);

  // Инициализация приложения
  useEffect(() => {
    console.log('🚀 Запуск TetherRabbit App...');
    
    // Применяем цвета Telegram
    applyTelegramColors();
    
    // Hash навигация
    const hash = window.location.hash.replace('#', '');
    console.log('🔗 Initial hash:', hash);
    
    if (hash && ['home', 'profile', 'history', 'help'].includes(hash)) {
      console.log('📍 Setting initial page from hash:', hash);
      setCurrentPage(hash);
    }
    
    // Telegram WebApp инициализация
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      
      // Получаем пользователя Telegram
      if (tg.initDataUnsafe?.user) {
        const tgUser = tg.initDataUnsafe.user;
        const userData = {
          id: tgUser.id.toString(),
          telegramId: tgUser.id,
          username: tgUser.username || `user_${tgUser.id}`,
          firstName: tgUser.first_name || 'Пользователь',
          lastName: tgUser.last_name || '',
          photoUrl: tgUser.photo_url || null
        };
        setTelegramUser(userData);
        localStorage.setItem('telegramUser', JSON.stringify(userData));
        localStorage.setItem('currentUser', JSON.stringify(userData));
      }
      
      // Слушаем изменения темы
      tg.onEvent('themeChanged', applyTelegramColors);
    }
    
    setTimeout(() => {
      setIsLoading(false);
      console.log('✅ Инициализация завершена');
    }, 500);
    
  }, [applyTelegramColors]);

  // Навигация
  const navigateTo = (page) => {
    if (page === currentPage) return;
    window.location.hash = page;
    setCurrentPage(page);
  };

  // Функция renderPage
  const renderPage = () => {
    const commonProps = {
      telegramUser: telegramUser,
      theme: theme
    };
    
    switch(currentPage) {
      case 'history': return <History key="history" {...commonProps} />;
      case 'profile': return <Profile key="profile" {...commonProps} />;
      case 'help': return <Help key="help" {...commonProps} />;
      default: return <Home key="home" {...commonProps} />;
    }
  };

  // Компонент навигации - теперь он в App.js!
  const Navigation = () => (
    <div className="bottom-nav-new">
      <button 
        className={`nav-item-new ${currentPage === 'profile' ? 'active' : ''}`} 
        onClick={() => navigateTo('profile')}
      >
        <div className="nav-icon-wrapper">
          <ProfileIcon active={currentPage === 'profile'} />
        </div>
        <span className="nav-label">Профиль</span>
      </button>
      
      <button 
        className="nav-center-item" 
        onClick={() => navigateTo('home')}
      >
        <div className="nav-center-circle">
          <ExchangeIcon active={true} />
        </div>
        <span className="nav-center-label">Обмен</span>
      </button>
      
      <button 
        className={`nav-item-new ${currentPage === 'history' ? 'active' : ''}`} 
        onClick={() => navigateTo('history')}
      >
        <div className="nav-icon-wrapper">
          <HistoryIcon active={currentPage === 'history'} />
        </div>
        <span className="nav-label">История</span>
      </button>
    </div>
  );

  // Лоадер
  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Инициализация TetherRabbit...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-wrapper">
        <div className="app-content">
          {renderPage()}
          {/* НАВИГАЦИЯ ДОБАВЛЕНА СЮДА - будет видна на всех страницах! */}
          <Navigation />
        </div>
      </div>
    </div>
  );
}

export default App;