// src/P2PMarket.jsx
import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'https://tethrab.shop';

export default function P2PMarket({ telegramUser, showToast, navigateTo }) {
    const [activeSection, setActiveSection] = useState('market'); // market, my_ads, orders
    const [activeTab, setActiveTab] = useState('buy');
    const [orders, setOrders] = useState([]);
    const [myAds, setMyAds] = useState([]);
    const [myTrades, setMyTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        minAmount: '',
        maxAmount: '',
        paymentMethod: ''
    });
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showTradeModal, setShowTradeModal] = useState(false);
    const [tradeAmount, setTradeAmount] = useState('');
    const [creatingTrade, setCreatingTrade] = useState(false);

    const userId = telegramUser?.id || '7879866656';

    useEffect(() => {
        if (activeSection === 'market') {
            fetchOrders();
        } else if (activeSection === 'my_ads') {
            fetchMyAds();
        } else if (activeSection === 'orders') {
            fetchMyTrades();
        }
    }, [activeSection, activeTab, filters]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const type = activeTab === 'buy' ? 'sell' : 'buy';
            let url = `${API_BASE_URL}/api/p2p/orders?type=${type}&limit=50`;
            
            if (filters.minAmount) url += `&min_amount=${filters.minAmount}`;
            if (filters.maxAmount) url += `&max_amount=${filters.maxAmount}`;
            if (filters.paymentMethod) url += `&payment=${filters.paymentMethod}`;
            
            const res = await fetch(url);
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
        if (!confirm('Удалить объявление?')) return;
        
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
            } else {
                showToast(data.error || 'Ошибка удаления', 'error');
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

    const getInitials = (name) => {
        if (!name) return '👤';
        return name.charAt(0).toUpperCase();
    };

    const getStatusText = (status) => {
        const statuses = {
            'pending': '🟡 Ожидает оплаты',
            'paid': '🟠 Оплачено',
            'completed': '✅ Завершена',
            'cancelled': '❌ Отменена',
            'expired': '⏰ Просрочена'
        };
        return statuses[status] || status;
    };

    const paymentMethodsList = [
        { value: 'bank_transfer', label: 'Банковский перевод', icon: '🏦' },
        { value: 'card', label: 'Банковская карта', icon: '💳' },
        { value: 'sbp', label: 'СБП', icon: '📱' },
        { value: 'cash', label: 'Наличные', icon: '💰' },
        { value: 'crypto', label: 'Криптовалюта', icon: '₿' }
    ];

    const getPaymentLabel = (method) => {
        const found = paymentMethodsList.find(m => m.value === method);
        return found ? `${found.icon} ${found.label}` : method;
    };

    // Рендер Маркета (покупка/продажа)
    const renderMarket = () => (
        <>
            {/* Вкладки покупка/продажа */}
            <div className="p2p-market-tabs">
                <button 
                    className={`p2p-market-tab ${activeTab === 'buy' ? 'active' : ''}`}
                    onClick={() => setActiveTab('buy')}
                >
                    🛒 Купить USDT
                </button>
                <button 
                    className={`p2p-market-tab ${activeTab === 'sell' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sell')}
                >
                    💰 Продать USDT
                </button>
            </div>

            {/* Фильтры */}
            <div className="p2p-filters">
                <button className="p2p-filter-btn" onClick={() => setShowFilters(!showFilters)}>
                    🔍 Фильтры {showFilters ? '▲' : '▼'}
                </button>
                
                {showFilters && (
                    <div className="p2p-filters-panel">
                        <div className="p2p-filter-group">
                            <label>Сумма USDT</label>
                            <div className="p2p-filter-range">
                                <input 
                                    type="number" 
                                    placeholder="От" 
                                    value={filters.minAmount}
                                    onChange={e => setFilters({...filters, minAmount: e.target.value})}
                                />
                                <span>—</span>
                                <input 
                                    type="number" 
                                    placeholder="До" 
                                    value={filters.maxAmount}
                                    onChange={e => setFilters({...filters, maxAmount: e.target.value})}
                                />
                            </div>
                        </div>
                        
                        <div className="p2p-filter-group">
                            <label>Способ оплаты</label>
                            <select 
                                value={filters.paymentMethod}
                                onChange={e => setFilters({...filters, paymentMethod: e.target.value})}
                            >
                                <option value="">Все способы</option>
                                {paymentMethodsList.map(m => (
                                    <option key={m.value} value={m.value}>{m.icon} {m.label}</option>
                                ))}
                            </select>
                        </div>
                        
                        <button className="p2p-filter-apply" onClick={() => { fetchOrders(); setShowFilters(false); }}>
                            Применить
                        </button>
                    </div>
                )}
            </div>

            {/* Список объявлений */}
            <div className="p2p-orders-list">
                {loading ? (
                    <div className="p2p-loading">
                        <div className="p2p-spinner"></div>
                        <span>Загрузка объявлений...</span>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="p2p-empty">
                        <span>📭</span>
                        <p>Нет активных объявлений</p>
                    </div>
                ) : (
                    orders.map(order => (
                        <div key={order.id} className="p2p-order-card" onClick={() => { setSelectedOrder(order); setShowTradeModal(true); }}>
                            <div className="p2p-order-header">
                                <div className="p2p-order-user">
                                    <div className="p2p-user-avatar">
                                        {getInitials(order.user_name)}
                                    </div>
                                    <div>
                                        <div className="p2p-user-name">{order.user_name || 'Аноним'}</div>
                                        <div className="p2p-user-rating">
                                            {'⭐'.repeat(Math.floor(order.user_rating || 5))}
                                            <span>{order.user_rating || 5}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p2p-order-badge">
                                    {order.completed_trades || 0} сделок
                                </div>
                            </div>
                            
                            <div className="p2p-order-rate">
                                <span className="p2p-rate-value">{formatNumber(order.rate)}</span>
                                <span className="p2p-rate-currency">₽</span>
                            </div>
                            
                            <div className="p2p-order-amount">
                                Доступно: <strong>{formatNumber(order.available_amount)} USDT</strong>
                            </div>
                            
                            <div className="p2p-order-limits">
                                📊 {formatNumber(order.min_amount)} — {formatNumber(order.max_amount)} USDT
                            </div>
                            
                            <div className="p2p-order-payment">
                                {order.payment_methods?.slice(0, 3).map(method => (
                                    <span key={method} className="p2p-payment-tag">
                                        {getPaymentLabel(method)}
                                    </span>
                                ))}
                                {order.payment_methods?.length > 3 && (
                                    <span className="p2p-payment-more">+{order.payment_methods.length - 3}</span>
                                )}
                            </div>
                            
                            <button className="p2p-order-btn">
                                {activeTab === 'buy' ? 'Купить USDT' : 'Продать USDT'}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </>
    );

    // Рендер Моих объявлений
    const renderMyAds = () => (
        <div className="p2p-my-ads">
            <div className="p2p-my-ads-header">
                <button 
                    className="p2p-create-ad-btn"
                    onClick={() => navigateTo('p2p/create')}
                >
                    ➕ Создать объявление
                </button>
            </div>

            {loading ? (
                <div className="p2p-loading">
                    <div className="p2p-spinner"></div>
                    <span>Загрузка...</span>
                </div>
            ) : myAds.length === 0 ? (
                <div className="p2p-empty">
                    <span>📭</span>
                    <p>У вас нет объявлений</p>
                    <button className="p2p-empty-btn" onClick={() => navigateTo('p2p/create')}>
                        Создать объявление
                    </button>
                </div>
            ) : (
                myAds.map(ad => (
                    <div key={ad.id} className="p2p-ad-card">
                        <div className="p2p-ad-header">
                            <span className={`p2p-ad-type ${ad.type}`}>
                                {ad.type === 'sell' ? '💰 ПРОДАЖА' : '🛒 ПОКУПКА'}
                            </span>
                            <span className={`p2p-ad-status ${ad.status}`}>
                                {ad.status === 'active' ? '✅ Активно' : '⏸ Приостановлено'}
                            </span>
                        </div>
                        
                        <div className="p2p-ad-rate">
                            {ad.rate} ₽ за 1 USDT
                        </div>
                        
                        <div className="p2p-ad-amount">
                            📦 {ad.available_amount} / {ad.amount} USDT
                        </div>
                        
                        <div className="p2p-ad-limits">
                            📊 Мин: {ad.min_amount} | Макс: {ad.max_amount} USDT
                        </div>
                        
                        <div className="p2p-ad-payment">
                            💳 {ad.payment_methods?.map(m => getPaymentLabel(m)).join(', ')}
                        </div>
                        
                        <div className="p2p-ad-actions">
                            <button className="p2p-ad-edit" onClick={() => navigateTo(`p2p/edit/${ad.id}`)}>
                                ✏️ Редактировать
                            </button>
                            <button className="p2p-ad-delete" onClick={() => deleteAd(ad.id)}>
                                ❌ Удалить
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    // Рендер Ордеров (сделок)
    const renderOrders = () => (
        <div className="p2p-orders-section">
            {loading ? (
                <div className="p2p-loading">
                    <div className="p2p-spinner"></div>
                    <span>Загрузка сделок...</span>
                </div>
            ) : myTrades.length === 0 ? (
                <div className="p2p-empty">
                    <span>📭</span>
                    <p>У вас нет активных сделок</p>
                </div>
            ) : (
                myTrades.map(trade => (
                    <div key={trade.trade_id} className="p2p-trade-card">
                        <div className="p2p-trade-header">
                            <span className="p2p-trade-id">Сделка #{trade.trade_id}</span>
                            <span className={`p2p-trade-status ${trade.status}`}>
                                {getStatusText(trade.status)}
                            </span>
                        </div>
                        
                        <div className="p2p-trade-details">
                            <div className="p2p-trade-type">
                                {trade.order_type === 'sell' ? '💰 Покупка USDT' : '🛒 Продажа USDT'}
                            </div>
                            <div className="p2p-trade-amount">
                                {trade.amount} USDT × {trade.rate} ₽ = <strong>{trade.total_rub} ₽</strong>
                            </div>
                        </div>
                        
                        <div className="p2p-trade-users">
                            <div>👤 Покупатель: {trade.buyer_id === userId ? 'Вы' : trade.buyer_id}</div>
                            <div>👤 Продавец: {trade.seller_id === userId ? 'Вы' : trade.seller_id}</div>
                        </div>
                        
                        <div className="p2p-trade-date">
                            📅 {new Date(trade.created_at).toLocaleString()}
                        </div>
                        
                        {(trade.status === 'pending' || trade.status === 'paid') && (
                            <div className="p2p-trade-actions">
                                <button 
                                    className="p2p-trade-chat"
                                    onClick={() => navigateTo(`p2p/trade/${trade.trade_id}`)}
                                >
                                    💬 Чат сделки
                                </button>
                                {trade.status === 'pending' && trade.buyer_id === userId && (
                                    <button className="p2p-trade-pay">
                                        ✅ Подтвердить оплату
                                    </button>
                                )}
                                {trade.status === 'paid' && trade.seller_id === userId && (
                                    <button className="p2p-trade-confirm">
                                        🏁 Подтвердить получение
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );

    // Модальное окно создания сделки
    const renderTradeModal = () => (
        <div className="p2p-modal-overlay" onClick={() => setShowTradeModal(false)}>
            <div className="p2p-modal" onClick={(e) => e.stopPropagation()}>
                <div className="p2p-modal-header">
                    <h3>Создание сделки</h3>
                    <button className="p2p-modal-close" onClick={() => setShowTradeModal(false)}>✕</button>
                </div>
                
                <div className="p2p-modal-content">
                    <div className="p2p-trade-info">
                        <div className="p2p-trade-rate">
                            Курс: <strong>{selectedOrder?.rate} ₽</strong>
                        </div>
                        <div className="p2p-trade-limits">
                            Лимиты: {selectedOrder?.min_amount} — {selectedOrder?.max_amount} USDT
                        </div>
                    </div>
                    
                    <div className="p2p-trade-input">
                        <label>Сумма в USDT</label>
                        <input 
                            type="number" 
                            placeholder={`От ${selectedOrder?.min_amount} до ${selectedOrder?.max_amount}`}
                            value={tradeAmount}
                            onChange={(e) => setTradeAmount(e.target.value)}
                        />
                    </div>
                    
                    {tradeAmount && (
                        <div className="p2p-trade-total">
                            Итого к оплате: <strong>{formatNumber(parseFloat(tradeAmount) * selectedOrder.rate)} ₽</strong>
                        </div>
                    )}
                    
                    <button 
                        className="p2p-trade-btn"
                        onClick={() => startTrade(selectedOrder)}
                        disabled={creatingTrade}
                    >
                        {creatingTrade ? 'Создание...' : '✅ Начать сделку'}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p2p-container">
            {/* Внутренняя навигация P2P */}
            <div className="p2p-nav">
                <button 
                    className={`p2p-nav-btn ${activeSection === 'market' ? 'active' : ''}`}
                    onClick={() => setActiveSection('market')}
                >
                    📊 Маркет
                </button>
                <button 
                    className={`p2p-nav-btn ${activeSection === 'my_ads' ? 'active' : ''}`}
                    onClick={() => setActiveSection('my_ads')}
                >
                    📋 Мои объявления
                </button>
                <button 
                    className={`p2p-nav-btn ${activeSection === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveSection('orders')}
                >
                    📦 Ордера
                </button>
            </div>

            {/* Контент в зависимости от выбранного раздела */}
            <div className="p2p-content">
                {activeSection === 'market' && renderMarket()}
                {activeSection === 'my_ads' && renderMyAds()}
                {activeSection === 'orders' && renderOrders()}
            </div>

            {/* Модалка сделки */}
            {showTradeModal && selectedOrder && renderTradeModal()}
        </div>
    );
}