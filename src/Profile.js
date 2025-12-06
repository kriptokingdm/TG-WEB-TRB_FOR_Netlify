import { useState, useEffect } from 'react';
import './Profile.css';

const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://87.242.106.114:3002'
    : 'https://87.242.106.114';

// Отладка
console.log('🌐 Текущий хост:', window.location.hostname);
console.log('🔗 API URL:', API_BASE_URL);

function Profile({ navigateTo }) {
    const [userData, setUserData] = useState(null);
    const [telegramData, setTelegramData] = useState(null);
    const [userPhoto, setUserPhoto] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showReferral, setShowReferral] = useState(false);
    const [referralStats, setReferralStats] = useState({
        totalReferrals: 0,
        activeReferrals: 0,
        earned: 0,
        pendingEarned: 0,
        referralLink: '',
        referralCode: '',
        referral_transactions: 0,
        referral_total_amount: 0,
        commission_percent: 0.5
    });
    const [referralList, setReferralList] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [earningsHistory, setEarningsHistory] = useState([]);
    const [testTransactionAmount, setTestTransactionAmount] = useState('10000');
    const [photoError, setPhotoError] = useState(false);

    useEffect(() => {
        // Тестовый запрос при загрузке
        fetch(`${API_BASE_URL}/health`)
            .then(r => r.json())
            .then(data => console.log('✅ API подключен:', data))
            .catch(err => console.error('❌ Ошибка API:', err));

        loadUserData();
        loadReferralStats();

        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    const loadUserData = () => {
        try {
            console.log('🔄 Загрузка данных пользователя...');

            // 1. Пробуем Telegram WebApp (если доступно)
            if (window.Telegram?.WebApp) {
                const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
                if (tgUser) {
                    console.log('🤖 Telegram WebApp данные:', tgUser);
                    setTelegramData(tgUser);
                    localStorage.setItem('telegramUser', JSON.stringify(tgUser));

                    // Сохраняем в currentUser формат
                    const appUser = {
                        id: `user_${tgUser.id}`,
                        telegramId: tgUser.id,
                        username: tgUser.username || `user_${tgUser.id}`,
                        firstName: tgUser.first_name || 'Пользователь',
                        lastName: tgUser.last_name || '',
                        photoUrl: tgUser.photo_url
                    };
                    localStorage.setItem('currentUser', JSON.stringify(appUser));
                    setUserData(appUser);

                    // Сохраняем фото если есть
                    if (tgUser.photo_url) {
                        setUserPhoto(tgUser.photo_url);
                        console.log('📸 Telegram фото:', tgUser.photo_url);
                        setPhotoError(false);
                    }
                }
            }

            // 2. Загружаем из localStorage если WebApp не дал данные
            const telegramUser = localStorage.getItem('telegramUser');
            if (telegramUser) {
                const parsed = JSON.parse(telegramUser);
                console.log('📱 Telegram данные из localStorage:', parsed);
                setTelegramData(parsed);

                // Пробуем получить фото если есть в сохраненных данных
                if (parsed.photo_url) {
                    setUserPhoto(parsed.photo_url);
                    setPhotoError(false);
                }
            }

            // 3. Загружаем данные приложения
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                const parsed = JSON.parse(savedUser);
                console.log('👤 Данные приложения:', parsed);
                setUserData(parsed);

                // Пробуем получить фото из данных приложения
                if (parsed.photoUrl && !userPhoto) {
                    setUserPhoto(parsed.photoUrl);
                    setPhotoError(false);
                }
            }

            // 4. Если все еще нет данных - создаем тестовые
            if (!telegramData && !userData) {
                console.log('⚠️ Данных нет, создаю тестовые');
                const testUser = {
                    id: 7879866656,
                    username: 'TERBCEO',
                    first_name: 'G',
                    last_name: ''
                };
                setTelegramData(testUser);
                localStorage.setItem('telegramUser', JSON.stringify(testUser));

                const appUser = {
                    id: 'user_7879866656',
                    telegramId: 7879866656,
                    username: 'TERBCEO',
                    firstName: 'G',
                    lastName: ''
                };
                setUserData(appUser);
                localStorage.setItem('currentUser', JSON.stringify(appUser));
            }

            console.log('✅ Данные загружены:', { telegramData, userData, userPhoto });

        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Загрузка статистики рефералов
    const loadReferralStats = async () => {
        try {
            const userId = getUserId();
            console.log('📊 Загрузка статистики для ID:', userId);

            if (!userId || userId === '—') {
                console.warn('ID пользователя не найден');
                return;
            }

            console.log('🌐 Запрос к:', `${API_BASE_URL}/api/referral/stats/${userId}`);

            const response = await fetch(`${API_BASE_URL}/api/referral/stats/${userId}`);
            console.log('✅ Ответ сервера:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📈 Данные статистики:', data);

            if (data.success) {
                const newStats = {
                    totalReferrals: data.data.total_referrals || 0,
                    activeReferrals: data.data.active_referrals || 0,
                    earned: data.data.earned || 0,
                    pendingEarned: data.data.pending_earned || 0,
                    referralLink: data.data.referral_link || getReferralLink(),
                    referralCode: data.data.referral_code || getReferralCode(),
                    referral_transactions: data.data.referral_transactions || 0,
                    referral_total_amount: data.data.referral_total_amount || 0,
                    commission_percent: data.data.commission_percent || 0.5
                };

                console.log('✅ Обновлена статистика:', newStats);
                setReferralStats(newStats);
            } else {
                console.error('❌ API вернул success: false', data);
                showMessage('error', 'Ошибка загрузки статистики');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки статистики:', error);
            showMessage('error', 'Ошибка подключения к серверу');

            setReferralStats({
                totalReferrals: 0,
                activeReferrals: 0,
                earned: 0,
                pendingEarned: 0,
                referralLink: getReferralLink(),
                referralCode: getReferralCode(),
                referral_transactions: 0,
                referral_total_amount: 0,
                commission_percent: 0.5
            });
        }
    };

    // Загрузка списка рефералов
    const loadReferralList = async () => {
        try {
            const userId = getUserId();
            if (!userId || userId === '—') return;
    
            const response = await fetch(`${API_BASE_URL}/api/referrals/${userId}`);
            const data = await response.json();
    
            if (data.success) {
                console.log('👥 Реальные рефералы из базы:', data.data);
                setReferralList(data.data || []);
            }
        } catch (error) {
            console.error('Ошибка загрузки списка рефералов:', error);
            showMessage('error', 'Ошибка подключения к серверу');
            // Показываем нули вместо тестовых данных
            setReferralList([]); // ПУСТОЙ массив
        }
    };

    // Загрузка истории выводов
    const loadWithdrawals = async () => {
        try {
            const userId = getUserId();
            if (!userId || userId === '—') return;

            const response = await fetch(`${API_BASE_URL}/api/referral/withdrawals/${userId}`);
            const data = await response.json();

            if (data.success) {
                setWithdrawals(data.data || []);
            }
        } catch (error) {
            console.error('Ошибка загрузки истории выводов:', error);
        }
    };

    // Загрузка истории начислений
    const loadEarningsHistory = async () => {
        try {
            const userId = getUserId();
            if (!userId || userId === '—') return;

            console.log('💰 Загружаем историю начислений для:', userId);

            const response = await fetch(`${API_BASE_URL}/api/referral/earnings/${userId}`);
            console.log('📊 Ответ истории:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📈 Данные истории:', data);

            if (data.success) {
                setEarningsHistory(data.data || []);
            } else {
                // Тестовые данные
                setEarningsHistory([]);
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки истории начислений:', error);

            // Тестовые данные при ошибке
            setEarningsHistory([
                {
                    referral_id: "100000001",
                    transaction_amount: 50000,
                    currency: "RUB",
                    your_earnings: 250,
                    percent: 0.5,
                    date: new Date().toISOString(),
                    message: "0.5% от сделки 50000 RUB"
                },
                {
                    referral_id: "100000002",
                    transaction_amount: 10000,
                    currency: "RUB",
                    your_earnings: 50,
                    percent: 0.5,
                    date: new Date().toISOString(),
                    message: "0.5% от сделки 10000 RUB"
                }
            ]);
        }
    };

    // Тестовая регистрация сделки
    const testReferralTransaction = async () => {
        try {
            const userId = getUserId();
            const amount = parseFloat(testTransactionAmount) || 10000;

            showMessage('info', `Регистрирую тестовую сделку на ${amount} ₽...`);

            const response = await fetch(`${API_BASE_URL}/api/transaction/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    userId: userId,
                    amount: amount,
                    currency: 'RUB',
                    type: 'exchange'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Ответ регистрации сделки:', data);

            if (data.success) {
                showMessage('success',
                    data.data.commission
                        ? `✅ Ваш реферер получил ${data.data.commission.amount} ₽ (0.5%)`
                        : '✅ Сделка зарегистрирована (нет реферера)'
                );

                // Обновляем данные
                setTimeout(() => {
                    loadReferralStats();
                    loadEarningsHistory();
                    loadReferralList();
                }, 500);

            } else {
                showMessage('error', data.error || 'Ошибка регистрации сделки');
            }
        } catch (error) {
            console.error('Ошибка регистрации сделки:', error);
            showMessage('error', 'Ошибка сети. Проверьте подключение.');
        }
    };

    // Запрос на вывод средств
    const handleWithdraw = async () => {
        try {
            const userId = getUserId();
            if (!userId || userId === '—') {
                showMessage('error', 'Не удалось определить ID пользователя');
                return;
            }

            if (!withdrawAmount || !paymentMethod) {
                showMessage('error', 'Заполните сумму и способ вывода');
                return;
            }

            const amount = parseFloat(withdrawAmount);
            if (amount < 100) {
                showMessage('error', 'Минимальная сумма вывода: 100 ₽');
                return;
            }

            if (amount > referralStats.pendingEarned) {
                showMessage('error', 'Недостаточно средств для вывода');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/referral/withdraw`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    userId: userId,
                    amount: amount,
                    paymentMethod: paymentMethod
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Ответ вывода:', data);

            if (data.success) {
                showMessage('success', 'Запрос на вывод успешно отправлен!');
                setWithdrawAmount('');
                setPaymentMethod('');

                // Обновляем данные
                setTimeout(() => {
                    loadReferralStats();
                    loadWithdrawals();
                }, 500);

            } else {
                showMessage('error', data.error || 'Ошибка при запросе выплаты');
            }
        } catch (error) {
            console.error('Ошибка запроса вывода:', error);
            showMessage('error', 'Ошибка сети при запросе вывода');
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

    const getUserId = () => {
        // Пробуем Telegram данные из localStorage
        const savedTelegramUser = localStorage.getItem('telegramUser');
        if (savedTelegramUser) {
            try {
                const telegramUser = JSON.parse(savedTelegramUser);
                console.log('📱 Telegram user из localStorage:', telegramUser);
                return telegramUser.id || '7879866656';
            } catch (e) {
                console.error('❌ Ошибка парсинга telegramUser:', e);
            }
        }

        // Пробуем currentUser
        const savedCurrentUser = localStorage.getItem('currentUser');
        if (savedCurrentUser) {
            try {
                const currentUser = JSON.parse(savedCurrentUser);
                console.log('👤 Current user из localStorage:', currentUser);
                return currentUser.telegramId || currentUser.id || '7879866656';
            } catch (e) {
                console.error('❌ Ошибка парсинга currentUser:', e);
            }
        }

        // Админ по умолчанию
        console.log('👑 Использую ID админа');
        return '7879866656';
    };

    const getReferralLink = () => {
        const userId = getUserId();
        return `https://t.me/TetherRabbitBot?start=ref_${userId}`;
    };

    const getReferralCode = () => {
        const userId = getUserId();
        return `REF-${String(userId).slice(-6).toUpperCase()}`;
    };

    const copyToClipboard = (text, label) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        showMessage('success', `✅ ${label} скопирован`);
    };

    const handlePhotoError = () => {
        console.log('❌ Ошибка загрузки фото, показываем fallback');
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
                        <button
                            className="back-button"
                            onClick={() => navigateTo && navigateTo('/')}
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
                        {userPhoto && !photoError ? (
                            <img
                                src={userPhoto}
                                alt="Avatar"
                                className="profile-avatar-image"
                                onError={handlePhotoError}
                                onLoad={() => console.log('✅ Фото загружено успешно')}
                            />
                        ) : null}
                        <div className="profile-avatar-fallback" style={{ display: (userPhoto && !photoError) ? 'none' : 'flex' }}>
                            {telegramData?.first_name?.[0]?.toUpperCase() || telegramData?.username?.[0]?.toUpperCase() || '👤'}
                        </div>
                    </div>

                    <div className="profile-info-section">
                        <h2 className="profile-display-name">
                            {telegramData?.first_name || userData?.firstName || 'Администратор'}
                            {telegramData?.last_name && ` ${telegramData.last_name}`}
                        </h2>
                        <p className="profile-username">
                            @{telegramData?.username || userData?.username || 'TERBCEO'}
                        </p>

                        <div className="profile-id-section">
                            <span className="id-label">Ваш ID:</span>
                            <button
                                className="id-value"
                                onClick={() => copyToClipboard(getUserId(), 'ID пользователя')}
                            >
                                {getUserId()}
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
                            <div className="referral-stat-value">{referralStats.referral_transactions || 0}</div>
                            <div className="referral-stat-label">Сделок рефералов</div>
                        </div>
                        <div className="referral-stat-item">
                            <div className="referral-stat-value">{referralStats.earned || 0} ₽</div>
                            <div className="referral-stat-label">Заработано</div>
                        </div>
                    </div>

                    {showReferral ? (
                        <div className="referral-details">
                            {/* Детальная статистика */}
                            <div className="detailed-earnings-section">
                                <div className="refresh-section">
                                    <h4>Детальная статистика</h4>
                                    <button
                                        className="refresh-btn"
                                        onClick={() => {
                                            loadReferralStats();
                                            loadEarningsHistory();
                                            loadReferralList();
                                            showMessage('info', 'Статистика обновляется...');
                                        }}
                                        style={{
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '8px 12px',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px'
                                        }}
                                    >
                                        🔄 Обновить
                                    </button>
                                </div>
                                <div className="earnings-breakdown">
                                    <div className="earning-source">
                                        <div className="earning-icon">💰</div>
                                        <div className="earning-details">
                                            <div className="earning-title">Всего заработано</div>
                                            <div className="earning-amount">{referralStats.earned || 0} ₽</div>
                                            <div className="earning-note">0.5% от сделок ваших рефералов</div>
                                        </div>
                                    </div>

                                    <div className="earning-source">
                                        <div className="earning-icon">📊</div>
                                        <div className="earning-details">
                                            <div className="earning-title">Сделки рефералов</div>
                                            <div className="earning-amount">{referralStats.referral_transactions || 0}</div>
                                            <div className="earning-note">Общая сумма: {referralStats.referral_total_amount || 0} ₽</div>
                                        </div>
                                    </div>

                                    <div className="earning-source total">
                                        <div className="earning-icon">💳</div>
                                        <div className="earning-details">
                                            <div className="earning-title">Доступно для вывода</div>
                                            <div className="earning-amount">{referralStats.pendingEarned || 0} ₽</div>
                                            <div className="earning-note">80% от заработанного (мин. 100 ₽)</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Реферальная ссылка */}
                            <div className="referral-input-group">
                                <label className="referral-label">Ваша реферальная ссылка</label>
                                <div className="referral-input-wrapper">
                                    <input
                                        type="text"
                                        value={getReferralLink()}
                                        readOnly
                                        className="referral-input"
                                    />
                                    <button
                                        className="referral-copy-btn"
                                        onClick={() => copyToClipboard(getReferralLink(), 'Реферальная ссылка')}
                                    >
                                        📋 Копировать
                                    </button>
                                </div>
                            </div>

                            {/* Тестовая сделка */}
                            <div className="test-transaction-section">
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                    <input
                                        type="number"
                                        value={testTransactionAmount}
                                        onChange={(e) => setTestTransactionAmount(e.target.value)}
                                        placeholder="Сумма сделки"
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            border: '1px solid #ccc',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <button
                                        className="test-transaction-btn"
                                        onClick={testReferralTransaction}
                                    >
                                        🧪 Тест сделки
                                    </button>
                                </div>
                                <p className="test-transaction-note">
                                    Нажмите для демонстрации работы системы. Реферер получит 0.5% от суммы.
                                </p>
                            </div>

                            {/* История начислений */}
                            {earningsHistory.length > 0 && (
                                <div className="transactions-history-section">
                                    <h4>История начислений ({earningsHistory.length})</h4>
                                    <div className="transactions-list">
                                        {earningsHistory.slice(0, 5).map((earning, index) => (
                                            <div key={index} className="transaction-item">
                                                <div className="transaction-type">
                                                    👥 От реферала {earning.referral_id}
                                                </div>
                                                <div className="transaction-amount">
                                                    +{earning.your_earnings} ₽
                                                </div>
                                                <div className="transaction-date">
                                                    {new Date(earning.date).toLocaleDateString('ru-RU')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {earningsHistory.length > 5 && (
                                        <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', marginTop: '10px' }}>
                                            ... и еще {earningsHistory.length - 5} начислений
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Список рефералов */}
                            {referralList.length > 0 && (
                                <div className="referrals-list-section">
                                    <h4>Ваши рефералы ({referralList.length})</h4>
                                    <div className="referrals-list">
                                        {referralList.slice(0, 3).map((referral, index) => (
                                            <div key={index} className="referral-item">
                                                <span className="referral-id">
                                                    ID: {referral.referred_id}
                                                </span>
                                                <span className={`referral-status ${referral.status}`}>
                                                    {referral.status === 'active' ? '✅ Активен' : '⏳ Ожидание'}
                                                </span>
                                                <span className="referral-earned">
                                                    +{referral.your_earnings} ₽
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    {referralList.length > 3 && (
                                        <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', marginTop: '10px' }}>
                                            ... и еще {referralList.length - 3} рефералов
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Форма вывода */}
                            <div className="withdrawal-section">
                                <div className="withdrawal-info">
                                    <div className="withdrawal-icon">💰</div>
                                    <div className="withdrawal-details">
                                        <h4>Доступно для вывода</h4>
                                        <div className="withdrawal-amount">{referralStats.pendingEarned} ₽</div>
                                        <p className="withdrawal-note">Минимальная сумма: 100 ₽</p>
                                    </div>
                                </div>

                                <div className="withdrawal-form">
                                    <div className="form-group">
                                        <input
                                            type="number"
                                            value={withdrawAmount}
                                            onChange={(e) => setWithdrawAmount(e.target.value)}
                                            placeholder="Сумма для вывода"
                                            min="100"
                                            step="1"
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #ccc',
                                                borderRadius: '8px',
                                                fontSize: '14px'
                                            }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #ccc',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                backgroundColor: 'white'
                                            }}
                                        >
                                            <option value="">Выберите способ</option>
                                            <option value="bank_card">Банковская карта</option>
                                            <option value="yoomoney">ЮMoney</option>
                                            <option value="qiwi">QIWI</option>
                                            <option value="crypto">Криптовалюта</option>
                                        </select>
                                    </div>
                                    <button
                                        className="withdraw-button"
                                        onClick={handleWithdraw}
                                        disabled={!withdrawAmount || !paymentMethod || parseFloat(withdrawAmount) < 100}
                                        style={{
                                            width: '100%',
                                            padding: '15px',
                                            background: 'white',
                                            color: '#f5576c',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            opacity: (!withdrawAmount || !paymentMethod || parseFloat(withdrawAmount) < 100) ? 0.5 : 1
                                        }}
                                    >
                                        Запросить вывод
                                    </button>
                                </div>
                            </div>

                            {/* Информация */}
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
                            onClick={() => {
                                setShowReferral(true);
                                loadEarningsHistory();
                                loadReferralList();
                            }}
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
        </div>
    );
}

export default Profile;