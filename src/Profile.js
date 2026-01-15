// Profile.js - Полностью переработан в стиле Telegram WebApp
import React, { useState, useEffect } from 'react';
import './Profile.css';
import ReferralSystem from './ReferralSystem';
import USDTWallet from './USDTWallet';

const API_BASE_URL = 'https://tethrab.shop';

// Telegram-style иконки
const HelpSVG = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
    </svg>
);

const BackSVG = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/>
    </svg>
);

const USDTSVG = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.5 17.1C14.47 17.1 16.9 14.67 16.9 11.7C16.9 8.73 14.47 6.3 11.5 6.3C8.53 6.3 6.1 8.73 6.1 11.7C6.1 14.67 8.53 17.1 11.5 17.1ZM11.5 7.5C13.71 7.5 15.5 9.29 15.5 11.5C15.5 13.71 13.71 15.5 11.5 15.5C9.29 15.5 7.5 13.71 7.5 11.5C7.5 9.29 9.29 7.5 11.5 7.5ZM19 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4H19ZM20 18H4V6H20V18Z" fill="currentColor"/>
        <path d="M13.25 10.5H12.75V9H10.25V10.5H9.75V12H10.25V13.5H9.75V15H12.25V13.5H12.75V12H13.25V10.5ZM11 12H10.5V13.5H11V12ZM12.5 12H12V13.5H12.5V12Z" fill="currentColor"/>
    </svg>
);

const ReferralSVG = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" fill="currentColor"/>
    </svg>
);

const CopySVG = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
    </svg>
);

