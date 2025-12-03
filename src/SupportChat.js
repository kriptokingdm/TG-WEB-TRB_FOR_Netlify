import { useState, useEffect, useRef } from 'react';
import './SupportChat.css';

const SupportChat = ({ orderId, onClose, exchangeData }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null);

    // Используем HTTPS
    const serverUrl = 'https://87.242.106.114.sslip.io';

    useEffect(() => {
        console.log('💬 SupportChat для заявки:', orderId);
        loadChatMessages();
        const interval = setInterval(loadChatMessages, 3000);
        return () => clearInterval(interval);
    }, [orderId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadChatMessages = async () => {
        try {
            const response = await fetch(`${serverUrl}/api/chat/messages/${orderId}`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setMessages(data.messages || []);
                    setError('');
                }
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки чата:', error);
            // Демо-сообщения
            if (messages.length === 0) {
                setMessages([
                    {
                        id: 1,
                        text: '✅ Заявка создана успешно! Ожидайте, оператор скоро свяжется.',
                        sender: 'support',
                        timestamp: new Date().toISOString()
                    },
                    {
                        id: 2,
                        text: 'Оператор свяжется с вами в течение 5 минут.',
                        sender: 'support',
                        timestamp: new Date().toISOString()
                    }
                ]);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim()) return;
        
        try {
            const response = await fetch(`${serverUrl}/api/chat/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderId: orderId,
                    message: newMessage.trim(),
                    userId: 'current_user'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Добавляем сообщение в локальный список
                    const newMsg = {
                        id: Date.now(),
                        text: newMessage.trim(),
                        sender: 'user',
                        timestamp: new Date().toISOString()
                    };
                    
                    setMessages(prev => [...prev, newMsg]);
                    setNewMessage('');
                }
            }
        } catch (error) {
            console.error('❌ Ошибка отправки:', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="support-chat-overlay">
            <div className="support-chat-container">
                <div className="chat-header">
                    <div className="chat-header-info">
                        <h3>💬 Чат поддержки</h3>
                        <div className="order-info">
                            <span className="order-id">Заявка: #{orderId}</span>
                            {exchangeData && (
                                <span className="order-details">
                                    {exchangeData.type === 'buy' ? 'Покупка' : 'Продажа'} {exchangeData.amount} {exchangeData.type === 'buy' ? 'RUB' : 'USDT'}
                                </span>
                            )}
                        </div>
                    </div>
                    <button className="close-chat-btn" onClick={onClose}>✕</button>
                </div>

                <div className="chat-messages">
                    {isLoading ? (
                        <div className="loading-messages">
                            <div className="loading-spinner">⏳</div>
                            <p>Загрузка сообщений...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="no-messages">
                            <p>Нет сообщений</p>
                            <p>Начните общение с поддержкой</p>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div key={message.id} className={`message ${message.sender === 'user' ? 'user' : 'support'}`}>
                                <div className="message-content">
                                    <div className="message-text">{message.text}</div>
                                    <div className="message-time">{formatTime(message.timestamp)}</div>
                                </div>
                                <div className="message-sender">
                                    {message.sender === 'user' ? '👤 Вы' : '🛟 Поддержка'}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-container">
                    <div className="chat-input-wrapper">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Введите сообщение..."
                            className="chat-input"
                            rows="1"
                        />
                        <button onClick={sendMessage} disabled={!newMessage.trim()} className="send-button">
                            📤
                        </button>
                    </div>
                    <div className="chat-hint">
                        Нажмите Enter для отправки, Shift+Enter для новой строки
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupportChat;