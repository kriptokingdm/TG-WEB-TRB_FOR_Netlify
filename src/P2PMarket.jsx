// P2PMarket.jsx
import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'https://tethrab.shop';

export default function P2PMarket({ telegramUser, showToast }) {
    const [activeTab, setActiveTab] = useState('buy');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newOrder, setNewOrder] = useState({
        type: 'sell',
        amount: '',
        rate: '',
        payment_methods: []
    });

    const userId = telegramUser?.id || '7879866656';

    useEffect(() => {
        fetchOrders();
    }, [activeTab]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const type = activeTab === 'buy' ? 'sell' : 'buy';
            const res = await fetch(`${API_BASE_URL}/api/p2p/orders?type=${type}&limit=50`);
            const data = await res.json();
            setOrders(data.orders || []);
        } catch (error) {
            console.error('Ошибка:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrder = async () => {
        if (!newOrder.amount || !newOrder.rate) {
            showToast('Заполните все поля', 'error');
            return;
        }

        if (newOrder.payment_methods.length === 0) {
            showToast('Выберите способ оплаты', 'error');
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/p2p/order/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    type: newOrder.type,
                    amount: parseFloat(newOrder.amount),
                    rate: parseFloat(newOrder.rate),
                    min_amount: 10,
                    max_amount: parseFloat(newOrder.amount),
                    payment_methods: newOrder.payment_methods
                })
            });
            const data = await res.json();
            
            if (data.success) {
                showToast('✅ Объявление создано!', 'success');
                setShowCreateForm(false);
                setNewOrder({ type: 'sell', amount: '', rate: '', payment_methods: [] });
                fetchOrders();
            } else {
                showToast(data.error || 'Ошибка создания', 'error');
            }
        } catch (error) {
            showToast('Ошибка соединения', 'error');
        }
    };

    const paymentMethods = [
        { value: 'bank_transfer', label: '🏦 Банковский перевод' },
        { value: 'card', label: '💳 Карта' },
        { value: 'sbp', label: '📱 СБП' },
        { value: 'cash', label: '💰 Наличные' }
    ];

    return (
        <div className="p2p-market">
            <div className="p2p-header">
                <h1>🤝 P2P МАРКЕТ</h1>
                <p>Покупка и продажа USDT</p>
            </div>

            <div className="p2p-tabs">
                <button className={activeTab === 'buy' ? 'active' : ''} onClick={() => setActiveTab('buy')}>
                    🛒 КУПИТЬ USDT
                </button>
                <button className={activeTab === 'sell' ? 'active' : ''} onClick={() => setActiveTab('sell')}>
                    💰 ПРОДАТЬ USDT
                </button>
            </div>

            <div className="p2p-create-btn">
                <button onClick={() => setShowCreateForm(!showCreateForm)}>
                    {showCreateForm ? '✖️ ЗАКРЫТЬ' : '➕ СОЗДАТЬ ОБЪЯВЛЕНИЕ'}
                </button>
            </div>

            {showCreateForm && (
                <div className="p2p-form">
                    <h3>Создание объявления</h3>
                    
                    <div className="form-group">
                        <label>Тип</label>
                        <div className="type-buttons">
                            <button className={newOrder.type === 'sell' ? 'active' : ''} onClick={() => setNewOrder({...newOrder, type: 'sell'})}>
                                💰 Продажа
                            </button>
                            <button className={newOrder.type === 'buy' ? 'active' : ''} onClick={() => setNewOrder({...newOrder, type: 'buy'})}>
                                🛒 Покупка
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Сумма (USDT)</label>
                        <input type="number" placeholder="100" value={newOrder.amount} onChange={e => setNewOrder({...newOrder, amount: e.target.value})} />
                    </div>

                    <div className="form-group">
                        <label>Курс (RUB за 1 USDT)</label>
                        <input type="number" placeholder="90" value={newOrder.rate} onChange={e => setNewOrder({...newOrder, rate: e.target.value})} />
                    </div>

                    <div className="form-group">
                        <label>Способы оплаты</label>
                        <div className="payment-methods">
                            {paymentMethods.map(m => (
                                <button key={m.value} className={newOrder.payment_methods.includes(m.value) ? 'selected' : ''} onClick={() => {
                                    const methods = newOrder.payment_methods.includes(m.value)
                                        ? newOrder.payment_methods.filter(x => x !== m.value)
                                        : [...newOrder.payment_methods, m.value];
                                    setNewOrder({...newOrder, payment_methods: methods});
                                }}>
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button className="submit-btn" onClick={handleCreateOrder}>✅ СОЗДАТЬ</button>
                </div>
            )}

            <div className="p2p-orders">
                {loading ? (
                    <div className="loading">Загрузка...</div>
                ) : orders.length === 0 ? (
                    <div className="empty">Нет активных объявлений</div>
                ) : (
                    orders.map(order => (
                        <div key={order.id} className="order-card">
                            <div className="order-header">
                                <span className={`order-type ${order.type}`}>{order.type === 'sell' ? '💰 ПРОДАЖА' : '🛒 ПОКУПКА'}</span>
                                <span className="order-rate">{order.rate} ₽</span>
                            </div>
                            <div className="order-amount">{order.available_amount} USDT доступно</div>
                            <div className="order-payment">💳 {order.payment_methods?.join(', ') || 'Банк'}</div>
                            <div className="order-limits">📊 Мин: {order.min_amount} | Макс: {order.max_amount} USDT</div>
                            <button className="order-btn">Начать сделку</button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}