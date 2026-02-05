import { useState, useEffect, useRef, useMemo } from 'react';
import './SupportChat.css';

function SupportChat({ orderId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);

  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const updateIntervalRef = useRef(null);
  const fileInputRef = useRef(null);

  // ===== API BASE =====
  // Всегда бьём в тот же домен, где открыт фронт (tethrab.shop)
  const API_BASE = useMemo(() => {
    // если вдруг ты открываешь локально в дев-режиме:
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://127.0.0.1:3000';
    }
    return window.location.origin; // https://tethrab.shop
  }, []);

  // ===== get userId =====
  useEffect(() => {
    const getUserData = () => {
      try {
        if (window.Telegram?.WebApp) {
          const tgUser = window.Telegram.WebApp?.initDataUnsafe?.user;
          if (tgUser?.id) return tgUser.id.toString();
        }

        const savedTelegramUser = localStorage.getItem('telegramUser');
        if (savedTelegramUser) {
          const parsed = JSON.parse(savedTelegramUser);
          if (parsed?.id) return parsed.id.toString();
        }

        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed?.telegramId) return parsed.telegramId.toString();
          if (parsed?.id) return parsed.id.toString();
        }

        const urlParams = new URLSearchParams(window.location.search);
        const testUserId = urlParams.get('test_user_id');
        if (testUserId) return testUserId;
      } catch (e) {
        console.error('❌ Ошибка получения ID:', e);
      }
      return null;
    };

    const id = getUserData();
    console.log('👤 userId in chat:', id);
    setUserId(id);
  }, []);

  // ===== helpers =====
  const safeJsonParse = (str) => {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  };

  const parseMessageContent = (msg) => {
    const content = msg?.message ?? '';
    const parsed = safeJsonParse(content);
    if (parsed && (parsed.text || parsed.attachments)) {
      return { text: parsed.text || '', attachments: parsed.attachments || [] };
    }
    return { text: content, attachments: [] };
  };

  const getMessageType = (msg) => {
    const t = msg?.sender_type || msg?.senderType;
    return t === 'user' ? 'user' : 'admin';
  };

  const formatTime = (dateString) => {
    try {
      if (!dateString) return '';
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return '';
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '';
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      if (d.toDateString() === today.toDateString()) return 'Сегодня';
      if (d.toDateString() === yesterday.toDateString()) return 'Вчера';

      return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    } catch {
      return '';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

  // ===== API calls =====
  const apiGetMessages = async (oid) => {
    const r = await fetch(`${API_BASE}/chat/messages/${encodeURIComponent(oid)}`, { method: 'GET' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json(); // ожидаем массив сообщений
  };

  const apiMarkRead = async (oid, uid) => {
    await fetch(`${API_BASE}/chat/mark-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: oid, userId: uid })
    });
  };

  const apiSendMessage = async (oid, uid, senderType, message) => {
    const r = await fetch(`${API_BASE}/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: oid, userId: uid, senderType, message })
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json(); // {success, message}
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('orderId', orderId);
    formData.append('userId', userId);

    const r = await fetch(`${API_BASE}/chat/upload`, {
      method: 'POST',
      body: formData
    });

    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      throw new Error(`Upload failed: HTTP ${r.status} ${txt}`);
    }

    const result = await r.json();
    if (!result.success) throw new Error(result.error || 'Upload failed');

    // result.url типа "/uploads/xxx.png"
    const url = result.url?.startsWith('http') ? result.url : `${API_BASE}${result.url}`;
    return {
      url,
      name: result.name || file.name,
      type: result.type || file.type,
      size: result.size || file.size
    };
  };

  // ===== load messages =====
  const loadMessages = async (silent = false) => {
    if (!orderId || !userId) return;

    try {
      if (!silent) setIsLoading(true);

      const loaded = await apiGetMessages(orderId);

      setMessages((prev) => {
        const prevStr = JSON.stringify(prev);
        const newStr = JSON.stringify(loaded);
        return prevStr !== newStr ? loaded : prev;
      });

      setError('');
      // отметка прочитанного — не критично
      apiMarkRead(orderId, userId).catch(() => {});
    } catch (e) {
      console.error('❌ loadMessages error:', e);
      if (!silent) setError('Не удалось загрузить сообщения');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // auto refresh
  useEffect(() => {
    if (!orderId || !userId) return;

    loadMessages(false);
    updateIntervalRef.current = setInterval(() => loadMessages(true), 15000);

    return () => {
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
    };
  }, [orderId, userId]); // eslint-disable-line

  // scroll to end
  useEffect(() => {
    if (isLoading) return;
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 80);
  }, [messages, isLoading]);

  // focus input on open
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  // ===== attachments =====
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || []);
    const maxSize = 10 * 1024 * 1024;
    const images = files
      .filter((f) => f.size <= maxSize)
      .filter((f) => f.type?.startsWith('image/'));

    if (images.length !== files.length) {
      setError('Можно загружать только изображения до 10MB (JPG/PNG/GIF)');
    }

    const newAttachments = images.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadProgress: 0
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => {
      const next = [...prev];
      if (next[index]?.preview) URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  };

  useEffect(() => {
    return () => {
      attachments.forEach((a) => a.preview && URL.revokeObjectURL(a.preview));
    };
  }, [attachments]);

  // ===== send message =====
  const handleSendMessage = async () => {
    const hasText = newMessage.trim().length > 0;
    const hasAttachments = attachments.length > 0;
    if (!hasText && !hasAttachments) return;

    if (!orderId || !userId) {
      setError('Не удалось определить пользователя');
      return;
    }
    if (isSending || isUploading) return;

    try {
      setIsSending(true);
      setIsUploading(true);
      setError('');

      let uploadedFiles = [];

      if (hasAttachments) {
        for (let i = 0; i < attachments.length; i++) {
          const fileData = await uploadFile(attachments[i].file);
          uploadedFiles.push(fileData);

          setAttachments((prev) => {
            const next = [...prev];
            next[i] = { ...next[i], uploadProgress: 100, uploaded: true };
            return next;
          });
        }
      }

      const payload = {
        text: newMessage.trim(),
        attachments: uploadedFiles
      };

      const result = await apiSendMessage(orderId, userId, 'user', JSON.stringify(payload));

      if (result?.success && result?.message) {
        setMessages((prev) => [...prev, result.message]);
        setNewMessage('');
        setAttachments([]);
        setTimeout(() => inputRef.current?.focus(), 100);
        setTimeout(() => loadMessages(true), 800);
      } else {
        setError(result?.error || 'Ошибка отправки сообщения');
      }
    } catch (e) {
      console.error('❌ send error:', e);
      setError(e.message || 'Ошибка отправки сообщения');
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const groupMessagesByDate = () => {
    const groups = {};
    messages.forEach((msg, index) => {
      const dateKey = formatDate(msg.created_at);
      if (!groups[dateKey]) groups[dateKey] = [];

      const prev = messages[index - 1];
      let marginTop = 'normal';

      if (prev) {
        const prevTime = new Date(prev.created_at).getTime();
        const curTime = new Date(msg.created_at).getTime();
        const diff = (curTime - prevTime) / 1000;
        const sameSender = (prev.sender_type || prev.senderType) === (msg.sender_type || msg.senderType);

        if (sameSender && diff < 60) marginTop = 'small';
        else if (diff > 300) marginTop = 'large';
      }

      groups[dateKey].push({ ...msg, marginTop });
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate();

  const handleManualRefresh = () => loadMessages(false);

  return (
    <div className="support-chat-new">
      <div className="chat-header-new">
        <div className="chat-header-content">
          <div className="chat-title-section">
            <button className="chat-back-btn" onClick={onClose} aria-label="Назад">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="chat-title-icon">💬</div>
            <div className="chat-title-texts">
              <h3 className="chat-title-new">Чат с оператором</h3>
              <p className="chat-order-id">Ордер #{(orderId || '').substring(0, 16)}...</p>
            </div>
          </div>

          <div className="chat-header-actions">
            <button className="chat-refresh-btn" onClick={handleManualRefresh} title="Обновить" disabled={isLoading}>
              {isLoading ? (
                <div className="refresh-spinner" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C15.3019 3 18.1885 4.77814 19.7545 7.42909"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path d="M21 3V7.5H16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            <button className="chat-close-btn-new" onClick={onClose} aria-label="Закрыть чат">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="chat-messages-container-new">
        {isLoading && messages.length === 0 ? (
          <div className="chat-loading-new">
            <div className="chat-spinner-new" />
            <p className="chat-loading-text">Загрузка сообщений...</p>
          </div>
        ) : error ? (
          <div className="chat-error-new">
            <div className="error-icon">⚠️</div>
            <p className="error-text">{error}</p>
            <button className="retry-btn-new" onClick={() => loadMessages(false)}>
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

                {dateMessages.map((msg, idx) => {
                  const messageType = getMessageType(msg);
                  const content = parseMessageContent(msg);

                  return (
                    <div
                      key={msg.id || `${msg.created_at}_${idx}`}
                      className={`chat-message-new ${messageType}-message-new message-margin-${msg.marginTop}`}
                    >
                      <div className="message-bubble">
                        <div className="message-content-new">
                          {content.text && <p className="message-text">{content.text}</p>}

                          {content.attachments?.length > 0 && (
                            <div className="message-attachments">
                              {content.attachments.map((a, i) => (
                                <div key={i} className="attachment-item">
                                  {a.type?.startsWith('image/') ? (
                                    <div className="attachment-image">
                                      <img
                                        src={a.url}
                                        alt={a.name || `Вложение ${i + 1}`}
                                        className="attachment-preview"
                                        onClick={() => window.open(a.url, '_blank')}
                                      />
                                      <div className="attachment-info">
                                        <span className="attachment-name">{a.name}</span>
                                        <span className="attachment-size">{formatFileSize(a.size)}</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="attachment-file">
                                      <div className="file-icon">📎</div>
                                      <div className="file-info">
                                        <span className="file-name">{a.name}</span>
                                        <span className="file-size">{formatFileSize(a.size)}</span>
                                      </div>
                                      <a href={a.url} target="_blank" rel="noopener noreferrer" className="download-btn">
                                        Скачать
                                      </a>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="message-meta">
                            <span className="message-time-new">{formatTime(msg.created_at)}</span>
                          </div>
                        </div>

                        {idx === dateMessages.length - 1 && (
                          <div className="message-sender">{messageType === 'user' ? 'Вы' : 'Оператор'}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            <div ref={messagesEndRef} className="messages-end" />
          </div>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="attachments-preview">
          <div className="attachments-header">
            <span className="attachments-title">Вложения ({attachments.length})</span>
            <button className="clear-attachments-btn" onClick={() => setAttachments([])} title="Удалить все вложения">
              ✕
            </button>
          </div>

          <div className="attachments-list">
            {attachments.map((a, i) => (
              <div key={i} className="attachment-preview-item">
                <div className="preview-image-container">
                  <img src={a.preview} alt={a.name} className="preview-image" />
                </div>

                <button className="remove-attachment-btn" onClick={() => removeAttachment(i)} title="Удалить">
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="chat-input-section-new">
        <div className="input-wrapper-new">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            multiple
            style={{ display: 'none' }}
          />

          <button
            className="attach-file-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Прикрепить файл"
            disabled={isUploading}
            type="button"
          >
            {isUploading ? <div className="upload-spinner" /> : '📎'}
          </button>

          <div className="input-container">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Введите сообщение..."
              disabled={isSending || isUploading}
              rows={1}
              className="chat-input-new"
            />
            {newMessage.trim() && (
              <button
                className="clear-input-btn"
                onClick={() => setNewMessage('')}
                title="Очистить"
                type="button"
                disabled={isSending || isUploading}
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={handleSendMessage}
            disabled={(!newMessage.trim() && attachments.length === 0) || isSending || isUploading}
            className="chat-send-btn-new"
            title="Отправить"
            type="button"
          >
            {isSending || isUploading ? <div className="send-spinner" /> : '➤'}
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
          <span className="hint-text">Enter — отправить. Можно прикрепить изображения</span>
        </div>
      </div>
    </div>
  );
}

export default SupportChat;
