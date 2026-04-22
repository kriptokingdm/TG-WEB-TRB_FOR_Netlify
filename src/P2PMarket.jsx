// src/P2PMarket.jsx
import React, { useState, useEffect } from 'react';
import './P2P.css';

const API = 'https://tethrab.shop';

export default function P2PMarket({ telegramUser, showToast, onBack }) {
    const userId = telegramUser?.id || '7879866656';

    const [buyOrders, setBuyOrders] = useState([]);
    const [sellOrders, setSellOrders] = useState([]);
    const [myAds, setMyAds] = useState([]);
    const [myTrades, setMyTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState('buy');
    const [tab, setTab] = useState('market');

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
        terms: ''
    });

    const paymentMethodsList = [
        { value: 'bank_transfer', label: 'Банковский перевод', icon: '🏦' },
        { value: 'card', label: 'Карта', icon: '💳' },
        { value: 'sbp', label: 'СБП', icon: '📱' },
        { value: 'cash', label: 'Наличные', icon: '💰' }
    ];

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        if (tab === 'my_ads') fetchMyAds();
        if (tab === 'trades') {
            fetchMyTrades();
            // Интервал для обновления таймеров
            const interval = setInterval(() => {
                fetchMyTrades();
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [tab]);

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
                    completed_trades: stats.successful_trades || 0,
                    total_trades: stats.total_trades || 0
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
                    completed_trades: stats.successful_trades || 0,
                    total_trades: stats.total_trades || 0
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
                    terms: newOrder.terms
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast('✅ Объявление создано!', 'success');
                setShowCreateForm(false);
                setNewOrder({ type: 'sell', amount: '', rate: '', min_amount: '10', max_amount: '', payment_methods: [], terms: '' });
                fetchMyAds();
                setTab('my_ads');
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
                    expires_minutes: 30
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast('✅ Сделка создана! У вас 30 минут на оплату', 'success');
                setSelected(null);
                setAmount('');
                setTab('trades');
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
        
        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`🤝 P2P Объявление\n💰 ${order.rate} ₽ за 1 USDT\n📦 ${order.available_amount} USDT`)}`);
        }
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

    // Красивая карточка объявления
    const OrderCard = ({ o, type }) => (
        <div className="order-card" onClick={() => setSelected(o)}>
            <div className="order-card-header">
                <div className="seller-info">
                    <div className="seller-avatar">{o.user_name?.[0] || 'U'}</div>
                    <div>
                        <div className="seller-name">{o.user_name || `User${o.user_id?.slice(-4)}`}</div>
                        <div className="seller-stats">
                            <span className="completion">✅ {o.completion_rate || 100}%</span>
                            <span className="trades-count">{o.completed_trades || 0} сделок</span>
                        </div>
                    </div>
                </div>
                <div className={`order-badge ${type}`}>
                    {type === 'buy' ? 'ПРОДАВЕЦ' : 'ПОКУПАТЕЛЬ'}
                </div>
            </div>

            <div className="order-card-rate">
                <span className="rate-value">{formatNumber(o.rate)}</span>
                <span className="rate-currency">₽</span>
            </div>

            <div className="order-card-details">
                <div className="detail-item">
                    <span className="detail-label">Доступно</span>
                    <span className="detail-value">{formatNumber(o.available_amount)} USDT</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Лимиты</span>
                    <span className="detail-value">{formatNumber(o.min_amount)} - {formatNumber(o.max_amount)} USDT</span>
                </div>
            </div>

            <div className="order-card-payment">
                {o.payment_methods?.slice(0, 3).map(method => (
                    <span key={method} className="payment-chip">{getPaymentLabel(method)}</span>
                ))}
                {o.payment_methods?.length > 3 && <span className="payment-chip">+{o.payment_methods.length - 3}</span>}
            </div>

            {o.terms && (
                <div className="order-card-terms">
                    <span className="terms-label">📝</span>
                    <span className="terms-text">{o.terms.length > 60 ? o.terms.slice(0, 60) + '...' : o.terms}</span>
                </div>
            )}

            <div className="order-card-actions">
                <button className={`action-btn ${type}`} onClick={(e) => { e.stopPropagation(); setSelected(o); }}>
                    {type === 'buy' ? 'Купить USDT' : 'Продать USDT'}
                </button>
                <button className="share-btn" onClick={(e) => { e.stopPropagation(); shareOrder(o); }}>📤</button>
            </div>
        </div>
    );

    // Моё объявление
    const AdCard = ({ ad }) => (
        <div className="ad-card">
            <div className="ad-card-header">
                <span className={`ad-type ${ad.type}`}>{ad.type === 'sell' ? '💰 Продажа' : '🛒 Покупка'}</span>
                <span className={`ad-status ${ad.status}`}>{ad.status === 'active' ? '✅ Активно' : '⏸ Приостановлено'}</span>
            </div>
            <div className="ad-card-rate">{formatNumber(ad.rate)} ₽</div>
            <div className="ad-card-amount">{formatNumber(ad.available_amount)} / {formatNumber(ad.amount)} USDT</div>
            <div className="ad-card-payment">{ad.payment_methods?.map(m => getPaymentLabel(m)).join(', ')}</div>
            {ad.terms && <div className="ad-card-terms">📝 {ad.terms.length > 50 ? ad.terms.slice(0, 50) + '...' : ad.terms}</div>}
            <div className="ad-card-actions">
                <button className="ad-edit" onClick={() => {
                    const newRate = prompt('Новый курс:', ad.rate);
                    if (newRate && !isNaN(newRate)) updateAdRate(ad.id, parseFloat(newRate));
                }}>✏️ Изменить курс</button>
                <button className="ad-delete" onClick={() => deleteAd(ad.id)}>🗑 Удалить</button>
            </div>
        </div>
    );

    // Красивая карточка сделки
    const TradeCard = ({ trade }) => {
        const isBuyer = trade.buyer_id === userId;
        const isSeller = trade.seller_id === userId;
        const timeLeft = getTimeLeft(trade.expires_at);
        const isExpired = timeLeft === 'expired';
        
        return (
            <div className={`trade-card ${trade.status} ${isExpired ? 'expired' : ''}`}>
                <div className="trade-card-header">
                    <div className="trade-id">Сделка #{trade.trade_id}</div>
                    <div className={`trade-status ${trade.status}`}>{getStatusText(trade.status)}</div>
                </div>
                
                <div className="trade-card-details">
                    <div className="trade-amount">{trade.amount} USDT × {trade.rate} ₽</div>
                    <div className="trade-total">= {formatNumber(trade.total_rub)} ₽</div>
                </div>
                
                <div className="trade-card-meta">
                    <div className="trade-role">
                        {isBuyer && <span className="role-badge buyer">Вы покупатель</span>}
                        {isSeller && <span className="role-badge seller">Вы продавец</span>}
                    </div>
                    {trade.expires_at && trade.status === 'pending' && !isExpired && (
                        <div className="trade-timer">
                            <span>⏰ Осталось: </span>
                            <strong>{timeLeft}</strong>
                        </div>
                    )}
                    {isExpired && trade.status === 'pending' && (
                        <div className="trade-expired">⏰ Время истекло, сделка отменена</div>
                    )}
                </div>
                
                {trade.terms && (
                    <div className="trade-terms">
                        <span>📝</span>
                        <span>{trade.terms.length > 60 ? trade.terms.slice(0, 60) + '...' : trade.terms}</span>
                    </div>
                )}
                
                <div className="trade-date">{new Date(trade.created_at).toLocaleString()}</div>
                
                {trade.status === 'pending' && !isExpired && (
                    <div className="trade-actions">
                        {isBuyer && (
                            <button className="trade-pay-btn" onClick={() => confirmPayment(trade.trade_id)}>
                                ✅ Подтвердить оплату
                            </button>
                        )}
                        <button className="trade-cancel-btn" onClick={() => cancelTrade(trade.trade_id)}>
                            ❌ Отменить сделку
                        </button>
                    </div>
                )}
                
                {trade.status === 'paid' && isSeller && (
                    <div className="trade-actions">
                        <button className="trade-confirm-btn" onClick={() => confirmReceipt(trade.trade_id)}>
                            🏁 Подтвердить получение
                        </button>
                    </div>
                )}
                
                {trade.status === 'completed' && (
                    <div className="trade-completed-badge">✅ Сделка успешно завершена</div>
                )}
                
                {trade.status === 'cancelled' && (
                    <div className="trade-cancelled-badge">❌ Сделка отменена</div>
                )}
            </div>
        );
    };

    return (
        <div className="p2p-app">
            <div className="header">
                <button className="back-btn" onClick={onBack}>←</button>
                <div className="header-title">P2P Маркет</div>
                <div className="header-placeholder"></div>
            </div>

            <div className="main-tabs">
                <button className={tab === 'market' ? 'active' : ''} onClick={() => setTab('market')}>📊 Маркет</button>
                <button className={tab === 'my_ads' ? 'active' : ''} onClick={() => setTab('my_ads')}>📋 Мои</button>
                <button className={tab === 'trades' ? 'active' : ''} onClick={() => setTab('trades')}>📦 Ордера</button>
            </div>

            {tab === 'market' && (
                <>
                    <div className="mode-tabs">
                        <button className={mode === 'buy' ? 'active' : ''} onClick={() => setMode('buy')}>🛒 Купить USDT</button>
                        <button className={mode === 'sell' ? 'active' : ''} onClick={() => setMode('sell')}>💰 Продать USDT</button>
                    </div>

                    <div className="orders-grid">
                        {loading ? (
                            [...Array(4)].map((_, i) => <div key={i} className="skeleton-card" />)
                        ) : (
                            (mode === 'buy' ? sellOrders : buyOrders).map(o => (
                                <OrderCard key={o.id} o={o} type={mode} />
                            ))
                        )}
                        {!loading && (mode === 'buy' ? sellOrders : buyOrders).length === 0 && (
                            <div className="empty-state">Нет активных объявлений</div>
                        )}
                    </div>
                </>
            )}

            {tab === 'my_ads' && (
                <div className="my-ads-container">
                    <button className="create-ad-btn" onClick={() => setShowCreateForm(!showCreateForm)}>
                        {showCreateForm ? '✖️ Закрыть' : '+ Создать объявление'}
                    </button>

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
                            <textarea 
                                className="terms-input"
                                placeholder="Условия сделки (необязательно)"
                                value={newOrder.terms}
                                onChange={e => setNewOrder({...newOrder, terms: e.target.value})}
                                rows="2"
                            />
                            <button className="submit-btn" onClick={createOrder} disabled={creatingTrade}>✅ Создать объявление</button>
                        </div>
                    )}

                    <div className="ads-grid">
                        {loading ? <div className="loading">Загрузка...</div> : myAds.length === 0 ? <div className="empty-state">У вас нет объявлений</div> : myAds.map(ad => <AdCard key={ad.id} ad={ad} />)}
                    </div>
                </div>
            )}

            {tab === 'trades' && (
                <div className="trades-grid">
                    {loading ? <div className="loading">Загрузка...</div> : myTrades.length === 0 ? <div className="empty-state">Нет сделок</div> : myTrades.map(trade => <TradeCard key={trade.trade_id} trade={trade} />)}
                </div>
            )}

            {selected && (
                <div className="modal-overlay" onClick={() => setSelected(null)}>
                    <div className="modal-sheet" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Создание сделки</h3>
                            <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="trade-info">
                                <div className="info-row">
                                    <span>Курс</span>
                                    <strong>{selected.rate} ₽</strong>
                                </div>
                                <div className="info-row">
                                    <span>Лимиты</span>
                                    <strong>{selected.min_amount} - {selected.max_amount} USDT</strong>
                                </div>
                                <div className="info-row">
                                    <span>Доступно</span>
                                    <strong>{selected.available_amount} USDT</strong>
                                </div>
                                {selected.terms && (
                                    <div className="info-row terms-row">
                                        <span>Условия</span>
                                        <strong className="terms-value">{selected.terms}</strong>
                                    </div>
                                )}
                            </div>

                            <div className="currency-switch">
                                <button className={currencyType === 'usdt' ? 'active' : ''} onClick={() => setCurrencyType('usdt')}>💰 USDT</button>
                                <button className={currencyType === 'rub' ? 'active' : ''} onClick={() => setCurrencyType('rub')}>💵 RUB</button>
                            </div>

                            <input 
                                type="number" 
                                className="amount-input"
                                value={amount} 
                                onChange={e => setAmount(e.target.value)} 
                                placeholder={`Введите сумму в ${currencyType === 'usdt' ? 'USDT' : 'RUB'}`}
                            />

                            {amount && (
                                <div className="calc-result">
                                    {currencyType === 'usdt' 
                                        ? `≈ ${formatNumber(parseFloat(amount) * selected.rate)} ₽`
                                        : `≈ ${formatNumber(parseFloat(amount) / selected.rate)} USDT`
                                    }
                                </div>
                            )}

                            <button className="confirm-btn" onClick={startTrade} disabled={creatingTrade}>
                                {creatingTrade ? 'Создание...' : '✅ Начать сделку (30 минут на оплату)'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}