import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

import Home from './Home';
import History from './History';
import Profile from './Profile';
import Help from './Help';
import SettingsApp from './SettingsApp';
import Game from './Game';

import { ProfileIcon, ExchangeIcon, HistoryIcon } from './NavIcons';

const API_BASE_URL = 'https://tethrab.shop';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [displayPage, setDisplayPage] = useState('home');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [telegramUser, setTelegramUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [referralData, setReferralData] = useState(null);
  const [toast, setToast] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [hideHints, setHideHints] = useState(false);

  /* =========================
     SETTINGS
  ========================= */

  useEffect(() => {
    const saved = localStorage.getItem('hideHints');
    if (saved === 'true') setHideHints(true);
  }, []);

  /* =========================
     THEME
  ========================= */

  const telegramColorToHex = useCallback((color) => {
    if (!color && color !== 0) return null;
    if (typeof color === 'string') return color.startsWith('#') ? color : `#${color}`;
    if (typeof color === 'number') return `#${color.toString(16).padStart(6, '0')}`;
    return null;
  }, []);

  const detectDarkMode = useCallback(() => {
    if (window.Telegram?.WebApp?.themeParams?.bg_color) {
      const c = parseInt(
        window.Telegram.WebApp.themeParams.bg_color.replace('#', ''),
        16
      );
      const r = (c >> 16) & 255;
      const g = (c >> 8) & 255;
      const b = c & 255;
      return (r * 299 + g * 587 + b * 114) / 1000 < 180;
    }
    return true;
  }, []);

  const applyTheme = useCallback(() => {
    const root = document.documentElement;
    const dark = detectDarkMode();
    setIsDarkMode(dark);

    let button = '#3390ec';
    let text = '#000';
    let hint = '#8e8e93';

    const p = window.Telegram?.WebApp?.themeParams;
    if (p) {
      button = telegramColorToHex(p.button_color) || button;
      text = telegramColorToHex(p.text_color) || text;
      hint = telegramColorToHex(p.hint_color) || hint;
    }

    root.style.setProperty('--tg-theme-button-color', button);
    root.style.setProperty('--tg-theme-text-color', dark ? '#fff' : '#000');
    root.style.setProperty('--tg-theme-hint-color', hint);

    if (dark) root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
  }, [detectDarkMode, telegramColorToHex]);

  /* =========================
     TOAST
  ========================= */

  const showToast = useCallback((message, type = 'info') => {
    if (hideHints && type === 'info') return;
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, [hideHints]);

  /* =========================
     NAVIGATION WITH SMOOTH TRANSITION
  ========================= */

  const navigateTo = useCallback((page) => {
    if (page === currentPage || isTransitioning) return;

    setIsTransitioning(true);
    window.location.hash = page;

    // сначала запускаем уход текущей страницы
    setTimeout(() => {
      setDisplayPage(page);
      setCurrentPage(page);
    }, 160);

    // затем показываем новую
    setTimeout(() => {
      setIsTransitioning(false);
    }, 320);
  }, [currentPage, isTransitioning]);

  /* =========================
     INIT TELEGRAM
  ========================= */

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      applyTheme();

      tg.onEvent('themeChanged', () => {
        setTimeout(applyTheme, 100);
      });

      if (tg.initDataUnsafe?.user) {
        const u = tg.initDataUnsafe.user;
        const user = {
          id: u.id.toString(),
          telegramId: u.id,
          username: u.username || `user_${u.id}`,
          firstName: u.first_name || 'Пользователь',
          photoUrl: u.photo_url || null
        };
        setTelegramUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
      }
    }

    setTimeout(() => setIsLoading(false), 800);
  }, [applyTheme]);

  /* =========================
     RENDER PAGE
  ========================= */

  const renderPage = () => {
    const props = {
      telegramUser,
      navigateTo,
      API_BASE_URL,
      showToast,
      isDarkMode,
      hideHints,
      updateHideHints: setHideHints
    };

    switch (displayPage) {
      case 'profile': return <Profile {...props} />;
      case 'history': return <History {...props} />;
      case 'help': return <Help {...props} />;
      case 'settings': return <SettingsApp {...props} />;
      case 'game': return <Game {...props} />;
      default: return <Home {...props} />;
    }
  };

  /* =========================
     LOADER
  ========================= */

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
      <div className="app-content">
        <div
          className={`page-transition ${
            isTransitioning ? 'page-exit' : 'page-enter'
          }`}
        >
          {renderPage()}
        </div>

        {toast && (
          <div className={`telegram-toast ${toast.type}`}>
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
