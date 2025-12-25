import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Home from './Home';
import History from './History';
import Profile from './Profile';
import Help from './Help';
import { ProfileIcon, ExchangeIcon, HistoryIcon } from './NavIcons';

// URL API
const API_BASE_URL = 'https://tethrab.shop';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [telegramUser, setTelegramUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [referralData, setReferralData] = useState(null);
  const [toast, setToast] = useState(null);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // Определяем, темная ли тема в Telegram
  const detectDarkTheme = () => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // Способ 1: Проверяем цвет фона
      if (tg.themeParams?.bg_color) {
        const bgColor = parseInt(tg.themeParams.bg_color.toString(16), 16);
        // Если цвет близок к черному (темная тема)
        const brightness = ((bgColor >> 16) & 0xff) * 0.299 +
                          ((bgColor >> 8) & 0xff) * 0.587 +
                          (bgColor & 0xff) * 0.114;
        return brightness < 128;
      }
      
      // Способ 2: Проверяем цвет текста
      if (tg.themeParams?.text_color) {
        const textColor = parseInt(tg.themeParams.text_color.toString(16), 16);
        const brightness = ((textColor >> 16) & 0xff) * 0.299 +
                          ((textColor >> 8) & 0xff) * 0.587 +
                          (textColor & 0xff) * 0.114;
        // Если текст светлый, значит фон темный
        return brightness > 180;
      }
      
      // Способ 3: Проверяем цвет подсказок
      if (tg.themeParams?.hint_color) {
        const hintColor = parseInt(tg.themeParams.hint_color.toString(16), 16);
        const brightness = ((hintColor >> 16) & 0xff) * 0.299 +
                          ((hintColor >> 8) & 0xff) * 0.587 +
                          (hintColor & 0xff) * 0.114;
        return brightness > 150;
      }
    }
    
    // Способ 4: Проверяем prefers-color-scheme
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }
    
    return false;
  };

  // Конвертер числа в hex цвет
  const numberToHex = (num) => {
    if (num === undefined || num === null) return null;
    
    // Если это строка, начинающаяся с #, вернем как есть
    if (typeof num === 'string' && num.startsWith('#')) {
      return num;
    }
    
    // Если это число, конвертируем в hex
    if (typeof num === 'number') {
      const hex = num.toString(16).padStart(6, '0');
      return `#${hex}`;
    }
    
    return null;
  };

  // Получаем цвета из Telegram WebApp с правильными дефолтами
  const getTelegramThemeColors = () => {
    console.log('🔍 Получаем цвета Telegram...');
    
    const darkMode = detectDarkTheme();
    console.log('🌓 Темная тема:', darkMode);
    setIsDarkTheme(darkMode);
    
    if (window.Telegram?.WebApp?.themeParams) {
      const params = window.Telegram.WebApp.themeParams;
      console.log('📱 Telegram WebApp params:', params);
      
      // Для темной темы - используем более приятные дефолтные цвета
      const defaultColors = darkMode ? {
        bg_color: '#0f0f0f',
        text_color: '#ffffff',
        hint_color: '#8e8e93',
        button_color: '#3390ec',
        button_text_color: '#ffffff',
        secondary_bg_color: '#1c1c1c',
        section_bg_color: '#2c2c2c'
      } : {
        bg_color: '#ffffff',
        text_color: '#000000',
        hint_color: '#8e8e93',
        button_color: '#3390ec',
        button_text_color: '#ffffff',
        secondary_bg_color: '#f1f1f1',
        section_bg_color: '#e7e8ec'
      };
      
      // Получаем цвета из Telegram или используем дефолтные
      const colors = {
        bg_color: numberToHex(params.bg_color) || defaultColors.bg_color,
        text_color: numberToHex(params.text_color) || defaultColors.text_color,
        hint_color: numberToHex(params.hint_color) || defaultColors.hint_color,
        button_color: numberToHex(params.button_color) || defaultColors.button_color,
        button_text_color: numberToHex(params.button_text_color) || defaultColors.button_text_color,
        secondary_bg_color: numberToHex(params.secondary_bg_color) || defaultColors.secondary_bg_color,
        section_bg_color: numberToHex(params.secondary_bg_color) || defaultColors.section_bg_color
      };
      
      // Убедимся, что цвета достаточно контрастные
      if (darkMode) {
        // Для темной темы делаем кнопку немного ярче
        if (colors.button_color === '#3390ec') {
          colors.button_color = '#3a9aff';
        }
        // Делаем вторичный фон чуть светлее для лучшего контраста
        if (colors.secondary_bg_color === '#1c1c1c') {
          colors.secondary_bg_color = '#2c2c2c';
        }
      }
      
      console.log('🎨 Telegram colors:', colors);
      return colors;
    }
    
    // Для разработки
    const defaultColors = isDarkTheme ? {
      bg_color: '#0f0f0f',
      text_color: '#ffffff',
      hint_color: '#8e8e93',
      button_color: '#3a9aff',
      button_text_color: '#ffffff',
      secondary_bg_color: '#2c2c2c',
      section_bg_color: '#3c3c3c'
    } : {
      bg_color: '#ffffff',
      text_color: '#000000',
      hint_color: '#8e8e93',
      button_color: '#3390ec',
      button_text_color: '#ffffff',
      secondary_bg_color: '#f1f1f1',
      section_bg_color: '#e7e8ec'
    };
    
    console.log('⚙️ Default colors (no Telegram):', defaultColors);
    return defaultColors;
  };

  // Применяем тему Telegram через CSS переменные
  const applyTelegramTheme = useCallback(() => {
    console.log('🎨 Применяем тему Telegram...');
    
    const colors = getTelegramThemeColors();
    
    // Применяем стили к корневому элементу
    const root = document.documentElement;
    
    // Устанавливаем CSS переменные
    root.style.setProperty('--tg-theme-bg-color', colors.bg_color);
    root.style.setProperty('--tg-theme-text-color', colors.text_color);
    root.style.setProperty('--tg-theme-hint-color', colors.hint_color);
    root.style.setProperty('--tg-theme-button-color', colors.button_color);
    root.style.setProperty('--tg-theme-button-text-color', colors.button_text_color);
    root.style.setProperty('--tg-theme-secondary-bg-color', colors.secondary_bg_color);
    root.style.setProperty('--tg-theme-section-bg-color', colors.section_bg_color);
    
    // Также устанавливаем data атрибут для темной темы
    if (isDarkTheme) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    
    // Сохраняем в localStorage для других компонентов
    localStorage.setItem('telegramTheme', JSON.stringify({
      ...colors,
      isDarkTheme
    }));
    
    console.log('✅ Тема применена:', colors);
    
    // Проверяем, какие CSS переменные установлены
    setTimeout(() => {
      console.log('📊 Установленные CSS переменные:', {
        bg: getComputedStyle(root).getPropertyValue('--tg-theme-bg-color').trim(),
        text: getComputedStyle(root).getPropertyValue('--tg-theme-text-color').trim(),
        button: getComputedStyle(root).getPropertyValue('--tg-theme-button-color').trim()
      });
    }, 100);
    
    // Диспатчим событие обновления темы
    window.dispatchEvent(new Event('themeChanged'));
  }, [isDarkTheme]);

  // Показ уведомлений
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Загрузка реферальных данных для бейджа
  const loadReferralData = useCallback(async () => {
    try {
      const userId = getUserId();
      const response = await fetch(`${API_BASE_URL}/api/referrals/info/${userId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setReferralData(result.data);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки реферальных данных:', error);
    }
  }, []);

  // Получение ID пользователя
  const getUserId = () => {
    try {
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        const tgUser = tg.initDataUnsafe?.user;
        if (tgUser?.id) return tgUser.id.toString();
      }

      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        return parsed.telegramId?.toString() || parsed.id?.toString();
      }

      return '7879866656';
    } catch (error) {
      console.error('❌ Ошибка получения ID:', error);
      return '7879866656';
    }
  };

  // Инициализация Telegram WebApp
  const initTelegramWebApp = useCallback(() => {
    console.log('🤖 Инициализация Telegram WebApp...');
    
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // Основные настройки
      tg.ready();
      tg.expand();
      
      // Применяем тему
      applyTelegramTheme();
      
      // Слушаем события изменения темы
      tg.onEvent('themeChanged', () => {
        console.log('🔄 Изменение темы Telegram');
        setTimeout(() => {
          setIsDarkTheme(detectDarkTheme());
          applyTelegramTheme();
        }, 100);
      });
      
      // Инициализация пользователя
      if (tg.initDataUnsafe?.user) {
        const tgUser = tg.initDataUnsafe.user;
        const userData = {
          id: tgUser.id.toString(),
          telegramId: tgUser.id,
          username: tgUser.username || `user_${tgUser.id}`,
          firstName: tgUser.first_name || 'Пользователь',
          lastName: tgUser.last_name || '',
          photoUrl: tgUser.photo_url || null,
          languageCode: tgUser.language_code || 'ru'
        };
        
        setTelegramUser(userData);
        localStorage.setItem('telegramUser', JSON.stringify(userData));
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        // Показываем приветствие
        setTimeout(() => {
          showToast(`Добро пожаловать, ${userData.firstName}! 👋`, 'success');
        }, 1000);
      }
      
      console.log('✅ Telegram WebApp инициализирован');
    } else {
      // Для разработки
      console.log('💻 Режим разработки (без Telegram WebApp)');
      
      setTelegramUser({
        id: '7879866656',
        telegramId: '7879866656',
        username: 'test_user',
        firstName: 'Тестовый',
        photoUrl: null
      });
      
      // Определяем тему разработки
      const darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkTheme(darkMode);
      
      // Применяем тему разработки
      applyTelegramTheme();
    }
  }, [applyTelegramTheme, showToast]);

  // Инициализация приложения
  useEffect(() => {
    console.log('🚀 Инициализация TetherRabbit...');
    console.log('🌍 Окружение:', {
      hasTelegram: !!window.Telegram,
      hasWebApp: !!window.Telegram?.WebApp,
      themeParams: window.Telegram?.WebApp?.themeParams,
      userAgent: navigator.userAgent
    });
    
    // Устанавливаем debug пользователя
    const debugUser = {
      id: '7879866656',
      telegramId: '7879866656',
      username: 'TERBCEO',
      firstName: 'G'
    };
    localStorage.setItem('currentUser', JSON.stringify(debugUser));
    
    // Инициализируем Telegram WebApp
    initTelegramWebApp();
    
    // Hash навигация
    const hash = window.location.hash.replace('#', '');
    if (hash && ['home', 'profile', 'history', 'help'].includes(hash)) {
      setCurrentPage(hash);
    }
    
    // Загружаем реферальные данные для бейджа
    loadReferralData();
    
    setTimeout(() => {
      setIsLoading(false);
      console.log('✅ Инициализация завершена');
    }, 1000);
    
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== currentPage && ['home', 'profile', 'history', 'help'].includes(hash)) {
        setCurrentPage(hash);
      }
    };
    
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [initTelegramWebApp, loadReferralData]);

  // Навигация
  const navigateTo = useCallback((page) => {
    if (page === currentPage) return;
    
    console.log(`➡️ Переход на страницу: ${page}`);
    
    window.location.hash = page;
    setCurrentPage(page);
  }, [currentPage]);

  // Рендер страниц
  const renderPage = () => {
    const commonProps = {
      telegramUser: telegramUser,
      navigateTo: navigateTo,
      API_BASE_URL: API_BASE_URL,
      showToast: showToast
    };
    
    switch(currentPage) {
      case 'history': 
        return <History key="history" {...commonProps} />;
      case 'profile': 
        return <Profile key="profile" {...commonProps} />;
      case 'help': 
        return <Help key="help" {...commonProps} />;
      default: 
        return <Home key="home" {...commonProps} />;
    }
  };

  // Плавающая навигация
  const Navigation = () => {
    // Доступная сумма для бейджа
    const availableEarnings = referralData?.stats?.available_earnings || 0;
    const showBadge = availableEarnings >= 10;
    
    return (
      <div className="floating-nav">
        <button 
          className={`nav-item-floating ${currentPage === 'profile' ? 'active' : ''}`} 
          onClick={() => navigateTo('profile')}
          aria-label="Профиль"
        >
          <div className="nav-icon-floating">
            <ProfileIcon active={currentPage === 'profile'} />
          </div>
          <span className="nav-label-floating">Профиль</span>
          {showBadge && (
            <span className="nav-badge-floating">
              ${availableEarnings.toFixed(0)}
            </span>
          )}
        </button>
        
        <div className="nav-center-floating">
          <button 
            className="nav-center-circle-floating" 
            onClick={() => navigateTo('home')}
            aria-label="Обмен"
          >
            <ExchangeIcon active={true} />
          </button>
          <span className="nav-center-label-floating">Обмен</span>
        </div>
        
        <button 
          className={`nav-item-floating ${currentPage === 'history' ? 'active' : ''}`} 
          onClick={() => navigateTo('history')}
          aria-label="История"
        >
          <div className="nav-icon-floating">
            <HistoryIcon active={currentPage === 'history'} />
          </div>
          <span className="nav-label-floating">История</span>
        </button>
      </div>
    );
  };

  // Лоадер
  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка TetherRabbit...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-wrapper">
        <div className="app-content">
          {renderPage()}
          {currentPage !== 'help' && <Navigation />}
          
          {/* Уведомления */}
          {toast && (
            <div className={`telegram-toast ${toast.type}`}>
              <span className="telegram-toast-icon">
                {toast.type === 'success' ? '✅' :
                 toast.type === 'error' ? '❌' : 'ℹ️'}
              </span>
              <span className="telegram-toast-text">{toast.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;