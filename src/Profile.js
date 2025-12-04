import { useState, useEffect } from 'react';
import './Profile.css';

function Profile({ navigateTo }) {
    const [userData, setUserData] = useState(null);
    const [telegramData, setTelegramData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showReferral, setShowReferral] = useState(false);
    const [referralStats, setReferralStats] = useState({
        totalReferrals: 0,
        activeReferrals: 0,
        earned: 0
    });

    useEffect(() => {
        loadUserData();
        loadReferralStats();
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    const loadUserData = () => {
        try {
            // Загружаем Telegram данные
            const telegramUser = localStorage.getItem('telegramUser');
            if (telegramUser) {
                const parsed = JSON.parse(telegramUser);
                setTelegramData(parsed);
                console.log('Telegram данные:', parsed);
            }

            // Загружаем данные приложения
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                setUserData(JSON.parse(savedUser));
            } else {
                // Создаем тестовые данные если нет пользователя
                setUserData({
                    id: 'user_123',
                    username: 'testuser',
                    firstName: 'Тестовый',
                    lastName: 'Пользователь',
                    registrationDate: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadReferralStats = () => {
        try {
            // Загружаем статистику рефералов из localStorage
            const stats = JSON.parse(localStorage.getItem('referralStats') || '{}');
            
            if (Object.keys(stats).length === 0) {
                // Генерируем начальные данные
                const initialStats = {
                    totalReferrals: Math.floor(Math.random() * 5),
                    activeReferrals: Math.floor(Math.random() * 3),
                    earned: Math.floor(Math.random() * 1000)
                };
                localStorage.setItem('referralStats', JSON.stringify(initialStats));
                setReferralStats(initialStats);
            } else {
                setReferralStats(stats);
            }
        } catch (error) {
            console.error('Ошибка загрузки статистики рефералов:', error);
        }
    };

    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        showMessage('success', `Тема изменена на ${newTheme === 'dark' ? 'тёмную' : 'светлую'}`);
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const getCryptoAddresses = () => {
        try {
            const saved = localStorage.getItem('userCryptoAddresses');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    };

    const getPaymentMethods = () => {
        try {
            const saved = localStorage.getItem('userPaymentMethods');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    };

    const getRegistrationDate = () => {
        if (!userData) return '—';
        
        const dateStr = userData.registrationDate || userData.createdAt || new Date().toISOString();
        try {
            return new Date(dateStr).toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return '—';
        }
    };

    const copyToClipboard = (text, label) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        showMessage('success', `✅ ${label} скопирован`);
    };

    const clearUserData = () => {
        if (window.confirm('Вы уверены, что хотите очистить все данные? Это действие нельзя отменить.')) {
            // Сохраняем только тему и реферальные данные
            const currentTheme = localStorage.getItem('theme');
            const referralStats = localStorage.getItem('referralStats');
            
            localStorage.clear();
            
            // Восстанавливаем данные
            if (currentTheme) {
                localStorage.setItem('theme', currentTheme);
                document.documentElement.setAttribute('data-theme', currentTheme);
            }
            if (referralStats) {
                localStorage.setItem('referralStats', referralStats);
            }
            
            showMessage('success', '✅ Все данные очищены');
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        }
    };

    // Функция для получения URL аватарки Telegram
    const getTelegramAvatar = () => {
        if (!telegramData) return null;
        
        // Проверяем разные способы получения фото
        if (window.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url) {
            return window.Telegram.WebApp.initDataUnsafe.user.photo_url;
        }
        
        return null;
    };

    const getDisplayName = () => {
        if (telegramData) {
            return `${telegramData.first_name || ''} ${telegramData.last_name || ''}`.trim() || telegramData.username || 'Пользователь';
        }
        if (userData) {
            return `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.username || 'Пользователь';
        }
        return 'Пользователь';
    };

    const getUsername = () => {
        return telegramData?.username || userData?.username || 'Не указан';
    };

    const getUserId = () => {
        return telegramData?.id || userData?.id || userData?.telegramId || '—';
    };

    // Генерация реферальной ссылки
    const getReferralLink = () => {
        const userId = getUserId();
        return `https://t.me/Terbestbot?start=${userId}`;
    };

    const getReferralCode = () => {
        const userId = getUserId();
        return `REF-${userId.slice(-6).toUpperCase()}`;
    };

    // Функция для копирования реферальной ссылки
    const copyReferralLink = () => {
        const link = getReferralLink();
        copyToClipboard(link, 'Реферальная ссылка');
    };

    // Функция для копирования реферального кода
    const copyReferralCode = () => {
        const code = getReferralCode();
        copyToClipboard(code, 'Реферальный код');
    };

    // Загрузка статистики
    const cryptoAddresses = getCryptoAddresses();
    const paymentMethods = getPaymentMethods();
    const telegramAvatar = getTelegramAvatar();

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
                        <button 
                            className="back-button"
                            onClick={() => navigateTo('/')}
                        >
                            ←
                        </button>
                        <div className="header-titles">
                            <h1 className="header-title-new">Профиль</h1>
                            <p className="header-subtitle">Управление вашим аккаунтом</p>
                        </div>
                    </div>
                </div>

                {/* Карточка профиля с информацией */}
                <div className="profile-main-card">
                    <div className="profile-avatar-section">
                        {telegramAvatar ? (
                            <img 
                                src={telegramAvatar} 
                                alt="Аватар" 
                                className="profile-avatar-img"
                            />
                        ) : (
                            <div className="profile-avatar-fallback">
                                {getDisplayName().charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    
                    <div className="profile-info-section">
                        <h2 className="profile-display-name">{getDisplayName()}</h2>
                        <p className="profile-username">@{getUsername()}</p>
                        
                        <div className="profile-id-section">
                            <span className="id-label">ID:</span>
                            <button 
                                className="id-value"
                                onClick={() => copyToClipboard(getUserId(), 'ID пользователя')}
                            >
                                {getUserId()}
                            </button>
                        </div>

                        {/* Статистика пользователя */}
                        <div className="user-stats">
                            <div className="user-stat-item">
                                <div className="stat-icon-small">📊</div>
                                <div className="stat-info">
                                    <div className="stat-number">{cryptoAddresses.length}</div>
                                    <div className="stat-label-small">Кошельки</div>
                                </div>
                            </div>
                            <div className="user-stat-item">
                                <div className="stat-icon-small">💳</div>
                                <div className="stat-info">
                                    <div className="stat-number">{paymentMethods.length}</div>
                                    <div className="stat-label-small">Реквизиты</div>
                                </div>
                            </div>
                            <div className="user-stat-item">
                                <div className="stat-icon-small">📅</div>
                                <div className="stat-info">
                                    <div className="stat-date">{getRegistrationDate()}</div>
                                    <div className="stat-label-small">Регистрация</div>
                                </div>
                            </div>
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
                            <p className="referral-subtitle">Приглашайте друзей и получайте бонусы</p>
                        </div>
                    </div>

                    <div className="referral-stats">
                        <div className="referral-stat-item">
                            <div className="referral-stat-value">{referralStats.totalReferrals}</div>
                            <div className="referral-stat-label">Всего приглашено</div>
                        </div>
                        <div className="referral-stat-item">
                            <div className="referral-stat-value">{referralStats.activeReferrals}</div>
                            <div className="referral-stat-label">Активных</div>
                        </div>
                        <div className="referral-stat-item">
                            <div className="referral-stat-value">{referralStats.earned} ₽</div>
                            <div className="referral-stat-label">Заработано</div>
                        </div>
                    </div>

                    {showReferral ? (
                        <div className="referral-details">
                            <div className="referral-input-group">
                                <label className="referral-label">Реферальная ссылка</label>
                                <div className="referral-input-wrapper">
                                    <input
                                        type="text"
                                        value={getReferralLink()}
                                        readOnly
                                        className="referral-input"
                                    />
                                    <button 
                                        className="referral-copy-btn"
                                        onClick={copyReferralLink}
                                    >
                                        📋
                                    </button>
                                </div>
                            </div>

                            <div className="referral-input-group">
                                <label className="referral-label">Реферальный код</label>
                                <div className="referral-input-wrapper">
                                    <input
                                        type="text"
                                        value={getReferralCode()}
                                        readOnly
                                        className="referral-input"
                                    />
                                    <button 
                                        className="referral-copy-btn"
                                        onClick={copyReferralCode}
                                    >
                                        📋
                                    </button>
                                </div>
                            </div>

                            <div className="referral-info">
                                <div className="info-icon">💡</div>
                                <div className="info-text">
                                    <strong>Как это работает:</strong> Приглашайте друзей по ссылке или коду. 
                                    За каждого активного реферала вы получаете <strong>1%</strong> от суммы его операций.
                                </div>
                            </div>

                            <button 
                                className="referral-hide-btn"
                                onClick={() => setShowReferral(false)}
                            >
                                Скрыть
                            </button>
                        </div>
                    ) : (
                        <button 
                            className="referral-show-btn"
                            onClick={() => setShowReferral(true)}
                        >
                            <span className="btn-icon">🔗</span>
                            <span>Показать реферальную ссылку</span>
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

                {/* Опасная зона */}
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
            <div className="bottom-nav">
                <button className="nav-item" onClick={() => navigateTo('/')}>
                    <span className="nav-icon">💸</span>
                    <span className="nav-label">Обмен</span>
                </button>
                
                <button className="nav-item active">
                    <span className="nav-icon">👤</span>
                    <span className="nav-label">Профиль</span>
                </button>

                <button className="nav-item" onClick={() => navigateTo('/history')}>
                    <span className="nav-icon">📊</span>
                    <span className="nav-label">История</span>
                </button>
               
                <button className="nav-item" onClick={() => navigateTo('/help')}>
                    <span className="nav-icon">❓</span>
                    <span className="nav-label">Помощь</span>
                </button>
            </div>
        </div>
    );
}

export default Profile;