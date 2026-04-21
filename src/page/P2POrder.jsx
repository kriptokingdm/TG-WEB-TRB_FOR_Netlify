// src/pages/P2POrder.jsx
import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'https://tethrab.shop';

export default function P2POrder({ telegramUser, showToast, navigateTo }) {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [creating, setCreating] = useState(false);
    const [userBalance, setUserBalance] = useState(0);

    // Получаем ID объявления из URL
    const orderId = window.location.pathname.split('/').pop();

    const userId = telegramUser?.id || '7879866656';

    useEffect(() => {
        fetchOrder();
        fetchUserBalance();
    }, [orderId]);

    const fetchOrder = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/p2p/order/${orderId}`);
            const data = await res.json();
            if (data.success) {
                setOrder(data.order);
            } else {
                showToast('Объявление не найдено', 'error');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showToast('Ошибка загрузки', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserBalance = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/wallet/usdt/balance/${userId}`);
            const data = await res.json();
            setUserBalance(data.balance || 0);
        } catch (error) {
            console.error('Ошибка:', error);
        }
    };

    const startTrade = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            showToast('Введите сумму', 'error');
            return;
        }

        const tradeAmount = parseFloat(amount);
        
        if (tradeAmount < order.min_amount || tradeAmount > order.max_amount) {
            showToast(`Сумма должна быть от ${order.min_amount} до ${order.max_amount} USDT`, 'error');
            return;
        }

        if (tradeAmount > order.available_amount) {
            showToast(`Доступно только ${order.available_amount} USDT`, 'error');
            return;
        }

        setCreating(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/p2p/trade/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.id,
                    buyerId: userId,
                    amount: tradeAmount
                })
            });
            const data = await res.json();
            
            if (data.success) {
                showToast('✅ Сделка создана!', 'success');
                navigateTo('p2p/trades');
            } else {
                showToast(data.error || 'Ошибка создания сделки', 'error');
            }
        } catch (error) {
            showToast('Ошибка соединения', 'error');
        } finally {
            setCreating(false);
        }
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('ru-RU').format(num);
    };

    if (loading) {
        return (
            <div className="p2p-order-loading">
                <div className="p2p-spinner"></div>
                <span>Загрузка объявления...</span>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="p2p-order-error">
                <span>❌</span>
                <p>Объявление не найдено</p>
                <button onClick={() => navigateTo('p2p')}>Вернуться в маркет</button>
            </div>
        );
    }

    const isOwner = order.user_id === userId;

    return (
        <div className="p2p-order-page">
            {/* Хедер */}
            <div className="p2p-order-header">
                <button className="p2p-order-back" onClick={() => navigateTo('p2p')}>←</button>
                <h1>Объявление #{order.id}</h1>
                <div className="p2p-order-placeholder"></div>
            </div>

            {/* Информация о продавце */}
            <div className="p2p-order-seller">
                <div className="p2p-order-avatar">👤</div>
                <div className="p2p-order-seller-info">
                    <div className="p2p-order-seller-name">{order.user_name || 'Продавец'}</div>
                    <div className="p2p-order-seller-stats">
                        <span className="p2p-order-completion">⭐ {order.completion_rate || 98}% выполнено</span>
                        <span className="p2p-order-trades">📊 {order.completed_trades || 0} сделок</span>
                    </div>
                </div>
            </div>

            {/* Детали объявления */}
            <div className="p2p-order-details">
                <div className="p2p-order-rate-card">
                    <div className="p2p-order-rate-label">Курс</div>
                    <div className="p2p-order-rate-value">{order.rate} <span>₽</span></div>
                    <div className="p2p-order-rate-sub">за 1 USDT</div>
                </div>

                <div className="p2p-order-info-grid">
                    <div className="p2p-order-info-item">
                        <div className="p2p-order-info-label">Доступно</div>
                        <div className="p2p-order-info-value">{formatNumber(order.available_amount)} USDT</div>
                    </div>
                    <div className="p2p-order-info-item">
                        <div className="p2p-order-info-label">Всего</div>
                        <div className="p2p-order-info-value">{formatNumber(order.amount)} USDT</div>
                    </div>
                    <div className="p2p-order-info-item">
                        <div className="p2p-order-info-label">Мин. сумма</div>
                        <div className="p2p-order-info-value">{formatNumber(order.min_amount)} USDT</div>
                    </div>
                    <div className="p2p-order-info-item">
                        <div className="p2p-order-info-label">Макс. сумма</div>
                        <div className="p2p-order-info-value">{formatNumber(order.max_amount)} USDT</div>
                    </div>
                </div>

                <div className="p2p-order-payment-section">
                    <div className="p2p-order-section-title">💳 Способы оплаты</div>
                    <div className="p2p-order-payment-list">
                        {order.payment_methods?.map(method => (
                            <span key={method} className="p2p-order-payment-item">
                                {method === 'bank_transfer' && '🏦 Банковский перевод'}
                                {method === 'card' && '💳 Банковская карта'}
                                {method === 'sbp' && '📱 СБП'}
                                {method === 'cash' && '💰 Наличные'}
                                {method === 'crypto' && '₿ Криптовалюта'}
                            </span>
                        ))}
                    </div>
                </div>

                {order.terms && (
                    <div className="p2p-order-terms-section">
                        <div className="p2p-order-section-title">📝 Условия сделки</div>
                        <div className="p2p-order-terms-text">{order.terms}</div>
                    </div>
                )}
            </div>

            {/* Форма создания сделки (только если не владелец) */}
            {!isOwner && order.status === 'active' && (
                <div className="p2p-order-trade-form">
                    <div className="p2p-order-trade-title">Создание сделки</div>
                    <div className="p2p-order-trade-input">
                        <label>Сумма в USDT</label>
                        <input 
                            type="number" 
                            placeholder={`От ${order.min_amount} до ${order.max_amount}`}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                    {amount && (
                        <div className="p2p-order-trade-total">
                            Итого к оплате: <strong>{formatNumber(parseFloat(amount) * order.rate)} ₽</strong>
                        </div>
                    )}
                    <button 
                        className="p2p-order-trade-btn"
                        onClick={startTrade}
                        disabled={creating}
                    >
                        {creating ? 'Создание...' : '✅ Начать сделку'}
                    </button>
                </div>
            )}

            {/* Если объявление принадлежит пользователю */}
            {isOwner && (
                <div className="p2p-order-owner-actions">
                    <button className="p2p-order-edit-btn">✏️ Редактировать</button>
                    <button className="p2p-order-delete-btn">❌ Удалить</button>
                </div>
            )}
        </div>
    );
}