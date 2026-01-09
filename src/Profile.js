import React, { useState, useEffect } from 'react';
import './Profile.css';
import ReferralSystem from './ReferralSystem';

const API_BASE_URL = 'https://tethrab.shop';

// SVG иконки
const HelpSVG = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM11.25 7.5C11.25 6.94772 11.6977 6.5 12.25 6.5H12.35C12.9023 6.5 13.35 6.94772 13.35 7.5C13.35 8.05228 12.9023 8.5 12.35 8.5H12.25C11.6977 8.5 11.25 8.05228 11.25 7.5ZM10.25 11C10.25 10.4477 10.6977 10 11.25 10H12.25C12.8023 10 13.25 10.4477 13.25 11V15.5C13.25 16.0523 12.8023 16.5 12.25 16.5C11.6977 16.5 11.25 16.0523 11.25 15.5V12H11.25C10.6977 12 10.25 11.5523 10.25 11Z" fill="currentColor"/>
    </svg>
);

const HistorySVG = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.99 2C6.47 2 2 6.48 2 12C2 17.52 6.47 22 11.99 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 11.99 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20ZM12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z" fill="currentColor"/>
    </svg>
);

const ReferralSVG = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" fill="currentColor"/>
    </svg>
);

function Profile({ navigateTo, telegramUser, showToast }) {
    const [userData, setUserData] = useState(null);
    const [balanceData, setBalanceData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [referralData, setReferralData] = useState(null);
    const [activeTab, setActiveTab] = useState('balance');
    const [transactions, setTransactions] = useState([]);

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

    // Загрузка данных баланса
    const loadBalanceData = async () => {
        const userId = getUserId();
        
        try {
            // Загружаем баланс
            const balanceResponse = await fetch(`${API_BASE_URL}/api/wallet/balance/${userId}`);
            if (balanceResponse.ok) {
                const balanceResult = await balanceResponse.json();
                if (balanceResult.success) {
                    setBalanceData(balanceResult.data);
                } else {
                    // Тестовые данные
                    setBalanceData({
                        available: 150.50,
                        escrow: 45.25,
                        total: 195.75,
                        currency: "USD",
                        totalDeposited: 300.00,
                        totalWithdrawn: 104.25
                    });
                }
            } else {
                // Тестовые данные
                setBalanceData({
                    available: 150.50,
                    escrow: 45.25,
                    total: 195.75,
                    currency: "USD",
                    totalDeposited: 300.00,
                    totalWithdrawn: 104.25
                });
            }

            // Загружаем последние транзакции
            const txResponse = await fetch(`${API_BASE_URL}/api/wallet/transactions/${userId}?limit=5`);
            if (txResponse.ok) {
                const txResult = await txResponse.json();
                if (txResult.success) {
                    setTransactions(txResult.data);
                }
            }

        } catch (error) {
            console.error('❌ Ошибка загрузки баланса:', error);
            // Тестовые данные при ошибке
            setBalanceData({
                available: 150.50,
                escrow: 45.25,
                total: 195.75,
                currency: "USD",
                totalDeposited: 300.00,
                totalWithdrawn: 104.25
            });
        }
    };

    // Загрузка всех данных пользователя
    const loadUserData = async () => {
        const userId = getUserId();
        
        try {
            setIsLoading(true);
            
            // 1. Загружаем данные профиля
            if (telegramUser && !userData) {
                setUserData({
                    id: telegramUser.id,
                    username: telegramUser.username || `user_${telegramUser.id}`,
                    firstName: telegramUser.firstName || 'Пользователь',
                    photoUrl: telegramUser.photoUrl
                });
            }

            // 2. Загружаем баланс и транзакции
            await loadBalanceData();

            // 3. Загружаем реферальные данные
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
            
            setReferralData(getDefaultReferralData(userId));
        } finally {
            setIsLoading(false);
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

    // Форматирование USD
    const formatUSD = (num) => {
        const value = parseFloat(num || 0);
        return `$${value.toFixed(2)}`;
    };

    // Эффект загрузки данных
    useEffect(() => {
        loadUserData();
        
        // Обновляем каждые 30 секунд
        const interval = setInterval(loadUserData, 30000);
        return () => clearInterval(interval);
    }, []);

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
            {/* Хедер - цвет фона Telegram WebApp */}
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

            {/* Информация профиля - оставляем как было */}
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

            {/* Вкладки - только 2 */}
            <div className="profile-tabs">
                <button 
                    className={`profile-tab ${activeTab === 'balance' ? 'active' : ''}`}
                    onClick={() => setActiveTab('balance')}
                    aria-label="Баланс"
                >
                    <span className="profile-tab-icon">💰</span>
                    <span className="profile-tab-text">Баланс</span>
                </button>
                
                <button 
                    className={`profile-tab ${activeTab === 'referrals' ? 'active' : ''}`}
                    onClick={() => setActiveTab('referrals')}
                    aria-label="Рефералы"
                >
                    <span className="profile-tab-icon">👥</span>
                    <span className="profile-tab-text">Рефералы</span>
                    {referralData?.stats.available_earnings > 0 && (
                        <span className="profile-tab-badge">
                            {formatUSD(referralData.stats.available_earnings)}
                        </span>
                    )}
                </button>
            </div>

            {/* Контент вкладок */}
            <div className="profile-content">
                {activeTab === 'balance' ? (
                    <div className="balance-tab">
                        {/* Карточка с балансом */}
                        <div className="balance-card">
                            <div className="balance-main">
                                <div className="balance-label">Ваш баланс</div>
                                <div className="balance-amount">
                                    {formatUSD(balanceData?.total || 0)}
                                </div>
                                <div className="balance-hint">USD</div>
                            </div>
                            
                            <div className="balance-actions">
                                <button 
                                    className="deposit-button"
                                    onClick={() => navigateTo('deposit')}
                                    style={{
                                        backgroundColor: 'var(--tg-theme-button-color, #3390ec)',
                                        color: 'var(--tg-theme-button-text-color, #ffffff)'
                                    }}
                                >
                                    Пополнить
                                </button>
                                <button 
                                    className="withdraw-button"
                                    onClick={() => navigateTo('withdraw')}
                                    disabled={balanceData?.available < 10}
                                    title={balanceData?.available < 10 ? "Минимум $10 для вывода" : ""}
                                >
                                    Вывести
                                </button>
                            </div>
                        </div>

                        {/* Блок с историей */}
                        <div className="history-section">
                            <div className="history-header">
                                <h3>
                                    <HistorySVG />
                                    <span>История операций</span>
                                </h3>
                                <button 
                                    className="view-all-button"
                                    onClick={() => navigateTo('transactions')}
                                >
                                    Все операции →
                                </button>
                            </div>
                            
                            {transactions.length === 0 ? (
                                <div className="no-transactions">
                                    <div className="no-transactions-icon">📭</div>
                                    <p>Нет операций</p>
                                    <button 
                                        className="make-first-deposit"
                                        onClick={() => navigateTo('deposit')}
                                        style={{
                                            backgroundColor: 'var(--tg-theme-button-color, #3390ec)',
                                            color: 'var(--tg-theme-button-text-color, #ffffff)'
                                        }}
                                    >
                                        Сделать первый депозит
                                    </button>
                                </div>
                            ) : (
                                <div className="transactions-list">
                                    {transactions.map((tx) => (
                                        <div key={tx._id} className="transaction-item">
                                            <div className="transaction-icon">
                                                {getTransactionIcon(tx.type)}
                                            </div>
                                            
                                            <div className="transaction-details">
                                                <div className="transaction-info">
                                                    <span className="transaction-type">
                                                        {getTransactionTypeLabel(tx.type)}
                                                    </span>
                                                    <span className="transaction-date">
                                                        {new Date(tx.createdAt).toLocaleDateString('ru-RU')}
                                                    </span>
                                                </div>
                                                <div className="transaction-description">
                                                    {tx.description || getDefaultDescription(tx.type)}
                                                </div>
                                            </div>
                                            
                                            <div className={`transaction-amount ${getAmountClass(tx.type)}`}>
                                                {getAmountPrefix(tx.type)}{formatUSD(tx.amount)}
                                            </div>
                                            
                                            <div className={`transaction-status ${tx.status}`}>
                                                {getStatusLabel(tx.status)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Реферальная система */
                    <ReferralSystem 
                        referralData={referralData}
                        onClose={() => setActiveTab('balance')}
                        showMessage={showMessage}
                    />
                )}
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

// Вспомогательные функции
function getTransactionIcon(type) {
    const icons = {
        deposit: '📥',
        withdrawal: '📤',
        transfer: '🔄',
        escrow_deposit: '🔒',
        escrow_release: '🔓',
        referral_bonus: '👥',
        commission: '💸',
        bonus: '🎁',
        fee: '💳'
    };
    return icons[type] || '💳';
}

function getTransactionTypeLabel(type) {
    const labels = {
        deposit: 'Пополнение',
        withdrawal: 'Вывод',
        transfer: 'Перевод',
        escrow_deposit: 'Депозит в эскроу',
        escrow_release: 'Выплата из эскроу',
        referral_bonus: 'Реферальный бонус',
        commission: 'Комиссия',
        bonus: 'Бонус',
        fee: 'Комиссия платформы'
    };
    return labels[type] || type;
}

function getDefaultDescription(type) {
    const descriptions = {
        deposit: 'Пополнение баланса',
        withdrawal: 'Вывод средств',
        referral_bonus: 'Бонус за реферала',
        commission: 'Комиссия по сделке',
        bonus: 'Бонус от платформы'
    };
    return descriptions[type] || 'Транзакция';
}

function getAmountClass(type) {
    const positiveTypes = ['deposit', 'referral_bonus', 'bonus', 'escrow_release'];
    return positiveTypes.includes(type) ? 'positive' : 'negative';
}

function getAmountPrefix(type) {
    const positiveTypes = ['deposit', 'referral_bonus', 'bonus', 'escrow_release'];
    return positiveTypes.includes(type) ? '+' : '-';
}

function getStatusLabel(status) {
    const labels = {
        pending: '⏳ В обработке',
        completed: '✅ Завершено',
        failed: '❌ Ошибка',
        cancelled: '🚫 Отменено'
    };
    return labels[status] || status;
}

export default Profile;