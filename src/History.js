import { useState, useEffect, useRef } from 'react';
import './History.css';
import SupportChat from './SupportChat';
import { getThemeColors } from './themeUtils';
import { API_BASE_URL } from './config';

// SVG иконки
const LoadingSVG = ({ color = '#3390ec' }) => (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path opacity="0.2" d="M28 10C30.3638 10 32.7044 10.4656 34.8883 11.3702C37.0722 12.2748 39.0565 13.6006 40.7279 15.2721C42.3994 16.9435 43.7252 18.9278 44.6298 21.1117C45.5344 23.2956 46 25.6362 46 28C46 30.3638 45.5344 32.7044 44.6298 34.8883C43.7252 37.0722 42.3994 39.0565 40.7279 40.7279C39.0565 42.3994 37.0722 43.7252 34.8883 44.6298C32.7044 45.5344 30.3638 46 28 46C25.6362 46 23.2956 45.5344 21.1117 44.6298C18.9278 43.7252 16.9435 42.3994 15.2721 40.7279C13.6006 39.0565 12.2747 37.0722 11.3702 34.8883C10.4656 32.7044 10 30.3638 10 28C10 25.6362 10.4656 23.2955 11.3702 21.1117C12.2748 18.9278 13.6006 16.9435 15.2721 15.2721C16.9435 13.6006 18.9278 12.2747 21.1117 11.3702C23.2956 10.4656 25.6362 10 28 10L28 10Z" 
          stroke={color} strokeOpacity="0.1" strokeWidth="4" strokeLinecap="round" />
        <path d="M28 10C31.1288 10 34.2036 10.8156 36.9211 12.3662C39.6386 13.9169 41.9049 16.1492 43.4967 18.8429C45.0884 21.5365 45.9505 24.5986 45.9979 27.727C46.0454 30.8555 45.2765 33.9423 43.7672 36.683C42.258 39.4237 40.0603 41.7236 37.3911 43.356C34.7219 44.9884 31.6733 45.8968 28.5459 45.9917C25.4185 46.0866 22.3204 45.3647 19.5571 43.8971C16.7939 42.4296 14.4608 40.2671 12.7882 37.6229" 
          stroke={color} strokeWidth="4" strokeLinecap="round" />
    </svg>
);

const CompletedSVG = () => (
    <svg width="40" height="40" viewBox="0 0 119 119" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M59.115 21C80.1507 21 97.2301 38.0793 97.2301 59.115C97.2301 80.1507 80.1507 97.2301 59.115 97.2301C38.0793 97.2301 21 80.1507 21 59.115C21 38.0793 38.0793 21 59.115 21Z" fill="#54E6B6" />
        <path d="M59.1152 10.5C85.9498 10.5001 107.73 32.2806 107.73 59.1152C107.73 85.9498 85.9498 107.73 59.1152 107.73C32.2806 107.73 10.5001 85.9498 10.5 59.1152C10.5 32.2806 32.2806 10.5 59.1152 10.5Z" stroke="url(#paint0_linear_3536_6228)" strokeOpacity="0.13" strokeWidth="21" />
        <path d="M43.1182 57.4913L54.0427 68.4158L73.7773 48.6812" stroke="white" strokeWidth="8.45769" strokeLinecap="round" />
        <defs>
            <linearGradient id="paint0_linear_3536_6228" x1="59.115" y1="21" x2="-89" y2="130.5" gradientUnits="userSpaceOnUse">
                <stop stopColor="#46E66D" />    
                <stop offset="1" stopColor="#46E66D" stopOpacity="0" />
            </linearGradient>
        </defs>
    </svg>
);

const CancelledSVG = () => (
    <svg width="40" height="40" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 10C43.2548 10 54 20.7452 54 34C54 47.2548 43.2548 58 30 58C16.7452 58 6 47.2548 6 34C6 20.7452 16.7452 10 30 10Z" fill="#FF3B30" />
        <path d="M39.5 24.5L20.5 43.5" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <path d="M20.5 24.5L39.5 43.5" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
);

