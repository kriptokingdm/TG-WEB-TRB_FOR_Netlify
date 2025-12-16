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

  // Функция для преобразования HEX в RGB
  const hexToRgb = (hex) => {
    if (!hex) return '51, 144, 236'; // Дефолтный цвет акцента
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r}, ${g}, ${b}`;
  };

  // Функция для затемнения цвета (для hover эффектов)
  const darkenColor = (hex, percent) => {
    if (!hex) return 'rgb(41, 124, 204)'; // Темнее дефолтного
    const num = parseInt(hex, 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return `rgb(${Math.min(255, Math.max(0, R))}, 
                ${Math.min(255, Math.max(0, G))}, 
                ${Math.min(255, Math.max(0, B))})`;
  };

  // Применяем цвета Telegram
  const applyTelegramColors = useCallback(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      const themeParams = tg.themeParams;
      
      console.log('🎨 Telegram параметры темы:', themeParams);
      
      if (themeParams) {
        // Основные цвета из Telegram
        const bgColor = themeParams.bg_color || 'ffffff';
        const textColor = themeParams.text_color || '000000';
        const hintColor = themeParams.hint_color || '707579';
        const linkColor = themeParams.link_color || '3390ec';
        const buttonColor = themeParams.button_color || '3390ec';
        const buttonTextColor = themeParams.button_text_color || 'ffffff';
        const secondaryBgColor = themeParams.secondary_bg_color || 'f7f7f7';
        
        // Устанавливаем CSS переменные
        const root = document.documentElement;
        
        // Основные цвета
        root.style.setProperty('--tg-bg-color', `#${bgColor}`);
        root.style.setProperty('--tg-text-color', `#${textColor}`);
        root.style.setProperty('--tg-secondary-text', `#${hintColor}`);
        root.style.setProperty('--tg-accent', `#${linkColor}`);
        root.style.setProperty('--tg-button-color', `#${buttonColor}`);
        root.style.setProperty('--tg-button-text-color', `#${buttonTextColor}`);
        root.style.setProperty('--tg-secondary-bg', `#${secondaryBgColor}`);
        
        // RGB версии для прозрачности
        root.style.setProperty('--tg-button-color-rgb', hexToRgb(buttonColor));
        root.style.setProperty('--tg-accent-rgb', hexToRgb(linkColor));
        
        // Hover цвета
        const hoverColor = darkenColor(buttonColor, -10);
        root.style.setProperty('--tg-button-hover-color', hoverColor);
        
        // Для темной темы корректируем некоторые цвета
        const isDark = tg.colorScheme === 'dark';
        if (isDark) {
          root.style.setProperty('--tg-header-bg', `#${secondaryBgColor}`);
          root.style.setProperty('--tg-card-bg', `#${secondaryBgColor}`);
          root.style.setProperty('--tg-input-bg', darkenColor(secondaryBgColor, -10));
          root.style.setProperty('--tg-border', `#${darkenColor(secondaryBgColor, -20)}`);
        } else {
          root.style.setProperty('--tg-header-bg', `#${bgColor}`);
          root.style.setProperty('--tg-card-bg', `#${bgColor}`);
          root.style.setProperty('--tg-input-bg', `#${secondaryBgColor}`);
          root.style.setProperty('--tg-border', darkenColor(secondaryBgColor, -10));
        }
      }
      
      // Устанавливаем тему
      const tgTheme = tg.colorScheme || 'light';
      setTheme(tgTheme);
      document.documentElement.setAttribute('data-theme', tgTheme);
      
      // Сохраняем тему
      localStorage.setItem('appTheme', tgTheme);
      localStorage.setItem('lastThemeUpdate', Date.now().toString());
      
      return tgTheme;
    }
    return 'light';
  }, []);

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
    const currentTheme = applyTelegramColors();
    console.log('🎨 Применена тема:', currentTheme);
    
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
      
      console.log('🤖 Инициализация Telegram WebApp...');
      tg.ready();
      tg.expand();
      
      // Настраиваем интерфейс Telegram
      tg.setHeaderColor('secondary_bg_color');
      tg.setBackgroundColor('secondary_bg_color');
      
      // Получаем пользователя Telegram
      if (tg.initDataUnsafe?.user) {
        const tgUser = tg.initDataUnsafe.user;
        const userData = {
          id: tgUser.id.toString(),
          telegramId: tgUser.id,
          username: tgUser.username || `user_${tgUser.id}`,
          firstName: tgUser.first_name || 'Пользователь',
          lastName: tgUser.last_name || '',
          photoUrl: tgUser.photo_url || null,
          theme: currentTheme
        };
        setTelegramUser(userData);
        localStorage.setItem('telegramUser', JSON.stringify(userData));
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        console.log('✅ Telegram User:', userData);
      }
      
      // Слушаем изменения темы в реальном времени
      tg.onEvent('themeChanged', applyTelegramColors);
      
      // Слушаем изменения параметров темы
      tg.onEvent('themeParamsChanged', applyTelegramColors);
      
      // Показываем/скрываем BackButton
      if (tg.BackButton) {
        tg.BackButton.onClick(() => {
          console.log('🔙 Back button pressed');
          handleBackButton();
        });
      }
    } else {
      console.log('⚠️ Telegram WebApp не найден');
      // Фолбэк: применяем системную тему
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const systemTheme = prefersDark ? 'dark' : 'light';
      setTheme(systemTheme);
      document.documentElement.setAttribute('data-theme', systemTheme);
      localStorage.setItem('appTheme', systemTheme);
    }
    
    // Исправляем высоту для мобильных браузеров
    const fixHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      
      // Также устанавливаем реальную высоту для контейнеров
      const realHeight = window.innerHeight;
      document.documentElement.style.setProperty('--real-height', `${realHeight}px`);
    };
    
    window.addEventListener('resize', fixHeight);
    window.addEventListener('orientationchange', fixHeight);
    fixHeight();
    
    // Проверяем сохраненного пользователя
    const savedUser = localStorage.getItem('telegramUser');
    if (savedUser && !telegramUser) {
      try {
        const userData = JSON.parse(savedUser);
        setTelegramUser(userData);
        console.log('📱 User from localStorage:', userData);
      } catch (error) {
        console.error('❌ Ошибка парсинга localStorage:', error);
      }
    }
    
    // Завершаем загрузку
    setTimeout(() => {
      setIsLoading(false);
      console.log('✅ Инициализация завершена');
      console.log('📊 Текущая страница:', currentPage);
      console.log('🎨 Текущая тема:', theme);
    }, 800);
    
  }, [applyTelegramColors]);

  // Обработка кнопки "Назад" в Telegram
  const handleBackButton = useCallback(() => {
    console.log('🔙 Обработка кнопки назад');
    
    const pages = ['home', 'profile', 'history', 'help'];
    const currentIndex = pages.indexOf(currentPage);
    
    if (currentIndex > 0) {
      const prevPage = pages[currentIndex - 1];
      navigateTo(prevPage);
    } else {
      // Если на главной, скрываем BackButton
      if (window.Telegram?.WebApp?.BackButton) {
        window.Telegram.WebApp.BackButton.hide();
      }
    }
  }, [currentPage]);

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

  // Управляем BackButton при смене страницы
  useEffect(() => {
    if (window.Telegram?.WebApp?.BackButton) {
      if (currentPage === 'home') {
        window.Telegram.WebApp.BackButton.hide();
      } else {
        window.Telegram.WebApp.BackButton.show();
      }
    }
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
      
      // Прокручиваем наверх при смене страницы
      window.scrollTo(0, 0);
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