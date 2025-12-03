import { useState, useEffect } from 'react';
import './History.css';
import SupportChat from './SupportChat';

function History({ navigateTo }) {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeChat, setActiveChat] = useState(null);
    const [viewMode, setViewMode] = useState('active');
    const [message, setMessage] = useState({ type: '', text: '' });

    const serverUrl = 'https://87.242.106.114.sslip.io';

    useEffect(() => {
        fetchUserOrders();
        
        const intervalId = setInterval(() => {
            if (!isLoading && orders.length > 0) {
                fetchUserOrders();
            }
        }, 30000);

        return () => clearInterval(intervalId);
    }, []);

    const fetchUserOrders = async () => {
        try {
            setIsLoading(true);
            const userData = JSON.parse(localStorage.getItem('currentUser'));

            if (!userData || !userData.id) {
                setError('Требуется авторизация');
                setIsLoading(false);
                return;
            }

            const response = await fetch(`${serverUrl}/api/user-orders/${userData.id}`, {
                method: 'GET',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();
                let ordersData = [];

                if (data.success && Array.isArray(data.orders)) {
                    ordersData = data.orders;
                } else if (data.orders && typeof data.orders === 'object') {
                    ordersData = Object.values(data.orders);
                } else if (Array.isArray(data)) {
                    ordersData = data;
                }

                const sortedOrders = ordersData.sort((a, b) => {
                    const dateA = new Date(a.createdAt || a.timestamp || Date.now());
                    const dateB = new Date(b.createdAt || b.timestamp || Date.now());
                    return dateB - dateA;
                });

                setOrders(sortedOrders);
                setError('');
                showMessage('success', '✅ История обновлена');
                
                localStorage.setItem('userOrders', JSON.stringify(sortedOrders));
            } else {
                const localOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
                if (localOrders.length > 0) {
                    setOrders(localOrders);
                    setError('⚠️ Используем локальные данные');
                    showMessage('warning', '⚠️ Используем кэшированные данные');
                } else {
                    setError('Ошибка загрузки данных');
                    showMessage('error', '❌ Ошибка загрузки');
                }
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки:', error);
            const localOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
            if (localOrders.length > 0) {
                setOrders(localOrders);
                showMessage('warning', '⚠️ Используем кэшированные данные');
            } else {
                setError('Ошибка соединения');
                showMessage('error', '❌ Ошибка сети');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const getFilteredOrders = () => {
        if (viewMode === 'active') {
            return orders.filter(order =>
                order.status === 'pending' || order.status === 'processing'
            );
        }
        return orders;
    };

    const getStatusInfo = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return { class: 'status-completed', text: 'Завершено', icon: '✅' };
            case 'pending':
                return { class: 'status-pending', text: 'Ожидание', icon: '⏳' };
            case 'processing':
                return { class: 'status-processing', text: 'В работе', icon: '⚡' };
            case 'cancelled':
                return { class: 'status-cancelled', text: 'Отменено', icon: '❌' };
            default:
                return { class: 'status-pending', text: status || 'Неизвестно', icon: '❓' };
        }
    };

    const calculateTotal = (order) => {
        if (!order || !order.amount || !order.rate) return '—';
        if (order.type === 'buy') {
            return (order.amount / order.rate).toFixed(2) + ' USDT';
        } else {
            return (order.amount * order.rate).toFixed(2) + ' RUB';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        try {
            return new Date(dateString).toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return '—';
        }
    };

    const canOpenChat = (order) => {
        if (!order || !order.status) return false;
        return order.status === 'pending' || order.status === 'processing';
    };

    const openOrderChat = (order) => {
        if (!canOpenChat(order)) {
            showMessage('error', `❌ Чат недоступен для статуса "${order.status}"`);
            return;
        }

        if (!order.assignedTo && order.status === 'pending') {
            showMessage('warning', '⏳ Ожидайте, оператор скоро свяжется');
            return;
        }

        setActiveChat({ orderId: order.id });
    };

    const copyOrderId = (orderId) => {
        navigator.clipboard.writeText(orderId);
        showMessage('success', '✅ ID скопирован');
    };

    const getOrdersStats = () => {
        const activeOrders = orders.filter(order =>
            order.status === 'pending' || order.status === 'processing'
        );
        const completedOrders = orders.filter(order => order.status === 'completed');

        return {
            total: orders.length,
            active: activeOrders.length,
            completed: completedOrders.length
        };
    };

    const stats = getOrdersStats();
    const filteredOrders = getFilteredOrders();

    return (
        <div className="history-container">
            {/* Header */}
            <div className="history-header">
                <div className="header-top">
                    <h1 className="header-title">История операций</h1>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Всего</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.active}</div>
                        <div className="stat-label">Активных</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.completed}</div>
                        <div className="stat-label">Завершено</div>
                    </div>
                </div>

                <div className="view-switcher">
                    <button
                        className={`view-tab ${viewMode === 'active' ? 'active' : ''}`}
                        onClick={() => setViewMode('active')}
                    >
                        <span>🔥</span>
                        <span>Активные ({stats.active})</span>
                    </button>
                    <button
                        className={`view-tab ${viewMode === 'all' ? 'active' : ''}`}
                        onClick={() => setViewMode('all')}
                    >
                        <span>📋</span>
                        <span>Все ({stats.total})</span>
                    </button>
                </div>
            </div>

            {/* Orders Container */}
            <div className="orders-container">
                {isLoading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Загрузка истории...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📊</div>
                        <h3 className="empty-title">
                            {viewMode === 'active' ? 'Нет активных операций' : 'История пуста'}
                        </h3>
                        <p className="empty-subtitle">
                            {viewMode === 'active' 
                                ? 'Все операции завершены или отменены' 
                                : 'Совершите первую операцию обмена'
                            }
                        </p>
                        <button 
                            className="exchange-btn"
                            onClick={() => navigateTo('/')}
                        >
                            💰 Начать обмен
                        </button>
                    </div>
                ) : (
                    <div className="orders-list">
                        {filteredOrders.map((order) => {
                            const statusInfo = getStatusInfo(order.status);
                            const isBuy = order.type === 'buy';
                            const canChat = canOpenChat(order);
                            const hasNotifications = order.notifications && order.notifications.length > 0;
                            const unreadCount = hasNotifications ? 
                                order.notifications.filter(n => !n.read).length : 0;

                            return (
                                <div key={order.id} className="order-card">
                                    {hasNotifications && unreadCount > 0 && (
                                        <div className="chat-badge">{unreadCount}</div>
                                    )}

                                    <div className="order-header">
                                        <div className="order-id-wrapper">
                                            <div className="order-meta">
                                                <button 
                                                    className="order-id-badge"
                                                    onClick={() => copyOrderId(order.id)}
                                                    title="Копировать ID"
                                                >
                                                    <span className="order-hash">#</span>
                                                    <span className="order-number">{order.id}</span>
                                                    <span className="copy-icon">📋</span>
                                                </button>
                                                
                                                <div className="order-type-status">
                                                    <div className={`type-badge ${isBuy ? 'type-buy' : 'type-sell'}`}>
                                                        <span className="type-icon">{isBuy ? '🛒' : '💳'}</span>
                                                        <span className="type-text">{isBuy ? 'Покупка' : 'Продажа'}</span>
                                                    </div>
                                                    
                                                    <div className={`order-status-badge ${statusInfo.class}`}>
                                                        <span className="status-icon">{statusInfo.icon}</span>
                                                        <span className="status-text">{statusInfo.text}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="order-info-grid">
                                        <div className="info-card">
                                            <div className="info-label">Сумма</div>
                                            <div className="info-value large">{order.amount} {isBuy ? 'RUB' : 'USDT'}</div>
                                        </div>
                                        <div className="info-card">
                                            <div className="info-label">Курс</div>
                                            <div className="info-value highlight">{order.rate} ₽</div>
                                        </div>
                                        <div className="info-card">
                                            <div className="info-label">Итого</div>
                                            <div className="info-value large">{calculateTotal(order)}</div>
                                        </div>
                                        <div className="info-card">
                                            <div className="info-label">Создана</div>
                                            <div className="info-value">{formatDate(order.createdAt)}</div>
                                        </div>
                                    </div>

                                    <div className="action-bar">
                                        {canChat && (
                                            <button 
                                                className="chat-btn"
                                                onClick={() => openOrderChat(order)}
                                            >
                                                <span>💬 Чат с оператором</span>
                                                {hasNotifications && unreadCount > 0 && (
                                                    <span className="notification-count">+{unreadCount}</span>
                                                )}
                                            </button>
                                        )}
                                        <button 
                                            className="copy-btn"
                                            onClick={() => copyOrderId(order.id)}
                                        >
                                            📋 Копировать ID
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Message Toast */}
            {message.text && (
                <div className={`message-toast message-${message.type}`}>
                    <span>{message.text}</span>
                </div>
            )}

            {/* Support Chat */}
            {activeChat && (
                <div className="chat-modal-overlay">
                    <div className="chat-modal">
                        <SupportChat
                            orderId={activeChat.orderId}
                            onClose={() => setActiveChat(null)}
                        />
                    </div>
                </div>
            )}

            {/* Bottom Navigation */}
            <div className="bottom-nav">
                <button className="nav-item" onClick={() => navigateTo('/')}>
                    <span className="nav-icon">💸</span>
                    <span className="nav-label">Обмен</span>
                </button>
                <button className="nav-item active">
                    <span className="nav-icon">📊</span>
                    <span className="nav-label">История</span>
                </button>
                <button className="nav-item" onClick={() => navigateTo('/profile')}>
                    <span className="nav-icon">👤</span>
                    <span className="nav-label">Профиль</span>
                </button>
                <button className="nav-item" onClick={() => navigateTo('/help')}>
                    <span className="nav-icon">❓</span>
                    <span className="nav-label">Помощь</span>
                </button>
            </div>
        </div>
    );
}

export default History;