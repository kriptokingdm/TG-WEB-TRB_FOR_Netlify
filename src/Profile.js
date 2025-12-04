import { useState, useEffect } from 'react';
import './Profile.css';

function Profile({ navigateTo }) {
    const [userData, setUserData] = useState(null);
    const [telegramData, setTelegramData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('personal');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [stats, setStats] = useState({
        cryptoAddresses: 0,
        paymentMethods: 0,
        totalOrders: 0
    });

    useEffect(() => {
        loadUserData();
        loadStats();
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

    const loadStats = () => {
        try {
            const cryptoAddresses = JSON.parse(localStorage.getItem('userCryptoAddresses') || '[]');
            const paymentMethods = JSON.parse(localStorage.getItem('userPaymentMethods') || '[]');
            const orders = JSON.parse(localStorage.getItem('userOrders') || '[]');
            
            setStats({
                cryptoAddresses: cryptoAddresses.length,
                paymentMethods: paymentMethods.length,
                totalOrders: orders.length
            });
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
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
            // Сохраняем только тему
            const currentTheme = localStorage.getItem('theme');
            localStorage.clear();
            
            // Восстанавливаем тему
            if (currentTheme) {
                localStorage.setItem('theme', currentTheme);
                document.documentElement.setAttribute('data-theme', currentTheme);
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

                {/* Карточка профиля */}
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
                    </div>
                </div>

                {/* Карточки статистики */}
                <div className="stats-cards">
                    <div className="stat-card-new">
                        <div className="stat-icon-container">
                            <div className="stat-icon">📊</div>
                        </div>
                        <div className="stat-content">
                            <div className="stat-value-new">{stats.totalOrders}</div>
                            <div className="stat-label-new">Операций</div>
                        </div>
                    </div>
                    
                    <div className="stat-card-new">
                        <div className="stat-icon-container">
                            <div className="stat-icon">₿</div>
                        </div>
                        <div className="stat-content">
                            <div className="stat-value-new">{stats.cryptoAddresses}</div>
                            <div className="stat-label-new">Кошельки</div>
                        </div>
                    </div>
                    
                    <div className="stat-card-new">
                        <div className="stat-icon-container">
                            <div className="stat-icon">💳</div>
                        </div>
                        <div className="stat-content">
                            <div className="stat-value-new">{stats.paymentMethods}</div>
                            <div className="stat-label-new">Реквизиты</div>
                        </div>
                    </div>
                </div>

                {/* Табы профиля */}
                <div className="view-tabs">
                    <button
                        className={`view-tab-new ${activeTab === 'personal' ? 'active' : ''}`}
                        onClick={() => setActiveTab('personal')}
                    >
                        <span className="tab-icon">👤</span>
                        <span className="tab-text">Профиль</span>
                    </button>
                    
                    <button
                        className={`view-tab-new ${activeTab === 'wallet' ? 'active' : ''}`}
                        onClick={() => setActiveTab('wallet')}
                    >
                        <span className="tab-icon">₿</span>
                        <span className="tab-text">Кошельки</span>
                        {stats.cryptoAddresses > 0 && (
                            <span className="tab-badge">{stats.cryptoAddresses}</span>
                        )}
                    </button>
                    
                    <button
                        className={`view-tab-new ${activeTab === 'bank' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bank')}
                    >
                        <span className="tab-icon">💳</span>
                        <span className="tab-text">Реквизиты</span>
                        {stats.paymentMethods > 0 && (
                            <span className="tab-badge">{stats.paymentMethods}</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Контент профиля */}
            <div className="orders-container-new">
                {activeTab === 'personal' && (
                    <div className="profile-content-section">
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
                                
                                <button 
                                    className="settings-item-profile"
                                    onClick={() => navigateTo('/history')}
                                >
                                    <div className="settings-icon-profile">📊</div>
                                    <div className="settings-content-profile">
                                        <div className="settings-title-profile">История операций</div>
                                        <div className="settings-description-profile">
                                            Просмотр всех ваших транзакций
                                        </div>
                                    </div>
                                    <div className="settings-action-profile">→</div>
                                </button>
                                
                                <button 
                                    className="settings-item-profile"
                                    onClick={() => navigateTo('/help')}
                                >
                                    <div className="settings-icon-profile">❓</div>
                                    <div className="settings-content-profile">
                                        <div className="settings-title-profile">Помощь и поддержка</div>
                                        <div className="settings-description-profile">
                                            Часто задаваемые вопросы и контакты
                                        </div>
                                    </div>
                                    <div className="settings-action-profile">→</div>
                                </button>
                                
                                <button 
                                    className="settings-item-profile"
                                    onClick={() => window.open('https://t.me/Terbestbot', '_blank')}
                                >
                                    <div className="settings-icon-profile">🤖</div>
                                    <div className="settings-content-profile">
                                        <div className="settings-title-profile">Наш Telegram бот</div>
                                        <div className="settings-description-profile">
                                            Получайте уведомления о статусе заказов
                                        </div>
                                    </div>
                                    <div className="settings-action-profile">↗️</div>
                                </button>
                            </div>
                        </div>

                        {/* Опасная зона */}
                        <div className="profile-card-new danger-zone">
                            <h3 className="section-title-profile">Опасная зона</h3>
                            <p className="danger-warning">
                                Удаление данных приведет к очистке всей вашей информации, 
                                включая историю операций, кошельки и реквизиты.
                            </p>
                            <button 
                                className="danger-button-profile"
                                onClick={clearUserData}
                            >
                                <span className="danger-icon-profile">🗑️</span>
                                Очистить все данные
                            </button>
                        </div>

                        {/* Информация о системе */}
                        <div className="profile-card-new system-info">
                            <h3 className="section-title-profile">О приложении</h3>
                            <div className="system-details">
                                <div className="system-item">
                                    <span className="system-label">Версия приложения:</span>
                                    <span className="system-value">1.0.0</span>
                                </div>
                                <div className="system-item">
                                    <span className="system-label">Дата регистрации:</span>
                                    <span className="system-value">{getRegistrationDate()}</span>
                                </div>
                                <div className="system-item">
                                    <span className="system-label">Статус аккаунта:</span>
                                    <span className="system-value status-active">Активен</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'wallet' && (
                    <div className="profile-content-section">
                        {cryptoAddresses.length === 0 ? (
                            <div className="empty-state-new">
                                <div className="empty-icon-container">
                                    <div className="empty-icon">₿</div>
                                </div>
                                <h3 className="empty-title-new">Нет крипто-адресов</h3>
                                <p className="empty-subtitle-new">
                                    Добавьте адреса для получения USDT при обмене
                                </p>
                                <button 
                                    className="exchange-btn-new"
                                    onClick={() => navigateTo('/')}
                                >
                                    <span className="exchange-icon">➕</span>
                                    <span>Добавить адрес</span>
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="list-header">
                                    <h3 className="section-title-profile">Мои кошельки</h3>
                                    <button 
                                        className="add-button"
                                        onClick={() => navigateTo('/')}
                                    >
                                        + Добавить
                                    </button>
                                </div>
                                <div className="orders-list-new">
                                    {cryptoAddresses.map((address, index) => (
                                        <div key={index} className="order-card-new">
                                            <div className="order-card-header">
                                                <div className="order-header-left">
                                                    <div className="order-type-badge-new">
                                                        <span className="type-icon-new">
                                                            ₿
                                                        </span>
                                                        <span className="type-text-new">
                                                            {address.network}
                                                        </span>
                                                    </div>
                                                    <span className="order-id-new">
                                                        {address.name || `Кошелек ${index + 1}`}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="order-details-grid">
                                                <div className="order-detail">
                                                    <span className="detail-label">Адрес кошелька</span>
                                                    <span className="detail-value address-value">
                                                        {address.address.slice(0, 12)}...{address.address.slice(-8)}
                                                    </span>
                                                </div>
                                                <div className="order-detail">
                                                    <span className="detail-label">Сеть</span>
                                                    <span className="detail-value highlight">
                                                        {address.network}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="order-actions">
                                                <button 
                                                    className="chat-btn-new"
                                                    onClick={() => copyToClipboard(address.address, 'Адрес кошелька')}
                                                >
                                                    <span className="chat-icon">📋</span>
                                                    <span>Скопировать адрес</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'bank' && (
                    <div className="profile-content-section">
                        {paymentMethods.length === 0 ? (
                            <div className="empty-state-new">
                                <div className="empty-icon-container">
                                    <div className="empty-icon">💳</div>
                                </div>
                                <h3 className="empty-title-new">Нет банковских реквизитов</h3>
                                <p className="empty-subtitle-new">
                                    Добавьте реквизиты для получения RUB при обмене
                                </p>
                                <button 
                                    className="exchange-btn-new"
                                    onClick={() => navigateTo('/')}
                                >
                                    <span className="exchange-icon">➕</span>
                                    <span>Добавить реквизиты</span>
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="list-header">
                                    <h3 className="section-title-profile">Мои реквизиты</h3>
                                    <button 
                                        className="add-button"
                                        onClick={() => navigateTo('/')}
                                    >
                                        + Добавить
                                    </button>
                                </div>
                                <div className="orders-list-new">
                                    {paymentMethods.map((payment, index) => (
                                        <div key={index} className="order-card-new">
                                            <div className="order-card-header">
                                                <div className="order-header-left">
                                                    <div className="order-type-badge-new">
                                                        <span className="type-icon-new">
                                                            {payment.type === 'sbp' ? '📱' : '💳'}
                                                        </span>
                                                        <span className="type-text-new">
                                                            {payment.type === 'sbp' ? 'СБП' : 'Карта'}
                                                        </span>
                                                    </div>
                                                    <span className="order-id-new">
                                                        {payment.name}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="order-details-grid">
                                                <div className="order-detail">
                                                    <span className="detail-label">Номер</span>
                                                    <span className="detail-value address-value">
                                                        {payment.type === 'sbp' 
                                                            ? payment.number 
                                                            : `•••• ${payment.number.slice(-4)}`}
                                                    </span>
                                                </div>
                                                <div className="order-detail">
                                                    <span className="detail-label">Тип</span>
                                                    <span className="detail-value highlight">
                                                        {payment.type === 'sbp' ? 'Телефон' : 'Банковская карта'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="order-actions">
                                                <button 
                                                    className="chat-btn-new"
                                                    onClick={() => copyToClipboard(payment.number, 'Номер реквизитов')}
                                                >
                                                    <span className="chat-icon">📋</span>
                                                    <span>Скопировать номер</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
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