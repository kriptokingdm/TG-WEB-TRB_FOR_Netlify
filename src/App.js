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

  // Функция для определения цвета кнопки из Telegram
  const getTelegramButtonColor = useCallback(() => {
    if (!window.Telegram?.WebApp) return '#3390ec';
    
    const tg = window.Telegram.WebApp;
    const themeParams = tg.themeParams;
    
    console.log('🔍 Ищем цвет кнопки в Telegram...');
    console.log('📊 themeParams:', themeParams);
    
    // 1. Пробуем взять цвет кнопки напрямую
    if (themeParams?.button_color) {
      console.log('✅ Нашли button_color:', themeParams.button_color);
      return `#${themeParams.button_color}`;
    }
    
    // 2. Пробуем взять цвет ссылки
    if (themeParams?.link_color) {
      console.log('✅ Нашли link_color:', themeParams.link_color);
      return `#${themeParams.link_color}`;
    }
    
    // 3. Если пользователь выбрал зеленую тему в Telegram
    const bgColor = themeParams?.bg_color || '';
    const textColor = themeParams?.text_color || '';
    
    // Определяем по цветам фона/текста
    if (bgColor.includes('34c759') || bgColor.includes('30d158') || 
        textColor.includes('34c759') || textColor.includes('30d158')) {
      console.log('🎨 Определили зеленую тему');
      return '#34c759';
    }
    
    if (bgColor.includes('af52de') || bgColor.includes('bf5af2') ||
        textColor.includes('af52de') || textColor.includes('bf5af2')) {
      console.log('🎨 Определили фиолетовую тему');
      return '#af52de';
    }
    
    if (bgColor.includes('ff2d55') || bgColor.includes('ff375f') ||
        textColor.includes('ff2d55') || textColor.includes('ff375f')) {
      console.log('🎨 Определили розовую тему');
      return '#ff2d55';
    }
    
    if (bgColor.includes('ff9500') || bgColor.includes('ff9f0a') ||
        textColor.includes('ff9500') || textColor.includes('ff9f0a')) {
      console.log('🎨 Определили оранжевую тему');
      return '#ff9500';
    }
    
    if (bgColor.includes('ff3b30') || bgColor.includes('ff453a') ||
        textColor.includes('ff3b30') || textColor.includes('ff453a')) {
      console.log('🎨 Определили красную тему');
      return '#ff3b30';
    }
    
    // 4. По умолчанию возвращаем синий
    console.log('⚪ Используем синий по умолчанию');
    return '#3390ec';
  }, []);

  // Функция для определения цвета текста кнопки
  const getTelegramButtonTextColor = useCallback((buttonColor) => {
    if (!window.Telegram?.WebApp) return '#ffffff';
    
    const tg = window.Telegram.WebApp;
    
    // 1. Пробуем взять из Telegram
    if (tg.themeParams?.button_text_color) {
      return `#${tg.themeParams.button_text_color}`;
    }
    
    // 2. Автоматически определяем контрастный цвет
    const hex = buttonColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Формула яркости (YIQ)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }, []);

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
      console.log('🌓 Тема Telegram:', currentTheme);
      
      // Получаем цвет кнопки
      buttonColor = getTelegramButtonColor();
      
      // Получаем цвет текста кнопки
      buttonTextColor = getTelegramButtonTextColor(buttonColor);
      
      // Для зеленой темы меняем цвет успеха
      if (buttonColor === '#34c759' || buttonColor === '#30d158') {
        successColor = '#32d74b'; // Более яркий зеленый
      }
      
      console.log('✅ Установлены цвета:');
      console.log('   - Цвет кнопки:', buttonColor);
      console.log('   - Цвет текста кнопки:', buttonTextColor);
      console.log('   - Цвет успеха:', successColor);
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
    
  }, [getTelegramButtonColor, getTelegramButtonTextColor]);

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
      
      // Запрашиваем тему у Telegram
      setTimeout(() => {
        tg.requestTheme();
        console.log('📡 Запросили тему у Telegram');
      }, 100);
      
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
        console.log('🔄 Тема изменилась');
        applyTelegramColors();
      });
      
      // Логируем все параметры для отладки
      console.log('📊 Все параметры Telegram WebApp:');
      console.log('   - platform:', tg.platform);
      console.log('   - version:', tg.version);
      console.log('   - colorScheme:', tg.colorScheme);
      
      if (tg.themeParams) {
        console.log('🎨 Детали themeParams:');
        Object.entries(tg.themeParams).forEach(([key, value]) => {
          console.log(`   - ${key}: #${value}`);
        });
      }
    } else {
      console.log('⚠️ Telegram WebApp не найден, используем браузерный режим');
    }
    
    // Таймер для проверки и обновления темы
    setTimeout(() => {
      console.log('🔄 Проверяем тему через 1 секунду...');
      applyTelegramColors();
      
      // Проверяем текущие CSS переменные
      console.log('📝 Текущие CSS переменные:');
      console.log('   - --tg-button-color:', 
        getComputedStyle(document.documentElement).getPropertyValue('--tg-button-color'));
      console.log('   - --tg-success:', 
        getComputedStyle(document.documentElement).getPropertyValue('--tg-success'));
    }, 1000);
    
    // Завершаем загрузку
    setTimeout(() => {
      setIsLoading(false);
      console.log('✅ Инициализация завершена');
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

  // Функция renderPage
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