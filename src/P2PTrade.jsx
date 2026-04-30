const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const axios = require('axios');

const db = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'tetherbot_db',
    user: 'postgres',
    password: 'TRBCEO1978',
});

const BOT_TOKEN = '8413085887:AAHlYCtnbHyBgn3CJhDStZ9y3E9eXe7yEok';

// Функция отправки сообщения в Telegram
async function sendTelegramMessage(chatId, text) {
    try {
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML'
        });
        console.log(`✅ Сообщение отправлено пользователю ${chatId}`);
    } catch (error) {
        console.error(`❌ Ошибка отправки ${chatId}:`, error.message);
    }
}

// Генерация ID сделки
function generateTradeId() {
    return 'TR' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
}

// ============ СОЗДАНИЕ СДЕЛКИ ============
router.post('/start', async (req, res) => {
    try {
        const { orderId, buyerId, amount, expires_minutes = 30 } = req.body;
        
        console.log('📝 Создание сделки:', { orderId, buyerId, amount });
        
        const orderIdNum = parseInt(orderId);
        if (isNaN(orderIdNum)) {
            return res.status(400).json({ success: false, error: 'Некорректный ID объявления' });
        }
        
        const orderResult = await db.query(
            `SELECT * FROM p2p_orders WHERE id = $1 AND status = 'active'`,
            [orderIdNum]
        );
        
        if (orderResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Объявление не найдено' });
        }
        
        const order = orderResult.rows[0];
        const amountNum = parseFloat(amount);
        
        if (amountNum < order.min_amount || amountNum > order.max_amount) {
            return res.status(400).json({ success: false, error: `Сумма должна быть от ${order.min_amount} до ${order.max_amount} USDT` });
        }
        
        if (amountNum > order.available_amount) {
            return res.status(400).json({ success: false, error: `Доступно только ${order.available_amount} USDT` });
        }
        
        const tradeId = generateTradeId();
        const expiresAt = new Date(Date.now() + expires_minutes * 60000);
        
        await db.query(
            `INSERT INTO p2p_trades 
             (trade_id, order_id, seller_id, buyer_id, amount, rate, total_rub, status, created_at, expires_at, messages)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [tradeId, orderIdNum, order.user_id, buyerId, amountNum, order.rate,
             amountNum * order.rate, 'pending', new Date().toISOString(), expiresAt.toISOString(), '[]']
        );
        
        await db.query(
            `UPDATE p2p_orders SET available_amount = available_amount - $1 WHERE id = $2`,
            [amountNum, orderIdNum]
        );
        
        const updatedOrder = await db.query(`SELECT available_amount FROM p2p_orders WHERE id = $1`, [orderIdNum]);
        if (updatedOrder.rows[0] && updatedOrder.rows[0].available_amount <= 0) {
            await db.query(`UPDATE p2p_orders SET status = 'completed' WHERE id = $1`, [orderIdNum]);
        }
        
        // ============ ОТПРАВКА УВЕДОМЛЕНИЙ В ТЕЛЕГРАМ ============
        
        // 1. Уведомление ПОКУПАТЕЛЮ (тейкеру) - кто создал сделку
        const buyerMessage = 
`✅ <b>СДЕЛКА УСПЕШНО СОЗДАНА!</b>

🆔 <b>Номер сделки:</b> <code>${tradeId}</code>
👤 <b>Продавец:</b> ${order.user_name || 'Пользователь'}
💰 <b>Сумма:</b> ${amountNum} USDT
💵 <b>К оплате:</b> ${amountNum * order.rate} ₽
⏰ <b>Время на оплату:</b> ${expires_minutes} минут

📌 <b>Реквизиты продавца:</b>
<code>${order.payment_details || 'Уточните в чате сделки'}</code>

👇 Перейдите в раздел "Мои сделки" в приложении.`;
        
        // 2. Уведомление ПРОДАВЦУ (мейкеру) - у кого купили
        const sellerMessage = 
`🆕 <b>НОВАЯ СДЕЛКА!</b>

🆔 <b>Номер сделки:</b> <code>${tradeId}</code>
👤 <b>Покупатель:</b> ${buyerId.slice(-6) || 'Пользователь'}
💰 <b>Сумма:</b> ${amountNum} USDT
💵 <b>Получите:</b> ${amountNum * order.rate} ₽
⏰ <b>Время на оплату:</b> ${expires_minutes} минут

👇 После получения оплаты подтвердите сделку в приложении.`;
        
        // Отправляем уведомления
        await sendTelegramMessage(buyerId, buyerMessage);
        await sendTelegramMessage(order.user_id, sellerMessage);
        
        console.log(`✅ Сделка создана: ${tradeId}`);
        console.log(`📨 Уведомление отправлено покупателю: ${buyerId}`);
        console.log(`📨 Уведомление отправлено продавцу: ${order.user_id}`);
        
        res.json({ success: true, trade_id: tradeId, expires_at: expiresAt });
        
    } catch (error) {
        console.error('❌ Error creating trade:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера: ' + error.message });
    }
});

// ============ ОСТАЛЬНЫЕ РОУТЫ (КОПИРУЕМ ИЗ СТАРОГО ФАЙЛА) ============

router.post('/confirm-payment', async (req, res) => {
    try {
        const { tradeId, userId } = req.body;
        
        const tradeResult = await db.query(`SELECT * FROM p2p_trades WHERE trade_id = $1`, [tradeId]);
        if (tradeResult.rows.length === 0) return res.status(404).json({ success: false, error: 'Сделка не найдена' });
        
        const trade = tradeResult.rows[0];
        if (trade.buyer_id !== userId) return res.status(403).json({ success: false, error: 'Не ваша сделка' });
        if (trade.status !== 'pending') return res.status(400).json({ success: false, error: 'Неверный статус' });
        
        if (new Date() > new Date(trade.expires_at)) {
            await db.query(`UPDATE p2p_trades SET status = 'expired' WHERE trade_id = $1`, [tradeId]);
            return res.status(400).json({ success: false, error: 'Время оплаты истекло' });
        }
        
        await db.query(`UPDATE p2p_trades SET status = 'paid', paid_at = $1 WHERE trade_id = $2`, [new Date().toISOString(), tradeId]);
        
        // Уведомление продавцу что оплата подтверждена
        await sendTelegramMessage(trade.seller_id, 
            `💳 <b>ОПЛАТА ПОДТВЕРЖДЕНА!</b>\n\nСделка: ${tradeId}\nСумма: ${trade.amount} USDT\n\n✅ Подтвердите получение в приложении.`);
        
        res.json({ success: true, message: 'Оплата подтверждена' });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
});

router.post('/confirm-receipt', async (req, res) => {
    try {
        const { tradeId, userId } = req.body;
        
        const tradeResult = await db.query(`SELECT * FROM p2p_trades WHERE trade_id = $1`, [tradeId]);
        if (tradeResult.rows.length === 0) return res.status(404).json({ success: false, error: 'Сделка не найдена' });
        
        const trade = tradeResult.rows[0];
        if (trade.seller_id !== userId) return res.status(403).json({ success: false, error: 'Не ваша сделка' });
        if (trade.status !== 'paid') return res.status(400).json({ success: false, error: 'Неверный статус' });
        
        await db.query(`UPDATE p2p_trades SET status = 'completed', completed_at = $1 WHERE trade_id = $2`, [new Date().toISOString(), tradeId]);
        
        await db.query(`UPDATE user_balances SET usdt_balance = COALESCE(usdt_balance, 0) + $1 WHERE user_id = $2`, [trade.amount, trade.buyer_id]);
        
        // Уведомление покупателю что сделка завершена
        await sendTelegramMessage(trade.buyer_id, 
            `✅ <b>СДЕЛКА ЗАВЕРШЕНА!</b>\n\nСделка: ${tradeId}\nСумма: ${trade.amount} USDT\n\n🎉 Средства зачислены на ваш кошелек.`);
        
        res.json({ success: true, message: 'Сделка завершена' });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
});

router.post('/cancel', async (req, res) => {
    try {
        const { tradeId, userId } = req.body;
        
        const tradeResult = await db.query(`SELECT * FROM p2p_trades WHERE trade_id = $1`, [tradeId]);
        if (tradeResult.rows.length === 0) return res.status(404).json({ success: false, error: 'Сделка не найдена' });
        
        const trade = tradeResult.rows[0];
        if (trade.buyer_id !== userId && trade.seller_id !== userId) return res.status(403).json({ success: false, error: 'Не ваша сделка' });
        if (trade.status !== 'pending' && trade.status !== 'paid') return res.status(400).json({ success: false, error: 'Нельзя отменить' });
        
        await db.query(`UPDATE p2p_orders SET available_amount = available_amount + $1, status = 'active' WHERE id = $2`, [trade.amount, trade.order_id]);
        await db.query(`UPDATE p2p_trades SET status = 'cancelled', cancelled_at = $1 WHERE trade_id = $2`, [new Date().toISOString(), tradeId]);
        
        res.json({ success: true, message: 'Сделка отменена' });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
});

router.post('/message', async (req, res) => {
    try {
        const { tradeId, userId, message } = req.body;
        
        const tradeResult = await db.query(`SELECT * FROM p2p_trades WHERE trade_id = $1`, [tradeId]);
        if (tradeResult.rows.length === 0) return res.status(404).json({ success: false, error: 'Сделка не найдена' });
        
        const trade = tradeResult.rows[0];
        if (trade.buyer_id !== userId && trade.seller_id !== userId) return res.status(403).json({ success: false, error: 'Не ваша сделка' });
        
        let messages = [];
        if (trade.messages && trade.messages !== '[]') {
            try { messages = JSON.parse(trade.messages); } catch(e) { messages = []; }
        }
        
        const messageObj = {
            id: Date.now(),
            user_id: userId,
            user_name: userId === trade.buyer_id ? '👤 Покупатель' : '👤 Продавец',
            message: message,
            timestamp: new Date().toISOString()
        };
        
        messages.push(messageObj);
        await db.query(`UPDATE p2p_trades SET messages = $1 WHERE trade_id = $2`, [JSON.stringify(messages), tradeId]);
        
        // Отправляем уведомление о новом сообщении другой стороне
        const otherUserId = userId === trade.buyer_id ? trade.seller_id : trade.buyer_id;
        await sendTelegramMessage(otherUserId, `💬 <b>НОВОЕ СООБЩЕНИЕ</b>\n\nСделка: ${tradeId}\n\n${messageObj.user_name}: ${message}`);
        
        res.json({ success: true, message: messageObj });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
});

router.get('/messages/:tradeId', async (req, res) => {
    try {
        const { tradeId } = req.params;
        const result = await db.query(`SELECT messages FROM p2p_trades WHERE trade_id = $1`, [tradeId]);
        
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Сделка не найдена' });
        
        let messages = [];
        if (result.rows[0].messages) {
            try { messages = JSON.parse(result.rows[0].messages); } catch(e) { messages = []; }
        }
        
        res.json({ success: true, messages: messages });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
});

router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await db.query(
            `SELECT * FROM p2p_trades WHERE buyer_id = $1 OR seller_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
        res.json({ success: true, trades: result.rows });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
});

module.exports = router;