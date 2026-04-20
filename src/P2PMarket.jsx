// src/P2PMarket.jsx
import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'https://tethrab.shop';

export default function P2PMarket({ telegramUser, showToast, navigateTo }) {
    const [activeTab, setActiveTab] = useState('buy');
    const [orders, setOrders] = useState([]);
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
        fetchOrders();
    }, [activeTab, filters]);

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
                headers: { 'Content-Type': application/json },
                body: JSON.stringify({
                    orderId: order.id,
                    buyerId: userId,
                    amount: amount
                })
            });
            const data = await res.json();
            
            if (data.success) {
                showToast('✅ Сделка создана! Перейдите в чат.', 'success');
                setShowTradeModal(false);
                setTradeAmount('');
                fetchOrders();
                // Перенаправляем в чат сделки
                navigateTo(`trade/${data.trade.trade_id}`);
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

    return (
        <div className="tg-p2p-market">
            {/* Хедер */}
            <div className="tg-p2p-header">
                <h1>🤝 P2P Маркет</h1>
                <p>Покупайте и продавайте USDT напрямую</p>
            </div>

            {/* Вкладки */}
            <div className="tg-p2p-tabs">
                <button 
                    className={`tg-tab ${activeTab === 'buy' ? 'active' : ''}`}
                    onClick={() => setActiveTab('buy')}
                >
                    🛒 Купить
                </button>
                <button 
                    className={`tg-tab ${activeTab === 'sell' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sell')}
                >
                    💰 Продать
                </button>
                <button 
                    className="tg-tab create-btn"
                    onClick={() => navigateTo('p2p/create')}
                >
                    ➕ Создать
                </button>
            </div>

            {/* Фильтры */}
            <div className="tg-filters">
                <button className="tg-filter-btn" onClick={() => setShowFilters(!showFilters)}>
                    🔍 Фильтры {showFilters ? '▲' : '▼'}
                </button>
                
                {showFilters && (
                    <div className="tg-filters-panel">
                        <div className="tg-filter-group">
                            <label>Сумма USDT</label>
                            <div className="tg-filter-range">
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
                        
                        <div className="tg-filter-group">
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
                        
                        <button className="tg-filter-apply" onClick={() => { fetchOrders(); setShowFilters(false); }}>
                            Применить
                        </button>
                    </div>
                )}
            </div>

            {/* Список объявлений */}
            <div className="tg-orders-list">
                {loading ? (
                    <div className="tg-loading">
                        <div className="tg-spinner"></div>
                        <span>Загрузка объявлений...</span>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="tg-empty">
                        <span>📭</span>
                        <p>Нет активных объявлений</p>
                        <button className="tg-empty-btn" onClick={() => navigateTo('p2p/create')}>
                            Создать объявление
                        </button>
                    </div>
                ) : (
                    orders.map(order => (
                        <div key={order.id} className="tg-order-card" onClick={() => setSelectedOrder(order)}>
                            <div className="tg-order-header">
                                <div className="tg-order-user">
                                    <div className="tg-user-avatar">
                                        {getInitials(order.user_name)}
                                    </div>
                                    <div>
                                        <div className="tg-user-name">{order.user_name || 'Аноним'}</div>
                                        <div className="tg-user-rating">
                                            {'⭐'.repeat(Math.floor(order.user_rating || 5))}
                                            <span>{order.user_rating || 5}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="tg-order-badge">
                                    {order.completed_trades || 0} сделок
                                </div>
                            </div>
                            
                            <div className="tg-order-rate">
                                <span className="tg-rate-value">{formatNumber(order.rate)}</span>
                                <span className="tg-rate-currency">₽</span>
                            </div>
                            
                            <div className="tg-order-amount">
                                Доступно: <strong>{formatNumber(order.available_amount)} USDT</strong>
                            </div>
                            
                            <div className="tg-order-limits">
                                📊 {formatNumber(order.min_amount)} — {formatNumber(order.max_amount)} USDT
                            </div>
                            
                            <div className="tg-order-payment">
                                {order.payment_methods?.slice(0, 3).map(method => (
                                    <span key={method} className="tg-payment-tag">
                                        {getPaymentLabel(method)}
                                    </span>
                                ))}
                                {order.payment_methods?.length > 3 && (
                                    <span className="tg-payment-more">+{order.payment_methods.length - 3}</span>
                                )}
                            </div>
                            
                            <button 
                                className="tg-order-btn"
                                onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); setShowTradeModal(true); }}
                            >
                                {activeTab === 'buy' ? 'Купить USDT' : 'Продать USDT'}
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Модальное окно сделки */}
            {showTradeModal && selectedOrder && (
                <div className="tg-modal-overlay" onClick={() => setShowTradeModal(false)}>
                    <div className="tg-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="tg-modal-header">
                            <h3>Создание сделки</h3>
                            <button className="tg-modal-close" onClick={() => setShowTradeModal(false)}>✕</button>
                        </div>
                        
                        <div className="tg-modal-content">
                            <div className="tg-trade-info">
                                <div className="tg-trade-rate">
                                    Курс: <strong>{selectedOrder.rate} ₽</strong>
                                </div>
                                <div className="tg-trade-limits">
                                    Лимиты: {selectedOrder.min_amount} — {selectedOrder.max_amount} USDT
                                </div>
                            </div>
                            
                            <div className="tg-trade-input">
                                <label>Сумма в USDT</label>
                                <input 
                                    type="number" 
                                    placeholder={`От ${selectedOrder.min_amount} до ${selectedOrder.max_amount}`}
                                    value={tradeAmount}
                                    onChange={(e) => setTradeAmount(e.target.value)}
                                />
                            </div>
                            
                            {tradeAmount && (
                                <div className="tg-trade-total">
                                    Итого к оплате: <strong>{formatNumber(parseFloat(tradeAmount) * selectedOrder.rate)} ₽</strong>
                                </div>
                            )}
                            
                            <button 
                                className="tg-trade-btn"
                                onClick={() => startTrade(selectedOrder)}
                                disabled={creatingTrade}
                            >
                                {creatingTrade ? 'Создание...' : '✅ Начать сделку'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}