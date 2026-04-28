// ChatApi.js (исправленная версия)
// ✅ Умеет работать с ОБОИМИ форматами бэка:
//   1) массив сообщений: []  (как в твоём routes/chat.js сейчас)
//   2) объект: { success:true, messages:[...] } (как было в controller)
// ✅ Не падает, если сервер вернул HTML/500 (и response.json() ломается)
// ✅ Нормально обрабатывает non-2xx ответы и показывает текст ошибки

const API_URL = 'https://tethrab.shop';

async function safeReadJson(response) {
  // Иногда при 500 nginx/express отдаёт HTML -> response.json() падает.
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (_) {
    return { __raw: text };
  }
}

function extractMessages(payload) {
  // Поддержка:
  // - [] (массив)
  // - { success:true, messages:[...] }
  // - { success:true, orders:[...] } (на всякий)
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.messages)) return payload.messages;
  return [];
}

function extractError(payload, fallback = 'Ошибка сервера') {
  if (!payload) return fallback;
  if (typeof payload.error === 'string' && payload.error.trim()) return payload.error;
  if (typeof payload.message === 'string' && payload.message.trim()) return payload.message;
  if (payload.__raw && typeof payload.__raw === 'string') {
    // кусочек HTML/текста, чтобы хотя бы видеть, что пришло
    return payload.__raw.slice(0, 200);
  }
  return fallback;
}

export const ChatApi = {
  async getMessages(orderId) {
    try {
      console.log(`📨 Запрос сообщений для: ${orderId}`);

      const response = await fetch(`${API_URL}/chat/messages/${orderId}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      const payload = await safeReadJson(response);

      if (!response.ok) {
        const err = extractError(payload, `HTTP ${response.status}`);
        console.error('❌ Ошибка получения сообщений:', err);
        return [];
      }

      // Если бек вернул {success:false,...}
      if (payload && payload.success === false) {
        console.error('❌ Ошибка получения сообщений:', extractError(payload, 'Ошибка получения сообщений'));
        return [];
      }

      return extractMessages(payload);
    } catch (error) {
      console.error('❌ Ошибка сети (getMessages):', error);
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
          'Accept': 'application/json'
        },
        body: JSON.stringify({ orderId, senderId, senderType, message })
      });

      const payload = await safeReadJson(response);

      // Если HTTP не 2xx — вернём нормальную ошибку вместо "undefined"
      if (!response.ok) {
        const err = extractError(payload, `HTTP ${response.status}`);
        console.error('❌ Ошибка отправки (HTTP):', err);
        return { success: false, error: err, status: response.status };
      }

      // Если бек вернул success:false
      if (payload && payload.success === false) {
        const err = extractError(payload, 'Ошибка отправки');
        console.error('❌ Ошибка отправки (API):', err);
        return { success: false, error: err };
      }

      // Ожидаем: { success:true, message:{...} }
      return payload || { success: true };
    } catch (error) {
      console.error('❌ Ошибка сети (sendMessage):', error);
      return { success: false, error: 'Ошибка сети' };
    }
  },

  async markAsRead(orderId, userId, readerType = 'user') {
    try {
      // У тебя эндпоинт /chat/mark-read ожидает { orderId, userId, readerType? }
      const response = await fetch(`${API_URL}/chat/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ orderId, userId, readerType })
      });

      // Не обязательно парсить ответ, но на всякий — чтобы не падать на HTML
      if (!response.ok) {
        const payload = await safeReadJson(response);
        console.error('❌ markAsRead HTTP error:', extractError(payload, `HTTP ${response.status}`));
      }
    } catch (error) {
      console.error('❌ Ошибка отметки прочитанного:', error);
    }
  },

  async uploadFile(file, orderId, userId) {
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('orderId', String(orderId));
      form.append('userId', String(userId));

      const response = await fetch(`${API_URL}/chat/upload`, {
        method: 'POST',
        body: form
      });

      const payload = await safeReadJson(response);

      if (!response.ok || payload?.success === false) {
        const err = extractError(payload, `HTTP ${response.status}`);
        console.error('❌ uploadFile error:', err);
        return { success: false, error: err };
      }

      // { success:true, url, name, type, size }
      return payload;
    } catch (error) {
      console.error('❌ uploadFile network error:', error);
      return { success: false, error: 'Ошибка сети' };
    }
  }
};
