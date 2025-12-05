import { useState, useEffect } from 'react';
import './Profile.css';

// Базовый URL API
const API_BASE_URL = 'http://87.242.106.114';

function Profile({ navigateTo }) {
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
        referral_total_amount: 0
    });
    const [referralList, setReferralList] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [earningsHistory, setEarningsHistory] = useState([]);

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
            const telegramUser = localStorage.getItem('telegramUser');
            if (telegramUser) {
                setTelegramData(JSON.parse(telegramUser));
            }

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

    const loadReferralStats = async () => {
        try {
            const userId = getUserId();
            if (!userId || userId === '—') return;
            
            const response = await fetch(`${API_BASE_URL}/api/referral/stats/${userId}`);
            const data = await response.json();
            
            if (data.success) {
                setReferralStats({
                    totalReferrals: data.data.total_referrals || 0,
                    activeReferrals: data.data.active_referrals || 0,
                    earned: data.data.earned || 0,
                    pendingEarned: data.data.pending_earned || 0,
                    referralLink: data.data.referral_link || getReferralLink(),
                    referralCode: data.data.referral_code || getReferralCode(),
                    referral_transactions: data.data.referral_transactions || 0,
                    referral_total_amount: data.data.referral_total_amount || 0
                });
            }
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
        }
    };

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
        }
    };

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

            const response = await fetch(`${API_BASE_URL}/api/referral/withdraw`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                loadReferralStats();
                loadWithdrawals();
            } else {
                showMessage('error', data.error || 'Ошибка при запросе выплаты');
            }
        } catch (error) {
            console.error('Ошибка запроса вывода:', error);
            showMessage('error', 'Ошибка сети');
        }
    };

    const testReferralTransaction = async () => {
        try {
            const userId = getUserId();
            const testAmount = 10000;
            
            showMessage('info', `Регистрирую тестовую сделку на ${testAmount} ₽...`);
            
            const response = await fetch(`${API_BASE_URL}/api/transaction/register`, {
                method: 'POST',
                headers: { 'Content-Type: 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    amount: testAmount,
                    currency: 'RUB',
                    type: 'exchange'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showMessage('success', 
                    data.data.commission 
                    ? `✅ Ваш реферер получил ${data.data.commission.amount} ₽ (0.5%)`
                    : '✅ Сделка зарегистрирована (нет реферера)'
                );
                
                loadReferralStats();
                loadEarningsHistory();
            } else {
                showMessage('error', data.error || 'Ошибка регистрации сделки');
            }
        } catch (error) {
            console.error('Ошибка регистрации сделки:', error);
            showMessage('error', 'Ошибка сети');
        }
    };

    const getUserId = () => {
        return telegramData?.id || userData?.id || '7879866656';
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

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
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
            {/* Хедер и основная информация */}
            <div className="profile-header-new">
                {/* ... существующий код хедера ... */}
            </div>

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
                                            <div className="earning-note">80% от заработанного</div>
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

                            {/* Кнопка тестовой сделки (для демо) */}
                            <div className="test-transaction-section">
                                <button 
                                    className="test-transaction-btn"
                                    onClick={testReferralTransaction}
                                >
                                    🧪 Тест: Зарегистрировать сделку
                                </button>
                                <p className="test-transaction-note">
                                    Нажмите для демонстрации работы системы. Если у вас есть реферер, он получит 0.5% от суммы.
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
                                                    👥 От {earning.referral_name}
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

                            {/* Информация о системе */}
                            <div className="referral-info">
                                <div className="info-icon">💡</div>
                                <div className="info-text">
                                    <strong>Как это работает:</strong> 
                                    <br/>1. Приглашайте друзей по вашей ссылке
                                    <br/>2. Когда они делают обмен USDT/RUB
                                    <br/>3. Вы получаете 0.5% от суммы каждой их сделки
                                    <br/>4. Выводите заработанные средства
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
                            {referralStats.earned > 0 && (
                                <span className="earned-badge">+{referralStats.earned} ₽</span>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;