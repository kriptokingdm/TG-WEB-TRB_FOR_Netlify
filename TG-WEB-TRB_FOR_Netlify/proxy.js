const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3003;

// Настройка CORS
app.use(cors({
    origin: ['http://localhost:3000', 'https://tg-web-trb-for-netlify.vercel.app'],
    credentials: true
}));

// Прокси для API
app.use('/api', createProxyMiddleware({
    target: 'http://87.242.106.114:3002',
    changeOrigin: true,
    pathRewrite: {
        '^/api': '/api'
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log('🌐 Прокси запрос:', req.method, req.url);
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log('✅ Прокси ответ:', proxyRes.statusCode, req.url);
    }
}));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', proxy: 'active' });
});

app.listen(PORT, () => {
    console.log(`🚀 Прокси запущен на порту ${PORT}`);
    console.log(`🌐 Локальный: http://localhost:${PORT}/api/referral/stats/7879866656`);
});
