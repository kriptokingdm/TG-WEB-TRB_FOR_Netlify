import React, { useState, useEffect } from 'react';
import './ReferralSystem.css';

const API_BASE_URL = 'https://tethrab.shop';

const ReferralSystem = ({ onClose, showMessage }) => {
    const [referralData, setReferralData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawing, setWithdrawing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

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
                    setReferralData(result.data);
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
   // Запрос на вывод средств (исправленная версия)
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
            // Показываем детали успешного запроса
            showMessage('success', 
                `✅ ${result.message || 'Запрос на вывод создан'}\n\n` +
                `💰 Сумма: $${parseFloat(withdrawAmount).toFixed(2)}\n` +
                `📅 ID запроса: ${result.withdrawal?.id || 'не указан'}\n` +
                `⏳ Ожидайте выплаты в течение 24 часов`
            );
            
            setWithdrawAmount('');
            
            // Обновляем данные
            setTimeout(() => {
                loadReferralData();
            }, 1500);
            
            // Показываем новый баланс если есть
            if (result.balance) {
                setTimeout(() => {
                    showMessage('info', 
                        `📊 Новый доступный баланс: $${result.balance.available.toFixed(2)}\n` +
                        `💰 Всего заработано: $${result.balance.total_earnings.toFixed(2)}\n` +
                        `💸 Уже выведено: $${result.balance.withdrawn.toFixed(2)}`
                    );
                }, 2000);
            }
        } else {
            // Детализированная обработка ошибок
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
                    <p>Загрузка данных...</p>
                </div>
            </div>
        );
    }

    const stats = referralData?.stats || {};
    const canWithdraw = stats.available_earnings >= 10;

    return (
        <div className="referral-container">
            {/* Хедер */}
            <div className="referral-header">
                <div className="header-content">
                    <div className="header-text">
                        <h1>Реферальная система</h1>
                        <p>Приглашайте друзей и зарабатывайте 1% с их сделок</p>
                    </div>
                </div>
                {onClose && (
                    <button className="close-btn" onClick={onClose} aria-label="Закрыть">
                        ✕
                    </button>
                )}
            </div>

            {/* Основная статистика */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-content">
                        <div className="stat-value">{stats.total_referrals || 0}</div>
                        <div className="stat-label">Всего рефералов</div>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-content">
                        <div className="stat-value">{formatUSD(stats.total_earnings)}</div>
                        <div className="stat-label">Заработано</div>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-content">
                        <div className="stat-value">{formatUSD(stats.available_earnings)}</div>
                        <div className="stat-label">Доступно</div>
                    </div>
                </div>
            </div>

            {/* Реферальная ссылка */}
            <div className="referral-link-card">
                <div className="referral-link-header">
                    <h3>Ваша реферальная ссылка</h3>
                    <p>Поделитесь с друзьями и получайте 1% комиссии</p>
                </div>
                
                <div className="referral-link-content">
                    <div className="link-input-group">
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
            <div className="withdraw-card">
                <div className="withdraw-header">
                    <h3>Вывод средств</h3>
                    <p>Доступно: {formatUSD(stats.available_earnings)}</p>
                </div>
                
                {canWithdraw ? (
                    <div className="withdraw-form">
                        <div className="input-group">
                            <span className="input-prefix">$</span>
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
                    <div className="info-item">
                        <span className="info-label">Минимальный вывод:</span>
                        <span className="info-value">$10</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Когда можно выводить:</span>
                        <span className="info-value highlight">Доступно в любое время</span>
                    </div>
                </div>
            </div>

            {/* Вкладки */}
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
                    {activeTab === 'referrals' && (
                        <div className="tab-pane">
                            <h4>Ваши рефералы</h4>
                            {referralData?.referrals?.length > 0 ? (
                                <div className="data-table">
                                    <div className="table-header">
                                        <div className="table-col">Пользователь</div>
                                        <div className="table-col">Дата</div>
                                        <div className="table-col">Статус</div>
                                    </div>
                                    {referralData.referrals.map((ref, index) => (
                                        <div className="table-row" key={index}>
                                            <div className="table-col">
                                                <div className="user-cell">
                                                    <div className="user-avatar">
                                                        {ref.first_name?.[0]?.toUpperCase() || 'U'}
                                                    </div>
                                                    <div className="user-info">
                                                        <div className="user-name">
                                                            {ref.first_name || ref.username || 'Аноним'}
                                                        </div>
                                                        {ref.username && (
                                                            <div className="user-username">@{ref.username}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="table-col">
                                                <div className="date-cell">
                                                    {formatDate(ref.referral_date)}
                                                </div>
                                            </div>
                                            <div className="table-col">
                                                <span className={`status-badge ${ref.status === 'active' ? 'active' : 'inactive'}`}>
                                                    {ref.status === 'active' ? 'Активен' : 'Неактивен'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <p>У вас еще нет рефералов</p>
                                    <small>Поделитесь своей реферальной ссылкой с друзьями</small>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'earnings' && (
                        <div className="tab-pane">
                            <h4>История начислений</h4>
                            {referralData?.earnings?.length > 0 ? (
                                <div className="data-table">
                                    <div className="table-header">
                                        <div className="table-col">Дата</div>
                                        <div className="table-col">Комиссия</div>
                                        <div className="table-col">Статус</div>
                                    </div>
                                    {referralData.earnings.map((earning, index) => (
                                        <div className="table-row" key={index}>
                                            <div className="table-col">
                                                <div className="date-cell">
                                                    {formatDate(earning.created_at)}
                                                </div>
                                            </div>
                                            <div className="table-col">
                                                <div className="amount-cell">
                                                    <strong>${parseFloat(earning.commission || 0).toFixed(2)}</strong>
                                                </div>
                                            </div>
                                            <div className="table-col">
                                                <span className={`status-badge ${earning.status}`}>
                                                    {earning.status === 'available' ? '✅ Доступно' : 
                                                     earning.status === 'paid' ? '🏦 Выплачено' : '⏳ Ожидание'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <p>Начислений пока нет</p>
                                    <small>Приглашайте друзей для получения комиссии</small>
                                </div>
                            )}
                        </div>
                    )}

{activeTab === 'withdrawals' && (
    <div className="tab-pane">
        <h4>История выводов</h4>
        {referralData?.withdrawals?.length > 0 ? (
            <div className="data-table">
                <div className="table-header">
                    <div className="table-col">Дата</div>
                    <div className="table-col">Сумма</div>
                    <div className="table-col">Статус</div>
                </div>
                {referralData.withdrawals.map((withdrawal, index) => (
                    <div className="table-row" key={index}>
                        <div className="table-col">
                            <div className="date-cell">
                                {formatDate(withdrawal.created_at)}
                            </div>
                        </div>
                        <div className="table-col">
                            <div className="amount-cell">
                                <strong>${parseFloat(withdrawal.amount || 0).toFixed(2)}</strong>
                            </div>
                        </div>
                        <div className="table-col">
                            <span className={`status-badge ${withdrawal.status}`}>
                                {withdrawal.status === 'pending' ? '⏳ Ожидание' :
                                 withdrawal.status === 'completed' ? '✅ Выплачено' :
                                 withdrawal.status === 'rejected' ? '❌ Отклонено' :
                                 withdrawal.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="empty-state">
                <p>Выводов еще не было</p>
                <small>Запросите вывод средств, когда накопите $10</small>
            </div>
        )}
    </div>
)}
                </div>
            </div>

            {/* Информация о системе */}
            <div className="info-card">
                <div className="info-header">
                    <h3>Как это работает</h3>
                </div>
                
                <div className="steps-list">
                    <div className="step-item">
                        <div className="step-number">1</div>
                        <div className="step-content">
                            <strong>Поделитесь ссылкой</strong>
                            <p>Отправьте друзьям вашу реферальную ссылку</p>
                        </div>
                    </div>
                    
                    <div className="step-item">
                        <div className="step-number">2</div>
                        <div className="step-content">
                            <strong>Друг совершает сделку</strong>
                            <p>Реферал покупает или продает USDT</p>
                        </div>
                    </div>
                    
                    <div className="step-item">
                        <div className="step-number">3</div>
                        <div className="step-content">
                            <strong>Получаете комиссию</strong>
                            <p>Автоматическое начисление 1% от суммы сделки</p>
                        </div>
                    </div>
                    
                    <div className="step-item">
                        <div className="step-number">4</div>
                        <div className="step-content">
                            <strong>Выводите заработанное</strong>
                            <p>Выводите средства от $10 в любое время</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReferralSystem;