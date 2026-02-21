import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import './App.css';
import Home from './Home';
import History from './History';
import Profile from './Profile';
import Help from './Help';
import SettingsApp from './SettingsApp';
import { ProfileIcon, ExchangeIcon, HistoryIcon } from './NavIcons';
import Game from './Game';

// URL API
const API_BASE_URL = 'https://tethrab.shop';

// Функция для вибрации как в Wallet
const vibrate = () => {
  try {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    } else if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  } catch (e) {
    console.log('vibrate error:', e);
  }
};

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [telegramUser, setTelegramUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [referralData, setReferralData] = useState(null);
  const [toast, setToast] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [hideHints, setHideHints] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(true);

  const navRef = useRef(null);
  const indicatorRef = useRef(null);

  // Состояние для перетаскивания
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startLeft: 0,
    minLeft: 0,
    maxLeft: 0,
    rects: [],
    pointerId: null
  });

  // Загружаем настройки
  useEffect(() => {
    const saved = localStorage.getItem('hideHints');
    if (saved === 'true') setHideHints(true);
  }, []);

  // Конвертер цвета Telegram в hex
  const telegramColorToHex = useCallback((color) => {
    if (!color && color !== 0) return null;

    if (typeof color === 'string') return color.startsWith('#') ? color : `#${color}`;
    if (typeof color === 'number') return `#${color.toString(16).padStart(6, '0')}`;

    return null;
  }, []);

  // Определяем темную тему
  const detectDarkMode = useCallback(() => {
    if (window.Telegram?.WebApp?.themeParams?.bg_color) {
      try {
        const params = window.Telegram.WebApp.themeParams;
        const bgColor = typeof params.bg_color === 'string'
          ? parseInt(params.bg_color.replace('#', ''), 16)
          : params.bg_color;

        const r = (bgColor >> 16) & 0xff;
        const g = (bgColor >> 8) & 0xff;
        const b = bgColor & 0xff;
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness < 180;
      } catch (e) {}
    }

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return true;
    return true;
  }, []);

  // Применяем тему
  const applyTheme = useCallback(() => {
    const root = document.documentElement;
    const darkMode = detectDarkMode();
    setIsDarkMode(darkMode);

    let tgButtonColor = '#3390ec';
    if (window.Telegram?.WebApp?.themeParams) {
      const params = window.Telegram.WebApp.themeParams;
      const buttonColor = telegramColorToHex(params.button_color);
      if (buttonColor) tgButtonColor = buttonColor;
    }

    if (darkMode) {
      root.style.setProperty('--tg-theme-bg-color', '#1a1d21');
      root.style.setProperty('--tg-theme-text-color', '#ffffff');
      root.style.setProperty('--tg-theme-hint-color', '#8e8e93');
      root.style.setProperty('--tg-theme-button-color', tgButtonColor);
      root.style.setProperty('--tg-theme-button-text-color', '#ffffff');
      root.style.setProperty('--tg-theme-secondary-bg-color', '#212428');
      root.style.setProperty('--tg-theme-section-bg-color', '#3a3d42');

      root.style.setProperty('--tg-success-color', '#34c759');
      root.style.setProperty('--tg-error-color', '#ff3b30');
      root.style.setProperty('--tg-warning-color', '#ff9500');
      root.style.setProperty('--tg-info-color', '#5e5ce6');

      root.style.setProperty('--tg-card-bg', '#212428');
      root.style.setProperty('--tg-input-bg', '#2a2d32');
      root.style.setProperty('--tg-border-color', '#3a3d42');
      root.style.setProperty('--tg-hover-color', '#2c2f34');

      root.setAttribute('data-theme', 'dark');
    } else {
      root.style.setProperty('--tg-theme-bg-color', '#ffffff');
      root.style.setProperty('--tg-theme-text-color', '#000000');
      root.style.setProperty('--tg-theme-hint-color', '#8e8e93');
      root.style.setProperty('--tg-theme-button-color', tgButtonColor);
      root.style.setProperty('--tg-theme-button-text-color', '#ffffff');
      root.style.setProperty('--tg-theme-secondary-bg-color', '#f8f9fa');
      root.style.setProperty('--tg-theme-section-bg-color', '#e0e0e0');

      root.style.setProperty('--tg-success-color', '#28a745');
      root.style.setProperty('--tg-error-color', '#dc3545');
      root.style.setProperty('--tg-warning-color', '#ffc107');
      root.style.setProperty('--tg-info-color', '#17a2b8');

      root.style.setProperty('--tg-card-bg', '#f8f9fa');
      root.style.setProperty('--tg-input-bg', '#ffffff');
      root.style.setProperty('--tg-border-color', '#e0e0e0');
      root.style.setProperty('--tg-hover-color', '#e9ecef');

      root.removeAttribute('data-theme');
    }

    localStorage.setItem('themeApplied', 'true');
  }, [detectDarkMode, telegramColorToHex]);

  // Toast
  const showToast = useCallback((message, type = 'info') => {
    if (hideHints && type === 'info') return;
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, [hideHints]);

  // update hints
  const updateHideHints = useCallback((value) => {
    setHideHints(value);
    localStorage.setItem('hideHints', value.toString());
  }, []);

  // toggle theme
  const toggleTheme = useCallback(() => {
    vibrate();
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    setIsDarkMode(newTheme === 'dark');
    applyTheme();
    showToast(`Тема изменена на ${newTheme === 'dark' ? 'тёмную' : 'светлую'}`, 'success');
  }, [applyTheme, showToast]);

  // user id
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

  // referrals
  const loadReferralData = useCallback(async () => {
    try {
      const userId = getUserId();
      const response = await fetch(`${API_BASE_URL}/api/referrals/info/${userId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) setReferralData(result.data);
      }
    } catch (e) {}
  }, []);

  // navigation с вибрацией
  const navigateTo = useCallback((page) => {
    vibrate();
    setCurrentPage((prev) => {
      if (prev === page) return prev;
      window.location.hash = page;

      if (window.Telegram?.WebApp?.BackButton) {
        const tg = window.Telegram.WebApp;
        if (page === 'home') {
          try { tg.BackButton.hide(); } catch {}
        } else {
          try { tg.BackButton.show(); } catch {}
        }
      }
      return page;
    });
  }, []);

  // init tg + app
  useEffect(() => {
    const debugUser = { id: '7879866656', telegramId: '7879866656', username: 'TERBCEO', firstName: 'G' };
    localStorage.setItem('currentUser', JSON.stringify(debugUser));

    const initTelegramWebApp = () => {
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        try {
          tg.BackButton?.onClick(() => navigateTo('home'));
          if (currentPage === 'home') {
            try { tg.BackButton.hide(); } catch {}
          }
        } catch {}

        try {
          if (tg.SettingsButton && typeof tg.SettingsButton.show === 'function') {
            tg.SettingsButton.show();
            tg.SettingsButton.onClick(() => navigateTo('settings'));
          }
        } catch {}

        applyTheme();
        tg.onEvent('themeChanged', () => setTimeout(applyTheme, 100));

        const tgUser = tg.initDataUnsafe?.user;
        if (tgUser) {
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

          if (!hideHints) {
            setTimeout(() => showToast(`Добро пожаловать, ${userData.firstName}! 👋`, 'success'), 1000);
          }
        }
      } else {
        setTelegramUser({
          id: '7879866656',
          telegramId: '7879866656',
          username: 'test_user',
          firstName: 'Тестовый',
          photoUrl: null
        });
        applyTheme();
      }
    };

    initTelegramWebApp();

    const hash = window.location.hash.replace('#', '');
    if (hash && ['home', 'profile', 'history', 'help', 'settings', 'game'].includes(hash)) {
      setCurrentPage(hash);
    }

    loadReferralData();
    setTimeout(() => setIsLoading(false), 800);

    const handleHashChange = () => {
      const h = window.location.hash.replace('#', '');
      if (h && ['home', 'profile', 'history', 'help', 'settings', 'game'].includes(h)) {
        setCurrentPage(h);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Обработка клавиатуры
  useEffect(() => {
    let resizeTimeout;
    let lastHeight = window.innerHeight;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const newHeight = window.innerHeight;
        const heightDiff = Math.abs(newHeight - lastHeight);
        
        if (heightDiff > 150) {
          const isKeyboard = newHeight < lastHeight;
          setIsKeyboardVisible(!isKeyboard);
          lastHeight = newHeight;
        }
      }, 100);
    };

    const handleFocus = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        setIsKeyboardVisible(false);
      }
    };

    const handleBlur = () => {
      setTimeout(() => {
        const activeElement = document.activeElement;
        if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
          setIsKeyboardVisible(true);
        }
      }, 200);
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // page/index helpers
  const pageToIndex = (p) => (p === 'profile' ? 0 : p === 'home' ? 1 : 2);
  const indexToPage = (i) => (i === 0 ? 'profile' : i === 1 ? 'home' : 'history');

  // Обновление позиций вкладок - СРАЗУ ПРИ ЗАГРУЗКЕ
  const updateIndicatorPosition = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;

    const tabs = [
      nav.querySelector('[data-tab="profile"]'),
      nav.querySelector('[data-tab="home"]'),
      nav.querySelector('[data-tab="history"]')
    ].filter(Boolean);

    if (tabs.length !== 3) return;

    const navRect = nav.getBoundingClientRect();
    const rects = tabs.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        left: r.left - navRect.left,
        width: r.width
      };
    });

    dragStateRef.current.rects = rects;
    dragStateRef.current.minLeft = rects[0].left;
    dragStateRef.current.maxLeft = rects[2].left;

    // Ставим индикатор на активную вкладку
    const activeIndex = pageToIndex(currentPage);
    const targetRect = rects[activeIndex];
    
    // Принудительно устанавливаем позицию
    nav.style.setProperty('--indicator-left', `${targetRect.left}px`);
    nav.style.setProperty('--indicator-width', `${targetRect.width}px`);
    
    // Убираем класс ready если был, и добавляем снова чтобы индикатор показался
    nav.classList.remove('ready');
    // Форсируем reflow
    void nav.offsetHeight;
    nav.classList.add('ready');
    
    console.log('Индикатор обновлен:', targetRect.left, targetRect.width);
  }, [currentPage]);

  // Первоначальная установка при монтировании
  useEffect(() => {
    // Ждем когда навигация отрендерится
    const timer = setTimeout(() => {
      updateIndicatorPosition();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Обновляем при изменении страницы
  useLayoutEffect(() => {
    updateIndicatorPosition();
  }, [currentPage, updateIndicatorPosition]);

  // Следим за изменениями размеров
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const updateOnResize = () => {
      updateIndicatorPosition();
    };

    const observer = new ResizeObserver(() => {
      updateIndicatorPosition();
    });
    
    observer.observe(nav);
    window.addEventListener('resize', updateOnResize);
    
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateOnResize);
    };
  }, [updateIndicatorPosition]);

  // DRAG эффект
  useEffect(() => {
    const nav = navRef.current;
    const indicator = indicatorRef.current;
    if (!nav || !indicator) return;

    const onPointerDown = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      
      e.preventDefault();
      
      const rects = dragStateRef.current.rects;
      if (!rects || rects.length !== 3) return;

      const currentLeft = parseFloat(nav.style.getPropertyValue('--indicator-left'));

      dragStateRef.current = {
        ...dragStateRef.current,
        isDragging: true,
        startX: e.clientX,
        startLeft: currentLeft,
        pointerId: e.pointerId
      };

      nav.classList.add('dragging');
      indicator.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e) => {
      const state = dragStateRef.current;
      if (!state.isDragging) return;
      if (state.pointerId !== e.pointerId) return;

      e.preventDefault();

      const dx = e.clientX - state.startX;
      let newLeft = state.startLeft + dx;
      
      newLeft = Math.max(state.minLeft, Math.min(state.maxLeft, newLeft));

      const rects = state.rects;
      let targetWidth = rects[1].width;

      if (newLeft <= rects[0].left + 5) {
        targetWidth = rects[0].width;
      } else if (newLeft >= rects[2].left - 5) {
        targetWidth = rects[2].width;
      } else if (newLeft < rects[1].left) {
        const progress = (newLeft - rects[0].left) / (rects[1].left - rects[0].left);
        targetWidth = rects[0].width + (rects[1].width - rects[0].width) * progress;
      } else {
        const progress = (newLeft - rects[1].left) / (rects[2].left - rects[1].left);
        targetWidth = rects[1].width + (rects[2].width - rects[1].width) * progress;
      }

      nav.style.setProperty('--indicator-left', `${newLeft}px`);
      nav.style.setProperty('--indicator-width', `${targetWidth}px`);
    };

    const onPointerUp = (e) => {
      const state = dragStateRef.current;
      if (!state.isDragging) return;
      if (state.pointerId !== e.pointerId) return;

      e.preventDefault();

      const rects = state.rects;
      const currentLeft = parseFloat(nav.style.getPropertyValue('--indicator-left'));
      const currentWidth = parseFloat(nav.style.getPropertyValue('--indicator-width'));
      const currentCenter = currentLeft + currentWidth / 2;
      
      let closestIndex = 1;
      let minDistance = Infinity;
      
      rects.forEach((rect, index) => {
        const distance = Math.abs(currentCenter - (rect.left + rect.width / 2));
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });

      const targetPage = indexToPage(closestIndex);
      
      const targetRect = rects[closestIndex];
      nav.style.setProperty('--indicator-left', `${targetRect.left}px`);
      nav.style.setProperty('--indicator-width', `${targetRect.width}px`);

      if (targetPage !== currentPage) {
        vibrate();
        navigateTo(targetPage);
      }

      dragStateRef.current.isDragging = false;
      nav.classList.remove('dragging');
      indicator.releasePointerCapture(e.pointerId);
    };

    const onPointerCancel = (e) => {
      onPointerUp(e);
    };

    indicator.addEventListener('pointerdown', onPointerDown, { capture: true });
    window.addEventListener('pointermove', onPointerMove, { capture: true });
    window.addEventListener('pointerup', onPointerUp, { capture: true });
    window.addEventListener('pointercancel', onPointerCancel, { capture: true });

    return () => {
      indicator.removeEventListener('pointerdown', onPointerDown, { capture: true });
      window.removeEventListener('pointermove', onPointerMove, { capture: true });
      window.removeEventListener('pointerup', onPointerUp, { capture: true });
      window.removeEventListener('pointercancel', onPointerCancel, { capture: true });
    };
  }, [currentPage, navigateTo]);

  // render pages
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

  // floating nav
  const Navigation = () => {
    const availableEarnings = referralData?.stats?.available_earnings || 0;
    const showBadge = availableEarnings >= 10;

    return (
      <div 
        className={`floating-nav ${isKeyboardVisible ? 'keyboard-visible' : 'keyboard-hidden'}`} 
        ref={navRef}
      >
        <div className="nav-indicator" ref={indicatorRef} />

        <button
          data-tab="profile"
          className={`nav-item-floating ${currentPage === 'profile' ? 'active' : ''}`}
          onClick={() => navigateTo('profile')}
          type="button"
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

        <button
          data-tab="home"
          className={`nav-item-floating ${currentPage === 'home' ? 'active' : ''}`}
          onClick={() => navigateTo('home')}
          type="button"
        >
          <div className="nav-icon-floating nav-icon-exchange">
            <ExchangeIcon active={currentPage === 'home'} />
          </div>
          <span className="nav-label-floating">Обмен</span>
        </button>

        <button
          data-tab="history"
          className={`nav-item-floating ${currentPage === 'history' ? 'active' : ''}`}
          onClick={() => navigateTo('history')}
          type="button"
        >
          <div className="nav-icon-floating">
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