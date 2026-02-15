import React, { useState, useEffect, useCallback } from 'react';
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

  useEffect(() => {
    const saved = localStorage.getItem('hideHints');
    if (saved === 'true') setHideHints(true);
  }, []);

  const telegramColorToHex = useCallback((color) => {
    if (!color && color !== 0) return null;
    if (typeof color === 'string') return color.startsWith('#') ? color : `#${color}`;
    if (typeof color === 'number') return `#${color.toString(16).padStart(6, '0')}`;
    return null;
  }, []);

  const detectDarkMode = useCallback(() => {
    if (window.Telegram?.WebApp?.themeParams) {
      const params = window.Telegram.WebApp.themeParams;
      if (params?.bg_color) {
        try {
          let bgColor;
          if (typeof params.bg_color === 'string') bgColor = parseInt(params.bg_color.replace('#', ''), 16);
          else bgColor = params.bg_color;

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
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return true;
    return true;
  }, []);

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
      const darkBgColor = '#1a1d21';
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

      root.style.setProperty('--tg-success-color', '#34c759');
      root.style.setProperty('--tg-error-color', '#ff3b30');
      root.style.setProperty('--tg-warning-color', '#ff9500');
      root.style.setProperty('--tg-info-color', '#5e5ce6');
      root.style.setProperty('--tg-card-bg', darkCardBg);
      root.style.setProperty('--tg-input-bg', darkInputBg);
      root.style.setProperty('--tg-border-color', darkBorderColor);
      root.style.setProperty('--tg-hover-color', '#2c2f34');

      root.setAttribute('data-theme', 'dark');
    } else {
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

      root.style.setProperty('--tg-success-color', '#28a745');
      root.style.setProperty('--tg-error-color', '#dc3545');
      root.style.setProperty('--tg-warning-color', '#ffc107');
      root.style.setProperty('--tg-info-color', '#17a2b8');
      root.style.setProperty('--tg-card-bg', lightCardBg);
      root.style.setProperty('--tg-input-bg', lightInputBg);
      root.style.setProperty('--tg-border-color', lightBorderColor);
      root.style.setProperty('--tg-hover-color', '#e9ecef');

      root.removeAttribute('data-theme');
    }

    localStorage.setItem('themeApplied', 'true');
  }, [detectDarkMode, telegramColorToHex]);

  const showToast = useCallback((message, type = 'info') => {
    if (hideHints && type === 'info') return;
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, [hideHints]);

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

  const navigateTo = useCallback((page) => {
    setCurrentPage((prev) => {
      if (page === prev) return prev;
      window.location.hash = page;

      if (window.Telegram?.WebApp?.BackButton) {
        const tg = window.Telegram.WebApp;
        if (page === 'home') {
          try { tg.BackButton.hide(); } catch (e) {}
        } else {
          try { tg.BackButton.show(); } catch (e) {}
        }
      }
      return page;
    });
  }, []);

  // ===== keyboard hide/show (без конфликтов) =====
  useEffect(() => {
    const setNavVisible = (visible) => {
      const nav = document.querySelector('.floating-nav');
      if (!nav) return;
      nav.classList.remove('keyboard-hidden', 'keyboard-visible');
      nav.classList.add(visible ? 'keyboard-visible' : 'keyboard-hidden');
    };

    const handleResize = () => {
      if (window.innerHeight < 500) setNavVisible(false);
      else setNavVisible(true);
    };

    const handleFocus = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        setNavVisible(false);
      }
    };

    const handleBlur = () => {
      setTimeout(() => setNavVisible(true), 250);
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

  // ===== INDICATOR позиционирование + drag (1:1 как TG) =====
  useEffect(() => {
    const nav = document.querySelector('.floating-nav');
    if (!nav) return;

    const tabs = ['profile', 'home', 'history'];
    const buttons = tabs
      .map((t) => nav.querySelector(`[data-tab="${t}"]`))
      .filter(Boolean);

    if (buttons.length !== 3) return;

    const measure = () => {
      const navRect = nav.getBoundingClientRect();
      const rects = buttons.map((b) => b.getBoundingClientRect());
      return { navRect, rects };
    };

    const setIndicatorToIndex = (idx, animate = true) => {
      const { navRect, rects } = measure();
      const r = rects[idx];

      const left = (r.left - navRect.left);
      const width = r.width;

      if (!animate) {
        nav.style.setProperty('--indicator-left', `${left}px`);
        nav.style.setProperty('--indicator-width', `${width}px`);
        const ind = nav.querySelector('.nav-indicator');
        if (ind) ind.style.transition = 'none';
        requestAnimationFrame(() => {
          if (ind) ind.style.transition = '';
        });
      } else {
        nav.style.setProperty('--indicator-left', `${left}px`);
        nav.style.setProperty('--indicator-width', `${width}px`);
      }
    };

    // initial / on page change
    const idx = Math.max(0, tabs.indexOf(currentPage));
    setIndicatorToIndex(idx);

    // drag behavior
    let isDown = false;
    let startX = 0;
    let startLeft = 0;
    let moved = false;

    const THRESHOLD = 18; // чуть чувствительнее, как TG
    const onDown = (e) => {
      if (nav.classList.contains('keyboard-hidden')) return;

      isDown = true;
      moved = false;
      startX = e.clientX ?? 0;

      const curLeft = parseFloat(getComputedStyle(nav).getPropertyValue('--indicator-left')) || 0;
      startLeft = curLeft;

      const ind = nav.querySelector('.nav-indicator');
      if (ind) ind.style.transition = 'none';
    };

    const onMove = (e) => {
      if (!isDown) return;
      const x = e.clientX ?? 0;
      const dx = x - startX;
      if (Math.abs(dx) > 4) moved = true;

      const { navRect, rects } = measure();
      const minLeft = rects[0].left - navRect.left;
      const maxLeft = rects[2].left - navRect.left;

      const nextLeft = Math.max(minLeft, Math.min(maxLeft, startLeft + dx));
      nav.style.setProperty('--indicator-left', `${nextLeft}px`);
    };

    const nearestIndexFromIndicator = () => {
      const { navRect, rects } = measure();
      const curLeft = parseFloat(getComputedStyle(nav).getPropertyValue('--indicator-left')) || 0;
      const curCenter = curLeft + (parseFloat(getComputedStyle(nav).getPropertyValue('--indicator-width')) || rects[1].width) / 2;

      let best = 0;
      let bestDist = Infinity;
      rects.forEach((r, i) => {
        const center = (r.left - navRect.left) + r.width / 2;
        const d = Math.abs(center - curCenter);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      return best;
    };

    const onUp = () => {
      if (!isDown) return;
      isDown = false;

      const ind = nav.querySelector('.nav-indicator');
      if (ind) ind.style.transition = '';

      if (!moved) {
        // просто тап — вернём точно на активную
        setIndicatorToIndex(Math.max(0, tabs.indexOf(currentPage)));
        return;
      }

      // если реально тянули — снапаем
      const best = nearestIndexFromIndicator();
      setIndicatorToIndex(best);

      // если сдвиг заметный — переключаем вкладку
      // (чтобы микро-движения не переключали)
      const curIdx = Math.max(0, tabs.indexOf(currentPage));
      if (Math.abs(best - curIdx) >= 1) {
        // небольшой порог по расстоянию
        const dx = (parseFloat(getComputedStyle(nav).getPropertyValue('--indicator-left')) || 0) - startLeft;
        if (Math.abs(dx) >= THRESHOLD) {
          navigateTo(tabs[best]);
        } else {
          // если мало — вернём
          setIndicatorToIndex(curIdx);
        }
      }
    };

    nav.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('pointercancel', onUp, { passive: true });

    // пересчёт при ресайзе/ориентации
    const onResize = () => setIndicatorToIndex(Math.max(0, tabs.indexOf(currentPage)), false);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    return () => {
      nav.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [currentPage, navigateTo]);

  const initTelegramWebApp = useCallback(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;

      tg.ready();
      tg.expand();

      try {
        if (tg.BackButton) {
          tg.BackButton.onClick(() => navigateTo('home'));
          if (currentPage === 'home') {
            try { tg.BackButton.hide(); } catch (e) {}
          }
        }
      } catch (error) {}

      try {
        if (tg.SettingsButton && typeof tg.SettingsButton.show === 'function') {
          tg.SettingsButton.show();
          tg.SettingsButton.onClick(() => navigateTo('settings'));
        }
      } catch (error) {}

      applyTheme();

      tg.onEvent('themeChanged', () => {
        setTimeout(() => applyTheme(), 100);
      });

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
          setTimeout(() => {
            showToast(`Добро пожаловать, ${userData.firstName}! 👋`, 'success');
          }, 1000);
        }
      }
    } else {
      const devUser = {
        id: '7879866656',
        telegramId: '7879866656',
        username: 'test_user',
        firstName: 'Тестовый',
        photoUrl: null
      };
      setTelegramUser(devUser);
      localStorage.setItem('currentUser', JSON.stringify(devUser));
      applyTheme();
    }
  }, [applyTheme, showToast, navigateTo, currentPage, hideHints]);

  useEffect(() => {
    const debugUser = {
      id: '7879866656',
      telegramId: '7879866656',
      username: 'TERBCEO',
      firstName: 'G'
    };
    localStorage.setItem('currentUser', JSON.stringify(debugUser));

    initTelegramWebApp();

    const hash = window.location.hash.replace('#', '');
    if (hash && ['home', 'profile', 'history', 'help', 'settings', 'game'].includes(hash)) {
      setCurrentPage(hash);
    }

    loadReferralData();

    const t = setTimeout(() => setIsLoading(false), 1000);

    const handleHashChange = () => {
      const h = window.location.hash.replace('#', '');
      if (h && h !== currentPage && ['home', 'profile', 'history', 'help', 'settings', 'game'].includes(h)) {
        setCurrentPage(h);
      }
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      clearTimeout(t);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [initTelegramWebApp, loadReferralData, currentPage]);

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
      case 'history':
        return <History key="history" {...commonProps} />;
      case 'profile':
        return <Profile key="profile" {...commonProps} />;
      case 'help':
        return <Help key="help" {...commonProps} />;
      case 'settings':
        return <SettingsApp key="settings" {...commonProps} />;
      case 'game':
        return <Game key="game" {...commonProps} />;
      default:
        return <Home key="home" {...commonProps} />;
    }
  };

  const Navigation = () => {
    const availableEarnings = referralData?.stats?.available_earnings || 0;
    const showBadge = availableEarnings >= 10;

    return (
      <div className="floating-nav">
        {/* ОДНА капсула */}
        <div className="nav-indicator" />

        <button
          data-tab="profile"
          className={`nav-item-floating ${currentPage === 'profile' ? 'active' : ''}`}
          onClick={() => navigateTo('profile')}
          aria-label="Профиль"
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

        <div className="nav-center-floating" data-tab="home">
          <button
            data-tab="home"
            className="nav-center-circle-floating"
            onClick={() => navigateTo('home')}
            aria-label="Обмен"
            type="button"
          >
            <ExchangeIcon active={true} />
          </button>
          <span className="nav-center-label-floating">Обмен</span>
        </div>

        <button
          data-tab="history"
          className={`nav-item-floating ${currentPage === 'history' ? 'active' : ''}`}
          onClick={() => navigateTo('history')}
          aria-label="История"
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
