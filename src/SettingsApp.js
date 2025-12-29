import React, { useState, useEffect } from 'react';
import './SettingsApp.css';

// SVG иконки
const SettingsSVG = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M19.4 15C19.2663 15.3031 19.1335 15.6063 19 15.9L21 17.9C21.5 18.2 21.9 18.6 21.9 19.4C21.8 20.2 21.3 20.6 20.7 21L18.7 19C18.4 19.1 18.1 19.2 17.8 19.3C17.5 19.4 17.2 19.5 16.9 19.6L16.5 22H15.5L15.1 19.6C14.8 19.5 14.5 19.4 14.2 19.3C13.9 19.2 13.6 19.1 13.3 19L11.3 21C10.7 20.6 10.2 20.2 10.1 19.4C10 18.6 10.4 18.2 10.9 17.9L12.9 15.9C12.8 15.6 12.7 15.3 12.6 15H12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const MoonSVG = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 12.79C20.8427 14.4922 20.2039 16.1144 19.1582 17.4668C18.1125 18.8192 16.7035 19.8458 15.0957 20.4265C13.4879 21.0073 11.748 21.1181 10.0795 20.7461C8.41104 20.3741 6.88203 19.5345 5.67418 18.3267C4.46634 17.1188 3.62675 15.5898 3.25475 13.9214C2.88276 12.2529 2.99354 10.513 3.57432 8.90523C4.1551 7.29745 5.18168 5.88842 6.53407 4.84272C7.88647 3.79702 9.50862 3.15824 11.2108 3.00101C10.2134 4.34827 9.73375 6.00945 9.85843 7.68141C9.98312 9.35338 10.7039 10.9251 11.8894 12.1106C13.0749 13.2961 14.6466 14.0169 16.3186 14.1416C17.9906 14.2663 19.6518 13.7866 21 12.7892V12.79Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

