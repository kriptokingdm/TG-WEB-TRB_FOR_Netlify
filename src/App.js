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

  // Применяем тему Telegram с полной интеграцией
  const applyTelegramTheme = useCallback(() => {
    console.log('🎨 Применяем тему Telegram...');
    
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      const currentTheme = tg.colorScheme || 'light';
      
      // Устанавливаем тему
      document.documentElement.setAttribute('data-theme', currentTheme);
      
      // Применяем все цвета Telegram
      if (tg.themeParams) {
        const root = document.documentElement;
        
        // Основные цвета
        if (tg.themeParams.bg_color) {
          root.style.setProperty('--tg-theme-bg-color', `#${tg.themeParams.bg_color}`);
        }
        if (tg.themeParams.text_color) {
          root.style.setProperty('--tg-theme-text-color', `#${tg.themeParams.text_color}`);
        }
        if (tg.themeParams.hint_color) {
          root.style.setProperty('--tg-theme-hint-color', `#${tg.themeParams.hint_color}`);
        }
        if (tg.themeParams.link_color) {
          root.style.setProperty('--tg-theme-link-color', `#${tg.themeParams.link_color}`);
        }
        if (tg.themeParams.button_color) {
          const buttonColor = `#${tg.themeParams.button_color}`;
          root.style.setProperty('--tg-theme-button-color', buttonColor);
          
          // Конвертируем hex в RGB для rgba()
          const rgb = hexToRgb(buttonColor);
          if (rgb) {
            root.style.setProperty('--tg-theme-button-color-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
          }
        }
        if (tg.themeParams.button_text_color) {
          root.style.setProperty('--tg-theme-button-text-color', `#${tg.themeParams.button_text_color}`);
        }
        
        // Дополнительные цвета (если есть)
        if (tg.themeParams.secondary_bg_color) {
          root.style.setProperty('--tg-theme-secondary-bg-color', `#${tg.themeParams.secondary_bg_color}`);
        }
        if (tg.themeParams.header_bg_color) {
          root.style.setProperty('--tg-theme-header-bg-color', `#${tg.themeParams.header_bg_color}`);
        }
        if (tg.themeParams.accent_text_color) {
          root.style.setProperty('--tg-theme-accent-text-color', `#${tg.themeParams.accent_text_color}`);
        }
        if (tg.themeParams.section_bg_color) {
          root.style.setProperty('--tg-theme-section-bg-color', `#${tg.themeParams.section_bg_color}`);
        }
        if (tg.themeParams.section_header_text_color) {
          root.style.setProperty('--tg-theme-section-header-text-color', `#${tg.themeParams.section_header_text_color}`);
        }
        if (tg.themeParams.subtitle_text_color) {
          root.style.setProperty('--tg-theme-subtitle-text-color', `#${tg.themeParams.subtitle_text_color}`);
        }
        if (tg.themeParams.destructive_text_color) {
          root.style.setProperty('--tg-theme-destructive-text-color', `#${tg.themeParams.destructive_text_color}`);
        }
      }
      
      // Устанавливаем стиль навигации
      tg.setHeaderColor('secondary_bg_color');
      tg.setBackgroundColor('secondary_bg_color');
      
    } else {
      // Для разработки - симуляция Telegram WebApp
      document.documentElement.style.setProperty('--tg-theme-button-color', '#3390ec');
      document.documentElement.style.setProperty('--tg-theme-button-color-rgb', '51, 144, 236');
      document.documentElement.style.setProperty('--tg-theme-bg-color', '#ffffff');
      document.documentElement.style.setProperty('--tg-theme-text-color', '#000000');
      document.documentElement.style.setProperty('--tg-theme-hint-color', '#8e8e93');
      document.documentElement.style.setProperty('--tg-theme-button-text-color', '#ffffff');
    }
  }, []);

  // Конвертер hex в RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Инициализация Telegram WebApp
  const initTelegramWebApp = useCallback(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // Основные настройки
      tg.ready();
      tg.expand();
      
      // Устанавливаем стили
      tg.setHeaderColor('secondary_bg_color');
      tg.setBackgroundColor('secondary_bg_color');
      
      // Инициализируем Main Button если нужен
      if (tg.MainButton) {
        tg.MainButton.hide();
      }
      
      // Инициализируем Back Button
      if (tg.BackButton) {
        tg.BackButton.onClick(() => {
          navigateTo('home');
        });
        
        // Показываем кнопку назад если не на домашней странице
        if (currentPage !== 'home') {
          tg.BackButton.show();
        } else {
          tg.BackButton.hide();
        }
      }
      
      // Слушаем события
      tg.onEvent('themeChanged', applyTelegramTheme);
      tg.onEvent('viewportChanged', () => {
        tg.expand();
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
      setTelegramUser({
        id: '7879866656',
        telegramId: '7879866656',
        username: 'test_user',
        firstName: 'Тестовый',
        photoUrl: null
      });
      
      console.log('⚠️ Telegram WebApp не найден, используем режим разработки');
    }
  }, [applyTelegramTheme, currentPage, showToast]);

  // Инициализация приложения
  useEffect(() => {
    console.log('🚀 Инициализация TetherRabbit...');
    
    // Применяем тему Telegram
    applyTelegramTheme();
    
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
  }, [applyTelegramTheme, initTelegramWebApp, loadReferralData]);

  // Навигация с поддержкой Telegram BackButton
  const navigateTo = useCallback((page) => {
    if (page === currentPage) return;
    
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
    
    // Плавная анимация перехода
    document.querySelector('.app-content').style.opacity = '0.5';
    setTimeout(() => {
      document.querySelector('.app-content').style.opacity = '1';
    }, 150);
    
    console.log(`➡️ Переход на страницу: ${page}`);
  }, [currentPage]);

  // Рендер страниц с анимацией
  const renderPage = () => {
    const commonProps = {
      telegramUser: telegramUser,
      navigateTo: navigateTo,
      API_BASE_URL: API_BASE_URL,
      showToast: showToast
    };
    
    switch(currentPage) {
      case 'history': 
        return (
          <div className="page-transition page-enter-active">
            <History key="history" {...commonProps} />
          </div>
        );
      case 'profile': 
        return (
          <div className="page-transition page-enter-active">
            <Profile key="profile" {...commonProps} />
          </div>
        );
      case 'help': 
        return (
          <div className="page-transition page-enter-active">
            <Help key="help" {...commonProps} />
          </div>
        );
      default: 
        return (
          <div className="page-transition page-enter-active">
            <Home key="home" {...commonProps} />
          </div>
        );
    }
  };

  // Плавающая навигация iOS с Telegram стилем
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