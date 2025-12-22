import React, { useState, useEffect } from 'react';
import './Profile.css';
import './ReferralSystem.css';

const API_BASE_URL = 'https://tethrab.shop';

// SVG иконки
const HelpSVG = () => (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M0 13C0 5.8203 5.8203 0 13 0C20.1797 0 26 5.8203 26 13C26 20.1797 20.1797 26 13 26C5.8203 26 0 20.1797 0 13ZM8.66667 13C8.66667 14.0833 7.58333 15.1667 6.5 15.1667C5.41667 15.1667 4.33333 14.0833 4.33333 13C4.33333 11.9167 5.41667 10.8333 6.5 10.8333C7.58333 10.8333 8.66667 11.9167 8.66667 13ZM15.1667 13C15.1667 14.0833 14.0833 15.1667 13 15.1667C11.9167 15.1667 10.8333 14.0833 10.8333 13C10.8333 11.9167 11.9167 10.8333 13 10.8333C14.0833 10.8333 15.1667 11.9167 15.1667 13ZM19.5 15.1667C20.5833 15.1667 21.6667 14.0833 21.6667 13C21.6667 11.9167 20.5833 10.8333 19.5 10.8333C18.4167 10.8333 17.3333 11.9167 17.3333 13C17.3333 14.0833 18.4167 15.1667 19.5 15.1667Z" fill="currentColor" fillOpacity="0.6" />
    </svg>
);

const SettingsSVG = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19.4 15C19.2663 15.3031 19.1335 15.6063 19 15.9L21 17.9C21.5 18.2 21.9 18.6 21.9 19.4C21.8 20.2 21.3 20.6 20.7 21L18.7 19C18.4 19.1 18.1 19.2 17.8 19.3C17.5 19.4 17.2 19.5 16.9 19.6L16.5 22H15.5L15.1 19.6C14.8 19.5 14.5 19.4 14.2 19.3C13.9 19.2 13.6 19.1 13.3 19L11.3 21C10.7 20.6 10.2 20.2 10.1 19.4C10 18.6 10.4 18.2 10.9 17.9L12.9 15.9C12.8 15.6 12.7 15.3 12.6 15H12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const MoonSVG = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 12.79C20.8427 14.4922 20.2039 16.1144 19.1582 17.4668C18.1125 18.8192 16.7035 19.8458 15.0957 20.4265C13.4879 21.0073 11.748 21.1181 10.0795 20.7461C8.41104 20.3741 6.88203 19.5345 5.67418 18.3267C4.46634 17.1188 3.62675 15.5898 3.25475 13.9214C2.88276 12.2529 2.99354 10.513 3.57432 8.90523C4.1551 7.29745 5.18168 5.88842 6.53407 4.84272C7.88647 3.79702 9.50862 3.15824 11.2108 3.00101C10.2134 4.34827 9.73375 6.00945 9.85843 7.68141C9.98312 9.35338 10.7039 10.9251 11.8894 12.1106C13.0749 13.2961 14.6466 14.0169 16.3186 14.1416C17.9906 14.2663 19.6518 13.7866 21 12.7892V12.79Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

