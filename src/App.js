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

  // Получаем цвета из Telegram WebApp
  const getTelegramThemeColors = () => {
    console.log('🔍 Получаем цвета Telegram...');
    
    if (window.Telegram?.WebApp?.themeParams) {
      const params = window.Telegram.WebApp.themeParams;
      console.log('📱 Telegram WebApp params:', params);
      
      const colors = {
        bg_color: params.bg_color ? `#${params.bg_color.toString(16).padStart(6, '0')}` : '#ffffff',
        text_color: params.text_color ? `#${params.text_color.toString(16).padStart(6, '0')}` : '#000000',
        hint_color: params.hint_color ? `#${params.hint_color.toString(16).padStart(6, '0')}` : '#8e8e93',
        button_color: params.button_color ? `#${params.button_color.toString(16).padStart(6, '0')}` : '#3390ec',
        button_text_color: params.button_text_color ? `#${params.button_text_color.toString(16).padStart(6, '0')}` : '#ffffff',
        secondary_bg_color: params.secondary_bg_color ? `#${params.secondary_bg_color.toString(16).padStart(6, '0')}` : '#f1f1f1',
        section_bg_color: params.secondary_bg_color ? `#${params.secondary_bg_color.toString(16).padStart(6, '0')}` : '#e7e8ec'
      };
      
      console.log('🎨 Telegram colors:', colors);
      return colors;
    }
    
    // Дефолтные цвета
    const defaultColors = {
      bg_color: '#ffffff',
      text_color: '#000000',
      hint_color: '#8e8e93',
      button_color: '#3390ec',
      button_text_color: '#ffffff',
      secondary_bg_color: '#f1f1f1',
      section_bg_color: '#e7e8ec'
    };
    
    console.log('⚙️ Default colors:', defaultColors);
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
    
    // Также сохраняем в localStorage для других компонентов
    localStorage.setItem('telegramTheme', JSON.stringify(colors));
    
    console.log('✅ Тема применена:', colors);
    
    // Диспатчим событие обновления темы
    window.dispatchEvent(new Event('themeChanged'));
  }, []);

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
      
      // Инициализируем Back Button
      if (tg.BackButton) {
        tg.BackButton.onClick(() => {
          navigateTo('home');
        });
      }
      
      // Слушаем события изменения темы
      tg.onEvent('themeChanged', () => {
        console.log('🔄 Изменение темы Telegram');
        setTimeout(applyTelegramTheme, 100);
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
  }, [applyTelegramTheme, showToast]);

  // Инициализация приложения
  useEffect(() => {
    console.log('🚀 Инициализация TetherRabbit...');
    console.log('🌍 Окружение:', {
      hasTelegram: !!window.Telegram,
      hasWebApp: !!window.Telegram?.WebApp,
      themeParams: window.Telegram?.WebApp?.themeParams
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
    
    // Обновляем данные каждые 30 секунд
    const referralInterval = setInterval(loadReferralData, 30000);
    
    // Проверяем CSS переменные
    setTimeout(() => {
      const root = document.documentElement;
      console.log('📊 CSS переменные после установки:', {
        bg: getComputedStyle(root).getPropertyValue('--tg-theme-bg-color'),
        text: getComputedStyle(root).getPropertyValue('--tg-theme-text-color'),
        button: getComputedStyle(root).getPropertyValue('--tg-theme-button-color')
      });
    }, 500);
    
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
    
    // Управление BackButton при смене страницы
    const updateBackButton = () => {
      if (window.Telegram?.WebApp && window.Telegram.WebApp.BackButton) {
        if (currentPage === 'home') {
          window.Telegram.WebApp.BackButton.hide();
        } else {
          window.Telegram.WebApp.BackButton.show();
        }
      }
    };
    
    updateBackButton();
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      clearInterval(referralInterval);
    };
  }, [initTelegramWebApp, loadReferralData, currentPage]);

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