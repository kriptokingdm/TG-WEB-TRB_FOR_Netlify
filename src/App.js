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

  // Применяем нашу улучшенную тему с красивым фоном
  const applyBeautifulTheme = useCallback(() => {
    console.log('🎨 Применяем красивую тему...');
    
    const root = document.documentElement;
    
    // Определяем устройство
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    console.log('📱 Устройство:', isMobile ? 'Мобильное' : 'ПК');
    
    // Получаем Telegram цвета если есть
    let tgButtonColor = '#3390ec';
    let tgTextColor = '#ffffff';
    let tgHintColor = '#8e8e93';
    
    if (window.Telegram?.WebApp?.themeParams) {
      const params = window.Telegram.WebApp.themeParams;
      
      // Берем цвет кнопки из Telegram
      const buttonColor = telegramColorToHex(params.button_color);
      if (buttonColor) tgButtonColor = buttonColor;
      
      // Берем цвет текста из Telegram
      const textColor = telegramColorToHex(params.text_color);
      if (textColor) tgTextColor = textColor;
      
      // Берем цвет подсказок из Telegram
      const hintColor = telegramColorToHex(params.hint_color);
      if (hintColor) tgHintColor = hintColor;
    }
    
    // НАШ КРАСИВЫЙ ФОН ДЛЯ ВСЕХ УСТРОЙСТВ
    const beautifulBgColor = '#1a1d21'; // Красивый темно-серый как в Telegram Desktop
    
    // Цвет карточек - чуть светлее фона
    const cardBgColor = '#212428'; // Чуть светлее фона
    const inputBgColor = '#2a2d32'; // Еще светлее для инпутов
    const borderColor = '#3a3d42'; // Границы
    
    // Применяем нашу тему
    root.style.setProperty('--tg-theme-bg-color', beautifulBgColor);
    root.style.setProperty('--tg-theme-text-color', tgTextColor);
    root.style.setProperty('--tg-theme-hint-color', tgHintColor);
    root.style.setProperty('--tg-theme-button-color', tgButtonColor);
    root.style.setProperty('--tg-theme-button-text-color', '#ffffff');
    root.style.setProperty('--tg-theme-secondary-bg-color', cardBgColor);
    root.style.setProperty('--tg-theme-section-bg-color', borderColor);
    
    // Дополнительные цвета
    root.style.setProperty('--tg-success-color', '#34c759');
    root.style.setProperty('--tg-error-color', '#ff3b30');
    root.style.setProperty('--tg-warning-color', '#ff9500');
    root.style.setProperty('--tg-info-color', '#5856d6');
    root.style.setProperty('--tg-card-bg', cardBgColor);
    root.style.setProperty('--tg-input-bg', inputBgColor);
    root.style.setProperty('--tg-border-color', borderColor);
    root.style.setProperty('--tg-hover-color', '#2c2f34');
    
    // Устанавливаем data атрибут для темной темы
    root.setAttribute('data-theme', 'dark');
    
    console.log('✅ Красивая тема применена:', {
      bg: beautifulBgColor,
      card: cardBgColor,
      button: tgButtonColor
    });
    
    // Сохраняем в localStorage
    localStorage.setItem('beautifulThemeApplied', 'true');
  }, [telegramColorToHex]);

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
      
      // Применяем нашу красивую тему
      applyBeautifulTheme();
      
      // Слушаем события изменения темы (но все равно применяем нашу)
      tg.onEvent('themeChanged', () => {
        console.log('🔄 Telegram изменил тему, но мы применяем нашу');
        setTimeout(() => {
          applyBeautifulTheme();
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
      
      console.log('✅ Telegram WebApp инициализирован с красивой темой');
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
      
      // Для разработки применяем красивую тему
      applyBeautifulTheme();
    }
  }, [applyBeautifulTheme, showToast]);

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