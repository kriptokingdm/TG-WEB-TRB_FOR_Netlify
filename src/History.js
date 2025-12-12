import { useState, useEffect, useRef } from 'react';
import './History.css';
import SupportChat from './SupportChat';

const API_URL = 'https://tethrab.shop';

// Утилиты
const getStatusText = (status) => {
  const statusMap = {
    'pending': '🟡 Ожидание',
    'processing': '🟠 В обработке',
    'accepted': '✅ Принят',
    'rejected': '❌ Отклонен',
    'completed': '🏁 Завершен',
    'success': '✅ Завершено',
    'cancelled': '❌ Отменено',
    'failed': '❌ Ошибка'
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

// Функция с retry логикой
const fetchWithRetry = async (url, retries = 3, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 Попытка ${i + 1}/${retries}: ${url}`);
      
      // Создаем AbortController для таймаута
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд таймаут
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Успех на попытке ${i + 1}`);
      return data;
    } catch (error) {
      console.log(`❌ Попытка ${i + 1}/${retries} не удалась:`, error.message);
      
      if (i === retries - 1) throw error;
      
      // Ждем перед следующей попыткой
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1))); // Увеличиваем задержку
    }
  }
};

function History({ navigateTo }) {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeChat, setActiveChat] = useState(null);
  const [viewMode, setViewMode] = useState('active');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [refreshing, setRefreshing] = useState(false);

  const isInitialMount = useRef(true);
  const refreshIntervalRef = useRef(null);
  const lastUpdateRef = useRef(0);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 5000; // 5 секунд
  const REFRESH_INTERVAL = 60000; // 60 секунд для автообновления
  const MIN_REQUEST_INTERVAL = 3000; // Минимум 3 секунды между запросами

  // Показать сообщение
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // Получение ID пользователя
  const getUserId = () => {
    try {
      // 1. Telegram Web App
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        const tgUser = tg.initDataUnsafe?.user;
        if (tgUser?.id) {
          return `user_${tgUser.id}`;
        }
      }
      
      // 2. localStorage
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        return parsed.id || parsed.telegramId;
      }
      
      const savedTelegramUser = localStorage.getItem('telegramUser');
      if (savedTelegramUser) {
        const parsed = JSON.parse(savedTelegramUser);
        return `user_${parsed.id}`;
      }
      
    } catch (error) {
      console.error('❌ Ошибка получения ID:', error);
    }
    
    return null;
  };

  // Основная функция загрузки ордеров
  const fetchUserOrders = async (showLoading = true, force = false) => {
    const now = Date.now();
    
    // Защита от слишком частых запросов
    if (!force && lastUpdateRef.current && (now - lastUpdateRef.current < MIN_REQUEST_INTERVAL)) {
      console.log('⏳ Слишком частый запрос, пропускаем');
      if (showLoading) setIsLoading(false);
      return;
    }
    
    lastUpdateRef.current = now;

    if (showLoading) {
      setIsLoading(true);
    }
    
    setRefreshing(true);
    console.log('📥 Начинаем загрузку ордеров...');

    try {
      const userId = getUserId();
      
      if (!userId) {
        console.log('⚠️ Пользователь не найден');
        setError('Пользователь не определен');
        setIsLoading(false);
        setRefreshing(false);
        return;
      }

      console.log('👤 Загружаем ордера для:', userId);

      // Используем fetch с retry
      const result = await fetchWithRetry(`${API_URL}/user-orders/${userId}`);
      
      if (result.success) {
        const ordersData = result.orders || [];
        console.log(`📊 Получено ордеров: ${ordersData.length}`);

        // Сортируем по дате (новые сверху)
        const sortedOrders = ordersData.sort((a, b) => {
          const dateA = new Date(a.created_at || a.createdAt || Date.now());
          const dateB = new Date(b.created_at || b.createdAt || Date.now());
          return dateB - dateA;
        });

        setOrders(sortedOrders);
        setError('');
        retryCountRef.current = 0; // Сбрасываем счетчик ошибок

        // Сохраняем в localStorage
        localStorage.setItem('userOrders', JSON.stringify(sortedOrders));

        if (isInitialMount.current) {
          showMessage('success', `✅ Загружено ${sortedOrders.length} ордеров`);
          isInitialMount.current = false;
        }

      } else {
        throw new Error(result.error || 'Ошибка сервера');
      }

    } catch (error) {
      console.error('❌ Ошибка загрузки:', error.message);
      
      // Увеличиваем счетчик ошибок
      retryCountRef.current++;
      
      if (retryCountRef.current >= MAX_RETRIES) {
        // После 3 ошибок показываем локальные данные
        try {
          const localOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
          if (localOrders.length > 0) {
            console.log('📂 Используем локальные данные:', localOrders.length);
            setOrders(localOrders);
            setError('⚠️ Используем кэшированные данные');
            showMessage('warning', '⚠️ Используем сохраненные данные');
          } else {
            setError('Не удалось загрузить историю');
            showMessage('error', '❌ Ошибка загрузки данных');
          }
        } catch (localError) {
          console.error('❌ Ошибка локальных данных:', localError);
          setError('Ошибка соединения с сервером');
          showMessage('error', '❌ Ошибка сети');
        }
      } else {
        // Пробуем снова через RETRY_DELAY
        const nextDelay = RETRY_DELAY * retryCountRef.current;
        console.log(`🔄 Повтор через ${nextDelay/1000} сек... (${retryCountRef.current}/${MAX_RETRIES})`);
        
        setError(`Ошибка подключения. Повтор через ${nextDelay/1000} сек...`);
        
        setTimeout(() => {
          fetchUserOrders(false, true); // Форсируем повтор
        }, nextDelay);
      }
      
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Автоматическое обновление
  const startAutoRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Обновляем только если есть активные ордера
    const hasActiveOrders = orders.some(order => {
      const status = order.admin_status?.toLowerCase() || order.status?.toLowerCase();
      return ['pending', 'processing', 'accepted'].includes(status);
    });
    
    if (hasActiveOrders) {
      console.log('🔄 Запускаем автообновление (есть активные ордера)');
      
      refreshIntervalRef.current = setInterval(() => {
        const now = Date.now();
        if (now - lastUpdateRef.current > REFRESH_INTERVAL) {
          console.log('🔄 Автообновление активных ордеров');
          fetchUserOrders(false);
        }
      }, REFRESH_INTERVAL);
    } else {
      console.log('⏸️ Нет активных ордеров, автообновление остановлено');
    }
  };

  // Инициализация
  useEffect(() => {
    console.log('🚀 History компонент загружен');
    fetchUserOrders();

    return () => {
      console.log('🧹 Очистка History компонента');
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Обновляем автообновление при изменении ордеров
  useEffect(() => {
    if (orders.length > 0) {
      console.log('📊 Ордеры обновлены, проверяем автообновление');
      startAutoRefresh();
    }
  }, [orders]);

  // Тест подключения
  const testConnection = async () => {
    try {
      showMessage('info', '🔄 Тестируем подключение...');
      const response = await fetch(`${API_URL}/health`, { timeout: 5000 });
      
      if (response.ok) {
        showMessage('success', '✅ API работает!');
      } else {
        showMessage('error', `❌ HTTP ${response.status}`);
      }
    } catch (error) {
      showMessage('error', `❌ Ошибка сети: ${error.message}`);
    }
  };

  // Фильтрация ордеров
  const getFilteredOrders = () => {
    if (viewMode === 'active') {
      return orders.filter(order => {
        const status = order.admin_status?.toLowerCase() || order.status?.toLowerCase();
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
      console.log('Ошибка форматирования даты:', e);
      return '—';
    }
  };

  // Копирование ID
  const copyOrderId = (orderId) => {
    navigator.clipboard.writeText(orderId);
    showMessage('success', '✅ ID скопирован');
  };

  // Статистика
  const getOrdersStats = () => {
    const activeOrders = orders.filter(order => {
      const status = order.admin_status?.toLowerCase() || order.status?.toLowerCase();
      return ['pending', 'processing', 'accepted'].includes(status);
    });

    const completedOrders = orders.filter(order => {
      const status = order.admin_status?.toLowerCase() || order.status?.toLowerCase();
      return ['completed', 'success'].includes(status);
    });

    const rejectedOrders = orders.filter(order => {
      const status = order.admin_status?.toLowerCase() || order.status?.toLowerCase();
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
      console.log('🔄 Ручное обновление');
      fetchUserOrders(true, true);
    }
  };

  const stats = getOrdersStats();
  const filteredOrders = getFilteredOrders();

  return (
    <div className="history-container">
      {/* Хедер */}
      <div className="history-header-new">
        <div className="header-content">
          <div className="header-left">
            <div className="header-titles">
              <h1 className="header-title-new">История операций</h1>
              <p className="header-subtitle">Все ваши транзакции</p>
            </div>
          </div>

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

          <div className="stat-card-new">
            <div className="stat-icon-container">
              <div className="stat-icon">❌</div>
            </div>
            <div className="stat-content">
              <div className="stat-value-new">{stats.rejected}</div>
              <div className="stat-label-new">Отклонено</div>
            </div>
          </div>
        </div>

        {/* Переключатель вью и кнопка обновления */}
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

          <button
            className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
            title="Обновить историю"
          >
            <span className="refresh-icon">
              {refreshing ? '⏳' : '🔄'}
            </span>
            <span className="refresh-text">
              {refreshing ? 'Обновление...' : 'Обновить'}
            </span>
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

            {error && (
              <div className="connection-error-info">
                <p className="error-title">⚠️ {error}</p>
                <p className="error-message">Попробуйте обновить страницу</p>
              </div>
            )}

            <button
              className="exchange-btn-new"
              onClick={() => navigateTo('home')}
            >
              <span className="exchange-icon">💰</span>
              <span>Начать обмен</span>
            </button>
          </div>
        ) : (
          <div className="orders-list-new">
            {filteredOrders.map((order, index) => {
              const isBuy = order.type === 'buy' || order.operation_type === 'buy';
              const status = order.admin_status || order.status;
              const statusText = getStatusText(status);
              const statusClass = getStatusClass(status);
              
              // Определяем, можно ли открыть чат
              const canChat = ['pending', 'processing', 'accepted'].includes(status?.toLowerCase());

              return (
                <div key={order.id || index} className="order-card-new">
                  <div className="order-card-header">
                    <div className="order-header-left">
                      <div className="order-type-badge-new">
                        <span className="type-icon-new">
                          {isBuy ? '🛒' : '💰'}
                        </span>
                        <span className="type-text-new">
                          {isBuy ? 'Покупка USDT' : 'Продажа USDT'}
                        </span>
                      </div>
                      <button
                        className="order-id-new"
                        onClick={() => copyOrderId(order.id)}
                        title="Копировать ID"
                      >
                        #{order.id ? order.id.substring(0, 10) + '...' : 'N/A'}
                      </button>
                    </div>
                    <div className={`order-status ${statusClass}`}>
                      {statusText}
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

                  {/* Комментарий админа, если есть */}
                  {order.admin_comment && (
                    <div className="admin-comment">
                      <span className="comment-label">💬 Комментарий оператора:</span>
                      <span className="comment-text">{order.admin_comment}</span>
                    </div>
                  )}

                  <div className="order-actions">
                    <button
                      className="copy-btn-new"
                      onClick={() => copyOrderId(order.id)}
                    >
                      <span className="copy-icon-new">📋</span>
                      <span>Копировать ID</span>
                    </button>

                    {/* Кнопка чата для активных ордеров */}
                    {canChat && (
                      <button
                        className="chat-btn-new"
                        onClick={() => setActiveChat({ orderId: order.id })}
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
      <div className="bottom-nav-new">
        <button className="nav-item-new" onClick={() => navigateTo('profile')}>
          <div className="nav-icon-wrapper">
            <span className="nav-icon">👤</span>
          </div>
          <span className="nav-label">Профиль</span>
        </button>
        
        <button className="nav-center-item" onClick={() => navigateTo('home')}>
          <div className="nav-center-circle">
            <span className="nav-center-icon">💸</span>
          </div>
          <span className="nav-center-label">Обмен</span>
        </button>
        
        <button className="nav-item-new" onClick={() => navigateTo('history')}>
          <div className="nav-icon-wrapper">
            <span className="nav-icon">📊</span>
          </div>
          <span className="nav-label">История</span>
        </button>
      </div>
    </div>
  );
}

export default History;