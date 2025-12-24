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
  const [themeApplied, setThemeApplied] = useState(false);

  // Функция конвертации hex в RGB
  const hexToRgb = (hex) => {
    // Убираем # если есть
    hex = hex.replace(/^#/, '');
    
    // Если короткий формат (#fff) -> полный (#ffffff)
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

  // Функция установки CSS переменной
  const setCssVariable = (name, value) => {
    document.documentElement.style.setProperty(name, value);
  };

  // Применяем тему Telegram - ВАЖНО: БЕЗ useCallback!
  const applyTelegramTheme = () => {
    console.log('🎨 Применяем тему Telegram...');
    
    const root = document.documentElement;
    
    // Проверяем Telegram WebApp
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // Устанавливаем тему (light/dark)
      const currentTheme = tg.colorScheme || 'light';
      root.setAttribute('data-theme', currentTheme);
      
      console.log('📱 Тема Telegram:', currentTheme);
      console.log('🎨 Параметры темы:', tg.themeParams);
      
      // Если есть параметры темы
      if (tg.themeParams) {
        const params = tg.themeParams;
        
        // Основные цвета Telegram
        const colors = {
          bg_color: params.bg_color,
          text_color: params.text_color,
          hint_color: params.hint_color,
          link_color: params.link_color,
          button_color: params.button_color,
          button_text_color: params.button_text_color,
          secondary_bg_color: params.secondary_bg_color
        };
        
        // Устанавливаем каждый цвет
        Object.entries(colors).forEach(([key, value]) => {
          if (value) {
            const color = `#${value}`;
            const cssVar = `--tg-theme-${key.replace(/_/g, '-')}`;
            
            setCssVariable(cssVar, color);
            
            // Для bg_color и button_color создаем RGB версию
            if (key === 'bg_color' || key === 'button_color') {
              const rgb = hexToRgb(color);
              if (rgb) {
                setCssVariable(`${cssVar}-rgb`, `${rgb.r}, ${rgb.g}, ${rgb.b}`);
              }
            }
          }
        });
      }
      
      // Если нет параметров темы, используем стандартные
      if (!tg.themeParams || !tg.themeParams.button_color) {
        console.log('⚠️ Нет параметров темы, используем стандартные');
        
        // Стандартные цвета Telegram
        const defaultColors = {
          '--tg-theme-bg-color': currentTheme === 'dark' ? '#0f0f0f' : '#ffffff',
          '--tg-theme-bg-color-rgb': currentTheme === 'dark' ? '15, 15, 15' : '255, 255, 255',
          '--tg-theme-text-color': currentTheme === 'dark' ? '#ffffff' : '#000000',
          '--tg-theme-hint-color': '#8e8e93',
          '--tg-theme-link-color': '#3390ec',
          '--tg-theme-button-color': '#3390ec',
          '--tg-theme-button-color-rgb': '51, 144, 236',
          '--tg-theme-button-text-color': '#ffffff',
          '--tg-theme-secondary-bg-color': currentTheme === 'dark' ? '#1c1c1e' : '#f1f1f1',
          '--tg-theme-section-bg-color': currentTheme === 'dark' ? '#2c2c2e' : '#e7e8ec'
        };
        
        // Применяем стандартные цвета
        Object.entries(defaultColors).forEach(([key, value]) => {
          setCssVariable(key, value);
        });
      }
      
      // Устанавливаем цвета для Header и Background
      try {
        if (tg.setHeaderColor) {
          tg.setHeaderColor('secondary_bg_color');
        }
        if (tg.setBackgroundColor) {
          tg.setBackgroundColor('secondary_bg_color');
        }
      } catch (e) {
        console.log('WebApp API доступен частично');
      }
      
    } else {
      // Режим разработки (браузер)
      console.log('🌐 Режим разработки (браузер)');
      
      root.setAttribute('data-theme', 'light');
      
      // Стандартные светлые цвета
      const devColors = {
        '--tg-theme-bg-color': '#ffffff',
        '--tg-theme-bg-color-rgb': '255, 255, 255',
        '--tg-theme-text-color': '#000000',
        '--tg-theme-hint-color': '#8e8e93',
        '--tg-theme-link-color': '#3390ec',
        '--tg-theme-button-color': '#3390ec',
        '--tg-theme-button-color-rgb': '51, 144, 236',
        '--tg-theme-button-text-color': '#ffffff',
        '--tg-theme-secondary-bg-color': '#f1f1f1',
        '--tg-theme-section-bg-color': '#e7e8ec'
      };
      
      // Применяем цвета разработки
      Object.entries(devColors).forEach(([key, value]) => {
        setCssVariable(key, value);
      });
    }
    
    setThemeApplied(true);
    console.log('✅ Тема применена');
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
      
      // Инициализируем Back Button
      if (tg.BackButton) {
        console.log('🔙 Инициализация BackButton');
        tg.BackButton.onClick(() => {
          navigateTo('home');
        });
        
        if (currentPage !== 'home') {
          tg.BackButton.show();
        } else {
          tg.BackButton.hide();
        }
      }
      
      // Применяем тему сразу при инициализации
      applyTelegramTheme();
      
      // Слушаем события изменения темы
      tg.onEvent('themeChanged', () => {
        console.log('🔄 Изменение темы');
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
        
        console.log('👤 Пользователь Telegram:', userData);
        
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
  }, []);

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
    
    // Плавная анимация перехода
    const content = document.querySelector('.app-content');
    if (content) {
      content.style.opacity = '0.5';
      setTimeout(() => {
        content.style.opacity = '1';
      }, 150);
    }
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