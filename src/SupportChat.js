// SupportChat.js - простой компонент для отправки сообщений оператору
import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Paper, Divider } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const SupportChat = ({ orderId, onClose }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const serverUrl = 'https://87.242.106.114.sslip.io';

  // Загружаем уведомления из заявки
  useEffect(() => {
    const loadOrderMessages = async () => {
      try {
        const response = await fetch(`${serverUrl}/api/user-orders/user_current`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const order = data.orders.find(o => o.id === orderId);
            if (order && order.notifications) {
              // Конвертируем уведомления в формат сообщений
              const notificationMessages = order.notifications.map(notif => ({
                id: notif.id,
                text: notif.text,
                sender: 'operator',
                timestamp: notif.timestamp,
                operator: notif.from
              }));
              
              setMessages(notificationMessages);
            }
          }
        }
      } catch (error) {
        console.error('❌ Ошибка загрузки уведомлений:', error);
      }
    };

    loadOrderMessages();
  }, [orderId]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    
    try {
      const response = await fetch(`${serverUrl}/api/send-message-to-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderId,
          message: message.trim(),
          userId: 'current_user'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Добавляем сообщение в список
          const newMsg = {
            id: Date.now(),
            text: message.trim(),
            sender: 'user',
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => [...prev, newMsg]);
          setMessage('');
        }
      }
    } catch (error) {
      console.error('❌ Ошибка отправки:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Box sx={{ 
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.paper'
    }}>
      {/* Заголовок */}
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6">
          💬 Чат заявки #{orderId}
        </Typography>
        <Button 
          onClick={onClose}
          size="small"
        >
          Закрыть
        </Button>
      </Box>

      {/* Сообщения */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}>
        {messages.length === 0 ? (
          <Typography 
            color="text.secondary" 
            align="center"
            sx={{ mt: 4 }}
          >
            Нет сообщений. Напишите оператору.
          </Typography>
        ) : (
          messages.map((msg) => (
            <Paper
              key={msg.id}
              sx={{
                p: 2,
                maxWidth: '80%',
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                bgcolor: msg.sender === 'user' ? 'primary.light' : 'grey.100',
                color: msg.sender === 'user' ? 'primary.contrastText' : 'text.primary',
                borderRadius: 2
              }}
            >
              <Typography variant="body2">
                {msg.text}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block',
                  mt: 1,
                  opacity: 0.7
                }}
              >
                {msg.sender === 'operator' && msg.operator ? `Оператор: @${msg.operator}` : 'Вы'}
                {' • '}
                {new Date(msg.timestamp).toLocaleTimeString('ru-RU', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Typography>
            </Paper>
          ))
        )}
      </Box>

      {/* Поле ввода */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Напишите сообщение оператору..."
            disabled={loading}
            size="small"
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            disabled={!message.trim() || loading}
            sx={{ minWidth: 'auto' }}
          >
            <SendIcon />
          </Button>
        </Box>
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ display: 'block', mt: 1 }}
        >
          Ваше сообщение будет отправлено оператору, который взял заявку в работу
        </Typography>
      </Box>
    </Box>
  );
};

export default SupportChat;