// src/config.js
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://tethrab.shop'; // HTTPS без порта!

export const API_ENDPOINTS = {
  USER_ORDERS: '/user-orders',
  CREATE_ORDER: '/create-order',
  EXCHANGE_RATE: '/exchange-rate',
  API_USER: '/api/user',
  REFERRAL_STATS: '/api/referral/stats'
};