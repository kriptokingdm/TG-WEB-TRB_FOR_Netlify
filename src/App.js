import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

import Home from './Home';
import History from './History';
import Profile from './Profile';
import Help from './Help';
import SettingsApp from './SettingsApp';
import Game from './Game'; // 🔥 ДОБАВЛЕНО

import { ProfileIcon, ExchangeIcon, HistoryIcon } from './NavIcons';

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

  /* ======================
     НАВИГАЦИЯ
  ====================== */
  const navigateTo = useCallback((page) => {
    if (page === currentPage) return;
    window.location.hash = page;
    setCurrentPage(page);
  }, [currentPage]);

  /* ======================
     HASH ROUTING (FIX)
  ====================== */
  useEffect(() => {
    const allowedPages = [
      'home',
      'profile',
      'history',
      'help',
      'settings',
      'game' // 🔥 ВАЖНО
    ];

    const applyHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (allowedPages.includes(hash)) {
        setCurrentPage(hash);
      }
    };

    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  /* ======================
     INIT TELEGRAM
  ====================== */
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      if (tg.initDataUnsafe?.user) {
        const u = tg.initDataUnsafe.user;
        setTelegramUser({
          id: u.id,
          firstName: u.first_name,
          username: u.username
        });
      }
    }
  }, []);

  /* ======================
     РЕНДЕР СТРАНИЦ
  ====================== */
  const renderPage = () => {
    const commonProps = {
      telegramUser,
      navigateTo,
      API_BASE_URL,
      showToast: (m, t) => {
        setToast({ message: m, type: t });
        setTimeout(() => setToast(null), 3000);
      },
      toggleTheme: () => {},
      isDarkMode,
      hideHints,
      updateHideHints: setHideHints
    };

    switch (currentPage) {
      case 'profile':
        return <Profile {...commonProps} />;
      case 'history':
        return <History {...commonProps} />;
      case 'help':
        return <Help {...commonProps} />;
      case 'settings':
        return <SettingsApp {...commonProps} />;
      case 'game':
        return <Game {...commonProps} />; // 🔥 НЕ РЕДИРЕКТИТ
      default:
        return <Home {...commonProps} />;
    }
  };

  /* ======================
     NAV
  ====================== */
  const Navigation = () => (
    <div className="floating-nav">
      <button onClick={() => navigateTo('profile')}>
        <ProfileIcon />
        <span>Профиль</span>
      </button>

      <button onClick={() => navigateTo('home')}>
        <ExchangeIcon />
        <span>Обмен</span>
      </button>

      <button onClick={() => navigateTo('history')}>
        <HistoryIcon />
        <span>История</span>
      </button>
    </div>
  );

  if (isLoading) {
    setTimeout(() => setIsLoading(false), 600);
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
              {toast.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
