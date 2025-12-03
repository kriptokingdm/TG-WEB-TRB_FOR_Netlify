import { useState, useEffect } from 'react';
import './History.css';
import SupportChat from './SupportChat';

function History({ navigateTo }) {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeChat, setActiveChat] = useState(null);
    const [viewMode, setViewMode] = useState('active');

    // Используем тот же serverUrl что и в Home.js
    const serverUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:8080' 
        : 'https://87.242.106.114:8080';

    useEffect(() => {
        fetchUserOrders();
    }, []);

    const fetchUserOrders = async () => {
        try {
            console.log('🔄 Начинаем загрузку истории...');

            const userData = JSON.parse(localStorage.getItem('currentUser'));
            console.log('👤 Данные пользователя:', userData);

            if (!userData || !userData.id) {
                setError('Не авторизован');
                setIsLoading(false);
                return;
            }

            const userId = userData.id;
            console.log('🆔 User ID:', userId);

            // Исправленный URL
            const response = await fetch(`${serverUrl}/api/user-orders/${userId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            console.log('📡 Ответ сервера:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('📦 Данные с сервера:', data);

                // Обрабатываем разные форматы ответа
                let ordersData = [];
                if (Array.isArray(data.orders)) {
                    ordersData = data.orders;
                } else if (data.orders && typeof data.orders === 'object') {
                    ordersData = Object.values(data.orders);
                } else if (Array.isArray(data)) {
                    ordersData = data;
                }

                const sortedOrders = ordersData.sort((a, b) => {
                    const dateA = new Date(a.createdAt || a.created_at || a.timestamp || Date.now());
                    const dateB = new Date(b.createdAt || b.created_at || b.timestamp || Date.now());
                    return dateB - dateA;
                });
                
                console.log('✅ Отсортированные ордера:', sortedOrders);
                setOrders(sortedOrders);
                setError('');
            } else {
                console.error('❌ Ошибка сервера:', response.status);
                const errorText = await response.text();
                console.error('❌ Текст ошибки:', errorText);
                setError(`Ошибка сервера: ${response.status}`);
                
                // Тестовые данные на случай ошибки
                const testOrders = getTestOrders();
                setOrders(testOrders);
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки истории:', error);
            setError('Ошибка соединения с сервером');

            // Тестовые данные на случай ошибки
            const testOrders = getTestOrders();
            setOrders(testOrders);
        } finally {
            setIsLoading(false);
        }
    };

    const getTestOrders = () => {
        return [
            {
                id: 'TEST001',
                type: 'buy',
                amount: 5000,
                rate: 92.5,
                status: 'completed',
                createdAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
                cryptoAddress: {
                    network: 'TRC20',
                    address: 'TEst12345678901234567890'
                }
            },
            {
                id: 'TEST002',
                type: 'sell',
                amount: 100,
                rate: 87.5,
                status: 'pending',
                createdAt: new Date(Date.now() - 3600000).toISOString(),
                paymentMethod: {
                    name: 'Сбербанк',
                    number: '1234'
                }
            },
            {
                id: 'TEST003',
                type: 'buy',
                amount: 10000,
                rate: 91.2,
                status: 'processing',
                createdAt: new Date(Date.now() - 7200000).toISOString(),
                cryptoAddress: {
                    network: 'ERC20',
                    address: '0xABC1234567890123456789012345678901234567'
                }
            }
        ];
    };

    const getFilteredOrders = () => {
        if (viewMode === 'active') {
            return orders.filter(order =>
                order.status === 'pending' || order.status === 'paid' || order.status === 'processing'
            );
        }
        return orders;
    };

    const getStatusInfo = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return { class: 'status-completed', text: 'Завершено', icon: '✅' };
            case 'paid':
                return { class: 'status-paid', text: 'Оплачено', icon: '💰' };
            case 'pending':
                return { class: 'status-pending', text: 'Ожидание', icon: '⏳' };
            case 'processing':
                return { class: 'status-processing', text: 'В обработке', icon: '⚡' };
            case 'cancelled':
                return { class: 'status-cancelled', text: 'Отменено', icon: '❌' };
            case 'failed':
                return { class: 'status-cancelled', text: 'Ошибка', icon: '❌' };
            default:
                return { class: 'status-pending', text: status || 'Неизвестно', icon: '❓' };
        }
    };

    const calculateTotal = (order) => {
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

    const getNetworkIcon = (network) => {
        const icons = {
            'ERC20': '⛓️',
            'TRC20': '⚡',
            'TON': '💎',
            'SOL': '🔥',
            'BEP20': '🟡'
        };
        return icons[network] || '🔗';
    };

    const canOpenChat = (order) => {
        const canChat = order.status === 'pending' || order.status === 'paid' || order.status === 'processing';
        return canChat;
    };

    const openOrderChat = (order) => {
        if (!canOpenChat(order)) {
            alert(`❌ Чат недоступен для заявок со статусом "${order.status}"`);
            return;
        }

        const exchangeData = {
            type: order.type,
            amount: order.amount,
            rate: order.rate,
            convertedAmount: calculateTotal(order)
        };

        setActiveChat({
            orderId: order.id,
            exchangeData: exchangeData
        });

        console.log('🎯 Чат установлен для заявки:', order.id);
    };

    const closeChat = () => {
        setActiveChat(null);
    };

    const copyOrderId = (orderId) => {
        navigator.clipboard.writeText(orderId);
        alert('✅ ID заявки скопирован!');
    };

    const getOrdersStats = () => {
        const activeOrders = orders.filter(order =>
            order.status === 'pending' || order.status === 'paid' || order.status === 'processing'
        );
        const completedOrders = orders.filter(order => order.status === 'completed');

        return {
            total: orders.length,
            active: activeOrders.length,
            completed: completedOrders.length
        };
    };

    const retryFetchOrders = () => {
        setIsLoading(true);
        setError('');
        fetchUserOrders();
    };

    const stats = getOrdersStats();
    const filteredOrders = getFilteredOrders();

    return (
        <div className="home-container">
            <div className="page-header">
                <h1>История операций</h1>
            </div>

            <div className="history-content">
                {isLoading ? (
                    <div className="loading-state">
                        <div className="loading-icon">💫</div>
                        <p>Загрузка истории...</p>
                        <button
                            className="retry-button"
                            onClick={retryFetchOrders}
                            style={{ marginTop: '10px' }}
                        >
                            🔄 Обновить
                        </button>
                    </div>
                ) : error ? (
                    <div className="no-history-message">
                        <div className="no-history-icon">⚠️</div>
                        <p>Ошибка загрузки</p>
                        <p className="history-subtext">{error}</p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button
                                className="retry-button"
                                onClick={retryFetchOrders}
                            >
                                🔄 Повторить
                            </button>
                            <button
                                className="home-button"
                                onClick={() => navigateTo('home')}
                            >
                                🏠 На главную
                            </button>
                        </div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="no-history-message">
                        <div className="no-history-icon">📊</div>
                        <p>История операций пуста</p>
                        <p className="history-subtext">Совершите первую операцию обмена</p>
                        <button
                            className="start-exchange-button"
                            onClick={() => navigateTo('home')}
                        >
                            💰 Начать обмен
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="history-header">
                            <h2 style={{ margin: 0, fontSize: '18px' }}>Мои операции</h2>
                            <div className="history-stats">
                                <div className="stat-badge">
                                    Всего: {stats.total}
                                </div>
                                <div className="stat-badge active-badge">
                                    Активных: {stats.active}
                                </div>
                            </div>
                        </div>

                        <div className="view-mode-switcher">
                            <button
                                className={`view-mode-button ${viewMode === 'active' ? 'active' : ''}`}
                                onClick={() => setViewMode('active')}
                            >
                                🔥 Активные ({stats.active})
                            </button>
                            <button
                                className={`view-mode-button ${viewMode === 'all' ? 'active' : ''}`}
                                onClick={() => setViewMode('all')}
                            >
                                📋 Все операции ({stats.total})
                            </button>
                        </div>

                        <div className="orders-list">
                            {filteredOrders.length === 0 ? (
                                <div className="no-orders-message">
                                    <div className="no-orders-icon">🔍</div>
                                    <p>
                                        {viewMode === 'active'
                                            ? 'Нет активных операций'
                                            : 'Операции не найдены'
                                        }
                                    </p>
                                    <p className="no-orders-subtext">
                                        {viewMode === 'active'
                                            ? 'Все операции завершены или отменены'
                                            : 'Попробуйте изменить фильтр'
                                        }
                                    </p>
                                    <button
                                        className="show-all-button"
                                        onClick={() => setViewMode('all')}
                                    >
                                        📋 Показать все
                                    </button>
                                </div>
                            ) : (
                                filteredOrders.map((order) => {
                                    const statusInfo = getStatusInfo(order.status);
                                    const isBuy = order.type === 'buy';
                                    const canChat = canOpenChat(order);
                                    const isActive = order.status === 'pending' || order.status === 'paid' || order.status === 'processing';

                                    return (
                                        <div key={order.id || Math.random()} className={`order-item ${isActive ? 'active-order' : ''}`}>
                                            {isActive && (
                                                <div className="active-order-badge">🔥 Активно</div>
                                            )}

                                            <div className="order-header">
                                                <div className="order-id" onClick={() => copyOrderId(order.id)} title="Копировать ID">
                                                    #{order.id}
                                                </div>
                                                <div className={`order-status ${statusInfo.class}`}>
                                                    {statusInfo.icon} {statusInfo.text}
                                                </div>
                                            </div>

                                            <div className="order-main">
                                                <div className="order-type-amount">
                                                    <div className="order-type">
                                                        <span className={isBuy ? 'buy-icon' : 'sell-icon'}>
                                                            {isBuy ? 'B' : 'S'}
                                                        </span>
                                                        {isBuy ? 'Покупка USDT' : 'Продажа USDT'}
                                                    </div>
                                                    <div className="order-amount">
                                                        {order.amount} {isBuy ? 'RUB' : 'USDT'}
                                                    </div>
                                                </div>

                                                <div className="order-conversion">
                                                    <div className="order-rate">
                                                        Курс: {order.rate} RUB
                                                    </div>
                                                    <div className="order-total">
                                                        → {calculateTotal(order)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="order-details">
                                                <div className="detail-item">
                                                    <div className="detail-label">Сеть/Банк</div>
                                                    <div className="detail-value">
                                                        {order.cryptoAddress ? (
                                                            <>
                                                                {getNetworkIcon(order.cryptoAddress.network)} {order.cryptoAddress.network}
                                                            </>
                                                        ) : order.paymentMethod ? (
                                                            order.paymentMethod.type === 'sbp' ?
                                                                `📱 СБП: ${order.paymentMethod.number}` :
                                                                `💳 ${order.paymentMethod.name || 'Банковская карта'} •••• ${order.paymentMethod.number || ''}`
                                                        ) : (
                                                            '—'
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="detail-item">
                                                    <div className="detail-label">Создана</div>
                                                    <div className="detail-value">
                                                        {formatDate(order.createdAt)}
                                                    </div>
                                                </div>
                                            </div>

                                            {(order.completedAt || order.cancelledAt) && (
                                                <div className="order-details">
                                                    <div className="detail-item">
                                                        <div className="detail-label">
                                                            {order.completedAt ? 'Завершена' : 'Отменена'}
                                                        </div>
                                                        <div className="detail-value">
                                                            {order.completedAt ? formatDate(order.completedAt) : formatDate(order.cancelledAt)}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="order-footer">
                                                <div className="order-date-mobile">
                                                    {formatDate(order.createdAt)}
                                                </div>
                                                <div className="order-actions">
                                                    <button
                                                        className="action-button copy-button"
                                                        onClick={() => copyOrderId(order.id)}
                                                        title="Копировать ID"
                                                    >
                                                        📋 ID
                                                    </button>

                                                    {canChat && (
                                                        <button
                                                            className="action-button chat-button"
                                                            onClick={() => openOrderChat(order)}
                                                        >
                                                            💬 Чат поддержки
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}
            </div>

            {activeChat && (
                <SupportChat
                    orderId={activeChat.orderId}
                    onClose={closeChat}
                    exchangeData={activeChat.exchangeData}
                />
            )}

            <div className="bottom-nav">
                <button className="nav-button" onClick={() => navigateTo('home')}>
                    <span>🏠</span>
                    <span>Обмен</span>
                </button>

                <button className="nav-button" onClick={() => navigateTo('profile')}>
                    <span>👤</span>
                    <span>Профиль</span>
                </button>

                <button className="nav-button active">
                    <span>📊</span>
                    <span>История</span>
                </button>

                <button className="nav-button" onClick={() => navigateTo('help')}>
                    <span>❓</span>
                    <span>Справка</span>
                </button>
            </div>
        </div>
    );
}

export default History;