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

  // Применяем тему Telegram
  const applyTelegramTheme = useCallback(() => {
    console.log('🎨 Применяем iOS тему...');
    
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      const currentTheme = tg.colorScheme || 'light';
      
      document.documentElement.setAttribute('data-theme', currentTheme);
      
      if (tg.themeParams) {
        const root = document.documentElement;
        
        if (tg.themeParams.bg_color) {
          root.style.setProperty('--tg-theme-bg-color', `#${tg.themeParams.bg_color}`);
        }
        
        if (tg.themeParams.text_color) {
          root.style.setProperty('--tg-theme-text-color', `#${tg.themeParams.text_color}`);
        }
        
        if (tg.themeParams.hint_color) {
          root.style.setProperty('--tg-theme-hint-color', `#${tg.themeParams.hint_color}`);
        }
        
        if (tg.themeParams.button_color) {
          root.style.setProperty('--tg-theme-button-color', `#${tg.themeParams.button_color}`);
        }
      }
    } else {
      // iOS цвета по умолчанию
      document.documentElement.style.setProperty('--tg-theme-button-color', '#007AFF');
      document.documentElement.style.setProperty('--tg-theme-bg-color', '#ffffff');
      document.documentElement.style.setProperty('--tg-theme-text-color', '#000000');
      document.documentElement.style.setProperty('--tg-theme-hint-color', '#8e8e93');
    }
  }, []);

  // Инициализация
  useEffect(() => {
    console.log('🚀 Инициализация TetherRabbit iOS...');
    
    applyTelegramTheme();
    
    // Hash навигация
    const hash = window.location.hash.replace('#', '');
    if (hash && ['home', 'profile', 'history', 'help'].includes(hash)) {
      setCurrentPage(hash);
    }
    
    // Telegram WebApp
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      
      if (tg.initDataUnsafe?.user) {
        const tgUser = tg.initDataUnsafe.user;
        const userData = {
          id: tgUser.id.toString(),
          telegramId: tgUser.id,
          username: tgUser.username || `user_${tgUser.id}`,
          firstName: tgUser.first_name || 'Пользователь',
          lastName: tgUser.last_name || '',
          photoUrl: tgUser.photo_url || null
        };
        
        setTelegramUser(userData);
        localStorage.setItem('telegramUser', JSON.stringify(userData));
        localStorage.setItem('currentUser', JSON.stringify(userData));
      }
      
      tg.onEvent('themeChanged', applyTelegramTheme);
      
      if (tg.BackButton) {
        tg.BackButton.onClick(() => {
          if (currentPage !== 'home') {
            navigateTo('home');
          } else {
            tg.BackButton.hide();
          }
        });
      }
    } else {
      setTelegramUser({
        id: '7879866656',
        telegramId: '7879866656',
        username: 'test_user',
        firstName: 'Тестовый',
        photoUrl: null
      });
    }
    
    // Загружаем реферальные данные для бейджа
    loadReferralData();
    
    setTimeout(() => {
      setIsLoading(false);
      console.log('✅ iOS инициализация завершена');
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
    };
  }, [applyTelegramTheme, loadReferralData]);

  // Навигация
  const navigateTo = (page) => {
    if (page === currentPage) return;
    
    window.location.hash = page;
    setCurrentPage(page);
    
    if (window.Telegram?.WebApp && window.Telegram.WebApp.BackButton) {
      if (page === 'home') {
        window.Telegram.WebApp.BackButton.hide();
      } else {
        window.Telegram.WebApp.BackButton.show();
      }
    }
  };

  // Рендер
  const renderPage = () => {
    const commonProps = {
      telegramUser: telegramUser,
      navigateTo: navigateTo,
      API_BASE_URL: API_BASE_URL
    };
    
    switch(currentPage) {
      case 'history': return <History key="history" {...commonProps} />;
      case 'profile': return <Profile key="profile" {...commonProps} />;
      case 'help': return <Help key="help" {...commonProps} />;
      default: return <Home key="home" {...commonProps} />;
    }
  };

  // Плавающая навигация iOS
  const Navigation = () => {
    // Доступная сумма для бейджа
    const availableEarnings = referralData?.stats?.available_earnings || 0;
    const showBadge = availableEarnings >= 10; // Показывать если >= $10
    
    return (
      <div className="floating-nav">
        <button 
          className={`nav-item-floating ${currentPage === 'profile' ? 'active' : ''}`} 
          onClick={() => navigateTo('profile')}
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
          >
            <ExchangeIcon active={true} />
          </button>
          <span className="nav-center-label-floating">Обмен</span>
        </div>
        
        <button 
          className={`nav-item-floating ${currentPage === 'history' ? 'active' : ''}`} 
          onClick={() => navigateTo('history')}
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
        </div>
      </div>
    </div>
  );
}

export default App;