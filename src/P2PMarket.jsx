// src/P2PMarket.jsx
import React, { useState, useEffect } from 'react';
import './P2P.css';

const API = 'https://tethrab.shop';

export default function P2PMarket({ telegramUser, showToast, onBack }) {
    const userId = telegramUser?.id || '7879866656';
    const [userBalance, setUserBalance] = useState(0);
    const [userName, setUserName] = useState(telegramUser?.first_name || 'Пользователь');

    const [activeMenu, setActiveMenu] = useState('main');
    const [buyOrders, setBuyOrders] = useState([]);
    const [sellOrders, setSellOrders] = useState([]);
    const [myAds, setMyAds] = useState([]);
    const [myTrades, setMyTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, completed: 0, active: 0, cancelled: 0 });

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
        { value: '15', label: '15 мин' },
        { value: '30', label: '30 мин' },
        { value: '60', label: '1 час' },
        { value: '120', label: '2 часа' }
    ];

    useEffect(() => {
        fetchUserBalance();
        fetchStats();
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

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API}/api/p2p/stats/${userId}`);
            const data = await res.json();
            setStats({
                total: data.total_trades || 0,
                completed: data.successful_trades || 0,
                active: data.pending_trades || 0,
                cancelled: data.cancelled_trades || 0
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

            setBuyOrders((buyData.orders || []).sort((a, b) => b.rate - a.rate));
            setSellOrders((sellData.orders || []).sort((a, b) => a.rate - b.rate));
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
                showToast('✅ Оплата подтверждена!', 'success');
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
                showToast('✅ Сделка завершена!', 'success');
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

    const formatNumber = (num) => {
        if (num === undefined || num === null) return '0';
        return new Intl.NumberFormat('ru-RU').format(num);
    };

    const getStatusText = (status) => {
        const map = { 
            pending: 'Ожидает оплаты', 
            paid: 'Оплачено', 
            completed: 'Завершена', 
            cancelled: 'Отменена', 
            expired: 'Просрочена' 
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

    // ============ ЭКРАН ПРОФИЛЯ ============
    const ProfileScreen = () => (
        <div className="p2p-profile-screen">
            <div className="profile-header">
                <div className="profile-avatar">
                    {userName.charAt(0)}
                </div>
                <div className="profile-info">
                    <div className="profile-name">{userName}</div>
                    <div className="profile-balance">💰 {userBalance.toFixed(2)} USDT</div>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Всего</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.completed}</div>
                    <div className="stat-label">Завершено</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.active}</div>
                    <div className="stat-label">Активные</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.cancelled}</div>
                    <div className="stat-label">Отклонено</div>
                </div>
            </div>

            <div className="menu-list">
                <button className="menu-item" onClick={() => setActiveMenu('buy')}>
                    🛒 Купить USDT
                </button>
                <button className="menu-item" onClick={() => setActiveMenu('sell')}>
                    💰 Продать USDT
                </button>
                <button className="menu-item" onClick={() => { setActiveMenu('my_ads'); fetchMyAds(); }}>
                    📋 Мои объявления
                </button>
                <button className="menu-item" onClick={() => { setActiveMenu('trades'); fetchMyTrades(); }}>
                    📦 Мои ордера
                </button>
                <button className="menu-item" onClick={() => setActiveMenu('help')}>
                    ❓ Помощь
                </button>
            </div>
        </div>
    );

    // ============ ЭКРАН ПОКУПКИ (СТАКАН) ============
    const BuyScreen = () => (
        <div className="p2p-market-screen">
            <div className="screen-header">
                <button className="back-btn" onClick={() => setActiveMenu('main')}>←</button>
                <h2>Купить USDT</h2>
                <div style={{ width: 40 }}></div>
            </div>
            <div className="orders-list">
                {loading ? (
                    [...Array(3)].map((_, i) => <div key={i} className="skeleton-card" />)
                ) : sellOrders.length === 0 ? (
                    <div className="empty-state">Нет объявлений на продажу</div>
                ) : (
                    sellOrders.map(order => (
                        <div key={order.id} className="order-item" onClick={() => setSelected(order)}>
                            <div className="order-user">
                                <div className="user-avatar">{order.user_name?.[0] || 'U'}</div>
                                <div className="user-name">{order.user_name || `User${order.user_id?.slice(-4)}`}</div>
                            </div>
                            <div className="order-rate">{formatNumber(order.rate)} ₽</div>
                            <div className="order-amount">{formatNumber(order.available_amount)} USDT</div>
                            <div className="order-payment">
                                {order.payment_methods?.slice(0, 2).map(m => (
                                    <span key={m} className="payment-badge">{getPaymentLabel(m)}</span>
                                ))}
                            </div>
                            <button className="order-btn">Купить</button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    // ============ ЭКРАН ПРОДАЖИ ============
    const SellScreen = () => (
        <div className="p2p-market-screen">
            <div className="screen-header">
                <button className="back-btn" onClick={() => setActiveMenu('main')}>←</button>
                <h2>Продать USDT</h2>
                <div style={{ width: 40 }}></div>
            </div>
            <div className="orders-list">
                {loading ? (
                    [...Array(3)].map((_, i) => <div key={i} className="skeleton-card" />)
                ) : buyOrders.length === 0 ? (
                    <div className="empty-state">Нет объявлений на покупку</div>
                ) : (
                    buyOrders.map(order => (
                        <div key={order.id} className="order-item" onClick={() => setSelected(order)}>
                            <div className="order-user">
                                <div className="user-avatar">{order.user_name?.[0] || 'U'}</div>
                                <div className="user-name">{order.user_name || `User${order.user_id?.slice(-4)}`}</div>
                            </div>
                            <div className="order-rate">{formatNumber(order.rate)} ₽</div>
                            <div className="order-amount">{formatNumber(order.available_amount)} USDT</div>
                            <div className="order-payment">
                                {order.payment_methods?.slice(0, 2).map(m => (
                                    <span key={m} className="payment-badge">{getPaymentLabel(m)}</span>
                                ))}
                            </div>
                            <button className="order-btn">Продать</button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    // ============ МОИ ОБЪЯВЛЕНИЯ ============
    const MyAdsScreen = () => (
        <div className="p2p-myads-screen">
            <div className="screen-header">
                <button className="back-btn" onClick={() => setActiveMenu('main')}>←</button>
                <h2>Мои объявления</h2>
                <button className="create-btn" onClick={() => setShowCreateForm(!showCreateForm)}>+</button>
            </div>

            {showCreateForm && (
                <div className="create-form">
                    <div className="form-type">
                        <button className={newOrder.type === 'sell' ? 'active sell' : ''} onClick={() => setNewOrder({...newOrder, type: 'sell'})}>Продажа</button>
                        <button className={newOrder.type === 'buy' ? 'active buy' : ''} onClick={() => setNewOrder({...newOrder, type: 'buy'})}>Покупка</button>
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
                            }}>{m.icon}</button>
                        ))}
                    </div>
                    <select value={newOrder.payment_time} onChange={e => setNewOrder({...newOrder, payment_time: e.target.value})}>
                        {timeOptions.map(opt => <option key={opt.value} value={opt.value}>⏰ {opt.label}</option>)}
                    </select>
                    <textarea placeholder="Условия сделки" value={newOrder.terms} onChange={e => setNewOrder({...newOrder, terms: e.target.value})} rows="2" />
                    <button className="submit-btn" onClick={createOrder} disabled={creatingTrade}>Создать</button>
                </div>
            )}

            <div className="ads-list">
                {loading ? (
                    <div className="loading">Загрузка...</div>
                ) : myAds.length === 0 ? (
                    <div className="empty-state">У вас нет объявлений</div>
                ) : (
                    myAds.map(ad => (
                        <div key={ad.id} className="ad-item">
                            <div className="ad-header">
                                <span className={`ad-type ${ad.type}`}>{ad.type === 'sell' ? 'Продажа' : 'Покупка'}</span>
                                <span className={`ad-status ${ad.status}`}>{ad.status === 'active' ? 'Активно' : 'Приостановлено'}</span>
                            </div>
                            <div className="ad-rate">{ad.rate} ₽</div>
                            <div className="ad-amount">{ad.available_amount}/{ad.amount} USDT</div>
                            <div className="ad-actions">
                                <button className="ad-edit" onClick={() => {
                                    const newRate = prompt('Новый курс:', ad.rate);
                                    if (newRate && !isNaN(newRate)) updateAdRate(ad.id, parseFloat(newRate));
                                }}>Изменить курс</button>
                                <button className="ad-delete" onClick={() => deleteAd(ad.id)}>Удалить</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    // ============ МОИ ОРДЕРА ============
    const TradesScreen = () => (
        <div className="p2p-trades-screen">
            <div className="screen-header">
                <button className="back-btn" onClick={() => setActiveMenu('main')}>←</button>
                <h2>Мои ордера</h2>
                <div style={{ width: 40 }}></div>
            </div>
            <div className="tabs">
                <button className={activeTab === 'active' ? 'active' : ''} onClick={() => setActiveTab('active')}>Активные</button>
                <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>История</button>
            </div>
            <div className="trades-list">
                {loading ? (
                    <div className="loading">Загрузка...</div>
                ) : myTrades.length === 0 ? (
                    <div className="empty-state">Нет сделок</div>
                ) : (
                    myTrades.map(trade => {
                        const isBuyer = trade.buyer_id === userId;
                        const isActive = trade.status === 'pending' || trade.status === 'paid';
                        const timeLeft = getTimeLeft(trade.expires_at);
                        
                        return (
                            <div key={trade.trade_id} className="trade-item">
                                <div className="trade-header">
                                    <div className="trade-type">{isBuyer ? 'Покупка USDT' : 'Продажа USDT'}</div>
                                    <div className={`trade-status ${trade.status}`}>{getStatusText(trade.status)}</div>
                                </div>
                                <div className="trade-details">
                                    <div>Сумма: {trade.amount} USDT</div>
                                    <div>Курс: {trade.rate} ₽</div>
                                    <div>Итого: {trade.total_rub} ₽</div>
                                </div>
                                <div className="trade-time">{new Date(trade.created_at).toLocaleString()}</div>
                                {isActive && timeLeft && timeLeft !== 'expired' && (
                                    <div className="trade-timer">⏰ Осталось: {timeLeft}</div>
                                )}
                                <div className="trade-actions">
                                    {trade.status === 'pending' && isBuyer && (
                                        <button className="trade-pay" onClick={() => confirmPayment(trade.trade_id)}>Подтвердить оплату</button>
                                    )}
                                    {trade.status === 'paid' && !isBuyer && (
                                        <button className="trade-confirm" onClick={() => confirmReceipt(trade.trade_id)}>Подтвердить получение</button>
                                    )}
                                    {(trade.status === 'pending' || trade.status === 'paid') && (
                                        <button className="trade-cancel" onClick={() => cancelTrade(trade.trade_id)}>Отменить</button>
                                    )}
                                    <button className="trade-copy" onClick={() => {
                                        navigator.clipboard.writeText(trade.trade_id);
                                        showToast('✅ ID сделки скопирован', 'success');
                                    }}>Копировать</button>
                                    <button className="trade-chat">Чат</button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );

    // ============ ПОМОЩЬ ============
    const HelpScreen = () => (
        <div className="p2p-help-screen">
            <div className="screen-header">
                <button className="back-btn" onClick={() => setActiveMenu('main')}>←</button>
                <h2>Помощь</h2>
                <div style={{ width: 40 }}></div>
            </div>
            <div className="help-content">
                <div className="help-block">
                    <h3>🤝 Как работает P2P?</h3>
                    <p>Вы покупаете USDT у других пользователей напрямую. Средства продавца блокируются, вы платите ему, он подтверждает получение - сделка завершена.</p>
                </div>
                <div className="help-block">
                    <h3>⏰ Время на оплату</h3>
                    <p>Обычно 30 минут. За это время нужно перевести деньги продавцу и нажать "Подтвердить оплату".</p>
                </div>
                <div className="help-block">
                    <h3>✅ Защита сделки</h3>
                    <p>USDT продавца заморожены до подтверждения оплаты. Ваши деньги в безопасности.</p>
                </div>
                <div className="help-block">
                    <h3>📞 Поддержка</h3>
                    <p>Чат с поддержкой: <a href="https://t.me/TetherRabbit_chat">@TetherRabbit_chat</a></p>
                </div>
            </div>
        </div>
    );

    // ============ МОДАЛКА СДЕЛКИ ============
    const TradeModal = () => (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Создание сделки</h3>
                    <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
                </div>
                <div className="modal-body">
                    <div className="modal-info">
                        <div>Курс: <strong>{selected.rate} ₽</strong></div>
                        <div>Лимиты: {selected.min_amount} - {selected.max_amount} USDT</div>
                        <div>Доступно: {selected.available_amount} USDT</div>
                        <div>Время на оплату: ⏰ {selected.payment_time || 30} мин</div>
                        {selected.terms && <div className="modal-terms">📝 {selected.terms}</div>}
                    </div>
                    <div className="currency-switch">
                        <button className={currencyType === 'usdt' ? 'active' : ''} onClick={() => setCurrencyType('usdt')}>USDT</button>
                        <button className={currencyType === 'rub' ? 'active' : ''} onClick={() => setCurrencyType('rub')}>RUB</button>
                    </div>
                    <input type="number" className="amount-input" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Введите сумму в ${currencyType === 'usdt' ? 'USDT' : 'RUB'}`} />
                    {amount && (
                        <div className="calc-result">
                            {currencyType === 'usdt' 
                                ? `≈ ${formatNumber(parseFloat(amount) * selected.rate)} ₽`
                                : `≈ ${formatNumber(parseFloat(amount) / selected.rate)} USDT`
                            }
                        </div>
                    )}
                    <button className="confirm-btn" onClick={startTrade} disabled={creatingTrade}>
                        {creatingTrade ? 'Создание...' : 'Начать сделку'}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p2p-app">
            {activeMenu === 'main' && <ProfileScreen />}
            {activeMenu === 'buy' && <BuyScreen />}
            {activeMenu === 'sell' && <SellScreen />}
            {activeMenu === 'my_ads' && <MyAdsScreen />}
            {activeMenu === 'trades' && <TradesScreen />}
            {activeMenu === 'help' && <HelpScreen />}
            {selected && <TradeModal />}
        </div>
    );
}