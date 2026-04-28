// /api/proxy.js (в корне проекта)
const API_BASE_URL = 'http://87.242.106.114:3002';

export default async function handler(req, res) {
  // Разрешаем CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { path = [], ...query } = req.query;
    const apiPath = Array.isArray(path) ? path.join('/') : path;
    const apiUrl = `${API_BASE_URL}/${apiPath}${Object.keys(query).length ? '?' + new URLSearchParams(query) : ''}`;

    console.log(`🌐 Proxying: ${req.method} ${apiPath} -> ${apiUrl}`);

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Копируем заголовки авторизации если есть
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    const response = await fetch(apiUrl, {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({
      error: 'Proxy error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}