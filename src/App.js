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

  // Простая функция определения темы
  const detectDarkMode = useCallback(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme === 'dark';
    }
    
    // Проверяем Telegram тему
    if (window.Telegram?.WebApp?.colorScheme === 'dark') {
      return true;
    }
    
    // По умолчанию темная
    return true;
  }, []);

  // Простая функция применения темы
  const applyTheme = useCallback(() => {
    const root = document.documentElement;
    const darkMode = detectDarkMode();
    setIsDarkMode(darkMode);
    
    if (darkMode) {
      // ТЕМНАЯ ТЕМА
      root.style.setProperty('--tg-theme-bg-color', '#1a1d21');
      root.style.setProperty('--tg-theme-text-color', '#ffffff');
      root.style.setProperty('--tg-theme-hint-color', '#8e8e93');
      root.style.setProperty('--tg-theme-button-color', '#3390ec');
      root.style.setProperty('--tg-theme-button-text-color', '#ffffff');
      root.style.setProperty('--tg-theme-secondary-bg-color', '#212428');
      root.setAttribute('data-theme', 'dark');
    } else {
      // СВЕТЛАЯ ТЕМА
      root.style.setProperty('--tg-theme-bg-color', '#ffffff');
      root.style.setProperty('--tg-theme-text-color', '#000000');
      root.style.setProperty('--tg-theme-hint-color', '#8e8e93');
      root.style.setProperty('--tg-theme-button-color', '#3390ec');
      root.style.setProperty('--tg-theme-button-text-color', '#ffffff');
      root.style.setProperty('--tg-theme-secondary-bg-color', '#f8f9fa');
      root.removeAttribute('data-theme');
    }
  }, [detectDarkMode]);

  // Показ уведомлений
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Переключение темы
  const toggleTheme = useCallback(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme();
    showToast(`Тема изменена на ${newTheme === 'dark' ? 'тёмную' : 'светлую'}`, 'success');
  }, [applyTheme, showToast]);

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
      return '7879866656';
    }
  };

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

  // Инициализация Telegram WebApp
  const initTelegramWebApp = useCallback(() => {
    console.log('🤖 Инициализация Telegram WebApp...');
    
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      tg.ready();
      tg.expand();
      
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
      }
      
      // ПРОСТАЯ И НАДЕЖНАЯ НАСТРОЙКА КНОПКИ НАСТРОЕК
      // Telegram автоматически добавляет стандартное меню (три точки)
      // Мы не можем его кастомизировать через WebApp API
      // Поэтому мы просто скрываем MainButton
      if (tg.MainButton && tg.MainButton.hide) {
        tg.MainButton.hide();
      }
      
      console.log('✅ Telegram WebApp инициализирован');
    } else {
      // Режим разработки
      console.log('💻 Режим разработки');
      
      const devUser = {
        id: '7879866656',
        telegramId: '7879866656',
        username: 'test_user',
        firstName: 'Тестовый',
        photoUrl: null
      };
      
      setTelegramUser(devUser);
      localStorage.setItem('currentUser', JSON.stringify(devUser));
    }
    
    // Применяем тему
    applyTheme();
    
    // Показываем приветствие
    setTimeout(() => {
      if (telegramUser?.firstName) {
        showToast(`Добро пожаловать, ${telegramUser.firstName}! 👋`, 'success');
      }
    }, 1000);
  }, [applyTheme, showToast, telegramUser]);

  // Инициализация приложения
  useEffect(() => {
    console.log('🚀 Инициализация TetherRabbit...');
    
    try {
      // Устанавливаем пользователя по умолчанию для отладки
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
      }, 500);
      
    } catch (error) {
      console.error('❌ Ошибка инициализации:', error);
      setIsLoading(false);
    }
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
      showToast: showToast,
      toggleTheme: toggleTheme,
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