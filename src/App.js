import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Home from './Home';
import History from './History';
import Profile from './Profile';
import Help from './Help';

function NavigationWrapper() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<Home navigateTo={navigate} />} />
      <Route path="/history" element={<History navigateTo={navigate} />} />
      <Route path="/profile" element={<Profile navigateTo={navigate} />} />
      <Route path="/help" element={<Help navigateTo={navigate} />} />
      <Route path="*" element={<Home navigateTo={navigate} />} />
    </Routes>
  );
}

function App() {
  useEffect(() => {
    // Проверяем разные варианты Telegram API
    const initTelegram = () => {
      if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        console.log('Telegram WebApp initialized');
      } else if (window.TelegramWebviewProxy) {
        console.log('Telegram Webview Proxy detected');
      } else if (window.TelegramGameProxy) {
        console.log('Telegram Game Proxy detected');
      } else {
        console.log('Running in browser mode');
      }
    };

    initTelegram();
  }, []);

  return (
    <Router>
      <NavigationWrapper />
    </Router>
  );
}

export default App;