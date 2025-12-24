import React, { useState, useEffect } from 'react';
import './ReferralSystem.css';

const API_BASE_URL = 'https://tethrab.shop';

const ReferralSystem = ({ onClose, showMessage }) => {
    const [referralData, setReferralData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawing, setWithdrawing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState('referrals');

    // Получение ID пользователя
    const getUserId = () => {
        try {
            if (window.Telegram?.WebApp) {
                const tg = window.Telegram.WebApp;
                const tgUser = tg.initDataUnsafe?.user;
                if (tgUser?.id) return tgUser.id.toString();
            }

            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                const parsed = JSON.parse(savedUser);
                return parsed.telegramId?.toString() || parsed.id?.toString();
            }

            return '7879866656';
        } catch (error) {
            console.error('❌ Ошибка получения ID:', error);
            return '7879866656';
        }
    };

    // Форматирование чисел в USD
    const formatUSD = (num) => {
        const value = parseFloat(num || 0);
        return `$${value.toFixed(2)}`;
    };

    // Форматирование даты
    const formatDate = (dateString) => {
        if (!dateString) return '—';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return '—';
        }
    };

    // Загрузка реферальных данных
    const loadReferralData = async () => {
        setLoading(true);
        try {
            const userId = getUserId();
            const response = await fetch(`${API_BASE_URL}/api/referrals/info/${userId}`);

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // УБИРАЕМ ДУБЛИКАТЫ из referrals
                    const uniqueReferrals = result.data.referrals ? 
                        Array.from(new Map(result.data.referrals.map(ref => [ref.referred_id, ref])).values()) : [];
                    
                    setReferralData({
                        ...result.data,
                        referrals: uniqueReferrals
                    });
                } else {
                    showMessage('error', result.error || 'Ошибка загрузки данных');
                }
            } else {
                throw new Error('Ошибка сети');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки:', error);
            showMessage('error', 'Не удалось загрузить данные');
        } finally {
            setLoading(false);
        }
    };

    // Копирование реферальной ссылки
    const copyReferralLink = () => {
        if (referralData?.referral_link) {
            navigator.clipboard.writeText(referralData.referral_link);
            setCopied(true);
            showMessage('success', 'Ссылка скопирована в буфер');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Запрос на вывод средств
    const handleWithdraw = async () => {
        if (!withdrawAmount || parseFloat(withdrawAmount) < 10) {
            showMessage('error', 'Минимальная сумма вывода: $10');
            return;
        }

        if (parseFloat(withdrawAmount) > parseFloat(referralData?.stats.available_earnings || 0)) {
            showMessage('error', 'Недостаточно средств для вывода');
            return;
        }

        setWithdrawing(true);
        try {
            const userId = getUserId();
            const response = await fetch(`${API_BASE_URL}/api/referrals/withdraw`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    userId: userId,
                    amount: withdrawAmount
                })
            });

            const result = await response.json();

            if (result.success) {
                showMessage('success',
                    `✅ Запрос на вывод создан\n\n` +
                    `💰 Сумма: $${parseFloat(withdrawAmount).toFixed(2)}\n` +
                    `📅 ID запроса: ${result.withdrawal?.id || 'не указан'}\n` +
                    `⏳ Ожидайте выплаты в течение 24 часов`
                );

                setWithdrawAmount('');
                setTimeout(() => {
                    loadReferralData();
                }, 1500);
            } else {
                let errorMessage = result.error || 'Ошибка вывода';
                if (errorMessage.includes('Недостаточно средств')) {
                    errorMessage += `\nДоступно: $${referralData?.stats.available_earnings.toFixed(2)}`;
                } else if (errorMessage.includes('активный запрос')) {
                    errorMessage += '\nДождитесь обработки текущего запроса';
                }
                showMessage('error', errorMessage);
            }
        } catch (error) {
            console.error('❌ Ошибка вывода:', error);
            showMessage('error',
                `Ошибка соединения: ${error.message}\n\n` +
                'Проверьте интернет-соединение и попробуйте снова.'
            );
        } finally {
            setWithdrawing(false);
        }
    };

    // Инициализация
    useEffect(() => {
        loadReferralData();
    }, []);

    if (loading) {
        return (
            <div className="referral-container">
                <div className="referral-loading">
                    <div className="loading-spinner"></div>
                    <div className="loading-text">Загрузка данных...</div>
                </div>
            </div>
        );
    }

    const stats = referralData?.stats || {};
    const canWithdraw = stats.available_earnings >= 10;

    // Получаем уникальные рефералы (на всякий случай)
    const uniqueReferrals = referralData?.referrals ? 
        Array.from(new Map(referralData.referrals.map(ref => [ref.referred_id, ref])).values()) : [];

    return (
        <div className="referral-container">
            {/* ЗАГОЛОВОК - УПРОЩЕННЫЙ */}
            <div className="referral-section">
                <div className="section-card">
                    <div className="card-header">
                        <div className="card-title">Реферальная система</div>
                        <div className="card-subtitle">Приглашайте друзей и зарабатывайте 1% с их сделок</div>
                    </div>
                    
                    {/* Краткая статистика */}
                    <div className="referral-stats">
                        <div className="stat-item">
                            <div className="stat-value">{stats.total_referrals || 0}</div>
                            <div className="stat-label">Рефералов</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">{formatUSD(stats.total_earnings)}</div>
                            <div className="stat-label">Заработано</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">{formatUSD(stats.available_earnings)}</div>
                            <div className="stat-label">Доступно</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Реферальная ссылка */}
            <div className="referral-section">
                <div className="section-card">
                    <div className="card-header">
                        <div className="card-title">Ваша реферальная ссылка</div>
                        <div className="card-subtitle">Поделитесь с друзьями и получайте 1% комиссии</div>
                    </div>
                    <div className="link-container">
                        <input
                            type="text"
                            value={referralData?.referral_link || ''}
                            readOnly
                            className="link-input"
                            onClick={copyReferralLink}
                        />
                        <button
                            className={`copy-btn ${copied ? 'copied' : ''}`}
                            onClick={copyReferralLink}
                        >
                            {copied ? '✅ Скопировано' : '📋 Копировать'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Вывод средств */}
            <div className="referral-section">
                <div className="section-card">
                    <div className="card-header">
                        <div className="card-title">Вывод средств</div>
                    </div>
                    
                    <div className="balance-info">
                        <div className="balance-label">Доступно для вывода</div>
                        <div className="balance-value">{formatUSD(stats.available_earnings)}</div>
                    </div>

                    {canWithdraw ? (
                        <div className="withdraw-form">
                            <div className="input-group">
                                <span className="currency-symbol">$</span>
                                <input
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    placeholder="10"
                                    min="10"
                                    max={stats.available_earnings}
                                    step="0.01"
                                    className="withdraw-input"
                                />
                            </div>
                            <button
                                onClick={handleWithdraw}
                                disabled={withdrawing || !withdrawAmount || parseFloat(withdrawAmount) < 10}
                                className="withdraw-btn"
                            >
                                {withdrawing ? (
                                    <>
                                        <span className="spinner-small"></span>
                                        <span>Обработка...</span>
                                    </>
                                ) : 'Запросить вывод'}
                            </button>
                        </div>
                    ) : stats.available_earnings > 0 ? (
                        <div className="withdraw-notice">
                            Необходимо накопить минимум $10 для вывода
                        </div>
                    ) : null}

                    <div className="withdraw-info">
                        <div className="info-row">
                            <div className="info-label">Минимальный вывод:</div>
                            <div className="info-value">$10</div>
                        </div>
                        <div className="info-row">
                            <div className="info-label">Когда можно выводить:</div>
                            <div className="info-value highlight">Доступно в любое время</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ВКЛАДКИ */}
            <div className="referral-section">
                <div className="tabs-container">
                    <div className="tabs-header">
                        <button
                            className={`tab-btn ${activeTab === 'referrals' ? 'active' : ''}`}
                            onClick={() => setActiveTab('referrals')}
                        >
                            Рефералы
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'earnings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('earnings')}
                        >
                            Начисления
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'withdrawals' ? 'active' : ''}`}
                            onClick={() => setActiveTab('withdrawals')}
                        >
                            Выводы
                        </button>
                    </div>

                    <div className="tab-content">
                        {/* ВКЛАДКА: РЕФЕРАЛЫ */}
                        {activeTab === 'referrals' && (
                            <div className="tab-pane">
                                <div className="tab-title">Ваши рефералы ({uniqueReferrals.length})</div>
                                {uniqueReferrals.length > 0 ? (
                                    <div className="referrals-list">
                                        {uniqueReferrals.map((ref, index) => (
                                            <div className="referral-item" key={ref.referred_id || index}>
                                                <div className="referral-header">
                                                    <div className="referral-avatar">
                                                        {ref.first_name?.[0]?.toUpperCase() || 
                                                         ref.username?.[0]?.toUpperCase() || 'U'}
                                                    </div>
                                                    <div className="referral-info">
                                                        <div className="referral-name">
                                                            {ref.first_name || ref.username || 'Пользователь'}
                                                        </div>
                                                        {ref.username && (
                                                            <div className="referral-username">@{ref.username}</div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="referral-details">
                                                    <div className="detail-row">
                                                        <div className="detail-label">Дата регистрации:</div>
                                                        <div className="detail-value">
                                                            {formatDate(ref.referral_date || ref.created_at)}
                                                        </div>
                                                    </div>
                                                    <div className="detail-row">
                                                        <div className="detail-label">Статус:</div>
                                                        <div className={`detail-value ${ref.status === 'active' ? 'active' : 'inactive'}`}>
                                                            {ref.status === 'active' ? '✅ Активен' : '❌ Неактивен'}
                                                        </div>
                                                    </div>
                                                    <div className="detail-row">
                                                        <div className="detail-label">Заработано:</div>
                                                        <div className="detail-value earnings">
                                                            ${(ref.bonus_earned || 0).toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-icon">👥</div>
                                        <div className="empty-title">У вас еще нет рефералов</div>
                                        <div className="empty-subtitle">Поделитесь своей реферальной ссылкой с друзьями</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ВКЛАДКА: НАЧИСЛЕНИЯ */}
                        {activeTab === 'earnings' && (
                            <div className="tab-pane">
                                <div className="tab-title">История начислений</div>
                                {referralData?.earnings?.length > 0 ? (
                                    <div className="earnings-list">
                                        {referralData.earnings.map((earning, index) => (
                                            <div className="earning-item" key={earning.order_id || index}>
                                                <div className="earning-header">
                                                    <div className="earning-icon">💰</div>
                                                    <div className="earning-info">
                                                        <div className="earning-title">Комиссия с ордера</div>
                                                        <div className="earning-subtitle">
                                                            #{earning.order_id?.substring(0, 8) || 'неизвестный'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="earning-details">
                                                    <div className="detail-row">
                                                        <div className="detail-label">Дата:</div>
                                                        <div className="detail-value">
                                                            {formatDate(earning.created_at)}
                                                        </div>
                                                    </div>
                                                    <div className="detail-row">
                                                        <div className="detail-label">Сумма:</div>
                                                        <div className="detail-value amount">
                                                            ${(earning.commission || 0).toFixed(2)}
                                                        </div>
                                                    </div>
                                                    <div className="detail-row">
                                                        <div className="detail-label">Статус:</div>
                                                        <div className={`detail-value ${earning.status}`}>
                                                            {earning.status === 'available' ? '✅ Доступно' :
                                                             earning.status === 'paid' ? '🏦 Выплачено' : 
                                                             earning.status === 'pending' ? '⏳ Ожидание' : earning.status}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-icon">💰</div>
                                        <div className="empty-title">Начислений пока нет</div>
                                        <div className="empty-subtitle">Приглашайте друзей для получения комиссии</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ВКЛАДКА: ВЫВОДЫ */}
                        {activeTab === 'withdrawals' && (
                            <div className="tab-pane">
                                <div className="tab-title">История выводов</div>
                                {referralData?.withdrawals?.length > 0 ? (
                                    <div className="withdrawals-list">
                                        {referralData.withdrawals.map((withdrawal, index) => (
                                            <div className="withdrawal-item" key={withdrawal.id || index}>
                                                <div className="withdrawal-header">
                                                    <div className="withdrawal-icon">💸</div>
                                                    <div className="withdrawal-info">
                                                        <div className="withdrawal-title">Запрос на вывод</div>
                                                        <div className="withdrawal-subtitle">ID: {withdrawal.id}</div>
                                                    </div>
                                                </div>
                                                <div className="withdrawal-details">
                                                    <div className="detail-row">
                                                        <div className="detail-label">Дата запроса:</div>
                                                        <div className="detail-value">
                                                            {formatDate(withdrawal.created_at)}
                                                        </div>
                                                    </div>
                                                    <div className="detail-row">
                                                        <div className="detail-label">Сумма:</div>
                                                        <div className="detail-value amount">
                                                            ${(withdrawal.amount || 0).toFixed(2)}
                                                        </div>
                                                    </div>
                                                    <div className="detail-row">
                                                        <div className="detail-label">Статус:</div>
                                                        <div className={`detail-value ${withdrawal.status}`}>
                                                            {withdrawal.status === 'pending' ? '⏳ Ожидание' :
                                                             withdrawal.status === 'completed' ? '✅ Выплачено' :
                                                             withdrawal.status === 'rejected' ? '❌ Отклонено' :
                                                             withdrawal.status === 'processing' ? '🔄 В обработке' : withdrawal.status}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-icon">💸</div>
                                        <div className="empty-title">Выводов еще не было</div>
                                        <div className="empty-subtitle">Запросите вывод средств, когда накопите $10</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Информационный блок */}
            <div className="referral-section">
                <div className="section-card">
                    <div className="card-header">
                        <div className="card-title">Как это работает</div>
                    </div>
                    <div className="steps-list">
                        <div className="step-item">
                            <div className="step-number">1</div>
                            <div className="step-content">
                                <div className="step-title">Поделитесь ссылкой</div>
                                <div className="step-description">Отправьте друзьям вашу реферальную ссылку</div>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-number">2</div>
                            <div className="step-content">
                                <div className="step-title">Друг совершает сделку</div>
                                <div className="step-description">Реферал покупает или продает USDT</div>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-number">3</div>
                            <div className="step-content">
                                <div className="step-title">Получаете комиссию</div>
                                <div className="step-description">Автоматическое начисление 1% от суммы сделки</div>
                            </div>
                        </div>
                        <div className="step-item">
                            <div className="step-number">4</div>
                            <div className="step-content">
                                <div className="step-title">Выводите заработанное</div>
                                <div className="step-description">Выводите средства от $10 в любое время</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReferralSystem;