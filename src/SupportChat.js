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
    const inputRef = useRef(null);
    
    // Получаем ID пользователя
    useEffect(() => {
        const getUserData = () => {
            try {
                // 1. Telegram Web App
                if (window.Telegram?.WebApp) {
                    const tg = window.Telegram.WebApp;
                    const tgUser = tg.initDataUnsafe?.user;
                    if (tgUser?.id) {
                        console.log('📱 Telegram User ID:', tgUser.id);
                        return tgUser.id.toString();
                    }
                }
                
                // 2. LocalStorage
                const savedTelegramUser = localStorage.getItem('telegramUser');
                if (savedTelegramUser) {
                    const parsed = JSON.parse(savedTelegramUser);
                    if (parsed?.id) {
                        console.log('📱 Telegram User from localStorage:', parsed.id);
                        return parsed.id.toString();
                    }
                }
                
                // 3. Current user
                const savedUser = localStorage.getItem('currentUser');
                if (savedUser) {
                    const parsed = JSON.parse(savedUser);
                    if (parsed?.telegramId) {
                        console.log('👤 User ID from currentUser:', parsed.telegramId);
                        return parsed.telegramId.toString();
                    }
                    if (parsed?.id) {
                        console.log('👤 User ID from currentUser:', parsed.id);
                        return parsed.id.toString();
                    }
                }
                
                // 4. Test ID from URL
                const urlParams = new URLSearchParams(window.location.search);
                const testUserId = urlParams.get('test_user_id');
                if (testUserId) {
                    console.log('🧪 Test User ID from URL:', testUserId);
                    return testUserId;
                }
                
            } catch (error) {
                console.error('❌ Ошибка получения ID:', error);
            }
            console.log('⚠️ User ID not found');
            return null;
        };
        
        const id = getUserData();
        console.log('✅ Final User ID for chat:', id);
        setUserId(id);
    }, []);

    // Загрузка сообщений
    const loadMessages = async () => {
        if (!orderId || !userId) {
            console.log('❌ Missing orderId or userId');
            return;
        }
        
        try {
            setIsLoading(true);
            console.log('🔄 Loading messages for order:', orderId, 'user:', userId);
            
            const loadedMessages = await ChatApi.getMessages(orderId);
            console.log('✅ Loaded messages:', loadedMessages);
            
            setMessages(loadedMessages);
            
            // Помечаем как прочитанные (игнорируем ошибки)
            try {
                await ChatApi.markAsRead(orderId, userId);
                console.log('✅ Messages marked as read');
            } catch (markError) {
                console.log('⚠️ Could not mark as read:', markError.message);
            }
            
            setError('');
        } catch (error) {
            console.error('❌ Error loading messages:', error);
            setError('Не удалось загрузить сообщения');
        } finally {
            setIsLoading(false);
        }
    };

    // Автообновление сообщений
    useEffect(() => {
        if (!orderId || !userId) {
            console.log('❌ Cannot start chat: missing orderId or userId');
            return;
        }
        
        console.log('🚀 Starting chat for order:', orderId, 'user:', userId);
        loadMessages();
        
        const interval = setInterval(() => {
            loadMessages();
        }, 5000); // Обновляем каждые 5 секунд
        
        return () => {
            console.log('🛑 Cleaning up chat interval');
            clearInterval(interval);
        };
    }, [orderId, userId]);

    // Прокрутка к последнему сообщению
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ 
                behavior: 'smooth',
                block: 'end'
            });
        }, 100);
    };

    // Отправка сообщения
    const handleSendMessage = async () => {
        if (!newMessage.trim()) {
            console.log('❌ Message is empty');
            return;
        }
        
        if (!orderId || !userId) {
            setError('Не удалось определить пользователя');
            return;
        }
        
        if (isSending) {
            console.log('⚠️ Already sending message');
            return;
        }
        
        console.log('📤 Sending message:', newMessage);
        
        try {
            setIsSending(true);
            setError('');
            
            const result = await ChatApi.sendMessage(
                orderId,
                userId,
                'user',
                newMessage.trim()
            );
            
            console.log('✅ Send message result:', result);
            
            if (result.success && result.message) {
                // Добавляем новое сообщение в список
                setMessages(prev => [...prev, result.message]);
                setNewMessage('');
                
                // Фокус на поле ввода
                setTimeout(() => {
                    if (inputRef.current) {
                        inputRef.current.focus();
                    }
                }, 100);
                
                // Прокручиваем вниз
                setTimeout(() => {
                    scrollToBottom();
                }, 200);
                
                // Перезагружаем сообщения через 1 секунду для синхронизации
                setTimeout(() => {
                    loadMessages();
                }, 1000);
                
            } else {
                setError(result.error || 'Ошибка отправки сообщения');
            }
        } catch (error) {
            console.error('❌ Error sending message:', error);
            setError('Ошибка отправки сообщения');
        } finally {
            setIsSending(false);
        }
    };

    // Отправка по Enter (Shift+Enter для новой строки)
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

    // Форматирование даты
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (date.toDateString() === today.toDateString()) {
                return 'Сегодня';
            } else if (date.toDateString() === yesterday.toDateString()) {
                return 'Вчера';
            } else {
                return date.toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short'
                });
            }
        } catch (e) {
            return '';
        }
    };

    // Группировка сообщений по датам
    const groupMessagesByDate = () => {
        const groups = {};
        messages.forEach(msg => {
            const date = formatDate(msg.created_at);
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(msg);
        });
        return groups;
    };

    const messageGroups = groupMessagesByDate();

    // Фокус на поле ввода при открытии
    useEffect(() => {
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 500);
    }, []);

    return (
        <div className="support-chat-new">
            {/* Хедер */}
            <div className="chat-header-new">
                <div className="chat-header-content">
                    <div className="chat-title-section">
                        <button 
                            className="chat-back-btn"
                            onClick={onClose}
                            aria-label="Назад"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                        <div className="chat-title-icon">💬</div>
                        <div className="chat-title-texts">
                            <h3 className="chat-title-new">Чат с оператором</h3>
                            <p className="chat-order-id">
                                Ордер #{fullOrderId || orderId}
                            </p>
                        </div>
                    </div>
                   
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
                        {Object.entries(messageGroups).map(([date, dateMessages]) => (
                            <div key={date} className="message-date-group">
                                <div className="date-divider">
                                    <span className="date-text">{date}</span>
                                </div>
                                {dateMessages.map((msg) => (
                                    <div 
                                        key={msg.id} 
                                        className={`chat-message-new ${
                                            msg.sender_type === 'user' ? 'user-message-new' : 'admin-message-new'
                                        } ${msg.sender_type === 'system' ? 'system-message-new' : ''}`}
                                    >
                                        <div className="message-bubble">
                                            <div className="message-content-new">
                                                <p className="message-text">{msg.message}</p>
                                                <div className="message-meta">
                                                    <span className="message-time-new">
                                                        {formatTime(msg.created_at)}
                                                    </span>
                                                    {msg.sender_type === 'admin' && !msg.is_read && (
                                                        <span className="unread-dot" title="Непрочитано"></span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                        <div ref={messagesEndRef} className="messages-end" />
                    </div>
                )}
            </div>

            {/* Поле ввода - ВСЕГДА ВИДИМОЕ */}
            <div className="chat-input-section-new">
                <div className="input-wrapper-new">
                    <div className="input-container">
                        <textarea
                            ref={inputRef}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Введите сообщение..."
                            disabled={isSending}
                            rows={1}
                            className="chat-input-new"
                        />
                        {newMessage.trim() && (
                            <button
                                className="clear-input-btn"
                                onClick={() => setNewMessage('')}
                                title="Очистить"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isSending}
                        className="chat-send-btn-new"
                        title="Отправить сообщение"
                    >
                        {isSending ? (
                            <div className="send-spinner"></div>
                        ) : (
                            <svg className="send-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                        )}
                    </button>
                </div>
                
                {error && (
                    <div className="chat-error-message">
                        <span className="error-icon-small">⚠️</span>
                        <span className="error-text-small">{error}</span>
                    </div>
                )}
                
                <div className="chat-hint-new">
                    <span className="hint-icon">💡</span>
                    <span className="hint-text">
                        Нажмите Enter для отправки, Shift+Enter для новой строки
                    </span>
                </div>
            </div>
        </div>
    );
}

export default SupportChat;