function SettingsApp({ navigateTo, telegramUser, showToast, toggleTheme, isDarkMode }) {
    const [isLoading, setIsLoading] = useState(false);

    // Копирование в буфер обмена
    const copyToClipboard = (text, label) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        showToast(`✅ ${label} скопирован`, 'success');
    };

    // Форматирование USD
    const formatUSD = (num) => {
        const value = parseFloat(num || 0);
        return `$${value.toFixed(2)}`;
    };

    if (isLoading) {
        return (
            <div className="settings-container">
                <div className="settings-loading">
                    <div className="loading-spinner"></div>
                    <p>Загрузка...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="settings-container">
            {/* Хедер */}
            <div className="settings-header" style={{ backgroundColor: 'var(--tg-theme-bg-color, #ffffff)' }}>
                <div className="settings-header-content">
                    <div className="settings-header-left">
                        <button 
                            className="settings-back-button"
                            onClick={() => navigateTo('home')}
                            aria-label="Назад"
                        >
                            ←
                        </button>
                        <h1 className="settings-header-title" style={{ color: 'var(--tg-theme-text-color, #000000)' }}>
                            <SettingsSVG />
                            <span>Настройки</span>
                        </h1>
                    </div>
                </div>
            </div>

            {/* Контент настроек */}
            <div className="settings-content">
                {/* Внешний вид */}
                <div className="settings-section">
                    <h3 className="settings-section-title">Внешний вид</h3>
                    <div className="settings-list">
                        <button 
                            className="settings-item"
                            onClick={toggleTheme}
                            aria-label="Переключить тему"
                        >
                            <div className="settings-icon">
                                <MoonSVG />
                            </div>
                            <div className="settings-item-content">
                                <div className="settings-item-title">Тема приложения</div>
                                <div className="settings-item-description">
                                    {isDarkMode ? 'Тёмная' : 'Светлая'}
                                </div>
                            </div>
                            <div className="settings-item-action">
                                <div className={`toggle-switch ${isDarkMode ? 'active' : ''}`}>
                                    <div className="toggle-slider"></div>
                                </div>
                            </div>
                        </button>
                        
                        <button 
                            className="settings-item"
                            onClick={() => {
                                if (window.Telegram?.WebApp) {
                                    window.Telegram.WebApp.setHeaderColor(isDarkMode ? '#1c1c1c' : '#ffffff');
                                    window.Telegram.WebApp.setBackgroundColor(isDarkMode ? '#1c1c1c' : '#ffffff');
                                    showToast('Цвет хедера обновлён', 'success');
                                }
                            }}
                            aria-label="Обновить цвет хедера"
                        >
                            <div className="settings-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7 12C7 13.1046 7.89543 14 9 14C10.1046 14 11 13.1046 11 12C11 10.8954 10.1046 10 9 10C7.89543 10 7 10.8954 7 12Z" stroke="currentColor" strokeWidth="1.5"/>
                                    <path d="M13 12C13 13.1046 13.8954 14 15 14C16.1046 14 17 13.1046 17 12C17 10.8954 16.1046 10 15 10C13.8954 10 13 10.8954 13 12Z" stroke="currentColor" strokeWidth="1.5"/>
                                    <path d="M19 12C19 13.1046 19.8954 14 21 14C22.1046 14 23 13.1046 23 12C23 10.8954 22.1046 10 21 10C19.8954 10 19 10.8954 19 12Z" stroke="currentColor" strokeWidth="1.5"/>
                                </svg>
                            </div>
                            <div className="settings-item-content">
                                <div className="settings-item-title">Обновить хедер</div>
                                <div className="settings-item-description">
                                    Синхронизировать цвет с темой
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
                
                {/* Аккаунт */}
                <div className="settings-section">
                    <h3 className="settings-section-title">Аккаунт</h3>
                    <div className="settings-list">
                        <button 
                            className="settings-item"
                            onClick={() => copyToClipboard(telegramUser?.id, 'ID пользователя')}
                            aria-label="Копировать ID"
                        >
                            <div className="settings-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z" stroke="currentColor" strokeWidth="2"/>
                                    <path d="M12 2C14.6522 2 17.1957 3.05357 19.0711 4.92893C20.9464 6.8043 22 9.34784 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2Z" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                            </div>
                            <div className="settings-item-content">
                                <div className="settings-item-title">ID пользователя</div>
                                <div className="settings-item-description">
                                    {telegramUser?.id || '—'}
                                </div>
                            </div>
                            <div className="settings-item-action">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M16 12.9V17.1C16 20.6 14.6 22 11.1 22H6.9C3.4 22 2 20.6 2 17.1V12.9C2 9.4 3.4 8 6.9 8H11.1C14.6 8 16 9.4 16 12.9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M22 6.9V11.1C22 14.6 20.6 16 17.1 16H16V12.9C16 9.4 14.6 8 11.1 8H8V6.9C8 3.4 9.4 2 12.9 2H17.1C20.6 2 22 3.4 22 6.9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                        </button>
                        
                        <button 
                            className="settings-item"
                            onClick={() => navigateTo('profile')}
                            aria-label="Перейти в профиль"
                        >
                            <div className="settings-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="currentColor" strokeWidth="1.5"/>
                                    <path d="M20 21C20 19.6044 20 18.4067 19.8278 17.4511C19.5776 16.0587 18.9413 15.4224 17.5489 15.1722C16.5933 15 15.3956 15 14 15H10C8.60444 15 7.40673 15 6.45111 15.1722C5.05869 15.4224 4.42236 16.0587 4.17221 17.4511C4 18.4067 4 19.6044 4 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                            </div>
                            <div className="settings-item-content">
                                <div className="settings-item-title">Мой профиль</div>
                                <div className="settings-item-description">
                                    Рефералы и статистика
                                </div>
                            </div>
                            <div className="settings-item-action">
                                →
                            </div>
                        </button>
                        
                        <button 
                            className="settings-item"
                            onClick={() => {
                                if (confirm('Вы уверены, что хотите выйти?')) {
                                    localStorage.clear();
                                    window.location.reload();
                                }
                            }}
                            aria-label="Выйти из аккаунта"
                            style={{ color: '#ff3b30' }}
                        >
                            <div className="settings-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <div className="settings-item-content">
                                <div className="settings-item-title">Выйти</div>
                                <div className="settings-item-description">
                                    Завершить текущую сессию
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
                
                {/* Информация о приложении */}
                <div className="settings-app-info">
                    <p className="app-version">TetherRabbit v1.0.0</p>
                    <p className="app-copyright">© 2024 TetherRabbit. Все права защищены.</p>
                </div>
            </div>
        </div>
    );
}

export default SettingsApp;