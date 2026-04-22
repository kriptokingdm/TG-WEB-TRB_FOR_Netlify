// src/P2PMarket.jsx
import React, { useState, useEffect } from 'react';
import './P2P.css';

const API = 'https://tethrab.shop';

export default function P2PMarket({ telegramUser, showToast, onBack }) {
    const userId = telegramUser?.id || '7879866656';
    const [userBalance, setUserBalance] = useState(0);

    const [buyOrders, setBuyOrders] = useState([]);
    const [sellOrders, setSellOrders] = useState([]);
    const [myAds, setMyAds] = useState([]);
    const [myTrades, setMyTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState('buy');
    const [tab, setTab] = useState('market');

    const [selected, setSelected] = useState(null);
    const [amount, setAmount] = useState('');
    const [creatingTrade, setCreatingTrade] = useState(false);

    // Форма создания объявления
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newOrder, setNewOrder] = useState({
        type: 'sell',
        amount: '',
        rate: '',
        min_amount: '10',
        max_amount: '',
        payment_methods: []
    });

    const paymentMethodsList = [
        { value: 'bank_transfer', label: 'Банковский перевод', icon: '🏦' },
        { value: 'card', label: 'Карта', icon: '💳' },
        { value: 'sbp', label: 'СБП', icon: '📱' },
        { value: 'cash', label: 'Наличные', icon: '💰' }
    ];

    useEffect(() => {
        fetchBalance();
        fetchOrders();
    }, []);

    useEffect(() => {
        if (tab === 'my_ads') fetchMyAds();
        if (tab === 'trades') fetchMyTrades();
    }, [tab]);

    const fetchBalance = async () => {
        try {
            const res = await fetch(`${API}/api/wallet/usdt/balance/${userId}`);
            const data = await res.json();
            setUserBalance(data.balance || 0);
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
                    payment_methods: newOrder.payment_methods
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast('✅ Объявление создано!', 'success');
                setShowCreateForm(false);
                setNewOrder({ type: 'sell', amount: '', rate: '', min_amount: '10', max_amount: '', payment_methods: [] });
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
        const val = parseFloat(amount);
        if (val < selected.min_amount || val > selected.max_amount) {
            showToast(`Сумма должна быть от ${selected.min_amount} до ${selected.max_amount} USDT`, 'error');
            return;
        }
        if (val > selected.available_amount) {
            showToast(`Доступно только ${selected.available_amount} USDT`, 'error');
            return;
        }

        setCreatingTrade(true);
        try {
            const res = await fetch(`${API}/api/p2p/trade/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: selected.id, buyerId: userId, amount: val })
            });
            const data = await res.json();
            if (data.success) {
                showToast('✅ Сделка создана!', 'success');
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

    const shareOrder = (order) => {
        const shareUrl = `https://t.me/TetherRabbitBot?start=order_${order.id}`;
        navigator.clipboard.writeText(shareUrl);
        showToast('✅ Ссылка скопирована', 'success');
    };

    const formatNumber = (num) => new Intl.NumberFormat('ru-RU').format(num);

    const getStatusText = (status) => {
        const map = { pending: 'Ожидает', paid: 'Оплачено', completed: 'Завершена', cancelled: 'Отменена' };
        return map[status] || status;
    };

    const getPaymentLabel = (method) => {
        const found = paymentMethodsList.find(m => m.value === method);
        return found ? `${found.icon} ${found.label}` : method;
    };

    const OrderRow = ({ o, type }) => (
        <div className="row" onClick={() => setSelected(o)}>
            <div className="col user">
                <div className="avatar">{o.user_name?.[0] || 'U'}</div>
                <div>
                    <div className="name">{o.user_name || `User${o.user_id?.slice(-4)}`}</div>
                    <div className="sub">{formatNumber(o.available_amount)} USDT</div>
                </div>
            </div>
            <div className="col center">
                <div className={`price ${type}`}>{formatNumber(o.rate)} ₽</div>
                <div className="limits">{o.min_amount}-{o.max_amount} USDT</div>
            </div>
            <div className="col right">
                <button className={`btn ${type}`} onClick={(e) => { e.stopPropagation(); setSelected(o); }}>
                    {type === 'buy' ? 'Купить' : 'Продать'}
                </button>
                <button className="btn-share" onClick={(e) => { e.stopPropagation(); shareOrder(o); }}>📤</button>
            </div>
        </div>
    );

    const AdRow = ({ ad }) => (
        <div className="ad-row">
            <div className="ad-header">
                <span className={`ad-type ${ad.type}`}>{ad.type === 'sell' ? '💰 Продажа' : '🛒 Покупка'}</span>
                <span className={`ad-status ${ad.status}`}>{ad.status === 'active' ? 'Активно' : 'Приостановлено'}</span>
            </div>
            <div className="ad-rate">{formatNumber(ad.rate)} ₽</div>
            <div className="ad-amount">{formatNumber(ad.available_amount)} / {formatNumber(ad.amount)} USDT</div>
            <div className="ad-payment">{ad.payment_methods?.map(m => getPaymentLabel(m)).join(', ')}</div>
            <div className="ad-actions">
                <button className="ad-edit" onClick={() => {
                    const newRate = prompt('Новый курс:', ad.rate);
                    if (newRate && !isNaN(newRate)) updateAdRate(ad.id, parseFloat(newRate));
                }}>✏️ Курс</button>
                <button className="ad-delete" onClick={() => deleteAd(ad.id)}>🗑 Удалить</button>
            </div>
        </div>
    );

    const TradeRow = ({ trade }) => (
        <div className="trade-row">
            <div className="trade-header">
                <span className="trade-id">#{trade.trade_id}</span>
                <span className={`trade-status ${trade.status}`}>{getStatusText(trade.status)}</span>
            </div>
            <div className="trade-amount">{trade.amount} USDT × {trade.rate} ₽</div>
            <div className="trade-total">= {formatNumber(trade.total_rub)} ₽</div>
            <div className="trade-date">{new Date(trade.created_at).toLocaleString()}</div>
        </div>
    );

    return (
        <div className="p2p-app">
            <div className="header">
                <button onClick={onBack}>←</button>
                <div>P2P Маркет</div>
                <div className="balance">💰 {userBalance.toFixed(2)}</div>
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

                    <div className="table-head">
                        <span>Пользователь</span>
                        <span>Цена / Лимиты</span>
                        <span></span>
                    </div>

                    <div className="list">
                        {loading ? (
                            [...Array(5)].map((_, i) => <div key={i} className="skeleton" />)
                        ) : (
                            (mode === 'buy' ? sellOrders : buyOrders).map(o => (
                                <OrderRow key={o.id} o={o} type={mode} />
                            ))
                        )}
                        {!loading && (mode === 'buy' ? sellOrders : buyOrders).length === 0 && (
                            <div className="empty">Нет объявлений</div>
                        )}
                    </div>
                </>
            )}

            {tab === 'my_ads' && (
                <div className="my-ads">
                    <button className="create-btn" onClick={() => setShowCreateForm(!showCreateForm)}>
                        {showCreateForm ? '✖️ Закрыть' : '+ Создать объявление'}
                    </button>

                    {showCreateForm && (
                        <div className="create-form">
                            <h4>Новое объявление</h4>
                            <div className="form-row">
                                <button className={newOrder.type === 'sell' ? 'active sell' : ''} onClick={() => setNewOrder({...newOrder, type: 'sell'})}>💰 Продажа</button>
                                <button className={newOrder.type === 'buy' ? 'active buy' : ''} onClick={() => setNewOrder({...newOrder, type: 'buy'})}>🛒 Покупка</button>
                            </div>
                            {newOrder.type === 'sell' && <div className="balance-hint">💰 Ваш баланс: {userBalance} USDT</div>}
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
                            <button className="submit-btn" onClick={createOrder} disabled={creatingTrade}>✅ Создать</button>
                        </div>
                    )}

                    <div className="ads-list">
                        {loading ? <div className="loading">Загрузка...</div> : myAds.length === 0 ? <div className="empty">Нет объявлений</div> : myAds.map(ad => <AdRow key={ad.id} ad={ad} />)}
                    </div>
                </div>
            )}

            {tab === 'trades' && (
                <div className="trades-list">
                    {loading ? <div className="loading">Загрузка...</div> : myTrades.length === 0 ? <div className="empty">Нет сделок</div> : myTrades.map(trade => <TradeRow key={trade.trade_id} trade={trade} />)}
                </div>
            )}

            {selected && (
                <div className="modal" onClick={() => setSelected(null)}>
                    <div className="sheet" onClick={e => e.stopPropagation()}>
                        <h3>Создание сделки</h3>
                        <div className="info">
                            <div>Курс: <strong>{selected.rate} ₽</strong></div>
                            <div>Лимиты: {selected.min_amount} - {selected.max_amount} USDT</div>
                            <div>Доступно: {selected.available_amount} USDT</div>
                        </div>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Введите сумму в USDT" />
                        {amount && <div className="calc">≈ {formatNumber(parseFloat(amount) * selected.rate)} ₽</div>}
                        <button className="confirm" onClick={startTrade} disabled={creatingTrade}>{creatingTrade ? 'Создание...' : '✅ Начать сделку'}</button>
                    </div>
                </div>
            )}
        </div>
    );
}