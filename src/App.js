// App.js (возвращаем как было)
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
  const [theme, setTheme] = useState('light');

  // Функция для применения цвета кнопок из Telegram
  const applyTelegramButtonColor = useCallback(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      const themeParams = tg.themeParams;
      
      if (themeParams?.button_color) {
        // Получаем цвет кнопки из Telegram
        const buttonColor = `#${themeParams.button_color}`;
        const buttonTextColor = themeParams.button_text_color ? `#${themeParams.button_text_color}` : '#ffffff';
        
        console.log('🎨 Telegram button color:', buttonColor);
        
        // Устанавливаем CSS переменные для цвета кнопки
        const root = document.documentElement;
        root.style.setProperty('--tg-button-color', buttonColor);
        root.style.setProperty('--tg-button-text-color', buttonTextColor);
      }
    }
  }, []);

  // Инициализация приложения
  useEffect(() => {
    console.log('🚀 Запуск TetherRabbit App...');
    
    // Применяем цвет кнопок из Telegram
    applyTelegramButtonColor();
    
    // Определяем тему
    const detectTheme = () => {
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        const tgTheme = tg.colorScheme || 'light';
        console.log('🎨 Telegram тема:', tgTheme);
        setTheme(tgTheme);
        document.documentElement.setAttribute('data-theme', tgTheme);
        return tgTheme;
      }
      
      const savedTheme = localStorage.getItem('appTheme');
      if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
        return savedTheme;
      }
      
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const systemTheme = prefersDark ? 'dark' : 'light';
      setTheme(systemTheme);
      document.documentElement.setAttribute('data-theme', systemTheme);
      return systemTheme;
    };
    
    detectTheme();
    
    // Hash навигация
    const hash = window.location.hash.replace('#', '');
    if (hash && ['home', 'profile', 'history', 'help'].includes(hash)) {
      setCurrentPage(hash);
    }
    
    // Telegram WebApp инициализация
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      
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
      }
      
      tg.onEvent('themeChanged', () => {
        const newTheme = tg.colorScheme || 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('appTheme', newTheme);
        
        // Обновляем цвет кнопок при смене темы
        applyTelegramButtonColor();
      });
    }
    
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
  }, [applyTelegramButtonColor]);

  // Навигация
  const navigateTo = useCallback((page) => {
    if (page === currentPage) return;
    
    window.location.hash = page;
    setIsAnimating(true);
    setPrevPage(currentPage);
    
    setTimeout(() => {
      setCurrentPage(page);
      setIsAnimating(false);
    }, 150);
  }, [currentPage]);

  // Рендер страницы
  const renderPage = () => {
    const commonProps = {
      navigateTo: navigateTo,
      telegramUser: telegramUser,
      theme: theme
    };
    
    const getAnimationClass = () => {
      if (!prevPage || isAnimating) return '';
      const pages = ['home', 'profile', 'history', 'help'];
      const currentIndex = pages.indexOf(currentPage);
      const prevIndex = pages.indexOf(prevPage);
      return currentIndex > prevIndex ? 'slide-in-left' : 'slide-in-right';
    };
    
    return (
      <div className={`page-container ${getAnimationClass()}`}>
        {currentPage === 'history' && <History key="history" {...commonProps} />}
        {currentPage === 'profile' && <Profile key="profile" {...commonProps} />}
        {currentPage === 'help' && <Help key="help" {...commonProps} />}
        {(currentPage === 'home' || !currentPage) && <Home key="home" {...commonProps} />}
      </div>
    );
  };

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
        </div>
      </div>
    </div>
  );
}

export default App;