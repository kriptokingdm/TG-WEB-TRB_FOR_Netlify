// src/OrdersPage.jsx
import React, { useState, useEffect } from 'react';
import './P2P.css';

const API = 'https://tethrab.shop';

export default function OrdersPage({ telegramUser, showToast, navigateTo }) {
    const userId = telegramUser?.id || '7879866656';
    const [myTrades, setMyTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active');
    const [selectedTrade, setSelectedTrade] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const messagesEndRef = useRef(null);
    const [timeLeft, setTimeLeft] = useState({});

    const fetchMyTrades = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/p2p/trade/user/${userId}`);
            const data = await res.json();
            if (data.success) {
                setMyTrades(data.trades || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyTrades();
        
        // Таймер обновления
        const interval = setInterval(() => {
            fetchMyTrades();
        }, 30000);
        
        return () => clearInterval(interval);
    }, []);

    // Обновление таймеров в реальном времени
    useEffect(() => {
        const updateTimers = () => {
            const newTimeLeft = {};
            myTrades.forEach(trade => {
                if (trade.status === 'pending' && trade.expires_at) {
                    const diff = new Date(trade.expires_at) - new Date();
                    if (diff <= 0) {
                        newTimeLeft[trade.trade_id] = '00:00';
                    } else {
                        const minutes = Math.floor(diff / 60000);
                        const seconds = Math.floor((diff % 60000) / 1000);
                        newTimeLeft[trade.trade_id] = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    }
                }
            });
            setTimeLeft(newTimeLeft);
        };
        
        updateTimers();
        const timer = setInterval(updateTimers, 1000);
        return () => clearInterval(timer);
    }, [myTrades]);

    const formatNumber = (num) => {
        if (num === undefined || num === null) return '0';
        return new Intl.NumberFormat('ru-RU').format(num);
    };

    const getStatusText = (status) => {
        const map = { 
            pending: '⏳ Ожидает оплаты', 
            paid: '💳 Оплачено', 
            completed: '✅ Завершена', 
            cancelled: '❌ Отменена', 
            expired: '⏰ Просрочена' 
        };
        return map[status] || status;
    };

    const TradeCard = ({ trade }) => {
        const isBuyer = trade.buyer_id === userId;
        const timer = timeLeft[trade.trade_id];
        
        return (
            <div className="trade-card-new">
                <div className="trade-card-header">
                    <div className="trade-type-badge">{isBuyer ? '📥 Покупка' : '📤 Продажа'}</div>
                    <div className={`trade-status-badge ${trade.status}`}>{getStatusText(trade.status)}</div>
                </div>
                <div className="trade-info-row">
                    <div className="trade-amount-info">
                        <div className="trade-amount-value">{formatNumber(trade.amount)} <span className="trade-currency">USDT</span></div>
                        <div className="trade-rate-info">по {formatNumber(trade.rate)} ₽</div>
                    </div>
                    <div className="trade-total-info">= {formatNumber(trade.total_rub)} ₽</div>
                </div>
                {trade.status === 'pending' && timer && (
                    <div className="trade-timer-section">
                        <span className="timer-icon">⏰</span>
                        <span className="timer-label">Осталось:</span>
                        <span className="timer-value">{timer}</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="screen">
            <div className="header">
                <button onClick={() => navigateTo('p2p')}>←</button>
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
                        .map(trade => <TradeCard key={trade.trade_id} trade={trade} />)
                )}
            </div>
        </div>
    );
}