function Profile({ navigateTo, telegramUser }) {
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [photoError, setPhotoError] = useState(false);
    const [userOrders, setUserOrders] = useState([]);
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

    // Загрузка данных
    const loadUserData = async () => {
        try {
            const userId = getUserId();
            console.log('👤 Загружаем данные для ID:', userId);

            // Загружаем данные пользователя
            const userResponse = await fetch(`${API_BASE_URL}/api/user?userId=${userId}`);
            if (userResponse.ok) {
                const userResult = await userResponse.json();
                if (userResult.success) {
                    setUserData(userResult.user);
                }
            }

            // Загружаем ордера
            const ordersResponse = await fetch(`${API_BASE_URL}/user-orders/${userId}`);
            if (ordersResponse.ok) {
                const ordersResult = await ordersResponse.json();
                if (ordersResult.success) {
                    setUserOrders(ordersResult.orders || []);
                }
            }

            // Загружаем реферальные данные
            const referralResponse = await fetch(`${API_BASE_URL}/api/referrals/info/${userId}`);
            if (referralResponse.ok) {
                const referralResult = await referralResponse.json();
                if (referralResult.success) {
                    setReferralData(referralResult.data);
                }
            }

        } catch (error) {
            console.error('❌ Ошибка загрузки:', error);
            // Данные по умолчанию
            const userId = getUserId();
            setUserData({
                id: userId,
                username: `user_${userId}`,
                firstName: 'Пользователь'
            });
            setReferralData({
                referral_link: `https://t.me/TetherRabbitBot?start=ref_${userId}`,
                stats: {
                    total_referrals: 0,
                    total_earnings: 0,
                    available_earnings: 0,
                    commission_rate: 1
                }
            });
        }
    };

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

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const copyToClipboard = (text, label) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        showMessage('success', `✅ ${label} скопирован`);
    };

    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        showMessage('success', `Тема изменена на ${newTheme === 'dark' ? 'тёмную' : 'светлую'}`);
    };

    const handlePhotoError = () => {
        setPhotoError(true);
    };

    // Компонент реферальной системы
    const ReferralSystem = ({ referralData, showMessage, userId, onRefresh }) => {
        const [isWithdrawing, setIsWithdrawing] = useState(false);
        const [withdrawAmount, setWithdrawAmount] = useState('');

        const copyReferralLink = () => {
            copyToClipboard(referralData.referral_link, 'Реферальная ссылка');
        };

        const handleWithdraw = async () => {
            if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
                showMessage('error', 'Введите корректную сумму');
                return;
            }

            if (parseFloat(withdrawAmount) < referralData.min_withdrawal) {
                showMessage('error', `Минимальная сумма вывода: ${referralData.min_withdrawal} RUB`);
                return;
            }

            if (parseFloat(withdrawAmount) > referralData.stats.available_earnings) {
                showMessage('error', 'Недостаточно средств для вывода');
                return;
            }

            setIsWithdrawing(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/referrals/withdraw`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: userId,
                        amount: withdrawAmount
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        showMessage('success', 'Запрос на вывод отправлен');
                        setWithdrawAmount('');
                        onRefresh();
                    } else {
                        showMessage('error', result.error || 'Ошибка вывода');
                    }
                }
            } catch (error) {
                showMessage('error', 'Ошибка соединения');
            }
            setIsWithdrawing(false);
        };

        return (
            <div className="referral-telegram-style">
                {/* Заголовок */}
                <div className="referral-header-telegram">
                    <div className="referral-header-icon">💰</div>
                    <div className="referral-header-text">
                        <h2>Реферальная система</h2>
                        <p>Приглашайте друзей и получайте 1% от их сделок</p>
                    </div>
                </div>

                {/* Статистика */}
                <div className="referral-stats-telegram">
                    <div className="stat-card-telegram">
                        <div className="stat-icon-telegram">👥</div>
                        <div className="stat-info-telegram">
                            <div className="stat-value-telegram">{referralData.stats.total_referrals}</div>
                            <div className="stat-label-telegram">Рефералов</div>
                        </div>
                    </div>
                    
                    <div className="stat-card-telegram">
                        <div className="stat-icon-telegram">💵</div>
                        <div className="stat-info-telegram">
                            <div className="stat-value-telegram">{referralData.stats.total_earnings.toFixed(2)} ₽</div>
                            <div className="stat-label-telegram">Всего заработано</div>
                        </div>
                    </div>
                    
                    {/* <div className="stat-card-telegram">
                        <div className="stat-icon-telegram">📈</div>
                        <div className="stat-info-telegram">
                            <div className="stat-value-telegram">{referralData.stats.available_earnings.toFixed(2)} ₽</div>
                            <div className="stat-label-telegram">Доступно</div>
                        </div>
                    </div> */}
                </div>

                {/* Реферальная ссылка */}
                <div className="referral-link-telegram-card">
                    <div className="referral-link-header">
                        <div className="link-icon">🔗</div>
                        <div className="link-info">
                            <h3>Ваша реферальная ссылка</h3>
                            <p>Поделитесь с друзьями</p>
                        </div>
                    </div>
                    
                    <div className="referral-link-container-telegram">
                        <div className="referral-link-text-telegram">
                            {referralData.referral_link}
                        </div>
                        <button 
                            className="copy-btn-telegram"
                            onClick={copyReferralLink}
                        >
                            Копировать
                        </button>
                    </div>
                </div>

                {/* Вывод средств */}
                <div className="withdraw-telegram-card">
                    <div className="withdraw-header">
                        <div className="withdraw-icon">💸</div>
                        <div className="withdraw-info">
                            <h3>Вывод средств</h3>
                            <p>Доступно: {referralData.stats.available_earnings.toFixed(2)} RUB</p>
                        </div>
                    </div>
                    
                    <div className="withdraw-info-text">
                        <p>🚀 Вывод доступен каждое <strong>воскресенье в 12:00 по МСК</strong></p>
                        <p>💰 Минимальная сумма: <strong>{referralData.min_withdrawal} RUB</strong></p>
                        {referralData.next_withdrawal && (
                            <p>📅 Следующий вывод: <strong>{referralData.next_withdrawal}</strong></p>
                        )}
                    </div>
                    
                    <div className="withdraw-form-telegram">
                        <input
                            type="number"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            placeholder={`Сумма (мин. ${referralData.min_withdrawal} RUB)`}
                            className="withdraw-input-telegram"
                            disabled={!referralData.can_withdraw}
                        />
                        <button
                            className="withdraw-btn-telegram"
                            onClick={handleWithdraw}
                            disabled={!referralData.can_withdraw || isWithdrawing}
                        >
                            {isWithdrawing ? 'Отправка...' : 
                             referralData.can_withdraw ? 'Запросить вывод' : 'Вывод временно недоступен'}
                        </button>
                    </div>
                    
                    {referralData.withdrawal && (
                        <div className="withdrawal-status-telegram">
                            <div className="status-label">Текущий запрос:</div>
                            <div className="status-info">
                                <span className={`status-${referralData.withdrawal.status}`}>
                                    {referralData.withdrawal.status === 'pending' ? '⏳ В обработке' :
                                     referralData.withdrawal.status === 'completed' ? '✅ Выплачено' :
                                     '❌ Отклонено'}
                                </span>
                                <span className="status-amount">{referralData.withdrawal.amount} RUB</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Информация */}
                <div className="referral-info-telegram">
                    <div className="info-header">
                        <div className="info-icon">📋</div>
                        <h3>Как работает система</h3>
                    </div>
                    
                    <div className="info-list-telegram">
                        <div className="info-item-telegram">
                            <span className="info-number">1</span>
                            <div className="info-text">
                                <strong>Приглашайте друзей</strong>
                                <p>Поделитесь вашей реферальной ссылкой</p>
                            </div>
                        </div>
                        
                        <div className="info-item-telegram">
                            <span className="info-number">2</span>
                            <div className="info-text">
                                <strong>Ваш друг совершает сделку</strong>
                                <p>Любая покупка или продажа USDT</p>
                            </div>
                        </div>
                        
                        <div className="info-item-telegram">
                            <span className="info-number">3</span>
                            <div className="info-text">
                                <strong>Вы получаете 1% комиссии</strong>
                                <p>Автоматическое начисление на ваш баланс</p>
                            </div>
                        </div>
                        
                        <div className="info-item-telegram">
                            <span className="info-number">4</span>
                            <div className="info-text">
                                <strong>Вывод по воскресеньям</strong>
                                <p>Каждое воскресенье в 12:00 по МСК</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="profile-container">
                <div className="profile-loading">
                    <div className="loading-spinner-new"></div>
                    <p>Загрузка профиля...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-container" data-theme={document.documentElement.getAttribute('data-theme')}>
            {/* Хедер */}
            <div className="profile-header-new">
                <div className="header-content">
                    <div className="header-left">
                        <h1>Профиль</h1>
                    </div>
                    <button
                        className="help-button-new"
                        onClick={() => navigateTo('help')}
                        title="Помощь"
                    >
                        <HelpSVG />
                    </button>
                </div>
                
                {/* Карточка профиля */}
                <div className="profile-main-card">
                    <div className="profile-avatar-section">
                        {userData?.photoUrl && !photoError ? (
                            <img
                                src={userData.photoUrl}
                                alt="Avatar"
                                className="profile-avatar-image"
                                onError={handlePhotoError}
                            />
                        ) : (
                            <div className="profile-avatar-fallback">
                                {userData?.firstName?.[0]?.toUpperCase() || '👤'}
                            </div>
                        )}
                    </div>

                    <div className="profile-info-section">
                        <h2>{userData?.firstName || 'Пользователь'}</h2>
                        <p>@{userData?.username || 'user'}</p>
                        <div className="profile-id-section">
                            <span>ID:</span>
                            <button onClick={() => copyToClipboard(userData?.id, 'ID')}>
                                {userData?.id || '—'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Вкладки */}
            <div className="profile-tabs">
                <button 
                    className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                >
                    <span className="tab-icon">👤</span>
                    <span>Профиль</span>
                </button>
                
                <button 
                    className={`profile-tab ${activeTab === 'referrals' ? 'active' : ''}`}
                    onClick={() => setActiveTab('referrals')}
                >
                    <span className="tab-icon">💰</span>
                    <span>Рефералы</span>
                    {referralData?.stats.total_earnings > 0 && (
                        <span className="tab-badge">{referralData.stats.total_earnings.toFixed(0)} ₽</span>
                    )}
                </button>
            </div>

            {/* Контент */}
            <div className="profile-content-container">
                {activeTab === 'profile' ? (
                    <>
                        {/* Реферальная карточка */}
                        {/* {referralData && (
                            <div className="profile-card-new referral-quick">
                                <div className="card-header">
                                    <div className="header-left">
                                        <div className="referral-icon-small">💰</div>
                                        <h3>Реферальная система</h3>
                                    </div>
                                    <div className="commission-badge">1% комиссия</div>
                                </div>
                                
                                <div className="referral-stats-quick">
                                    <div className="stat-quick">
                                        <div className="stat-value-quick">{referralData.stats.total_referrals}</div>
                                        <div className="stat-label-quick">Рефералов</div>
                                    </div>
                                    <div className="stat-quick">
                                        <div className="stat-value-quick">{referralData.stats.total_earnings.toFixed(2)} ₽</div>
                                        <div className="stat-label-quick">Заработано</div>
                                    </div>
                                </div>
                                
                                <button
                                    className="show-referrals-btn"
                                    onClick={() => setActiveTab('referrals')}
                                >
                                    Перейти к рефералам
                                </button>
                            </div>
                        )} */}

                        {/* Настройки */}
                        <div className="profile-card-new">
                            <div className="settings-header">
                                <SettingsSVG />
                                <h3>Настройки</h3>
                            </div>
                            <div className="settings-list">
                                <button
                                    className="settings-item"
                                    onClick={toggleTheme}
                                >
                                    <div className="settings-icon">
                                        <MoonSVG />
                                    </div>
                                    <div className="settings-content">
                                        <div className="settings-title">Тема оформления</div>
                                        <div className="settings-description">
                                            Светлая/тёмная тема
                                        </div>
                                    </div>
                                    <div className="settings-action">
                                        <div className={`toggle-switch ${document.documentElement.getAttribute('data-theme') === 'dark' ? 'active' : ''}`}>
                                            <div className="toggle-slider"></div>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Реферальная система */
                    referralData ? (
                        <ReferralSystem 
                            referralData={referralData}
                            showMessage={showMessage}
                            userId={getUserId()}
                            onRefresh={loadUserData}
                        />
                    ) : (
                        <div className="referral-loading">
                            <div className="spinner"></div>
                            <p>Загрузка реферальной системы...</p>
                        </div>
                    )
                )}
            </div>

            {/* Toast сообщения */}
            {message.text && (
                <div className={`message-toast-new message-${message.type}`}>
                    <span className="toast-icon">
                        {message.type === 'success' ? '✅' :
                         message.type === 'error' ? '❌' : '⚠️'}
                    </span>
                    <span className="toast-text">{message.text}</span>
                </div>
            )}
        </div>
    );
}

export default Profile;