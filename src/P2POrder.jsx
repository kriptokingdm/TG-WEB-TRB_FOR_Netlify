// src/P2POrder.jsx
import React, { useState, useEffect } from 'react';
import './P2P.css';

const API = 'https://tethrab.shop';

export default function P2POrder({ telegramUser, showToast, navigateTo, orderId }) {
    const userId = telegramUser?.id || '7879866656';
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [creatingTrade, setCreatingTrade] = useState(false);
    const amountInputRef = useRef(null);

    useEffect(() => {
        fetchOrder();
    }, [orderId]);

    const fetchOrder = async () => {
        try {
            const res = await fetch(`${API}/api/p2p/orders/${orderId}`);
            const data = await res.json();
            if (data.success) {
                setOrder(data.order);
            } else {
                showToast('Объявление не найдено', 'error');
            }
        } catch (e) {
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
        
        let usdtAmount = parseFloat(amount);
        if (usdtAmount < order.min_amount || usdtAmount > order.max_amount) {
            showToast(`Сумма должна быть от ${order.min_amount} до ${order.max_amount} USDT`, 'error');
            return;
        }
        
        if (usdtAmount > order.available_amount) {
            showToast(`Доступно только ${order.available_amount} USDT`, 'error');
            return;
        }
        
        setCreatingTrade(true);
        try {
            const res = await fetch(`${API}/api/p2p/trade/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    orderId: order.id, 
                    buyerId: userId, 
                    amount: usdtAmount,
                    expires_minutes: order.payment_time || 30
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast('✅ Сделка создана!', 'success');
                navigateTo('orders');
            } else {
                showToast(data.error || 'Ошибка', 'error');
            }
        } catch (e) {
            showToast('Ошибка соединения', 'error');
        } finally {
            setCreatingTrade(false);
        }
    };

    if (loading) return <div className="loading">Загрузка...</div>;
    if (!order) return <div className="empty">Объявление не найдено</div>;

    return (
        <div className="screen">
            <div className="header">
                <button onClick={() => navigateTo('p2p')}>←</button>
                <h2>Объявление #{order.id}</h2>
                <div></div>
            </div>
            
            <div className="order-detail-card">
                <div className="order-rate-large">{order.rate} ₽</div>
                <div className="order-amount-large">{order.available_amount} USDT</div>
                <div className="order-limits">Лимиты: {order.min_amount} - {order.max_amount} USDT</div>
                <div className="order-payment">Оплата: {order.payment_methods?.join(', ')}</div>
                
                <input 
                    ref={amountInputRef}
                    type="number" 
                    className="amountInput"
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    placeholder="Введите сумму в USDT"
                />
                
                <button className="confirmBtn" onClick={startTrade} disabled={creatingTrade}>
                    {creatingTrade ? 'Создание...' : '✅ Начать сделку'}
                </button>
            </div>
        </div>
    );
}