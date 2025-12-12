// ChatApi.js
const API_URL = 'https://tethrab.shop';

export const ChatApi = {
    async getMessages(orderId) {
        try {
            console.log(`📨 Запрос сообщений для: ${orderId}`);
            const response = await fetch(`${API_URL}/chat/messages/${orderId}`);
            const data = await response.json();
            
            if (data.success) {
                return data.messages || [];
            } else {
                console.error('❌ Ошибка получения сообщений:', data.error);
                return [];
            }
        } catch (error) {
            console.error('❌ Ошибка сети:', error);
            return [];
        }
    },

    async sendMessage(orderId, senderId, senderType, message) {
        try {
            console.log(`📤 Отправка сообщения:`, { orderId, senderId, senderType, message });
            
            const response = await fetch(`${API_URL}/chat/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId,
                    senderId,
                    senderType,
                    message
                })
            });
            
            return await response.json();
        } catch (error) {
            console.error('❌ Ошибка отправки:', error);
            return { success: false, error: 'Ошибка сети' };
        }
    },

    async markAsRead(orderId, userId) {
        try {
            // Можно добавить эндпоинт для отметки прочитанных сообщений
            await fetch(`${API_URL}/chat/mark-read`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orderId, userId })
            });
        } catch (error) {
            console.error('❌ Ошибка отметки прочитанного:', error);
        }
    }
};