// /api-proxy/[[...path]].js
export default async function handler(req, res) {
    // Разрешаем CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    const targetUrl = `http://87.242.106.114:3002${req.url}`;
    
    try {
        console.log(`🔄 Проксируем: ${req.method} ${targetUrl}`);
        
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(req.headers.authorization && { 'Authorization': req.headers.authorization })
            },
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });
        
        const data = await response.json();
        
        res.status(response.status).json(data);
        
    } catch (error) {
        console.error('❌ Ошибка прокси:', error);
        res.status(500).json({
            success: false,
            error: 'Proxy error',
            details: error.message
        });
    }
}