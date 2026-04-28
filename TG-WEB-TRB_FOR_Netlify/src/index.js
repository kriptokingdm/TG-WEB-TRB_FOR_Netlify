import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Обработка данных из WebApp (после ввода PIN)
bot.on('web_app_data', async (ctx) => {
    const data = ctx.webAppData.data;
    const userId = ctx.from.id.toString();
    
    try {
        const result = JSON.parse(data);
        
        if (result.success && result.token) {
            // Сохраняем токен
            localStorage.setItem(`user_token_${userId}`, result.token);
            localStorage.setItem(`user_token_expires_${userId}`, Date.now() + 15 * 60 * 1000);
            
            // Получаем сохранённые данные чека
            const checkData = tempCheckData[userId];
            if (checkData) {
                await createCheckWithToken(ctx, userId, checkData.amount, checkData.hours, result.token);
                delete tempCheckData[userId];
            }
        } else {
            await ctx.reply('❌ <b>Ошибка подтверждения</b>\n\nPIN-код не подтверждён.', { parse_mode: 'HTML' });
        }
    } catch (error) {
        console.error('❌ Ошибка обработки web_app_data:', error);
        await ctx.reply('❌ <b>Ошибка обработки данных</b>', { parse_mode: 'HTML' });
    }
});