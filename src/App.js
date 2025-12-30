import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Home from './Home';
import History from './History';
import Profile from './Profile';
import Help from './Help';
import SettingsApp from './SettingsApp';
import { ProfileIcon, ExchangeIcon, HistoryIcon } from './NavIcons';

const API_BASE_URL = 'https://tethrab.shop';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [telegramUser, setTelegramUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [referralData, setReferralData] = useState(null);
  const [toast, setToast] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  /* ===========================
     HELPERS
  =========================== */

  const telegramColorToHex = useCallback((color) => {
    if (!color && color !== 0) return null;
    if (typeof color === 'string') return color.startsWith('#') ? color : `#${color}`;
    if (typeof color === 'number') return `#${color.toString(16).padStart(6, '0')}`;
    return null;
  }, []);

  const detectDarkMode = useCallback(() => {
    if (window.Telegram?.WebApp?.themeParams?.bg_color) {
      try {
        const bg = window.Telegram.WebApp.themeParams.bg_color;
        const color = typeof bg === 'string' ? parseInt(bg.replace('#', ''), 16) : bg;
        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;
        return (r * 299 + g * 587 + b * 114) / 1000 < 180;
      } catch {}
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, []);

  const applyTheme = useCallback(() => {
    const root = document.documentElement;
    const dark = detectDarkMode();
    setIsDarkMode(dark);

    let buttonColor = '#3390ec';
    if (window.Telegram?.WebApp?.themeParams?.button_color) {
      buttonColor = telegramColorToHex(window.Telegram.WebApp.themeParams.button_color);
    }

    root.style.setProperty('--tg-theme-button-color', buttonColor);

    if (dark) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
  }, [detectDarkMode, telegramColorToHex]);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const toggleTheme = useCallback(() => {
    const dark = !isDarkMode;
    setIsDarkMode(dark);
    applyTheme();
    showToast(`Тема: ${dark ? 'тёмная' : 'светлая'}`, 'success');
  }, [isDarkMode, applyTheme, showToast]);

  const getUserId = () => {
    try {
      return window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString()
        || JSON.parse(localStorage.getItem('currentUser'))?.id
        || '7879866656';
    } catch {
      return '7879866656';
    }
  };

  const loadReferralData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/referrals/info/${getUserId()}`);
      const json = await res.json();
      if (json?.success) setReferralData(json.data);
    } catch {}
  }, []);

  /* ===========================
     NAVIGATION
  =========================== */

  const navigateTo = useCallback((page) => {
    if (page === currentPage) return;
    setCurrentPage(page);
    window.location.hash = page;

    const tg = window.Telegram?.WebApp;
    if (tg?.BackButton) {
      page === 'home' ? tg.BackButton.hide() : tg.BackButton.show();
    }
  }, [currentPage]);

  /* ===========================
     TELEGRAM INIT
  =========================== */

  const initTelegramWebApp = useCallback(() => {
    if (!window.Telegram?.WebApp) return;

    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    /* 🔙 BackButton */
    if (tg.BackButton) {
      tg.BackButton.onClick(() => navigateTo('home'));
      tg.BackButton.hide();
    }

    /* ⚙️ SettingsButton (ЕДИНСТВЕННЫЙ ПРАВИЛЬНЫЙ СПОСОБ) */
    if (tg.SettingsButton) {
      tg.SettingsButton.show();
      tg.SettingsButton.onClick(() => navigateTo('settings'));
    } else {
      setTimeout(() => {
        showToast('Настройки доступны в профиле 👤', 'info');
      }, 1500);
    }

    tg.onEvent('themeChanged', applyTheme);
    applyTheme();

    if (tg.initDataUnsafe?.user) {
      const u = tg.initDataUnsafe.user;
      const user = {
        id: u.id.toString(),
        username: u.username,
        firstName: u.first_name,
        photoUrl: u.photo_url || null
      };
      setTelegramUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      showToast(`Добро пожаловать, ${user.firstName} 👋`, 'success');
    }
  }, [navigateTo, applyTheme, showToast]);

  /* ===========================
     EFFECTS
  =========================== */

  useEffect(() => {
    initTelegramWebApp();
    loadReferralData();

    const hash = window.location.hash.replace('#', '');
    if (hash) setCurrentPage(hash);

    setTimeout(() => setIsLoading(false), 800);
  }, [initTelegramWebApp, loadReferralData]);

  /* ===========================
     RENDER
  =========================== */

  const commonProps = {
    telegramUser,
    navigateTo,
    API_BASE_URL,
    showToast,
    toggleTheme,
    isDarkMode
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'profile': return <Profile {...commonProps} />;
      case 'history': return <History {...commonProps} />;
      case 'help': return <Help {...commonProps} />;
      case 'settings': return <SettingsApp {...commonProps} />;
      default: return <Home {...commonProps} />;
    }
  };

  if (isLoading) {
    return <div className="app-loading">Загрузка…</div>;
  }

  return (
    <div className="app">
      {renderPage()}

      {currentPage !== 'settings' && currentPage !== 'help' && (
        <div className="floating-nav">
          <button onClick={() => navigateTo('profile')}>
            <ProfileIcon active={currentPage === 'profile'} />
          </button>
          <button onClick={() => navigateTo('home')}>
            <ExchangeIcon />
          </button>
          <button onClick={() => navigateTo('history')}>
            <HistoryIcon active={currentPage === 'history'} />
          </button>
        </div>
      )}

      {toast && <div className={`telegram-toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
}

export default App;
