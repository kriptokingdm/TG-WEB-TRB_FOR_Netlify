// App.js - Убери лишний useEffect и оставь только один
import React, { useState, useEffect } from 'react';
import './App.css';
import Home from './Home';
import Profile from './Profile';
import History from './History';
import Help from './Help';
import TransitionWrapper from './TransitionWrapper';

function App() {
    const [currentView, setCurrentView] = useState('/');
    const [transitionDirection, setTransitionDirection] = useState('');
    const [telegramUser, setTelegramUser] = useState(null);

    // Только ОДИН useEffect для инициализации
    useEffect(() => {
        const initTelegram = () => {
            if (window.Telegram?.WebApp) {
                const tg = window.Telegram.WebApp;
                
                // Инициализация
                tg.ready();
                tg.expand(); // Важно! Расширяем приложение
                
                console.log('🤖 Telegram WebApp инициализирован');
                console.log('👤 User данные:', tg.initDataUnsafe?.user);
                console.log('📋 InitData:', tg.initData);
                console.log('📱 Telegram версия:', tg.version);
                
                // Пробуем получить пользователя
                let userData = null;
                
                // 1. Прямо из initDataUnsafe
                if (tg.initDataUnsafe?.user) {
                    userData = tg.initDataUnsafe.user;
                    console.log('✅ Пользователь из initDataUnsafe:', userData);
                } 
                // 2. Пробуем распарсить initData
                else if (tg.initData) {
                    try {
                        const params = new URLSearchParams(tg.initData);
                        const userStr = params.get('user');
                        if (userStr) {
                            userData = JSON.parse(userStr);
                            console.log('✅ Пользователь из initData:', userData);
                        }
                    } catch (e) {
                        console.error('❌ Ошибка парсинга initData:', e);
                    }
                }
                
                // 3. Из localStorage
                if (!userData) {
                    const savedUser = localStorage.getItem('telegramUser');
                    if (savedUser) {
                        try {
                            userData = JSON.parse(savedUser);
                            console.log('📱 Пользователь из localStorage:', userData);
                        } catch (e) {
                            console.error('❌ Ошибка парсинга localStorage:', e);
                        }
                    }
                }
                
                // Сохраняем пользователя
                if (userData) {
                    setTelegramUser(userData);
                    
                    // Сохраняем в localStorage
                    localStorage.setItem('telegramUser', JSON.stringify(userData));
                    
                    // Сохраняем в формат currentUser
                    const appUser = {
                        id: `user_${userData.id}`,
                        telegramId: userData.id,
                        username: userData.username || `user_${userData.id}`,
                        firstName: userData.first_name || 'Пользователь',
                        lastName: userData.last_name || '',
                        photoUrl: userData.photo_url || null
                    };
                    localStorage.setItem('currentUser', JSON.stringify(appUser));
                } else {
                    console.log('⚠️ Пользователь не найден, создаем тестового');
                    
                    // Тестовый пользователь
                    const testUser = {
                        id: 7879866656,
                        username: 'TERBCEO',
                        first_name: 'G',
                        last_name: ''
                    };
                    
                    setTelegramUser(testUser);
                    localStorage.setItem('telegramUser', JSON.stringify(testUser));
                    
                    const appUser = {
                        id: 'user_7879866656',
                        telegramId: 7879866656,
                        username: 'TERBCEO',
                        firstName: 'G',
                        lastName: ''
                    };
                    localStorage.setItem('currentUser', JSON.stringify(appUser));
                }
                
                // Устанавливаем цвета (если версия поддерживает)
                try {
                    if (parseFloat(tg.version) >= 6.1) {
                        tg.setHeaderColor('#2E2E2E');
                        tg.setBackgroundColor('#121212');
                    }
                } catch (e) {
                    console.log('⚠️ Цвета не поддерживаются в версии', tg.version);
                }
                
                // Устанавливаем тему
                if (tg.colorScheme === 'dark') {
                    document.documentElement.setAttribute('data-theme', 'dark');
                    try {
                        if (parseFloat(tg.version) >= 6.1) {
                            tg.setBackgroundColor('#0f172a');
                        }
                    } catch (e) {}
                } else {
                    document.documentElement.setAttribute('data-theme', 'light');
                }
                
            } else {
                console.log('⚠️ Telegram WebApp не найден, работаем в браузере');
                
                // Проверяем сохраненного пользователя
                const savedUser = localStorage.getItem('telegramUser');
                if (savedUser) {
                    try {
                        setTelegramUser(JSON.parse(savedUser));
                    } catch (e) {
                        console.error('❌ Ошибка загрузки пользователя:', e);
                    }
                }
            }
        };

        initTelegram();
        
        // Проверяем сохраненную тему
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        }
    }, []);

    // Определяем направление перехода
    const navigateTo = (view) => {
        const views = ['/', '/profile', '/history', '/help'];
        const currentIndex = views.indexOf(currentView);
        const nextIndex = views.indexOf(view);
        
        if (nextIndex > currentIndex) {
            setTransitionDirection('slide-left');
        } else if (nextIndex < currentIndex) {
            setTransitionDirection('slide-right');
        } else {
            setTransitionDirection('');
        }
        
        setCurrentView(view);
        
        // Прокрутка вверх при смене страницы
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const renderView = () => {
        const pageProps = { 
            navigateTo,
            telegramUser // Передаем пользователя в компоненты
        };
        
        switch (currentView) {
            case '/':
                return <Home {...pageProps} />;
            case '/profile':
                return <Profile {...pageProps} />;
            case '/history':
                return <History {...pageProps} />;
            case '/help':
                return <Help {...pageProps} />;
            default:
                return <Home {...pageProps} />;
        }
    };

    return (
        <div className="App">
            <TransitionWrapper location={currentView}>
                <div className={`page-content ${transitionDirection}`}>
                    {renderView()}
                </div>
            </TransitionWrapper>
        </div>
    );
}
{process.env.NODE_ENV === 'development' && telegramData && (
  <div className="debug-panel" style={{
    position: 'fixed',
    bottom: '10px',
    right: '10px',
    background: '#fff',
    border: '1px solid #ccc',
    padding: '10px',
    borderRadius: '5px',
    fontSize: '12px',
    zIndex: 9999,
    maxWidth: '300px'
  }}>
    <button onClick={() => {
      console.log('📊 Telegram данные для отладки:', telegramData);
      console.log('👤 Telegram User:', telegramUser);
      alert('Данные в консоли');
    }}>
      🔧 Отладка
    </button>
  </div>
)}
export default App;