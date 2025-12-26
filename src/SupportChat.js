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
    const [attachments, setAttachments] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const chatContainerRef = useRef(null);
    const updateIntervalRef = useRef(null);
    const fileInputRef = useRef(null);
    
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
        console.log('👤 ID пользователя в чате:', id);
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

    // Автообновление сообщений
    useEffect(() => {
        if (!orderId || !userId) {
            return;
        }
        
        // Первоначальная загрузка
        loadMessages();
        
        // Устанавливаем интервал
        updateIntervalRef.current = setInterval(() => {
            loadMessages(true);
        }, 30000);
        
        return () => {
            if (updateIntervalRef.current) {
                clearInterval(updateIntervalRef.current);
            }
        };
    }, [orderId, userId]);

    // Прокрутка к последнему сообщению
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

    // Обработка выбора файлов
    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        
        // Проверяем размер файлов (максимум 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        const validFiles = files.filter(file => file.size <= maxSize);
        
        if (validFiles.length !== files.length) {
            setError('Некоторые файлы превышают максимальный размер 10MB');
        }
        
        // Проверяем тип файлов (только изображения)
        const imageFiles = validFiles.filter(file => 
            file.type.startsWith('image/')
        );
        
        if (imageFiles.length !== validFiles.length) {
            setError('Можно загружать только изображения (JPG, PNG, GIF)');
        }
        
        // Добавляем превью для изображений
        const newAttachments = imageFiles.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            name: file.name,
            size: file.size,
            type: file.type,
            uploadProgress: 0
        }));
        
        setAttachments(prev => [...prev, ...newAttachments]);
        
        // Очищаем input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Удаление вложения
    const removeAttachment = (index) => {
        setAttachments(prev => {
            const newAttachments = [...prev];
            // Освобождаем URL объекта
            if (newAttachments[index]?.preview) {
                URL.revokeObjectURL(newAttachments[index].preview);
            }
            newAttachments.splice(index, 1);
            return newAttachments;
        });
    };

    // Загрузка файла на сервер
    const uploadFile = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('orderId', orderId);
        formData.append('userId', userId);
        
        try {
            // Используем правильный URL в зависимости от окружения
            const isProduction = process.env.NODE_ENV === 'production';
            const baseUrl = isProduction 
                ? 'http://87.242.106.114:3002'  // Ваш IP сервера
                : 'http://localhost:3002';
            
            console.log('📤 Загрузка файла на:', baseUrl);
            
            const response = await fetch(`${baseUrl}/api/chat/upload`, {
                method: 'POST',
                body: formData,
                // Заголовки не нужны для FormData - браузер сам установит
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Возвращаем первый файл из массива или объект fileUrl
                const fileUrl = result.files && result.files[0] 
                    ? `${baseUrl}${result.files[0].url}`
                    : `${baseUrl}${result.fileUrl}`;
                return fileUrl;
            } else {
                throw new Error(result.error || 'Ошибка загрузки файла');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки файла:', error);
            throw error;
        }
    };

    // Отправка сообщения с вложениями
    const handleSendMessage = async () => {
        const hasText = newMessage.trim().length > 0;
        const hasAttachments = attachments.length > 0;
        
        if (!hasText && !hasAttachments) {
            return;
        }
        
        if (!orderId || !userId) {
            setError('Не удалось определить пользователя');
            return;
        }
        
        if (isSending || isUploading) {
            return;
        }
        
        try {
            setIsSending(true);
            setIsUploading(true);
            setError('');
            
            let uploadedFiles = [];
            
            // Загружаем файлы если есть
            if (hasAttachments) {
                for (let i = 0; i < attachments.length; i++) {
                    try {
                        const fileUrl = await uploadFile(attachments[i].file);
                        uploadedFiles.push({
                            url: fileUrl,
                            name: attachments[i].name,
                            type: attachments[i].type,
                            size: attachments[i].size
                        });
                        
                        // Обновляем прогресс
                        setAttachments(prev => {
                            const newAttachments = [...prev];
                            newAttachments[i] = {
                                ...newAttachments[i],
                                uploadProgress: 100,
                                uploaded: true
                            };
                            return newAttachments;
                        });
                    } catch (uploadError) {
                        console.error(`❌ Ошибка загрузки файла ${attachments[i].name}:`, uploadError);
                        throw new Error(`Не удалось загрузить файл: ${attachments[i].name}`);
                    }
                }
            }
            
            // Отправляем сообщение
            const messageData = {
                text: newMessage.trim(),
                attachments: uploadedFiles
            };
            
            const result = await ChatApi.sendMessage(
                orderId,
                userId,
                'user',
                JSON.stringify(messageData)
            );
            
            if (result.success && result.message) {
                // Добавляем новое сообщение в список локально
                setMessages(prev => [...prev, result.message]);
                setNewMessage('');
                setAttachments([]);
                
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
            setError(error.message || 'Ошибка отправки сообщения');
        } finally {
            setIsSending(false);
            setIsUploading(false);
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
            if (!dateString) return '';
            
            const date = new Date(dateString.replace(' ', 'T') + 'Z');
            
            if (isNaN(date.getTime())) return '';
            
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        } catch (error) {
            console.error('❌ Ошибка времени:', error);
            return '';
        }
    };

    // Форматирование даты
    const formatDate = (dateString) => {
        try {
            if (!dateString) return '';
            
            const date = new Date(dateString.replace(' ', 'T') + 'Z');
            if (isNaN(date.getTime())) return '';
            
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (date.toDateString() === today.toDateString()) {
                return 'Сегодня';
            } else if (date.toDateString() === yesterday.toDateString()) {
                return 'Вчера';
            } else {
                const day = date.getDate();
                const monthNames = [
                    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
                ];
                return `${day} ${monthNames[date.getMonth()]}`;
            }
        } catch (error) {
            console.error('❌ Ошибка даты:', error);
            return '';
        }
    };

    // Получение типа сообщения
    const getMessageType = (msg) => {
        if (!msg) return 'admin';
        const senderType = msg.sender_type || msg.senderType;
        return senderType === 'user' ? 'user' : 'admin';
    };

    // Получение имени отправителя
    const getSenderDisplayName = (msg) => {
        if (!msg) return 'Неизвестно';
        const senderType = msg.sender_type || msg.senderType;
        
        if (senderType === 'user') {
            return 'Вы';
        } else if (senderType === 'admin') {
            return 'Оператор';
        } else if (senderType === 'system') {
            return 'Система';
        } else {
            return 'Неизвестно';
        }
    };

    // Обработка сообщений с вложениями
    const parseMessageContent = (msg) => {
        try {
            const content = msg.message || '';
            
            // Проверяем, является ли сообщение JSON с вложениями
            try {
                const parsed = JSON.parse(content);
                if (parsed.text || parsed.attachments) {
                    return parsed;
                }
            } catch (e) {
                // Не JSON, возвращаем как обычный текст
            }
            
            return {
                text: content,
                attachments: []
            };
        } catch (error) {
            console.error('❌ Error parsing message:', error);
            return {
                text: msg.message || '',
                attachments: []
            };
        }
    };

    // Форматирование размера файла
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Группировка сообщений по датам
    const groupMessagesByDate = () => {
        const groups = {};
        messages.forEach((msg, index) => {
            const date = formatDate(msg.created_at);
            if (!groups[date]) {
                groups[date] = [];
            }
            
            const prevMsg = messages[index - 1];
            let marginTop = 'normal';
            
            if (prevMsg) {
                const prevTime = new Date(prevMsg.created_at);
                const currentTime = new Date(msg.created_at);
                const timeDiff = (currentTime - prevTime) / 1000;
                const isSameSender = prevMsg.sender_type === msg.sender_type;
                
                if (isSameSender && timeDiff < 60) {
                    marginTop = 'small';
                } else if (timeDiff > 300) {
                    marginTop = 'large';
                }
            }
            
            groups[date].push({
                ...msg,
                marginTop
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

    // Очистка URL объектов при размонтировании
    useEffect(() => {
        return () => {
            attachments.forEach(attachment => {
                if (attachment.preview) {
                    URL.revokeObjectURL(attachment.preview);
                }
            });
        };
    }, [attachments]);

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
                                {dateMessages.map((msg, msgIndex) => {
                                    const messageType = getMessageType(msg);
                                    const senderName = getSenderDisplayName(msg);
                                    const content = parseMessageContent(msg);
                                    
                                    return (
                                        <div 
                                            key={msg.id} 
                                            className={`chat-message-new ${messageType}-message-new message-margin-${msg.marginTop}`}
                                        >
                                            <div className="message-bubble">
                                                <div className="message-content-new">
                                                    {content.text && (
                                                        <p className="message-text">{content.text}</p>
                                                    )}
                                                    
                                                    {content.attachments && content.attachments.length > 0 && (
                                                        <div className="message-attachments">
                                                            {content.attachments.map((attachment, index) => (
                                                                <div key={index} className="attachment-item">
                                                                    {attachment.type.startsWith('image/') ? (
                                                                        <div className="attachment-image">
                                                                            <img 
                                                                                src={attachment.url} 
                                                                                alt={`Вложение ${index + 1}`}
                                                                                className="attachment-preview"
                                                                                onClick={() => window.open(attachment.url, '_blank')}
                                                                            />
                                                                            <div className="attachment-info">
                                                                                <span className="attachment-name">{attachment.name}</span>
                                                                                <span className="attachment-size">{formatFileSize(attachment.size)}</span>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="attachment-file">
                                                                            <div className="file-icon">📎</div>
                                                                            <div className="file-info">
                                                                                <span className="file-name">{attachment.name}</span>
                                                                                <span className="file-size">{formatFileSize(attachment.size)}</span>
                                                                            </div>
                                                                            <a 
                                                                                href={attachment.url} 
                                                                                target="_blank" 
                                                                                rel="noopener noreferrer"
                                                                                className="download-btn"
                                                                            >
                                                                                Скачать
                                                                            </a>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    
                                                    <div className="message-meta">
                                                        <span className="message-time-new">
                                                            {formatTime(msg.created_at)}
                                                        </span>
                                                        {messageType === 'admin' && !msg.is_read && (
                                                            <span className="unread-dot" title="Непрочитано"></span>
                                                        )}
                                                    </div>
                                                </div>
                                                {msgIndex === dateMessages.length - 1 && (
                                                    <div className="message-sender">
                                                        {senderName}
                                                    </div>
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

            {/* Предпросмотр вложений */}
            {attachments.length > 0 && (
                <div className="attachments-preview">
                    <div className="attachments-header">
                        <span className="attachments-title">Вложения ({attachments.length})</span>
                        <button 
                            className="clear-attachments-btn"
                            onClick={() => setAttachments([])}
                            title="Удалить все вложения"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="attachments-list">
                        {attachments.map((attachment, index) => (
                            <div key={index} className="attachment-preview-item">
                                {attachment.type.startsWith('image/') ? (
                                    <div className="preview-image-container">
                                        <img 
                                            src={attachment.preview} 
                                            alt={attachment.name}
                                            className="preview-image"
                                        />
                                        {attachment.uploadProgress < 100 && (
                                            <div className="upload-progress">
                                                <div 
                                                    className="progress-bar" 
                                                    style={{ width: `${attachment.uploadProgress}%` }}
                                                />
                                                <span className="progress-text">
                                                    {attachment.uploadProgress}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="preview-file">
                                        <div className="file-icon">📎</div>
                                        <div className="file-details">
                                            <span className="file-name">{attachment.name}</span>
                                            <span className="file-size">{formatFileSize(attachment.size)}</span>
                                        </div>
                                        {attachment.uploadProgress < 100 && (
                                            <div className="upload-progress">
                                                <div 
                                                    className="progress-bar" 
                                                    style={{ width: `${attachment.uploadProgress}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                                <button
                                    className="remove-attachment-btn"
                                    onClick={() => removeAttachment(index)}
                                    title="Удалить"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Поле ввода */}
            <div className="chat-input-section-new">
                <div className="input-wrapper-new">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        multiple
                        style={{ display: 'none' }}
                        id="file-input"
                    />
                    <button
                        className="attach-file-btn"
                        onClick={() => fileInputRef.current.click()}
                        title="Прикрепить файл"
                        disabled={isUploading}
                        type="button"
                    >
                        {isUploading ? (
                            <div className="upload-spinner"></div>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M14.5 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V7.5L14.5 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12 18V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M9 15H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        )}
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
                        title="Отправить сообщение"
                        type="button"
                    >
                        {isSending || isUploading ? (
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
                        {attachments.length > 0 
                            ? `Прикреплено ${attachments.length} файл(ов). Нажмите Enter для отправки` 
                            : 'Нажмите Enter для отправки. Можно прикрепить изображения'}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default SupportChat;