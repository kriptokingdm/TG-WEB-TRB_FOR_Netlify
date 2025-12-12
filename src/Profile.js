import { useState, useEffect } from 'react';
import './Profile.css';

const API_BASE_URL = 'https://tethrab.shop';

function Profile({ navigateTo }) {
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showReferral, setShowReferral] = useState(false);
    const [referralStats, setReferralStats] = useState({
        totalReferrals: 0,
        activeReferrals: 0,
        earned: 0,
        pendingEarned: 0,
        referralLink: '',
        referralCode: ''
    });
    const [photoError, setPhotoError] = useState(false);

    // Получаем ID пользователя из Telegram Web App
    const getUserId = () => {
        try {
            // Пробуем получить из Telegram Web App
            if (window.Telegram?.WebApp) {
                const tg = window.Telegram.WebApp;
                const tgUser = tg.initDataUnsafe?.user;
                
                if (tgUser) {
                    console.log('🤖 Telegram Web App User:', tgUser);
                    return tgUser.id.toString();
                }
            }

            // Пробуем получить из URL параметров (для тестирования)
            const urlParams = new URLSearchParams(window.location.search);
            const testUserId = urlParams.get('test_user_id');
            if (testUserId) {
                console.log('🧪 Тестовый пользователь из URL:', testUserId);
                return testUserId;
            }

            // Пробуем получить из localStorage
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

        // Дефолтный пользователь для админа
        return '7879866656';
    };

    // Загрузка данных пользователя
    const loadUserData = async () => {
        try {
            const userId = getUserId();
            console.log('👤 Загружаем данные для ID:', userId);

            // Если есть Telegram Web App данные, используем их
            if (window.Telegram?.WebApp) {
                const tg = window.Telegram.WebApp;
                const tgUser = tg.initDataUnsafe?.user;
                
                if (tgUser) {
                    const userData = {
                        id: tgUser.id.toString(),
                        telegramId: tgUser.id,
                        username: tgUser.username || `user_${tgUser.id}`,
                        firstName: tgUser.first_name || 'Пользователь',
                        lastName: tgUser.last_name || '',
                        photoUrl: tgUser.photo_url
                    };

                    console.log('✅ Telegram данные:', userData);
                    setUserData(userData);
                    
                    // Сохраняем в localStorage
                    localStorage.setItem('telegramUser', tgUser);
                    localStorage.setItem('currentUser', JSON.stringify(userData));
                    
                    return;
                }
            }

            // Если нет Telegram данных, загружаем с API
            const response = await fetch(`${API_BASE_URL}/api/user?userId=${userId}`);
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.user) {
                    console.log('✅ Данные пользователя из API:', result.user);
                    
                    const userData = {
                        id: result.user.id,
                        telegramId: result.user.telegramId,
                        username: result.user.username,
                        firstName: result.user.firstName || result.user.first_name || 'Пользователь',
                        lastName: ''
                    };

                    setUserData(userData);
                    localStorage.setItem('currentUser', JSON.stringify(userData));
                }
            }

        } catch (error) {
            console.error('❌ Ошибка загрузки данных пользователя:', error);
            
            // Пробуем загрузить из localStorage
            try {
                const savedUser = localStorage.getItem('currentUser');
                if (savedUser) {
                    const parsed = JSON.parse(savedUser);
                    console.log('📱 Данные из localStorage:', parsed);
                    setUserData(parsed);
                }
            } catch (localError) {
                console.error('❌ Ошибка локальных данных:', localError);
            }
        }
    };

    // Загрузка статистики рефералов
    const loadReferralStats = async () => {
        try {
            const userId = getUserId();
            console.log('📊 Загрузка статистики для ID:', userId);

            const response = await fetch(`${API_BASE_URL}/api/referral/stats/${userId}`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setReferralStats({
                        totalReferrals: data.data.total_referrals || 0,
                        activeReferrals: data.data.active_referrals || 0,
                        earned: data.data.earned || 0,
                        pendingEarned: data.data.pending_earned || 0,
                        referralLink: `https://t.me/TetherRabbitBot?start=ref_${userId}`,
                        referralCode: `REF-${String(userId).slice(-6).toUpperCase()}`
                    });
                }
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки статистики:', error);
        }
    };

    useEffect(() => {
        loadUserData();
        loadReferralStats();

        // Таймер для скрытия загрузки
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
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

    if (isLoading) {
        return (
            <div className="profile-loading">
                <div className="loading-spinner-new"></div>
                <p className="loading-text">Загрузка профиля...</p>
            </div>
        );
    }

    return (
        <div className="profile-container">
            {/* Хедер профиля */}
            <div className="profile-header-new">
                <div className="header-content">
                    <div className="header-left">
                        <div className="header-titles">
                            <h1 className="header-title-new">Профиль</h1>
                            <p className="header-subtitle">Управление вашим аккаунтом</p>
                        </div>
                    </div>
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
                                {userData?.firstName?.[0]?.toUpperCase() || userData?.username?.[0]?.toUpperCase() || '👤'}
                            </div>
                        )}
                    </div>

                    <div className="profile-info-section">
                        <h2 className="profile-display-name">
                            {userData?.firstName || 'Пользователь'}
                        </h2>
                        <p className="profile-username">
                            @{userData?.username || 'user'}
                        </p>

                        <div className="profile-id-section">
                            <span className="id-label">Ваш ID:</span>
                            <button
                                className="id-value"
                                onClick={() => copyToClipboard(userData?.id, 'ID пользователя')}
                            >
                                {userData?.id || '—'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Контент профиля */}
            <div className="orders-container-new">
                {/* Реферальная система */}
                <div className="profile-card-new referral-card">
                    <div className="referral-header">
                        <div className="referral-icon">👥</div>
                        <div className="referral-title">
                            <h3 className="section-title-profile">Реферальная система</h3>
                            <p className="referral-subtitle">Приглашайте друзей и получайте 0.5% от каждой их сделки</p>
                        </div>
                    </div>

                    <div className="referral-stats">
                        <div className="referral-stat-item">
                            <div className="referral-stat-value">{referralStats.totalReferrals}</div>
                            <div className="referral-stat-label">Всего рефералов</div>
                        </div>
                        <div className="referral-stat-item">
                            <div className="referral-stat-value">{referralStats.activeReferrals}</div>
                            <div className="referral-stat-label">Активных</div>
                        </div>
                        <div className="referral-stat-item">
                            <div className="referral-stat-value">{referralStats.earned || 0} ₽</div>
                            <div className="referral-stat-label">Заработано</div>
                        </div>
                        <div className="referral-stat-item">
                            <div className="referral-stat-value">{referralStats.pendingEarned || 0} ₽</div>
                            <div className="referral-stat-label">Доступно</div>
                        </div>
                    </div>

                    {showReferral ? (
                        <div className="referral-details">
                            {/* Реферальная ссылка */}
                            <div className="referral-input-group">
                                <label className="referral-label">Ваша реферальная ссылка</label>
                                <div className="referral-input-wrapper">
                                    <input
                                        type="text"
                                        value={referralStats.referralLink}
                                        readOnly
                                        className="referral-input"
                                    />
                                    <button
                                        className="referral-copy-btn"
                                        onClick={() => copyToClipboard(referralStats.referralLink, 'Реферальная ссылка')}
                                    >
                                        📋 Копировать
                                    </button>
                                </div>
                            </div>

                            <div className="referral-info">
                                <div className="info-icon">💡</div>
                                <div className="info-text">
                                    <strong>Как это работает:</strong>
                                    <br />1. Приглашайте друзей по вашей ссылке
                                    <br />2. Когда они делают обмен USDT/RUB
                                    <br />3. Вы получаете 0.5% от суммы каждой их сделки
                                    <br />4. Выводите заработанные средства
                                </div>
                            </div>

                            <button
                                className="referral-hide-btn"
                                onClick={() => setShowReferral(false)}
                            >
                                Скрыть детали
                            </button>
                        </div>
                    ) : (
                        <button
                            className="referral-show-btn"
                            onClick={() => setShowReferral(true)}
                        >
                            <span className="btn-icon">🔗</span>
                            <span>Показать реферальную ссылку</span>
                            {referralStats.earned > 0 && (
                                <span className="earned-badge">+{referralStats.earned} ₽</span>
                            )}
                        </button>
                    )}
                </div>

                {/* Настройки */}
                <div className="profile-card-new">
                    <h3 className="section-title-profile">Настройки</h3>
                    <div className="settings-grid">
                        <button
                            className="settings-item-profile"
                            onClick={toggleTheme}
                        >
                            <div className="settings-icon-profile">🌙</div>
                            <div className="settings-content-profile">
                                <div className="settings-title-profile">Тема оформления</div>
                                <div className="settings-description-profile">
                                    Переключить между светлой и тёмной темой
                                </div>
                            </div>
                            <div className="settings-action-profile">
                                <div className="toggle-switch-profile">
                                    <div className="toggle-slider-profile"></div>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
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

            {/* Навигация */}
            <div className="bottom-nav-new">
                <button className="nav-item-new" onClick={() => navigateTo('profile')}>
                    <div className="nav-icon-wrapper">
                        <span className="nav-icon">👤</span>
                    </div>
                    <span className="nav-label">Профиль</span>
                </button>

                <button className="nav-center-item" onClick={() => navigateTo('home')}>
                    <div className="nav-center-circle">
                        <span className="nav-center-icon">💸</span>
                    </div>
                    <span className="nav-center-label">Обмен</span>
                </button>

                <button className="nav-item-new" onClick={() => navigateTo('history')}>
                    <div className="nav-icon-wrapper">
                        <span className="nav-icon">📊</span>
                    </div>
                    <span className="nav-label">История</span>
                </button>
            </div>
        </div>
    );
}

export default Profile;