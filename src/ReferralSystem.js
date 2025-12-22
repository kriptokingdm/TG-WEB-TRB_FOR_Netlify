import React, { useState, useEffect } from 'react';
import './ReferralSystem.css';
import { API_BASE_URL } from './config';

const ReferralSystem = () => {
    const [referralData, setReferralData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawing, setWithdrawing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState('overview'); // overview, referrals, earnings, withdrawals

    // Получение ID пользователя
    const getUserId = () => {
        try {
            let userId = null;
            
            if (window.Telegram?.WebApp) {
                const tg = window.Telegram.WebApp;
                const tgUser = tg.initDataUnsafe?.user;
                if (tgUser?.id) {
                    userId = tgUser.id.toString();
                }
            }
            
            if (!userId) {
                const savedUser = localStorage.getItem('currentUser');
                if (savedUser) {
                    const parsed = JSON.parse(savedUser);
                    userId = (parsed.id || parsed.telegramId)?.toString();
                }
            }
            
            return userId ? userId.replace(/^user_/, '') : '7879866656';
        } catch (error) {
            console.error('Ошибка получения ID:', error);
            return '7879866656';
        }
    };

    // Загрузка реферальных данных
    const loadReferralData = async () => {
        setLoading(true);
        try {
            const userId = getUserId();
            const response = await fetch(`${API_BASE_URL}/api/referrals/info/${userId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                setReferralData(result.data);
                setError('');
            } else {
                throw new Error(result.error || 'Ошибка загрузки данных');
            }
        } catch (error) {
            console.error('Ошибка загрузки реферальных данных:', error);
            setError('Не удалось загрузить данные');
        } finally {
            setLoading(false);
        }
    };

    // Запрос на вывод средств
    const handleWithdraw = async () => {
        if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
            alert('Введите корректную сумму');
            return;
        }

        setWithdrawing(true);
        try {
            const userId = getUserId();
            const response = await fetch(`${API_BASE_URL}/api/referrals/withdraw`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userId,
                    amount: parseFloat(withdrawAmount)
                })
            });

            const result = await response.json();
            
            if (result.success) {
                alert('✅ Запрос на вывод успешно создан! Средства будут переведены в течение 24 часов.');
                setWithdrawAmount('');
                loadReferralData();
            } else {
                alert(`❌ ${result.error}`);
            }
        } catch (error) {
            console.error('Ошибка вывода:', error);
            alert('❌ Ошибка при запросе вывода');
        } finally {
            setWithdrawing(false);
        }
    };

    // Копирование реферальной ссылки
    const copyReferralLink = () => {
        if (referralData?.referral_link) {
            navigator.clipboard.writeText(referralData.referral_link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Форматирование чисел
    const formatNumber = (num) => {
        return parseFloat(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    };

    // Форматирование даты
    const formatDate = (dateString) => {
        if (!dateString) return '—';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (e) {
            return '—';
        }
    };

    // Инициализация
    useEffect(() => {
        loadReferralData();
        
        // Обновление каждые 30 секунд
        const interval = setInterval(loadReferralData, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="referral-loading">
                <div className="spinner"></div>
                <p>Загрузка реферальной системы...</p>
            </div>
        );
    }

    if (error && !referralData) {
        return (
            <div className="referral-error">
                <div className="error-icon">⚠️</div>
                <h3>Ошибка загрузки</h3>
                <p>{error}</p>
                <button onClick={loadReferralData}>Повторить</button>
            </div>
        );
    }

    const stats = referralData?.stats || {};
    const canWithdraw = referralData?.can_withdraw && stats.available_earnings >= (referralData?.min_withdrawal || 500);

    return (
        <div className="referral-system">
            {/* Заголовок */}
            <div className="referral-header">
                <h1 className="referral-title">💰 Реферальная система</h1>
                <p className="referral-subtitle">Приглашайте друзей и зарабатывайте 1% с каждой их сделки!</p>
            </div>

            {/* Основные статистики */}
            <div className="referral-stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.total_referrals || 0}</div>
                        <div className="stat-label">Всего рефералов</div>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <div className="stat-value">{formatNumber(stats.total_earnings)} ₽</div>
                        <div className="stat-label">Всего заработано</div>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">💳</div>
                    <div className="stat-content">
                        <div className="stat-value">{formatNumber(stats.available_earnings)} ₽</div>
                        <div className="stat-label">Доступно</div>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">🏦</div>
                    <div className="stat-content">
                        <div className="stat-value">{formatNumber(stats.withdrawn_earnings)} ₽</div>
                        <div className="stat-label">Выведено</div>
                    </div>
                </div>
            </div>

            {/* Реферальная ссылка */}
            <div className="referral-link-card">
                <div className="link-header">
                    <h3>📤 Ваша реферальная ссылка</h3>
                    <span className="commission-badge">{stats.commission_rate || 1}% комиссия</span>
                </div>
                
                <div className="link-input-group">
                    <input 
                        type="text" 
                        value={referralData?.referral_link || ''}
                        readOnly
                        className="link-input"
                    />
                    <button 
                        onClick={copyReferralLink}
                        className={`copy-btn ${copied ? 'copied' : ''}`}
                    >
                        {copied ? '✅ Скопировано' : '📋 Копировать'}
                    </button>
                </div>
                
                <div className="link-info">
                    <p>Отправьте эту ссылку друзьям. Когда они зарегистрируются и совершат сделку, вы получите {stats.commission_rate || 1}% от суммы их сделки!</p>
                </div>
            </div>

            {/* Вывод средств */}
            <div className="withdrawal-card">
                <h3>🏦 Вывод средств</h3>
                
                <div className="withdrawal-info">
                    <div className="info-row">
                        <span>Доступно для вывода:</span>
                        <span className="amount-available">{formatNumber(stats.available_earnings)} ₽</span>
                    </div>
                    
                    <div className="info-row">
                        <span>Минимальная сумма:</span>
                        <span>{formatNumber(referralData?.min_withdrawal || 500)} ₽</span>
                    </div>
                    
                    <div className="info-row">
                        <span>Когда можно выводить:</span>
                        <span className="highlight">Каждое воскресенье в 12:00 по МСК</span>
                    </div>
                    
                    {referralData?.next_withdrawal && (
                        <div className="info-row">
                            <span>Следующий вывод:</span>
                            <span>{referralData.next_withdrawal}</span>
                        </div>
                    )}
                    
                    {referralData?.withdrawal && (
                        <div className="info-row warning">
                            <span>Текущий запрос:</span>
                            <span>{formatNumber(referralData.withdrawal.amount)} ₽ - {referralData.withdrawal.status === 'pending' ? '⏳ Ожидает' : '✅ Выплачено'}</span>
                        </div>
                    )}
                </div>
                
                {canWithdraw && (
                    <div className="withdrawal-form">
                        <input
                            type="number"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            placeholder={`Введите сумму (мин. ${formatNumber(referralData?.min_withdrawal || 500)} ₽)`}
                            min={referralData?.min_withdrawal || 500}
                            max={stats.available_earnings}
                            className="withdraw-input"
                        />
                        <button
                            onClick={handleWithdraw}
                            disabled={withdrawing || !withdrawAmount || parseFloat(withdrawAmount) < (referralData?.min_withdrawal || 500)}
                            className="withdraw-btn"
                        >
                            {withdrawing ? 'Обработка...' : 'Запросить вывод'}
                        </button>
                    </div>
                )}
                
                {!canWithdraw && stats.available_earnings > 0 && (
                    <div className="withdrawal-warning">
                        ⚠️ Вывод доступен только в воскресенье в 12:00 по МСК
                    </div>
                )}
            </div>

            {/* Навигация по вкладкам */}
            <div className="referral-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'referrals' ? 'active' : ''}`}
                    onClick={() => setActiveTab('referrals')}
                >
                    👥 Рефералы
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'earnings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('earnings')}
                >
                    💰 Начисления
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'withdrawals' ? 'active' : ''}`}
                    onClick={() => setActiveTab('withdrawals')}
                >
                    🏦 Выводы
                </button>
            </div>

            {/* Содержимое вкладок */}
            <div className="tab-content">
                {activeTab === 'referrals' && (
                    <div className="referrals-list">
                        <h4>Ваши рефералы</h4>
                        {referralData?.referrals?.length > 0 ? (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Пользователь</th>
                                            <th>Дата регистрации</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {referralData.referrals.map((ref, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <div className="user-info">
                                                        <span className="user-name">
                                                            {ref.referee_first_name || ref.referee_username || 'Аноним'}
                                                        </span>
                                                        {ref.referee_username && (
                                                            <span className="user-username">@{ref.referee_username}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>{formatDate(ref.created_at)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-list">
                                <p>У вас еще нет рефералов. Поделитесь своей ссылкой!</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'earnings' && (
                    <div className="earnings-list">
                        <h4>История начислений</h4>
                        {referralData?.earnings?.length > 0 ? (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID сделки</th>
                                            <th>Сумма сделки</th>
                                            <th>Ваша комиссия</th>
                                            <th>Дата</th>
                                            <th>Статус</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {referralData.earnings.map((earning, index) => (
                                            <tr key={index}>
                                                <td className="order-id">#{earning.order_id?.substring(0, 8)}...</td>
                                                <td>{formatNumber(earning.amount)} {earning.order_type === 'buy' ? 'RUB' : 'USDT'}</td>
                                                <td className="commission-amount">
                                                    <strong>{formatNumber(earning.commission)} ₽</strong>
                                                </td>
                                                <td>{formatDate(earning.created_at)}</td>
                                                <td>
                                                    <span className={`status-badge status-${earning.status}`}>
                                                        {earning.status === 'available' ? '✅ Доступно' : 
                                                         earning.status === 'paid' ? '🏦 Выплачено' : '⏳ Ожидание'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-list">
                                <p>Начислений пока нет. Приглашайте друзей!</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'withdrawals' && (
                    <div className="withdrawals-list">
                        <h4>История выводов</h4>
                        {/* Можно добавить дополнительную загрузку истории */}
                        <div className="empty-list">
                            <p>Для загрузки полной истории выводов требуется отдельный запрос.</p>
                            <button 
                                onClick={() => alert('Функция в разработке')}
                                className="load-more-btn"
                            >
                                Загрузить историю
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Информационный блок */}
            <div className="info-card">
                <h4>📚 Как это работает</h4>
                <ul className="info-list">
                    <li>1. Делитесь своей реферальной ссылкой с друзьями</li>
                    <li>2. Друг регистрируется по вашей ссылке и совершает сделку</li>
                    <li>3. Вы получаете 1% от суммы каждой сделки реферала</li>
                    <li>4. Выводите заработанные средства каждое воскресенье в 12:00 по МСК</li>
                    <li>5. Минимальная сумма для вывода: 500 ₽</li>
                </ul>
            </div>
        </div>
    );
};

export default ReferralSystem;