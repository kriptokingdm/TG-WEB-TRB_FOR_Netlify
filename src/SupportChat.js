// SupportChat.js - обновленный с красивым дизайном
import React, { useState, useEffect } from 'react';
import './History.css';

const SupportChat = ({ orderId, onClose }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const serverUrl = 'https://87.242.106.114.sslip.io';

  // Загружаем сообщения
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        
        // 1. Сначала пробуем загрузить из API чата
        const chatResponse = await fetch(`${serverUrl}/api/chat/messages/${orderId}`);
        if (chatResponse.ok) {
          const chatData = await chatResponse.json();
          if (chatData.success && Array.isArray(chatData.messages)) {
            const formattedMessages = chatData.messages.map(msg => ({
              id: msg.id,
              text: msg.text,
              sender: msg.isAdmin ? 'operator' : 'user',
              timestamp: msg.timestamp,
              operator: msg.isAdmin ? msg.senderName : null,
              isAdmin: msg.isAdmin
            }));
            setMessages(formattedMessages);
            return;
          }
        }
        
        // 2. Если API чата не работает, пробуем через уведомления
        const userData = JSON.parse(localStorage.getItem('currentUser'));
        if (userData && userData.id) {
          const ordersResponse = await fetch(`${serverUrl}/api/user-orders/${userData.id}`);
          if (ordersResponse.ok) {
            const ordersData = await ordersResponse.json();
            if (ordersData.success && Array.isArray(ordersData.orders)) {
              const order = ordersData.orders.find(o => o.id === orderId);
              if (order && order.notifications && Array.isArray(order.notifications)) {
                const notificationMessages = order.notifications.map(notif => ({
                  id: notif.id,
                  text: notif.text,
                  sender: 'operator',
                  timestamp: notif.timestamp,
                  operator: notif.from,
                  isAdmin: true
                }));
                setMessages(notificationMessages);
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ Ошибка загрузки сообщений:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
    
    // Обновляем сообщения каждые 10 секунд
    const intervalId = setInterval(loadMessages, 10000);
    return () => clearInterval(intervalId);
  }, [orderId]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    setIsTyping(true);
    
    try {
      const userData = JSON.parse(localStorage.getItem('currentUser'));
      const userId = userData?.id || 'anonymous';
      const username = userData?.username || 'Пользователь';
      
      const response = await fetch(`${serverUrl}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderId,
          message: message.trim(),
          senderId: userId,
          senderName: username
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const newMsg = {
            id: Date.now(),
            text: message.trim(),
            sender: 'user',
            timestamp: new Date().toISOString(),
            isAdmin: false
          };
          
          setMessages(prev => [...prev, newMsg]);
          setMessage('');
        }
      }
    } catch (error) {
      console.error('❌ Ошибка отправки:', error);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return '';
    }
  };

  const formatDate = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="support-chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-back-btn" onClick={onClose}>
            ←
          </div>
          <div className="chat-title">
            <div className="chat-order-id">Заявка #{orderId}</div>
            <div className="chat-subtitle">Чат с оператором</div>
          </div>
        </div>
        <div className="chat-header-right">
          <button className="chat-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages-container">
        {loading && messages.length === 0 ? (
          <div className="chat-loading">
            <div className="loading-spinner"></div>
            <p>Загрузка сообщений...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <div className="chat-empty-title">Нет сообщений</div>
            <div className="chat-empty-text">
              Напишите оператору, он ответит в ближайшее время
            </div>
          </div>
        ) : (
          <div className="chat-messages">
            {messages.map((msg, index) => {
              const isUser = msg.sender === 'user';
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const showDate = !prevMsg || 
                formatDate(prevMsg.timestamp) !== formatDate(msg.timestamp);
              
              return (
                <React.Fragment key={msg.id}>
                  {showDate && (
                    <div className="chat-date-divider">
                      <span>{formatDate(msg.timestamp)}</span>
                    </div>
                  )}
                  
                  <div className={`chat-message ${isUser ? 'user-message' : 'operator-message'}`}>
                    <div className="message-content">
                      <div className="message-text">{msg.text}</div>
                      <div className="message-meta">
                        {!isUser && msg.operator && (
                          <span className="message-operator">@ {msg.operator}</span>
                        )}
                        <span className="message-time">{formatTime(msg.timestamp)}</span>
                      </div>
                    </div>
                    <div className={`message-avatar ${isUser ? 'user-avatar' : 'operator-avatar'}`}>
                      {isUser ? '👤' : '👷'}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
        
        {isTyping && (
          <div className="operator-typing">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className="typing-text">Оператор печатает...</div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <textarea
            className="chat-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Напишите сообщение оператору..."
            disabled={loading}
            rows={1}
          />
          <button
            className={`chat-send-btn ${!message.trim() || loading ? 'disabled' : ''}`}
            onClick={sendMessage}
            disabled={!message.trim() || loading}
          >
            {loading ? '⏳' : '📤'}
          </button>
        </div>
        <div className="chat-hint">
          Нажмите Enter для отправки
        </div>
      </div>
    </div>
  );
};

export default SupportChat;