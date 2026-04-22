// src/P2PMarket.jsx
import React, { useState, useEffect } from 'react';
import './P2P.css';

const API = 'https://tethrab.shop';

export default function P2PMarket({ telegramUser, showToast, onBack }) {
    const userId = telegramUser?.id || '7879866656';
    const [userBalance, setUserBalance] = useState(0);

    // Состояния
    const [activeMenu, setActiveMenu] = useState('main'); // main, buy, sell, my_ads, trades, stats, help
    const [buyOrders, setBuyOrders] = useState([]);
    const [sellOrders, setSellOrders] = useState([]);
    const [myAds, setMyAds] = useState([]);
    const [myTrades, setMyTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userStats, setUserStats] = useState({ total_trades: 0, successful_trades: 0, total_volume: 0 });

    const [selected, setSelected] = useState(null);
    const [amount, setAmount] = useState('');
    const [currencyType, setCurrencyType] = useState('usdt');
    const [creatingTrade, setCreatingTrade] = useState(false);

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newOrder, setNewOrder] = useState({
        type: 'sell',
        amount: '',
        rate: '',
        min_amount: '10',
        max_amount: '',
        payment_methods: [],
        terms: '',
        payment_time: '30'
    });

    const paymentMethodsList = [
        { value: 'bank_transfer', label: 'Банковский перевод', icon: '🏦' },
        { value: 'card', label: 'Карта', icon: '💳' },
        { value: 'sbp', label: 'СБП', icon: '📱' },
        { value: 'cash', label: 'Наличные', icon: '💰' }
    ];

    const timeOptions = [
        { value: '15', label: '15 минут' },
        { value: '30', label: '30 минут' },
        { value: '60', label: '1 час' },
        { value: '120', label: '2 часа' }
    ];

    // Загрузка данных
    useEffect(() => {
        fetchUserBalance();
        fetchUserStats();
        fetchOrders();
    }, []);

    useEffect(() => {
        if (activeMenu === 'my_ads') fetchMyAds();
        if (activeMenu === 'trades') fetchMyTrades();
    }, [activeMenu]);

    const fetchUserBalance = async () => {
        try {
            const res = await fetch(`${API}/api/wallet/usdt/balance/${userId}`);
            const data = await res.json();
            setUserBalance(data.balance || 0);
        } catch (e) {}
    };

    const fetchUserStats = async () => {
        try {
            const res = await fetch(`${API}/api/p2p/stats/${userId}`);
            const data = await res.json();
            setUserStats({
                total_trades: data.total_trades || 0,
                successful_trades: data.successful_trades || 0,
                total_volume: data.total_volume || 0
            });
        } catch (e) {}
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const [buyRes, sellRes] = await Promise.all([
                fetch(`${API}/api/p2p/orders?type=buy&limit=50`),
                fetch(`${API}/api/p2p/orders?type=sell&limit=50`)
            ]);
            const buyData = await buyRes.json();
            const sellData = await sellRes.json();

            const buyWithStats = await Promise.all((buyData.orders || []).map(async (order) => {
                const statsRes = await fetch(`${API}/api/p2p/stats/${order.user_id}`);
                const stats = await statsRes.json();
                return {
                    ...order,
                    completion_rate: stats.successful_trades && stats.total_trades 
                        ? Math.round((stats.successful_trades / stats.total_trades) * 100)
                        : 100,
                    completed_trades: stats.successful_trades || 0
                };
            }));

            const sellWithStats = await Promise.all((sellData.orders || []).map(async (order) => {
                const statsRes = await fetch(`${API}/api/p2p/stats/${order.user_id}`);
                const stats = await statsRes.json();
                return {
                    ...order,
                    completion_rate: stats.successful_trades && stats.total_trades 
                        ? Math.round((stats.successful_trades / stats.total_trades) * 100)
                        : 100,
                    completed_trades: stats.successful_trades || 0
                };
            }));

            setBuyOrders(buyWithStats.sort((a, b) => b.rate - a.rate));
            setSellOrders(sellWithStats.sort((a, b) => a.rate - b.rate));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyAds = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/p2p/orders/user/${userId}`);
            const data = await res.json();
            setMyAds(data.orders || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyTrades = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/p2p/trades/user/${userId}`);
            const data = await res.json();
            setMyTrades(data.trades || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const deleteAd = async (adId) => {
        if (!window.confirm('Удалить объявление?')) return;
        try {
            await fetch(`${API}/api/p2p/order/${adId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            showToast('✅ Объявление удалено', 'success');
            fetchMyAds();
        } catch (e) {
            showToast('Ошибка удаления', 'error');
        }
    };

    const updateAdRate = async (adId, newRate) => {
        try {
            await fetch(`${API}/api/p2p/order/${adId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, rate: newRate })
            });
            showToast('✅ Курс обновлён', 'success');
            fetchMyAds();
        } catch (e) {
            showToast('Ошибка', 'error');
        }
    };

    const createOrder = async () => {
        if (!newOrder.amount || !newOrder.rate) {
            showToast('Заполните сумму и курс', 'error');
            return;
        }
        if (newOrder.payment_methods.length === 0) {
            showToast('Выберите способ оплаты', 'error');
            return;
        }

        setCreatingTrade(true);
        try {
            const res = await fetch(`${API}/api/p2p/order/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    type: newOrder.type,
                    amount: parseFloat(newOrder.amount),
                    rate: parseFloat(newOrder.rate),
                    min_amount: parseFloat(newOrder.min_amount),
                    max_amount: newOrder.max_amount ? parseFloat(newOrder.max_amount) : parseFloat(newOrder.amount),
                    payment_methods: newOrder.payment_methods,
                    terms: newOrder.terms,
                    payment_time: parseInt(newOrder.payment_time)
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast('✅ Объявление создано!', 'success');
                setShowCreateForm(false);
                setNewOrder({ type: 'sell', amount: '', rate: '', min_amount: '10', max_amount: '', payment_methods: [], terms: '', payment_time: '30' });
                fetchMyAds();
                setActiveMenu('my_ads');
            } else {
                showToast(data.error || 'Ошибка', 'error');
            }
        } catch (e) {
            showToast('Ошибка соединения', 'error');
        } finally {
            setCreatingTrade(false);
        }
    };

    const startTrade = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            showToast('Введите сумму', 'error');
            return;
        }

        let usdtAmount = parseFloat(amount);
        if (currencyType === 'rub') {
            usdtAmount = parseFloat(amount) / selected.rate;
        }

        if (usdtAmount < selected.min_amount || usdtAmount > selected.max_amount) {
            showToast(`Сумма должна быть от ${selected.min_amount} до ${selected.max_amount} USDT`, 'error');
            return;
        }
        if (usdtAmount > selected.available_amount) {
            showToast(`Доступно только ${selected.available_amount} USDT`, 'error');
            return;
        }

        setCreatingTrade(true);
        try {
            const res = await fetch(`${API}/api/p2p/trade/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    orderId: selected.id, 
                    buyerId: userId, 
                    amount: usdtAmount,
                    expires_minutes: selected.payment_time || 30
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast(`✅ Сделка создана! У вас ${selected.payment_time || 30} минут на оплату`, 'success');
                setSelected(null);
                setAmount('');
                setActiveMenu('trades');
                fetchMyTrades();
            } else {
                showToast(data.error || 'Ошибка', 'error');
            }
        } catch (e) {
            showToast('Ошибка соединения', 'error');
        } finally {
            setCreatingTrade(false);
        }
    };

    const confirmPayment = async (tradeId) => {
        try {
            const res = await fetch(`${API}/api/p2p/trade/confirm-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tradeId, userId })
            });
            const data = await res.json();
            if (data.success) {
                showToast('✅ Оплата подтверждена! Ожидайте подтверждения продавца', 'success');
                fetchMyTrades();
            } else {
                showToast(data.error || 'Ошибка', 'error');
            }
        } catch (e) {
            showToast('Ошибка соединения', 'error');
        }
    };

    const confirmReceipt = async (tradeId) => {
        try {
            const res = await fetch(`${API}/api/p2p/trade/confirm-receipt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tradeId, userId })
            });
            const data = await res.json();
            if (data.success) {
                showToast('✅ Сделка успешно завершена!', 'success');
                fetchMyTrades();
            } else {
                showToast(data.error || 'Ошибка', 'error');
            }
        } catch (e) {
            showToast('Ошибка соединения', 'error');
        }
    };

    const cancelTrade = async (tradeId) => {
        if (!window.confirm('Отменить сделку?')) return;
        try {
            const res = await fetch(`${API}/api/p2p/trade/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tradeId, userId })
            });
            const data = await res.json();
            if (data.success) {
                showToast('❌ Сделка отменена', 'success');
                fetchMyTrades();
            } else {
                showToast(data.error || 'Ошибка', 'error');
            }
        } catch (e) {
            showToast('Ошибка соединения', 'error');
        }
    };

    const shareOrder = (order) => {
        const shareUrl = `https://t.me/TetherRabbitBot?start=order_${order.id}`;
        navigator.clipboard.writeText(shareUrl);
        showToast('✅ Ссылка скопирована!', 'success');
    };

    const formatNumber = (num) => new Intl.NumberFormat('ru-RU').format(num);

    const getStatusText = (status) => {
        const map = { 
            pending: '⏳ Ожидает оплаты', 
            paid: '💸 Оплачено', 
            completed: '✅ Завершена', 
            cancelled: '❌ Отменена', 
            expired: '⏰ Просрочена' 
        };
        return map[status] || status;
    };

    const getTimeLeft = (expiresAt) => {
        if (!expiresAt) return null;
        const diff = new Date(expiresAt) - new Date();
        if (diff <= 0) return 'expired';
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const getPaymentLabel = (method) => {
        const found = paymentMethodsList.find(m => m.value === method);
        return found ? `${found.icon} ${found.label}` : method;
    };

    // ============ КОМПОНЕНТЫ ============

    // Главное меню
    const MainMenu = () => (
        <div className="p2p-main-menu">
            <div className="p2p-profile-card">
                <div className="p2p-avatar">{telegramUser?.first_name?.[0] || 'U'}</div>
                <div className="p2p-profile-info">
                    <div className="p2p-profile-name">{telegramUser?.first_name || 'Пользователь'}</div>
                    <div className="p2p-profile-balance">💰 {userBalance.toFixed(2)} USDT</div>
                </div>
            </div>

            <div className="p2p-stats-card">
                <div className="p2p-stat-item">
                    <span className="stat-value">{userStats.total_trades}</span>
                    <span className="stat-label">Всего сделок</span>
                </div>
                <div className="p2p-stat-item">
                    <span className="stat-value">{userStats.successful_trades}</span>
                    <span className="stat-label">Успешных</span>
                </div>
                <div className="p2p-stat-item">
                    <span className="stat-value">{formatNumber(userStats.total_volume)}</span>
                    <span className="stat-label">Объём, USDT</span>
                </div>
            </div>

            <div className="p2p-menu-buttons">
                <button className="p2p-menu-btn buy" onClick={() => setActiveMenu('buy')}>
                    <span className="btn-icon">🛒</span>
                    <span className="btn-text">Купить USDT</span>
                    <span className="btn-arrow">→</span>
                </button>
                <button className="p2p-menu-btn sell" onClick={() => setActiveMenu('sell')}>
                    <span className="btn-icon">💰</span>
                    <span className="btn-text">Продать USDT</span>
                    <span className="btn-arrow">→</span>
                </button>
                <button className="p2p-menu-btn" onClick={() => setActiveMenu('my_ads')}>
                    <span className="btn-icon">📋</span>
                    <span className="btn-text">Мои объявления</span>
                    <span className="btn-arrow">→</span>
                </button>
                <button className="p2p-menu-btn" onClick={() => { setActiveMenu('trades'); fetchMyTrades(); }}>
                    <span className="btn-icon">📦</span>
                    <span className="btn-text">Мои ордера</span>
                    <span className="btn-arrow">→</span>
                </button>
                <button className="p2p-menu-btn" onClick={() => setActiveMenu('stats')}>
                    <span className="btn-icon">📊</span>
                    <span className="btn-text">Статистика</span>
                    <span className="btn-arrow">→</span>
                </button>
                <button className="p2p-menu-btn" onClick={() => setActiveMenu('help')}>
                    <span className="btn-icon">❓</span>
                    <span className="btn-text">Справка</span>
                    <span className="btn-arrow">→</span>
                </button>
            </div>
        </div>
    );

    // Страница покупки (стакан продавцов)
    const BuyMarket = () => (
        <div className="p2p-market-page">
            <div className="page-header">
                <button className="back-btn" onClick={() => setActiveMenu('main')}>←</button>
                <h2>🛒 Купить USDT</h2>
            </div>
            <div className="orders-list">
                {loading ? (
                    [...Array(4)].map((_, i) => <div key={i} className="skeleton-card" />)
                ) : sellOrders.length === 0 ? (
                    <div className="empty-state">Нет объявлений на продажу</div>
                ) : (
                    sellOrders.map(order => <OrderCard key={order.id} order={order} type="buy" />)
                )}
            </div>
        </div>
    );

    // Страница продажи (стакан покупателей)
    const SellMarket = () => (
        <div className="p2p-market-page">
            <div className="page-header">
                <button className="back-btn" onClick={() => setActiveMenu('main')}>←</button>
                <h2>💰 Продать USDT</h2>
            </div>
            <div className="orders-list">
                {loading ? (
                    [...Array(4)].map((_, i) => <div key={i} className="skeleton-card" />)
                ) : buyOrders.length === 0 ? (
                    <div className="empty-state">Нет объявлений на покупку</div>
                ) : (
                    buyOrders.map(order => <OrderCard key={order.id} order={order} type="sell" />)
                )}
            </div>
        </div>
    );

    // Карточка объявления
    const OrderCard = ({ order, type }) => (
        <div className="order-card" onClick={() => setSelected(order)}>
            <div className="order-card-header">
                <div className="seller-info">
                    <div className="seller-avatar">{order.user_name?.[0] || 'U'}</div>
                    <div>
                        <div className="seller-name">{order.user_name || `User${order.user_id?.slice(-4)}`}</div>
                        <div className="seller-stats">
                            <span className="completion">✅ {order.completion_rate || 100}%</span>
                            <span className="trades-count">{order.completed_trades || 0} сделок</span>
                        </div>
                    </div>
                </div>
                <div className={`order-badge ${type}`}>
                    {type === 'buy' ? 'ПРОДАВЕЦ' : 'ПОКУПАТЕЛЬ'}
                </div>
            </div>
            <div className="order-card-rate">
                <span className="rate-value">{formatNumber(order.rate)}</span>
                <span className="rate-currency">₽</span>
            </div>
            <div className="order-card-details">
                <div className="detail-item">
                    <span>Доступно</span>
                    <strong>{formatNumber(order.available_amount)} USDT</strong>
                </div>
                <div className="detail-item">
                    <span>Лимиты</span>
                    <strong>{formatNumber(order.min_amount)} - {formatNumber(order.max_amount)} USDT</strong>
                </div>
            </div>
            <div className="order-card-payment">
                {order.payment_methods?.slice(0, 2).map(method => (
                    <span key={method} className="payment-chip">{getPaymentLabel(method)}</span>
                ))}
            </div>
            <div className="order-card-actions">
                <button className={`action-btn ${type}`} onClick={(e) => { e.stopPropagation(); setSelected(order); }}>
                    {type === 'buy' ? 'Купить USDT' : 'Продать USDT'}
                </button>
                <button className="share-btn" onClick={(e) => { e.stopPropagation(); shareOrder(order); }}>📤</button>
            </div>
        </div>
    );

    // Мои объявления
    const MyAdsList = () => (
        <div className="p2p-market-page">
            <div className="page-header">
                <button className="back-btn" onClick={() => setActiveMenu('main')}>←</button>
                <h2>📋 Мои объявления</h2>
                <button className="create-btn-small" onClick={() => setShowCreateForm(!showCreateForm)}>+</button>
            </div>

            {showCreateForm && (
                <div className="create-form">
                    <h4>Новое объявление</h4>
                    <div className="form-row">
                        <button className={newOrder.type === 'sell' ? 'active sell' : ''} onClick={() => setNewOrder({...newOrder, type: 'sell'})}>💰 Продажа</button>
                        <button className={newOrder.type === 'buy' ? 'active buy' : ''} onClick={() => setNewOrder({...newOrder, type: 'buy'})}>🛒 Покупка</button>
                    </div>
                    <input type="number" placeholder="Сумма (USDT)" value={newOrder.amount} onChange={e => setNewOrder({...newOrder, amount: e.target.value})} />
                    <input type="number" placeholder="Курс (RUB)" value={newOrder.rate} onChange={e => setNewOrder({...newOrder, rate: e.target.value})} />
                    <div className="form-row">
                        <input type="number" placeholder="Мин. сумма" value={newOrder.min_amount} onChange={e => setNewOrder({...newOrder, min_amount: e.target.value})} />
                        <input type="number" placeholder="Макс. сумма" value={newOrder.max_amount} onChange={e => setNewOrder({...newOrder, max_amount: e.target.value})} />
                    </div>
                    <div className="payment-buttons">
                        {paymentMethodsList.map(m => (
                            <button key={m.value} className={newOrder.payment_methods.includes(m.value) ? 'selected' : ''} onClick={() => {
                                const methods = newOrder.payment_methods.includes(m.value)
                                    ? newOrder.payment_methods.filter(x => x !== m.value)
                                    : [...newOrder.payment_methods, m.value];
                                setNewOrder({...newOrder, payment_methods: methods});
                            }}>{m.icon} {m.label}</button>
                        ))}
                    </div>
                    <select value={newOrder.payment_time} onChange={e => setNewOrder({...newOrder, payment_time: e.target.value})} className="time-select">
                        {timeOptions.map(opt => <option key={opt.value} value={opt.value}>⏰ {opt.label}</option>)}
                    </select>
                    <textarea placeholder="Условия сделки" value={newOrder.terms} onChange={e => setNewOrder({...newOrder, terms: e.target.value})} rows="2" />
                    <button className="submit-btn" onClick={createOrder} disabled={creatingTrade}>✅ Создать</button>
                </div>
            )}

            <div className="ads-list">
                {loading ? <div className="loading">Загрузка...</div> : myAds.length === 0 ? <div className="empty-state">У вас нет объявлений</div> : myAds.map(ad => (
                    <div key={ad.id} className="ad-card">
                        <div className="ad-card-header">
                            <span className={`ad-type ${ad.type}`}>{ad.type === 'sell' ? '💰 Продажа' : '🛒 Покупка'}</span>
                            <span className={`ad-status ${ad.status}`}>{ad.status === 'active' ? '✅ Активно' : '⏸ Приостановлено'}</span>
                        </div>
                        <div className="ad-card-rate">{formatNumber(ad.rate)} ₽</div>
                        <div className="ad-card-amount">{formatNumber(ad.available_amount)} / {formatNumber(ad.amount)} USDT</div>
                        <div className="ad-card-actions">
                            <button className="ad-edit" onClick={() => {
                                const newRate = prompt('Новый курс:', ad.rate);
                                if (newRate && !isNaN(newRate)) updateAdRate(ad.id, parseFloat(newRate));
                            }}>✏️ Курс</button>
                            <button className="ad-delete" onClick={() => deleteAd(ad.id)}>🗑 Удалить</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // Мои ордера
    const MyTradesList = () => (
        <div className="p2p-market-page">
            <div className="page-header">
                <button className="back-btn" onClick={() => setActiveMenu('main')}>←</button>
                <h2>📦 Мои ордера</h2>
            </div>
            <div className="trades-list">
                {loading ? <div className="loading">Загрузка...</div> : myTrades.length === 0 ? <div className="empty-state">Нет сделок</div> : myTrades.map(trade => <TradeCard key={trade.trade_id} trade={trade} />)}
            </div>
        </div>
    );

    // Карточка сделки
    const TradeCard = ({ trade }) => {
        const isBuyer = trade.buyer_id === userId;
        const isSeller = trade.seller_id === userId;
        const timeLeft = getTimeLeft(trade.expires_at);
        const isExpired = timeLeft === 'expired';
        
        return (
            <div className={`trade-card ${trade.status}`}>
                <div className="trade-card-header">
                    <div className="trade-id">Сделка #{trade.trade_id}</div>
                    <div className={`trade-status ${trade.status}`}>{getStatusText(trade.status)}</div>
                </div>
                <div className="trade-amount">{trade.amount} USDT × {trade.rate} ₽ = {formatNumber(trade.total_rub)} ₽</div>
                <div className="trade-role">
                    {isBuyer && <span className="role-badge buyer">Вы покупатель</span>}
                    {isSeller && <span className="role-badge seller">Вы продавец</span>}
                </div>
                {trade.expires_at && trade.status === 'pending' && !isExpired && (
                    <div className="trade-timer">⏰ Осталось: {timeLeft}</div>
                )}
                <div className="trade-date">{new Date(trade.created_at).toLocaleString()}</div>
                {trade.status === 'pending' && !isExpired && (
                    <div className="trade-actions">
                        {isBuyer && <button className="trade-pay-btn" onClick={() => confirmPayment(trade.trade_id)}>✅ Оплатить</button>}
                        <button className="trade-cancel-btn" onClick={() => cancelTrade(trade.trade_id)}>❌ Отменить</button>
                    </div>
                )}
                {trade.status === 'paid' && isSeller && (
                    <button className="trade-confirm-btn" onClick={() => confirmReceipt(trade.trade_id)}>🏁 Подтвердить получение</button>
                )}
            </div>
        );
    };

    // Статистика
    const StatsPage = () => (
        <div className="p2p-market-page">
            <div className="page-header">
                <button className="back-btn" onClick={() => setActiveMenu('main')}>←</button>
                <h2>📊 Статистика</h2>
            </div>
            <div className="stats-container">
                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-info">
                        <div className="stat-value">{userStats.total_trades}</div>
                        <div className="stat-label">Всего сделок</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                        <div className="stat-value">{userStats.successful_trades}</div>
                        <div className="stat-label">Успешных сделок</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-info">
                        <div className="stat-value">{formatNumber(userStats.total_volume)}</div>
                        <div className="stat-label">Общий объём, USDT</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⭐</div>
                    <div className="stat-info">
                        <div className="stat-value">{userStats.total_trades ? Math.round((userStats.successful_trades / userStats.total_trades) * 100) : 100}%</div>
                        <div className="stat-label">Успешность</div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Справка
    const HelpPage = () => (
        <div className="p2p-market-page">
            <div className="page-header">
                <button className="back-btn" onClick={() => setActiveMenu('main')}>←</button>
                <h2>❓ Справка</h2>
            </div>
            <div className="help-container">
                <div className="help-section">
                    <h3>🤝 Как работает P2P маркет?</h3>
                    <p>Вы можете покупать и продавать USDT напрямую с другими пользователями. Средства блокируются системой до подтверждения сделки.</p>
                </div>
                <div className="help-section">
                    <h3>⏰ Время на оплату</h3>
                    <p>После создания сделки у вас есть 15-120 минут на оплату (выбирается продавцом). При просрочке сделка отменяется.</p>
                </div>
                <div className="help-section">
                    <h3>✅ Защита сделки</h3>
                    <p>Средства продавца блокируются при создании сделки. Вы платите продавцу, он подтверждает получение - средства разблокируются.</p>
                </div>
                <div className="help-section">
                    <h3>📞 Поддержка</h3>
                    <p>По всем вопросам: <a href="https://t.me/TetherRabbit_chat">Чат поддержки</a></p>
                </div>
            </div>
        </div>
    );

    // Модалка создания сделки
    const TradeModal = () => (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
            <div className="modal-sheet" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Создание сделки</h3>
                    <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
                </div>
                <div className="modal-body">
                    <div className="trade-info">
                        <div>Курс: <strong>{selected.rate} ₽</strong></div>
                        <div>Лимиты: {selected.min_amount} - {selected.max_amount} USDT</div>
                        <div>Доступно: {selected.available_amount} USDT</div>
                        <div>Время на оплату: ⏰ {selected.payment_time || 30} минут</div>
                        {selected.terms && <div className="terms-value">📝 {selected.terms}</div>}
                    </div>
                    <div className="currency-switch">
                        <button className={currencyType === 'usdt' ? 'active' : ''} onClick={() => setCurrencyType('usdt')}>💰 USDT</button>
                        <button className={currencyType === 'rub' ? 'active' : ''} onClick={() => setCurrencyType('rub')}>💵 RUB</button>
                    </div>
                    <input type="number" className="amount-input" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Введите сумму в ${currencyType === 'usdt' ? 'USDT' : 'RUB'}`} />
                    {amount && <div className="calc-result">{currencyType === 'usdt' ? `≈ ${formatNumber(parseFloat(amount) * selected.rate)} ₽` : `≈ ${formatNumber(parseFloat(amount) / selected.rate)} USDT`}</div>}
                    <button className="confirm-btn" onClick={startTrade} disabled={creatingTrade}>{creatingTrade ? 'Создание...' : `✅ Начать сделку`}</button>
                </div>
            </div>
        </div>
    );

    // Рендер
    return (
        <div className="p2p-app">
            {activeMenu === 'main' && <MainMenu />}
            {activeMenu === 'buy' && <BuyMarket />}
            {activeMenu === 'sell' && <SellMarket />}
            {activeMenu === 'my_ads' && <MyAdsList />}
            {activeMenu === 'trades' && <MyTradesList />}
            {activeMenu === 'stats' && <StatsPage />}
            {activeMenu === 'help' && <HelpPage />}
            {selected && <TradeModal />}
        </div>
    );
}