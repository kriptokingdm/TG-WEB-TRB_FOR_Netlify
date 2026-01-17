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
  const [prevPage, setPrevPage] = useState(null);
  const [telegramUser, setTelegramUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [referralData, setReferralData] = useState(null);
  const [toast, setToast] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hideHints, setHideHints] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('hideHints');
    if (saved === 'true') setHideHints(true);
  }, []);

  /* =========================
     TELEGRAM THEME (FIX)
  ========================= */
  const detectDarkMode = useCallback(() => {
    if (window.Telegram?.WebApp?.colorScheme) {
      return window.Telegram.WebApp.colorScheme === 'dark';
    }
    return false; // ⚠️ ВАЖНО: Telegram light по умолчанию
  }, []);

  const applyTheme = useCallback(() => {
    const root = document.documentElement;
    const darkMode = detectDarkMode();
    setIsDarkMode(darkMode);

    if (darkMode) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
  }, [detectDarkMode]);

  /* =========================
     TOAST
  ========================= */
  const showToast = useCallback((message, type = 'info') => {
    if (hideHints && type === 'info') return;
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, [hideHints]);

  const updateHideHints = useCallback((value) => {
    setHideHints(value);
    localStorage.setItem('hideHints', value.toString());
  }, []);

  /* =========================
     NAVIGATION (SMOOTH)
  ========================= */
  const navigateTo = useCallback((page) => {
    if (page === currentPage || isAnimating) return;

    setIsAnimating(true);
    setPrevPage(currentPage);

    setTimeout(() => {
      window.location.hash = page;
      setCurrentPage(page);
    }, 120);

    setTimeout(() => {
      setPrevPage(null);
      setIsAnimating(false);
    }, 320);
  }, [currentPage, isAnimating]);

  /* =========================
     INIT TELEGRAM
  ========================= */
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      applyTheme();

      tg.onEvent('themeChanged', applyTheme);

      if (tg.initDataUnsafe?.user) {
        const u = tg.initDataUnsafe.user;
        const user = {
          id: u.id.toString(),
          telegramId: u.id,
          username: u.username,
          firstName: u.first_name,
          photoUrl: u.photo_url || null
        };
        setTelegramUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
      }
    }

    setTimeout(() => setIsLoading(false), 800);
  }, [applyTheme]);

  /* =========================
     PAGE RENDER
  ========================= */
  const commonProps = {
    telegramUser,
    navigateTo,
    API_BASE_URL,
    showToast,
    isDarkMode,
    hideHints,
    updateHideHints
  };

  const renderPage = (page) => {
    switch (page) {
      case 'profile': return <Profile {...commonProps} />;
      case 'history': return <History {...commonProps} />;
      case 'help': return <Help {...commonProps} />;
      case 'settings': return <SettingsApp {...commonProps} />;
      case 'game': return <Game {...commonProps} />;
      default: return <Home {...commonProps} />;
    }
  };

  /* =========================
     LOADER
  ========================= */
  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка…</p>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-wrapper">

        <div className={`page-container ${isAnimating ? 'fade' : 'show'}`}>
          {prevPage && (
            <div className="page old">
              {renderPage(prevPage)}
            </div>
          )}

          <div className="page new">
            {renderPage(currentPage)}
          </div>
        </div>

        {currentPage !== 'help' && currentPage !== 'settings' && (
          <div className="floating-nav">
            <button
              className={`nav-item-floating ${currentPage === 'profile' ? 'active' : ''}`}
              onClick={() => navigateTo('profile')}
            >
              <ProfileIcon active={currentPage === 'profile'} />
              <span>Профиль</span>
            </button>

            <button className="nav-center-circle-floating" onClick={() => navigateTo('home')}>
              <ExchangeIcon active />
            </button>

            <button
              className={`nav-item-floating ${currentPage === 'history' ? 'active' : ''}`}
              onClick={() => navigateTo('history')}
            >
              <HistoryIcon active={currentPage === 'history'} />
              <span>История</span>
            </button>
          </div>
        )}

        {toast && (
          <div className={`telegram-toast ${toast.type}`}>
            {toast.message}
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
