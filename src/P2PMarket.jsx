// src/P2PMarket.jsx
import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'https://tethrab.shop';

export default function P2PMarket({ telegramUser, showToast, onBack }) {
    const [activeTab, setActiveTab] = useState('market'); // market, my_ads, trades
    const [buySellTab, setBuySellTab] = useState('buy'); // buy, sell
    const [orders, setOrders] = useState([]);
    const [myAds, setMyAds] = useState([]);
    const [myTrades, setMyTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [tradeAmount, setTradeAmount] = useState('');
    const [creatingTrade, setCreatingTrade] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [userBalance, setUserBalance] = useState(0);

    const userId = telegramUser?.id || '7879866656';

    // Форма создания объявления
    const [newOrder, setNewOrder] = useState({
        type: 'sell',
        amount: '',
        rate: '',
        min_amount: '500',
        max_amount: '',
        payment_methods: [],
        description: '',
        agreeTerms: false
    });

    useEffect(() => {
        fetchUserBalance();
    }, []);

    useEffect(() => {
        if (activeTab === 'market') {
            fetchOrders();
        } else if (activeTab === 'my_ads') {
            fetchMyAds();
        } else if (activeTab === 'trades') {
            fetchMyTrades();
        }
    }, [activeTab, buySellTab]);

    const fetchUserBalance = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/wallet/usdt/balance/${userId}`);
            const data = await res.json();
            setUserBalance(data.balance || 0);
        } catch (error) {
            console.error('Ошибка:', error);
        }
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const type = buySellTab === 'buy' ? 'sell' : 'buy';
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
            await fetch(`${API_BASE_URL}/api/p2p/order/${adId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            showToast('✅ Объявление удалено', 'success');
            fetchMyAds();
        } catch (error) {
            showToast('Ошибка удаления', 'error');
        }
    };

    const createOrder = async () => {
        if (!newOrder.amount || !newOrder.rate) {
            showToast('Заполните сумму и курс', 'error');
            return;
        }
        if (newOrder.type === 'sell' && parseFloat(newOrder.amount) > userBalance) {
            showToast(`Недостаточно средств! Баланс: ${userBalance} USDT`, 'error');
            return;
        }
        if (newOrder.payment_methods.length === 0) {
            showToast('Выберите способ оплаты', 'error');
            return;
        }
        if (!newOrder.agreeTerms) {
            showToast('Подтвердите согласие с условиями', 'error');
            return;
        }

        setCreatingTrade(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/p2p/order/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    type: newOrder.type,
                    amount: parseFloat(newOrder.amount),
                    rate: parseFloat(newOrder.rate),
                    min_amount: parseFloat(newOrder.min_amount),
                    max_amount: newOrder.max_amount ? parseFloat(newOrder.max_amount) : parseFloat(newOrder.amount),
                    payment_methods: newOrder.payment_methods,
                    terms: newOrder.description || null
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast('✅ Объявление создано!', 'success');
                setShowCreateForm(false);
                setNewOrder({ type: 'sell', amount: '', rate: '', min_amount: '500', max_amount: '', payment_methods: [], description: '', agreeTerms: false });
                fetchMyAds();
                setActiveTab('my_ads');
            } else {
                showToast(data.error || 'Ошибка создания', 'error');
            }
        } catch (error) {
            showToast('Ошибка соединения', 'error');
        } finally {
            setCreatingTrade(false);
        }
    };

    const startTrade = async () => {
        if (!tradeAmount || parseFloat(tradeAmount) <= 0) {
            showToast('Введите сумму', 'error');
            return;
        }
        const amount = parseFloat(tradeAmount);
        if (amount < selectedOrder.min_amount || amount > selectedOrder.max_amount) {
            showToast(`Сумма должна быть от ${selectedOrder.min_amount} до ${selectedOrder.max_amount} USDT`, 'error');
            return;
        }
        if (amount > selectedOrder.available_amount) {
            showToast(`Доступно только ${selectedOrder.available_amount} USDT`, 'error');
            return;
        }

        setCreatingTrade(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/p2p/trade/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: selectedOrder.id,
                    buyerId: userId,
                    amount: amount
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast('✅ Сделка создана!', 'success');
                setShowModal(false);
                setTradeAmount('');
                setActiveTab('trades');
                fetchMyTrades();
            } else {
                showToast(data.error || 'Ошибка создания', 'error');
            }
        } catch (error) {
            showToast('Ошибка соединения', 'error');
        } finally {
            setCreatingTrade(false);
        }
    };

    const paymentMethodsList = [
        { value: 'bank_transfer', label: 'Банковский перевод', icon: '🏦' },
        { value: 'card', label: 'Карта', icon: '💳' },
        { value: 'sbp', label: 'СБП', icon: '📱' },
        { value: 'cash', label: 'Наличные', icon: '💰' }
    ];

    const togglePaymentMethod = (method) => {
        setNewOrder(prev => ({
            ...prev,
            payment_methods: prev.payment_methods.includes(method)
                ? prev.payment_methods.filter(m => m !== method)
                : [...prev.payment_methods, method]
        }));
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('ru-RU').format(num);
    };

    const getStatusText = (status) => {
        const statuses = {
            'pending': '🟡 Ожидает оплаты',
            'paid': '🟠 Оплачено',
            'completed': '✅ Завершена',
            'cancelled': '❌ Отменена'
        };
        return statuses[status] || status;
    };

    const getPaymentLabel = (method) => {
        const found = paymentMethodsList.find(m => m.value === method);
        return found ? `${found.icon} ${found.label}` : method;
    };

    return (
        <div className="p2p-fullscreen">
            {/* Верхняя навигация P2P */}
            <div className="p2p-nav-header">
                <button className="p2p-back-btn" onClick={onBack}>←</button>
                <span className="p2p-nav-title">P2P Маркет</span>
                <div className="p2p-nav-placeholder"></div>
            </div>

            {/* Вкладки */}
            <div className="p2p-main-tabs">
                <button 
                    className={`p2p-main-tab ${activeTab === 'market' ? 'active' : ''}`}
                    onClick={() => setActiveTab('market')}
                >
                    📊 Маркет
                </button>
                <button 
                    className={`p2p-main-tab ${activeTab === 'my_ads' ? 'active' : ''}`}
                    onClick={() => setActiveTab('my_ads')}
                >
                    📋 Мои
                </button>
                <button 
                    className={`p2p-main-tab ${activeTab === 'trades' ? 'active' : ''}`}
                    onClick={() => setActiveTab('trades')}
                >
                    📦 Ордера
                </button>
            </div>

            {/* Маркет */}
            {activeTab === 'market' && (
                <div className="p2p-market">
                    <div className="p2p-buy-sell-tabs">
                        <button 
                            className={`p2p-bs-tab ${buySellTab === 'buy' ? 'active' : ''}`}
                            onClick={() => setBuySellTab('buy')}
                        >
                            🛒 Купить USDT
                        </button>
                        <button 
                            className={`p2p-bs-tab ${buySellTab === 'sell' ? 'active' : ''}`}
                            onClick={() => setBuySellTab('sell')}
                        >
                            💰 Продать USDT
                        </button>
                    </div>

                    <div className="p2p-orders-list">
                        {loading ? (
                            <div className="p2p-loading">Загрузка...</div>
                        ) : orders.length === 0 ? (
                            <div className="p2p-empty">Нет объявлений</div>
                        ) : (
                            orders.map(order => (
                                <div key={order.id} className="p2p-order-item" onClick={() => { setSelectedOrder(order); setShowModal(true); }}>
                                    <div className="p2p-order-user">
                                        <div className="p2p-user-avatar">👤</div>
                                        <div>
                                            <div className="p2p-user-name">{order.user_name || 'Продавец'}</div>
                                            <div className="p2p-user-rating">⭐ {order.user_rating || 5}</div>
                                        </div>
                                    </div>
                                    <div className="p2p-order-rate">{formatNumber(order.rate)} ₽</div>
                                    <div className="p2p-order-amount">{formatNumber(order.available_amount)} USDT</div>
                                    <div className="p2p-order-payment">{order.payment_methods?.slice(0, 2).map(m => getPaymentLabel(m)).join(', ')}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Мои объявления */}
            {activeTab === 'my_ads' && (
                <div className="p2p-my-ads">
                    <button className="p2p-create-ad-btn" onClick={() => setShowCreateForm(!showCreateForm)}>
                        {showCreateForm ? '✖️ Закрыть' : '+ Создать объявление'}
                    </button>

                    {showCreateForm && (
                        <div className="p2p-create-form">
                            <div className="p2p-form-group">
                                <label>Тип</label>
                                <div className="p2p-type-switch">
                                    <button className={`p2p-type ${newOrder.type === 'sell' ? 'active sell' : ''}`} onClick={() => setNewOrder({...newOrder, type: 'sell'})}>💰 Продажа</button>
                                    <button className={`p2p-type ${newOrder.type === 'buy' ? 'active buy' : ''}`} onClick={() => setNewOrder({...newOrder, type: 'buy'})}>🛒 Покупка</button>
                                </div>
                            </div>

                            {newOrder.type === 'sell' && (
                                <div className="p2p-balance-info">Баланс: {userBalance} USDT</div>
                            )}

                            <div className="p2p-form-group">
                                <label>Сумма (USDT)</label>
                                <input type="number" className="p2p-input" value={newOrder.amount} onChange={e => setNewOrder({...newOrder, amount: e.target.value})} placeholder="Введите сумму" />
                            </div>

                            <div className="p2p-form-group">
                                <label>Курс (RUB)</label>
                                <input type="number" className="p2p-input" value={newOrder.rate} onChange={e => setNewOrder({...newOrder, rate: e.target.value})} placeholder="Например: 90" />
                            </div>

                            <div className="p2p-row">
                                <div className="p2p-form-group half">
                                    <label>Мин. сумма</label>
                                    <input type="number" className="p2p-input" value={newOrder.min_amount} onChange={e => setNewOrder({...newOrder, min_amount: e.target.value})} placeholder="500" />
                                </div>
                                <div className="p2p-form-group half">
                                    <label>Макс. сумма</label>
                                    <input type="number" className="p2p-input" value={newOrder.max_amount} onChange={e => setNewOrder({...newOrder, max_amount: e.target.value})} placeholder="Максимум" />
                                </div>
                            </div>

                            <div className="p2p-form-group">
                                <label>Способы оплаты</label>
                                <div className="p2p-payment-grid">
                                    {paymentMethodsList.map(m => (
                                        <button key={m.value} className={`p2p-payment-btn ${newOrder.payment_methods.includes(m.value) ? 'selected' : ''}`} onClick={() => togglePaymentMethod(m.value)}>
                                            {m.icon} {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p2p-form-group">
                                <label>Описание</label>
                                <textarea className="p2p-textarea" value={newOrder.description} onChange={e => setNewOrder({...newOrder, description: e.target.value})} rows="3" placeholder="Условия сделки..." />
                            </div>

                            <label className="p2p-checkbox">
                                <input type="checkbox" checked={newOrder.agreeTerms} onChange={e => setNewOrder({...newOrder, agreeTerms: e.target.checked})} />
                                <span>Я соглашаюсь с правилами платформы</span>
                            </label>

                            <button className="p2p-submit-btn" onClick={createOrder} disabled={creatingTrade}>
                                {creatingTrade ? 'Создание...' : 'Создать объявление'}
                            </button>
                        </div>
                    )}

                    {loading ? (
                        <div className="p2p-loading">Загрузка...</div>
                    ) : myAds.length === 0 ? (
                        <div className="p2p-empty">У вас нет объявлений</div>
                    ) : (
                        myAds.map(ad => (
                            <div key={ad.id} className="p2p-ad-item">
                                <div className="p2p-ad-header">
                                    <span className={`p2p-ad-type ${ad.type}`}>{ad.type === 'sell' ? '💰 Продажа' : '🛒 Покупка'}</span>
                                    <span className={`p2p-ad-status ${ad.status}`}>{ad.status === 'active' ? 'Активно' : 'Приостановлено'}</span>
                                </div>
                                <div className="p2p-ad-rate">{ad.rate} ₽</div>
                                <div className="p2p-ad-amount">{ad.available_amount}/{ad.amount} USDT</div>
                                <button className="p2p-ad-delete" onClick={() => deleteAd(ad.id)}>Удалить</button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Ордера */}
            {activeTab === 'trades' && (
                <div className="p2p-trades">
                    {loading ? (
                        <div className="p2p-loading">Загрузка...</div>
                    ) : myTrades.length === 0 ? (
                        <div className="p2p-empty">Нет сделок</div>
                    ) : (
                        myTrades.map(trade => (
                            <div key={trade.trade_id} className="p2p-trade-item">
                                <div className="p2p-trade-header">
                                    <span className="p2p-trade-id">#{trade.trade_id}</span>
                                    <span className={`p2p-trade-status ${trade.status}`}>{getStatusText(trade.status)}</span>
                                </div>
                                <div className="p2p-trade-amount">{trade.amount} USDT × {trade.rate} ₽</div>
                                <div className="p2p-trade-total">= {trade.total_rub} ₽</div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Модалка сделки */}
            {showModal && selectedOrder && (
                <div className="p2p-modal" onClick={() => setShowModal(false)}>
                    <div className="p2p-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="p2p-modal-header">
                            <span>Создание сделки</span>
                            <button onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="p2p-modal-body">
                            <div className="p2p-trade-info">
                                <div>Курс: {selectedOrder.rate} ₽</div>
                                <div>Лимиты: {selectedOrder.min_amount} - {selectedOrder.max_amount} USDT</div>
                            </div>
                            <input type="number" className="p2p-modal-input" placeholder="Сумма в USDT" value={tradeAmount} onChange={e => setTradeAmount(e.target.value)} />
                            {tradeAmount && <div className="p2p-modal-total">Итого: {formatNumber(parseFloat(tradeAmount) * selectedOrder.rate)} ₽</div>}
                            <button className="p2p-modal-btn" onClick={startTrade} disabled={creatingTrade}>{creatingTrade ? 'Создание...' : 'Начать сделку'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}