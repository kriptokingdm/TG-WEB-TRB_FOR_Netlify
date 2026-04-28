// src/config.js
export const API_BASE_URL = 'https://tethrab.shop';
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

console.log('Config:', {
    NODE_ENV: process.env.NODE_ENV,
    API_BASE_URL,
    IS_DEVELOPMENT,
    location: window.location
});

export const buildApiUrl = (endpoint) => {
    if (IS_DEVELOPMENT || endpoint.startsWith('http')) {
        return endpoint;
    }
    return `${API_BASE_URL}${endpoint}`;
};