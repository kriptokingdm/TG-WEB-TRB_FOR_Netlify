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
    
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const chatContainerRef = useRef(null);
    const updateIntervalRef = useRef(null);
    
    // Получаем ID пользователя
    useEffect(() => {
        const getUserData = () => {
            try {
                // 1. Telegram Web App
                if (window.Telegram?.WebApp) {
                    const tg = window.Telegram.WebApp;
                    const tgUser = tg.initDataUnsafe?.user;
                    if (tgUser?.id) {
                        return tgUser.id.toString();
                    }
                }
                
                // 2. LocalStorage
                const savedTelegramUser = localStorage.getItem('telegramUser');
                if (savedTelegramUser) {
                    const parsed = JSON.parse(savedTelegramUser);
                    if (parsed?.id) {
                        return parsed.id.toString();
                    }
                }
                
                // 3. Current user
                const savedUser = localStorage.getItem('currentUser');
                if (savedUser) {
                    const parsed = JSON.parse(savedUser);
                    if (parsed?.telegramId) {
                        return parsed.telegramId.toString();
                    }
                    if (parsed?.id) {
                        return parsed.id.toString();
                    }
                }
                
                // 4. Test ID from URL
                const urlParams = new URLSearchParams(window.location.search);
                const testUserId = urlParams.get('test_user_id');
                if (testUserId) {
                    return testUserId;
                }
                
            } catch (error) {
                console.error('❌ Ошибка получения ID:', error);
            }
            return null;
        };
        
        const id = getUserData();
        setUserId(id);
    }, []);

    // Загрузка сообщений
    const loadMessages = async (silent = false) => {
        if (!orderId || !userId) {
            return;
        }
        
        try {
            if (!silent) {
                setIsLoading(true);
            }
            
            const loadedMessages = await ChatApi.getMessages(orderId);
            
            // Обновляем только если сообщения изменились
            setMessages(prev => {
                if (JSON.stringify(prev) !== JSON.stringify(loadedMessages)) {
                    return loadedMessages;
                }
                return prev;
            });
            
            // Помечаем как прочитанные (игнорируем ошибки)
            try {
                await ChatApi.markAsRead(orderId, userId);
            } catch (markError) {
                // Игнорируем ошибку отметки как прочитанного
            }
            
            setError('');
        } catch (error) {
            console.error('❌ Error loading messages:', error);
            if (!silent) {
                setError('Не удалось загрузить сообщения');
            }
        } finally {
            if (!silent) {
                setIsLoading(false);
            }
        }
    };

    // Автообновление сообщений - РЕЖЕ!
    useEffect(() => {
        if (!orderId || !userId) {
            return;
        }
        
        // Первоначальная загрузка
        loadMessages();
        
        // Устанавливаем интервал на 30 секунд вместо 5
        updateIntervalRef.current = setInterval(() => {
            loadMessages(true); // silent update
        }, 30000); // 30 секунд
        
        return () => {
            if (updateIntervalRef.current) {
                clearInterval(updateIntervalRef.current);
            }
        };
    }, [orderId, userId]);

    // Прокрутка к последнему сообщению при загрузке
    useEffect(() => {
        if (messages.length > 0 && !isLoading) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'end'
                });
            }, 100);
        }
    }, [messages, isLoading]);

    // Прокрутка вниз при отправке нового сообщения
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'end'
                });
            }, 50);
        }
    }, [messages.length]);

    // Отправка сообщения
    const handleSendMessage = async () => {
        if (!newMessage.trim()) {
            return;
        }
        
        if (!orderId || !userId) {
            setError('Не удалось определить пользователя');
            return;
        }
        
        if (isSending) {
            return;
        }
        
        const messageText = newMessage.trim();
        
        try {
            setIsSending(true);
            setError('');
            
            const result = await ChatApi.sendMessage(
                orderId,
                userId,
                'user',
                messageText
            );
            
            if (result.success && result.message) {
                // Добавляем новое сообщение в список локально
                setMessages(prev => [...prev, result.message]);
                setNewMessage('');
                
                // Фокус на поле ввода
                setTimeout(() => {
                    if (inputRef.current) {
                        inputRef.current.focus();
                    }
                }, 100);
                
                // Обновляем сообщения через 2 секунды
                setTimeout(() => {
                    loadMessages(true);
                }, 2000);
                
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
                    month: 'long'
                });
            }
        } catch (e) {
            return '';
        }
    };

    // Определяем, является ли сообщение от текущего пользователя
    const isUserMessage = (msg) => {
        return msg.sender_id === userId || msg.sender_type === 'user';
    };

    // Получаем имя отправителя для отображения
    const getSenderDisplayName = (msg) => {
        if (msg.sender_id === userId) {
            return 'Вы';
        }
        
        switch(msg.sender_type) {
            case 'user':
                return 'Пользователь';
            case 'admin':
                return 'Оператор';
            case 'system':
                return 'Система';
            default:
                return msg.sender_id === userId ? 'Вы' : 'Оператор';
        }
    };

    // Группировка сообщений по датам
    const groupMessagesByDate = () => {
        const groups = {};
        messages.forEach((msg, index) => {
            const date = formatDate(msg.created_at);
            if (!groups[date]) {
                groups[date] = [];
            }
            
            // Добавляем время между сообщениями для определения отступа
            const prevMsg = messages[index - 1];
            let marginTop = 'normal';
            
            if (prevMsg) {
                const prevTime = new Date(prevMsg.created_at);
                const currentTime = new Date(msg.created_at);
                const timeDiff = (currentTime - prevTime) / 1000; // разница в секундах
                const isSameSender = prevMsg.sender_id === msg.sender_id;
                
                if (isSameSender && timeDiff < 60) { // меньше минуты между сообщениями
                    marginTop = 'small';
                } else if (timeDiff > 300) { // больше 5 минут
                    marginTop = 'large';
                }
            }
            
            groups[date].push({
                ...msg,
                marginTop,
                isUser: isUserMessage(msg)
            });
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
        }, 300);
    }, []);

    // Ручное обновление сообщений
    const handleManualRefresh = () => {
        loadMessages();
    };

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
                                Ордер #{orderId?.substring(0, 16)}...
                            </p>
                        </div>
                    </div>
                    <div className="chat-header-actions">
                        <button 
                            className="chat-refresh-btn"
                            onClick={handleManualRefresh}
                            title="Обновить"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="refresh-spinner"></div>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C15.3019 3 18.1885 4.77814 19.7545 7.42909" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    <path d="M21 3V7.5H16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            )}
                        </button>
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
            </div>

            {/* Основной контейнер сообщений */}
            <div className="chat-messages-container-new" ref={chatContainerRef}>
                {isLoading && messages.length === 0 ? (
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
                            onClick={() => loadMessages()}
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
                                {dateMessages.map((msg, msgIndex) => (
                                    <div 
                                        key={msg.id} 
                                        className={`chat-message-new ${
                                            msg.isUser ? 'user-message-new' : 'admin-message-new'
                                        } ${msg.sender_type === 'system' ? 'system-message-new' : ''} 
                                        message-margin-${msg.marginTop}`}
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
                                            {msgIndex === dateMessages.length - 1 && (
                                                <div className="message-sender">
                                                    {getSenderDisplayName(msg)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                        <div ref={messagesEndRef} className="messages-end" />
                    </div>
                )}
            </div>

            {/* Поле ввода */}
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
                                type="button"
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
                        type="button"
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
                        Нажмите Enter для отправки
                    </span>
                </div>
            </div>
        </div>
    );
}

export default SupportChat;