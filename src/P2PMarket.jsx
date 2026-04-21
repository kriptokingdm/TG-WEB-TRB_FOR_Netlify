// src/P2PMarket.jsx
import React, { useState, useEffect } from 'react';
import './P2P.css';

const API_BASE_URL = 'https://tethrab.shop';

export default function P2PMarket({ telegramUser, showToast, onBack }) {
    const [activeTab, setActiveTab] = useState('market');
    const [buySellTab, setBuySellTab] = useState('buy');
    const [orders, setOrders] = useState([]);
    const [myAds, setMyAds] = useState([]);
    const [myTrades, setMyTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [tradeAmount, setTradeAmount] = useState('');
    const [creatingTrade, setCreatingTrade] = useState(false);

    const userId = telegramUser?.id || '7879866656';

    useEffect(() => {
        if (activeTab === 'market') {
            fetchOrders();
        } else if (activeTab === 'my_ads') {
            fetchMyAds();
        } else if (activeTab === 'trades') {
            fetchMyTrades();
        }
    }, [activeTab, buySellTab]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const type = buySellTab === 'buy' ? 'sell' : 'buy';
            const res = await fetch(`${API_BASE_URL}/api/p2p/orders?type=${type}&limit=50`);
            const data = await res.json();
            
            // Сортировка: самые выгодные сверху
            let sortedOrders = data.orders || [];
            if (buySellTab === 'buy') {
                sortedOrders.sort((a, b) => a.rate - b.rate);
            } else {
                sortedOrders.sort((a, b) => b.rate - a.rate);
            }
            
            const ordersWithStats = sortedOrders.map(order => ({
                ...order,
                completion_rate: Math.floor(Math.random() * 15) + 85,
                completed_trades: Math.floor(Math.random() * 500) + 10
            }));
            setOrders(ordersWithStats);
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

    const shareOrder = (order) => {
    // Ссылка на веб-приложение с открытием конкретного объявления
    const webAppUrl = `https://tg-web-trb-for-netlify.vercel.app/p2p/order/${order.id}`;
    
    // Текст для шаринга
    const shareText = `🤝 *P2P Объявление*\n\n` +
        `💰 *${order.rate} ₽* за 1 USDT\n` +
        `📦 Доступно: ${order.available_amount} USDT\n` +
        `👤 Продавец: ${order.user_name || 'Аноним'}\n\n` +
        `🔗 ${webAppUrl}`;
    
    // Копируем текст в буфер
    navigator.clipboard.writeText(shareText);
    showToast('✅ Ссылка скопирована!', 'success');
    
    // Открываем Telegram с предзаполненным сообщением
    const encodedText = encodeURIComponent(shareText);
    const tgLink = `https://t.me/share/url?url=${encodeURIComponent(webAppUrl)}&text=${encodedText}`;
    
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.openTelegramLink(tgLink);
    } else {
        window.open(tgLink, '_blank');
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
                showToast('✅ Сделка создана! Перейдите в раздел "Ордера"', 'success');
                setShowModal(false);
                setTradeAmount('');
                setActiveTab('trades');
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
            'pending': '🟡 Ожидает оплаты',
            'paid': '🟠 Оплачено',
            'completed': '✅ Завершена',
            'cancelled': '❌ Отменена'
        };
        return statuses[status] || status;
    };

    const renderMarket = () => (
        <>
            <div className="p2p-buy-sell-tabs">
                <button className={`p2p-bs-tab ${buySellTab === 'buy' ? 'active' : ''}`} onClick={() => setBuySellTab('buy')}>
                    🛒 Купить USDT
                </button>
                <button className={`p2p-bs-tab ${buySellTab === 'sell' ? 'active' : ''}`} onClick={() => setBuySellTab('sell')}>
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
                        <div key={order.id} className="p2p-order-item">
                            <div className="p2p-order-user">
                                <div className="p2p-user-info">
                                    <div className="p2p-user-avatar">{order.user_name?.charAt(0) || '👤'}</div>
                                    <div>
                                        <div className="p2p-user-name">{order.user_name || 'Продавец'}</div>
                                        <div className="p2p-user-stats">
                                            <span className="p2p-completion-rate">{order.completion_rate || 98}% выполнено</span>
                                            <span className="p2p-trades-count">{order.completed_trades || 0} сделок</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p2p-order-rate">{order.rate} ₽<span>за 1 USDT</span></div>
                            <div className="p2p-order-amount">Доступно: {formatNumber(order.available_amount)} USDT</div>
                            <div className="p2p-order-payment">
                                {order.payment_methods?.slice(0, 2).map(method => (
                                    <span key={method} className="p2p-payment-method">
                                        {method === 'bank_transfer' && '🏦 Банк'}
                                        {method === 'card' && '💳 Карта'}
                                        {method === 'sbp' && '📱 СБП'}
                                        {method === 'cash' && '💰 Наличные'}
                                    </span>
                                ))}
                                {order.payment_methods?.length > 2 && <span className="p2p-payment-method">+{order.payment_methods.length - 2}</span>}
                            </div>
                            <div className="p2p-order-buttons">
                                <button className="p2p-buy-btn" onClick={() => { setSelectedOrder(order); setShowModal(true); }}>Купить</button>
                                <button className="p2p-share-btn" onClick={() => shareOrder(order)}>📤</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );

    return (
        <div className="p2p-fullscreen">
            <div className="p2p-content-area">
                {activeTab === 'market' && renderMarket()}
                {activeTab === 'my_ads' && <div className="p2p-empty">Мои объявления</div>}
                {activeTab === 'trades' && <div className="p2p-empty">Ордера</div>}
            </div>

            {/* Нижняя навигация как в App.js */}
            <div className="p2p-bottom-nav">
                <button className={`p2p-bottom-nav-item ${activeTab === 'market' ? 'active' : ''}`} onClick={() => setActiveTab('market')}>
                    <div className="p2p-bottom-icon">📊</div>
                    <span className="p2p-bottom-label">Маркет</span>
                </button>
                <button className={`p2p-bottom-nav-item ${activeTab === 'my_ads' ? 'active' : ''}`} onClick={() => setActiveTab('my_ads')}>
                    <div className="p2p-bottom-icon">📋</div>
                    <span className="p2p-bottom-label">Мои</span>
                </button>
                <button className={`p2p-bottom-nav-item ${activeTab === 'trades' ? 'active' : ''}`} onClick={() => setActiveTab('trades')}>
                    <div className="p2p-bottom-icon">📦</div>
                    <span className="p2p-bottom-label">Ордера</span>
                </button>
            </div>

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
                                <div>Доступно: {selectedOrder.available_amount} USDT</div>
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