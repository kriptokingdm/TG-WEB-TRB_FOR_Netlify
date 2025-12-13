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
    const [fullOrderId, setFullOrderId] = useState(orderId);
    
    const messagesEndRef = useRef(null);
    
    const API_URL = 'https://tethrab.shop';

    // Получаем ID пользователя
    useEffect(() => {
        const getUserData = () => {
            try {
                if (window.Telegram?.WebApp) {
                    const tg = window.Telegram.WebApp;
                    const tgUser = tg.initDataUnsafe?.user;
                    if (tgUser?.id) return tgUser.id.toString();
                }
                
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
            if (orderId.includes('_')) {
                return orderId;
            }
            
            const response = await fetch(`${API_URL}/admin/order/${orderId}`);
            const data = await response.json();
            
            if (data.success && data.order) {
                return data.order.order_id;
            }
            
            return orderId;
        } catch (error) {
            return orderId;
        }
    };

    // Загрузка сообщений
    const loadMessages = async () => {
        if (!orderId || !userId) return;
        
        try {
            setIsLoading(true);
            
            const actualOrderId = await getFullOrderId(orderId);
            if (actualOrderId !== fullOrderId) {
                setFullOrderId(actualOrderId);
            }
            
            const loadedMessages = await ChatApi.getMessages(actualOrderId);
            setMessages(loadedMessages);
            
            await ChatApi.markAsRead(actualOrderId, userId);
            
            setError('');
        } catch (error) {
            setError('Не удалось загрузить сообщения');
        } finally {
            setIsLoading(false);
        }
    };

    // Автообновление сообщений
    useEffect(() => {
        if (!orderId || !userId) return;
        
        loadMessages();
        
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
            
            const actualOrderId = await getFullOrderId(orderId);
            if (actualOrderId !== fullOrderId) {
                setFullOrderId(actualOrderId);
            }
            
            const result = await ChatApi.sendMessage(
                actualOrderId,
                userId,
                'user',
                newMessage.trim()
            );
            
            if (result.success) {
                setNewMessage('');
                setMessages(prev => [...prev, result.message]);
                
                setTimeout(() => {
                    scrollToBottom();
                }, 100);
            } else {
                setError(result.error || 'Ошибка отправки');
            }
        } catch (error) {
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

    // Форматирование времени
    const formatTime = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return '';
        }
    };

    return (
        <div className="support-chat-new">
            {/* Хедер */}
            <div className="chat-header-new">
                <div className="chat-header-content">
                    <div className="chat-title-section">
                        <div className="chat-title-icon">💬</div>
                        <div className="chat-title-texts">
                            <h3 className="chat-title-new">Чат с оператором</h3>
                            <p className="chat-order-id">
                                Ордер #{fullOrderId || orderId}
                            </p>
                        </div>
                    </div>
                    <button 
                        className="chat-close-btn-new" 
                        onClick={onClose}
                        aria-label="Закрыть чат"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Основной контейнер сообщений */}
            <div className="chat-messages-container-new">
                {isLoading ? (
                    <div className="chat-loading-new">
                        <div className="chat-spinner-new"></div>
                        <p className="chat-loading-text">Загрузка сообщений...</p>
                    </div>
                ) : error ? (
                    <div className="chat-error-new">
                        <div className="error-icon">⚠️</div>
                        <p className="error-text">{error}</p>
                        <button 
                            className="retry-btn-new" 
                            onClick={loadMessages}
                        >
                            Повторить
                        </button>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="chat-empty-new">
                        <div className="empty-icon-new">💭</div>
                        <h4 className="empty-title-new">Нет сообщений</h4>
                        <p className="empty-subtitle">Начните диалог первым!</p>
                    </div>
                ) : (
                    <div className="chat-messages-list">
                        {messages.map((msg) => (
                            <div 
                                key={msg.id} 
                                className={`chat-message-new ${
                                    msg.sender_type === 'user' ? 'user-message-new' : 'admin-message-new'
                                }`}
                            >
                                <div className="message-bubble">
                                    <div className="message-content-new">
                                        <p className="message-text">{msg.message}</p>
                                        <div className="message-meta">
                                            <span className="message-time-new">
                                                {formatTime(msg.created_at)}
                                            </span>
                                            {msg.sender_type === 'admin' && !msg.read_status && (
                                                <span className="unread-dot"></span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="message-sender">
                                        {msg.sender_type === 'user' ? 'Вы' : 'Оператор'}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} className="messages-end" />
                    </div>
                )}
            </div>

            {/* Поле ввода */}
            <div className="chat-input-section-new">
                <div className="input-wrapper-new">
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Введите сообщение..."
                        disabled={isSending}
                        rows={1}
                        className="chat-input-new"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isSending}
                        className="chat-send-btn-new"
                    >
                        {isSending ? (
                            <div className="send-spinner"></div>
                        ) : (
                            <>
                                <span className="send-text">Отправить</span>
                                <svg className="send-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </>
                        )}
                    </button>
                </div>
                
                <div className="chat-hint-new">
                    <span className="hint-icon">💡</span>
                    <span className="hint-text">Сообщения отправляются оператору в реальном времени</span>
                </div>
            </div>
        </div>
    );
}

export default SupportChat;