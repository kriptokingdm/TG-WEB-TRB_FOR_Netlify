import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Home from './Home';
import History from './History';
import Profile from './Profile';
import Help from './Help';
import SettingsApp from './SettingsApp';
import { ProfileIcon, ExchangeIcon, HistoryIcon } from './NavIcons';
import Game from './Game';

// URL API
const API_BASE_URL = 'https://tethrab.shop';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [telegramUser, setTelegramUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [referralData, setReferralData] = useState(null);
  const [toast, setToast] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [hideHints, setHideHints] = useState(false);

  // Загружаем настройки при инициализации
  useEffect(() => {
    const saved = localStorage.getItem('hideHints');
    if (saved === 'true') setHideHints(true);
  }, []);

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

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }

    return true;
  }, []);

  // Применяем правильную тему
  const applyTheme = useCallback(() => {
    const root = document.documentElement;
    const darkMode = detectDarkMode();
    setIsDarkMode(darkMode);

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

      root.style.setProperty('--tg-success-color', '#34c759');
      root.style.setProperty('--tg-error-color', '#ff3b30');
      root.style.setProperty('--tg-warning-color', '#ff9500');
      root.style.setProperty('--tg-info-color', '#5e5ce6');
      root.style.setProperty('--tg-card-bg', darkCardBg);
      root.style.setProperty('--tg-input-bg', darkInputBg);
      root.style.setProperty('--tg-border-color', darkBorderColor);
      root.style.setProperty('--tg-hover-color', '#2c2f34');

      root.setAttribute('data-theme', 'dark');
    } else {
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

      root.style.setProperty('--tg-success-color', '#28a745');
      root.style.setProperty('--tg-error-color', '#dc3545');
      root.style.setProperty('--tg-warning-color', '#ffc107');
      root.style.setProperty('--tg-info-color', '#17a2b8');
      root.style.setProperty('--tg-card-bg', lightCardBg);
      root.style.setProperty('--tg-input-bg', lightInputBg);
      root.style.setProperty('--tg-border-color', lightBorderColor);
      root.style.setProperty('--tg-hover-color', '#e9ecef');

      root.removeAttribute('data-theme');
    }

    localStorage.setItem('themeApplied', 'true');
  }, [detectDarkMode, telegramColorToHex]);

  // Показ уведомлений
  const showToast = useCallback((message, type = 'info') => {
    if (hideHints && type === 'info') return;
    
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, [hideHints]);

  // Функция для обновления настроек
  const updateHideHints = useCallback((value) => {
    setHideHints(value);
    localStorage.setItem('hideHints', value.toString());
  }, []);

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

    window.location.hash = page;
    setCurrentPage(page);

    if (window.Telegram?.WebApp?.BackButton) {
      const tg = window.Telegram.WebApp;

      if (page === 'home') {
        try {
          tg.BackButton.hide();
        } catch (e) {}
      } else {
        try {
          tg.BackButton.show();
        } catch (e) {}
      }
    }
  }, [currentPage]);

  // Управление клавиатурой - скрытие навигации
  useEffect(() => {
    const handleResize = () => {
      const nav = document.querySelector('.floating-nav');
      if (!nav) return;
      
      // Скрываем навигацию при открытой клавиатуре
      if (window.innerHeight < 500) {
        nav.style.opacity = '0';
        nav.style.pointerEvents = 'none';
        nav.style.transform = 'translateX(-50%) translateY(20px)';
      } else {
        nav.style.opacity = '1';
        nav.style.pointerEvents = 'auto';
        nav.style.transform = 'translateX(-50%) translateY(0)';
      }
    };

    const handleFocus = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        const nav = document.querySelector('.floating-nav');
        if (nav) {
          nav.style.opacity = '0';
          nav.style.pointerEvents = 'none';
          nav.style.transform = 'translateX(-50%) translateY(20px)';
        }
      }
    };

    const handleBlur = () => {
      const nav = document.querySelector('.floating-nav');
      if (nav) {
        setTimeout(() => {
          nav.style.opacity = '1';
          nav.style.pointerEvents = 'auto';
          nav.style.transform = 'translateX(-50%) translateY(0)';
        }, 300);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  // Инициализация Telegram WebApp
  const initTelegramWebApp = useCallback(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;

      tg.ready();
      tg.expand();

      // Настраиваем кнопку "Назад"
      try {
        if (tg.BackButton) {
          tg.BackButton.onClick(() => {
            navigateTo('home');
          });

          if (currentPage === 'home') {
            try {
              tg.BackButton.hide();
            } catch (e) {}
          }
        }
      } catch (error) {}

      // Настраиваем кнопку настроек
      try {
        if (tg.SettingsButton && typeof tg.SettingsButton.show === 'function') {
          tg.SettingsButton.show();
          tg.SettingsButton.onClick(() => {
            navigateTo('settings');
          });
        }
      } catch (error) {}

      // Применяем тему
      applyTheme();

      // Слушаем события изменения темы
      tg.onEvent('themeChanged', () => {
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

        if (!hideHints) {
          setTimeout(() => {
            showToast(`Добро пожаловать, ${userData.firstName}! 👋`, 'success');
          }, 1000);
        }
      }
    } else {
      // Режим разработки
      setTelegramUser({
        id: '7879866656',
        telegramId: '7879866656',
        username: 'test_user',
        firstName: 'Тестовый',
        photoUrl: null
      });

      applyTheme();
    }
  }, [applyTheme, showToast, navigateTo, currentPage, hideHints]);

  // Инициализация приложения
  useEffect(() => {
    const debugUser = {
      id: '7879866656',
      telegramId: '7879866656',
      username: 'TERBCEO',
      firstName: 'G'
    };
    localStorage.setItem('currentUser', JSON.stringify(debugUser));

    initTelegramWebApp();

    const hash = window.location.hash.replace('#', '');
    if (hash && ['home', 'profile', 'history', 'help', 'settings', 'game'].includes(hash)) {
  setCurrentPage(hash);
}


    loadReferralData();

    setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== currentPage && ['home', 'profile', 'history', 'help', 'settings'].includes(hash)) {
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
      toggleTheme: toggleTheme,
      isDarkMode: isDarkMode,
      hideHints: hideHints,
      updateHideHints: updateHideHints
    };

    switch (currentPage) {
  case 'history':
    return <History key="history" {...commonProps} />;
  case 'profile':
    return <Profile key="profile" {...commonProps} />;
  case 'help':
    return <Help key="help" {...commonProps} />;
  case 'settings':
    return <SettingsApp key="settings" {...commonProps} />;
  case 'game': // 🔥 добавлено
    return <Game key="game" {...commonProps} />;
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
          {currentPage !== 'help' && currentPage !== 'settings' && <Navigation />}

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