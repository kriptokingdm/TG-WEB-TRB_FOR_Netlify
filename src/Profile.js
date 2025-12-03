import { useState, useEffect } from 'react';
import './Profile.css';

function Profile({ navigateTo }) {
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showReferralInfo, setShowReferralInfo] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            
            if (!token || !currentUser) {
                throw new Error('Требуется авторизация');
            }

            console.log('🔄 Загрузка данных пользователя...');
            
            // Загружаем основные данные пользователя
            const userResponse = await fetch('https://87.242.106.114.sslip.io/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }); 
            
            if (!userResponse.ok) {
                throw new Error(`HTTP ${userResponse.status}`);
            }
            
            const userDataResult = await userResponse.json();
            
            // Загружаем статистику
            const statsResponse = await fetch(`https://87.242.106.114.sslip.io/api/user/stats/${currentUser.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            let statsData = { stats: {} };
            if (statsResponse.ok) {
                statsData = await statsResponse.json();
            }

            // Объединяем данные с реферальной информацией
            const completeUserData = {
                ...userDataResult.user,
                stats: statsData.stats || { 
                    totalVolume: 0, 
                    totalTrades: 0, 
                    successRate: 0 
                },
                referral: {
                    code: `REF${currentUser.id.slice(0, 8).toUpperCase()}`,
                    link: `https://tether-rabbit.app?ref=${currentUser.id}`,
                    earnings: 1500,
                    referrals: 3
                },
                fromStorage: false
            };

            console.log('✅ Данные пользователя:', completeUserData);
            setUserData(completeUserData);
            
            // Сохраняем в localStorage
            localStorage.setItem('currentUser', JSON.stringify(completeUserData));
            
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
            setError('Ошибка загрузки данных');
            
            // Пробуем взять данные из localStorage
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                console.log('⚠️ Использую данные из localStorage');
                const userFromStorage = JSON.parse(savedUser);
                
                // Добавляем реферальную систему если нет
                if (!userFromStorage.referral) {
                    userFromStorage.referral = {
                        code: `REF${userFromStorage.id?.slice(0, 8).toUpperCase() || 'USER'}`,
                        link: `https://tether-rabbit.app?ref=${userFromStorage.id || 'user'}`,
                        earnings: 0,
                        referrals: 0
                    };
                }
                
                setUserData({
                    ...userFromStorage,
                    fromStorage: true
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        console.log('🚪 Выход из системы');
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        navigateTo('welcome');
    };

    const copyReferralCode = () => {
        if (userData?.referral?.link) {
            navigator.clipboard.writeText(userData.referral.link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (isLoading) {
        return (
            <div className="profile-container">
                <div className="profile-header">
                    <div className="header-top">
                        <h1 className="header-title">Профиль</h1>
                    </div>
                </div>
                
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Загрузка профиля...</p>
                </div>
            </div>
        );
    }

    if (error && !userData) {
        return (
            <div className="profile-container">
                <div className="profile-header">
                    <div className="header-top">
                        <h1 className="header-title">Профиль</h1>
                    </div>
                </div>
                
                <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <h3 className="error-title">Ошибка загрузки</h3>
                    <p className="error-subtitle">{error}</p>
                    <button 
                        className="retry-btn"
                        onClick={fetchUserData}
                    >
                        🔄 Повторить
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            {/* Header */}
            <div className="profile-header">
                <div className="header-top">
                    <h1 className="header-title">Профиль пользователя</h1>
                    <div className="user-id-badge">
                        ID: {userData?.id || 'N/A'}
                    </div>
                </div>

                {/* User Info Stats */}
                <div className="user-stats-grid">
                    <div className="user-stat-card">
                        <div className="user-stat-icon">👤</div>
                        <div className="user-stat-content">
                            <div className="user-stat-label">Никнейм</div>
                            <div className="user-stat-value">{userData?.username || 'Пользователь'}</div>
                        </div>
                    </div>
                    <div className="user-stat-card">
                        <div className="user-stat-icon">⭐</div>
                        <div className="user-stat-content">
                            <div className="user-stat-label">Рейтинг</div>
                            <div className="user-stat-value">{userData?.stats?.successRate || 0}%</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="profile-content">
                {/* Personal Information */}
                <div className="profile-section">
                    <div className="section-header">
                        <div className="section-title">
                            <span className="section-icon">📋</span>
                            <h3>Личная информация</h3>
                        </div>
                    </div>
                    
                    <div className="section-content">
                        <div className="info-grid">
                            <div className="info-card">
                                <div className="info-label">📧 Email</div>
                                <div className="info-value">{userData?.email || 'Не указан'}</div>
                            </div>
                            <div className="info-card">
                                <div className="info-label">📅 Регистрация</div>
                                <div className="info-value">{userData?.registrationDate || 'Неизвестно'}</div>
                            </div>
                            <div className="info-card">
                                <div className="info-label">🟢 Статус</div>
                                <div className="info-value verified">✅ Верифицирован</div>
                            </div>
                            <div className="info-card">
                                <div className="info-label">🔒 Уровень</div>
                                <div className="info-value highlight">Стандартный</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics */}
                <div className="profile-section">
                    <div className="section-header">
                        <div className="section-title">
                            <span className="section-icon">📊</span>
                            <h3>Статистика обменов</h3>
                        </div>
                        <div className="stats-update">Актуально</div>
                    </div>
                    
                    <div className="section-content">
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">🔄</div>
                                <div className="stat-value">{userData?.stats?.totalTrades || 0}</div>
                                <div className="stat-label">Всего сделок</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">✅</div>
                                <div className="stat-value">{userData?.stats?.successfulTrades || 0}</div>
                                <div className="stat-label">Успешных</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">📈</div>
                                <div className="stat-value">{userData?.stats?.successRate || 0}%</div>
                                <div className="stat-label">Успешность</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">💰</div>
                                <div className="stat-value large">{(userData?.stats?.totalVolume || 0).toLocaleString()} ₽</div>
                                <div className="stat-label">Общий оборот</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">📊</div>
                                <div className="stat-value">{(userData?.stats?.averageAmount || 0).toLocaleString()} ₽</div>
                                <div className="stat-label">Средняя сумма</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">⚡</div>
                                <div className="stat-value">{userData?.stats?.activeTrades || 0}</div>
                                <div className="stat-label">Активных</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Referral System */}
                <div className="profile-section">
                    <div className="section-header" onClick={() => setShowReferralInfo(!showReferralInfo)}>
                        <div className="section-title">
                            <span className="section-icon">👥</span>
                            <h3>Реферальная система</h3>
                        </div>
                        <span className="toggle-icon">{showReferralInfo ? '−' : '+'}</span>
                    </div>
                    
                    <div className={`section-content ${showReferralInfo ? 'expanded' : ''}`}>
                        <div className="referral-card">
                            <div className="referral-header">
                                <div className="referral-title">Приглашайте друзей и получайте бонусы!</div>
                                <div className="referral-subtitle">За каждого приглашенного друга получайте 0.5% от его оборота</div>
                            </div>
                            
                            <div className="referral-stats">
                                <div className="referral-stat">
                                    <div className="referral-stat-value">{userData?.referral?.referrals || 0}</div>
                                    <div className="referral-stat-label">Приглашено</div>
                                </div>
                                <div className="referral-stat">
                                    <div className="referral-stat-value large">{userData?.referral?.earnings || 0} ₽</div>
                                    <div className="referral-stat-label">Заработано</div>
                                </div>
                            </div>
                            
                            <div className="referral-code-section">
                                <div className="referral-code-label">Ваша реферальная ссылка:</div>
                                <div className="referral-code-wrapper">
                                    <div className="referral-code">
                                        {userData?.referral?.code || 'REF-XXXXXX'}
                                    </div>
                                    <button 
                                        className="copy-referral-btn"
                                        onClick={copyReferralCode}
                                    >
                                        {copied ? '✅ Скопировано' : '📋 Копировать'}
                                    </button>
                                </div>
                                
                                <div className="referral-link">
                                    {userData?.referral?.link || 'https://tether-rabbit.app?ref=your-code'}
                                </div>
                            </div>
                            
                            <div className="referral-rules">
                                <div className="rule-item">🎯 Приглашенный получает +0.1% к первому обмену</div>
                                <div className="rule-item">💰 Вы получаете 0.5% от объема сделок реферала</div>
                                <div className="rule-item">📊 Вывод средств доступен от 1000 ₽</div>
                                <div className="rule-item">⚡ Выплаты производятся ежедневно</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logout Button */}
                <div className="logout-section">
                    <button 
                        className="logout-btn"
                        onClick={handleLogout}
                    >
                        <span className="logout-icon">🚪</span>
                        <span className="logout-text">Выйти из системы</span>
                    </button>
                </div>

                {/* Debug Info (only in development) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="debug-info">
                        <div className="debug-label">Отладка:</div>
                        <div className="debug-value">
                            Данные {userData?.fromStorage ? 'из localStorage' : 'с сервера'}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            <div className="bottom-nav">
                <button className="nav-item" onClick={() => navigateTo('/')}>
                    <span className="nav-icon">💸</span>
                    <span className="nav-label">Обмен</span>
                </button>
                <button className="nav-item" onClick={() => navigateTo('/history')}>
                    <span className="nav-icon">📊</span>
                    <span className="nav-label">История</span>
                </button>
                <button className="nav-item active">
                    <span className="nav-icon">👤</span>
                    <span className="nav-label">Профиль</span>
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