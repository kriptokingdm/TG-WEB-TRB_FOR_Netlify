// src/P2PMarket.jsx
import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'https://tethrab.shop';

export default function P2PMarket({ telegramUser, showToast, navigateTo }) {
    const [activeSection, setActiveSection] = useState('market');
    const [activeTab, setActiveTab] = useState('buy');
    const [orders, setOrders] = useState([]);
    const [myAds, setMyAds] = useState([]);
    const [myTrades, setMyTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showTradeModal, setShowTradeModal] = useState(false);
    const [tradeAmount, setTradeAmount] = useState('');
    const [creatingTrade, setCreatingTrade] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newAd, setNewAd] = useState({
        action: 'sell',
        currency: 'USDT',
        fiat: 'RUB',
        amount: '',
        rate: '',
        min_amount: '',
        max_amount: '',
        payment_methods: []
    });

    const userId = telegramUser?.id || '7879866656';

    useEffect(() => {
        if (activeSection === 'market') {
            fetchOrders();
        } else if (activeSection === 'my_ads') {
            fetchMyAds();
        } else if (activeSection === 'orders') {
            fetchMyTrades();
        }
    }, [activeSection, activeTab]);

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

    const fetchMyAds = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/p2p/orders/user/${userId}`);
            const data = await res.json();
            setMyAds(data.orders || []);
        } catch (error) {
            console.error('Ошибка:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyTrades = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/p2p/trades/user/${userId}`);
            const data = await res.json();
            setMyTrades(data.trades || []);
        } catch (error) {
            console.error('Ошибка:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteAd = async (adId) => {
        if (!window.confirm('Удалить объявление?')) return;
        
        try {
            const res = await fetch(`${API_BASE_URL}/api/p2p/order/${adId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            const data = await res.json();
            if (data.success) {
                showToast('✅ Объявление удалено', 'success');
                fetchMyAds();
            }
        } catch (error) {
            showToast('Ошибка удаления', 'error');
        }
    };

    const createAd = async () => {
        if (!newAd.amount || !newAd.rate || !newAd.min_amount || !newAd.payment_methods.length) {
            showToast('Заполните все поля', 'error');
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/p2p/order/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    type: newAd.action,
                    amount: parseFloat(newAd.amount),
                    rate: parseFloat(newAd.rate),
                    min_amount: parseFloat(newAd.min_amount),
                    max_amount: parseFloat(newAd.max_amount) || parseFloat(newAd.amount),
                    payment_methods: newAd.payment_methods
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast('✅ Объявление создано!', 'success');
                setShowCreateForm(false);
                setNewAd({
                    action: 'sell',
                    currency: 'USDT',
                    fiat: 'RUB',
                    amount: '',
                    rate: '',
                    min_amount: '',
                    max_amount: '',
                    payment_methods: []
                });
                fetchMyAds();
                setActiveSection('my_ads');
            } else {
                showToast(data.error || 'Ошибка создания', 'error');
            }
        } catch (error) {
            showToast('Ошибка соединения', 'error');
        }
    };

    const startTrade = async (order) => {
        if (!tradeAmount || parseFloat(tradeAmount) <= 0) {
            showToast('Введите сумму', 'error');
            return;
        }

        const amount = parseFloat(tradeAmount);
        if (amount < order.min_amount || amount > order.max_amount) {
            showToast(`Сумма должна быть от ${order.min_amount} до ${order.max_amount} USDT`, 'error');
            return;
        }

        if (amount > order.available_amount) {
            showToast(`Доступно только ${order.available_amount} USDT`, 'error');
            return;
        }

        setCreatingTrade(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/p2p/trade/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.id,
                    buyerId: userId,
                    amount: amount
                })
            });
            const data = await res.json();
            
            if (data.success) {
                showToast('✅ Сделка создана!', 'success');
                setShowTradeModal(false);
                setTradeAmount('');
                fetchOrders();
                setActiveSection('orders');
                fetchMyTrades();
            } else {
                showToast(data.error || 'Ошибка создания сделки', 'error');
            }
        } catch (error) {
            showToast('Ошибка соединения', 'error');
        } finally {
            setCreatingTrade(false);
        }
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('ru-RU').format(num);
    };

    const getStatusText = (status) => {
        const statuses = {
            'pending': 'Ожидает оплаты',
            'paid': 'Оплачено',
            'completed': 'Завершена',
            'cancelled': 'Отменена'
        };
        return statuses[status] || status;
    };

    const paymentMethodsList = [
        { value: 'bank_transfer', label: 'Банковский перевод', icon: '🏦' },
        { value: 'card', label: 'Карта', icon: '💳' },
        { value: 'sbp', label: 'СБП', icon: '📱' },
        { value: 'cash', label: 'Наличные', icon: '💰' }
    ];

    const getPaymentLabel = (method) => {
        const found = paymentMethodsList.find(m => m.value === method);
        return found ? `${found.icon} ${found.label}` : method;
    };

    const togglePaymentMethod = (method) => {
        setNewAd(prev => ({
            ...prev,
            payment_methods: prev.payment_methods.includes(method)
                ? prev.payment_methods.filter(m => m !== method)
                : [...prev.payment_methods, method]
        }));
    };

    return (
        <div className="tg-p2p-container">
            {/* Верхняя навигация P2P */}
            <div className="tg-p2p-nav">
                <button 
                    className={`tg-p2p-nav-item ${activeSection === 'market' ? 'active' : ''}`}
                    onClick={() => setActiveSection('market')}
                >
                    📊 Маркет
                </button>
                <button 
                    className={`tg-p2p-nav-item ${activeSection === 'my_ads' ? 'active' : ''}`}
                    onClick={() => setActiveSection('my_ads')}
                >
                    📋 Мои
                </button>
                <button 
                    className={`tg-p2p-nav-item ${activeSection === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveSection('orders')}
                >
                    📦 Ордера
                </button>
                <button 
                    className="tg-p2p-create-btn"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                >
                    {showCreateForm ? '✕' : '➕'}
                </button>
            </div>

            {/* Форма создания объявления */}
            {showCreateForm && (
                <div className="tg-create-ad-form">
                    <h3>Создание объявления</h3>
                    <div className="tg-form-type">
                        <button 
                            className={newAd.action === 'sell' ? 'active' : ''}
                            onClick={() => setNewAd({...newAd, action: 'sell'})}
                        >
                            🔴 Продажа
                        </button>
                        <button 
                            className={newAd.action === 'buy' ? 'active' : ''}
                            onClick={() => setNewAd({...newAd, action: 'buy'})}
                        >
                            🟢 Покупка
                        </button>
                    </div>
                    <input 
                        type="number" 
                        placeholder="Количество USDT" 
                        value={newAd.amount}
                        onChange={(e) => setNewAd({...newAd, amount: e.target.value})}
                    />
                    <input 
                        type="number" 
                        placeholder="Курс (₽ за 1 USDT)" 
                        value={newAd.rate}
                        onChange={(e) => setNewAd({...newAd, rate: e.target.value})}
                    />
                    <div className="tg-form-row">
                        <input 
                            type="number" 
                            placeholder="Мин. сумма" 
                            value={newAd.min_amount}
                            onChange={(e) => setNewAd({...newAd, min_amount: e.target.value})}
                        />
                        <input 
                            type="number" 
                            placeholder="Макс. сумма (опционально)" 
                            value={newAd.max_amount}
                            onChange={(e) => setNewAd({...newAd, max_amount: e.target.value})}
                        />
                    </div>
                    <div className="tg-payment-methods">
                        <div className="tg-label">Способы оплаты:</div>
                        <div className="tg-payment-buttons">
                            {paymentMethodsList.map(m => (
                                <button 
                                    key={m.value}
                                    className={newAd.payment_methods.includes(m.value) ? 'selected' : ''}
                                    onClick={() => togglePaymentMethod(m.value)}
                                >
                                    {m.icon} {m.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button className="tg-submit-btn" onClick={createAd}>Создать объявление</button>
                </div>
            )}

            {/* Контент */}
            <div className="tg-p2p-content">
                {activeSection === 'market' && (
                    <>
                        <div className="tg-market-tabs">
                            <button 
                                className={`tg-market-tab ${activeTab === 'buy' ? 'active' : ''}`}
                                onClick={() => setActiveTab('buy')}
                            >
                                Купить USDT
                            </button>
                            <button 
                                className={`tg-market-tab ${activeTab === 'sell' ? 'active' : ''}`}
                                onClick={() => setActiveTab('sell')}
                            >
                                Продать USDT
                            </button>
                        </div>

                        <div className="tg-orders-list">
                            {loading ? (
                                <div className="tg-loading">Загрузка...</div>
                            ) : orders.length === 0 ? (
                                <div className="tg-empty">Нет объявлений</div>
                            ) : (
                                orders.map(order => (
                                    <div key={order.id} className="tg-order-card" onClick={() => { setSelectedOrder(order); setShowTradeModal(true); }}>
                                        <div className="tg-order-user">
                                            <div className="tg-user-avatar">👤</div>
                                            <div>
                                                <div className="tg-user-name">{order.user_name || 'Продавец'}</div>
                                                <div className="tg-user-rating">⭐ {order.user_rating || 5}</div>
                                            </div>
                                        </div>
                                        <div className="tg-order-rate">{formatNumber(order.rate)} ₽</div>
                                        <div className="tg-order-amount">{formatNumber(order.available_amount)} USDT</div>
                                        <div className="tg-order-payment">{order.payment_methods?.map(m => getPaymentLabel(m)).join(', ')}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}

                {activeSection === 'my_ads' && (
                    <div className="tg-my-ads">
                        {loading ? (
                            <div className="tg-loading">Загрузка...</div>
                        ) : myAds.length === 0 ? (
                            <div className="tg-empty">
                                <p>У вас нет объявлений</p>
                                <button className="tg-empty-btn" onClick={() => setShowCreateForm(true)}>Создать</button>
                            </div>
                        ) : (
                            myAds.map(ad => (
                                <div key={ad.id} className="tg-ad-card">
                                    <div className="tg-ad-header">
                                        <span className={`tg-ad-type ${ad.type}`}>{ad.type === 'sell' ? 'Продажа' : 'Покупка'}</span>
                                        <span className={`tg-ad-status ${ad.status}`}>{ad.status === 'active' ? 'Активно' : 'Приостановлено'}</span>
                                    </div>
                                    <div className="tg-ad-rate">{ad.rate} ₽</div>
                                    <div className="tg-ad-amount">{ad.available_amount}/{ad.amount} USDT</div>
                                    <div className="tg-ad-actions">
                                        <button className="tg-ad-delete" onClick={() => deleteAd(ad.id)}>Удалить</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeSection === 'orders' && (
                    <div className="tg-orders-section">
                        {loading ? (
                            <div className="tg-loading">Загрузка...</div>
                        ) : myTrades.length === 0 ? (
                            <div className="tg-empty">Нет сделок</div>
                        ) : (
                            myTrades.map(trade => (
                                <div key={trade.trade_id} className="tg-trade-card">
                                    <div className="tg-trade-header">
                                        <span className="tg-trade-id">#{trade.trade_id.slice(-6)}</span>
                                        <span className={`tg-trade-status ${trade.status}`}>{getStatusText(trade.status)}</span>
                                    </div>
                                    <div className="tg-trade-amount">{trade.amount} USDT × {trade.rate} ₽</div>
                                    <div className="tg-trade-total">= {formatNumber(trade.total_rub)} ₽</div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Модалка сделки */}
            {showTradeModal && selectedOrder && (
                <div className="tg-modal-overlay" onClick={() => setShowTradeModal(false)}>
                    <div className="tg-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="tg-modal-header">
                            <span>Создание сделки</span>
                            <button onClick={() => setShowTradeModal(false)}>✕</button>
                        </div>
                        <div className="tg-modal-content">
                            <div className="tg-trade-info">
                                <div>Курс: {selectedOrder.rate} ₽</div>
                                <div>Лимиты: {selectedOrder.min_amount} - {selectedOrder.max_amount} USDT</div>
                                <div>Доступно: {selectedOrder.available_amount} USDT</div>
                            </div>
                            <input 
                                type="number" 
                                className="tg-trade-input"
                                placeholder="Сумма в USDT"
                                value={tradeAmount}
                                onChange={(e) => setTradeAmount(e.target.value)}
                            />
                            {tradeAmount && (
                                <div className="tg-trade-total">Итого: {formatNumber(parseFloat(tradeAmount) * selectedOrder.rate)} ₽</div>
                            )}
                            <button className="tg-trade-btn" onClick={() => startTrade(selectedOrder)} disabled={creatingTrade}>
                                {creatingTrade ? 'Создание...' : 'Начать сделку'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}