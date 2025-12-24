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

  // Применяем тему Telegram
  const applyTelegramTheme = useCallback(() => {
    console.log('🎨 Применяем тему Telegram...');
    
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      const currentTheme = tg.colorScheme || 'light';
      
      // Устанавливаем тему
      document.documentElement.setAttribute('data-theme', currentTheme);
      
      // Применяем цвета Telegram
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
        
        if (tg.themeParams.link_color) {
          root.style.setProperty('--tg-theme-link-color', `#${tg.themeParams.link_color}`);
        }
        
        if (tg.themeParams.button_color) {
          root.style.setProperty('--tg-theme-button-color', `#${tg.themeParams.button_color}`);
        }
        
        if (tg.themeParams.button_text_color) {
          root.style.setProperty('--tg-theme-button-text-color', `#${tg.themeParams.button_text_color}`);
        }
        
        if (tg.themeParams.secondary_bg_color) {
          root.style.setProperty('--tg-theme-secondary-bg-color', `#${tg.themeParams.secondary_bg_color}`);
        }
      }
    }
  }, []);

  // Инициализация
  useEffect(() => {
    console.log('🚀 Инициализация TetherRabbit...');
    
    // Применяем тему Telegram
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
      
      // Слушаем изменения темы
      tg.onEvent('themeChanged', applyTelegramTheme);
      
      // BackButton
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
      // Для разработки
      setTelegramUser({
        id: '7879866656',
        telegramId: '7879866656',
        username: 'test_user',
        firstName: 'Тестовый',
        photoUrl: null
      });
    }
    
    // Завершаем загрузку
    setTimeout(() => {
      setIsLoading(false);
      console.log('✅ Инициализация завершена');
    }, 500);
    
    // Hash изменения
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
  }, [applyTelegramTheme]);

  // Навигация
  const navigateTo = (page) => {
    if (page === currentPage) return;
    
    window.location.hash = page;
    setCurrentPage(page);
    
    // BackButton
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

  // Навигация
  const Navigation = () => (
    <div className="bottom-nav">
      <button 
        className={`nav-item ${currentPage === 'profile' ? 'active' : ''}`} 
        onClick={() => navigateTo('profile')}
      >
        <div className="nav-icon">
          <ProfileIcon active={currentPage === 'profile'} />
        </div>
        <span className="nav-label">Профиль</span>
      </button>
      
      <button 
        className="nav-center" 
        onClick={() => navigateTo('home')}
      >
        <div className="nav-center-circle">
          <ExchangeIcon active={true} />
        </div>
        <span className="nav-center-label">Обмен</span>
      </button>
      
      <button 
        className={`nav-item ${currentPage === 'history' ? 'active' : ''}`} 
        onClick={() => navigateTo('history')}
      >
        <div className="nav-icon">
          <HistoryIcon active={currentPage === 'history'} />
        </div>
        <span className="nav-label">История</span>
      </button>
    </div>
  );

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