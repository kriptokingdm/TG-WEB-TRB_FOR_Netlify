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

  // Функция для принудительного обновления темы во всех компонентах
  const forceThemeUpdate = () => {
    const colors = getTelegramThemeColors();
    console.log('🎨 Форсированное обновление темы:', colors);
    
    // Устанавливаем тему в localStorage для всех компонентов
    localStorage.setItem('telegramTheme', JSON.stringify(colors));
    
    // Диспатчим событие о смене темы
    window.dispatchEvent(new CustomEvent('themeUpdated', { detail: colors }));
  };

  // Получаем цвета из Telegram WebApp
  const getTelegramThemeColors = () => {
    console.log('🔍 Получаем цвета Telegram...');
    
    // Сначала пробуем получить из window.Telegram
    if (window.Telegram?.WebApp?.themeParams) {
      const params = window.Telegram.WebApp.themeParams;
      console.log('📱 Telegram WebApp params:', params);
      
      const colors = {
        bg_color: params.bg_color ? `#${params.bg_color}` : '#ffffff',
        text_color: params.text_color ? `#${params.text_color}` : '#000000',
        hint_color: params.hint_color ? `#${params.hint_color}` : '#8e8e93',
        button_color: params.button_color ? `#${params.button_color}` : '#3390ec',
        button_text_color: params.button_text_color ? `#${params.button_text_color}` : '#ffffff',
        secondary_bg_color: params.secondary_bg_color ? `#${params.secondary_bg_color}` : '#f1f1f1',
        section_bg_color: params.secondary_bg_color ? `#${params.secondary_bg_color}` : '#e7e8ec'
      };
      
      console.log('🎨 Telegram colors:', colors);
      return colors;
    }
    
    // Пробуем получить из localStorage
    const savedTheme = localStorage.getItem('telegramTheme');
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        console.log('💾 Saved theme from localStorage:', parsed);
        return parsed;
      } catch (e) {
        console.error('❌ Ошибка парсинга сохраненной темы:', e);
      }
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

  // Применяем тему Telegram
  const applyTelegramTheme = useCallback(() => {
    console.log('🎨 Применяем тему Telegram...');
    
    const colors = getTelegramThemeColors();
    setThemeColors(colors);
    
    // Сохраняем тему в localStorage
    localStorage.setItem('telegramTheme', JSON.stringify(colors));
    
    // Устанавливаем CSS переменные
    const root = document.documentElement;
    
    root.style.setProperty('--tg-bg-color', colors.bg_color);
    root.style.setProperty('--tg-text-color', colors.text_color);
    root.style.setProperty('--tg-hint-color', colors.hint_color);
    root.style.setProperty('--tg-button-color', colors.button_color);
    root.style.setProperty('--tg-button-text-color', colors.button_text_color);
    root.style.setProperty('--tg-secondary-bg-color', colors.secondary_bg_color);
    root.style.setProperty('--tg-section-bg-color', colors.section_bg_color);
    
    // Устанавливаем атрибут data-theme
    const isDark = colors.bg_color === '#0f0f0f' || 
                   colors.bg_color === '#1c1c1c' || 
                   colors.bg_color === '#000000' ||
                   colors.bg_color.toLowerCase().includes('0f') ||
                   colors.bg_color.toLowerCase().includes('1c');
    
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    
    console.log('✅ Тема применена:', colors);
    console.log('📊 CSS переменные установлены');
    console.log('🎭 data-theme:', isDark ? 'dark' : 'light');
    
    // Форсируем обновление
    forceThemeUpdate();
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
        
        if (currentPage !== 'home') {
          tg.BackButton.show();
        } else {
          tg.BackButton.hide();
        }
      }
      
      // Слушаем события изменения темы
      tg.onEvent('themeChanged', () => {
        console.log('🔄 Изменение темы Telegram');
        setTimeout(() => {
          applyTelegramTheme();
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
      
      // Применяем тему разработки
      applyTelegramTheme();
    }
  }, [currentPage, applyTelegramTheme]);

  // Инициализация приложения
  useEffect(() => {
    console.log('🚀 Инициализация TetherRabbit...');
    console.log('🌍 Окружение:', {
      hasTelegram: !!window.Telegram,
      hasWebApp: !!window.Telegram?.WebApp,
      themeParams: window.Telegram?.WebApp?.themeParams
    });
    
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
    
    // Проверяем тему каждую секунду для отладки
    const themeCheck = setInterval(() => {
      const colors = getTelegramThemeColors();
      console.log('🔍 Проверка темы:', colors);
      
      const root = document.documentElement;
      console.log('📊 CSS переменные:', {
        bg: getComputedStyle(root).getPropertyValue('--tg-bg-color'),
        text: getComputedStyle(root).getPropertyValue('--tg-text-color'),
        button: getComputedStyle(root).getPropertyValue('--tg-button-color')
      });
    }, 5000);
    
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
    
    // Слушаем обновление темы
    const handleThemeUpdate = (e) => {
      console.log('🔄 Получено событие themeUpdated:', e.detail);
      setThemeColors(e.detail);
    };
    
    window.addEventListener('themeUpdated', handleThemeUpdate);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('themeUpdated', handleThemeUpdate);
      clearInterval(referralInterval);
      clearInterval(themeCheck);
    };
  }, [initTelegramWebApp, loadReferralData]);

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

  // Плавающая навигация iOS с Telegram стилем
  const Navigation = () => {
    // Доступная сумма для бейджа
    const availableEarnings = referralData?.stats?.available_earnings || 0;
    const showBadge = availableEarnings >= 10;
    
    // Получаем текущие цвета
    const currentColors = themeColors || getTelegramThemeColors();
    
    const navStyle = {
      background: currentColors.bg_color === '#ffffff' 
        ? 'rgba(255, 255, 255, 0.85)' 
        : 'rgba(15, 15, 15, 0.85)',
      borderColor: currentColors.secondary_bg_color
    };
    
    const activeButtonStyle = {
      color: currentColors.button_color
    };
    
    const inactiveButtonStyle = {
      color: currentColors.hint_color
    };
    
    const centerButtonStyle = {
      background: currentColors.button_color
    };
    
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
            <span className="nav-badge-floating" style={{
              background: '#FF3B30',
              color: '#ffffff'
            }}>
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
    const currentColors = themeColors || getTelegramThemeColors();
    const loaderStyle = {
      background: currentColors.bg_color,
      color: currentColors.text_color
    };
    
    return (
      <div className="app-loading" style={loaderStyle}>
        <div className="loading-spinner" style={{
          border: `2.5px solid ${currentColors.button_color}20`,
          borderTopColor: currentColors.button_color
        }}></div>
        <p style={{ color: currentColors.hintColor }}>Загрузка TetherRabbit...</p>
      </div>
    );
  }

  const currentColors = themeColors || getTelegramThemeColors();
  
  return (
    <div className="app" style={{ 
      background: currentColors.bg_color, 
      color: currentColors.text_color 
    }}>
      <div className="app-wrapper">
        <div className="app-content">
          {renderPage()}
          {currentPage !== 'help' && <Navigation />}
          
          {/* Уведомления */}
          {toast && (
            <div className="telegram-toast" style={{
              background: currentColors.bg_color === '#ffffff'
                ? 'rgba(255, 255, 255, 0.9)'
                : 'rgba(28, 28, 30, 0.9)',
              border: `0.5px solid ${currentColors.secondary_bg_color}`,
              color: currentColors.text_color
            }}>
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