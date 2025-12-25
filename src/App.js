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

  // Определяем темную тему
  const detectDarkTheme = useCallback(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      const params = tg.themeParams;
      
      // Проверяем цвет фона Telegram
      if (params?.bg_color) {
        try {
          let bgColor;
          if (typeof params.bg_color === 'string') {
            // Если hex строка
            bgColor = parseInt(params.bg_color.replace('#', ''), 16);
          } else {
            // Если число
            bgColor = params.bg_color;
          }
          
          // Рассчитываем яркость
          const r = (bgColor >> 16) & 0xff;
          const g = (bgColor >> 8) & 0xff;
          const b = bgColor & 0xff;
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          
          console.log('📱 Цвет фона Telegram:', params.bg_color, 'Яркость:', brightness);
          
          // Telegram на мобильном часто дает чисто черный (#000000)
          // На ПК обычно более светлый (#282e33)
          return brightness < 100; // Порог для темной темы
        } catch (error) {
          console.error('Ошибка определения цвета Telegram:', error);
        }
      }
    }
    
    // Fallback: проверяем системную тему
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, []);

  // Конвертер цвета Telegram в hex
  const telegramColorToHex = useCallback((color) => {
    if (!color && color !== 0) return null;
    
    if (typeof color === 'string') {
      // Уже hex строка
      return color.startsWith('#') ? color : `#${color}`;
    } else if (typeof color === 'number') {
      // Число Telegram
      const hex = color.toString(16).padStart(6, '0');
      return `#${hex}`;
    }
    
    return null;
  }, []);

  // Получаем и применяем Telegram тему
  const applyTelegramTheme = useCallback(() => {
    console.log('🎨 Применяем тему Telegram...');
    
    const root = document.documentElement;
    let hasValidColors = false;
    
    if (window.Telegram?.WebApp?.themeParams) {
      const params = window.Telegram.WebApp.themeParams;
      console.log('📱 Telegram themeParams:', params);
      
      // Пытаемся получить все цвета из Telegram
      const bgColor = telegramColorToHex(params.bg_color);
      const textColor = telegramColorToHex(params.text_color);
      const hintColor = telegramColorToHex(params.hint_color);
      const buttonColor = telegramColorToHex(params.button_color);
      const buttonTextColor = telegramColorToHex(params.button_text_color);
      const secondaryBgColor = telegramColorToHex(params.secondary_bg_color);
      
      // Проверяем, есть ли валидные цвета
      hasValidColors = bgColor && textColor && buttonColor;
      
      if (hasValidColors) {
        // Применяем Telegram цвета
        root.style.setProperty('--tg-theme-bg-color', bgColor);
        root.style.setProperty('--tg-theme-text-color', textColor);
        root.style.setProperty('--tg-theme-hint-color', hintColor || '#8e8e93');
        root.style.setProperty('--tg-theme-button-color', buttonColor);
        root.style.setProperty('--tg-theme-button-text-color', buttonTextColor || '#ffffff');
        root.style.setProperty('--tg-theme-secondary-bg-color', secondaryBgColor || bgColor);
        root.style.setProperty('--tg-theme-section-bg-color', secondaryBgColor || bgColor);
        
        console.log('✅ Применены Telegram цвета:', { bgColor, textColor, buttonColor });
      }
    }
    
    // Если Telegram не дал цвета или они невалидные
    if (!hasValidColors) {
      console.log('⚠️ Telegram цвета недоступны, используем нашу тему');
      
      const darkTheme = detectDarkTheme();
      setIsDarkTheme(darkTheme);
      
      if (darkTheme) {
        // Наша темная тема
        root.style.setProperty('--tg-theme-bg-color', '#0f0f0f');
        root.style.setProperty('--tg-theme-text-color', '#ffffff');
        root.style.setProperty('--tg-theme-hint-color', '#8e8e93');
        root.style.setProperty('--tg-theme-button-color', '#3390ec');
        root.style.setProperty('--tg-theme-button-text-color', '#ffffff');
        root.style.setProperty('--tg-theme-secondary-bg-color', '#1c1c1e');
        root.style.setProperty('--tg-theme-section-bg-color', '#2c2c2e');
        root.setAttribute('data-theme', 'dark');
      } else {
        // Наша светлая тема
        root.style.setProperty('--tg-theme-bg-color', '#ffffff');
        root.style.setProperty('--tg-theme-text-color', '#000000');
        root.style.setProperty('--tg-theme-hint-color', '#8e8e93');
        root.style.setProperty('--tg-theme-button-color', '#3390ec');
        root.style.setProperty('--tg-theme-button-text-color', '#ffffff');
        root.style.setProperty('--tg-theme-secondary-bg-color', '#f2f2f7');
        root.style.setProperty('--tg-theme-section-bg-color', '#e5e5ea');
        root.removeAttribute('data-theme');
      }
    }
    
    // Дополнительные цвета для консистентности
    root.style.setProperty('--tg-success-color', '#34c759');
    root.style.setProperty('--tg-error-color', '#ff3b30');
    root.style.setProperty('--tg-warning-color', '#ff9500');
    root.style.setProperty('--tg-info-color', '#5856d6');
    root.style.setProperty('--tg-card-bg', 'color-mix(in srgb, var(--tg-theme-bg-color) 95%, var(--tg-theme-secondary-bg-color) 5%)');
    root.style.setProperty('--tg-input-bg', 'color-mix(in srgb, var(--tg-theme-bg-color) 90%, var(--tg-theme-secondary-bg-color) 10%)');
    root.style.setProperty('--tg-border-color', 'var(--tg-theme-section-bg-color)');
    root.style.setProperty('--tg-hover-color', 'color-mix(in srgb, var(--tg-theme-bg-color) 85%, var(--tg-theme-secondary-bg-color) 15%)');
  }, [telegramColorToHex, detectDarkTheme]);

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
      
      // Применяем тему Telegram
      applyTelegramTheme();
      
      // Обновляем состояние темной темы
      setIsDarkTheme(detectDarkTheme());
      
      // Слушаем события изменения темы
      tg.onEvent('themeChanged', () => {
        console.log('🔄 Telegram изменил тему');
        setTimeout(() => {
          applyTelegramTheme();
          setIsDarkTheme(detectDarkTheme());
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
      
      // Для разработки применяем тему
      const darkTheme = detectDarkTheme();
      setIsDarkTheme(darkTheme);
      applyTelegramTheme();
    }
  }, [applyTelegramTheme, detectDarkTheme, showToast]);

  // Инициализация приложения
  useEffect(() => {
    console.log('🚀 Инициализация TetherRabbit...');
    console.log('🌍 Окружение:', {
      hasTelegram: !!window.Telegram,
      hasWebApp: !!window.Telegram?.WebApp,
      userAgent: navigator.userAgent,
      isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
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