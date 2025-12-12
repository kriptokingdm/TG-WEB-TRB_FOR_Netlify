const API_URL = 'https://tethrab.shop';

export class ChatApi {
    // Получение истории сообщений
    static async getMessages(orderId) {
        try {
            const response = await fetch(`${API_URL}/chat/messages/${orderId}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            return data.success ? data.messages : [];
        } catch (error) {
            console.error('❌ Ошибка загрузки сообщений:', error);
            return [];
        }
    }

    // Отправка сообщения
    static async sendMessage(orderId, senderId, senderType, message) {
        try {
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
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('❌ Ошибка отправки сообщения:', error);
            return { success: false, error: error.message };
        }
    }

    // Пометить как прочитанные
    static async markAsRead(orderId, readerId) {
        try {
            const response = await fetch(`${API_URL}/chat/read/${orderId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ readerId })
            });
            
            return response.ok;
        } catch (error) {
            console.error('❌ Ошибка обновления статуса:', error);
            return false;
        }
    }
}