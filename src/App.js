import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Home from './Home';
import History from './History';
import Profile from './Profile';
import Help from './Help';

// Компонент для навигации
function NavigationWrapper() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<Home navigateTo={navigate} />} />
      <Route path="/history" element={<History navigateTo={navigate} />} />
      <Route path="/profile" element={<Profile navigateTo={navigate} />} />
      <Route path="/help" element={<Help navigateTo={navigate} />} />
    </Routes>
  );
}

function App() {
  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      
      console.log('Telegram Web App initialized:', tg.initDataUnsafe?.user);
    }
  }, []);

  return (
    <Router>
      <NavigationWrapper />
    </Router>
  );
}

export default App;