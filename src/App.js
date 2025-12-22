// App.js - Полная версия с Telegram темами
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
  const [theme, setTheme] = useState('light');

  // Применяем тему Telegram
  const applyTelegramTheme = useCallback(() => {
    console.log('🎨 Применяем тему Telegram...');
    
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      const currentTheme = tg.colorScheme || 'light';
      
      // Устанавливаем тему
      setTheme(currentTheme);
      document.documentElement.setAttribute('data-theme', currentTheme);
      document.body.setAttribute('data-theme', currentTheme);
      
      // Применяем цвета Telegram
      if (tg.themeParams) {
        const root = document.documentElement;
        
        if (tg.themeParams.bg_color) {
          root.style.setProperty('--tg-bg-color', `#${tg.themeParams.bg_color}`);
          document.body.style.backgroundColor = `#${tg.themeParams.bg_color}`;
        }
        
        if (tg.themeParams.text_color) {
          root.style.setProperty('--tg-text-color', `#${tg.themeParams.text_color}`);
        }
        
        if (tg.themeParams.hint_color) {
          root.style.setProperty('--tg-hint-color', `#${tg.themeParams.hint_color}`);
        }
        
        if (tg.themeParams.link_color) {
          root.style.setProperty('--tg-link-color', `#${tg.themeParams.link_color}`);
        }
        
        if (tg.themeParams.button_color) {
          root.style.setProperty('--tg-button-color', `#${tg.themeParams.button_color}`);
        }
        
        if (tg.themeParams.button_text_color) {
          root.style.setProperty('--tg-button-text-color', `#${tg.themeParams.button_text_color}`);
        }
      }
    }
  }, []);

  // Фикс скролла
  const fixScrollIssues = useCallback(() => {
    // Устанавливаем правильную высоту
    document.documentElement.style.height = '100%';
    document.documentElement.style.overflow = 'auto';
    
    document.body.style.height = '100%';
    document.body.style.overflow = 'auto';
    document.body.style.webkitOverflowScrolling = 'touch';
    
    // Исправляем контейнеры
    const app = document.querySelector('.app');
    if (app) {
      app.style.overflow = 'visible';
      app.style.height = '100%';
    }
    
    const appContent = document.querySelector('.app-content');
    if (appContent) {
      appContent.style.overflowY = 'auto';
      appContent.style.height = '100%';
      appContent.style.webkitOverflowScrolling = 'touch';
    }
    
    // Убираем overscroll-behavior
    document.documentElement.style.overscrollBehavior = 'auto';
    document.body.style.overscrollBehavior = 'auto';
    
    console.log('✅ Фикс скролла применен');
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
    
    // Фиксим скролл
    setTimeout(fixScrollIssues, 300);
    
    // Завершаем загрузку
    setTimeout(() => {
      setIsLoading(false);
      console.log('✅ Инициализация завершена');
    }, 500);
    
    // Слушаем ресайз
    window.addEventListener('resize', fixScrollIssues);
    window.addEventListener('orientationchange', fixScrollIssues);
    
    // Hash изменения
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== currentPage && ['home', 'profile', 'history', 'help'].includes(hash)) {
        setCurrentPage(hash);
      }
    };
    
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('resize', fixScrollIssues);
      window.removeEventListener('orientationchange', fixScrollIssues);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [applyTelegramTheme, fixScrollIssues]);

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
    
    // Фиксим скролл
    setTimeout(fixScrollIssues, 100);
  };

  // Рендер
  const renderPage = () => {
    const commonProps = {
      telegramUser: telegramUser,
      navigateTo: navigateTo,
      API_BASE_URL: API_BASE_URL,
      theme: theme
    };
    
    switch(currentPage) {
      case 'history': return <History key="history" {...commonProps} />;
      case 'profile': return <Profile key="profile" {...commonProps} />;
      case 'help': return <Help key="help" {...commonProps} />;
      default: return <Home key="home" {...commonProps} />;
    }
  };

  // Навигация (исправленная)
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
    <div className="app" data-theme={theme}>
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










// // App.js - Исправленный с реферальной системой и корректной работой API
// import React, { useState, useEffect, useCallback } from 'react';
// import './App.css';
// import Home from './Home';
// import History from './History';
// import Profile from './Profile';
// import Help from './Help';
// import { ProfileIcon, ExchangeIcon, HistoryIcon } from './NavIcons';

// // Определяем URL API в зависимости от окружения
// const IS_DEVELOPMENT = window.location.hostname === 'localhost' || 
//                        window.location.hostname === '127.0.0.1';

