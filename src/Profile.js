import React, { useState, useEffect } from 'react';
import './Profile.css';
import ReferralSystem from './ReferralSystem';

const API_BASE_URL = 'https://tethrab.shop';

// SVG иконки Telegram
const HelpSVG = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM11.25 7.5C11.25 6.94772 11.6977 6.5 12.25 6.5H12.35C12.9023 6.5 13.35 6.94772 13.35 7.5C13.35 8.05228 12.9023 8.5 12.35 8.5H12.25C11.6977 8.5 11.25 8.05228 11.25 7.5ZM10.25 11C10.25 10.4477 10.6977 10 11.25 10H12.25C12.8023 10 13.25 10.4477 13.25 11V15.5C13.25 16.0523 12.8023 16.5 12.25 16.5C11.6977 16.5 11.25 16.0523 11.25 15.5V12H11.25C10.6977 12 10.25 11.5523 10.25 11Z" fill="currentColor"/>
    </svg>
);

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

function Profile({ navigateTo, telegramUser, showToast }) {
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [referralData, setReferralData] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');

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

    // Переключение темы
    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Показываем сообщение
        if (showToast) {
            showToast(`Тема изменена на ${newTheme === 'dark' ? 'тёмную' : 'светлую'}`, 'success');
        } else {
            showMessage('success', `Тема изменена на ${newTheme === 'dark' ? 'тёмную' : 'светлую'}`);
        }
    };

    // Загрузка данных пользователя
    const loadUserData = async () => {
        try {
            const userId = getUserId();
            
            // Загружаем данные пользователя
            const userResponse = await fetch(`${API_BASE_URL}/api/user?userId=${userId}`);
            if (userResponse.ok) {
                const userResult = await userResponse.json();
                if (userResult.success) {
                    setUserData(userResult.user);
                }
            }

            // Загружаем реферальные данные
            try {
                const referralResponse = await fetch(`${API_BASE_URL}/api/referrals/info/${userId}`);
                if (referralResponse.ok) {
                    const referralResult = await referralResponse.json();
                    if (referralResult.success) {
                        setReferralData(referralResult.data);
                    } else {
                        setReferralData(getDefaultReferralData(userId));
                    }
                } else {
                    setReferralData(getDefaultReferralData(userId));
                }
            } catch (referralError) {
                console.error('Ошибка загрузки реферальных данных:', referralError);
                setReferralData(getDefaultReferralData(userId));
            }

        } catch (error) {
            console.error('❌ Общая ошибка загрузки:', error);
            const userId = getUserId();
            setUserData({
                id: userId,
                username: `user_${userId}`,
                firstName: 'Пользователь'
            });
            setReferralData(getDefaultReferralData(userId));
        }
    };

    // Данные по умолчанию для рефералов
    const getDefaultReferralData = (userId) => {
        return {
            referral_link: `https://t.me/TetherRabbitBot?start=ref_${userId}`,
            stats: {
                total_referrals: 0,
                active_referrals: 0,
                total_earnings: 0,
                available_earnings: 0,
                withdrawn_earnings: 0,
                commission_rate: 1
            },
            referrals: [],
            earnings: [],
            withdrawals: null,
            can_withdraw: false,
            min_withdrawal: 10,
            next_withdrawal: 'Доступно в любое время'
        };
    };

    // Эффект загрузки данных
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await loadUserData();
            setIsLoading(false);
        };

        loadData();
        
        // Обновляем каждые 30 секунд
        const interval = setInterval(loadUserData, 30000);
        return () => clearInterval(interval);
    }, []);

    // Форматирование USD
    const formatUSD = (num) => {
        const value = parseFloat(num || 0);
        return `$${value.toFixed(2)}`;
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
            <div className="profile-header">
                <div className="header-content">
                    <div className="header-left">
                        <h1 className="telegram-header-title">Профиль</h1>
                    </div>
                    <button
                        className="telegram-header-button"
                        onClick={() => navigateTo('help')}
                        title="Помощь"
                        aria-label="Помощь"
                    >
                        <HelpSVG />
                    </button>
                </div>
            </div>

            {/* Информация профиля */}
            <div className="profile-card telegram-card">
                <div className="profile-avatar">
                    <div className="avatar-placeholder telegram-gradient">
                        {userData?.firstName?.[0]?.toUpperCase() || 'U'}
                    </div>
                </div>

                <div className="profile-info">
                    <h2 className="profile-name telegram-text">{userData?.firstName || 'Пользователь'}</h2>
                    <p className="profile-username telegram-hint">@{userData?.username || 'user'}</p>
                    
                    <div className="profile-id">
                        <button 
                            className="id-button telegram-button-secondary"
                            onClick={() => copyToClipboard(userData?.id, 'ID')}
                            aria-label="Копировать ID"
                        >
                            ID: {userData?.id || '—'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Вкладки */}
            <div className="profile-tabs telegram-tabs">
                <button 
                    className={`profile-tab telegram-tab ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                    aria-label="Профиль"
                >
                    <span className="profile-tab-icon telegram-tab-icon">👤</span>
                    <span className="profile-tab-text telegram-tab-text">Профиль</span>
                </button>
                
                <button 
                    className={`profile-tab telegram-tab ${activeTab === 'referrals' ? 'active' : ''}`}
                    onClick={() => setActiveTab('referrals')}
                    aria-label="Рефералы"
                >
                    <span className="profile-tab-icon telegram-tab-icon">💰</span>
                    <span className="profile-tab-text telegram-tab-text">Рефералы</span>
                    {referralData?.stats.total_earnings > 0 && (
                        <span className="profile-tab-badge telegram-badge">
                            {formatUSD(referralData.stats.available_earnings)}
                        </span>
                    )}
                </button>
            </div>

            {/* Контент вкладок */}
            <div className="profile-content telegram-content">
                {activeTab === 'profile' ? (
                    <>
                        {/* Краткая реферальная информация */}
                        {referralData && (
                            <div className="referral-quick telegram-card">
                                <div className="referral-quick-header">
                                    <div className="referral-quick-icon telegram-gradient-icon">💰</div>
                                    <div className="referral-quick-info">
                                        <h3 className="telegram-text">Реферальная система</h3>
                                        <p className="telegram-hint">1% комиссия с каждой сделки реферала</p>
                                    </div>
                                </div>
                                
                                <div className="referral-quick-stats telegram-stats">
                                    <div className="referral-quick-stat telegram-stat">
                                        <div className="stat-value telegram-accent">{referralData.stats.total_referrals}</div>
                                        <div className="stat-label telegram-hint">Рефералов</div>
                                    </div>
                                    <div className="referral-quick-stat telegram-stat">
                                        <div className="stat-value telegram-accent">{formatUSD(referralData.stats.total_earnings)}</div>
                                        <div className="stat-label telegram-hint">Заработано</div>
                                    </div>
                                    <div className="referral-quick-stat telegram-stat">
                                        <div className="stat-value telegram-accent">{formatUSD(referralData.stats.available_earnings)}</div>
                                        <div className="stat-label telegram-hint">Доступно</div>
                                    </div>
                                </div>
                                
                                <button
                                    className="show-referrals-button telegram-button"
                                    onClick={() => setActiveTab('referrals')}
                                    aria-label="Перейти к рефералам"
                                >
                                    Перейти к рефералам
                                </button>
                            </div>
                        )}

                        {/* Настройки */}
                        
                    </>
                ) : (
                    /* Полная реферальная система */
                    <ReferralSystem 
                        onClose={() => setActiveTab('profile')}
                        showMessage={showMessage}
                    />
                )}
            </div>

            {/* Toast сообщения */}
            {(!showToast && message.text) && (
                <div className={`telegram-toast message-${message.type}`}>
                    <span className="telegram-toast-icon">
                        {message.type === 'success' ? '✅' :
                         message.type === 'error' ? '❌' : 'ℹ️'}
                    </span>
                    <span className="telegram-toast-text">{message.text}</span>
                </div>
            )}
        </div>
    );
}

export default Profile;