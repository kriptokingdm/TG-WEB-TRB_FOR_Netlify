import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import Home from './Home';
import History from './History';
import Profile from './Profile';
import Help from './Help';
import SettingsApp from './SettingsApp';
import { ProfileIcon, ExchangeIcon, HistoryIcon } from './NavIcons';
import Game from './Game';

const API_BASE_URL = 'https://tethrab.shop';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [telegramUser, setTelegramUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [referralData, setReferralData] = useState(null);
  const [toast, setToast] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [hideHints, setHideHints] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);

  const navRef = useRef(null);
  const indicatorRef = useRef(null);
  const tabsRef = useRef({});
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    currentX: 0,
    startIndex: 1,
    startLeft: 0,
    startWidth: 0,
    threshold: 30
  });

  // Загружаем настройки
  useEffect(() => {
    const saved = localStorage.getItem('hideHints');
    if (saved === 'true') setHideHints(true);
  }, []);

  // Показ уведомлений
  const showToast = useCallback((message, type = 'info') => {
    if (hideHints && type === 'info') return;
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, [hideHints]);

  // Обновление настроек
  const updateHideHints = useCallback((value) => {
    setHideHints(value);
    localStorage.setItem('hideHints', value.toString());
  }, []);

  // Переключение темы
  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    if (newDarkMode) {
      root.style.setProperty('--tg-theme-bg-color', '#1a1d21');
      root.style.setProperty('--tg-theme-text-color', '#ffffff');
      root.style.setProperty('--tg-theme-hint-color', '#8e8e93');
      root.style.setProperty('--tg-theme-button-color', '#3390ec');
      root.style.setProperty('--tg-theme-button-text-color', '#ffffff');
      root.style.setProperty('--tg-theme-secondary-bg-color', '#212428');
      root.style.setProperty('--tg-theme-section-bg-color', '#3a3d42');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.style.setProperty('--tg-theme-bg-color', '#ffffff');
      root.style.setProperty('--tg-theme-text-color', '#000000');
      root.style.setProperty('--tg-theme-hint-color', '#8e8e93');
      root.style.setProperty('--tg-theme-button-color', '#3390ec');
      root.style.setProperty('--tg-theme-button-text-color', '#ffffff');
      root.style.setProperty('--tg-theme-secondary-bg-color', '#f8f9fa');
      root.style.setProperty('--tg-theme-section-bg-color', '#e0e0e0');
      root.removeAttribute('data-theme');
    }
    
    showToast(`Тема изменена на ${newDarkMode ? 'тёмную' : 'светлую'}`, 'success');
  }, [isDarkMode, showToast]);

  // Получение ID пользователя
  const getUserId = () => {
    try {
      if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
        return window.Telegram.WebApp.initDataUnsafe.user.id.toString();
      }
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        return parsed.telegramId?.toString() || parsed.id?.toString();
      }
      return '7879866656';
    } catch {
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
        if (result.success) setReferralData(result.data);
      }
    } catch (error) {
      console.error('Ошибка загрузки реферальных данных:', error);
    }
  }, []);

  // Индекс страницы
  const pageToIndex = (page) => {
    if (page === 'profile') return 0;
    if (page === 'home') return 1;
    return 2;
  };

  const indexToPage = (index) => {
    if (index === 0) return 'profile';
    if (index === 1) return 'home';
    return 'history';
  };

  // Обновление позиции индикатора
  const updateIndicator = useCallback((targetPage = currentPage) => {
    const nav = navRef.current;
    const indicator = indicatorRef.current;
    if (!nav || !indicator) return;

    const activeTab = tabsRef.current[targetPage];
    if (!activeTab) return;

    const navRect = nav.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    
    const left = tabRect.left - navRect.left;
    const width = tabRect.width;

    indicator.style.transform = `translateX(${left}px)`;
    indicator.style.width = `${width}px`;
    
    dragStateRef.current.startLeft = left;
    dragStateRef.current.startWidth = width;
  }, [currentPage]);

  // Навигация
  const navigateTo = useCallback((page) => {
    if (page === currentPage) return;
    setCurrentPage(page);
    window.location.hash = page;
    updateIndicator(page);
    setDragProgress(0);
  }, [currentPage, updateIndicator]);

  // Обработчики drag
  const handleDragStart = useCallback((e) => {
    // Предотвращаем стандартное поведение только для тач-событий
    if (e.type === 'touchstart') {
      e.preventDefault();
    }
    
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    
    const nav = navRef.current;
    const indicator = indicatorRef.current;
    if (!nav || !indicator) return;
    
    const currentTab = tabsRef.current[currentPage];
    if (!currentTab) return;
    
    const navRect = nav.getBoundingClientRect();
    const tabRect = currentTab.getBoundingClientRect();
    
    const left = tabRect.left - navRect.left;
    const width = tabRect.width;
    
    dragStateRef.current = {
      ...dragStateRef.current,
      isDragging: true,
      startX: clientX,
      currentX: clientX,
      startIndex: pageToIndex(currentPage),
      startLeft: left,
      startWidth: width,
      startTime: Date.now()
    };
    
    nav.classList.add('dragging');
    
    // Блокируем скролл страницы при драге
    document.body.style.overflow = 'hidden';
  }, [currentPage]);

  const handleDragMove = useCallback((e) => {
    if (!dragStateRef.current.isDragging) return;
    
    // Предотвращаем стандартное поведение
    e.preventDefault();
    
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const { startX, startLeft, startWidth, startIndex } = dragStateRef.current;
    
    // ВЫЧИСЛЯЕМ НАПРАВЛЕНИЕ: тащишь вправо - deltaX положительная, индикатор двигается вправо
    const deltaX = clientX - startX;
    
    const nav = navRef.current;
    const indicator = indicatorRef.current;
    if (!nav || !indicator) return;
    
    const navRect = nav.getBoundingClientRect();
    const tabWidth = navRect.width / 3;
    
    // Вычисляем прогресс драга (от -1 до 1)
    const progress = Math.max(-1, Math.min(1, deltaX / 100));
    setDragProgress(Math.abs(progress));
    
    // Вычисляем новую позицию индикатора
    let newLeft = startLeft + deltaX * 0.5; // Умножаем на 0.5 для плавности
    
    // Ограничиваем позицию в пределах навигации
    const minLeft = 0;
    const maxLeft = navRect.width - startWidth;
    newLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));
    
    // Обновляем позицию индикатора в реальном времени
    indicator.style.transform = `translateX(${newLeft}px)`;
    
    // Вычисляем, к какой вкладке мы приближаемся
    const targetIndex = startIndex + Math.round(progress);
    const clampedIndex = Math.max(0, Math.min(2, targetIndex));
    
    // Если индекс изменился, обновляем активный класс
    if (clampedIndex !== startIndex) {
      const targetPage = indexToPage(clampedIndex);
      Object.keys(tabsRef.current).forEach(page => {
        const tab = tabsRef.current[page];
        if (tab) {
          if (page === targetPage) {
            tab.classList.add('drag-active');
          } else {
            tab.classList.remove('drag-active');
          }
        }
      });
    }
    
    dragStateRef.current.currentX = clientX;
  }, []);

  const handleDragEnd = useCallback((e) => {
    if (!dragStateRef.current.isDragging) return;
    
    e.preventDefault();
    
    const { startX, currentX, startIndex } = dragStateRef.current;
    
    // Снимаем классы драга
    Object.keys(tabsRef.current).forEach(page => {
      const tab = tabsRef.current[page];
      if (tab) {
        tab.classList.remove('drag-active');
      }
    });
    
    const nav = navRef.current;
    if (nav) {
      nav.classList.remove('dragging');
    }
    
    // Разблокируем скролл
    document.body.style.overflow = '';
    
    const deltaX = currentX - startX;
    const threshold = dragStateRef.current.threshold;
    
    // Определяем целевую вкладку на основе направления драга
    let targetIndex = startIndex;
    
    if (Math.abs(deltaX) > threshold) {
      // ТАЩИШЬ ВПРАВО (deltaX > 0) - ИНДИКАТОР ДВИГАЕТСЯ ВПРАВО
      if (deltaX > threshold && startIndex < 2) {
        targetIndex = startIndex + 1; // Вправо
      }
      // ТАЩИШЬ ВЛЕВО (deltaX < 0) - ИНДИКАТОР ДВИГАЕТСЯ ВЛЕВО
      else if (deltaX < -threshold && startIndex > 0) {
        targetIndex = startIndex - 1; // Влево
      }
    }
    
    const targetPage = indexToPage(targetIndex);
    
    // Сбрасываем прогресс
    setDragProgress(0);
    
    // Если целевая страница отличается от текущей - переключаем
    if (targetPage !== currentPage) {
      navigateTo(targetPage);
    } else {
      // Возвращаем индикатор на место
      updateIndicator();
    }
    
    dragStateRef.current.isDragging = false;
  }, [currentPage, navigateTo, updateIndicator]);

  // Обновление при изменении размера
  useEffect(() => {
    const handleResize = () => {
      updateIndicator();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateIndicator]);

  // Обновление при смене страницы
  useEffect(() => {
    updateIndicator();
  }, [currentPage, updateIndicator]);

  // Инициализация
  useEffect(() => {
    const debugUser = {
      id: '7879866656',
      telegramId: '7879866656',
      username: 'TERBCEO',
      firstName: 'G'
    };
    localStorage.setItem('currentUser', JSON.stringify(debugUser));
    setTelegramUser(debugUser);

    const hash = window.location.hash.replace('#', '');
    if (hash && ['home', 'profile', 'history', 'help', 'settings', 'game'].includes(hash)) {
      setCurrentPage(hash);
    }

    loadReferralData();
    
    // Имитация загрузки
    setTimeout(() => setIsLoading(false), 800);

    const handleHashChange = () => {
      const h = window.location.hash.replace('#', '');
      if (h && h !== currentPage && ['home', 'profile', 'history', 'help', 'settings', 'game'].includes(h)) {
        setCurrentPage(h);
      }
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Рендер страниц
  const renderPage = () => {
    const commonProps = {
      telegramUser,
      navigateTo,
      API_BASE_URL,
      showToast,
      toggleTheme,
      isDarkMode,
      hideHints,
      updateHideHints
    };

    switch (currentPage) {
      case 'history': return <History key="history" {...commonProps} />;
      case 'profile': return <Profile key="profile" {...commonProps} />;
      case 'help': return <Help key="help" {...commonProps} />;
      case 'settings': return <SettingsApp key="settings" {...commonProps} />;
      case 'game': return <Game key="game" {...commonProps} />;
      default: return <Home key="home" {...commonProps} />;
    }
  };

  // Плавающая навигация
  const Navigation = () => {
    const availableEarnings = referralData?.stats?.available_earnings || 0;
    const showBadge = availableEarnings >= 10;
    
    // Вычисляем масштаб для эффекта лупы (от 1 до 1.2)
    const scale = 1 + dragProgress * 0.2;

    return (
      <div 
        className="floating-nav" 
        ref={navRef}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        onTouchCancel={handleDragEnd}
      >
        <div className="nav-indicator" ref={indicatorRef} />
        
        <button
          ref={el => tabsRef.current.profile = el}
          data-tab="profile"
          className={`nav-item-floating ${currentPage === 'profile' ? 'active' : ''}`}
          onClick={() => navigateTo('profile')}
        >
          <div className="nav-icon-floating" style={{ transform: `scale(${scale})`, transition: 'transform 0.1s ease' }}>
            <ProfileIcon active={currentPage === 'profile'} />
          </div>
          <span className="nav-label-floating">Профиль</span>
          {showBadge && (
            <span className="nav-badge-floating">
              {availableEarnings < 1000 ? `$${availableEarnings}` : `$${(availableEarnings/1000).toFixed(1)}K`}
            </span>
          )}
        </button>

        <button
          ref={el => tabsRef.current.home = el}
          data-tab="home"
          className={`nav-item-floating ${currentPage === 'home' ? 'active' : ''}`}
          onClick={() => navigateTo('home')}
        >
          <div className="nav-icon-floating" style={{ transform: `scale(${scale})`, transition: 'transform 0.1s ease' }}>
            <ExchangeIcon active={currentPage === 'home'} />
          </div>
          <span className="nav-label-floating">Обмен</span>
        </button>

        <button
          ref={el => tabsRef.current.history = el}
          data-tab="history"
          className={`nav-item-floating ${currentPage === 'history' ? 'active' : ''}`}
          onClick={() => navigateTo('history')}
        >
          <div className="nav-icon-floating" style={{ transform: `scale(${scale})`, transition: 'transform 0.1s ease' }}>
            <HistoryIcon active={currentPage === 'history'} />
          </div>
          <span className="nav-label-floating">История</span>
        </button>
      </div>
    );
  };

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
          {currentPage !== 'help' && currentPage !== 'settings' && <Navigation />}
          {toast && (
            <div className={`telegram-toast ${toast.type}`}>
              <span className="telegram-toast-icon">
                {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
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