// const API_BASE_URL = IS_DEVELOPMENT 
//   ? 'http://localhost:3002'  // для разработки (прямое подключение)
//   : 'https://tethrab.shop';  // для продакшена

// console.log('🌐 API_BASE_URL:', API_BASE_URL, 'Development mode:', IS_DEVELOPMENT);

// // Хелпер для работы с fetch
// const apiFetch = async (endpoint, options = {}) => {
//   const url = `${API_BASE_URL}${endpoint}`;
  
//   const defaultHeaders = {
//     'Content-Type': 'application/json',
//     'Accept': 'application/json',
//   };
  
//   const config = {
//     ...options,
//     headers: {
//       ...defaultHeaders,
//       ...options.headers,
//     },
//     // Убираем credentials если не нужны
//     // credentials: 'include' // Не используем для API без кук
//   };
  
//   console.log('📡 API запрос:', url, config.method || 'GET');
  
//   try {
//     const response = await fetch(url, config);
    
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
    
//     const data = await response.json();
//     console.log('✅ API ответ:', endpoint, data.success !== undefined ? `success: ${data.success}` : '');
    
//     return data;
//   } catch (error) {
//     console.error('❌ API ошибка:', endpoint, error.message);
    
//     // Для ошибок сети
//     if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
//       throw new Error('Ошибка подключения к серверу. Проверьте интернет соединение.');
//     }
    
//     throw error;
//   }
// };

// function App() {
//   const [currentPage, setCurrentPage] = useState('home');
//   const [telegramUser, setTelegramUser] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [theme, setTheme] = useState('light');

//   // Функция для применения цветов Telegram
//   const applyTelegramColors = useCallback(() => {
//     console.log('🎨 Применяем цвета Telegram...');
    
//     let buttonColor = '#3390ec';
//     let buttonTextColor = '#ffffff';
//     let successColor = '#34c759';
//     let currentTheme = 'light';
    
//     if (window.Telegram?.WebApp) {
//       const tg = window.Telegram.WebApp;
      
//       // Получаем тему (светлая/темная)
//       currentTheme = tg.colorScheme || 'light';
      
//       // Получаем цвет кнопки
//       if (tg.themeParams?.button_color) {
//         buttonColor = `#${tg.themeParams.button_color}`;
//       } else if (tg.themeParams?.link_color) {
//         buttonColor = `#${tg.themeParams.link_color}`;
//       }
      
//       // Получаем цвет текста кнопки
//       if (tg.themeParams?.button_text_color) {
//         buttonTextColor = `#${tg.themeParams.button_text_color}`;
//       }
//     }
    
//     // Устанавливаем тему
//     setTheme(currentTheme);
//     document.documentElement.setAttribute('data-theme', currentTheme);
//     localStorage.setItem('appTheme', currentTheme);
    
//     // Устанавливаем CSS переменные
//     const root = document.documentElement;
//     root.style.setProperty('--tg-button-color', buttonColor);
//     root.style.setProperty('--tg-button-text-color', buttonTextColor);
//     root.style.setProperty('--tg-success', successColor);
    
//   }, []);

//   // Функция для исправления скролла
//   const fixScrollIssues = useCallback(() => {
//     console.log('🔧 Исправляем проблемы со скроллом...');
    
//     // Устанавливаем правильную высоту для body и html
//     document.documentElement.style.height = '100%';
//     document.documentElement.style.overflow = 'auto';
    
//     document.body.style.height = '100%';
//     document.body.style.overflow = 'auto';
//     document.body.style.webkitOverflowScrolling = 'touch';
    
//     // Исправляем контейнеры приложения
//     const app = document.querySelector('.app');
//     if (app) {
//       app.style.overflow = 'visible';
//       app.style.height = '100%';
//     }
    
//     const appWrapper = document.querySelector('.app-wrapper');
//     if (appWrapper) {
//       appWrapper.style.overflow = 'visible';
//       appWrapper.style.height = '100%';
//     }
    
//     const appContent = document.querySelector('.app-content');
//     if (appContent) {
//       appContent.style.overflowY = 'auto';
//       appContent.style.height = '100%';
//       appContent.style.webkitOverflowScrolling = 'touch';
//     }
    
//     // Убираем overscroll-behavior если он блокирует скролл
//     document.documentElement.style.overscrollBehavior = 'auto';
//     document.body.style.overscrollBehavior = 'auto';
    
//     console.log('✅ Фикс скролла применен');
//   }, []);

