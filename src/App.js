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

  // Функция для конвертации HEX в RGB
  const hexToRgb = useCallback((hex) => {
    if (!hex || hex === '') return '51, 144, 236';
    const cleanHex = hex.replace('#', '');
    const bigint = parseInt(cleanHex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r}, ${g}, ${b}`;
  }, []);

  // Функция для затемнения цвета
  const darkenColor = useCallback((hex, percent = -10) => {
    if (!hex || hex === '') return '#2a7bc8';
    const cleanHex = hex.replace('#', '');
    const num = parseInt(cleanHex, 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    const finalR = Math.min(255, Math.max(0, R));
    const finalG = Math.min(255, Math.max(0, G));
    const finalB = Math.min(255, Math.max(0, B));
    
    return `#${((1 << 24) + (finalR << 16) + (finalG << 8) + finalB).toString(16).slice(1)}`;
  }, []);

  // Применяем цвета Telegram
  const applyTelegramColors = useCallback(() => {
    console.log('🎨 Применяем цвета Telegram...');
    
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      const themeParams = tg.themeParams;
      const currentTheme = tg.colorScheme || 'light';
      
      console.log('📱 Параметры темы Telegram:', themeParams);
      console.log('🎨 Текущая тема:', currentTheme);
      
      // Устанавливаем тему
      setTheme(currentTheme);
      document.documentElement.setAttribute('data-theme', currentTheme);
      localStorage.setItem('appTheme', currentTheme);
      
      if (themeParams) {
        const root = document.documentElement;
        
        // Основные цвета из Telegram
        const buttonColor = themeParams.button_color ? `#${themeParams.button_color}` : '#3390ec';
        const buttonTextColor = themeParams.button_text_color ? `#${themeParams.button_text_color}` : '#ffffff';
        const bgColor = themeParams.bg_color ? `#${themeParams.bg_color}` : '#ffffff';
        const textColor = themeParams.text_color ? `#${themeParams.text_color}` : '#000000';
        const hintColor = themeParams.hint_color ? `#${themeParams.hint_color}` : '#707579';
        const secondaryBgColor = themeParams.secondary_bg_color ? `#${themeParams.secondary_bg_color}` : '#f7f7f7';
        const linkColor = themeParams.link_color ? `#${themeParams.link_color}` : '#3390ec';
        
        // Устанавливаем CSS переменные
        root.style.setProperty('--tg-button-color', buttonColor);
        root.style.setProperty('--tg-button-text-color', buttonTextColor);
        root.style.setProperty('--tg-button-hover-color', darkenColor(buttonColor));
        root.style.setProperty('--tg-button-color-rgb', hexToRgb(buttonColor));
        
        root.style.setProperty('--tg-bg-color', bgColor);
        root.style.setProperty('--tg-text-color', textColor);
        root.style.setProperty('--tg-secondary-text', hintColor);
        root.style.setProperty('--tg-accent', linkColor);
        root.style.setProperty('--tg-secondary-bg', secondaryBgColor);
        
        // Для темной темы
        if (currentTheme === 'dark') {
          root.style.setProperty('--tg-header-bg', secondaryBgColor);
          root.style.setProperty('--tg-card-bg', secondaryBgColor);
          root.style.setProperty('--tg-input-bg', darkenColor(secondaryBgColor, -20));
          root.style.setProperty('--tg-border', `#${darkenColor(secondaryBgColor.replace('#', ''), -30)}`);
        } else {
          root.style.setProperty('--tg-header-bg', bgColor);
          root.style.setProperty('--tg-card-bg', bgColor);
          root.style.setProperty('--tg-input-bg', secondaryBgColor);
          root.style.setProperty('--tg-border', darkenColor(secondaryBgColor, -10));
        }
        
        console.log('✅ Цвета установлены:', {
          buttonColor,
          buttonTextColor,
          bgColor,
          textColor
        });
      }
    } else {
      // Фолбэк для браузера
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const systemTheme = prefersDark ? 'dark' : 'light';
      setTheme(systemTheme);
      document.documentElement.setAttribute('data-theme', systemTheme);
      localStorage.setItem('appTheme', systemTheme);
    }
  }, [hexToRgb, darkenColor]);

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
    
    // Слушаем изменения темы в Telegram
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.onEvent('themeChanged', applyTelegramColors);
      window.Telegram.WebApp.onEvent('themeParamsChanged', applyTelegramColors);
    }
    
    // Завершаем загрузку
    setTimeout(() => {
      setIsLoading(false);
      console.log('✅ Инициализация завершена');
      console.log('📊 Текущая страница:', currentPage);
    }, 500);
    
  }, [applyTelegramColors]);

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

  // Функция renderPage ДОЛЖНА БЫТЬ ОПРЕДЕЛЕНА ПЕРЕД ИСПОЛЬЗОВАНИЕМ
  const renderPage = () => {
    const commonProps = {
      navigateTo: navigateTo,
      telegramUser: telegramUser,
      theme: theme,
      currentPage: currentPage
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

  // РЕНДЕР APP - эта функция возвращает JSX
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