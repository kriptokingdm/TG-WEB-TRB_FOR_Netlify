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

  const dragStateRef = useRef({
    isDown: false,
    startX: 0,
    lastX: 0,
    moved: false,
    startIndex: 1,
    rects: null,
    pointerId: null,
    initialIndicatorLeft: 0,
    initialIndicatorWidth: 0
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

  // navigation
  const navigateTo = useCallback((page) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==================== ИСПРАВЛЕННАЯ ОБРАБОТКА КЛАВИАТУРЫ ====================
  useEffect(() => {
    let resizeTimeout;
    let lastHeight = window.innerHeight;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const newHeight = window.innerHeight;
        const heightDiff = Math.abs(newHeight - lastHeight);
        
        // Если изменение высоты значительное (появилась/скрылась клавиатура)
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
      // Задержка чтобы убедиться что клавиатура действительно скрылась
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

  // ==================== ИСПРАВЛЕННОЕ ПОЛОЖЕНИЕ ИНДИКАТОРА ====================
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const updateIndicator = () => {
      const tabs = [
        nav.querySelector('[data-tab="profile"]'),
        nav.querySelector('[data-tab="home"]'),
        nav.querySelector('[data-tab="history"]')
      ].filter(Boolean);

      if (tabs.length !== 3) return;

      const navRect = nav.getBoundingClientRect();
      const rects = tabs.map((el) => {
        const r = el.getBoundingClientRect();
        const left = r.left - navRect.left;
        const width = r.width;
        return { left, width };
      });

      dragStateRef.current.rects = rects;

      const activeIndex = pageToIndex(currentPage);
      const targetLeft = rects[activeIndex].left;
      const targetWidth = rects[activeIndex].width;

      // Применяем позицию без анимации при первом рендере
      if (!nav.classList.contains('ready')) {
        nav.style.setProperty('--indicator-left', `${targetLeft}px`);
        nav.style.setProperty('--indicator-width', `${targetWidth}px`);
        nav.classList.add('ready');
      } else {
        // С анимацией при смене страницы
        nav.style.setProperty('--indicator-left', `${targetLeft}px`);
        nav.style.setProperty('--indicator-width', `${targetWidth}px`);
      }
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [currentPage]);

  // ==================== ИСПРАВЛЕННЫЙ DRAG ====================
  useEffect(() => {
    const nav = navRef.current;
    const pill = indicatorRef.current;
    if (!nav || !pill) return;

    const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

    const onPointerDown = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      e.preventDefault();
      
      const st = dragStateRef.current;
      st.isDown = true;
      st.moved = false;
      st.pointerId = e.pointerId;
      st.startX = e.clientX;
      st.lastX = e.clientX;
      st.startIndex = pageToIndex(currentPage);
      
      // Сохраняем начальную позицию
      st.initialIndicatorLeft = parseFloat(nav.style.getPropertyValue('--indicator-left')) || 0;
      st.initialIndicatorWidth = parseFloat(nav.style.getPropertyValue('--indicator-width')) || 0;

      nav.classList.add('dragging');
      pill.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e) => {
      const st = dragStateRef.current;
      if (!st.isDown) return;
      if (st.pointerId !== e.pointerId) return;

      e.preventDefault();

      st.lastX = e.clientX;
      const dx = st.lastX - st.startX;
      
      if (Math.abs(dx) > 5) {
        st.moved = true;
      }

      if (!st.moved) return;

      // Плавное перемещение индикатора
      const newLeft = st.initialIndicatorLeft + dx;
      
      // Ограничиваем, чтобы не выходил за пределы
      const minLeft = st.rects[0].left;
      const maxLeft = st.rects[2].left;
      const clampedLeft = clamp(newLeft, minLeft, maxLeft);
      
      // Сохраняем ширину неизменной при перетаскивании
      nav.style.setProperty('--indicator-left', `${clampedLeft}px`);
      nav.style.setProperty('--indicator-width', `${st.initialIndicatorWidth}px`);
      nav.style.transition = 'none';
    };

    const onPointerUp = (e) => {
      const st = dragStateRef.current;
      if (!st.isDown) return;
      if (st.pointerId !== e.pointerId) return;

      e.preventDefault();

      st.isDown = false;
      nav.classList.remove('dragging');
      nav.style.transition = '';

      const dx = st.lastX - st.startX;
      let targetIndex = st.startIndex;

      if (st.moved) {
        const threshold = 30;
        if (dx > threshold && st.startIndex < 2) {
          targetIndex = st.startIndex + 1;
        } else if (dx < -threshold && st.startIndex > 0) {
          targetIndex = st.startIndex - 1;
        }
      }

      // Анимируем к целевому индексу
      const targetRect = st.rects[targetIndex];
      nav.style.setProperty('--indicator-left', `${targetRect.left}px`);
      nav.style.setProperty('--indicator-width', `${targetRect.width}px`);

      if (targetIndex !== st.startIndex) {
        navigateTo(indexToPage(targetIndex));
      }

      pill.releasePointerCapture(e.pointerId);
      st.pointerId = null;
    };

    pill.addEventListener('pointerdown', onPointerDown);
    pill.addEventListener('pointermove', onPointerMove);
    pill.addEventListener('pointerup', onPointerUp);
    pill.addEventListener('pointercancel', onPointerUp);

    return () => {
      pill.removeEventListener('pointerdown', onPointerDown);
      pill.removeEventListener('pointermove', onPointerMove);
      pill.removeEventListener('pointerup', onPointerUp);
      pill.removeEventListener('pointercancel', onPointerUp);
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
        {/* pill - теперь только для drag, без pointer-events на кнопки */}
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