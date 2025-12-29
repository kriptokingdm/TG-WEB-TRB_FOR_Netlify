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
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Конвертер цвета Telegram в hex
  const telegramColorToHex = useCallback((color) => {
    if (!color && color !== 0) return null;
    
    if (typeof color === 'string') {
      return color.startsWith('#') ? color : `#${color}`;
    } else if (typeof color === 'number') {
      const hex = color.toString(16).padStart(6, '0');
      return `#${hex}`;
    }
    
    return null;
  }, []);

  // Определяем темную тему
  const detectDarkMode = useCallback(() => {
    if (window.Telegram?.WebApp?.themeParams) {
      const params = window.Telegram.WebApp.themeParams;
      
      if (params?.bg_color) {
        try {
          let bgColor;
          if (typeof params.bg_color === 'string') {
            bgColor = parseInt(params.bg_color.replace('#', ''), 16);
          } else {
            bgColor = params.bg_color;
          }
          
          // Рассчитываем яркость
          const r = (bgColor >> 16) & 0xff;
          const g = (bgColor >> 8) & 0xff;
          const b = bgColor & 0xff;
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          
          console.log('📱 Яркость фона Telegram:', brightness);
          
          // Если фон темный - темная тема
          return brightness < 180; // Более гибкий порог
        } catch (error) {
          console.error('Ошибка определения цвета Telegram:', error);
        }
      }
    }
    
    // Проверяем системную тему
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }
    
    // По умолчанию - темная тема
    return true;
  }, []);

  // Применяем правильную тему
  const applyTheme = useCallback(() => {
    console.log('🎨 Применяем тему...');
    
    const root = document.documentElement;
    const darkMode = detectDarkMode();
    setIsDarkMode(darkMode);
    
    // Получаем цвета Telegram если есть
    let tgButtonColor = '#3390ec';
    let tgTextColor = '#000000';
    let tgHintColor = '#8e8e93';
    
    if (window.Telegram?.WebApp?.themeParams) {
      const params = window.Telegram.WebApp.themeParams;
      
      const buttonColor = telegramColorToHex(params.button_color);
      if (buttonColor) tgButtonColor = buttonColor;
      
      const textColor = telegramColorToHex(params.text_color);
      if (textColor) tgTextColor = textColor;
      
      const hintColor = telegramColorToHex(params.hint_color);
      if (hintColor) tgHintColor = hintColor;
    }
    
    if (darkMode) {
      // ТЕМНАЯ ТЕМА
      const darkBgColor = '#1a1d21'; // Красивый серый фон
      const darkCardBg = '#212428';
      const darkInputBg = '#2a2d32';
      const darkBorderColor = '#3a3d42';
      
      root.style.setProperty('--tg-theme-bg-color', darkBgColor);
      root.style.setProperty('--tg-theme-text-color', '#ffffff');
      root.style.setProperty('--tg-theme-hint-color', '#8e8e93');
      root.style.setProperty('--tg-theme-button-color', tgButtonColor);
      root.style.setProperty('--tg-theme-button-text-color', '#ffffff');
      root.style.setProperty('--tg-theme-secondary-bg-color', darkCardBg);
      root.style.setProperty('--tg-theme-section-bg-color', darkBorderColor);
      
      // Дополнительные цвета для темной темы
      root.style.setProperty('--tg-success-color', '#34c759');
      root.style.setProperty('--tg-error-color', '#ff3b30');
      root.style.setProperty('--tg-warning-color', '#ff9500');
      root.style.setProperty('--tg-info-color', '#5e5ce6');
      root.style.setProperty('--tg-card-bg', darkCardBg);
      root.style.setProperty('--tg-input-bg', darkInputBg);
      root.style.setProperty('--tg-border-color', darkBorderColor);
      root.style.setProperty('--tg-hover-color', '#2c2f34');
      
      root.setAttribute('data-theme', 'dark');
      console.log('🌙 Применена темная тема');
    } else {
      // СВЕТЛАЯ ТЕМА
      const lightBgColor = '#ffffff';
      const lightCardBg = '#f8f9fa';
      const lightInputBg = '#ffffff';
      const lightBorderColor = '#e0e0e0';
      
      root.style.setProperty('--tg-theme-bg-color', lightBgColor);
      root.style.setProperty('--tg-theme-text-color', '#000000');
      root.style.setProperty('--tg-theme-hint-color', '#8e8e93');
      root.style.setProperty('--tg-theme-button-color', tgButtonColor);
      root.style.setProperty('--tg-theme-button-text-color', '#ffffff');
      root.style.setProperty('--tg-theme-secondary-bg-color', lightCardBg);
      root.style.setProperty('--tg-theme-section-bg-color', lightBorderColor);
      
      // Дополнительные цвета для светлой темы
      root.style.setProperty('--tg-success-color', '#28a745');
      root.style.setProperty('--tg-error-color', '#dc3545');
      root.style.setProperty('--tg-warning-color', '#ffc107');
      root.style.setProperty('--tg-info-color', '#17a2b8');
      root.style.setProperty('--tg-card-bg', lightCardBg);
      root.style.setProperty('--tg-input-bg', lightInputBg);
      root.style.setProperty('--tg-border-color', lightBorderColor);
      root.style.setProperty('--tg-hover-color', '#e9ecef');
      
      root.removeAttribute('data-theme');
      console.log('☀️ Применена светлая тема');
    }
    
    localStorage.setItem('themeApplied', 'true');
  }, [detectDarkMode, telegramColorToHex]);

  // Переключение темы
  const toggleTheme = useCallback(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Обновляем тему в Telegram WebApp
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.setHeaderColor(newTheme === 'dark' ? '#1c1c1c' : '#ffffff');
      window.Telegram.WebApp.setBackgroundColor(newTheme === 'dark' ? '#1c1c1c' : '#ffffff');
    }
    
    // Применяем тему в приложении
    setIsDarkMode(newTheme === 'dark');
    applyTheme();
    
    showToast(`Тема изменена на ${newTheme === 'dark' ? 'тёмную' : 'светлую'}`, 'success');
  }, [applyTheme, showToast]);

  // Настройка Telegram WebApp Menu
  const setupTelegramMenu = useCallback(() => {
    if (window.Telegram?.WebApp) {
      try {
        const tg = window.Telegram.WebApp;
        console.log('⚙️ Настройка Telegram меню...');
        
        // Вариант 1: Используем кастомные события через postEvent
        // Это добавляет обработчик для меню Telegram
        tg.MainButton.hide();
        
        // Проверяем доступность MenuButton API
        if (tg.MenuButton && typeof tg.MenuButton.setText === 'function') {
          // Устанавливаем текст для кнопки меню
          tg.MenuButton.setText('Настройки');
          tg.MenuButton.show();
          
          // Обработчик нажатия на меню
          const handleMenuButtonClick = () => {
            console.log('🔄 Нажатие на меню Telegram');
            setShowSettingsModal(true);
          };
          
          // Подписываемся на событие клика по меню
          tg.MenuButton.onClick(handleMenuButtonClick);
          
          console.log('✅ Telegram MenuButton настроен');
          
          // Возвращаем функцию очистки
          return () => {
            tg.MenuButton.offClick(handleMenuButtonClick);
          };
        } else {
          // Вариант 2: Используем MainButton как альтернативу
          console.log('⚠️ MenuButton API недоступен, используем MainButton');
          
          tg.MainButton.setText('Настройки');
          tg.MainButton.show();
          tg.MainButton.onClick(() => {
            setShowSettingsModal(true);
          });
          
          return () => {
            tg.MainButton.offClick();
          };
        }
      } catch (error) {
        console.error('❌ Ошибка при настройке Telegram меню:', error);
      }
    }
    return () => {};
  }, []);

  // Показ уведомлений
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

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
      
      tg.ready();
      tg.expand();
      
      // Применяем тему
      applyTheme();
      
      // Слушаем события изменения темы
      tg.onEvent('themeChanged', () => {
        console.log('🔄 Telegram изменил тему');
        setTimeout(() => {
          applyTheme();
        }, 100);
      });
      
      // Настройка меню Telegram
      const cleanupMenu = setupTelegramMenu();
      
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
      
      // Возвращаем функцию очистки
      return cleanupMenu;
    } else {
      // Режим разработки
      console.log('💻 Режим разработки');
      
      setTelegramUser({
        id: '7879866656',
        telegramId: '7879866656',
        username: 'test_user',
        firstName: 'Тестовый',
        photoUrl: null
      });
      
      applyTheme();
    }
    
    return () => {};
  }, [applyTheme, setupTelegramMenu, showToast]);

  // Инициализация приложения
  useEffect(() => {
    console.log('🚀 Инициализация TetherRabbit...');
    
    const debugUser = {
      id: '7879866656',
      telegramId: '7879866656',
      username: 'TERBCEO',
      firstName: 'G'
    };
    localStorage.setItem('currentUser', JSON.stringify(debugUser));
    
    const cleanup = initTelegramWebApp();
    
    const hash = window.location.hash.replace('#', '');
    if (hash && ['home', 'profile', 'history', 'help'].includes(hash)) {
      setCurrentPage(hash);
    }
    
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
      if (cleanup) cleanup();
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

  // Модальное окно настроек
  const renderSettingsModal = () => {
    if (!showSettingsModal) return null;
    
    return (
      <div className="settings-modal-overlay" onClick={() => setShowSettingsModal(false)}>
        <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
          <div className="settings-modal-header">
            <h3 className="settings-modal-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M19.4 15C19.2663 15.3031 19.1335 15.6063 19 15.9L21 17.9C21.5 18.2 21.9 18.6 21.9 19.4C21.8 20.2 21.3 20.6 20.7 21L18.7 19C18.4 19.1 18.1 19.2 17.8 19.3C17.5 19.4 17.2 19.5 16.9 19.6L16.5 22H15.5L15.1 19.6C14.8 19.5 14.5 19.4 14.2 19.3C13.9 19.2 13.6 19.1 13.3 19L11.3 21C10.7 20.6 10.2 20.2 10.1 19.4C10 18.6 10.4 18.2 10.9 17.9L12.9 15.9C12.8 15.6 12.7 15.3 12.6 15H12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Настройки</span>
            </h3>
            <button 
              className="settings-modal-close"
              onClick={() => setShowSettingsModal(false)}
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>
          
          <div className="settings-modal-content">
            <div className="settings-section">
              <h4 className="settings-section-title">Внешний вид</h4>
              <div className="settings-list">
                <button 
                  className="settings-item"
                  onClick={toggleTheme}
                  aria-label="Переключить тему"
                >
                  <div className="settings-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 12.79C20.8427 14.4922 20.2039 16.1144 19.1582 17.4668C18.1125 18.8192 16.7035 19.8458 15.0957 20.4265C13.4879 21.0073 11.748 21.1181 10.0795 20.7461C8.41104 20.3741 6.88203 19.5345 5.67418 18.3267C4.46634 17.1188 3.62675 15.5898 3.25475 13.9214C2.88276 12.2529 2.99354 10.513 3.57432 8.90523C4.1551 7.29745 5.18168 5.88842 6.53407 4.84272C7.88647 3.79702 9.50862 3.15824 11.2108 3.00101C10.2134 4.34827 9.73375 6.00945 9.85843 7.68141C9.98312 9.35338 10.7039 10.9251 11.8894 12.1106C13.0749 13.2961 14.6466 14.0169 16.3186 14.1416C17.9906 14.2663 19.6518 13.7866 21 12.7892V12.79Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="settings-content">
                    <div className="settings-title">Тема приложения</div>
                    <div className="settings-description">
                      {isDarkMode ? 'Тёмная' : 'Светлая'}
                    </div>
                  </div>
                  <div className="settings-action">
                    <div className={`toggle-switch ${isDarkMode ? 'active' : ''}`}>
                      <div className="toggle-slider"></div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
            
            <div className="settings-section">
              <h4 className="settings-section-title">Аккаунт</h4>
              <div className="settings-list">
                <button 
                  className="settings-item"
                  onClick={() => {
                    setShowSettingsModal(false);
                    navigator.clipboard.writeText(telegramUser?.id || '');
                    showToast('✅ ID пользователя скопирован', 'success');
                  }}
                  aria-label="Копировать ID"
                >
                  <div className="settings-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 2C14.6522 2 17.1957 3.05357 19.0711 4.92893C20.9464 6.8043 22 9.34784 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2Z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="settings-content">
                    <div className="settings-title">ID пользователя</div>
                    <div className="settings-description">
                      {telegramUser?.id || '—'}
                    </div>
                  </div>
                  <div className="settings-action">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 12.9V17.1C16 20.6 14.6 22 11.1 22H6.9C3.4 22 2 20.6 2 17.1V12.9C2 9.4 3.4 8 6.9 8H11.1C14.6 8 16 9.4 16 12.9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M22 6.9V11.1C22 14.6 20.6 16 17.1 16H16V12.9C16 9.4 14.6 8 11.1 8H8V6.9C8 3.4 9.4 2 12.9 2H17.1C20.6 2 22 3.4 22 6.9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </button>
                
                <button 
                  className="settings-item"
                  onClick={() => {
                    setShowSettingsModal(false);
                    if (confirm('Вы уверены, что хотите выйти?')) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  aria-label="Выйти из аккаунта"
                  style={{ color: '#ff3b30' }}
                >
                  <div className="settings-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="settings-content">
                    <div className="settings-title">Выйти</div>
                    <div className="settings-description">
                      Завершить текущую сессию
                    </div>
                  </div>
                </button>
              </div>
            </div>
            
            <div className="settings-modal-footer">
              <p className="settings-app-version">
                TetherRabbit v1.0.0
              </p>
            </div>
          </div>
        </div>
      </div>
    );
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
          
          {renderSettingsModal()}
        </div>
      </div>
    </div>
  );
}

export default App;