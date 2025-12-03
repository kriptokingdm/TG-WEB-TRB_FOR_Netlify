import { useEffect } from 'react';
import './App.css';

function App() {
  useEffect(() => {
    console.log('App loaded');
    
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      console.log('Telegram Web App ready');
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      padding: '40px',
      textAlign: 'center',
      backgroundColor: '#0088cc',
      color: 'white'
    }}>
      <h1>✅ Telegram Web App работает!</h1>
      <p>Если видишь этот текст - всё настроено правильно</p>
      <button 
        onClick={() => {
          if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.showAlert('Test alert!');
          }
        }}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: 'white',
          color: '#0088cc',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        Test Button
      </button>
    </div>
  );
}

export default App;