// src/pages/P2POrder.jsx
import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'https://tethrab.shop';

export default function P2POrder({ telegramUser, showToast, navigateTo }) {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [creating, setCreating] = useState(false);

    // Получаем ID объявления из URL или из Telegram WebApp
    const getOrderId = () => {
        // 1. Проверяем URL path
        const pathMatch = window.location.pathname.match(/\/p2p\/order\/(\d+)/);
        if (pathMatch) return pathMatch[1];
        
        // 2. Проверяем query параметр startapp
        const urlParams = new URLSearchParams(window.location.search);
        const startapp = urlParams.get('startapp');
        if (startapp && startapp.startsWith('order_')) {
            return startapp.replace('order_', '');
        }
        
        // 3. Проверяем Telegram WebApp initData
        if (window.Telegram?.WebApp?.initDataUnsafe?.start_param) {
            const startParam = window.Telegram.WebApp.initDataUnsafe.start_param;
            if (startParam && startParam.startsWith('order_')) {
                return startParam.replace('order_', '');
            }
        }
        
        return null;
    };

    const orderId = getOrderId();
    const userId = telegramUser?.id || '7879866656';

    useEffect(() => {
        if (orderId) {
            fetchOrder();
        } else {
            showToast('Объявление не найдено', 'error');
            navigateTo('p2p');
        }
    }, [orderId]);

    const fetchOrder = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/p2p/order/${orderId}`);
            const data = await res.json();
            if (data.success) {
                setOrder(data.order);
            } else {
                showToast('Объявление не найдено', 'error');
                navigateTo('p2p');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showToast('Ошибка загрузки', 'error');
        } finally {
            setLoading(false);
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

    return (
        <div className="p2p-order-page">
            <div className="p2p-order-header">
                <button className="p2p-order-back" onClick={() => navigateTo('p2p')}>←</button>
                <h1>Объявление #{order.id}</h1>
                <div className="p2p-order-placeholder"></div>
            </div>

            <div className="p2p-order-seller">
                <div className="p2p-order-avatar">👤</div>
                <div className="p2p-order-seller-info">
                    <div className="p2p-order-seller-name">{order.user_name || 'Продавец'}</div>
                    <div className="p2p-order-seller-stats">
                        <span className="p2p-order-completion">⭐ {order.completion_rate || 98}%</span>
                        <span className="p2p-order-trades">{order.completed_trades || 0} сделок</span>
                    </div>
                </div>
            </div>

            <div className="p2p-order-details">
                <div className="p2p-order-rate-card">
                    <div className="p2p-order-rate-value">{order.rate} <span>₽</span></div>
                    <div className="p2p-order-rate-sub">за 1 USDT</div>
                </div>

                <div className="p2p-order-info-grid">
                    <div className="p2p-order-info-item">
                        <div className="p2p-order-info-label">Доступно</div>
                        <div className="p2p-order-info-value">{formatNumber(order.available_amount)} USDT</div>
                    </div>
                    <div className="p2p-order-info-item">
                        <div className="p2p-order-info-label">Лимиты</div>
                        <div className="p2p-order-info-value">{order.min_amount} - {order.max_amount} USDT</div>
                    </div>
                </div>

                <div className="p2p-order-payment-section">
                    <div className="p2p-order-section-title">💳 Способы оплаты</div>
                    <div className="p2p-order-payment-list">
                        {order.payment_methods?.map(method => (
                            <span key={method} className="p2p-order-payment-item">
                                {method === 'bank_transfer' && '🏦 Банковский перевод'}
                                {method === 'card' && '💳 Карта'}
                                {method === 'sbp' && '📱 СБП'}
                                {method === 'cash' && '💰 Наличные'}
                            </span>
                        ))}
                    </div>
                </div>

                {order.terms && (
                    <div className="p2p-order-terms-section">
                        <div className="p2p-order-section-title">📝 Условия</div>
                        <div className="p2p-order-terms-text">{order.terms}</div>
                    </div>
                )}
            </div>

            {order.user_id !== userId && order.status === 'active' && (
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
                            Итого: <strong>{formatNumber(parseFloat(amount) * order.rate)} ₽</strong>
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
        </div>
    );
}