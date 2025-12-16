// App.js
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

  // Инициализация приложения
  useEffect(() => {
    console.log('🚀 Запуск TetherRabbit App...');
    
    // Предотвращаем масштабирование
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
    
    // Определяем тему
    const detectTheme = () => {
      // 1. Пробуем получить тему из Telegram
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        const tgTheme = tg.colorScheme || 'light';
        console.log('🎨 Telegram тема:', tgTheme);
        setTheme(tgTheme);
        document.documentElement.setAttribute('data-theme', tgTheme);
        return tgTheme;
      }
      
      // 2. Пробуем получить из localStorage
      const savedTheme = localStorage.getItem('appTheme');
      if (savedTheme) {
        console.log('🎨 Тема из localStorage:', savedTheme);
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
        return savedTheme;
      }
      
      // 3. Системная тема
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const systemTheme = prefersDark ? 'dark' : 'light';
      console.log('🎨 Системная тема:', systemTheme);
      setTheme(systemTheme);
      document.documentElement.setAttribute('data-theme', systemTheme);
      return systemTheme;
    };
    
    const currentTheme = detectTheme();
    
    // Hash навигация - СНАЧАЛА проверяем hash
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
      tg.onEvent('themeChanged', () => {
        const newTheme = tg.colorScheme || 'light';
        console.log('🎨 Тема изменена на:', newTheme);
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('appTheme', newTheme);
      });
    }
    
    // Исправляем высоту для мобильных браузеров
    const fixHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    window.addEventListener('resize', fixHeight);
    window.addEventListener('orientationchange', fixHeight);
    fixHeight();
    
    // Завершаем загрузку
    setTimeout(() => {
      setIsLoading(false);
      console.log('✅ Инициализация завершена');
    }, 500);
    
  }, []);

  // Слушаем изменения hash в реальном времени
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      console.log('🔗 Hash changed to:', hash);
      
      if (hash && ['home', 'profile', 'history', 'help'].includes(hash) && hash !== currentPage) {
        console.log('📍 Navigating from hash change:', hash);
        navigateTo(hash);
      }
    };
    
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [currentPage]);

  // Навигация
  const navigateTo = useCallback((page) => {
    console.log(`📍 Навигация на: ${page} (текущая: ${currentPage})`);
    
    if (page === currentPage) {
      console.log('⏸️ Навигация заблокирована - та же страница');
      return;
    }
    
    // Обновляем hash в URL
    window.location.hash = page;
    console.log('🔗 URL hash updated to:', page);
    
    // Анимация перехода
    setIsAnimating(true);
    setPrevPage(currentPage);
    
    // Небольшая задержка для начала анимации
    setTimeout(() => {
      setCurrentPage(page);
      setIsAnimating(false);
      console.log(`✅ Страница изменена на: ${page}`);
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
        <p className="loading-subtext">Подключение к Telegram</p>
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