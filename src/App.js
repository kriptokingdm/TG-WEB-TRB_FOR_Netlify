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
  const [initialized, setInitialized] = useState(false); // Флаг инициализации

  // Показ уведомлений
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Применяем тему
  const applyTheme = useCallback(() => {
    const root = document.documentElement;
    
    // Простая тема без проверки Telegram
    if (isDarkMode) {
      root.setAttribute('data-theme', 'dark');
      root.style.setProperty('--tg-theme-bg-color', '#1a1d21');
      root.style.setProperty('--tg-theme-text-color', '#ffffff');
      root.style.setProperty('--tg-theme-button-color', '#3390ec');
    } else {
      root.removeAttribute('data-theme');
      root.style.setProperty('--tg-theme-bg-color', '#ffffff');
      root.style.setProperty('--tg-theme-text-color', '#000000');
      root.style.setProperty('--tg-theme-button-color', '#3390ec');
    }
  }, [isDarkMode]);

  // Загрузка реферальных данных
  const loadReferralData = useCallback(async () => {
    try {
      const userId = getUserId();
      console.log('📡 Загрузка реферальных данных для ID:', userId);
      
      const response = await fetch(`${API_BASE_URL}/api/referrals/info/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setReferralData(result.data);
        }
      }
    } catch (error) {
      console.warn('⚠️ Ошибка загрузки реферальных данных:', error);
      // Игнорируем ошибку, продолжаем работу
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
      return '7879866656';
    }
  };

  // Навигация
  const navigateTo = useCallback((page) => {
    if (page === currentPage) return;
    
    console.log(`➡️ Переход на страницу: ${page}`);
    window.location.hash = page;
    setCurrentPage(page);
  }, [currentPage]);

  // Инициализация Telegram WebApp
  const initTelegramWebApp = useCallback(() => {
    console.log('🤖 Инициализация Telegram WebApp...');
    
    if (window.Telegram?.WebApp && !initialized) {
      const tg = window.Telegram.WebApp;
      
      // Безопасная инициализация
      try {
        tg.ready();
        tg.expand();
        
        console.log('📱 Версия Telegram WebApp:', tg.version);
        
        // ВАЖНО: Проверяем поддержку BackButton
        // Если версия 6.0 или меньше - не используем BackButton
        const version = parseFloat(tg.version) || 6.0;
        
        if (version > 6.0 && tg.BackButton && typeof tg.BackButton.show === 'function') {
          console.log('🔙 BackButton поддерживается в версии', version);
          
          // Настраиваем кнопку "Назад"
          tg.BackButton.hide();
          
          tg.BackButton.onClick(() => {
            console.log('⬅️ Нажата кнопка "Назад"');
            navigateTo('home');
          });
        } else {
          console.log('⚠️ BackButton НЕ поддерживается в версии', version);
        }
        
      } catch (error) {
        console.error('❌ Ошибка инициализации Telegram:', error);
      }
      
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
        
        setTimeout(() => {
          showToast(`Добро пожаловать, ${userData.firstName}! 👋`, 'success');
        }, 1000);
      }
      
      console.log('✅ Telegram WebApp инициализирован');
    } else {
      // Режим разработки или уже инициализирован
      if (!initialized) {
        console.log('💻 Режим разработки или Telegram не найден');
        
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
    }
    
    // Применяем тему
    applyTheme();
    setInitialized(true);
  }, [applyTheme, showToast, navigateTo, initialized]);

  // Инициализация приложения (только один раз!)
  useEffect(() => {
    if (initialized) return; // Не инициализируем повторно
    
    console.log('🚀 Инициализация TetherRabbit...');
    
    try {
      // Устанавливаем пользователя по умолчанию один раз
      if (!localStorage.getItem('currentUser')) {
        const debugUser = {
          id: '7879866656',
          telegramId: '7879866656',
          username: 'TERBCEO',
          firstName: 'G'
        };
        localStorage.setItem('currentUser', JSON.stringify(debugUser));
      }
      
      // Загружаем данные только один раз
      const hash = window.location.hash.replace('#', '');
      if (hash && ['home', 'profile', 'history', 'help'].includes(hash)) {
        setCurrentPage(hash);
      }
      
      // Инициализируем Telegram
      initTelegramWebApp();
      
      // Загружаем реферальные данные с задержкой
      setTimeout(() => {
        loadReferralData();
      }, 500);
      
      // Завершаем загрузку
      setTimeout(() => {
        setIsLoading(false);
        console.log('✅ Инициализация завершена');
      }, 1000);
      
    } catch (error) {
      console.error('❌ Ошибка инициализации:', error);
      setIsLoading(false);
      setInitialized(true);
    }
  }, [initTelegramWebApp, loadReferralData, initialized]);

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