// src/config.js

// Используем текущий origin для продакшена
export const API_BASE_URL = 'https://tethrab.shop';

// Для разработки в package.json есть прокси
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// Debug
console.log('Config:', {
    NODE_ENV: process.env.NODE_ENV,
    API_BASE_URL,
    IS_DEVELOPMENT,
    location: window.location
});

// Вспомогательная функция для создания URL
export const buildApiUrl = (endpoint) => {
    // В разработке endpoint'ы будут через прокси (без базового URL)
    // В продакшене - с базовым URL
    if (IS_DEVELOPMENT || endpoint.startsWith('http')) {
        return endpoint;
    }
    return `${API_BASE_URL}${endpoint}`;
};