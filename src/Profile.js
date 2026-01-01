import React, { useState, useEffect } from 'react';
import './Profile.css';

const API_BASE_URL = 'https://tethrab.shop';

// SVG иконки Telegram
const HelpSVG = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM11.25 7.5C11.25 6.94772 11.6977 6.5 12.25 6.5H12.35C12.9023 6.5 13.35 6.94772 13.35 7.5C13.35 8.05228 12.9023 8.5 12.35 8.5H12.25C11.6977 8.5 11.25 8.05228 11.25 7.5ZM10.25 11C10.25 10.4477 10.6977 10 11.25 10H12.25C12.8023 10 13.25 10.4477 13.25 11V15.5C13.25 16.0523 12.8023 16.5 12.25 16.5C11.6977 16.5 11.25 16.0523 11.25 15.5V12H11.25C10.6977 12 10.25 11.5523 10.25 11Z" fill="currentColor"/>
    </svg>
);

function Profile({ navigateTo, telegramUser, showToast }) {
    const [userData, setUserData] = useState(null);
    const [usdtBalance, setUsdtBalance] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Получаем ID пользователя
    const getUserId = () => {
        try {
            if (window.Telegram?.WebApp) {
                const tg = window.Telegram.WebApp;
                const tgUser = tg.initDataUnsafe?.user;
                if (tgUser?.id) {
                    return tgUser.id.toString();
                }
            }

            const savedTelegramUser = localStorage.getItem('telegramUser');
            if (savedTelegramUser) {
                const parsed = JSON.parse(savedTelegramUser);
                return parsed.id?.toString();
            }

            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                const parsed = JSON.parse(savedUser);
                return parsed.telegramId?.toString() || parsed.id?.toString();
            }

        } catch (error) {
            console.error('❌ Ошибка получения ID:', error);
        }

        return '7879866656';
    };

    // Показать сообщение
    const showMessage = (type, text) => {
        if (showToast) {
            showToast(text, type);
        } else {
            setMessage({ type, text });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    // Копирование в буфер обмена
    const copyToClipboard = (text, label) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        showMessage('success', `✅ ${label} скопирован`);
    };

    // Загрузка баланса USDT
    const loadUsdtBalance = async (userId) => {
        try {
            // Пока используем мок данные, пока не добавишь API
            // TODO: Заменить на реальный API запрос
            const mockBalance = Math.random() * 1000; // Временные данные
            
            // Пример реального запроса (когда добавишь API):
            // const response = await fetch(`${API_BASE_URL}/api/user/${userId}/balance`);
            // const data = await response.json();
            // setUsdtBalance(data.usdt_balance || 0);
            
            setUsdtBalance(mockBalance.toFixed(2));
        } catch (error) {
            console.error('❌ Ошибка загрузки баланса USDT:', error);
            setUsdtBalance(0);
        }
    };

    // Загрузка данных пользователя
    const loadUserData = async () => {
        try {
            const userId = getUserId();
            
            // Загружаем USDT баланс
            await loadUsdtBalance(userId);

            // Используем telegramUser если есть, иначе загружаем
            if (telegramUser && !userData) {
                setUserData({
                    id: telegramUser.id,
                    username: telegramUser.username || `user_${telegramUser.id}`,
                    firstName: telegramUser.firstName || 'Пользователь',
                    photoUrl: telegramUser.photoUrl
                });
            } else if (!userData) {
                // Загружаем данные пользователя из API (если есть)
                try {
                    const response = await fetch(`${API_BASE_URL}/api/user?userId=${userId}`);
                    if (response.ok) {
                        const result = await response.json();
                        if (result.success) {
                            setUserData(result.user);
                        }
                    }
                } catch (apiError) {
                    console.error('Ошибка API:', apiError);
                    // Используем данные из localStorage
                    const savedUser = JSON.parse(localStorage.getItem('telegramUser') || localStorage.getItem('currentUser') || '{}');
                    setUserData({
                        id: savedUser.id || userId,
                        username: savedUser.username || `user_${userId}`,
                        firstName: savedUser.firstName || 'Пользователь',
                        photoUrl: savedUser.photoUrl
                    });
                }
            }

        } catch (error) {
            console.error('❌ Общая ошибка загрузки:', error);
            const userId = getUserId();
            
            // Используем данные из Telegram или localStorage
            if (!userData) {
                const savedUser = JSON.parse(localStorage.getItem('telegramUser') || localStorage.getItem('currentUser') || '{}');
                setUserData({
                    id: savedUser.id || userId,
                    username: savedUser.username || `user_${userId}`,
                    firstName: savedUser.firstName || 'Пользователь',
                    photoUrl: savedUser.photoUrl
                });
            }
            
            setUsdtBalance(0);
        }
    };

    // Эффект загрузки данных
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await loadUserData();
            setIsLoading(false);
        };

        loadData();
        
        // Обновляем баланс каждые 30 секунд
        const interval = setInterval(() => {
            const userId = getUserId();
            loadUsdtBalance(userId);
        }, 30000);
        
        return () => clearInterval(interval);
    }, []);

    // Форматирование USDT
    const formatUSDT = (num) => {
        const value = parseFloat(num || 0);
        return `${value.toFixed(2)} USDT`;
    };

    if (isLoading) {
        return (
            <div className="profile-container">
                <div className="profile-loading">
                    <div className="loading-spinner"></div>
                    <p>Загрузка...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            {/* Хедер */}
            <div className="profile-header" style={{ backgroundColor: 'var(--tg-theme-bg-color, #ffffff)' }}>
                <div className="header-content">
                    <div className="header-left">
                        <h1 className="profile-header-title" style={{ color: 'var(--tg-theme-text-color, #000000)' }}>
                            Профиль
                        </h1>
                    </div>
                    <button
                        className="help-button"
                        onClick={() => navigateTo('help')}
                        title="Помощь"
                        aria-label="Помощь"
                        style={{ color: 'var(--tg-theme-button-color, #3390ec)' }}
                    >
                        <HelpSVG />
                    </button>
                </div>
            </div>

            {/* Информация профиля */}
            <div className="profile-card">
                <div className="profile-avatar">
                    {userData?.photoUrl ? (
                        <img 
                            src={userData.photoUrl} 
                            alt={userData.firstName}
                            className="avatar-image"
                        />
                    ) : (
                        <div className="avatar-placeholder">
                            {userData?.firstName?.[0]?.toUpperCase() || 'U'}
                        </div>
                    )}
                </div>

                <div className="profile-info">
                    <h2 className="profile-name">{userData?.firstName || 'Пользователь'}</h2>
                    <p className="profile-username">@{userData?.username || 'user'}</p>
                    
                    <div className="profile-id">
                        <button 
                            className="id-button"
                            onClick={() => copyToClipboard(userData?.id, 'ID')}
                            aria-label="Копировать ID"
                        >
                            ID: {userData?.id || '—'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Баланс USDT */}
            <div className="balance-card">
                <div className="balance-header">
                    <div className="balance-icon">💰</div>
                    <div className="balance-info">
                        <h3>Баланс USDT</h3>
                        <p>Текущий баланс в USDT (TRC20)</p>
                    </div>
                </div>
                
                <div className="balance-amount">
                    <div className="balance-value">{formatUSDT(usdtBalance)}</div>
                    <div className="balance-equivalent">
                        ≈ {(usdtBalance * 87).toFixed(2)} RUB {/* Примерный курс */}
                    </div>
                </div>
                
                <div className="balance-actions">
                    <button
                        className="balance-action-btn"
                        onClick={() => navigateTo('buy')}
                        aria-label="Пополнить баланс"
                    >
                        <span className="action-icon">⬆️</span>
                        <span className="action-text">Пополнить</span>
                    </button>
                    
                    <button
                        className="balance-action-btn"
                        onClick={() => navigateTo('sell')}
                        aria-label="Вывести USDT"
                    >
                        <span className="action-icon">⬇️</span>
                        <span className="action-text">Вывести</span>
                    </button>
                </div>
            </div>

            {/* История транзакций */}
            <div className="transactions-card">
                <div className="transactions-header">
                    <h3>История операций</h3>
                    <button 
                        className="transactions-refresh"
                        onClick={loadUserData}
                        aria-label="Обновить"
                    >
                        🔄
                    </button>
                </div>
                
                <div className="transactions-list">
                    {/* Здесь будет список транзакций */}
                    <div className="transaction-item">
                        <div className="transaction-type">Покупка USDT</div>
                        <div className="transaction-amount">+100.00 USDT</div>
                        <div className="transaction-date">12 дек 14:30</div>
                        <div className="transaction-status completed">Завершено</div>
                    </div>
                    
                    <div className="transaction-item">
                        <div className="transaction-type">Продажа USDT</div>
                        <div className="transaction-amount">-50.00 USDT</div>
                        <div className="transaction-date">11 дек 10:15</div>
                        <div className="transaction-status completed">Завершено</div>
                    </div>
                    
                    <button
                        className="view-all-transactions"
                        onClick={() => navigateTo('history')}
                        aria-label="Вся история"
                    >
                        Вся история операций →
                    </button>
                </div>
            </div>

            {/* Быстрые действия */}
            <div className="quick-actions">
                <button
                    className="quick-action"
                    onClick={() => navigateTo('buy')}
                    aria-label="Купить USDT"
                >
                    <span className="quick-action-icon">🛒</span>
                    <span className="quick-action-text">Купить USDT</span>
                </button>
                
                <button
                    className="quick-action"
                    onClick={() => navigateTo('sell')}
                    aria-label="Продать USDT"
                >
                    <span className="quick-action-icon">💵</span>
                    <span className="quick-action-text">Продать USDT</span>
                </button>
                
                <button
                    className="quick-action"
                    onClick={() => navigateTo('support')}
                    aria-label="Поддержка"
                >
                    <span className="quick-action-icon">💬</span>
                    <span className="quick-action-text">Поддержка</span>
                </button>
            </div>

            {/* Toast сообщения */}
            {(!showToast && message.text) && (
                <div className={`message-toast message-${message.type}`}>
                    <span className="toast-icon">
                        {message.type === 'success' ? '✅' :
                         message.type === 'error' ? '❌' : 'ℹ️'}
                    </span>
                    <span className="toast-text">{message.text}</span>
                </div>
            )}
        </div>
    );
}

export default Profile;