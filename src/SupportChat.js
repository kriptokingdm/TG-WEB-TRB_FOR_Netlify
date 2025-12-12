import { useState, useEffect, useRef } from 'react';
import { ChatApi } from './ChatApi';
import './SupportChat.css';

function SupportChat({ orderId, onClose }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');
    const [userId, setUserId] = useState(null);
    const [fullOrderId, setFullOrderId] = useState(orderId); // Полный ID ордера
    
    const messagesEndRef = useRef(null);
    
    const API_URL = 'https://tethrab.shop';

    // Получаем ID пользователя
    useEffect(() => {
        const getUserData = () => {
            try {
                // 1. Telegram Web App
                if (window.Telegram?.WebApp) {
                    const tg = window.Telegram.WebApp;
                    const tgUser = tg.initDataUnsafe?.user;
                    if (tgUser?.id) return tgUser.id.toString();
                }
                
                // 2. localStorage
                const savedUser = localStorage.getItem('currentUser');
                if (savedUser) {
                    const parsed = JSON.parse(savedUser);
                    return parsed.id || parsed.telegramId;
                }
            } catch (error) {
                console.error('❌ Ошибка получения ID:', error);
            }
            return null;
        };
        
        const id = getUserData();
        setUserId(id);
    }, []);

    // Функция для получения полного orderId
    const getFullOrderId = async (orderId) => {
        try {
            console.log('🔍 Получаем полный orderId для:', orderId);
            
            // Если уже есть _ в ID, значит это полный ID
            if (orderId.includes('_')) {
                return orderId;
            }
            
            // Пробуем найти ордер через API
            const response = await fetch(`${API_URL}/admin/order/${orderId}`);
            const data = await response.json();
            
            if (data.success && data.order) {
                console.log('✅ Найден полный order_id:', data.order.order_id);
                return data.order.order_id;
            }
            
            // Если не нашли, пробуем поискать по части
            const searchResponse = await fetch(`${API_URL}/admin/all-orders`);
            const searchData = await searchResponse.json();
            
            if (searchData.success && searchData.orders) {
                const foundOrder = searchData.orders.find(o => 
                    o.order_id && o.order_id.includes(orderId)
                );
                if (foundOrder) {
                    console.log('✅ Найден по частичному совпадению:', foundOrder.order_id);
                    return foundOrder.order_id;
                }
            }
            
            // Если ничего не нашли, используем как есть
            console.log('⚠️ Не удалось найти полный orderId, используем как есть');
            return orderId;
            
        } catch (error) {
            console.error('❌ Ошибка получения полного orderId:', error);
            return orderId;
        }
    };

    // Загрузка сообщений
    const loadMessages = async () => {
        if (!orderId || !userId) return;
        
        try {
            setIsLoading(true);
            
            // Получаем полный orderId
            const actualOrderId = await getFullOrderId(orderId);
            if (actualOrderId !== fullOrderId) {
                setFullOrderId(actualOrderId);
            }
            
            console.log('📨 Загружаем сообщения для orderId:', actualOrderId);
            const loadedMessages = await ChatApi.getMessages(actualOrderId);
            setMessages(loadedMessages);
            
            // Помечаем сообщения админа как прочитанные
            await ChatApi.markAsRead(actualOrderId, userId);
            
            setError('');
        } catch (error) {
            console.error('❌ Ошибка загрузки:', error);
            setError('Не удалось загрузить сообщения');
        } finally {
            setIsLoading(false);
        }
    };

    // Автообновление сообщений
    useEffect(() => {
        if (!orderId || !userId) return;
        
        loadMessages();
        
        // Обновляем каждые 10 секунд
        const interval = setInterval(() => {
            loadMessages();
        }, 10000);
        
        return () => clearInterval(interval);
    }, [orderId, userId]);

    // Прокрутка к последнему сообщению
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Отправка сообщения
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !orderId || !userId || isSending) return;
        
        try {
            setIsSending(true);
            
            // Получаем полный orderId
            const actualOrderId = await getFullOrderId(orderId);
            if (actualOrderId !== fullOrderId) {
                setFullOrderId(actualOrderId);
            }
            
            console.log('📤 Отправка сообщения для orderId:', actualOrderId);
            console.log('👤 User ID:', userId);
            console.log('📝 Message:', newMessage.trim());
            
            const result = await ChatApi.sendMessage(
                actualOrderId,
                userId,
                'user',
                newMessage.trim()
            );
            
            if (result.success) {
                setNewMessage('');
                // Добавляем сообщение в список
                setMessages(prev => [...prev, result.message]);
                
                // Прокручиваем вниз
                setTimeout(() => {
                    scrollToBottom();
                }, 100);
            } else {
                setError(result.error || 'Ошибка отправки');
                console.error('❌ Ошибка отправки:', result.error);
            }
        } catch (error) {
            console.error('❌ Ошибка отправки:', error);
            setError('Ошибка отправки сообщения');
        } finally {
            setIsSending(false);
        }
    };

    // Отправка по Enter
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!orderId) {
        return (
            <div className="chat-error">
                <p>❌ Ордер не указан</p>
                <button onClick={onClose}>Закрыть</button>
            </div>
        );
    }

    if (!userId) {
        return (
            <div className="chat-error">
                <p>❌ Не удалось определить пользователя</p>
                <button onClick={onClose}>Закрыть</button>
            </div>
        );
    }

    return (
        <div className="support-chat-container">
            {/* Заголовок */}
            <div className="chat-header">
                <div className="chat-title">
                    <span className="chat-icon">💬</span>
                    <div className="chat-title-text">
                        <h3>Чат с оператором</h3>
                        <p className="chat-subtitle">
                            Ордер #{fullOrderId || orderId}
                            {fullOrderId !== orderId && (
                                <span className="order-id-note">
                                    {' '}(изначально: {orderId})
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                <button className="chat-close-btn" onClick={onClose}>✕</button>
            </div>

            {/* Сообщения */}
            <div className="chat-messages-container">
                {isLoading ? (
                    <div className="chat-loading">
                        <div className="spinner"></div>
                        <p>Загрузка сообщений...</p>
                    </div>
                ) : error ? (
                    <div className="chat-error-message">
                        <p>{error}</p>
                        <button onClick={loadMessages}>Повторить</button>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="chat-empty">
                        <p>Нет сообщений. Начните диалог первым!</p>
                    </div>
                ) : (
                    <div className="chat-messages">
                        {messages.map((msg) => (
                            <div 
                                key={msg.id} 
                                className={`chat-message ${msg.sender_type === 'user' ? 'user-message' : 'admin-message'}`}
                            >
                                <div className="message-content">
                                    <p>{msg.message}</p>
                                    <span className="message-time">
                                        {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                                {msg.sender_type === 'admin' && !msg.read_status && (
                                    <span className="unread-badge">новое</span>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Поле ввода */}
            <div className="chat-input-container">
                <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Введите сообщение..."
                    disabled={isSending}
                    rows={2}
                    className="chat-input"
                />
                <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className="chat-send-btn"
                >
                    {isSending ? (
                        <span className="sending-spinner"></span>
                    ) : (
                        'Отправить'
                    )}
                </button>
            </div>

            {/* Подсказка */}
            <div className="chat-info">
                <p>💡 Сообщения отправляются оператору в реальном времени</p>
                <p className="debug-info">
                    Order ID: {fullOrderId || orderId} | 
                    User ID: {userId || 'не определен'}
                </p>
            </div>
        </div>
    );
}

export default SupportChat;