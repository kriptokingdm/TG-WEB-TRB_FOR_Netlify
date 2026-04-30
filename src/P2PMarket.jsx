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
    const [selectedTrade, setSelectedTrade] = useState(null);
    const [amount, setAmount] = useState('');
    const [currencyType, setCurrencyType] = useState('usdt');
    const [creatingTrade, setCreatingTrade] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [activeTab, setActiveTab] = useState('active');
    
    // Состояния для чата
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const messagesEndRef = useRef(null);
    const chatIntervalRef = useRef(null);
    
    const [filters, setFilters] = useState({
        paymentMethod: 'all',
        maxAmount: '',
        maxTime: 'all'
    });
    const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
    const [showTimeDropdown, setShowTimeDropdown] = useState(false);
    
    const amountInputRef = useRef(null);

    const [newOrder, setNewOrder] = useState({
        type: 'sell',
        amount: '',
        rate: '',
        min_amount: '10',
        max_amount: '',
        payment_methods: [],
        payment_details: '',
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

    // Загрузка данных
    useEffect(() => {
        fetchStats();
        fetchOrders();
        fetchMyTrades();
    }, []);

    useEffect(() => {
        if (screen === 'my_ads') fetchMyAds();
        if (screen === 'orders') fetchMyTrades();
    }, [screen]);

    useEffect(() => {
        if (selected && amountInputRef.current) {
            setTimeout(() => {
                amountInputRef.current.focus();
            }, 150);
        }
    }, [selected]);

    // Автообновление чата
    useEffect(() => {
        if (selectedTrade) {
            fetchMessages(selectedTrade.trade_id);
            chatIntervalRef.current = setInterval(() => {
                fetchMessages(selectedTrade.trade_id);
            }, 3000);
            return () => {
                if (chatIntervalRef.current) {
                    clearInterval(chatIntervalRef.current);
                }
            };
        }
    }, [selectedTrade]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // API вызовы
    const fetchStats = async () => {
        try {
            const res = await fetch(`${API}/api/p2p/stats/${userId}`);
            const data = await res.json();
            setStats({
                total: data.total_trades || 0,
                completed: data.successful_trades || 0,
                active: data.pending_trades || 0
            });
        } catch (e) {
            console.error(e);
        }
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
            const res = await fetch(`${API}/api/p2p/trade/user/${userId}`);
            const data = await res.json();
            if (data.success) {
                setMyTrades(data.trades || []);
                const pending = (data.trades || []).find(t => t.status === 'pending' || t.status === 'paid');
                setActiveTrade(pending || null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (tradeId) => {
        try {
            const res = await fetch(`${API}/api/p2p/trade/messages/${tradeId}`);
            const data = await res.json();
            if (data.success) {
                setMessages(data.messages || []);
            }
        } catch (e) {
            console.error('Error fetching messages:', e);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim()) return;
        setSendingMessage(true);
        try {
            const res = await fetch(`${API}/api/p2p/trade/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tradeId: selectedTrade.trade_id,
                    userId: userId,
                    message: newMessage.trim()
                })
            });
            const data = await res.json();
            if (data.success) {
                setMessages(prev => [...prev, data.message]);
                setNewMessage('');
            } else {
                showToast(data.error || 'Ошибка отправки', 'error');
            }
        } catch (e) {
            showToast('Ошибка соединения', 'error');
        } finally {
            setSendingMessage(false);
        }
    };

    // В startTrade функции - замени вызов setScreen на navigateTo
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
            showToast(`✅ Сделка успешно создана!`, 'success');
            setSelected(null);
            setAmount('');
            
            // Обновляем список сделок
            await fetchMyTrades();
            
            // Переход на страницу сделок ВНУТРИ P2P
            setActiveTab('active');
            setScreen('orders');
            
            // НЕ ВЫЗЫВАЙ navigateTo!
            // если есть строка типа navigateTo('order_list') - УДАЛИ ЕЁ
            
            setTimeout(() => {
                showToast(`⏰ У вас ${selected.payment_time || 30} минут на оплату`, 'info');
            }, 1000);
            
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
                showToast('✅ Оплата подтверждена! Ожидайте подтверждения от продавца', 'success');
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
    const orderUrl = `https://tg-web-trb-for-netlify.vercel.app/#p2p/trade/${order.id}`;
    navigator.clipboard.writeText(orderUrl);
    showToast('✅ Ссылка на объявление скопирована! Отправьте другу', 'success');
};

//     const shareOrder = (order) => {
//     // Ссылка на бота с параметром order_
//     const botLink = `https://t.me/TetherRabbitBot?start=order_${order.id}`;
    
//     // Копируем ссылку
//     navigator.clipboard.writeText(botLink);
    
//     showToast('✅ Ссылка на объявление скопирована! Отправьте другу', 'success');
    
//     if (window.Telegram?.WebApp?.HapticFeedback) {
//         window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
//     }
// };

    const openRules = (e) => {
        if (e) e.stopPropagation();
        localStorage.setItem('helpSection', 'rules');
        if (navigateTo) {
            navigateTo('help');
        }
    };

    const formatNumber = (num) => {
        if (num === undefined || num === null) return '0';
        return new Intl.NumberFormat('ru-RU').format(num);
    };

    const getStatusText = (status) => {
        const map = { 
            pending: '⏳ Ожидает оплаты', 
            paid: '💳 Оплачено, ждёт подтверждения', 
            completed: '✅ Завершена', 
            cancelled: '❌ Отменена', 
            expired: '⏰ Просрочена' 
        };
        return map[status] || status;
    };

    const getStatusColor = (status) => {
        const map = {
            pending: '#ff9500',
            paid: '#34c759',
            completed: '#34c759',
            cancelled: '#ff3b30',
            expired: '#8e8e93'
        };
        return map[status] || '#888';
    };

    const getTimeLeft = (expiresAt) => {
        if (!expiresAt) return null;
        const diff = new Date(expiresAt) - new Date();
        if (diff <= 0) return 'expired';
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const StaticBanner = () => (
        <div className="warning-banner">
            <div className="warning-icon">⚠️</div>
            <div className="warning-content">
                Перед началом торговли P2P ознакомьтесь с 
                <span className="rules-link" onClick={openRules}> общими правилами</span>
                . Пожалуйста, соблюдайте условия маркета и уважительно относитесь к контрагентам.
            </div>
        </div>
    );

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

    const TradeCard = ({ trade, onUpdate, isNew }) => {
    const isBuyer = trade.buyer_id === userId;
    const [timeLeft, setTimeLeft] = useState(null);
    const [isExpired, setIsExpired] = useState(false);
    const [showHighlight, setShowHighlight] = useState(isNew);
    const showChat = trade.status === 'pending' || trade.status === 'paid';
    
    // Убираем подсветку через 1 секунду
    useEffect(() => {
        if (showHighlight) {
            const timer = setTimeout(() => setShowHighlight(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [showHighlight]);
    
    // Реальный таймер с автоотменой
    useEffect(() => {
        if (trade.status !== 'pending' || !trade.expires_at) return;
        
        const updateTimer = () => {
            const expiresDate = new Date(trade.expires_at);
            const now = new Date();
            const diff = expiresDate - now;
            
            if (diff <= 0) {
                setTimeLeft('00:00');
                if (!isExpired) {
                    setIsExpired(true);
                    autoCancelTrade(trade.trade_id);
                }
            } else {
                const minutes = Math.floor(diff / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }
        };
        
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [trade.expires_at, trade.status]);
    
    const autoCancelTrade = async (tradeId) => {
        try {
            const res = await fetch(`${API}/api/p2p/trade/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tradeId, userId })
            });
            const data = await res.json();
            if (data.success) {
                showToast('⏰ Время оплаты истекло, сделка автоматически отменена', 'warning');
                if (onUpdate) onUpdate();
            }
        } catch (e) {
            console.error('Auto cancel error:', e);
        }
    };
    
    const getStatusBadge = () => {
        switch (trade.status) {
            case 'pending':
                return { text: '⏳ Ожидает оплаты', color: '#ff9500', bg: 'rgba(255, 149, 0, 0.15)' };
            case 'paid':
                return { text: '💳 Оплачено', color: '#34c759', bg: 'rgba(52, 199, 89, 0.15)' };
            case 'completed':
                return { text: '✅ Завершена', color: '#34c759', bg: 'rgba(52, 199, 89, 0.1)' };
            case 'cancelled':
                return { text: '❌ Отменена', color: '#ff3b30', bg: 'rgba(255, 59, 48, 0.1)' };
            case 'expired':
                return { text: '⏰ Просрочена', color: '#8e8e93', bg: 'rgba(142, 142, 147, 0.1)' };
            default:
                return { text: trade.status, color: '#888', bg: 'rgba(136, 136, 136, 0.1)' };
        }
    };
    
    const badge = getStatusBadge();
    
    return (
        <div className={`trade-card-new ${trade.status} ${showHighlight ? 'trade-card-highlight' : ''}`}>
            <div className="trade-card-header">
                <div className="trade-type-badge">
                    {isBuyer ? '📥 Покупка' : '📤 Продажа'}
                </div>
                <div className="trade-status-badge" style={{ background: badge.bg, color: badge.color }}>
                    {badge.text}
                </div>
            </div>
            
            <div className="trade-info-row">
                <div className="trade-amount-info">
                    <div className="trade-amount-value">
                        {formatNumber(trade.amount)} <span className="trade-currency">USDT</span>
                    </div>
                    <div className="trade-rate-info">
                        по {formatNumber(trade.rate)} ₽
                    </div>
                </div>
                <div className="trade-total-info">
                    = {formatNumber(trade.total_rub)} ₽
                </div>
            </div>
            
            {trade.status === 'pending' && (
                <div className={`trade-timer-section ${isExpired ? 'expired' : ''}`}>
                    <span className="timer-icon">⏰</span>
                    <span className="timer-label">Осталось:</span>
                    <span className="timer-value">{timeLeft || '--:--'}</span>
                </div>
            )}
            
            <div className="trade-actions-new">
                {trade.status === 'pending' && isBuyer && (
                    <button className="action-btn pay-btn" onClick={() => confirmPayment(trade.trade_id)}>
                        💳 Оплатил
                    </button>
                )}
                {trade.status === 'paid' && !isBuyer && (
                    <button className="action-btn confirm-btn" onClick={() => confirmReceipt(trade.trade_id)}>
                        ✅ Получил
                    </button>
                )}
                {(trade.status === 'pending' || trade.status === 'paid') && (
                    <button className="action-btn cancel-btn" onClick={() => cancelTrade(trade.trade_id)}>
                        ❌ Отменить
                    </button>
                )}
                {showChat && (
                    <button className="action-btn chat-btn" onClick={() => setSelectedTrade(trade)}>
                        💬 Чат
                    </button>
                )}
            </div>
        </div>
    );
};

    const ChatModal = () => (
        <div className="modal" onClick={() => setSelectedTrade(null)}>
            <div className="modalContent chat-modal" onClick={e => e.stopPropagation()}>
                <div className="modalHeader">
                    <h3>💬 Чат сделки #{selectedTrade?.trade_id?.slice(-6)}</h3>
                    <button className="modal-close" onClick={() => setSelectedTrade(null)}>✕</button>
                </div>
                <div className="chat-messages">
                    {messages.length === 0 ? (
                        <div className="chat-empty">Нет сообщений. Начните диалог!</div>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} className={`chat-message ${msg.user_id === userId ? 'own' : 'other'}`}>
                                <div className="chat-message-name">{msg.user_name}</div>
                                <div className="chat-message-text">{msg.message}</div>
                                <div className="chat-message-time">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="chat-input-container">
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="Напишите сообщение..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <button className="chat-send" onClick={sendMessage} disabled={sendingMessage || !newMessage.trim()}>
                        {sendingMessage ? '⏳' : '➤'}
                    </button>
                </div>
            </div>
        </div>
    );

    const TradeModal = () => (
        <div className="modal" onClick={() => setSelected(null)}>
            <div className="modalContent" onClick={e => e.stopPropagation()}>
                <div className="modalHeader">
                    <h3>Создание сделки</h3>
                    <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
                </div>
                <div className="modalBody">
                    <div className="modalInfo">
                        <div className="info-row-modal"><span>Курс</span><strong>{selected.rate} ₽</strong></div>
                        <div className="info-row-modal"><span>Лимиты</span><strong>{selected.min_amount} - {selected.max_amount} USDT</strong></div>
                        <div className="info-row-modal"><span>Доступно</span><strong>{selected.available_amount} USDT</strong></div>
                    </div>
                    <div className="currencySwitch">
                        <button className={currencyType === 'usdt' ? 'active' : ''} onClick={() => setCurrencyType('usdt')}>USDT</button>
                        <button className={currencyType === 'rub' ? 'active' : ''} onClick={() => setCurrencyType('rub')}>RUB</button>
                    </div>
                    <input 
                        ref={amountInputRef}
                        type="number" 
                        className="amountInput"
                        value={amount} 
                        onChange={e => setAmount(e.target.value)} 
                        placeholder={`Введите сумму в ${currencyType === 'usdt' ? 'USDT' : 'RUB'}`}
                    />
                    {amount && (
                        <div className="calcResult">
                            {currencyType === 'usdt' 
                                ? `≈ ${formatNumber(parseFloat(amount) * selected.rate)} ₽`
                                : `≈ ${formatNumber(parseFloat(amount) / selected.rate)} USDT`}
                        </div>
                    )}
                    <button className="confirmBtn" onClick={startTrade} disabled={creatingTrade}>
                        {creatingTrade ? 'Создание...' : '✅ Начать сделку'}
                    </button>
                </div>
            </div>
        </div>
    );

    // Экраны
    const ProfileScreen = () => {
    const successRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    
    return (
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
                <div>
                    <b>{stats.completed}</b>
                    <span>✅ Выполнено</span>
                </div>
                <div>
                    <b>{successRate}%</b>
                    <span>📊 Успешных</span>
                </div>
                <div>
                    <b>{stats.active}</b>
                    <span>🟢 Активные</span>
                </div>
            </div>
            <div className="actions">
                <button className="buy" onClick={() => setScreen('buy')}>Купить</button>
                <button className="sell" onClick={() => setScreen('sell')}>Продать</button>
            </div>
            <div className="menu">
                <button className="menu-item" onClick={() => { setScreen('my_ads'); fetchMyAds(); }}>📋 Мои объявления</button>
                <button className="menu-item" onClick={() => { setScreen('orders'); fetchMyTrades(); }}>📦 Мои сделки</button>
                <button className="menu-item" onClick={() => setScreen('help')}>❓ Помощь</button>
            </div>
            {activeTrade && (
                <div className="active-trade-banner" onClick={() => setScreen('orders')}>
                    <span>🟢</span>
                    <span>У вас активная сделка #{activeTrade.trade_id?.slice(-6)}</span>
                    <span>→</span>
                </div>
            )}
        </div>
    );
};

    const BuyScreen = () => {
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
        const filtered = sellOrders.filter(order => {
            if (filters.paymentMethod !== 'all' && !order.payment_methods?.includes(filters.paymentMethod)) return false;
            if (filters.maxAmount && order.available_amount > parseFloat(filters.maxAmount)) return false;
            if (filters.maxTime !== 'all') {
                const time = order.payment_time || 30;
                if (time > parseFloat(filters.maxTime)) return false;
            }
            return true;
        });
        return (
            <div className="screen">
                <div className="header">
                    <button onClick={() => setScreen('main')}>←</button>
                    <h2>Купить USDT</h2>
                    <div></div>
                </div>
                <StaticBanner />
                <div className="filter-bar">
                    <div className="filter-chip">
                        <div className="filter-chip-label">Способ</div>
                        <div className="filter-chip-value" onClick={() => setShowPaymentDropdown(!showPaymentDropdown)}>
                            {selectedPayment.label}<span className="chip-arrow">⌄</span>
                        </div>
                        {showPaymentDropdown && (<div className="chip-dropdown-bottom">{paymentMethodsFilter.map(m => (<div key={m.value} className={`chip-option ${filters.paymentMethod === m.value ? 'active' : ''}`} onClick={() => { setFilters({...filters, paymentMethod: m.value}); setShowPaymentDropdown(false); }}>{m.label}</div>))}</div>)}
                    </div>
                    <div className="filter-chip">
                        <div className="filter-chip-label">Сумма до</div>
                        <input type="number" className="filter-chip-input" placeholder="USDT" value={filters.maxAmount} onChange={e => setFilters({...filters, maxAmount: e.target.value})} />
                    </div>
                    <div className="filter-chip">
                        <div className="filter-chip-label">Время</div>
                        <div className="filter-chip-value" onClick={() => setShowTimeDropdown(!showTimeDropdown)}>
                            {selectedTime.label}<span className="chip-arrow">⌄</span>
                        </div>
                        {showTimeDropdown && (<div className="chip-dropdown-bottom">{timeFilterOptions.map(t => (<div key={t.value} className={`chip-option ${filters.maxTime === t.value ? 'active' : ''}`} onClick={() => { setFilters({...filters, maxTime: t.value}); setShowTimeDropdown(false); }}>{t.label}</div>))}</div>)}
                    </div>
                </div>
                <div className="orders-list">
                    {loading ? [...Array(3)].map((_, i) => <div key={i} className="skeleton" />) : filtered.length === 0 ? <div className="empty">Нет объявлений</div> : filtered.map(order => <OrderCard key={order.id} order={order} type="buy" />)}
                </div>
            </div>
        );
    };

    const SellScreen = () => {
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
        const filtered = buyOrders.filter(order => {
            if (filters.paymentMethod !== 'all' && !order.payment_methods?.includes(filters.paymentMethod)) return false;
            if (filters.maxAmount && order.available_amount > parseFloat(filters.maxAmount)) return false;
            if (filters.maxTime !== 'all') {
                const time = order.payment_time || 30;
                if (time > parseFloat(filters.maxTime)) return false;
            }
            return true;
        });
        return (
            <div className="screen">
                <div className="header">
                    <button onClick={() => setScreen('main')}>←</button>
                    <h2>Продать USDT</h2>
                    <div></div>
                </div>
                <StaticBanner />
                <div className="filter-bar">
                    <div className="filter-chip">
                        <div className="filter-chip-label">Способ</div>
                        <div className="filter-chip-value" onClick={() => setShowPaymentDropdown(!showPaymentDropdown)}>
                            {selectedPayment.label}<span className="chip-arrow">⌄</span>
                        </div>
                        {showPaymentDropdown && (<div className="chip-dropdown-bottom">{paymentMethodsFilter.map(m => (<div key={m.value} className={`chip-option ${filters.paymentMethod === m.value ? 'active' : ''}`} onClick={() => { setFilters({...filters, paymentMethod: m.value}); setShowPaymentDropdown(false); }}>{m.label}</div>))}</div>)}
                    </div>
                    <div className="filter-chip">
                        <div className="filter-chip-label">Сумма до</div>
                        <input type="number" className="filter-chip-input" placeholder="USDT" value={filters.maxAmount} onChange={e => setFilters({...filters, maxAmount: e.target.value})} />
                    </div>
                    <div className="filter-chip">
                        <div className="filter-chip-label">Время</div>
                        <div className="filter-chip-value" onClick={() => setShowTimeDropdown(!showTimeDropdown)}>
                            {selectedTime.label}<span className="chip-arrow">⌄</span>
                        </div>
                        {showTimeDropdown && (<div className="chip-dropdown-bottom">{timeFilterOptions.map(t => (<div key={t.value} className={`chip-option ${filters.maxTime === t.value ? 'active' : ''}`} onClick={() => { setFilters({...filters, maxTime: t.value}); setShowTimeDropdown(false); }}>{t.label}</div>))}</div>)}
                    </div>
                </div>
                <div className="orders-list">
                    {loading ? [...Array(3)].map((_, i) => <div key={i} className="skeleton" />) : filtered.length === 0 ? <div className="empty">Нет объявлений</div> : filtered.map(order => <OrderCard key={order.id} order={order} type="sell" />)}
                </div>
            </div>
        );
    };

    const MyAdsScreen = () => (
        <div className="screen">
            <div className="header">
                <button onClick={() => setScreen('main')}>←</button>
                <h2>Мои объявления</h2>
                <button className="create-btn" onClick={() => setShowCreateForm(!showCreateForm)}>+</button>
            </div>
            <div className="ads-list">
                {loading ? <div className="loading">Загрузка...</div> : myAds.length === 0 ? <div className="empty">Нет объявлений</div> : myAds.map(ad => (
                    <div key={ad.id} className="ad-card">
                        <div className="ad-header"><span className={`ad-type ${ad.type}`}>{ad.type === 'sell' ? 'Продажа' : 'Покупка'}</span><span className={`ad-status ${ad.status}`}>{ad.status === 'active' ? 'Активно' : 'Приостановлено'}</span></div>
                        <div className="ad-rate">{ad.rate} ₽</div>
                        <div className="ad-amount">{ad.available_amount}/{ad.amount} USDT</div>
                        <div className="ad-actions"><button className="ad-delete" onClick={() => { if(window.confirm('Удалить?')) fetch(`${API}/api/p2p/order/${ad.id}`, {method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({userId})}).then(()=>{showToast('Удалено','success');fetchMyAds();})}}>Удалить</button></div>
                    </div>
                ))}
            </div>
        </div>
    );

    const OrdersScreen = () => (
        
    <div className="screen">
        <div className="header">
            <button onClick={() => setScreen('main')}>←</button>
            <h2>Мои сделки</h2>
            <div></div>
        </div>
        <div className="tabs">
            <button className={activeTab === 'active' ? 'active' : ''} onClick={() => setActiveTab('active')}>Активные</button>
            <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>История</button>
        </div>
        <div className="trades-list">
            {loading ? (
                <div className="loading">Загрузка...</div>
            ) : myTrades.length === 0 ? (
                <div className="empty">Нет сделок</div>
            ) : (
                myTrades
                    .filter(t => activeTab === 'active' 
                        ? ['pending', 'paid'].includes(t.status) 
                        : ['completed', 'cancelled', 'expired'].includes(t.status))
                    .map((trade, index) => (
                        <div 
                            key={trade.trade_id} 
                            className="trade-card-wrapper" 
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <TradeCard trade={trade} onUpdate={fetchMyTrades} />
                        </div>
                    ))
            )}
        </div>
    </div>
);

    const HelpScreen = () => (
        <div className="screen">
            <div className="header"><button onClick={() => setScreen('main')}>←</button><h2>Помощь</h2><div></div></div>
            <div className="helpContent">
                <div className="helpBlock"><h3>🤝 Как работает P2P?</h3><p>Вы покупаете USDT у других пользователей напрямую.</p></div>
                <div className="helpBlock"><h3>⏰ Время на оплату</h3><p>Обычно 30 минут.</p></div>
                <div className="helpBlock"><h3>✅ Защита сделки</h3><p>USDT продавца заморожены до подтверждения оплаты.</p></div>
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
            {selectedTrade && <ChatModal />}
        </div>
    );
}