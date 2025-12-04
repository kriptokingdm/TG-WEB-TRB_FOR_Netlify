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
            {/* Новый хедер */}
            <div className="history-header-new">
                <div className="header-content">
                    <div className="header-left">
                        <button 
                            className="back-button"
                            onClick={() => navigateTo('/')}
                        >
                            ←
                        </button>
                        <div className="header-titles">
                            <h1 className="header-title-new">История операций</h1>
                            <p className="header-subtitle">Все ваши транзакции и обмены</p>
                        </div>
                    </div>
                    
                    <div className="header-right">
                        <button 
                            className="refresh-button"
                            onClick={fetchUserOrders}
                            disabled={isLoading}
                        >
                            {isLoading ? '🔄' : '🔄'}
                        </button>
                    </div>
                </div>

                {/* Статистика в виде карточек */}
                <div className="stats-cards">
                    <div className="stat-card-new">
                        <div className="stat-icon-container">
                            <div className="stat-icon">📊</div>
                        </div>
                        <div className="stat-content">
                            <div className="stat-value-new">{stats.total}</div>
                            <div className="stat-label-new">Всего</div>
                        </div>
                    </div>
                    
                    <div className="stat-card-new">
                        <div className="stat-icon-container">
                            <div className="stat-icon">🔥</div>
                        </div>
                        <div className="stat-content">
                            <div className="stat-value-new">{stats.active}</div>
                            <div className="stat-label-new">Активные</div>
                        </div>
                    </div>
                    
                    <div className="stat-card-new">
                        <div className="stat-icon-container">
                            <div className="stat-icon">✅</div>
                        </div>
                        <div className="stat-content">
                            <div className="stat-value-new">{stats.completed}</div>
                            <div className="stat-label-new">Завершено</div>
                        </div>
                    </div>
                </div>

                {/* Переключатель вью */}
                <div className="view-tabs">
                    <button
                        className={`view-tab-new ${viewMode === 'active' ? 'active' : ''}`}
                        onClick={() => setViewMode('active')}
                    >
                        <span className="tab-icon">🔥</span>
                        <span className="tab-text">Активные</span>
                        {stats.active > 0 && (
                            <span className="tab-badge">{stats.active}</span>
                        )}
                    </button>
                    <button
                        className={`view-tab-new ${viewMode === 'all' ? 'active' : ''}`}
                        onClick={() => setViewMode('all')}
                    >
                        <span className="tab-icon">📋</span>
                        <span className="tab-text">Все</span>
                        {stats.total > 0 && (
                            <span className="tab-badge">{stats.total}</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Контейнер ордеров */}
            <div className="orders-container-new">
                {isLoading ? (
                    <div className="loading-container-new">
                        <div className="loading-spinner-new"></div>
                        <p className="loading-text">Загрузка истории...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="empty-state-new">
                        <div className="empty-icon-container">
                            <div className="empty-icon">📊</div>
                        </div>
                        <h3 className="empty-title-new">
                            {viewMode === 'active' ? 'Нет активных операций' : 'История пуста'}
                        </h3>
                        <p className="empty-subtitle-new">
                            {viewMode === 'active' 
                                ? 'Все операции завершены или отменены' 
                                : 'Совершите первую операцию обмена'
                            }
                        </p>
                        <button 
                            className="exchange-btn-new"
                            onClick={() => navigateTo('/')}
                        >
                            <span className="exchange-icon">💰</span>
                            <span>Начать обмен</span>
                        </button>
                    </div>
                ) : (
                    <div className="orders-list-new">
                        {filteredOrders.map((order) => {
                            const statusInfo = getStatusInfo(order.status);
                            const isBuy = order.type === 'buy';
                            const canChat = canOpenChat(order);
                            const hasNotifications = order.notifications && order.notifications.length > 0;
                            const unreadCount = hasNotifications ? 
                                order.notifications.filter(n => !n.read).length : 0;

                            return (
                                <div key={order.id} className="order-card-new">
                                    <div className="order-card-header">
                                        <div className="order-header-left">
                                            <div className="order-type-badge-new">
                                                <span className="type-icon-new">
                                                    {isBuy ? '🛒' : '💰'}
                                                </span>
                                                <span className="type-text-new">
                                                    {isBuy ? 'Покупка' : 'Продажа'}
                                                </span>
                                            </div>
                                            <button 
                                                className="order-id-new"
                                                onClick={() => copyOrderId(order.id)}
                                                title="Копировать ID"
                                            >
                                                #{order.id.slice(0, 8)}...
                                            </button>
                                        </div>
                                        <div className={`order-status-new ${statusInfo.class}`}>
                                            <span className="status-icon-new">{statusInfo.icon}</span>
                                            <span className="status-text-new">{statusInfo.text}</span>
                                        </div>
                                    </div>

                                    <div className="order-details-grid">
                                        <div className="order-detail">
                                            <span className="detail-label">Сумма</span>
                                            <span className="detail-value">
                                                {order.amount} {isBuy ? 'RUB' : 'USDT'}
                                            </span>
                                        </div>
                                        <div className="order-detail">
                                            <span className="detail-label">Курс</span>
                                            <span className="detail-value highlight">
                                                {order.rate} ₽
                                            </span>
                                        </div>
                                        <div className="order-detail">
                                            <span className="detail-label">Итого</span>
                                            <span className="detail-value total">
                                                {calculateTotal(order)}
                                            </span>
                                        </div>
                                        <div className="order-detail">
                                            <span className="detail-label">Дата</span>
                                            <span className="detail-value date">
                                                {formatDate(order.createdAt)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="order-actions">
                                        <button 
                                            className={`chat-btn-new ${!canChat ? 'disabled' : ''}`}
                                            onClick={() => openOrderChat(order)}
                                            disabled={!canChat}
                                        >
                                            <span className="chat-icon">💬</span>
                                            <span>Чат с оператором</span>
                                            {hasNotifications && unreadCount > 0 && (
                                                <span className="notification-badge">{unreadCount}</span>
                                            )}
                                        </button>
                                        <button 
                                            className="copy-btn-new"
                                            onClick={() => copyOrderId(order.id)}
                                        >
                                            <span className="copy-icon-new">📋</span>
                                            <span>Копировать ID</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Toast сообщения */}
            {message.text && (
                <div className={`message-toast-new message-${message.type}`}>
                    <span className="toast-icon">
                        {message.type === 'success' ? '✅' : 
                         message.type === 'error' ? '❌' : '⚠️'}
                    </span>
                    <span className="toast-text">{message.text}</span>
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

            {/* Навигация */}
            <div className="bottom-nav">
                <button className="nav-item" onClick={() => navigateTo('/')}>
                    <span className="nav-icon">💸</span>
                    <span className="nav-label">Обмен</span>
                </button>
                
                <button className="nav-item" onClick={() => navigateTo('/profile')}>
                    <span className="nav-icon">👤</span>
                    <span className="nav-label">Профиль</span>
                </button>

                <button className="nav-item active">
                    <span className="nav-icon">📊</span>
                    <span className="nav-label">История</span>
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