import React, { useState, useEffect, useRef } from 'react';
import './P2P.css';

const API = 'https://tethrab.shop';

export default function P2PTrade({ telegramUser, showToast, navigateTo }) {
    const userId = telegramUser?.id || '7879866656';
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [currencyType, setCurrencyType] = useState('usdt');
    const [creatingTrade, setCreatingTrade] = useState(false);
    const amountInputRef = useRef(null);

    const orderId = window.location.hash.split('/').pop();

    useEffect(() => {
        if (orderId) {
            fetchOrder();
        } else {
            showToast('Объявление не найдено', 'error');
            setTimeout(() => navigateTo('p2p'), 1000);
        }
    }, [orderId]);

    useEffect(() => {
        if (amountInputRef.current) {
            setTimeout(() => amountInputRef.current.focus(), 100);
        }
    }, [order]);

    const fetchOrder = async () => {
        try {
            const res = await fetch(`${API}/api/p2p/order/${orderId}`);
            const data = await res.json();
            if (data.success) {
                setOrder(data.order);
            } else {
                showToast('Объявление не найдено', 'error');
                setTimeout(() => navigateTo('p2p'), 1500);
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
        if (currencyType === 'rub') {
            usdtAmount = parseFloat(amount) / order.rate;
        }
        
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
                showToast('✅ Сделка успешно создана!', 'success');
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

    const formatNumber = (num) => {
        if (num === undefined || num === null) return '0';
        return new Intl.NumberFormat('ru-RU').format(num);
    };

    if (loading) {
        return (
            <div className="screen">
                <div className="header">
                    <button onClick={() => navigateTo('p2p')}>←</button>
                    <h2>Загрузка...</h2>
                    <div></div>
                </div>
                <div className="loading">Загрузка объявления...</div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="screen">
                <div className="header">
                    <button onClick={() => navigateTo('p2p')}>←</button>
                    <h2>Ошибка</h2>
                    <div></div>
                </div>
                <div className="empty">Объявление не найдено</div>
            </div>
        );
    }

    const paymentMethods = order.payment_methods || [];
    const paymentText = paymentMethods.map(m => {
        const methods = { 
            bank_transfer: '🏦 Банк', 
            card: '💳 Карта', 
            sbp: '📱 СБП', 
            cash: '💰 Наличные' 
        };
        return methods[m] || m;
    }).join(', ');

    return (
        <div className="screen">
            <div className="header">
                <button onClick={() => navigateTo('p2p')}>←</button>
                <h2>Создание сделки</h2>
                <div></div>
            </div>
            
            <div className="trade-create-card">
                <div className="seller-info">
                    <div className="seller-avatar">{order.user_name?.[0] || 'U'}</div>
                    <div className="seller-name">{order.user_name || 'Продавец'}</div>
                </div>
                
                <div className="order-info">
                    <div className="order-rate">{formatNumber(order.rate)} ₽</div>
                    <div className="order-available">Доступно: {formatNumber(order.available_amount)} USDT</div>
                </div>
                
                <div className="info-row">
                    <span>📊 Лимиты:</span>
                    <span>{order.min_amount} - {order.max_amount} USDT</span>
                </div>
                
                <div className="info-row">
                    <span>💳 Оплата:</span>
                    <span>{paymentText}</span>
                </div>
                
                <div className="info-row">
                    <span>⏰ Время на оплату:</span>
                    <span>{order.payment_time || 30} минут</span>
                </div>
                
                <div className="divider"></div>
                
                <div className="currencySwitch">
                    <button className={currencyType === 'usdt' ? 'active' : ''} onClick={() => setCurrencyType('usdt')}>
                        USDT
                    </button>
                    <button className={currencyType === 'rub' ? 'active' : ''} onClick={() => setCurrencyType('rub')}>
                        RUB
                    </button>
                </div>
                
                <input 
                    ref={amountInputRef}
                    type="number" 
                    className="amountInput"
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    placeholder="Введите сумму в USDT"
                />
                
                {amount && (
                    <div className="calcResult">
                        {currencyType === 'usdt' 
                            ? `≈ ${formatNumber(parseFloat(amount) * order.rate)} ₽`
                            : `≈ ${formatNumber(parseFloat(amount) / order.rate)} USDT`
                        }
                    </div>
                )}
                
                <button className="confirmBtn" onClick={startTrade} disabled={creatingTrade}>
                    {creatingTrade ? 'Создание...' : '✅ Начать сделку'}
                </button>
            </div>
        </div>
    );
}