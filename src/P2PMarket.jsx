// src/P2PMarket.jsx
import React, { useState, useEffect, useRef } from 'react';
import './P2P.css';

const API = 'https://tethrab.shop';

export default function P2PMarket({ telegramUser, showToast, onBack, navigateTo }) {
    const userId = telegramUser?.id || '7879866656';
    const [userName, setUserName] = useState(telegramUser?.first_name || telegramUser?.username || 'User');
    
    const [screen, setScreen] = useState('main');
    const [buyOrders, setBuyOrders] = useState([]);
    const [sellOrders, setSellOrders] = useState([]);
    const [myAds, setMyAds] = useState([]);
    const [myTrades, setMyTrades] = useState([]);
    const [activeTrade, setActiveTrade] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, completed: 0, active: 0 });
    
    const [selected, setSelected] = useState(null);
    const [amount, setAmount] = useState('');
    const [currencyType, setCurrencyType] = useState('usdt');
    const [creatingTrade, setCreatingTrade] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [activeTab, setActiveTab] = useState('active');
    
    const [filters, setFilters] = useState({
        paymentMethod: 'all',
        maxAmount: '',
        maxTime: 'all'
    });
    const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
    const [showTimeDropdown, setShowTimeDropdown] = useState(false);
    
    // Refs для инпутов
    const amountInputRef = useRef(null);
    const createAmountRef = useRef(null);
    const createRateRef = useRef(null);
    const filterAmountRef = useRef(null);

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
        fetchStats();
        fetchOrders();
        fetchActiveTrade();
    }, []);

    useEffect(() => {
        if (screen === 'my_ads') fetchMyAds();
        if (screen === 'orders') fetchMyTrades();
    }, [screen]);

    // Автофокус для модалки
    useEffect(() => {
        if (selected && amountInputRef.current) {
            setTimeout(() => {
                amountInputRef.current.focus();
            }, 100);
        }
    }, [selected]);

    const fetchActiveTrade = async () => {
        try {
            const res = await fetch(`${API}/api/p2p/trades/user/${userId}`);
            const data = await res.json();
            const pending = (data.trades || []).find(t => t.status === 'pending' || t.status === 'paid');
            setActiveTrade(pending || null);
        } catch (e) {}
    };

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API}/api/p2p/stats/${userId}`);
            const data = await res.json();
            setStats({
                total: data.total_trades || 0,
                completed: data.successful_trades || 0,
                active: data.pending_trades || 0
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
            const pending = (data.trades || []).find(t => t.status === 'pending' || t.status === 'paid');
            setActiveTrade(pending || null);
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
                setScreen('my_ads');
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
                setScreen('orders');
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
        showToast('✅ Ссылка на объявление скопирована!', 'success');
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

    const openRules = () => {
        if (navigateTo) {
            navigateTo('help');
            localStorage.setItem('helpSection', 'rules');
        }
    };

    const paymentMethodsFilter = [
        { value: 'all', label: 'Все способы' },
        { value: 'bank_transfer', label: '🏦 Банк' },
        { value: 'card', label: '💳 Карта' },
        { value: 'sbp', label: '📱 СБП' },
        { value: 'cash', label: '💰 Наличные' }
    ];

    const timeFilterOptions = [
        { value: 'all', label: 'Любое время' },
        { value: '15', label: '⏰ 15 мин' },
        { value: '30', label: '⏰ 30 мин' },
        { value: '60', label: '⏰ 1 час' },
        { value: '120', label: '⏰ 2 часа' }
    ];

    const selectedPayment = paymentMethodsFilter.find(p => p.value === filters.paymentMethod) || paymentMethodsFilter[0];
    const selectedTime = timeFilterOptions.find(t => t.value === filters.maxTime) || timeFilterOptions[0];

    const filteredSellOrders = sellOrders.filter(order => {
        if (filters.paymentMethod !== 'all' && !order.payment_methods?.includes(filters.paymentMethod)) return false;
        if (filters.maxAmount && order.available_amount > parseFloat(filters.maxAmount)) return false;
        if (filters.maxTime !== 'all') {
            const time = order.payment_time || 30;
            if (time > parseFloat(filters.maxTime)) return false;
        }
        return true;
    });

    const filteredBuyOrders = buyOrders.filter(order => {
        if (filters.paymentMethod !== 'all' && !order.payment_methods?.includes(filters.paymentMethod)) return false;
        if (filters.maxAmount && order.available_amount > parseFloat(filters.maxAmount)) return false;
        if (filters.maxTime !== 'all') {
            const time = order.payment_time || 30;
            if (time > parseFloat(filters.maxTime)) return false;
        }
        return true;
    });

    // Карточка объявления
    const OrderCard = ({ order, type }) => (
        <div className="order-card" onClick={() => setSelected(order)}>
            <div className="order-card-row">
                <div className="order-user">
                    <div className="order-avatar">{order.user_name?.[0] || 'U'}</div>
                    <div className="order-user-info">
                        <div className="order-user-name">{order.user_name || `User${order.user_id?.slice(-4)}`}</div>
                        <div className="order-user-stats">✅ {order.completion_rate || 100}% • {order.completed_trades || 0} сделок</div>
                    </div>
                </div>
                <div className="order-rate">{formatNumber(order.rate)} ₽</div>
            </div>
            <div className="order-amount">{formatNumber(order.available_amount)} USDT</div>
            <div className="order-meta">⏰ {order.payment_time || 30} мин на оплату</div>
            <div className="order-buttons">
                <button className="order-action-btn" onClick={(e) => { e.stopPropagation(); setSelected(order); }}>
                    {type === 'buy' ? 'Купить' : 'Продать'}
                </button>
                <button className="order-share-btn" onClick={(e) => { e.stopPropagation(); shareOrder(order); }}>📤</button>
            </div>
        </div>
    );

    // ============ ПРОФИЛЬ ============
    const ProfileScreen = () => (
        <div className="profile">
            <div className="profile-header">
                <button className="profile-back-btn" onClick={onBack}>←</button>
                <div className="profile-header-placeholder"></div>
            </div>
            <div className="avatarWrap">
                <div className="avatar">{userName.charAt(0).toUpperCase()}</div>
                <div className="name">{userName}</div>
            </div>
            <div className="stats">
                <div><b>{stats.total}</b><span>Всего</span></div>
                <div><b>{stats.completed}</b><span>Завершено</span></div>
                <div><b>{stats.active}</b><span>Активные</span></div>
            </div>
            <div className="actions">
                <button className="buy" onClick={() => setScreen('buy')}>Купить</button>
                <button className="sell" onClick={() => setScreen('sell')}>Продать</button>
            </div>
            <div className="menu">
                <button className="menu-item" onClick={() => { setScreen('my_ads'); fetchMyAds(); }}>📋 Мои объявления</button>
                <button className="menu-item" onClick={() => { setScreen('orders'); fetchMyTrades(); }}>📦 Мои ордера</button>
                <button className="menu-item" onClick={() => setScreen('help')}>❓ Помощь</button>
            </div>
            {activeTrade && (
                <div className="active-trade-banner" onClick={() => setScreen('orders')}>
                    <span>🟢</span>
                    <span>У вас активная сделка #{activeTrade.trade_id}</span>
                    <span>→</span>
                </div>
            )}
        </div>
    );

    // ============ ЭКРАН ПОКУПКИ ============
    const BuyScreen = () => (
        <div className="screen">
            <div className="header">
                <button className="back-btn" onClick={() => setScreen('main')}>←</button>
                <h2>Купить USDT</h2>
                <div className="header-placeholder"></div>
            </div>

            {/* Бегущая строка */}
            <div className="marquee-container">
                <div className="marquee-text">
                    ⚠️ Перед началом торговли P2P ознакомьтесь с условиями маркета. 
                    Пожалуйста, соблюдайте условия маркета и уважительно относитесь к контрагентам.
                    <span className="rules-link" onClick={openRules}> 📋 Правила P2P</span>
                </div>
            </div>

            <div className="filter-bar">
                <div className="filter-chip">
                    <div className="filter-chip-label">Способ</div>
                    <div className="filter-chip-value" onClick={() => setShowPaymentDropdown(!showPaymentDropdown)}>
                        {selectedPayment.label}
                        <span className="chip-arrow">⌄</span>
                    </div>
                    {showPaymentDropdown && (
                        <div className="chip-dropdown-bottom">
                            {paymentMethodsFilter.map(m => (
                                <div key={m.value} className={`chip-option ${filters.paymentMethod === m.value ? 'active' : ''}`} onClick={() => { setFilters({...filters, paymentMethod: m.value}); setShowPaymentDropdown(false); }}>{m.label}</div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="filter-chip">
                    <div className="filter-chip-label">Сумма до</div>
                    <input 
                        ref={filterAmountRef}
                        type="number" 
                        className="filter-chip-input" 
                        placeholder="USDT" 
                        value={filters.maxAmount} 
                        onChange={e => setFilters({...filters, maxAmount: e.target.value})}
                        onKeyDown={(e) => e.stopPropagation()}
                    />
                </div>
                <div className="filter-chip">
                    <div className="filter-chip-label">Время</div>
                    <div className="filter-chip-value" onClick={() => setShowTimeDropdown(!showTimeDropdown)}>
                        {selectedTime.label}
                        <span className="chip-arrow">⌄</span>
                    </div>
                    {showTimeDropdown && (
                        <div className="chip-dropdown-bottom">
                            {timeFilterOptions.map(t => (
                                <div key={t.value} className={`chip-option ${filters.maxTime === t.value ? 'active' : ''}`} onClick={() => { setFilters({...filters, maxTime: t.value}); setShowTimeDropdown(false); }}>{t.label}</div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="orders-list">
                {loading ? [...Array(3)].map((_, i) => <div key={i} className="skeleton" />) : filteredSellOrders.length === 0 ? <div className="empty">Нет объявлений</div> : filteredSellOrders.map(order => <OrderCard key={order.id} order={order} type="buy" />)}
            </div>
        </div>
    );

    // ============ ЭКРАН ПРОДАЖИ ============
    const SellScreen = () => (
        <div className="screen">
            <div className="header">
                <button className="back-btn" onClick={() => setScreen('main')}>←</button>
                <h2>Продать USDT</h2>
                <div className="header-placeholder"></div>
            </div>

            {/* Бегущая строка */}
            <div className="marquee-container">
                <div className="marquee-text">
                    ⚠️ Перед началом торговли P2P ознакомьтесь с условиями маркета. 
                    Пожалуйста, соблюдайте условия маркета и уважительно относитесь к контрагентам.
                    <span className="rules-link" onClick={openRules}> 📋 Правила P2P</span>
                </div>
            </div>

            <div className="filter-bar">
                <div className="filter-chip">
                    <div className="filter-chip-label">Способ</div>
                    <div className="filter-chip-value" onClick={() => setShowPaymentDropdown(!showPaymentDropdown)}>
                        {selectedPayment.label}
                        <span className="chip-arrow">⌄</span>
                    </div>
                    {showPaymentDropdown && (
                        <div className="chip-dropdown-bottom">
                            {paymentMethodsFilter.map(m => (
                                <div key={m.value} className={`chip-option ${filters.paymentMethod === m.value ? 'active' : ''}`} onClick={() => { setFilters({...filters, paymentMethod: m.value}); setShowPaymentDropdown(false); }}>{m.label}</div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="filter-chip">
                    <div className="filter-chip-label">Сумма до</div>
                    <input 
                        ref={filterAmountRef}
                        type="number" 
                        className="filter-chip-input" 
                        placeholder="USDT" 
                        value={filters.maxAmount} 
                        onChange={e => setFilters({...filters, maxAmount: e.target.value})}
                        onKeyDown={(e) => e.stopPropagation()}
                    />
                </div>
                <div className="filter-chip">
                    <div className="filter-chip-label">Время</div>
                    <div className="filter-chip-value" onClick={() => setShowTimeDropdown(!showTimeDropdown)}>
                        {selectedTime.label}
                        <span className="chip-arrow">⌄</span>
                    </div>
                    {showTimeDropdown && (
                        <div className="chip-dropdown-bottom">
                            {timeFilterOptions.map(t => (
                                <div key={t.value} className={`chip-option ${filters.maxTime === t.value ? 'active' : ''}`} onClick={() => { setFilters({...filters, maxTime: t.value}); setShowTimeDropdown(false); }}>{t.label}</div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="orders-list">
                {loading ? [...Array(3)].map((_, i) => <div key={i} className="skeleton" />) : filteredBuyOrders.length === 0 ? <div className="empty">Нет объявлений</div> : filteredBuyOrders.map(order => <OrderCard key={order.id} order={order} type="sell" />)}
            </div>
        </div>
    );

    // ============ МОИ ОБЪЯВЛЕНИЯ ==========
    const MyAdsScreen = () => (
        <div className="screen">
            <div className="header">
                <button onClick={() => setScreen('main')}>←</button>
                <h2>Мои объявления</h2>
                <button className="create-btn" onClick={() => setShowCreateForm(!showCreateForm)}>+</button>
            </div>
            {showCreateForm && (
                <div className="createForm">
                    <div className="formType">
                        <button className={newOrder.type === 'sell' ? 'active sell' : ''} onClick={() => setNewOrder({...newOrder, type: 'sell'})}>Продажа</button>
                        <button className={newOrder.type === 'buy' ? 'active buy' : ''} onClick={() => setNewOrder({...newOrder, type: 'buy'})}>Покупка</button>
                    </div>
                    <input 
                        ref={createAmountRef}
                        type="number" 
                        placeholder="Сумма (USDT)" 
                        value={newOrder.amount} 
                        onChange={e => setNewOrder({...newOrder, amount: e.target.value})}
                        onKeyDown={(e) => e.stopPropagation()}
                    />
                    <input 
                        ref={createRateRef}
                        type="number" 
                        placeholder="Курс (RUB)" 
                        value={newOrder.rate} 
                        onChange={e => setNewOrder({...newOrder, rate: e.target.value})}
                        onKeyDown={(e) => e.stopPropagation()}
                    />
                    <div className="row">
                        <input type="number" placeholder="Мин. сумма" value={newOrder.min_amount} onChange={e => setNewOrder({...newOrder, min_amount: e.target.value})} />
                        <input type="number" placeholder="Макс. сумма" value={newOrder.max_amount} onChange={e => setNewOrder({...newOrder, max_amount: e.target.value})} />
                    </div>
                    <div className="paymentBtns">
                        {paymentMethodsList.map(m => (<button key={m.value} className={newOrder.payment_methods.includes(m.value) ? 'selected' : ''} onClick={() => { const methods = newOrder.payment_methods.includes(m.value) ? newOrder.payment_methods.filter(x => x !== m.value) : [...newOrder.payment_methods, m.value]; setNewOrder({...newOrder, payment_methods: methods}); }}>{m.icon}</button>))}
                    </div>
                    <select value={newOrder.payment_time} onChange={e => setNewOrder({...newOrder, payment_time: e.target.value})}>
                        {timeOptions.map(opt => <option key={opt.value} value={opt.value}>⏰ {opt.label}</option>)}
                    </select>
                    <textarea placeholder="Условия сделки" value={newOrder.terms} onChange={e => setNewOrder({...newOrder, terms: e.target.value})} rows="2" />
                    <button className="submit" onClick={createOrder} disabled={creatingTrade}>Создать</button>
                </div>
            )}
            <div className="ads-list">
                {loading ? <div className="loading">Загрузка...</div> : myAds.length === 0 ? <div className="empty">Нет объявлений</div> : myAds.map(ad => (
                    <div key={ad.id} className="ad-card">
                        <div className="ad-header">
                            <span className={`ad-type ${ad.type}`}>{ad.type === 'sell' ? 'Продажа' : 'Покупка'}</span>
                            <span className={`ad-status ${ad.status}`}>{ad.status === 'active' ? 'Активно' : 'Приостановлено'}</span>
                        </div>
                        <div className="ad-rate">{ad.rate} ₽</div>
                        <div className="ad-amount">{ad.available_amount}/{ad.amount} USDT</div>
                        <div className="ad-actions">
                            <button className="ad-edit" onClick={() => { const newRate = prompt('Новый курс:', ad.rate); if (newRate && !isNaN(newRate)) updateAdRate(ad.id, parseFloat(newRate)); }}>Изменить курс</button>
                            <button className="ad-delete" onClick={() => deleteAd(ad.id)}>Удалить</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // ============ МОИ ОРДЕРА ==========
    const OrdersScreen = () => (
        <div className="screen">
            <div className="header">
                <button onClick={() => setScreen('main')}>←</button>
                <h2>Мои ордера</h2>
                <div />
            </div>
            <div className="tabs">
                <button className={activeTab === 'active' ? 'active' : ''} onClick={() => setActiveTab('active')}>Активные</button>
                <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>История</button>
            </div>
            <div className="trades-list">
                {loading ? <div className="loading">Загрузка...</div> : myTrades.length === 0 ? <div className="empty">Нет сделок</div> : myTrades.filter(t => activeTab === 'active' ? ['pending', 'paid'].includes(t.status) : ['completed', 'cancelled', 'expired'].includes(t.status)).map(trade => {
                    const isBuyer = trade.buyer_id === userId;
                    const timeLeft = getTimeLeft(trade.expires_at);
                    return (
                        <div key={trade.trade_id} className="trade-card">
                            <div className="trade-header">
                                <span className="trade-type">{isBuyer ? 'Покупка' : 'Продажа'}</span>
                                <span className={`trade-status ${trade.status}`}>{getStatusText(trade.status)}</span>
                            </div>
                            <div className="trade-details">
                                <div>{trade.amount} USDT × {trade.rate} ₽ = {trade.total_rub} ₽</div>
                            </div>
                            {timeLeft && timeLeft !== 'expired' && <div className="trade-timer">⏰ {timeLeft}</div>}
                            <div className="trade-actions">
                                {trade.status === 'pending' && isBuyer && <button className="trade-pay" onClick={() => confirmPayment(trade.trade_id)}>Оплатить</button>}
                                {trade.status === 'paid' && !isBuyer && <button className="trade-confirm" onClick={() => confirmReceipt(trade.trade_id)}>Получить</button>}
                                {(trade.status === 'pending' || trade.status === 'paid') && <button className="trade-cancel" onClick={() => cancelTrade(trade.trade_id)}>Отменить</button>}
                                <button className="trade-copy" onClick={() => { navigator.clipboard.writeText(trade.trade_id); showToast('✅ ID скопирован', 'success'); }}>ID</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    // ============ ПОМОЩЬ ==========
    const HelpScreen = () => (
        <div className="screen">
            <div className="header">
                <button onClick={() => setScreen('main')}>←</button>
                <h2>Помощь</h2>
                <div />
            </div>
            <div className="helpContent">
                <div className="helpBlock"><h3>🤝 Как работает P2P?</h3><p>Вы покупаете USDT у других пользователей напрямую.</p></div>
                <div className="helpBlock"><h3>⏰ Время на оплату</h3><p>Обычно 30 минут.</p></div>
                <div className="helpBlock"><h3>✅ Защита сделки</h3><p>USDT продавца заморожены до подтверждения оплаты.</p></div>
                <div className="helpBlock"><h3>📞 Поддержка</h3><p><a href="https://t.me/TetherRabbit_chat">Чат поддержки</a></p></div>
            </div>
        </div>
    );

    // ============ МОДАЛКА СДЕЛКИ ==========
    const TradeModal = () => (
        <div className="modal" onClick={() => setSelected(null)}>
            <div className="modalContent" onClick={e => e.stopPropagation()}>
                <div className="modalHeader">
                    <h3>Создание сделки</h3>
                    <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
                </div>
                <div className="modalBody">
                    <div className="modalInfo">
                        <div className="info-row-modal">
                            <span>Курс</span>
                            <strong>{selected.rate} ₽</strong>
                        </div>
                        <div className="info-row-modal">
                            <span>Лимиты</span>
                            <strong>{selected.min_amount} - {selected.max_amount} USDT</strong>
                        </div>
                        <div className="info-row-modal">
                            <span>Доступно</span>
                            <strong>{selected.available_amount} USDT</strong>
                        </div>
                        {selected.terms && (
                            <div className="info-row-modal terms">
                                <span>Условия</span>
                                <div className="terms-text">{selected.terms}</div>
                            </div>
                        )}
                    </div>

                    <div className="currencySwitch">
                        <button type="button" className={currencyType === 'usdt' ? 'active' : ''} onClick={() => setCurrencyType('usdt')}>USDT</button>
                        <button type="button" className={currencyType === 'rub' ? 'active' : ''} onClick={() => setCurrencyType('rub')}>RUB</button>
                    </div>

                    <input 
                        ref={amountInputRef}
                        type="number" 
                        className="amountInput"
                        value={amount} 
                        onChange={e => setAmount(e.target.value)} 
                        onKeyDown={(e) => e.stopPropagation()}
                        placeholder={`Введите сумму в ${currencyType === 'usdt' ? 'USDT' : 'RUB'}`}
                    />

                    {amount && (
                        <div className="calcResult">
                            {currencyType === 'usdt' 
                                ? `≈ ${formatNumber(parseFloat(amount) * selected.rate)} ₽`
                                : `≈ ${formatNumber(parseFloat(amount) / selected.rate)} USDT`
                            }
                        </div>
                    )}

                    <button className="confirmBtn" onClick={startTrade} disabled={creatingTrade}>
                        {creatingTrade ? 'Создание...' : '✅ Начать сделку'}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="app">
            {screen === 'main' && <ProfileScreen />}
            {screen === 'buy' && <BuyScreen />}
            {screen === 'sell' && <SellScreen />}
            {screen === 'my_ads' && <MyAdsScreen />}
            {screen === 'orders' && <OrdersScreen />}
            {screen === 'help' && <HelpScreen />}
            {selected && <TradeModal />}
        </div>
    );
}