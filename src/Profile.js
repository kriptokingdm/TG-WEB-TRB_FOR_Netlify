import { useState, useEffect } from 'react';
import './Profile.css';


const [testTransactionAmount, setTestTransactionAmount] = useState('10000');
const testReferralTransaction = async () => {
    try {
        const userId = getUserId();
        const amount = parseFloat(testTransactionAmount) || 10000;

        const response = await fetch(`${API_BASE_URL}/api/transaction/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                amount: amount,
                currency: 'RUB',
                type: 'exchange'
            })
        });

        const data = await response.json();

        if (data.success) {
            alert(`✅ Сделка зарегистрирована!\nВаш реферер получил: ${data.data.commission?.amount || 0} ₽ (0.5%)`);
            // Обновляем статистику
            loadReferralStats();
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('❌ Ошибка регистрации сделки');
    }
};
// Базовый URL твоего API
const API_BASE_URL = 'http://87.242.106.114';

function Profile({ navigateTo }) {
    console.log('🚀 Компонент Profile загружен');
    console.log('🌐 API_BASE_URL:', API_BASE_URL);

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
        // НОВЫЕ ПОЛЯ:
        total_earned: 0,
        transaction_earnings: 0,
        total_transactions: 0,
        user_commission: 0.5
    });
    const [referralList, setReferralList] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [transactionHistory, setTransactionHistory] = useState([]);
    const [userBalance, setUserBalance] = useState({
        fromReferrals: 0,
        fromTransactions: 0,
        total: 0,
        available: 0
    });

    useEffect(() => {
        loadUserData();
        loadReferralStats();
        loadReferralList();
        loadWithdrawals();
        loadTransactionHistory();
        loadUserBalance();

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

    // Загрузка статистики рефералов с сервера
    const loadReferralStats = async () => {
        try {
            const userId = getUserId();
            console.log('🆔 ID пользователя для запроса:', userId);

            if (!userId || userId === '—') {
                console.warn('⚠️ ID пользователя не найден');
                return;
            }

            console.log('📡 Запрашиваю API по адресу:', `${API_BASE_URL}/api/referral/stats/${userId}`);

            const response = await fetch(`${API_BASE_URL}/api/referral/stats/${userId}`);
            console.log('📊 Ответ API:', response.status);

            if (!response.ok) {
                throw new Error(`API ответил с ошибкой: ${response.status}`);
            }

            const data = await response.json();
            console.log('📋 Данные статистики:', data);

            if (data.success) {
                const newStats = {
                    totalReferrals: data.data.total_referrals || 0,
                    activeReferrals: data.data.active_referrals || 0,
                    earned: data.data.earned || 0,
                    pendingEarned: data.data.pending_earned || 0,
                    referralLink: data.data.referral_link || getReferralLink(),
                    referralCode: data.data.referral_code || getReferralCode(),
                    // НОВЫЕ ПОЛЯ:
                    referral_transactions: data.data.referral_transactions || 0,
                    referral_total_amount: data.data.referral_total_amount || 0,
                    commission_percent: data.data.commission_percent || 0.5
                };

                console.log('✅ Обновление статистики:', newStats);
                setReferralStats(newStats);
            } else {
                console.error('❌ API вернул success: false', data);
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки статистики рефералов:', error);

            // Используем локальные данные при ошибке
            try {
                const stats = JSON.parse(localStorage.getItem('referralStats') || '{}');

                if (Object.keys(stats).length === 0) {
                    const initialStats = {
                        totalReferrals: 4,
                        activeReferrals: 3,
                        earned: 2250,
                        pendingEarned: 1800,
                        referralLink: getReferralLink(),
                        referralCode: getReferralCode(),
                        commission: 10,
                        total_earned: 3500,
                        transaction_earnings: 1250,
                        total_transactions: 5,
                        user_commission: 0.5
                    };
                    localStorage.setItem('referralStats', JSON.stringify(initialStats));
                    setReferralStats(initialStats);
                    console.log('📝 Использую начальные данные');
                } else {
                    setReferralStats(stats);
                    console.log('📝 Использую данные из localStorage:', stats);
                }
            } catch (localError) {
                console.error('❌ Ошибка загрузки локальной статистики:', localError);
            }
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
                setReferralList(data.data || []);
            }
        } catch (error) {
            console.error('Ошибка загрузки списка рефералов:', error);
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

    // Загрузка истории транзакций
    const loadTransactionHistory = async () => {
        try {
            const userId = getUserId();
            if (!userId || userId === '—') return;

            const response = await fetch(`${API_BASE_URL}/api/transaction/history/${userId}`);
            const data = await response.json();

            if (data.success) {
                setTransactionHistory(data.data || []);
            }
        } catch (error) {
            console.error('Ошибка загрузки истории транзакций:', error);
        }
    };

    // Загрузка баланса пользователя
    const loadUserBalance = async () => {
        try {
            const userId = getUserId();
            if (!userId || userId === '—') return;

            const response = await fetch(`${API_BASE_URL}/api/user/balance/${userId}`);
            const data = await response.json();

            if (data.success) {
                setUserBalance({
                    fromReferrals: data.data.earnings.from_referrals || 0,
                    fromTransactions: data.data.earnings.from_transactions || 0,
                    total: data.data.earnings.total || 0,
                    available: data.data.available_for_withdrawal || 0
                });
            }
        } catch (error) {
            console.error('Ошибка загрузки баланса:', error);
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

            if (parseFloat(withdrawAmount) < 100) {
                showMessage('error', 'Минимальная сумма вывода: 100 ₽');
                return;
            }

            if (parseFloat(withdrawAmount) > referralStats.pendingEarned) {
                showMessage('error', 'Недостаточно средств для вывода');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/referral/withdraw`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userId,
                    amount: parseFloat(withdrawAmount),
                    paymentMethod: paymentMethod
                })
            });

            const data = await response.json();

            if (data.success) {
                showMessage('success', 'Запрос на вывод успешно отправлен!');
                setWithdrawAmount('');
                setPaymentMethod('');

                // Обновляем данные
                loadReferralStats();
                loadWithdrawals();
                loadUserBalance();
            } else {
                showMessage('error', data.error || 'Ошибка при запросе выплаты');
            }
        } catch (error) {
            console.error('Ошибка запроса вывода:', error);
            showMessage('error', 'Ошибка сети');
        }
    };

    // Регистрация тестовой сделки (для демонстрации)
    const registerTestTransaction = async () => {
        try {
            const userId = getUserId();
            if (!userId || userId === '—') return;

            // Генерируем случайную сумму от 1000 до 10000
            const randomAmount = Math.floor(Math.random() * 9000) + 1000;

            showMessage('info', `Регистрирую тестовую сделку на ${randomAmount} ₽...`);

            const response = await fetch(`${API_BASE_URL}/api/transaction/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userId,
                    amount: randomAmount,
                    currency: 'RUB',
                    type: 'exchange'
                })
            });

            const data = await response.json();

            if (data.success) {
                showMessage('success',
                    `✅ Сделка зарегистрирована!\n` +
                    `💰 Вам начислено: ${data.data.commission.amount} ₽ (0.5%)\n` +
                    `👥 Рефереру: ${data.data.referral?.bonus_amount || 0} ₽`
                );

                // Обновляем данные
                loadReferralStats();
                loadTransactionHistory();
                loadUserBalance();
                loadReferralList();
            } else {
                showMessage('error', data.error || 'Ошибка регистрации сделки');
            }
        } catch (error) {
            console.error('Ошибка регистрации сделки:', error);
            showMessage('error', 'Ошибка сети');
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
        console.log('🔍 Поиск ID пользователя:');
        console.log('- Telegram данные:', telegramData);
        console.log('- User данные:', userData);

        // Пробуем разные варианты
        const telegramId = telegramData?.id;
        const userId = userData?.id;
        const telegramIdFromData = userData?.telegramId;

        console.log('- telegramId:', telegramId);
        console.log('- userId:', userId);
        console.log('- telegramIdFromData:', telegramIdFromData);

        // Возвращаем первый найденный ID
        const result = telegramId || userId || telegramIdFromData || '7879866656'; // fallback
        console.log('✅ Найден ID:', result);

        return result;
    };

    // Генерация реферальной ссылки
    const getReferralLink = () => {
        const userId = getUserId();
        if (referralStats.referralLink) {
            return referralStats.referralLink;
        }
        // ПРАВИЛЬНЫЙ БОТ!
        return `https://t.me/TetherRabbitBot?start=ref_${userId}`;
    };

    const getReferralCode = () => {
        const userId = getUserId();
        if (referralStats.referralCode) {
            return referralStats.referralCode;
        }
        return `REF-${String(userId).slice(-6).toUpperCase()}`;
    };

    // Функция для копирования реферальной ссылки
    const copyReferralLink = () => {
        const link = getReferralLink();
        copyToClipboard(link, 'Реферальная ссылка');

        // Поделиться в Telegram если доступно
        if (navigator.share && window.Telegram?.WebApp) {
            navigator.share({
                title: 'Присоединяйся к обменнику!',
                text: `Обменивай криптовалюту по лучшим курсам. Используй мою реферальную ссылку для получения бонусов!`,
                url: link,
            });
        }
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
                            <p className="referral-subtitle">Приглашайте друзей и получайте 0.5% от каждой их сделки</p>
                        </div>
                    </div>

                    // Заменить блок referral-stats на:
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
                            {/* Детальная статистика заработка */}
                            <div className="detailed-earnings-section">
                                <h4>Детальная статистика заработка</h4>
                                <div className="earnings-breakdown">
                                    <div className="earning-source">
                                        <div className="earning-icon">👥</div>
                                        <div className="earning-details">
                                            <div className="earning-title">От рефералов</div>
                                            <div className="earning-amount">{referralStats.earned || 0} ₽</div>
                                            <div className="earning-note">10% от сделок рефералов</div>
                                        </div>
                                    </div>

                                    <div className="earning-source">
                                        <div className="earning-icon">💸</div>
                                        <div className="earning-details">
                                            <div className="earning-title">От ваших сделок</div>
                                            <div className="earning-amount">{referralStats.transaction_earnings || 0} ₽</div>
                                            <div className="earning-note">0.5% от каждой вашей сделки</div>
                                        </div>
                                    </div>

                                    <div className="earning-source total">
                                        <div className="earning-icon">💰</div>
                                        <div className="earning-details">
                                            <div className="earning-title">Всего заработано</div>
                                            <div className="earning-amount">{referralStats.total_earned || 0} ₽</div>
                                            <div className="earning-note">Доступно для вывода: {referralStats.pendingEarned || 0} ₽</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

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
                                        📋 Копировать
                                    </button>
                                    {window.Telegram?.WebApp && (
                                        <button
                                            className="referral-share-btn"
                                            onClick={() => {
                                                window.Telegram.WebApp.openTelegramLink(getReferralLink());
                                            }}
                                        >
                                            🔗 Открыть в Telegram
                                        </button>
                                    )}
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
                                        📋 Копировать
                                    </button>
                                </div>
                            </div>

                            {/* Кнопка для тестовой сделки */}
                            <div className="test-transaction-section">
                                <button
                                    className="test-transaction-btn"
                                    onClick={registerTestTransaction}
                                >
                                    🧪 Зарегистрировать тестовую сделку
                                </button>
                                <p className="test-transaction-note">
                                    Нажмите для симуляции сделки. Вам начислится 0.5%, а вашему рефереру - 10% от вашей комиссии.
                                </p>
                            </div>

                            {/* История транзакций */}
                            {transactionHistory.length > 0 && (
                                <div className="transactions-history-section">
                                    <h4>История начислений</h4>
                                    <div className="transactions-list">
                                        {transactionHistory.slice(0, 5).map((transaction, index) => (
                                            <div key={index} className="transaction-item">
                                                <div className="transaction-type">
                                                    {transaction.type === 'exchange' ? '🔄 Обмен' : '💰 Начисление'}
                                                </div>
                                                <div className="transaction-amount">
                                                    +{transaction.total_earned || transaction.commission || 0} ₽
                                                </div>
                                                <div className="transaction-date">
                                                    {new Date(transaction.date).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Доступно для вывода */}
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

                            {/* Список рефералов */}
                            {referralList.length > 0 && (
                                <div className="referrals-list-section">
                                    <h4>Ваши рефералы</h4>
                                    <div className="referrals-list">
                                        {referralList.map((referral, index) => (
                                            <div key={index} className="referral-item">
                                                <div className="referral-id">ID: {referral.referred_id}</div>
                                                <div className="referral-status">{referral.status}</div>
                                                <div className="referral-earned">+{referral.bonus_earned} ₽</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* История выводов */}
                            {withdrawals.length > 0 && (
                                <div className="withdrawals-history-section">
                                    <h4>История выводов</h4>
                                    <div className="withdrawals-list">
                                        {withdrawals.map((withdrawal, index) => (
                                            <div key={index} className="withdrawal-item">
                                                <div className="withdrawal-amount">{withdrawal.amount} ₽</div>
                                                <div className={`withdrawal-status status-${withdrawal.status}`}>
                                                    {withdrawal.status === 'pending' ? 'Ожидает' :
                                                        withdrawal.status === 'completed' ? 'Выплачено' : 'Отклонено'}
                                                </div>
                                                <div className="withdrawal-date">
                                                    {new Date(withdrawal.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="referral-info">
                                <div className="info-icon">💡</div>
                                <div className="info-text">
                                    <strong>Как это работает:</strong> Приглашайте друзей по ссылке.
                                    Вы получаете <strong>0.5%</strong> от суммы каждой сделки ваших рефералов.
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
                            {referralStats.total_earned > 0 && (
                                <span className="earned-badge">+{referralStats.total_earned} ₽</span>
                            )}
                        </button>
                    )}
                </div>

                {/* Настройки */}


                {/* Опасная зона */}
            </div>



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