function Profile({ navigateTo, telegramUser, showToast }) {
    const [userData, setUserData] = useState(null);
    const [usdtBalanceData, setUsdtBalanceData] = useState(null);
    const [referralData, setReferralData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('usdt'); // Только USDT и рефералы
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Получаем ID пользователя
    const getUserId = () => {
        try {
            // Пробуем получить из Telegram WebApp
            if (window.Telegram?.WebApp) {
                const tg = window.Telegram.WebApp;
                const tgUser = tg.initDataUnsafe?.user;
                if (tgUser?.id) {
                    console.log('📱 Telegram ID найден:', tgUser.id);
                    localStorage.setItem('telegramUserId', tgUser.id.toString());
                    return tgUser.id.toString();
                }
            }

            // Пробуем получить из localStorage
            const savedId = localStorage.getItem('telegramUserId');
            if (savedId) {
                console.log('📱 ID из localStorage:', savedId);
                return savedId;
            }

            // Тестовый пользователь для разработки
            console.log('📱 Используем тестовый ID');
            return '7879866656';

        } catch (error) {
            console.error('❌ Ошибка получения ID:', error);
            return '7879866656';
        }
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
    const loadUSDTBalanceData = async () => {
        const userId = getUserId();
        console.log('🔄 Загрузка USDT баланса для ID:', userId);
        
        try {
            setIsRefreshing(true);
            const response = await fetch(`${API_BASE_URL}/api/wallet/usdt/balance/${userId}`, {
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setUsdtBalanceData(result.data);
                    console.log('✅ Баланс USDT загружен:', result.data);
                } else {
                    showMessage('error', 'Ошибка загрузки баланса USDT');
                }
            } else {
                showMessage('error', 'Сервер не отвечает');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки баланса USDT:', error);
            showMessage('error', 'Ошибка соединения');
        } finally {
            setIsRefreshing(false);
        }
    };

    // Загрузка реферальных данных
    const loadReferralData = async () => {
        const userId = getUserId();
        console.log('🔄 Загрузка реферальных данных для ID:', userId);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/referrals/info/${userId}`, {
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setReferralData(result.data);
                    console.log('✅ Реферальные данные загружены:', result.data);
                } else {
                    setReferralData(getDefaultReferralData(userId));
                }
            } else {
                setReferralData(getDefaultReferralData(userId));
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки реферальных данных:', error);
            setReferralData(getDefaultReferralData(userId));
        }
    };

    // Загрузка данных пользователя
    const loadUserData = async () => {
        const userId = getUserId();
        console.log('🚀 Загрузка данных пользователя:', userId);
        
        try {
            setIsLoading(true);
            
            // Устанавливаем данные пользователя
            setUserData({
                id: userId,
                username: telegramUser?.username || `user_${userId}`,
                firstName: telegramUser?.firstName || telegramUser?.first_name || 'Пользователь',
                photoUrl: telegramUser?.photoUrl
            });

            // Загружаем баланс USDT и реферальные данные параллельно
            await Promise.all([
                loadUSDTBalanceData(),
                loadReferralData()
            ]);

        } catch (error) {
            console.error('❌ Общая ошибка загрузки:', error);
            showMessage('error', 'Ошибка загрузки данных');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    // Дефолтные реферальные данные
    const getDefaultReferralData = (userId) => {
        return {
            referralLink: `https://t.me/TetherRabbitBot?start=ref_${userId}`,
            stats: {
                totalReferrals: 0,
                totalEarnings: 0,
                level1: 0,
                level2: 0,
                level3: 0
            },
            commissionRates: {
                level1: 0.3,
                level2: 0.15,
                level3: 0.05
            },
            hasReferrer: false,
            withdrawals: []
        };
    };

    // Обновление данных
    const refreshData = () => {
        console.log('🔄 Обновление данных');
        if (activeTab === 'usdt') {
            loadUSDTBalanceData();
        } else if (activeTab === 'referrals') {
            loadReferralData();
        }
        showMessage('info', 'Данные обновлены');
    };

    // Форматирование USDT
    const formatUSDT = (num) => {
        const value = parseFloat(num || 0);
        return `${value.toFixed(2)} USDT`;
    };

    // Форматирование USD
    const formatUSD = (num) => {
        const value = parseFloat(num || 0);
        return `$${value.toFixed(2)}`;
    };

    // Загрузка при монтировании
    useEffect(() => {
        loadUserData();
        
        // Авто-обновление каждые 30 секунд
        const interval = setInterval(() => {
            if (activeTab === 'usdt') {
                loadUSDTBalanceData();
            }
        }, 30000);
        
        return () => clearInterval(interval);
    }, [activeTab]);

    // Обработчик кнопки "Назад"
    const handleBack = () => {
        navigateTo('home');
    };

    if (isLoading) {
        return (
            <div className="profile-container">
                <div className="profile-loading">
                    <div className="loading-spinner"></div>
                    <p>Загрузка профиля...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            {/* Telegram-style Header */}
            <div className="profile-header">
                <button 
                    className="back-button"
                    onClick={handleBack}
                    aria-label="Назад"
                >
                    <BackSVG />
                </button>
                
                <h1 className="profile-header-title">Профиль</h1>
                
                <button
                    className="help-button"
                    onClick={() => navigateTo('help')}
                    aria-label="Помощь"
                >
                    <HelpSVG />
                </button>
            </div>

            {/* Информация пользователя */}
            <div className="profile-info-section">
                <div className="profile-avatar-container">
                    {userData?.photoUrl ? (
                        <img 
                            src={userData.photoUrl} 
                            alt={userData.firstName}
                            className="profile-avatar"
                        />
                    ) : (
                        <div className="profile-avatar-placeholder">
                            {userData?.firstName?.[0]?.toUpperCase() || 'U'}
                        </div>
                    )}
                </div>
                
                <div className="profile-info-content">
                    <h2 className="profile-name">{userData?.firstName || 'Пользователь'}</h2>
                    <p className="profile-username">@{userData?.username || 'user'}</p>
                    
                    <div className="profile-id-container">
                        <span className="profile-id-label">ID:</span>
                        <button 
                            className="profile-id-button"
                            onClick={() => copyToClipboard(userData?.id, 'ID')}
                        >
                            <span className="profile-id-value">{userData?.id || '—'}</span>
                            <CopySVG />
                        </button>
                    </div>
                </div>
            </div>

            {/* Вкладки (Только USDT и Рефералы) */}
            <div className="profile-tabs-container">
                <div className="profile-tabs">
                    <button 
                        className={`profile-tab ${activeTab === 'usdt' ? 'active' : ''}`}
                        onClick={() => setActiveTab('usdt')}
                    >
                        <div className="tab-icon">
                            <USDTSVG />
                        </div>
                        <span className="tab-text">USDT Кошелек</span>
                        {usdtBalanceData?.available > 0 && (
                            <span className="tab-badge">
                                {formatUSDT(usdtBalanceData.available)}
                            </span>
                        )}
                    </button>
                    
                    <button 
                        className={`profile-tab ${activeTab === 'referrals' ? 'active' : ''}`}
                        onClick={() => setActiveTab('referrals')}
                    >
                        <div className="tab-icon">
                            <ReferralSVG />
                        </div>
                        <span className="tab-text">Рефералы</span>
                        {referralData?.stats?.totalEarnings > 0 && (
                            <span className="tab-badge">
                                {formatUSD(referralData.stats.totalEarnings)}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Контент вкладок */}
            <div className="profile-content">
                {/* Вкладка USDT */}
                {activeTab === 'usdt' && (
                    <div className="tab-content">
                        <USDTWallet 
                            telegramId={getUserId()}
                            showToast={showToast || showMessage}
                            onRefresh={refreshData}
                            isRefreshing={isRefreshing}
                        />
                    </div>
                )}

                {/* Вкладка Рефералы */}
                {activeTab === 'referrals' && (
                    <div className="tab-content">
                        {referralData ? (
                            <ReferralSystem 
                                referralData={referralData}
                                onClose={() => setActiveTab('usdt')}
                                showMessage={showMessage}
                            />
                        ) : (
                            <div className="no-data-message">
                                <p>Реферальные данные не загружены</p>
                                <button 
                                    className="retry-button"
                                    onClick={loadReferralData}
                                >
                                    Повторить загрузку
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Toast сообщение */}
            {(!showToast && message.text) && (
                <div className={`message-toast message-${message.type}`}>
                    <div className="toast-content">
                        <span className="toast-icon">
                            {message.type === 'success' ? '✅' :
                             message.type === 'error' ? '❌' : 'ℹ️'}
                        </span>
                        <span className="toast-text">{message.text}</span>
                    </div>
                </div>
            )}

            {/* Кнопка обновления */}
            <button 
                className={`refresh-button ${isRefreshing ? 'refreshing' : ''}`}
                onClick={refreshData}
                disabled={isRefreshing}
                aria-label="Обновить"
            >
                {isRefreshing ? '🔄' : '↻'}
            </button>
        </div>
    );
}

export default Profile;