// src/TradeDetail.jsx
import React, { useState, useEffect, useRef } from 'react';
import './P2P.css';

const API = 'https://tethrab.shop';

export default function TradeDetail({ telegramUser, showToast, navigateTo, tradeId }) {
    const userId = telegramUser?.id || '7879866656';
    const [trade, setTrade] = useState(null);
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const [showChat, setShowChat] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const messagesEndRef = useRef(null);
    const [chatInterval, setChatInterval] = useState(null);

    useEffect(() => {
        if (tradeId) {
            fetchTrade();
        }
    }, [tradeId]);

    useEffect(() => {
        if (trade && trade.status === 'pending' && trade.expires_at) {
            const timer = setInterval(() => {
                updateTimeLeft();
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [trade]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const updateTimeLeft = () => {
        if (!trade?.expires_at) return;
        const diff = new Date(trade.expires_at) - new Date();
        if (diff <= 0) {
            setTimeLeft('Время истекло');
        } else {
            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
    };

    const fetchTrade = async () => {
        try {
            const res = await fetch(`${API}/api/p2p/trade/user/${userId}`);
            const data = await res.json();
            if (data.success) {
                const foundTrade = data.trades.find(t => t.trade_id === tradeId);
                if (foundTrade) {
                    setTrade(foundTrade);
                    const orderRes = await fetch(`${API}/api/p2p/order/${foundTrade.order_id}`);
                    const orderData = await orderRes.json();
                    if (orderData.success) {
                        setOrder(orderData.order);
                    }
                    updateTimeLeft();
                    loadMessages();
                } else {
                    showToast('Сделка не найдена', 'error');
                    navigateTo('orders');
                }
            }
        } catch (e) {
            showToast('Ошибка загрузки', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async () => {
        if (!tradeId) return;
        try {
            const res = await fetch(`${API}/api/p2p/trade/messages/${tradeId}`);
            const data = await res.json();
            if (data.success) {
                setMessages(data.messages || []);
            }
        } catch (e) {
            console.error('Error loading messages:', e);
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
                    tradeId: tradeId,
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

    const confirmPayment = async () => {
        try {
            const res = await fetch(`${API}/api/p2p/trade/confirm-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tradeId: trade.trade_id, userId })
            });
            const data = await res.json();
            if (data.success) {
                showToast('✅ Оплата подтверждена!', 'success');
                fetchTrade();
            } else {
                showToast(data.error || 'Ошибка', 'error');
            }
        } catch (e) {
            showToast('Ошибка соединения', 'error');
        }
    };

    const confirmReceipt = async () => {
        try {
            const res = await fetch(`${API}/api/p2p/trade/confirm-receipt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tradeId: trade.trade_id, userId })
            });
            const data = await res.json();
            if (data.success) {
                showToast('✅ Сделка завершена!', 'success');
                fetchTrade();
            } else {
                showToast(data.error || 'Ошибка', 'error');
            }
        } catch (e) {
            showToast('Ошибка соединения', 'error');
        }
    };

    const cancelTrade = async () => {
        if (!window.confirm('Отменить сделку?')) return;
        try {
            const res = await fetch(`${API}/api/p2p/trade/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tradeId: trade.trade_id, userId })
            });
            const data = await res.json();
            if (data.success) {
                showToast('❌ Сделка отменена', 'success');
                navigateTo('orders');
            } else {
                showToast(data.error || 'Ошибка', 'error');
            }
        } catch (e) {
            showToast('Ошибка соединения', 'error');
        }
    };

    const formatNumber = (num) => {
        if (num === undefined || num === null) return '0';
        return new Intl.NumberFormat('ru-RU').format(num);
    };

    const getStatusText = (status) => {
        const map = {
            pending: '⏳ Ожидает оплаты',
            paid: '💳 Оплачено',
            completed: '✅ Успешно завершена',
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

    const isBuyer = trade?.buyer_id === userId;
    const isSeller = trade?.seller_id === userId;
    const canConfirmPayment = trade?.status === 'pending' && isBuyer;
    const canConfirmReceipt = trade?.status === 'paid' && isSeller;
    const canCancel = trade?.status === 'pending' || trade?.status === 'paid';
    const showTimer = trade?.status === 'pending' && timeLeft && timeLeft !== 'Время истекло';

    if (loading) {
        return (
            <div className="screen">
                <div className="header">
                    <button onClick={() => navigateTo('orders')}>←</button>
                    <h2>Загрузка...</h2>
                    <div></div>
                </div>
                <div className="loading">Загрузка информации о сделке...</div>
            </div>
        );
    }

    if (!trade || !order) {
        return (
            <div className="screen">
                <div className="header">
                    <button onClick={() => navigateTo('orders')}>←</button>
                    <h2>Ошибка</h2>
                    <div></div>
                </div>
                <div className="empty">Сделка не найдена</div>
            </div>
        );
    }

    return (
        <div className="screen trade-detail-screen">
            <div className="header">
                <button onClick={() => navigateTo('orders')}>←</button>
                <h2>Детали сделки</h2>
                <div></div>
            </div>

            <div className="trade-detail-card">
                <div className="detail-header">
                    <div className="detail-trade-id">
                        🔖 <strong>{trade.trade_id}</strong>
                    </div>
                    <div className="detail-status" style={{ color: getStatusColor(trade.status) }}>
                        {getStatusText(trade.status)}
                    </div>
                </div>

                <div className="detail-section">
                    <div className="detail-title">💰 Сумма и курс</div>
                    <div className="detail-row">
                        <span>Сумма:</span>
                        <span><strong>{formatNumber(trade.amount)} USDT</strong></span>
                    </div>
                    <div className="detail-row">
                        <span>Курс:</span>
                        <span><strong>{formatNumber(trade.rate)} ₽</strong></span>
                    </div>
                    <div className="detail-row total">
                        <span>Итого:</span>
                        <span><strong>{formatNumber(trade.total_rub)} ₽</strong></span>
                    </div>
                    {trade.fee > 0 && (
                        <div className="detail-row fee">
                            <span>Комиссия маркета (0.5%):</span>
                            <span>- {formatNumber(trade.fee)} ₽</span>
                        </div>
                    )}
                    {trade.seller_gets > 0 && isSeller && (
                        <div className="detail-row fee">
                            <span>Вы получите (после комиссии):</span>
                            <span><strong className="green">{formatNumber(trade.seller_gets)} ₽</strong></span>
                        </div>
                    )}
                </div>

                <div className="detail-section">
                    <div className="detail-title">👤 Стороны сделки</div>
                    <div className="detail-row">
                        <span>Продавец:</span>
                        <span><strong>{trade.seller_id === userId ? 'Это вы' : `User ${trade.seller_id?.slice(-6)}`}</strong></span>
                    </div>
                    <div className="detail-row">
                        <span>Покупатель:</span>
                        <span><strong>{trade.buyer_id === userId ? 'Это вы' : `User ${trade.buyer_id?.slice(-6)}`}</strong></span>
                    </div>
                </div>

                <div className="detail-section">
                    <div className="detail-title">💳 Реквизиты продавца</div>
                    <div className="payment-details">
                        {order.payment_details ? (
                            <div className="payment-text">{order.payment_details}</div>
                        ) : (
                            <div className="payment-placeholder">Продавец не указал реквизиты. Уточните в чате.</div>
                        )}
                    </div>
                    <div className="payment-methods">
                        {order.payment_methods?.map((method, idx) => (
                            <span key={idx} className="payment-badge">{method}</span>
                        ))}
                    </div>
                </div>

                {order.terms && (
                    <div className="detail-section">
                        <div className="detail-title">📋 Условия продавца</div>
                        <div className="terms-text">{order.terms}</div>
                    </div>
                )}

                {showTimer && (
                    <div className="detail-section timer-section">
                        <div className="timer-icon">⏰</div>
                        <div className="timer-label">Осталось на оплату:</div>
                        <div className="timer-value">{timeLeft}</div>
                    </div>
                )}

                <div className="detail-actions">
                    {canConfirmPayment && (
                        <button className="action-btn confirm-payment" onClick={confirmPayment}>
                            💳 Подтвердить оплату
                        </button>
                    )}
                    {canConfirmReceipt && (
                        <button className="action-btn confirm-receipt" onClick={confirmReceipt}>
                            ✅ Подтвердить получение
                        </button>
                    )}
                    {canCancel && (
                        <button className="action-btn cancel" onClick={cancelTrade}>
                            ❌ Отменить сделку
                        </button>
                    )}
                    <button className="action-btn chat" onClick={() => setShowChat(!showChat)}>
                        💬 Чат с контрагентом
                    </button>
                </div>

                {showChat && (
                    <div className="chat-window">
                        <div className="chat-messages-list">
                            {messages.length === 0 ? (
                                <div className="chat-empty">Нет сообщений</div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div key={idx} className={`chat-bubble ${msg.user_id === userId ? 'own' : 'other'}`}>
                                        <div className="chat-name">{msg.user_name}</div>
                                        <div className="chat-text">{msg.message}</div>
                                        <div className="chat-time">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="chat-input-area">
                            <input
                                type="text"
                                className="chat-input-field"
                                placeholder="Напишите сообщение..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            />
                            <button className="chat-send-btn" onClick={sendMessage} disabled={sendingMessage || !newMessage.trim()}>
                                {sendingMessage ? '⏳' : '📤'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}