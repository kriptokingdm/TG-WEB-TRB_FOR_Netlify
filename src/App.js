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
        const pageProps = { navigateTo };
        
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

    // Инициализация Telegram WebApp
    useEffect(() => {
        const initTelegram = () => {
            if (window.Telegram?.WebApp) {
                const tg = window.Telegram.WebApp;
                tg.ready();
                tg.expand();
                tg.enableClosingConfirmation();
                
                // Устанавливаем цвет фона
                tg.setBackgroundColor('#f8fafc');
                tg.setHeaderColor('secondary_bg_color');
                
                console.log('🤖 Telegram WebApp инициализирован');
                
                // Устанавливаем тему в зависимости от Telegram
                if (tg.colorScheme === 'dark') {
                    document.documentElement.setAttribute('data-theme', 'dark');
                    tg.setBackgroundColor('#0f172a');
                } else {
                    document.documentElement.setAttribute('data-theme', 'light');
                }
                
                // Слушаем изменения темы
                tg.onEvent('themeChanged', () => {
                    if (tg.colorScheme === 'dark') {
                        document.documentElement.setAttribute('data-theme', 'dark');
                        tg.setBackgroundColor('#0f172a');
                    } else {
                        document.documentElement.setAttribute('data-theme', 'light');
                        tg.setBackgroundColor('#f8fafc');
                    }
                });
            } else {
                console.log('⚠️ Telegram WebApp не найден, работаем в браузере');
            }
        };

        initTelegram();
        
        // Проверяем сохраненную тему
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        }
    }, []);

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

export default App;