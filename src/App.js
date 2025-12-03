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
    // Функция для применения темной темы
    const applyDarkTheme = () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark-theme');
      
      // Добавляем кастомные переменные для темной темы
      document.documentElement.style.setProperty('--tg-bg-color', '#0f0f0f');
      document.documentElement.style.setProperty('--tg-text-color', '#ffffff');
      document.documentElement.style.setProperty('--tg-secondary-bg', '#1a1a1a');
      document.documentElement.style.setProperty('--tg-border-color', '#333333');
      document.documentElement.style.setProperty('--tg-primary-color', '#3f51b5');
      
      console.log('🌙 Применена темная тема Telegram');
    };

    // Функция для применения светлой темы
    const applyLightTheme = () => {
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.remove('dark-theme');
      
      // Возвращаем стандартные переменные
      document.documentElement.style.setProperty('--tg-bg-color', '#ffffff');
      document.documentElement.style.setProperty('--tg-text-color', '#000000');
      document.documentElement.style.setProperty('--tg-secondary-bg', '#f5f5f5');
      document.documentElement.style.setProperty('--tg-border-color', '#e0e0e0');
      document.documentElement.style.setProperty('--tg-primary-color', '#007cff');
      
      console.log('☀️ Применена светлая тема Telegram');
    };

    // Проверяем разные варианты Telegram API
    const initTelegram = () => {
      if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        
        console.log('Telegram WebApp initialized');
        console.log('Theme params:', tg.themeParams);
        
        // Определяем и применяем тему Telegram
        if (tg.colorScheme === 'dark') {
          applyDarkTheme();
        } else {
          applyLightTheme();
        }
        
        // Подписываемся на изменение темы
        tg.onEvent('themeChanged', () => {
          console.log('Theme changed:', tg.colorScheme);
          if (tg.colorScheme === 'dark') {
            applyDarkTheme();
          } else {
            applyLightTheme();
          }
        });
        
        // Используем цвета из Telegram если доступны
        if (tg.themeParams?.bg_color) {
          document.documentElement.style.setProperty('--tg-bg-color', tg.themeParams.bg_color);
        }
        if (tg.themeParams?.text_color) {
          document.documentElement.style.setProperty('--tg-text-color', tg.themeParams.text_color);
        }
        if (tg.themeParams?.secondary_bg_color) {
          document.documentElement.style.setProperty('--tg-secondary-bg', tg.themeParams.secondary_bg_color);
        }
        
      } else if (window.TelegramWebviewProxy) {
        console.log('Telegram Webview Proxy detected');
        // Для Webview проверяем prefers-color-scheme
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          applyDarkTheme();
        }
      } else if (window.TelegramGameProxy) {
        console.log('Telegram Game Proxy detected');
      } else {
        console.log('Running in browser mode');
        // Для браузера проверяем системную тему
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          applyDarkTheme();
        }
      }
    };

    // Слушатель изменения системной темы (для браузера)
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      if (!window.Telegram?.WebApp) { // Только если не в Telegram
        if (e.matches) {
          applyDarkTheme();
        } else {
          applyLightTheme();
        }
      }
    };

    // Инициализируем
    initTelegram();
    
    // Подписываемся на изменение системной темы
    if (darkModeMediaQuery.addEventListener) {
      darkModeMediaQuery.addEventListener('change', handleSystemThemeChange);
    } else { // Для старых браузеров
      darkModeMediaQuery.addListener(handleSystemThemeChange);
    }

    // Очистка при размонтировании
    return () => {
      if (darkModeMediaQuery.removeEventListener) {
        darkModeMediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else if (darkModeMediaQuery.removeListener) {
        darkModeMediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, []);

  return (
    <Router>
      <NavigationWrapper />
    </Router>
  );
}

export default App;