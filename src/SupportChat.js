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

    // Загрузка сообщений
    const loadMessages = async () => {
        if (!orderId || !userId) return;
        
        try {
            setIsLoading(true);
            const loadedMessages = await ChatApi.getMessages(orderId);
            setMessages(loadedMessages);
            
            // Помечаем сообщения админа как прочитанные
            await ChatApi.markAsRead(orderId, userId);
            
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
            
            const result = await ChatApi.sendMessage(
                orderId,
                userId,
                'user',
                newMessage.trim()
            );
            
            if (result.success) {
                setNewMessage('');
                // Добавляем сообщение в список
                setMessages(prev => [...prev, result.message]);
            } else {
                setError(result.error || 'Ошибка отправки');
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
                        <p className="chat-subtitle">Ордер #{orderId}</p>
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
            </div>
        </div>
    );
}

export default SupportChat;