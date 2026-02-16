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

  const navRef = useRef(null);

  const dragRef = useRef({
    isDown: false,
    pointerId: null,
    startX: 0,
    lastX: 0,
    moved: false,
    startIndex: 1,
    rects: null, // [{left,width,center}]
  });

  // settings
  useEffect(() => {
    const saved = localStorage.getItem('hideHints');
    if (saved === 'true') setHideHints(true);
  }, []);

  // color converter
  const telegramColorToHex = useCallback((color) => {
    if (!color && color !== 0) return null;
    if (typeof color === 'string') return color.startsWith('#') ? color : `#${color}`;
    if (typeof color === 'number') return `#${color.toString(16).padStart(6, '0')}`;
    return null;
  }, []);

  // dark detect
  const detectDarkMode = useCallback(() => {
    if (window.Telegram?.WebApp?.themeParams) {
      const params = window.Telegram.WebApp.themeParams;
      if (params?.bg_color) {
        try {
          const bgColor =
            typeof params.bg_color === 'string'
              ? parseInt(params.bg_color.replace('#', ''), 16)
              : params.bg_color;

          const r = (bgColor >> 16) & 0xff;
          const g = (bgColor >> 8) & 0xff;
          const b = bgColor & 0xff;
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          return brightness < 180;
        } catch (e) {}
      }
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return true;
    return true;
  }, []);

  // apply theme
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

  // toast
  const showToast = useCallback(
    (message, type = 'info') => {
      if (hideHints && type === 'info') return;
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    },
    [hideHints]
  );

  const updateHideHints = useCallback((value) => {
    setHideHints(value);
    localStorage.setItem('hideHints', value.toString());
  }, []);

  const toggleTheme = useCallback(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    const darkMode = newTheme === 'dark';
    setIsDarkMode(darkMode);
    applyTheme();
    showToast(`Тема изменена на ${darkMode ? 'тёмную' : 'светлую'}`, 'success');
  }, [applyTheme, showToast]);

  const getUserId = () => {
    try {
      if (window.Telegram?.WebApp) {
        const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
        if (tgUser?.id) return tgUser.id.toString();
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

  const navigateTo = useCallback(
    (page) => {
      if (page === currentPage) return;

      window.location.hash = page;
      setCurrentPage(page);

      if (window.Telegram?.WebApp?.BackButton) {
        const tg = window.Telegram.WebApp;
        if (page === 'home') {
          try {
            tg.BackButton.hide();
          } catch {}
        } else {
          try {
            tg.BackButton.show();
          } catch {}
        }
      }
    },
    [currentPage]
  );

  // init
  useEffect(() => {
    const debugUser = {
      id: '7879866656',
      telegramId: '7879866656',
      username: 'TERBCEO',
      firstName: 'G',
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
              try {
                tg.BackButton.hide();
              } catch {}
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
          const u = tg.initDataUnsafe.user;
          const userData = {
            id: u.id.toString(),
            telegramId: u.id,
            username: u.username || `user_${u.id}`,
            firstName: u.first_name || 'Пользователь',
            lastName: u.last_name || '',
            photoUrl: u.photo_url || null,
            languageCode: u.language_code || 'ru',
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
          photoUrl: null,
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
      if (h && h !== currentPage && ['home', 'profile', 'history', 'help', 'settings', 'game'].includes(h)) {
        setCurrentPage(h);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keyboard hide nav
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

  // index helpers
  const pageToIndex = (p) => (p === 'profile' ? 0 : p === 'home' ? 1 : 2);
  const indexToPage = (i) => (i === 0 ? 'profile' : i === 1 ? 'home' : 'history');

  // measure & set indicator (NO JERK)
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const tabs = [
      nav.querySelector('[data-tab="profile"]'),
      nav.querySelector('[data-tab="home"]'),
      nav.querySelector('[data-tab="history"]'),
    ].filter(Boolean);

    if (tabs.length !== 3) return;

    const navRect = nav.getBoundingClientRect();
    const rects = tabs.map((el) => {
      const r = el.getBoundingClientRect();
      const left = r.left - navRect.left;
      const width = r.width;
      const center = left + width / 2;
      return { left, width, center };
    });

    dragRef.current.rects = rects;

    const idx = pageToIndex(currentPage);
    nav.style.setProperty('--indicator-left', `${rects[idx].left}px`);
    nav.style.setProperty('--indicator-width', `${rects[idx].width}px`);
    nav.classList.add('ready');
  }, [currentPage]);

  // drag-to-switch (Telegram scrub)
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const lerp = (a, b, t) => a + (b - a) * t;

    const readRects = () => {
      const tabs = [
        nav.querySelector('[data-tab="profile"]'),
        nav.querySelector('[data-tab="home"]'),
        nav.querySelector('[data-tab="history"]'),
      ].filter(Boolean);

      if (tabs.length !== 3) return null;

      const navRect = nav.getBoundingClientRect();
      return tabs.map((el) => {
        const r = el.getBoundingClientRect();
        const left = r.left - navRect.left;
        const width = r.width;
        const center = left + width / 2;
        return { left, width, center };
      });
    };

    const onDown = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      const st = dragRef.current;
      st.isDown = true;
      st.pointerId = e.pointerId;
      st.startX = e.clientX;
      st.lastX = e.clientX;
      st.moved = false;
      st.startIndex = pageToIndex(currentPage);
      st.rects = readRects() || st.rects;

      nav.classList.add('dragging');
      try { nav.setPointerCapture(e.pointerId); } catch {}
    };

    const onMove = (e) => {
      const st = dragRef.current;
      if (!st.isDown) return;
      if (st.pointerId != null && e.pointerId !== st.pointerId) return;

      st.lastX = e.clientX;
      const dx = st.lastX - st.startX;
      if (Math.abs(dx) > 6) st.moved = true;

      const rects = st.rects;
      if (!rects) return;

      const from = st.startIndex;
      // TG-like: drag left => go right tab, drag right => go left tab
      const dir = dx > 0 ? -1 : 1;
      const to = clamp(from + dir, 0, 2);

      if (to === from) return;

      const dist = Math.abs(rects[to].center - rects[from].center) || 1;
      const t = clamp(Math.abs(dx) / dist, 0, 1);

      const left = lerp(rects[from].left, rects[to].left, t);
      const width = lerp(rects[from].width, rects[to].width, t);

      nav.style.setProperty('--indicator-left', `${left}px`);
      nav.style.setProperty('--indicator-width', `${width}px`);
    };

    const onUp = (e) => {
      const st = dragRef.current;
      if (!st.isDown) return;
      if (st.pointerId != null && e.pointerId !== st.pointerId) return;

      st.isDown = false;
      nav.classList.remove('dragging');

      const dx = st.lastX - st.startX;

      // если не двигали — клики сами отработают
      if (!st.moved) return;

      const THRESHOLD = 22;
      let target = st.startIndex;

      if (dx > THRESHOLD) target = clamp(st.startIndex - 1, 0, 2);
      else if (dx < -THRESHOLD) target = clamp(st.startIndex + 1, 0, 2);

      const rects = st.rects || readRects();
      if (rects) {
        nav.style.setProperty('--indicator-left', `${rects[target].left}px`);
        nav.style.setProperty('--indicator-width', `${rects[target].width}px`);
      }

      navigateTo(indexToPage(target));
      st.pointerId = null;
    };

    nav.addEventListener('pointerdown', onDown, { passive: true });
    nav.addEventListener('pointermove', onMove, { passive: true });
    nav.addEventListener('pointerup', onUp, { passive: true });
    nav.addEventListener('pointercancel', onUp, { passive: true });

    return () => {
      nav.removeEventListener('pointerdown', onDown);
      nav.removeEventListener('pointermove', onMove);
      nav.removeEventListener('pointerup', onUp);
      nav.removeEventListener('pointercancel', onUp);
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
      updateHideHints,
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
          {showBadge && <span className="nav-badge-floating">${availableEarnings.toFixed(0)}</span>}
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
