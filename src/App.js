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
  const [themeColors, setThemeColors] = useState(null);

  // Конвертер hex в RGB
  const hexToRgb = (hex) => {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Получаем цвета из Telegram WebApp
  const getTelegramThemeColors = () => {
    if (!window.Telegram?.WebApp?.themeParams) {
      return {
        bg_color: '#ffffff',
        text_color: '#000000',
        hint_color: '#8e8e93',
        button_color: '#3390ec',
        button_text_color: '#ffffff',
        secondary_bg_color: '#f1f1f1'
      };
    }

    const params = window.Telegram.WebApp.themeParams;
    return {
      bg_color: params.bg_color ? `#${params.bg_color}` : '#ffffff',
      text_color: params.text_color ? `#${params.text_color}` : '#000000',
      hint_color: params.hint_color ? `#${params.hint_color}` : '#8e8e93',
      button_color: params.button_color ? `#${params.button_color}` : '#3390ec',
      button_text_color: params.button_text_color ? `#${params.button_text_color}` : '#ffffff',
      secondary_bg_color: params.secondary_bg_color ? `#${params.secondary_bg_color}` : '#f1f1f1'
    };
  };

  // Применяем тему Telegram через inline стили
  const applyTelegramTheme = () => {
    console.log('🎨 Применяем тему Telegram...');
    
    const colors = getTelegramThemeColors();
    setThemeColors(colors);
    
    // Применяем стили к корневому элементу
    const root = document.documentElement;
    
    // Устанавливаем CSS переменные
    root.style.setProperty('--tg-bg-color', colors.bg_color);
    root.style.setProperty('--tg-text-color', colors.text_color);
    root.style.setProperty('--tg-hint-color', colors.hint_color);
    root.style.setProperty('--tg-button-color', colors.button_color);
    root.style.setProperty('--tg-button-text-color', colors.button_text_color);
    root.style.setProperty('--tg-secondary-bg-color', colors.secondary_bg_color);
    
    // Также для RGB (для backdrop-filter)
    const bgRgb = hexToRgb(colors.bg_color);
    const btnRgb = hexToRgb(colors.button_color);
    
    if (bgRgb) {
      root.style.setProperty('--tg-bg-color-rgb', `${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}`);
    }
    if (btnRgb) {
      root.style.setProperty('--tg-button-color-rgb', `${btnRgb.r}, ${btnRgb.g}, ${btnRgb.b}`);
    }
    
    console.log('✅ Тема применена:', colors);
  };

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
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      console.log('🤖 Инициализация Telegram WebApp...');
      
      // Основные настройки
      tg.ready();
      tg.expand();
      
      // Применяем тему
      applyTelegramTheme();
      
      // Инициализируем Back Button
      if (tg.BackButton) {
        tg.BackButton.onClick(() => {
          navigateTo('home');
        });
        
        if (currentPage !== 'home') {
          tg.BackButton.show();
        } else {
          tg.BackButton.hide();
        }
      }
      
      // Слушаем события изменения темы
      tg.onEvent('themeChanged', () => {
        console.log('🔄 Изменение темы Telegram');
        applyTelegramTheme();
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
      
      // Применяем тему разработки
      applyTelegramTheme();
    }
  }, [currentPage]);

  // Инициализация приложения
  useEffect(() => {
    console.log('🚀 Инициализация TetherRabbit...');
    
    // Инициализируем Telegram WebApp
    initTelegramWebApp();
    
    // Hash навигация
    const hash = window.location.hash.replace('#', '');
    if (hash && ['home', 'profile', 'history', 'help'].includes(hash)) {
      setCurrentPage(hash);
    }
    
    // Загружаем реферальные данные для бейджа
    loadReferralData();
    
    // Обновляем данные каждые 30 секунд
    const referralInterval = setInterval(loadReferralData, 30000);
    
    setTimeout(() => {
      setIsLoading(false);
      console.log('✅ Инициализация завершена');
    }, 500);
    
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== currentPage && ['home', 'profile', 'history', 'help'].includes(hash)) {
        setCurrentPage(hash);
      }
    };
    
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      clearInterval(referralInterval);
    };
  }, []);

  // Навигация с поддержкой Telegram BackButton
  const navigateTo = useCallback((page) => {
    if (page === currentPage) return;
    
    console.log(`➡️ Переход на страницу: ${page}`);
    
    window.location.hash = page;
    setCurrentPage(page);
    
    // Управление кнопкой "Назад" в Telegram
    if (window.Telegram?.WebApp && window.Telegram.WebApp.BackButton) {
      if (page === 'home') {
        window.Telegram.WebApp.BackButton.hide();
      } else {
        window.Telegram.WebApp.BackButton.show();
      }
    }
  }, [currentPage]);

  // Рендер страниц с анимацией
  const renderPage = () => {
    const commonProps = {
      telegramUser: telegramUser,
      navigateTo: navigateTo,
      API_BASE_URL: API_BASE_URL,
      showToast: showToast,
      themeColors: themeColors
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

  // Плавающая навигация iOS с Telegram стилем
  const Navigation = () => {
    // Доступная сумма для бейджа
    const availableEarnings = referralData?.stats?.available_earnings || 0;
    const showBadge = availableEarnings >= 10;
    
    // Стили на основе темы
    const navStyle = themeColors ? {
      background: `rgba(${hexToRgb(themeColors.bg_color)?.r || 255}, ${hexToRgb(themeColors.bg_color)?.g || 255}, ${hexToRgb(themeColors.bg_color)?.b || 255}, 0.85)`,
      borderColor: themeColors.secondary_bg_color
    } : {};
    
    const activeButtonStyle = themeColors ? {
      color: themeColors.button_color
    } : {};
    
    const inactiveButtonStyle = themeColors ? {
      color: themeColors.hint_color
    } : {};
    
    const centerButtonStyle = themeColors ? {
      background: themeColors.button_color
    } : {};
    
    return (
      <div className="floating-nav" style={navStyle}>
        <button 
          className={`nav-item-floating ${currentPage === 'profile' ? 'active' : ''}`} 
          onClick={() => navigateTo('profile')}
          aria-label="Профиль"
          style={currentPage === 'profile' ? activeButtonStyle : inactiveButtonStyle}
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
            style={centerButtonStyle}
          >
            <ExchangeIcon active={true} />
          </button>
          <span className="nav-center-label-floating" style={activeButtonStyle}>Обмен</span>
        </div>
        
        <button 
          className={`nav-item-floating ${currentPage === 'history' ? 'active' : ''}`} 
          onClick={() => navigateTo('history')}
          aria-label="История"
          style={currentPage === 'history' ? activeButtonStyle : inactiveButtonStyle}
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
    const loaderStyle = themeColors ? {
      background: themeColors.bg_color,
      color: themeColors.text_color
    } : {};
    
    return (
      <div className="app-loading" style={loaderStyle}>
        <div className="loading-spinner"></div>
        <p>Загрузка TetherRabbit...</p>
      </div>
    );
  }

  return (
    <div className="app" style={themeColors ? { background: themeColors.bg_color, color: themeColors.text_color } : {}}>
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