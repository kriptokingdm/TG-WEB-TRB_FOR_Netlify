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

  // refs for nav
  const navRef = useRef(null);
  const dragStateRef = useRef({
    isDown: false,
    startX: 0,
    lastX: 0,
    moved: false,
    startIndex: 1,
    activeIndex: 1,
    rects: null,
    pointerId: null
  });

  // Загружаем настройки при инициализации
  useEffect(() => {
    const saved = localStorage.getItem('hideHints');
    if (saved === 'true') setHideHints(true);
  }, []);

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
          const r = (bgColor >> 16) & 0xff;
          const g = (bgColor >> 8) & 0xff;
          const b = bgColor & 0xff;
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          return brightness < 180;
        } catch (error) {
          console.error('Ошибка определения цвета Telegram:', error);
        }
      }
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }
    return true;
  }, []);

  // Применяем правильную тему
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

  // Показ уведомлений
  const showToast = useCallback((message, type = 'info') => {
    if (hideHints && type === 'info') return;
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, [hideHints]);

  // Функция для обновления настроек
  const updateHideHints = useCallback((value) => {
    setHideHints(value);
    localStorage.setItem('hideHints', value.toString());
  }, []);

  // Переключение темы
  const toggleTheme = useCallback(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    const darkMode = newTheme === 'dark';
    setIsDarkMode(darkMode);
    applyTheme();
    showToast(`Тема изменена на ${darkMode ? 'тёмную' : 'светлую'}`, 'success');
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
      console.error('❌ Ошибка получения ID:', error);
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

  // Навигация
  const navigateTo = useCallback((page) => {
    if (page === currentPage) return;
    window.location.hash = page;
    setCurrentPage(page);
    if (window.Telegram?.WebApp?.BackButton) {
      const tg = window.Telegram.WebApp;
      if (page === 'home') {
        try { tg.BackButton.hide(); } catch {}
      } else {
        try { tg.BackButton.show(); } catch {}
      }
    }
  }, [currentPage]);

  // ==========================
  // Telegram WebApp init
  // ==========================
  useEffect(() => {
    const debugUser = {
      id: '7879866656',
      telegramId: '7879866656',
      username: 'TERBCEO',
      firstName: 'G'
    };
    localStorage.setItem('currentUser', JSON.stringify(debugUser));

    const initTelegramWebApp = () => {
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        try {
          if (tg.BackButton) {
            tg.BackButton.onClick(() => navigateTo('home'));
            if (currentPage === 'home') {
              try { tg.BackButton.hide(); } catch {}
            }
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
    setTimeout(() => setIsLoading(false), 1000);

    const handleHashChange = () => {
      const h = window.location.hash.replace('#', '');
      if (h && h !== currentPage && ['home', 'profile', 'history', 'help', 'settings', 'game'].includes(h)) {
        setCurrentPage(h);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // ==========================
  // Keyboard hide nav
  // ==========================
  useEffect(() => {
    const handleResize = () => {
      const nav = navRef.current;
      if (!nav) return;
      if (window.innerHeight < 500) {
        nav.classList.add('keyboard-hidden');
        nav.classList.remove('keyboard-visible');
      } else {
        nav.classList.add('keyboard-visible');
        nav.classList.remove('keyboard-hidden');
      }
    };

    const handleFocus = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        const nav = navRef.current;
        if (nav) {
          nav.classList.add('keyboard-hidden');
          nav.classList.remove('keyboard-visible');
        }
      }
    };

    const handleBlur = () => {
      const nav = navRef.current;
      if (!nav) return;
      setTimeout(() => {
        nav.classList.add('keyboard-visible');
        nav.classList.remove('keyboard-hidden');
      }, 250);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  // ==========================
  // Tab -> index helpers
  // ==========================
  const pageToIndex = (p) => (p === 'profile' ? 0 : p === 'home' ? 1 : 2);
  const indexToPage = (i) => (i === 0 ? 'profile' : i === 1 ? 'home' : 'history');

  // ==========================
  // Indicator positioning
  // ==========================
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
      dragStateRef.current.activeIndex = activeIndex;

      nav.style.setProperty('--indicator-left', `${rects[activeIndex].left}px`);
      nav.style.setProperty('--indicator-width', `${rects[activeIndex].width}px`);
      nav.classList.add('ready');
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [currentPage]);

  // ==========================
  // Drag to switch tabs (Telegram-like scrub)
  // ==========================
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const getRects = () => {
      const tabs = [
        nav.querySelector('[data-tab="profile"]'),
        nav.querySelector('[data-tab="home"]'),
        nav.querySelector('[data-tab="history"]')
      ].filter(Boolean);

      if (tabs.length !== 3) return null;

      return tabs.map((el) => {
        const r = el.getBoundingClientRect();
        const navRect = nav.getBoundingClientRect();
        const left = r.left - navRect.left;
        const width = r.width;
        const center = left + width / 2;
        return { left, width, center };
      });
    };

    const setIndicatorByIndex = (idx, animate = true) => {
      const rects = dragStateRef.current.rects || getRects();
      if (!rects) return;
      
      if (!animate) nav.classList.add('no-anim');
      nav.style.setProperty('--indicator-left', `${rects[idx].left}px`);
      nav.style.setProperty('--indicator-width', `${rects[idx].width}px`);
      if (!animate) {
        requestAnimationFrame(() => nav.classList.remove('no-anim'));
      }
    };

    const lerp = (a, b, t) => a + (b - a) * t;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    const onPointerDown = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      const st = dragStateRef.current;
      st.isDown = true;
      st.moved = false;
      st.pointerId = e.pointerId;
      st.startX = e.clientX;
      st.lastX = e.clientX;
      st.startIndex = pageToIndex(currentPage);
      st.activeIndex = st.startIndex;
      st.rects = getRects();

      nav.classList.add('dragging');
      try { nav.setPointerCapture(e.pointerId); } catch {}
    };

    const onPointerMove = (e) => {
      const st = dragStateRef.current;
      if (!st.isDown) return;
      if (st.pointerId !== null && e.pointerId !== st.pointerId) return;

      st.lastX = e.clientX;
      const dx = st.lastX - st.startX;
      if (Math.abs(dx) > 6) st.moved = true;

      const rects = st.rects;
      if (!rects) return;

      const from = st.startIndex;
      const dir = dx > 0 ? -1 : 1;
      const to = clamp(from + dir, 0, 2);

      if (to === from) {
        setIndicatorByIndex(from, false);
        return;
      }

      const dist = Math.abs(rects[to].center - rects[from].center) || 1;
      const t = clamp(Math.abs(dx) / dist, 0, 1);

      const left = lerp(rects[from].left, rects[to].left, t);
      const width = lerp(rects[from].width, rects[to].width, t);

      nav.style.setProperty('--indicator-left', `${left}px`);
      nav.style.setProperty('--indicator-width', `${width}px`);
    };

    const onPointerUp = (e) => {
      const st = dragStateRef.current;
      if (!st.isDown) return;
      if (st.pointerId !== null && e.pointerId !== st.pointerId) return;

      st.isDown = false;
      nav.classList.remove('dragging');

      const dx = st.lastX - st.startX;

      if (!st.moved) {
        setIndicatorByIndex(pageToIndex(currentPage), true);
        st.pointerId = null;
        return;
      }

      const THRESHOLD = 24;
      let targetIndex = st.startIndex;
      
      if (dx > THRESHOLD) {
        targetIndex = clamp(st.startIndex - 1, 0, 2);
      } else if (dx < -THRESHOLD) {
        targetIndex = clamp(st.startIndex + 1, 0, 2);
      }

      setIndicatorByIndex(targetIndex, true);
      navigateTo(indexToPage(targetIndex));
      st.pointerId = null;
    };

    nav.addEventListener('pointerdown', onPointerDown, { passive: true });
    nav.addEventListener('pointermove', onPointerMove, { passive: true });
    nav.addEventListener('pointerup', onPointerUp, { passive: true });
    nav.addEventListener('pointercancel', onPointerUp, { passive: true });

    return () => {
      nav.removeEventListener('pointerdown', onPointerDown);
      nav.removeEventListener('pointermove', onPointerMove);
      nav.removeEventListener('pointerup', onPointerUp);
      nav.removeEventListener('pointercancel', onPointerUp);
    };
  }, [currentPage, navigateTo]);

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

    return (
      <div className="floating-nav" ref={navRef}>
        <div className="nav-indicator" />
        
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
          <div className="nav-icon-floating">
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