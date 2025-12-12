// Обновленный SupportChat.js
import React, { useState, useEffect, useRef } from 'react';
import './SupportChat.css';

const SupportChat = ({ orderId, onClose }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const updateIntervalRef = useRef(null);
  const isMountedRef = useRef(true);
  
  const API_URL = 'https://87.242.106.114';

  // Функция для загрузки сообщений
  const loadMessages = async () => {
    if (!isMountedRef.current || !orderId) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/chat/messages/${orderId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages || []);
      } else {
        console.error('Ошибка загрузки сообщений:', data.error);
      }
      
    } catch (error) {
      console.error('❌ Ошибка загрузки сообщений:', error.message);
      
      // При ошибке показываем пустой список
      setMessages([]);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Инициализация
  useEffect(() => {
    isMountedRef.current = true;
    
    if (orderId) {
      loadMessages();
      
      // Обновляем сообщения каждые 15 секунд
      updateIntervalRef.current = setInterval(loadMessages, 15000);
    }
    
    return () => {
      isMountedRef.current = false;
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [orderId]);

  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim() || !orderId) return;
    
    const text = message.trim();
    setMessage('');
    setIsTyping(true);
    
    try {
      const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const telegramUser = JSON.parse(localStorage.getItem('telegramUser') || '{}');
      
      const userId = userData?.id || `user_${telegramUser.id || 'anonymous'}`;
      const username = userData?.username || telegramUser.username || 'Пользователь';
      
      const response = await fetch(`${API_URL}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderId,
          message: text,
          senderId: userId,
          senderName: username
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Добавляем сообщение в локальный список
        const newMsg = {
          id: data.messageId || Date.now(),
          text: text,
          senderName: username,
          isAdmin: false,
          timestamp: data.timestamp || new Date().toISOString()
        };
        
        setMessages(prev => [...prev, newMsg]);
        
        // Обновляем сообщения через 2 секунды
        setTimeout(() => {
          if (isMountedRef.current) {
            loadMessages();
          }
        }, 2000);
      } else {
        console.error('Ошибка отправки:', data.error);
        alert('Ошибка отправки сообщения: ' + (data.error || 'Неизвестная ошибка'));
        setMessage(text);
      }
    } catch (error) {
      console.error('❌ Ошибка отправки:', error);
      alert('Ошибка сети при отправке сообщения');
      setMessage(text);
    } finally {
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
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return '';
    }
  };

  const formatDate = (timestamp) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('ru-RU', {
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
          
          <div className="chat-title">
            <div className="chat-order-id">Ордер #{orderId}</div>
            <div className="chat-subtitle">Чат с оператором</div>
          </div>
        </div>
        <button className="chat-close-btn" onClick={onClose}>
          ✕ Закрыть
        </button>
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
              const isAdmin = msg.isAdmin;
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const showDate = !prevMsg || 
                formatDate(prevMsg.timestamp) !== formatDate(msg.timestamp);
              
              return (
                <React.Fragment key={msg.id || index}>
                  {showDate && (
                    <div className="chat-date-divider">
                      <span>{formatDate(msg.timestamp)}</span>
                    </div>
                  )}
                  
                  <div className={`chat-message ${isAdmin ? 'operator-message' : 'user-message'}`}>
                    <div className="message-content">
                      <div className="message-sender">
                        {isAdmin ? (msg.senderName || 'Оператор') : (msg.senderName || 'Вы')}
                      </div>
                      <div className="message-text">{msg.text}</div>
                      <div className="message-time">{formatTime(msg.timestamp)}</div>
                    </div>
                    <div className={`message-avatar ${isAdmin ? 'operator-avatar' : 'user-avatar'}`}>
                      {isAdmin ? '👷' : '👤'}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
        
        {isTyping && (
          <div className="operator-typing">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className="typing-text">Отправка...</div>
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