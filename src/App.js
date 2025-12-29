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
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [hasTelegram, setHasTelegram] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Конвертер цвета Telegram в hex
  const telegramColorToHex = useCallback((color) => {
    if (!color && color !== 0) return null;
    
    if (typeof color === 'string') {
      return color.startsWith('#') ? color : `#${color}`;
    } else if (typeof color === 'number') {
      const hex = color.toString(16).padStart(6, '0');
      return `#${hex}`;
    }
    
    return null;
  }, []);

  // Определяем темную тему
  const detectDarkMode = useCallback(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme === 'dark';
    }
    
    if (window.Telegram?.WebApp?.themeParams) {
      const params = window.Telegram.WebApp.themeParams;
      
      if (params?.bg_color) {
        try {
          let bgColor;
          if (typeof params.bg_color === 'string') {
            bgColor = parseInt(params.bg_color.replace('#', ''), 16);
          } else {
            bgColor = params.bg_color;
          }
          
          // Рассчитываем яркость
          const r = (bgColor >> 16) & 0xff;
          const g = (bgColor >> 8) & 0xff;
          const b = bgColor & 0xff;
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          
          return brightness < 180;
        } catch (error) {
          console.error('Ошибка определения цвета Telegram:', error);
        }
      }
    }
    
    return true;
  }, []);

  // Применяем правильную тему
  const applyTheme = useCallback(() => {
    const root = document.documentElement;
    const darkMode = detectDarkMode();
    setIsDarkMode(darkMode);
    
    let tgButtonColor = '#3390ec';
    
    if (window.Telegram?.WebApp?.themeParams) {
      const params = window.Telegram.WebApp.themeParams;
      const buttonColor = telegramColorToHex(params.button_color);
      if (buttonColor) tgButtonColor = buttonColor;
    }
    
    if (darkMode) {
      // ТЕМНАЯ ТЕМА
      const darkBgColor = '#1a1d21';
      const darkCardBg = '#212428';
      
      root.style.setProperty('--tg-theme-bg-color', darkBgColor);
      root.style.setProperty('--tg-theme-text-color', '#ffffff');
      root.style.setProperty('--tg-theme-hint-color', '#8e8e93');
      root.style.setProperty('--tg-theme-button-color', tgButtonColor);
      root.style.setProperty('--tg-theme-button-text-color', '#ffffff');
      root.style.setProperty('--tg-theme-secondary-bg-color', darkCardBg);
      
      root.setAttribute('data-theme', 'dark');
    } else {
      // СВЕТЛАЯ ТЕМА
      const lightBgColor = '#ffffff';
      const lightCardBg = '#f8f9fa';
      
      root.style.setProperty('--tg-theme-bg-color', lightBgColor);
      root.style.setProperty('--tg-theme-text-color', '#000000');
      root.style.setProperty('--tg-theme-hint-color', '#8e8e93');
      root.style.setProperty('--tg-theme-button-color', tgButtonColor);
      root.style.setProperty('--tg-theme-button-text-color', '#ffffff');
      root.style.setProperty('--tg-theme-secondary-bg-color', lightCardBg);
      
      root.removeAttribute('data-theme');
    }
  }, [detectDarkMode, telegramColorToHex]);

  // Переключение темы
  const toggleTheme = useCallback(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    localStorage.setItem('theme', newTheme);
    
    const darkMode = newTheme === 'dark';
    setIsDarkMode(darkMode);
    applyTheme();
    
    showToast(`Тема изменена на ${darkMode ? 'тёмную' : 'светлую'}`, 'success');
  }, [applyTheme, showToast]);

  // Показ уведомлений
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Загрузка реферальных данных
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

  // Навигация
  const navigateTo = useCallback((page) => {
    if (page === currentPage) return;
    
    console.log(`➡️ Переход на страницу: ${page}`);
    window.location.hash = page;
    setCurrentPage(page);
  }, [currentPage]);

  // Инициализация Telegram WebApp (упрощенная)
  const initTelegramWebApp = useCallback(() => {
    console.log('🤖 Инициализация Telegram WebApp...');
    
    if (window.Telegram?.WebApp && !initialized) {
      const tg = window.Telegram.WebApp;
      setHasTelegram(true);
      
      try {
        tg.ready();
        tg.expand();
        
        console.log('📱 Версия Telegram WebApp:', tg.version);
        
        // ВАЖНО: В версии 6.0 BackButton не поддерживается
        // Поэтому просто игнорируем его настройку
        if (parseFloat(tg.version) > 6.0 && tg.BackButton) {
          console.log('🔙 BackButton доступен');
          // Можно добавить логику для версий > 6.0 если нужно
        }
        
      } catch (error) {
        console.error('❌ Ошибка инициализации Telegram:', error);
      }
      
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
        
        setTimeout(() => {
          showToast(`Добро пожаловать, ${userData.firstName}! 👋`, 'success');
        }, 1000);
      }
      
      console.log('✅ Telegram WebApp инициализирован');
    } else {
      if (!initialized) {
        console.log('💻 Режим разработки');
        
        const devUser = {
          id: '7879866656',
          telegramId: '7879866656',
          username: 'test_user',
          firstName: 'Тестовый',
          photoUrl: null
        };
        
        setTelegramUser(devUser);
        localStorage.setItem('currentUser', JSON.stringify(devUser));
      }
    }
    
    applyTheme();
    setInitialized(true);
  }, [applyTheme, showToast, initialized]);

  // Инициализация приложения
  useEffect(() => {
    if (initialized) return;
    
    console.log('🚀 Инициализация TetherRabbit...');
    
    try {
      if (!localStorage.getItem('currentUser')) {
        const debugUser = {
          id: '7879866656',
          telegramId: '7879866656',
          username: 'TERBCEO',
          firstName: 'G'
        };
        localStorage.setItem('currentUser', JSON.stringify(debugUser));
      }
      
      const hash = window.location.hash.replace('#', '');
      if (hash && ['home', 'profile', 'history', 'help'].includes(hash)) {
        setCurrentPage(hash);
      }
      
      initTelegramWebApp();
      
      setTimeout(() => {
        loadReferralData();
      }, 500);
      
      setTimeout(() => {
        setIsLoading(false);
        console.log('✅ Инициализация завершена');
      }, 1000);
      
    } catch (error) {
      console.error('❌ Ошибка инициализации:', error);
      setIsLoading(false);
      setInitialized(true);
    }
  }, [initTelegramWebApp, loadReferralData, initialized]);

  // Рендер страниц
  const renderPage = () => {
    const commonProps = {
      telegramUser: telegramUser,
      navigateTo: navigateTo,
      API_BASE_URL: API_BASE_URL,
      showToast: showToast,
      toggleTheme: toggleTheme,
      isDarkMode: isDarkMode,
      hasTelegram: hasTelegram
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

  // Кастомная кнопка "Назад" если Telegram не поддерживает
  const CustomBackButton = () => {
    if (currentPage === 'home' || !hasTelegram) return null;
    
    return (
      <button 
        className="custom-back-button"
        onClick={() => navigateTo('home')}
        style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'var(--tg-theme-button-color, #3390ec)',
          color: 'white',
          border: 'none',
          fontSize: '20px',
          cursor: 'pointer',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}
      >
        ←
      </button>
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
      <CustomBackButton />
      <div className="app-wrapper">
        <div className="app-content">
          {renderPage()}
          {currentPage !== 'help' && <Navigation />}
          
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