const EmptySVG = () => {
  const themeColors = getThemeColors();
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 10C43.2548 10 54 20.7452 54 34C54 47.2548 43.2548 58 30 58C16.7452 58 6 47.2548 6 34C6 20.7452 16.7452 10 30 10Z" fill={themeColors.secondaryBgColor} />
        <path d="M25 25L35 35" stroke={themeColors.hintColor} strokeWidth="2" strokeLinecap="round" />
        <path d="M35 25L25 35" stroke={themeColors.hintColor} strokeWidth="2" strokeLinecap="round" />
        <path d="M30 22C28.8954 22 28 22.8954 28 24" stroke={themeColors.hintColor} strokeWidth="2" strokeLinecap="round" />
        <path d="M32 38C30.8954 38 30 38.8954 30 40" stroke={themeColors.hintColor} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

// Утилитные функции
const getStatusText = (status) => {
    const statusMap = {
        'pending': 'Ожидание',
        'processing': 'В обработке',
        'accepted': 'Принят',
        'rejected': 'Отклонен',
        'completed': 'Завершен',
        'success': 'Завершено',
        'cancelled': 'Отменено',
        'failed': 'Ошибка'
    };
    return statusMap[status?.toLowerCase()] || status || 'Неизвестно';
};

const getStatusClass = (status) => {
    const statusMap = {
        'pending': 'status-pending',
        'processing': 'status-processing',
        'accepted': 'status-accepted',
        'rejected': 'status-rejected',
        'completed': 'status-completed',
        'success': 'status-completed',
        'cancelled': 'status-cancelled',
        'failed': 'status-cancelled'
    };
    return statusMap[status?.toLowerCase()] || 'status-pending';
};

const getStatusIcon = (status) => {
    const statusMap = {
        'pending': '🟡',
        'processing': '🟠',
        'accepted': '✅',
        'rejected': '❌',
        'completed': '🏁',
        'success': '🏁',
        'cancelled': '❌',
        'failed': '❌'
    };
    return statusMap[status?.toLowerCase()] || '❓';
};

function History({ navigateTo }) {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeChat, setActiveChat] = useState(null);
    const [viewMode, setViewMode] = useState('active');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [refreshing, setRefreshing] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [themeColors, setThemeColors] = useState(getThemeColors());

    const isInitialMount = useRef(true);
    const refreshIntervalRef = useRef(null);
    const lastUpdateRef = useRef(0);

    // Обновление темы при изменении
    useEffect(() => {
        const handleThemeUpdate = () => {
            console.log('🔄 Обновление темы в History');
            setThemeColors(getThemeColors());
        };

        window.addEventListener('themeUpdated', handleThemeUpdate);
        
        return () => {
            window.removeEventListener('themeUpdated', handleThemeUpdate);
        };
    }, []);

    // Показать сообщение
    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    // Получение ID пользователя
    const getUserId = () => {
        try {
            let userId = null;

            if (window.Telegram?.WebApp) {
                const tg = window.Telegram.WebApp;
                const tgUser = tg.initDataUnsafe?.user;
                if (tgUser?.id) {
                    userId = tgUser.id.toString();
                }
            }

            if (!userId) {
                const savedUser = localStorage.getItem('currentUser');
                if (savedUser) {
                    const parsed = JSON.parse(savedUser);
                    userId = (parsed.id || parsed.telegramId)?.toString();
                }
            }

            if (userId) {
                userId = userId.replace(/^user_/, '');
                return 'user_' + userId;
            }

            return 'user_7879866656';

        } catch (error) {
            console.error('❌ Ошибка получения ID:', error);
            return 'user_7879866656';
        }
    };

    // Основная функция загрузки ордеров
    const fetchUserOrders = async (showLoading = true) => {
        const now = Date.now();

        if (lastUpdateRef.current && (now - lastUpdateRef.current < 3000)) {
            if (showLoading) setIsLoading(false);
            return;
        }

        lastUpdateRef.current = now;

        if (showLoading) {
            setIsLoading(true);
        }

        setRefreshing(true);

        try {
            const userId = getUserId();

            if (!userId) {
                setError('Пользователь не определен. Авторизуйтесь заново.');
                setIsLoading(false);
                setRefreshing(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/user-orders/${userId}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                const ordersData = result.orders || [];
                const sortedOrders = ordersData.sort((a, b) => {
                    const dateA = new Date(a.created_at || a.createdAt || Date.now());
                    const dateB = new Date(b.created_at || b.createdAt || Date.now());
                    return dateB - dateA;
                });

                setOrders(sortedOrders);
                setError('');

                localStorage.setItem('userOrders', JSON.stringify(sortedOrders));

                if (isInitialMount.current) {
                    showMessage('success', `Загружено ${sortedOrders.length} ордеров`);
                    isInitialMount.current = false;
                }

            } else {
                throw new Error(result.error || 'Ошибка сервера');
            }

        } catch (error) {
            console.error('❌ Ошибка загрузки:', error.message);

            try {
                const localOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
                if (localOrders.length > 0) {
                    setOrders(localOrders);
                    setError('⚠️ Используем кэшированные данные');
                    showMessage('warning', 'Используем сохраненные данные');
                } else {
                    setError('Не удалось загрузить историю');
                    showMessage('error', 'Ошибка загрузки данных');
                }
            } catch (localError) {
                console.error('❌ Ошибка локальных данных:', localError);
                setError('Ошибка соединения с сервером');
                showMessage('error', 'Ошибка сети');
            }

        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    // Инициализация
    useEffect(() => {
        const debugUser = {
            id: '7879866656',
            telegramId: '7879866656',
            username: 'TERBCEO',
            firstName: 'G'
        };
        localStorage.setItem('currentUser', JSON.stringify(debugUser));

        fetchUserOrders();

        refreshIntervalRef.current = setInterval(() => {
            fetchUserOrders(false);
        }, 30000);

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, []);

    // Фильтрация ордеров
    const getFilteredOrders = () => {
        if (viewMode === 'active') {
            return orders.filter(order => {
                const status = (order.admin_status || order.status || '').toLowerCase();
                return ['pending', 'processing', 'accepted'].includes(status);
            });
        }
        return orders;
    };

    // Расчет итоговой суммы
    const calculateTotal = (order) => {
        if (!order || !order.amount || !order.rate) return '—';

        const isBuy = order.type === 'buy' || order.operation_type === 'buy';

        if (isBuy) {
            return (order.amount / order.rate).toFixed(2) + ' USDT';
        } else {
            return (order.amount * order.rate).toFixed(2) + ' RUB';
        }
    };

    // Форматирование даты
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
            return '—';
        }
    };

    // Форматирование времени
    const formatTime = (dateString) => {
        if (!dateString) return '—';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '—';

            return date.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return '—';
        }
    };

    // Копирование ID
    const copyOrderId = (orderId) => {
        navigator.clipboard.writeText(orderId);
        showMessage('success', 'ID скопирован');
    };

    // Переключение раскрытия ордера
    const toggleOrderExpand = (orderId) => {
        setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
    };

    // Статистика
    const getOrdersStats = () => {
        const activeOrders = orders.filter(order => {
            const status = (order.admin_status || order.status || '').toLowerCase();
            return ['pending', 'processing', 'accepted'].includes(status);
        });

        const completedOrders = orders.filter(order => {
            const status = (order.admin_status || order.status || '').toLowerCase();
            return ['completed', 'success'].includes(status);
        });

        const rejectedOrders = orders.filter(order => {
            const status = (order.admin_status || order.status || '').toLowerCase();
            return ['rejected', 'cancelled', 'failed'].includes(status);
        });

        return {
            total: orders.length,
            active: activeOrders.length,
            completed: completedOrders.length,
            rejected: rejectedOrders.length
        };
    };

    // Ручное обновление
    const handleRefresh = () => {
        if (!refreshing) {
            fetchUserOrders(true);
        }
    };

    const stats = getOrdersStats();
    const filteredOrders = getFilteredOrders();

    return (
        <div className="history-container" style={{ 
            background: themeColors.bgColor, 
            color: themeColors.textColor 
        }}>
            {/* Хедер */}
            <div className="history-header-new" style={{ 
                background: themeColors.bgColor,
                borderBottom: `0.5px solid ${themeColors.sectionBgColor}`
            }}>
                <div className="header-content">
                    <div className="header-left">
                        <div className="header-titles">
                        <h1 className="header-title-new" style={{ color: themeColors.textColor }}>История операций</h1>
                            <p className="header-subtitle" style={{ color: themeColors.hintColor }}>Все ваши транзакции</p>
                        </div>
                    </div>

                    <button
                        className="test-connection-btn"
                        onClick={handleRefresh}
                        title="Обновить историю"
                        style={{ 
                            background: themeColors.buttonColor,
                            color: themeColors.buttonTextColor,
                            border: 'none'
                        }}
                    >
                        🔄
                    </button>
                </div>

                {/* Статистика */}
                <div className="stats-cards">
                    <div className="stat-card-new" style={{ 
                        background: themeColors.bgColor,
                        border: `0.5px solid ${themeColors.sectionBgColor}`
                    }}>
                        <div className="stat-icon-container">
                            {stats.completed > 0 ? <CompletedSVG /> : <div className="stat-icon" style={{ color: '#34c759' }}>✅</div>}
                        </div>
                        <div className="stat-content">
                            <div className="stat-value-new" style={{ color: themeColors.textColor }}>{stats.completed}</div>
                            <div className="stat-label-new" style={{ color: themeColors.hintColor }}>Завершено</div>
                        </div>
                    </div>

                    <div className="stat-card-new" style={{ 
                        background: themeColors.bgColor,
                        border: `0.5px solid ${themeColors.sectionBgColor}`
                    }}>
                        <div className="stat-icon-container">
                            {stats.rejected > 0 ? <CancelledSVG /> : <div className="stat-icon" style={{ color: '#ff3b30' }}>❌</div>}
                        </div>
                        <div className="stat-content">
                            <div className="stat-value-new" style={{ color: themeColors.textColor }}>{stats.rejected}</div>
                            <div className="stat-label-new" style={{ color: themeColors.hintColor }}>Отклонено</div>
                        </div>
                    </div>
                </div>

                {/* Переключатель вью */}
                <div className="view-tabs" style={{ 
                    background: themeColors.secondaryBgColor,
                    border: `0.5px solid ${themeColors.sectionBgColor}`
                }}>
                    <button
                        className={`view-tab-new ${viewMode === 'active' ? 'active' : ''}`}
                        onClick={() => setViewMode('active')}
                        style={viewMode === 'active' ? { 
                            background: themeColors.buttonColor,
                            color: themeColors.buttonTextColor 
                        } : { 
                            background: 'transparent',
                            color: themeColors.hintColor 
                        }}
                    >
                        <span className="tab-icon">🔥</span>
                        <span className="tab-text">Активные</span>
                        {stats.active > 0 && (
                            <span className="tab-badge" style={{ 
                                background: '#ff3b30',
                                color: '#ffffff'
                            }}>{stats.active}</span>
                        )}
                    </button>
                    <button
                        className={`view-tab-new ${viewMode === 'all' ? 'active' : ''}`}
                        onClick={() => setViewMode('all')}
                        style={viewMode === 'all' ? { 
                            background: themeColors.buttonColor,
                            color: themeColors.buttonTextColor 
                        } : { 
                            background: 'transparent',
                            color: themeColors.hintColor 
                        }}
                    >
                        <span className="tab-icon">📋</span>
                        <span className="tab-text">Все</span>
                        {stats.total > 0 && (
                            <span className="tab-badge" style={{ 
                                background: themeColors.buttonColor,
                                color: themeColors.buttonTextColor
                            }}>{stats.total}</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Основной контент */}
            <div className="orders-container-new" style={{ 
                background: themeColors.bgColor 
            }}>
                {isLoading ? (
                    <div className="loading-container-new">
                        <div className="loading-spinner-svg">
                            <LoadingSVG color={themeColors.buttonColor} />
                        </div>
                        <p className="loading-text" style={{ color: themeColors.hintColor }}>Загрузка истории...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="empty-state-new">
                        <div className="empty-icon-container">
                            <EmptySVG />
                        </div>
                        <h3 className="empty-title-new" style={{ color: themeColors.textColor }}>
                            {viewMode === 'active' ? 'Нет активных операций' : 'История пуста'}
                        </h3>
                        <p className="empty-subtitle-new" style={{ color: themeColors.hintColor }}>
                            {viewMode === 'active'
                                ? 'Все операции завершены или отменены'
                                : 'Совершите первую операцию обмена'
                            }
                        </p>

                        {error && (
                            <div className="connection-error-info" style={{ 
                                background: themeColors.secondaryBgColor,
                                border: `0.5px solid ${themeColors.sectionBgColor}`
                            }}>
                                <p className="error-title" style={{ color: '#ff3b30' }}>⚠️ {error}</p>
                                <p className="error-message" style={{ color: themeColors.hintColor }}>Попробуйте обновить страницу</p>
                            </div>
                        )}
                        <br />
                        <button
                            className="exchange-btn-new"
                            onClick={() => navigateTo('home')}
                            style={{ 
                                background: themeColors.buttonColor,
                                color: themeColors.buttonTextColor,
                                border: 'none'
                            }}
                        >
                            <span className="exchange-icon">🔄</span>
                            <span>Начать обмен</span>
                        </button>
                    </div>
                ) : (
                    <div className="orders-list-new">
                        {filteredOrders.map((order, index) => {
                            const isBuy = order.type === 'buy' || order.operation_type === 'buy';
                            const status = order.admin_status || order.status || 'pending';
                            const statusText = getStatusText(status);
                            const statusClass = getStatusClass(status);
                            const statusIcon = getStatusIcon(status);
                            const isExpanded = expandedOrderId === order.id;
                            const canChat = ['pending', 'processing', 'accepted'].includes(status?.toLowerCase());

                            return (
                                <div
                                    key={order.id || index}
                                    className="order-card-new"
                                    style={{ 
                                        '--order-index': index,
                                        background: themeColors.bgColor,
                                        border: `0.5px solid ${themeColors.sectionBgColor}`
                                    }}
                                >
                                    <div className="order-card-header">
                                        <div className="order-header-left">
                                            <div className="order-type-badge-new" style={{ 
                                                background: `${themeColors.buttonColor}15`,
                                                border: `0.5px solid ${themeColors.buttonColor}30`
                                            }}>
                                                <span className="type-icon-new">
                                                    {isBuy ? '🛒' : '💰'}
                                                </span>
                                                <span className="type-text-new" style={{ color: themeColors.textColor }}>
                                                    {isBuy ? 'Покупка USDT' : 'Продажа USDT'}
                                                </span>
                                            </div>
                                            <button
                                                className="order-id-new"
                                                onClick={() => copyOrderId(order.id)}
                                                title="Копировать ID"
                                                style={{ 
                                                    color: themeColors.hintColor,
                                                    background: 'transparent',
                                                    border: 'none'
                                                }}
                                            >
                                                #{order.id ? order.id.substring(0, 10) + '...' : 'N/A'}
                                            </button>
                                        </div>
                                        <div className={`order-status ${statusClass}`} style={{ 
                                            background: statusClass === 'status-completed' ? '#34c75920' : 
                                                     statusClass === 'status-cancelled' ? '#ff3b3020' : 
                                                     statusClass === 'status-processing' ? `${themeColors.buttonColor}20` : 
                                                     `${themeColors.hintColor}20`,
                                            color: statusClass === 'status-completed' ? '#34c759' : 
                                                  statusClass === 'status-cancelled' ? '#ff3b30' : 
                                                  statusClass === 'status-processing' ? themeColors.buttonColor : 
                                                  themeColors.hintColor,
                                            border: `0.5px solid ${statusClass === 'status-completed' ? '#34c759' : 
                                                              statusClass === 'status-cancelled' ? '#ff3b30' : 
                                                              statusClass === 'status-processing' ? themeColors.buttonColor : 
                                                              themeColors.hintColor}30`
                                        }}>
                                            <span className="status-icon">{statusIcon}</span>
                                            <span className="status-text">{statusText}</span>
                                        </div>
                                    </div>

                                    <div className="order-details-grid">
                                        <div className="order-detail">
                                            <span className="detail-label" style={{ color: themeColors.hintColor }}>Сумма</span>
                                            <span className="detail-value" style={{ color: themeColors.textColor }}>
                                                {order.amount} {isBuy ? 'RUB' : 'USDT'}
                                            </span>
                                        </div>
                                        <div className="order-detail">
                                            <span className="detail-label" style={{ color: themeColors.hintColor }}>Курс</span>
                                            <span className="detail-value highlight" style={{ color: themeColors.buttonColor }}>
                                                {order.rate} ₽
                                            </span>
                                        </div>
                                        <div className="order-detail">
                                            <span className="detail-label" style={{ color: themeColors.hintColor }}>Итого</span>
                                            <span className="detail-value total" style={{ color: themeColors.textColor }}>
                                                {calculateTotal(order)}
                                            </span>
                                        </div>
                                        <div className="order-detail">
                                            <span className="detail-label" style={{ color: themeColors.hintColor }}>Время</span>
                                            <span className="detail-value date" style={{ color: themeColors.hintColor }}>
                                                {formatTime(order.created_at || order.createdAt)}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        className="expand-btn"
                                        onClick={() => toggleOrderExpand(order.id)}
                                        style={{ 
                                            background: themeColors.secondaryBgColor,
                                            color: themeColors.hintColor,
                                            border: `0.5px solid ${themeColors.sectionBgColor}`
                                        }}
                                    >
                                        <span className="expand-text">
                                            {isExpanded ? 'Скрыть детали' : 'Показать детали'}
                                        </span>
                                        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`} style={{ color: themeColors.hintColor }}>
                                            ▼
                                        </span>
                                    </button>

                                    {isExpanded && (
                                        <div className="order-details-expanded" style={{ 
                                            background: themeColors.secondaryBgColor,
                                            border: `0.5px solid ${themeColors.sectionBgColor}`
                                        }}>
                                            <div className="detail-row">
                                                <span className="detail-label" style={{ color: themeColors.hintColor }}>ID ордера:</span>
                                                <span className="detail-value code" style={{ color: themeColors.textColor }}>{order.id}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label" style={{ color: themeColors.hintColor }}>Дата создания:</span>
                                                <span className="detail-value" style={{ color: themeColors.textColor }}>{formatDate(order.created_at || order.createdAt)}</span>
                                            </div>
                                            {order.user_id && (
                                                <div className="detail-row">
                                                    <span className="detail-label" style={{ color: themeColors.hintColor }}>User ID:</span>
                                                    <span className="detail-value code" style={{ color: themeColors.textColor }}>{order.user_id}</span>
                                                </div>
                                            )}
                                            {order.telegram_id && (
                                                <div className="detail-row">
                                                    <span className="detail-label" style={{ color: themeColors.hintColor }}>Telegram ID:</span>
                                                    <span className="detail-value code" style={{ color: themeColors.textColor }}>{order.telegram_id}</span>
                                                </div>
                                            )}
                                            {order.username && (
                                                <div className="detail-row">
                                                    <span className="detail-label" style={{ color: themeColors.hintColor }}>Имя пользователя:</span>
                                                    <span className="detail-value" style={{ color: themeColors.textColor }}>@{order.username}</span>
                                                </div>
                                            )}
                                            {order.first_name && (
                                                <div className="detail-row">
                                                    <span className="detail-label" style={{ color: themeColors.hintColor }}>Имя:</span>
                                                    <span className="detail-value" style={{ color: themeColors.textColor }}>{order.first_name}</span>
                                                </div>
                                            )}
                                            {order.admin_comment && (
                                                <div className="detail-row">
                                                    <span className="detail-label" style={{ color: themeColors.hintColor }}>Комментарий оператора:</span>
                                                    <span className="detail-value comment" style={{ color: themeColors.textColor }}>{order.admin_comment}</span>
                                                </div>
                                            )}
                                            {order.admin_action_at && (
                                                <div className="detail-row">
                                                    <span className="detail-label" style={{ color: themeColors.hintColor }}>Время действия:</span>
                                                    <span className="detail-value" style={{ color: themeColors.textColor }}>{formatDate(order.admin_action_at)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="order-actions">
                                        <button
                                            className="copy-btn-new"
                                            onClick={() => copyOrderId(order.id)}
                                            style={{ 
                                                background: themeColors.secondaryBgColor,
                                                color: themeColors.buttonColor,
                                                border: `0.5px solid ${themeColors.sectionBgColor}`
                                            }}
                                        >
                                            <span className="copy-icon-new">📋</span>
                                            <span>Копировать ID</span>
                                        </button>

                                        {canChat && (
                                            <button
                                                className="chat-btn-new"
                                                onClick={() => setActiveChat({ orderId: order.id })}
                                                style={{ 
                                                    background: themeColors.buttonColor,
                                                    color: themeColors.buttonTextColor,
                                                    border: 'none'
                                                }}
                                            >
                                                <span className="chat-icon-new">💬</span>
                                                <span>Чат с оператором</span>
                                            </button>
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
                <div className={`message-toast-new message-${message.type}`} style={{ 
                    background: message.type === 'success' ? '#34c759' : 
                               message.type === 'error' ? '#ff3b30' : 
                               themeColors.buttonColor,
                    color: '#ffffff'
                }}>
                    <span className="toast-icon">
                        {message.type === 'success' ? '✅' :
                         message.type === 'error' ? '❌' : '⚠️'}
                    </span>
                    <span className="toast-text">{message.text}</span>
                </div>
            )}

            {/* Support Chat */}
            {activeChat && (
                <div className="chat-modal-overlay" style={{ 
                    background: themeColors.bgColor === '#ffffff' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.7)'
                }}>
                    <div className="chat-modal" style={{ 
                        background: themeColors.bgColor,
                        border: `0.5px solid ${themeColors.sectionBgColor}`
                    }}>
                        <SupportChat
                            orderId={activeChat.orderId}
                            onClose={() => setActiveChat(null)}
                            themeColors={themeColors}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default History;