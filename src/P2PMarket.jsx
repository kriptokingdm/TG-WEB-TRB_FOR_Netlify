// src/P2PMarket.jsx
import React, { useState, useEffect } from 'react';
import './P2P.css';

const API_BASE_URL = 'https://tethrab.shop';

export default function P2PMarket({ telegramUser, showToast, onBack }) {
    const [activeTab, setActiveTab] = useState('market');
    const [orders, setOrders] = useState([]);
    const [myAds, setMyAds] = useState([]);
    const [myTrades, setMyTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [tradeAmount, setTradeAmount] = useState('');
    const [creatingTrade, setCreatingTrade] = useState(false);
    
    // Простые фильтры
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [sortBy, setSortBy] = useState('rate_asc'); // rate_asc или rate_desc
    
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [userBalance, setUserBalance] = useState(0);

    const userId = telegramUser?.id || '7879866656';

    const [newOrder, setNewOrder] = useState({
        type: 'sell',
        amount: '',
        rate: '',
        min_amount: '10',
        max_amount: '',
        payment_methods: [],
        terms: ''
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
    }, [activeTab, paymentFilter, sortBy]);

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
            let url = `${API_BASE_URL}/api/p2p/orders?limit=50`;
            
            if (paymentFilter !== 'all') {
                url += `&payment=${paymentFilter}`;
            }
            
            const res = await fetch(url);
            const data = await res.json();
            
            let sortedOrders = data.orders || [];
            
            // Сортировка только по курсу
            if (sortBy === 'rate_asc') {
                sortedOrders.sort((a, b) => a.rate - b.rate);
            } else {
                sortedOrders.sort((a, b) => b.rate - a.rate);
            }
            
            // Добавляем имя пользователя
            const ordersWithNames = sortedOrders.map(order => ({
                ...order,
                user_name: order.user_name || `User${order.user_id?.slice(-4)}`
            }));
            setOrders(ordersWithNames);
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
                    terms: newOrder.terms || null
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast('✅ Объявление создано!', 'success');
                setShowCreateForm(false);
                setNewOrder({ type: 'sell', amount: '', rate: '', min_amount: '10', max_amount: '', payment_methods: [], terms: '' });
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

    const shareOrder = (order) => {
        const botUsername = 'TetherRabbitBot';
        const shareUrl = `https://t.me/${botUsername}?start=order_${order.id}`;
        navigator.clipboard.writeText(shareUrl);
        showToast('✅ Ссылка на объявление скопирована!', 'success');
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

    return (
        <div className="p2p-fullscreen">
            {/* Хедер */}
            <div className="p2p-header">
                <button className="p2p-back" onClick={onBack}>←</button>
                <h1>P2P Маркет</h1>
                <div className="p2p-placeholder"></div>
            </div>

            {/* Табы */}
            <div className="p2p-tabs">
                <button className={activeTab === 'market' ? 'active' : ''} onClick={() => setActiveTab('market')}>
                    📊 Маркет
                </button>
                <button className={activeTab === 'my_ads' ? 'active' : ''} onClick={() => setActiveTab('my_ads')}>
                    📋 Мои
                </button>
                <button className={activeTab === 'trades' ? 'active' : ''} onClick={() => setActiveTab('trades')}>
                    📦 Ордера
                </button>
            </div>

            {/* Маркет */}
            {activeTab === 'market' && (
                <div className="p2p-market">
                    {/* Фильтры */}
                    <div className="p2p-filters">
                        <div className="p2p-filter-row">
                            <select 
                                value={paymentFilter} 
                                onChange={e => setPaymentFilter(e.target.value)}
                                className="p2p-filter-select"
                            >
                                <option value="all">Все способы оплаты</option>
                                {paymentMethodsList.map(m => (
                                    <option key={m.value} value={m.value}>{m.icon} {m.label}</option>
                                ))}
                            </select>
                            
                            <select 
                                value={sortBy} 
                                onChange={e => setSortBy(e.target.value)}
                                className="p2p-filter-select"
                            >
                                <option value="rate_asc">💰 По возрастанию курса</option>
                                <option value="rate_desc">💰 По убыванию курса</option>
                            </select>
                        </div>
                    </div>

                    {/* Список объявлений */}
                    <div className="p2p-orders-list">
                        {loading ? (
                            <div className="p2p-loading">Загрузка...</div>
                        ) : orders.length === 0 ? (
                            <div className="p2p-empty">Нет объявлений</div>
                        ) : (
                            orders.map(order => (
                                <div key={order.id} className="p2p-order-card">
                                    <div className="p2p-order-user">
                                        <div className="p2p-user-avatar">
                                            {order.user_name?.charAt(0) || '👤'}
                                        </div>
                                        <div className="p2p-user-name">{order.user_name}</div>
                                    </div>
                                    
                                    <div className="p2p-order-rate">
                                        {formatNumber(order.rate)} ₽
                                    </div>
                                    
                                    <div className="p2p-order-amount">
                                        {formatNumber(order.available_amount)} USDT
                                    </div>
                                    
                                    <div className="p2p-order-payment">
                                        {order.payment_methods?.slice(0, 2).map(method => (
                                            <span key={method} className="p2p-payment-chip">
                                                {getPaymentLabel(method)}
                                            </span>
                                        ))}
                                    </div>
                                    
                                    <div className="p2p-order-buttons">
                                        <button 
                                            className="p2p-buy-btn"
                                            onClick={() => { setSelectedOrder(order); setShowModal(true); }}
                                        >
                                            Купить
                                        </button>
                                        <button 
                                            className="p2p-share-btn"
                                            onClick={() => shareOrder(order)}
                                        >
                                            📤
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Мои объявления */}
            {activeTab === 'my_ads' && (
                <div className="p2p-my-ads">
                    <button className="p2p-create-btn" onClick={() => setShowCreateForm(!showCreateForm)}>
                        {showCreateForm ? '✖️ Закрыть' : '+ Создать объявление'}
                    </button>

                    {showCreateForm && (
                        <div className="p2p-create-form">
                            <h3>Новое объявление</h3>
                            
                            <div className="p2p-form-group">
                                <label>Тип</label>
                                <div className="p2p-type-buttons">
                                    <button className={newOrder.type === 'sell' ? 'active sell' : ''} onClick={() => setNewOrder({...newOrder, type: 'sell'})}>
                                        💰 Продажа
                                    </button>
                                    <button className={newOrder.type === 'buy' ? 'active buy' : ''} onClick={() => setNewOrder({...newOrder, type: 'buy'})}>
                                        🛒 Покупка
                                    </button>
                                </div>
                            </div>

                            {newOrder.type === 'sell' && (
                                <div className="p2p-balance-hint">
                                    💰 Ваш баланс: {userBalance} USDT
                                </div>
                            )}

                            <div className="p2p-form-row">
                                <div className="p2p-form-group half">
                                    <label>Сумма (USDT)</label>
                                    <input type="number" placeholder="100" value={newOrder.amount} onChange={e => setNewOrder({...newOrder, amount: e.target.value})} />
                                </div>
                                <div className="p2p-form-group half">
                                    <label>Курс (RUB)</label>
                                    <input type="number" placeholder="90" value={newOrder.rate} onChange={e => setNewOrder({...newOrder, rate: e.target.value})} />
                                </div>
                            </div>

                            <div className="p2p-form-row">
                                <div className="p2p-form-group half">
                                    <label>Мин. сумма</label>
                                    <input type="number" placeholder="10" value={newOrder.min_amount} onChange={e => setNewOrder({...newOrder, min_amount: e.target.value})} />
                                </div>
                                <div className="p2p-form-group half">
                                    <label>Макс. сумма</label>
                                    <input type="number" placeholder="Макс" value={newOrder.max_amount} onChange={e => setNewOrder({...newOrder, max_amount: e.target.value})} />
                                </div>
                            </div>

                            <div className="p2p-form-group">
                                <label>Способы оплаты</label>
                                <div className="p2p-payment-buttons">
                                    {paymentMethodsList.map(m => (
                                        <button 
                                            key={m.value}
                                            className={newOrder.payment_methods.includes(m.value) ? 'selected' : ''}
                                            onClick={() => {
                                                const methods = newOrder.payment_methods.includes(m.value)
                                                    ? newOrder.payment_methods.filter(x => x !== m.value)
                                                    : [...newOrder.payment_methods, m.value];
                                                setNewOrder({...newOrder, payment_methods: methods});
                                            }}
                                        >
                                            {m.icon} {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button className="p2p-submit" onClick={createOrder} disabled={creatingTrade}>
                                {creatingTrade ? 'Создание...' : '✅ Создать объявление'}
                            </button>
                        </div>
                    )}

                    <div className="p2p-ads-list">
                        {loading ? (
                            <div className="p2p-loading">Загрузка...</div>
                        ) : myAds.length === 0 ? (
                            <div className="p2p-empty">У вас нет объявлений</div>
                        ) : (
                            myAds.map(ad => (
                                <div key={ad.id} className="p2p-ad-card">
                                    <div className="p2p-ad-header">
                                        <span className={`p2p-ad-type ${ad.type}`}>
                                            {ad.type === 'sell' ? '💰 Продажа' : '🛒 Покупка'}
                                        </span>
                                        <span className={`p2p-ad-status ${ad.status}`}>
                                            {ad.status === 'active' ? 'Активно' : 'Приостановлено'}
                                        </span>
                                    </div>
                                    <div className="p2p-ad-rate">{ad.rate} ₽</div>
                                    <div className="p2p-ad-amount">{ad.available_amount}/{ad.amount} USDT</div>
                                    <button className="p2p-ad-delete" onClick={() => deleteAd(ad.id)}>Удалить</button>
                                </div>
                            ))
                        )}
                    </div>
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
                            <div key={trade.trade_id} className="p2p-trade-card">
                                <div className="p2p-trade-header">
                                    <span className="p2p-trade-id">Сделка #{trade.trade_id}</span>
                                    <span className={`p2p-trade-status ${trade.status}`}>{getStatusText(trade.status)}</span>
                                </div>
                                <div className="p2p-trade-amount">{trade.amount} USDT × {trade.rate} ₽</div>
                                <div className="p2p-trade-total">= {trade.total_rub} ₽</div>
                                <div className="p2p-trade-date">{new Date(trade.created_at).toLocaleString()}</div>
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
                            <button className="p2p-modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="p2p-modal-body">
                            <div className="p2p-trade-info">
                                <div>Курс: <strong>{selectedOrder.rate} ₽</strong></div>
                                <div>Лимиты: {selectedOrder.min_amount} - {selectedOrder.max_amount} USDT</div>
                                <div>Доступно: {selectedOrder.available_amount} USDT</div>
                            </div>
                            <input 
                                type="number" 
                                className="p2p-trade-input" 
                                placeholder="Введите сумму в USDT" 
                                value={tradeAmount} 
                                onChange={e => setTradeAmount(e.target.value)} 
                            />
                            {tradeAmount && (
                                <div className="p2p-trade-total">
                                    Итого: {formatNumber(parseFloat(tradeAmount) * selectedOrder.rate)} ₽
                                </div>
                            )}
                            <button className="p2p-trade-btn" onClick={startTrade} disabled={creatingTrade}>
                                {creatingTrade ? 'Создание...' : '✅ Начать сделку'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}