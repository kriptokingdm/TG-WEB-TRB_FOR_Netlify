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
  const [telegramThemeParams, setTelegramThemeParams] = useState(null);

  // Функция для применения цветов Telegram
  const applyTelegramColors = useCallback(() => {
    console.log('🎨 Применяем цвета из Telegram...');
    
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      const themeParams = tg.themeParams;
      
      console.log('📱 Telegram themeParams:', themeParams);
      
      if (themeParams) {
        setTelegramThemeParams(themeParams);
        
        // Получаем цвет кнопки пользователя (это его акцентный цвет)
        const buttonColor = themeParams.button_color ? `#${themeParams.button_color}` : '#3390ec';
        const buttonTextColor = themeParams.button_text_color ? `#${themeParams.button_text_color}` : '#ffffff';
        
        // Получаем цвет успеха/зеленый для border-left
        const successColor = '#34c759'; // Стандартный зеленый
        
        // Устанавливаем CSS переменные
        const root = document.documentElement;
        
        // Цвет кнопок (акцентный цвет пользователя)
        root.style.setProperty('--tg-button-color', buttonColor);
        root.style.setProperty('--tg-button-text-color', buttonTextColor);
        
        // Цвет успеха (зеленый для реферальной карточки)
        root.style.setProperty('--tg-success', successColor);
        
        // Основные цвета фона и текста
        if (themeParams.bg_color) {
          root.style.setProperty('--tg-bg-color', `#${themeParams.bg_color}`);
        }
        if (themeParams.text_color) {
          root.style.setProperty('--tg-text-color', `#${themeParams.text_color}`);
        }
        if (themeParams.secondary_bg_color) {
          root.style.setProperty('--tg-card-bg', `#${themeParams.secondary_bg_color}`);
          root.style.setProperty('--tg-header-bg', `#${themeParams.secondary_bg_color}`);
          root.style.setProperty('--tg-input-bg', `#${themeParams.secondary_bg_color}`);
        }
        if (themeParams.hint_color) {
          root.style.setProperty('--tg-secondary-text', `#${themeParams.hint_color}`);
        }
        
        console.log('✅ Установлены цвета:');
        console.log('   - Цвет кнопки:', buttonColor);
        console.log('   - Цвет текста кнопки:', buttonTextColor);
        console.log('   - Цвет успеха:', successColor);
      }
      
      // Устанавливаем тему (светлая/темная)
      const tgTheme = tg.colorScheme || 'light';
      setTheme(tgTheme);
      document.documentElement.setAttribute('data-theme', tgTheme);
      localStorage.setItem('appTheme', tgTheme);
    } else {
      // Фолбэк для браузера
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const systemTheme = prefersDark ? 'dark' : 'light';
      setTheme(systemTheme);
      document.documentElement.setAttribute('data-theme', systemTheme);
      localStorage.setItem('appTheme', systemTheme);
    }
  }, []);

  // Инициализация приложения
  useEffect(() => {
    console.log('🚀 Запуск TetherRabbit App...');
    
    // Применяем цвета Telegram при загрузке
    applyTelegramColors();
    
    // Определяем тему
    const detectTheme = () => {
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        const tgTheme = tg.colorScheme || 'light';
        console.log('🎨 Telegram тема:', tgTheme);
        return tgTheme;
      }
      
      const savedTheme = localStorage.getItem('appTheme');
      if (savedTheme) {
        return savedTheme;
      }
      
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    };
    
    const currentTheme = detectTheme();
    setTheme(currentTheme);
    document.documentElement.setAttribute('data-theme', currentTheme);
    
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
      
      // Слушаем изменения темы и цветов
      tg.onEvent('themeChanged', applyTelegramColors);
      tg.onEvent('themeParamsChanged', applyTelegramColors);
    }
    
    setTimeout(() => {
      setIsLoading(false);
      console.log('✅ Инициализация завершена');
    }, 500);
    
  }, [applyTelegramColors]);

  // Навигация
  const navigateTo = useCallback((page) => {
    console.log(`📍 Навигация на: ${page} (текущая: ${currentPage})`);
    
    if (page === currentPage) {
      console.log('⏸️ Навигация заблокирована - та же страница');
      return;
    }
    
    window.location.hash = page;
    console.log('🔗 URL hash updated to:', page);
    
    setIsAnimating(true);
    setPrevPage(currentPage);
    
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
      theme: theme,
      telegramThemeParams: telegramThemeParams // Передаем параметры темы в компоненты
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