//   // Функция обработки реферальной ссылки
//   const processReferralStart = useCallback(async (startParam, userData) => {
//     try {
//       if (startParam && startParam.startsWith('ref_')) {
//         console.log('🔗 Обрабатываем реферальную ссылку:', startParam);
        
//         const result = await apiFetch('/api/referrals/process-start', {
//           method: 'POST',
//           body: JSON.stringify({
//             startParam: startParam,
//             userId: userData.id,
//             username: userData.username,
//             firstName: userData.firstName
//           })
//         });

//         if (result.success) {
//           console.log('✅ Реферальная ссылка успешно обработана');
          
//           // Показываем уведомление пользователю
//           if (window.Telegram?.WebApp) {
//             const tg = window.Telegram.WebApp;
//             tg.showAlert('🎉 Вы присоединились по реферальной ссылке! Теперь ваш пригласивший будет получать 1% от ваших сделок.');
//           }
//         } else {
//           console.warn('⚠️ Реферальная ссылка не обработана:', result.error);
//         }
//       }
//     } catch (error) {
//       console.error('❌ Ошибка обработки реферальной ссылки:', error);
//     }
//   }, []);

//   // Проверка здоровья API
//   const checkApiHealth = useCallback(async () => {
//     try {
//       console.log('🏥 Проверяем здоровье API...');
//       const health = await apiFetch('/health');
//       console.log('✅ API работает:', health.message);
//       return true;
//     } catch (error) {
//       console.error('❌ API недоступен:', error.message);
//       return false;
//     }
//   }, []);

//   // Инициализация приложения
//   useEffect(() => {
//     const initApp = async () => {
//       console.log('🚀 Запуск TetherRabbit App...');
      
//       // Применяем цвета Telegram
//       applyTelegramColors();
      
//       // Hash навигация
//       const hash = window.location.hash.replace('#', '');
//       console.log('🔗 Initial hash:', hash);
      
//       if (hash && ['home', 'profile', 'history', 'help'].includes(hash)) {
//         console.log('📍 Setting initial page from hash:', hash);
//         setCurrentPage(hash);
//       }
      
//       // Проверяем доступность API
//       const apiIsHealthy = await checkApiHealth();
//       if (!apiIsHealthy && !IS_DEVELOPMENT) {
//         // Показываем предупреждение если API недоступен
//         console.warn('⚠️ API недоступен, но продолжаем загрузку приложения');
//       }
      
//       // Telegram WebApp инициализация
//       if (window.Telegram && window.Telegram.WebApp) {
//         const tg = window.Telegram.WebApp;
//         tg.ready();
//         tg.expand();
        
//         // Получаем пользователя Telegram
//         if (tg.initDataUnsafe?.user) {
//           const tgUser = tg.initDataUnsafe.user;
//           const userData = {
//             id: tgUser.id.toString(),
//             telegramId: tgUser.id,
//             username: tgUser.username || `user_${tgUser.id}`,
//             firstName: tgUser.first_name || 'Пользователь',
//             lastName: tgUser.last_name || '',
//             photoUrl: tgUser.photo_url || null
//           };
          
//           setTelegramUser(userData);
//           localStorage.setItem('telegramUser', JSON.stringify(userData));
//           localStorage.setItem('currentUser', JSON.stringify(userData));
          
//           // Обрабатываем реферальную ссылку если есть
//           const startParam = tg.initDataUnsafe?.start_param;
//           if (startParam) {
//             processReferralStart(startParam, userData);
//           }
//         }
        
//         // Слушаем изменения темы
//         tg.onEvent('themeChanged', applyTelegramColors);
        
//         // Включаем фичу BackButton для навигации
//         if (tg.BackButton) {
//           tg.BackButton.onClick(() => {
//             if (currentPage !== 'home') {
//               navigateTo('home');
//             } else {
//               tg.BackButton.hide();
//             }
//           });
//         }
//       } else {
//         // Для разработки без Telegram - создаем тестового пользователя
//         if (IS_DEVELOPMENT) {
//           console.log('👤 Создаем тестового пользователя для разработки');
//           const testUser = {
//             id: '7879866656',
//             telegramId: '7879866656',
//             username: 'test_user',
//             firstName: 'Тестовый',
//             lastName: 'Пользователь',
//             photoUrl: null
//           };
//           setTelegramUser(testUser);
//           localStorage.setItem('telegramUser', JSON.stringify(testUser));
//           localStorage.setItem('currentUser', JSON.stringify(testUser));
//         }
//       }
      
//       // Применяем фикс скролла с задержкой
//       setTimeout(() => {
//         fixScrollIssues();
//       }, 300);
      
