import React, { useEffect } from 'react';
import Home from './Home';

function App() {
  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#007CFF');
      tg.setBackgroundColor('#ffffff');
      
      console.log('Telegram Web App initialized:', tg.initDataUnsafe?.user);
    }
  }, []);

  const navigateTo = (page) => {
    console.log(`Navigate to: ${page}`);
    // Простая навигация для теста
  };

  return <Home navigateTo={navigateTo} />;
}

export default App;