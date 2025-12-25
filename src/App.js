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

  // Функция для принудительного применения нашей темы
  const applyOurTheme = useCallback((isDark = false) => {
    console.log('🎨 Применяем нашу тему:', isDark ? 'темная' : 'светлая');
    
    const root = document.documentElement;
    
    if (isDark) {
      // Наша темная тема (как в Telegram Desktop)
      root.style.setProperty('--tg-theme-bg-color', '#0f0f0f');
      root.style.setProperty('--tg-theme-text-color', '#ffffff');
      root.style.setProperty('--tg-theme-hint-color', '#8e8e93');
      root.style.setProperty('--tg-theme-button-color', '#3390ec');
      root.style.setProperty('--tg-theme-button-text-color', '#ffffff');
      root.style.setProperty('--tg-theme-secondary-bg-color', '#1c1c1e');
      root.style.setProperty('--tg-theme-section-bg-color', '#2c2c2e');
      root.setAttribute('data-theme', 'dark');
      
      console.log('🌙 Применена наша темная тема');
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
      
      console.log('☀️ Применена наша светлая тема');
    }
    
    // Сохраняем выбор темы
    localStorage.setItem('forceTheme', isDark ? 'dark' : 'light');
    localStorage.setItem('themeApplied', 'true');
    
    console.log('✅ Тема применена на всех устройствах');
  }, []);

  // Определяем тему устройства
  const detectDeviceTheme = () => {
    // 1. Проверяем Telegram тему
    if (window.Telegram?.WebApp?.themeParams) {
      const params = window.Telegram.WebApp.themeParams;
      
      // Если есть цвет фона, определяем темную тему
      if (params.bg_color) {
        try {
          const bgColor = typeof params.bg_color === 'string' 
            ? parseInt(params.bg_color.replace('#', ''), 16)
            : params.bg_color;
          
          // Рассчитываем яркость фона
          const r = (bgColor >> 16) & 0xff;
          const g = (bgColor >> 8) & 0xff;
          const b = bgColor & 0xff;
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          
          console.log('📱 Яркость фона Telegram:', brightness);
          
          // Если фон темный (меньше 128)
          if (brightness < 128) {
            return true;
          }
        } catch (e) {
          console.error('Ошибка определения цвета Telegram:', e);
        }
      }
    }
    
    // 2. Проверяем системную тему
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      console.log('📱 Обнаружена системная темная тема');
      return true;
    }
    
    // 3. Проверяем user agent для мобильных устройств
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      console.log('📱 Это мобильное устройство');
      // Для мобильных по умолчанию тоже темная тема
      return true;
    }
    
    // 4. По умолчанию - темная тема для всех
    console.log('💻 По умолчанию темная тема');
    return true;
  };

  // Инициализация Telegram WebApp
  const initTelegramWebApp = useCallback(() => {
    console.log('🤖 Инициализация Telegram WebApp...');
    
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // Основные настройки
      tg.ready();
      tg.expand();
      
      // Определяем тему и применяем
      const isDark = detectDeviceTheme();
      applyOurTheme(isDark);
      
      // Слушаем события изменения темы
      tg.onEvent('themeChanged', () => {
        console.log('🔄 Telegram изменил тему');
        setTimeout(() => {
          const isDark = detectDeviceTheme();
          applyOurTheme(isDark);
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
      
      // Для разработки всегда темная тема
      applyOurTheme(true);
    }
  }, [applyOurTheme]);

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