//       setTimeout(() => {
//         setIsLoading(false);
//         console.log('✅ Инициализация завершена');
//       }, 500);
//     };
    
//     initApp();
    
//     // Применяем фикс при ресайзе
//     window.addEventListener('resize', fixScrollIssues);
//     window.addEventListener('orientationchange', fixScrollIssues);
    
//     // Слушаем изменения hash для навигации
//     const handleHashChange = () => {
//       const hash = window.location.hash.replace('#', '');
//       if (hash && hash !== currentPage && ['home', 'profile', 'history', 'help'].includes(hash)) {
//         setCurrentPage(hash);
//       }
//     };
    
//     window.addEventListener('hashchange', handleHashChange);
    
//     return () => {
//       window.removeEventListener('resize', fixScrollIssues);
//       window.removeEventListener('orientationchange', fixScrollIssues);
//       window.removeEventListener('hashchange', handleHashChange);
//     };
//   }, [applyTelegramColors, fixScrollIssues, processReferralStart, checkApiHealth]);

//   // Функция навигации
//   const navigateTo = (page) => {
//     if (page === currentPage) return;
    
//     // Обновляем hash
//     window.location.hash = page;
//     setCurrentPage(page);
    
//     // Показываем/скрываем BackButton в зависимости от страницы
//     if (window.Telegram?.WebApp && window.Telegram.WebApp.BackButton) {
//       if (page === 'home') {
//         window.Telegram.WebApp.BackButton.hide();
//       } else {
//         window.Telegram.WebApp.BackButton.show();
//       }
//     }
    
//     // После навигации фиксим скролл
//     setTimeout(fixScrollIssues, 100);
//   };

//   // Рендер страницы
//   const renderPage = () => {
//     const commonProps = {
//       telegramUser: telegramUser,
//       theme: theme,
//       navigateTo: navigateTo,
//       apiFetch: apiFetch, // Передаем хелпер для API
//       API_BASE_URL: API_BASE_URL // Передаем URL API
//     };
    
//     switch(currentPage) {
//       case 'history': 
//         return <History key="history" {...commonProps} />;
//       case 'profile': 
//         return <Profile key="profile" {...commonProps} />;
//       case 'help': 
//         return <Help key="help" {...commonProps} />;
//       default: 
//         return <Home key="home" {...commonProps} />;
//     }
//   };

//   // Компонент навигации
//   const Navigation = () => (
//     <div className="bottom-nav-new">
//       <button 
//         className={`nav-item-new ${currentPage === 'profile' ? 'active' : ''}`} 
//         onClick={() => navigateTo('profile')}
//       >
//         <div className="nav-icon-wrapper">
//           <ProfileIcon active={currentPage === 'profile'} />
//         </div>
//         <span className="nav-label">Профиль</span>
//       </button>
      
//       <button 
//         className="nav-center-item" 
//         onClick={() => navigateTo('home')}
//       >
//         <div className="nav-center-circle">
//           <ExchangeIcon active={true} />
//         </div>
//         <span className="nav-center-label">Обмен</span>
//       </button>
      
//       <button 
//         className={`nav-item-new ${currentPage === 'history' ? 'active' : ''}`} 
//         onClick={() => navigateTo('history')}
//       >
//         <div className="nav-icon-wrapper">
//           <HistoryIcon active={currentPage === 'history'} />
//         </div>
//         <span className="nav-label">История</span>
//       </button>
//     </div>
//   );

//   // Лоадер
//   if (isLoading) {
//     return (
//       <div className="app-loading">
//         <div className="loading-spinner"></div>
//         <p className="loading-text">Инициализация TetherRabbit...</p>
//         {IS_DEVELOPMENT && (
//           <p className="loading-hint">
//             🔧 Режим разработки: API на {API_BASE_URL}
//           </p>
//         )}
//       </div>
//     );
//   }

//   return (
//     <div className="app">
//       <div className="app-wrapper">
//         <div className="app-content">
//           {renderPage()}
//           {/* Навигация будет видна на всех страницах кроме help (по желанию) */}
//           {currentPage !== 'help' && <Navigation />}
          
//           {/* Отладочная информация для разработки */}
//           {IS_DEVELOPMENT && (
//             <div className="debug-info">
//               <small>
//                 API: {API_BASE_URL} | User: {telegramUser?.id || 'нет'} | 
//                 Тест API: 
//                 <button 
//                   onClick={() => apiFetch('/health').then(data => console.log('Health:', data))}
//                   style={{marginLeft: '5px', padding: '2px 5px', fontSize: '10px'}}
//                 >
//                   Проверить
//                 </button>
//               </small>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default App;