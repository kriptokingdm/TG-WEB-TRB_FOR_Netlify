import { useState, useEffect } from 'react';
import './Profile.css';


// Отладка API подключения
console.log('🌐 Текущий хост:', window.location.hostname);
console.log('🔗 API URL:', API_BASE_URL);



  const API_BASE_URL = 'https://87.242.106.114';


function Profile({ navigateTo }) {
    console.log('🚀 Profile компонент загружен, API URL:', API_BASE_URL);

    const [userData, setUserData] = useState(null);
    const [telegramData, setTelegramData] = useState(null);
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

    useEffect(() => {
        loadUserData();
        loadReferralStats();
        loadReferralList();
        loadWithdrawals();
        loadEarningsHistory();

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
                console.log('📱 Telegram данные:', parsed);
            }

            // Загружаем данные приложения
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                setUserData(JSON.parse(savedUser));
            }
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
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

            // Тестовые данные для демонстрации
            setReferralStats({
                totalReferrals: 6,
                activeReferrals: 5,
                earned: 2750,
                pendingEarned: 2200,
                referralLink: getReferralLink(),
                referralCode: getReferralCode(),
                referral_transactions: 1,
                referral_total_amount: 50000,
                commission_percent: 0.5
            });
        }
    };

    // Загрузка списка рефералов
    const loadReferralList = async () => {
        try {
            const userId = getUserId();
            if (!userId || userId === '—') return;

            const response = await fetch(`${API_BASE_URL}/api/referral/list/${userId}`);
            const data = await response.json();

            if (data.success) {
                console.log('👥 Список рефералов:', data.data);
                setReferralList(data.data || []);
            }
        } catch (error) {
            console.error('Ошибка загрузки списка рефералов:', error);
            // Тестовые данные
            setReferralList([
                {
                    referred_id: "100000001",
                    status: "active",
                    bonus_earned: 500,
                    created_at: new Date().toISOString(),
                    your_earnings: 500
                },
                {
                    referred_id: "100000002",
                    status: "active",
                    bonus_earned: 750,
                    created_at: new Date().toISOString(),
                    your_earnings: 750
                }
            ]);
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

            const response = await fetch(`${API_BASE_URL}/api/referral/earnings/${userId}`);
            const data = await response.json();

            if (data.success) {
                setEarningsHistory(data.data || []);
            }
        } catch (error) {
            console.error('Ошибка загрузки истории начислений:', error);
            // Тестовые данные
            setEarningsHistory([
                {
                    referral_id: "100000001",
                    transaction_amount: 50000,
                    currency: "RUB",
                    your_earnings: 250,
                    percent: 0.5,
                    date: new Date().toISOString(),
                    message: "0.5% от сделки 50000 RUB"
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
                loadReferralStats();
                loadEarningsHistory();
                loadReferralList();
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
                loadReferralStats();
                loadWithdrawals();
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
        // Пробуем разные варианты
        const telegramId = telegramData?.id;
        const userId = userData?.id;

        // Для теста используем ID админа
        const result = telegramId || userId || '7879866656';
        console.log('🆔 Определен ID пользователя:', result);
        return result;
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
                        <div className="profile-avatar-fallback">
                            👤
                        </div>
                    </div>

                    <div className="profile-info-section">
                        <h2 className="profile-display-name">Администратор</h2>
                        {/* <p className="profile-username">ID: {getUserId()}</p> */}

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
                                <h4>Детальная статистика</h4>
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
                                    <h4>История начислений</h4>
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
                                                    {new Date(earning.date).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
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
                                        />
                                    </div>
                                    <div className="form-group">
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
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
                    <h1> </h1>
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
            {/* Навигация */}
            <div className="bottom-nav">
                <button className="nav-item active">
                    <span className="nav-icon">💸</span>
                    <span className="nav-label">Обмен</span>
                </button>

                <button className="nav-item" onClick={() => navigateTo('/profile')}>
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