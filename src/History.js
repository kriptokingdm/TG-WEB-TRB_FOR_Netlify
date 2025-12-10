import { useState, useEffect, useRef } from 'react';
import './History.css';
import SupportChat from './SupportChat';

// В начало Home.js после API_URL
const API_URL = 'https://87.242.106.114';
const fetchWithSSLIgnore = async (url, options = {}) => {
    // Для браузера: добавляем mode 'no-cors' или просто пробуем
    const newOptions = {
        ...options,
        mode: 'cors',
        credentials: 'omit'
    };
    
    try {
        return await fetch(url, newOptions);
    } catch (sslError) {
        console.log('⚠️ SSL ошибка, пробуем альтернативный метод...');
        
        // Если на HTTPS сайте, пробуем HTTP (только для локального тестирования)
        if (window.location.protocol === 'https:' && url.startsWith('https://')) {
            const httpUrl = url.replace('https://', 'http://');
            console.log('🔄 Пробуем HTTP:', httpUrl);
            return await fetch(httpUrl, options);
        }
        
        throw sslError;
    }
};

// Простая функция fetch
const simpleFetch = async (endpoint, data = null) => {
    const url = API_URL + endpoint;
    console.log('🔗 Запрос к:', url);
    
    try {
        const options = {
            method: data ? 'POST' : 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetchWithSSLIgnore(url, options);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Ответ:', result);
        return result;
        
    } catch (error) {
        console.error('❌ Ошибка запроса:', error.message);
        
        // Фолбэк для курсов
        if (endpoint === '/exchange-rate') {
            return { 
                success: true, 
                data: { buy: 92.5, sell: 93.5 } 
            };
        }
        
        // Фолбэк для создания ордера
        if (endpoint === '/create-order') {
            const orderId = 'LOCAL_' + Date.now();
            return {
                success: true,
                message: 'Ордер создан (офлайн режим)',
                order: {
                    id: orderId,
                    type: data?.type || 'buy',
                    amount: data?.amount || 0,
                    rate: 92.5,
                    status: 'pending'
                }
            };
        }
        
        return { success: false, error: error.message };
    }
};

function History({ navigateTo }) {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeChat, setActiveChat] = useState(null);
    const [viewMode, setViewMode] = useState('active');
    const [message, setMessage] = useState({ type: '', text: '' });
    
    // Refs для предотвращения бесконечного цикла
    const isInitialMount = useRef(true);
    const refreshIntervalRef = useRef(null);
    const lastUpdateRef = useRef(null);

    // Основная функция загрузки ордеров
    const fetchUserOrders = async () => {
        // Предотвращаем слишком частые запросы
        const now = Date.now();
        if (lastUpdateRef.current && (now - lastUpdateRef.current < 5000)) {
            console.log('⏳ Слишком частый запрос, пропускаем');
            return;
        }
        
        lastUpdateRef.current = now;
        
        try {
            setIsLoading(true);
            
            // Получаем пользователя из localStorage
            const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const telegramUser = JSON.parse(localStorage.getItem('telegramUser') || '{}');
            
            console.log('👤 Текущий пользователь:', userData);
            
            // Если нет user.id, пробуем использовать telegramUser.id
            let userId = userData.id;
            if (!userId && telegramUser.id) {
                userId = `user_${telegramUser.id}`;
                console.log('📝 Используем telegram ID для user_id:', userId);
            }
            
            if (!userId) {
                console.log('⚠️ Пользователь не найден в localStorage');
                // Используем тестового пользователя
                userId = 'user_7879866656';
                console.log('📝 Используем тестового пользователя:', userId);
            }

            console.log('🔍 Запрашиваем ордера для:', userId);
            
            // Делаем запрос к API
            const result = await simpleFetch(`/user-orders/${userId}`);
            
            if (result.success) {
                // Обрабатываем данные
                let ordersData = result.orders || [];
                
                console.log(`📊 Получено ордеров: ${ordersData.length}`);
                
                // Сортируем по дате (новые сверху)
                const sortedOrders = ordersData.sort((a, b) => {
                    const dateA = new Date(a.created_at || a.createdAt || Date.now());
                    const dateB = new Date(b.created_at || b.createdAt || Date.now());
                    return dateB - dateA;
                });
                
                setOrders(sortedOrders);
                setError('');
                
                // Сохраняем в localStorage для офлайн режима
                localStorage.setItem('userOrders', JSON.stringify(sortedOrders));
                
                if (isInitialMount.current) {
                    if (sortedOrders.length > 0) {
                        showMessage('success', '✅ История загружена');
                    } else {
                        showMessage('info', '📭 История пуста');
                    }
                    isInitialMount.current = false;
                }
                
            } else {
                throw new Error(result.error || 'Ошибка сервера');
            }
            
        } catch (error) {
            console.error('❌ Ошибка загрузки:', error);
            
            // Пробуем загрузить из localStorage
            try {
                const localOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
                if (localOrders.length > 0) {
                    console.log('📂 Используем локальные данные:', localOrders.length);
                    setOrders(localOrders);
                    setError('⚠️ Используем кэшированные данные');
                    showMessage('warning', '⚠️ Используем сохраненные данные');
                } else {
                    setError('Не удалось загрузить историю');
                    showMessage('error', '❌ Ошибка загрузки');
                }
            } catch (localError) {
                console.error('❌ Ошибка загрузки локальных данных:', localError);
                setError('Ошибка соединения с сервером');
                showMessage('error', '❌ Ошибка сети');
            }
            
        } finally {
            setIsLoading(false);
        }
    };

    // Инициализация при загрузке компонента
    useEffect(() => {
        console.log('🚀 History компонент загружен');
        fetchUserOrders();
            
        // Обновляем каждые 30 секунд если есть активные ордера
        refreshIntervalRef.current = setInterval(() => {
            const hasActiveOrders = orders.some(order => 
                order.status === 'pending' || order.status === 'processing'
            );
            if (hasActiveOrders) {
                console.log('🔄 Периодическое обновление активных ордеров');
                fetchUserOrders();
            }
        }, 30000); // 30 секунд

        return () => {
            console.log('🧹 Очистка History компонента');
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, []); // Пустой массив зависимостей - только при монтировании

    // Тест подключения
    const testConnection = async () => {
        try {
            showMessage('info', '🔄 Тестируем подключение...');
            
            const response = await fetch(`${API_URL}/health`);
            if (response.ok) {
                const data = await response.json();
                showMessage('success', `✅ API работает! Статус: ${data.status}`);
            } else {
                showMessage('error', `❌ HTTP ${response.status}`);
            }
        } catch (error) {
            showMessage('error', `❌ Ошибка сети: ${error.message}`);
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
            case 'success':
                return { class: 'status-completed', text: 'Завершено', icon: '✅' };
            case 'pending':
                return { class: 'status-pending', text: 'Ожидание', icon: '⏳' };
            case 'processing':
                return { class: 'status-processing', text: 'В работе', icon: '⚡' };
            case 'cancelled':
            case 'failed':
                return { class: 'status-cancelled', text: 'Отменено', icon: '❌' };
            default:
                return { class: 'status-pending', text: status || 'Неизвестно', icon: '❓' };
        }
    };

    const calculateTotal = (order) => {
        if (!order || !order.amount || !order.rate) return '—';
        
        // Определяем тип операции
        const isBuy = order.type === 'buy' || order.operation_type === 'buy';
        
        if (isBuy) {
            return (order.amount / order.rate).toFixed(2) + ' USDT';
        } else {
            return (order.amount * order.rate).toFixed(2) + ' RUB';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '—';
            
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            console.log('Ошибка форматирования даты:', e);
            return '—';
        }
    };

    const copyOrderId = (orderId) => {
        navigator.clipboard.writeText(orderId);
        showMessage('success', '✅ ID скопирован');
    };

    const getOrdersStats = () => {
        const activeOrders = orders.filter(order =>
            order.status === 'pending' || order.status === 'processing'
        );
        const completedOrders = orders.filter(order => 
            order.status === 'completed' || order.status === 'success'
        );

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
            {/* Хедер */}
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
                            <p className="header-subtitle">Все ваши транзакции</p>
                        </div>
                    </div>
                    
                    {/* Кнопка теста подключения */}
                    <button 
                        className="test-connection-btn"
                        onClick={testConnection}
                        title="Тест подключения к серверу"
                    >
                        🌐
                    </button>
                </div>

                {/* Статистика */}
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
                    
                    {/* Кнопка обновления */}
                    <button
                        className="refresh-btn"
                        onClick={fetchUserOrders}
                        disabled={isLoading}
                        title="Обновить историю"
                    >
                        <span className="refresh-icon">🔄</span>
                        <span className="refresh-text">{isLoading ? 'Обновление...' : 'Обновить'}</span>
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
                        
                        {/* Информация об ошибке */}
                        {error && (
                            <div className="connection-error-info">
                                <p className="error-title">⚠️ {error}</p>
                                <p className="error-message">Попробуйте обновить страницу</p>
                            </div>
                        )}
                        
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
                        {filteredOrders.map((order, index) => {
                            const statusInfo = getStatusInfo(order.status);
                            const isBuy = order.type === 'buy' || order.operation_type === 'buy';

                            return (
                                <div key={order.id || index} className="order-card-new">
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
                                                #{order.id ? order.id.slice(0, 8) : 'N/A'}...
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
                                                {formatDate(order.created_at || order.createdAt)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="order-actions">
                                        <button 
                                            className="copy-btn-new"
                                            onClick={() => copyOrderId(order.id)}
                                        >
                                            <span className="copy-icon-new">📋</span>
                                            <span>Копировать ID</span>
                                        </button>
                                        
                                        {/* Кнопка чата для активных ордеров */}
                                        {(order.status === 'pending' || order.status === 'processing') && (
                                            <button 
                                                className="chat-btn-new"
                                                onClick={() => setActiveChat({ orderId: order.id })}
                                            >
                                                <span className="chat-icon-new">💬</span>
                                                <span>Чат с оператором</span>
                                            </button>
                                        )}
                                        
                                        {/* Информация об операторе если есть */}
                                        {order.assigned_name && (
                                            <div className="operator-info">
                                                <span className="operator-label">Оператор:</span>
                                                <span className="operator-name">{order.assigned_name}</span>
                                            </div>
                                        )}
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