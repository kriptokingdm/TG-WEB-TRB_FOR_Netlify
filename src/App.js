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
          
          console.log('📱 Яркость фона Telegram:', brightness);
          
          // Если фон темный - темная тема
          return brightness < 180;
        } catch (error) {
          console.error('Ошибка определения цвета Telegram:', error);
        }
      }
    }
    
    // Проверяем системную тему
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }
    
    // По умолчанию - темная тема
    return true;
  }, []);

  // Применяем правильную тему
  const applyTheme = useCallback(() => {
    console.log('🎨 Применяем тему...');
    
    const root = document.documentElement;
    const darkMode = detectDarkMode();
    setIsDarkMode(darkMode);
    
    // Получаем цвета Telegram если есть
    let tgButtonColor = '#3390ec';
    let tgTextColor = '#000000';
    let tgHintColor = '#8e8e93';
    
    if (window.Telegram?.WebApp?.themeParams) {
      const params = window.Telegram.WebApp.themeParams;
      
      const buttonColor = telegramColorToHex(params.button_color);
      if (buttonColor) tgButtonColor = buttonColor;
      
      const textColor = telegramColorToHex(params.text_color);
      if (textColor) tgTextColor = textColor;
      
      const hintColor = telegramColorToHex(params.hint_color);
      if (hintColor) tgHintColor = hintColor;
    }
    
    if (darkMode) {
      // ТЕМНАЯ ТЕМА
      const darkBgColor = '#1a1d21';
      const darkCardBg = '#212428';
      const darkInputBg = '#2a2d32';
      const darkBorderColor = '#3a3d42';
      
      root.style.setProperty('--tg-theme-bg-color', darkBgColor);
      root.style.setProperty('--tg-theme-text-color', '#ffffff');
      root.style.setProperty('--tg-theme-hint-color', '#8e8e93');
      root.style.setProperty('--tg-theme-button-color', tgButtonColor);
      root.style.setProperty('--tg-theme-button-text-color', '#ffffff');
      root.style.setProperty('--tg-theme-secondary-bg-color', darkCardBg);
      root.style.setProperty('--tg-theme-section-bg-color', darkBorderColor);
      
      // Дополнительные цвета для темной темы
      root.style.setProperty('--tg-success-color', '#34c759');
      root.style.setProperty('--tg-error-color', '#ff3b30');
      root.style.setProperty('--tg-warning-color', '#ff9500');
      root.style.setProperty('--tg-info-color', '#5e5ce6');
      root.style.setProperty('--tg-card-bg', darkCardBg);
      root.style.setProperty('--tg-input-bg', darkInputBg);
      root.style.setProperty('--tg-border-color', darkBorderColor);
      root.style.setProperty('--tg-hover-color', '#2c2f34');
      
      root.setAttribute('data-theme', 'dark');
      console.log('🌙 Применена темная тема');
    } else {
      // СВЕТЛАЯ ТЕМА
      const lightBgColor = '#ffffff';
      const lightCardBg = '#f8f9fa';
      const lightInputBg = '#ffffff';
      const lightBorderColor = '#e0e0e0';
      
      root.style.setProperty('--tg-theme-bg-color', lightBgColor);
      root.style.setProperty('--tg-theme-text-color', '#000000');
      root.style.setProperty('--tg-theme-hint-color', '#8e8e93');
      root.style.setProperty('--tg-theme-button-color', tgButtonColor);
      root.style.setProperty('--tg-theme-button-text-color', '#ffffff');
      root.style.setProperty('--tg-theme-secondary-bg-color', lightCardBg);
      root.style.setProperty('--tg-theme-section-bg-color', lightBorderColor);
      
      // Дополнительные цвета для светлой темы
      root.style.setProperty('--tg-success-color', '#28a745');
      root.style.setProperty('--tg-error-color', '#dc3545');
      root.style.setProperty('--tg-warning-color', '#ffc107');
      root.style.setProperty('--tg-info-color', '#17a2b8');
      root.style.setProperty('--tg-card-bg', lightCardBg);
      root.style.setProperty('--tg-input-bg', lightInputBg);
      root.style.setProperty('--tg-border-color', lightBorderColor);
      root.style.setProperty('--tg-hover-color', '#e9ecef');
      
      root.removeAttribute('data-theme');
      console.log('☀️ Применена светлая тема');
    }
    
    localStorage.setItem('themeApplied', 'true');
  }, [detectDarkMode, telegramColorToHex]);

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

  // Навигация с управлением кнопкой "Назад"
  const navigateTo = useCallback((page) => {
    if (page === currentPage) return;
    
    console.log(`➡️ Переход на страницу: ${page}`);
    window.location.hash = page;
    setCurrentPage(page);
    
    // Управляем встроенной кнопкой "Назад" Telegram
    if (window.Telegram?.WebApp?.BackButton) {
      const tg = window.Telegram.WebApp;
      
      if (page === 'home') {
        // На главной странице скрываем кнопку "Назад"
        try {
          tg.BackButton.hide();
        } catch (e) {
          console.log('BackButton.hide не поддерживается в этой версии');
        }
      } else {
        // На других страницах показываем кнопку "Назад"
        try {
          tg.BackButton.show();
        } catch (e) {
          console.log('BackButton.show не поддерживается в этой версии');
        }
      }
    }
  }, [currentPage]);

  // Инициализация Telegram WebApp
  const initTelegramWebApp = useCallback(() => {
    console.log('🤖 Инициализация Telegram WebApp...');
    
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      tg.ready();
      tg.expand();
      
      // Проверяем и настраиваем встроенную кнопку "Назад"
      try {
        if (tg.BackButton) {
          console.log('🔙 Telegram BackButton доступен');
          
          // Настраиваем обработчик нажатия кнопки "Назад"
          tg.BackButton.onClick(() => {
            console.log('⬅️ Нажата встроенная кнопка "Назад"');
            navigateTo('home');
          });
          
          // Изначально скрываем кнопку (мы на главной)
          if (currentPage === 'home') {
            try {
              tg.BackButton.hide();
            } catch (e) {
              // Игнорируем ошибку если метод не поддерживается
            }
          }
        }
      } catch (error) {
        console.log('⚠️ BackButton не поддерживается в этой версии Telegram');
      }
      
      // Убрали настройку SettingsButton, так как нет файла SettingsApp.js
      
      // Применяем тему
      applyTheme();
      
      // Слушаем события изменения темы
      tg.onEvent('themeChanged', () => {
        console.log('🔄 Telegram изменил тему');
        setTimeout(() => {
          applyTheme();
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
        
        setTimeout(() => {
          showToast(`Добро пожаловать, ${userData.firstName}! 👋`, 'success');
        }, 1000);
      }
      
      console.log('✅ Telegram WebApp инициализирован');
    } else {
      // Режим разработки
      console.log('💻 Режим разработки');
      
      setTelegramUser({
        id: '7879866656',
        telegramId: '7879866656',
        username: 'test_user',
        firstName: 'Тестовый',
        photoUrl: null
      });
      
      applyTheme();
    }
  }, [applyTheme, showToast, navigateTo, currentPage]);

  // Инициализация приложения
  useEffect(() => {
    console.log('🚀 Инициализация TetherRabbit...');
    
    const debugUser = {
      id: '7879866656',
      telegramId: '7879866656',
      username: 'TERBCEO',
      firstName: 'G'
    };
    localStorage.setItem('currentUser', JSON.stringify(debugUser));
    
    initTelegramWebApp();
    
    const hash = window.location.hash.replace('#', '');
    if (hash && ['home', 'profile', 'history', 'help'].includes(hash)) {
      setCurrentPage(hash);
    }
    
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

  // Рендер страниц
  const renderPage = () => {
    const commonProps = {
      telegramUser: telegramUser,
      navigateTo: navigateTo,
      API_BASE_URL: API_BASE_URL,
      showToast: showToast,
      isDarkMode: isDarkMode
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