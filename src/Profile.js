import React, { useState, useEffect } from 'react';
import './Profile.css';
import './Wallet.css';
import ReferralSystem from './ReferralSystem';

const API_BASE_URL = 'https://tethrab.shop';

// SVG иконки
const HelpSVG = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM11.25 7.5C11.25 6.94772 11.6977 6.5 12.25 6.5H12.35C12.9023 6.5 13.35 6.94772 13.35 7.5C13.35 8.05228 12.9023 8.5 12.35 8.5H12.25C11.6977 8.5 11.25 8.05228 11.25 7.5ZM10.25 11C10.25 10.4477 10.6977 10 11.25 10H12.25C12.8023 10 13.25 10.4477 13.25 11V15.5C13.25 16.0523 12.8023 16.5 12.25 16.5C11.6977 16.5 11.25 16.0523 11.25 15.5V12H11.25C10.6977 12 10.25 11.5523 10.25 11Z" fill="currentColor"/>
    </svg>
);

function Profile({ navigateTo, telegramUser, showToast }) {
    const [userData, setUserData] = useState(null);
    const [balanceData, setBalanceData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [referralData, setReferralData] = useState(null);
    const [activeTab, setActiveTab] = useState('balance'); // По умолчанию баланс
    const [transactions, setTransactions] = useState([]);
    const [debugInfo, setDebugInfo] = useState(''); // Для отладки

    // Получаем ID пользователя
    const getUserId = () => {
        try {
            if (window.Telegram?.WebApp) {
                const tg = window.Telegram.WebApp;
                const tgUser = tg.initDataUnsafe?.user;
                if (tgUser?.id) {
                    console.log('📱 Telegram ID найден:', tgUser.id);
                    return tgUser.id.toString();
                }
            }

            const savedTelegramUser = localStorage.getItem('telegramUser');
            if (savedTelegramUser) {
                const parsed = JSON.parse(savedTelegramUser);
                console.log('📱 ID из localStorage (telegramUser):', parsed.id);
                return parsed.id?.toString();
            }

            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                const parsed = JSON.parse(savedUser);
                console.log('📱 ID из localStorage (currentUser):', parsed.telegramId || parsed.id);
                return parsed.telegramId?.toString() || parsed.id?.toString();
            }

        } catch (error) {
            console.error('❌ Ошибка получения ID:', error);
        }

        console.log('📱 Возвращаем дефолтный ID: 7879866656');
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
        console.log('🔄 Загрузка баланса для ID:', userId);
        
        try {
            // 1. Загружаем баланс
            const url = `${API_BASE_URL}/api/wallet/balance/${userId}`;
            console.log('🌐 Запрос баланса:', url);
            
            const balanceResponse = await fetch(url);
            console.log('📊 Ответ баланса:', balanceResponse.status, balanceResponse.statusText);
            
            if (balanceResponse.ok) {
                const balanceResult = await balanceResponse.json();
                console.log('📊 Данные баланса:', balanceResult);
                
                if (balanceResult.success) {
                    setBalanceData(balanceResult.data);
                    setDebugInfo(`Баланс загружен: $${balanceResult.data?.total || 0}`);
                } else {
                    console.log('⚠️ Баланс: success=false', balanceResult.error);
                    // Если API возвращает ошибку, используем тестовые данные
                    useTestBalanceData(userId);
                }
            } else {
                console.log('⚠️ Баланс: HTTP ошибка', balanceResponse.status);
                // Если HTTP ошибка, используем тестовые данные
                useTestBalanceData(userId);
            }

            // 2. Загружаем последние транзакции
            try {
                const txUrl = `${API_BASE_URL}/api/wallet/transactions/${userId}?limit=5`;
                console.log('🌐 Запрос транзакций:', txUrl);
                
                const txResponse = await fetch(txUrl);
                if (txResponse.ok) {
                    const txResult = await txResponse.json();
                    console.log('📊 Данные транзакций:', txResult);
                    
                    if (txResult.success) {
                        setTransactions(txResult.data);
                    }
                }
            } catch (txError) {
                console.error('❌ Ошибка загрузки транзакций:', txError);
            }

        } catch (error) {
            console.error('❌ Общая ошибка загрузки баланса:', error);
            setDebugInfo(`Ошибка: ${error.message}`);
            // Используем тестовые данные
            useTestBalanceData(userId);
        }
    };

    // Тестовые данные баланса (на случай если API не работает)
    const useTestBalanceData = (userId) => {
        console.log('🎮 Используем тестовые данные для ID:', userId);
        
        // Тестовые данные
        const testBalance = {
            available: 150.50,
            escrow: 45.25,
            total: 195.75,
            currency: "USD",
            totalDeposited: 300.00,
            totalWithdrawn: 104.25
        };
        
        setBalanceData(testBalance);
        setDebugInfo(`Тестовый баланс: $${testBalance.total}`);
        
        // Тестовые транзакции
        const testTransactions = [
            {
                _id: "1",
                type: "deposit",
                amount: 100,
                status: "completed",
                description: "Пополнение через карту",
                createdAt: new Date(Date.now() - 86400000 * 2),
                metadata: { method: "card" }
            },
            {
                _id: "2",
                type: "referral_bonus",
                amount: 25.50,
                status: "completed",
                description: "Бонус за реферала @user123",
                createdAt: new Date(Date.now() - 86400000),
                metadata: { referralId: "ref_123" }
            },
            {
                _id: "3",
                type: "withdrawal",
                amount: 50,
                status: "completed",
                description: "Вывод на карту",
                createdAt: new Date(Date.now() - 43200000),
                metadata: { method: "card" }
            },
            {
                _id: "4",
                type: "commission",
                amount: 5.25,
                status: "completed",
                description: "Комиссия по сделке",
                createdAt: new Date(Date.now() - 21600000),
                metadata: { dealId: "deal_456" }
            },
            {
                _id: "5",
                type: "deposit",
                amount: 75,
                status: "pending",
                description: "Пополнение через крипто",
                createdAt: new Date(),
                metadata: { method: "crypto" }
            }
        ];
        
        setTransactions(testTransactions);
    };

    // Загрузка всех данных пользователя
    const loadUserData = async (showLoading = true) => {
        const userId = getUserId();
        console.log('🚀 Начало загрузки данных для ID:', userId);
        
        try {
            if (showLoading) setIsLoading(true);
            
            // 1. Загружаем данные профиля
            if (telegramUser && !userData) {
                setUserData({
                    id: telegramUser.id,
                    username: telegramUser.username || `user_${telegramUser.id}`,
                    firstName: telegramUser.firstName || 'Пользователь',
                    photoUrl: telegramUser.photoUrl
                });
                console.log('👤 Данные профиля из telegramUser:', telegramUser);
            }

            // 2. Загружаем баланс и транзакции
            await loadBalanceData();

            // 3. Загружаем реферальные данные
            try {
                const referralUrl = `${API_BASE_URL}/api/referrals/info/${userId}`;
                console.log('🌐 Запрос рефералов:', referralUrl);
                
                const referralResponse = await fetch(referralUrl);
                if (referralResponse.ok) {
                    const referralResult = await referralResponse.json();
                    console.log('📊 Данные рефералов:', referralResult);
                    
                    if (referralResult.success) {
                        setReferralData(referralResult.data);
                    } else {
                        console.log('⚠️ Рефералы: success=false');
                        setReferralData(getDefaultReferralData(userId));
                    }
                } else {
                    console.log('⚠️ Рефералы: HTTP ошибка', referralResponse.status);
                    setReferralData(getDefaultReferralData(userId));
                }
            } catch (referralError) {
                console.error('❌ Ошибка загрузки реферальных данных:', referralError);
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
            if (showLoading) {
                setIsLoading(false);
                console.log('✅ Загрузка завершена');
            }
            setIsRefreshing(false);
        }
    };

    // Обновление баланса
    const refreshBalance = async () => {
        console.log('🔄 Ручное обновление баланса');
        setIsRefreshing(true);
        await loadBalanceData();
        setTimeout(() => {
            setIsRefreshing(false);
            console.log('✅ Обновление завершено');
        }, 500);
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

    // Дебаг кнопка для тестирования
    const debugButton = process.env.NODE_ENV === 'development' && (
        <button
            onClick={() => {
                const userId = getUserId();
                console.log('🔍 Дебаг информация:', {
                    userId,
                    balanceData,
                    transactions,
                    userData,
                    referralData
                });
                showMessage('info', `ID: ${userId}, Баланс: $${balanceData?.total || 0}`);
            }}
            style={{
                position: 'fixed',
                bottom: '80px',
                right: '16px',
                background: '#ff3b30',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '12px',
                zIndex: 1000
            }}
        >
            🐛
        </button>
    );

    if (isLoading) {
        return (
            <div className="profile-container">
                <div className="profile-loading">
                    <div className="loading-spinner"></div>
                    <p>Загрузка профиля...</p>
                    <p style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>
                        {debugInfo}
                    </p>
                </div>
                {debugButton}
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

            {/* Информация профиля (всегда отображается) */}
            <div className="profile-card">
                <div className="profile-avatar">
                    {userData?.photoUrl ? (
                        <img 
                            src={userData.photoUrl} 
                            alt={userData.firstName}
                            className="avatar-image"
                            onError={(e) => {
                                console.log('❌ Ошибка загрузки аватара:', userData.photoUrl);
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<div class="avatar-placeholder">' + (userData?.firstName?.[0]?.toUpperCase() || 'U') + '</div>';
                            }}
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

            {/* Баланс пользователя (всегда отображается) */}
            {balanceData ? (
                <div className="balance-card">
                    <div className="balance-header">
                        <h3 className="balance-title">
                            <span>💰 Баланс</span>
                            {debugInfo && (
                                <span style={{
                                    fontSize: '10px',
                                    opacity: 0.7,
                                    marginLeft: '8px',
                                    fontWeight: 'normal'
                                }}>
                                    ({debugInfo.includes('Тестовый') ? 'тест' : 'реальный'})
                                </span>
                            )}
                        </h3>
                        <button 
                            className={`refresh-balance-btn ${isRefreshing ? 'loading' : ''}`}
                            onClick={refreshBalance}
                            title="Обновить баланс"
                            disabled={isRefreshing}
                        >
                            {isRefreshing ? '⏳' : '🔄'}
                        </button>
                    </div>
                    
                    <div className="balance-amount">
                        <span className="balance-total">
                            {formatUSD(balanceData.total)}
                        </span>
                        <span className="balance-currency">USD</span>
                    </div>
                    
                    <div className="balance-details">
                        <div className="balance-item">
                            <span className="balance-label">Доступно:</span>
                            <span className="balance-value available">
                                {formatUSD(balanceData.available)}
                            </span>
                        </div>
                        <div className="balance-item">
                            <span className="balance-label">В эскроу:</span>
                            <span className="balance-value escrow">
                                {formatUSD(balanceData.escrow)}
                            </span>
                        </div>
                        <div className="balance-item">
                            <span className="balance-label">Всего пополнено:</span>
                            <span className="balance-value deposited">
                                {formatUSD(balanceData.totalDeposited)}
                            </span>
                        </div>
                        <div className="balance-item">
                            <span className="balance-label">Выведено:</span>
                            <span className="balance-value withdrawn">
                                {formatUSD(balanceData.totalWithdrawn)}
                            </span>
                        </div>
                    </div>
                    
                    <div className="balance-actions">
                        <button 
                            className="balance-action-btn deposit"
                            onClick={() => {
                                console.log('📥 Кнопка пополнения нажата');
                                navigateTo('deposit');
                            }}
                        >
                            📥 Пополнить
                        </button>
                        <button 
                            className="balance-action-btn withdraw"
                            onClick={() => {
                                console.log('📤 Кнопка вывода нажата');
                                navigateTo('withdraw');
                            }}
                            disabled={balanceData.available < 10}
                            title={balanceData.available < 10 ? "Минимум $10 для вывода" : ""}
                        >
                            📤 Вывести
                            {balanceData.available < 10 && (
                                <span className="min-amount-badge">$10</span>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="balance-card" style={{ background: 'linear-gradient(135deg, #999 0%, #666 100%)' }}>
                    <div className="balance-header">
                        <h3 className="balance-title">
                            <span>💰 Баланс</span>
                            <span style={{ fontSize: '12px', opacity: 0.7, marginLeft: '8px' }}>
                                (загрузка...)
                            </span>
                        </h3>
                    </div>
                    
                    <div className="balance-amount">
                        <span className="balance-total" style={{ opacity: 0.5 }}>
                            $0.00
                        </span>
                        <span className="balance-currency" style={{ opacity: 0.5 }}>
                            USD
                        </span>
                    </div>
                    
                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <button 
                            onClick={refreshBalance}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                color: 'white',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            🔄 Обновить баланс
                        </button>
                    </div>
                </div>
            )}

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
                    /* История транзакций */
                    <div className="transactions-history">
                        <div className="history-header">
                            <h3>
                                <span>📋 История операций</span>
                            </h3>
                            <button 
                                className="view-all-btn"
                                onClick={() => {
                                    console.log('📋 Просмотр всех операций');
                                    navigateTo('transactions');
                                }}
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
                                    onClick={() => {
                                        console.log('📥 Кнопка первого депозита нажата');
                                        navigateTo('deposit');
                                    }}
                                >
                                    📥 Сделать первый депозит
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

            {/* Дебаг кнопка */}
            {debugButton}
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