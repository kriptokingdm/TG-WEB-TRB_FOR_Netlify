import React from "react";
import { useState, useEffect, useRef } from 'react';
import './Home.css';
import { API_BASE_URL } from './config';
import AddAddressModal from './AddAddressModal';

// ==================== УЛУЧШЕННЫЙ FETCH С ТАЙМАУТОМ ====================
const simpleFetch = async (endpoint, data = null) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  
  const options = {
    method: data ? 'POST' : 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    signal: controller.signal
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`❌ Ошибка fetch ${endpoint}:`, error);
    throw error;
  }
};

// ==================== SVG ДЛЯ БЕЗОПАСНОЙ СДЕЛКИ ====================
const SecurityIcon = () => (
  <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_2133_749)">
      <path d="M45 20H42.5V15C42.5 8.1 36.9 2.5 30 2.5C23.1 2.5 17.5 8.1 17.5 15V20H15C12.25 20 10 22.25 10 25V50C10 52.75 12.25 55 15 55H45C47.75 55 50 52.75 50 50V25C50 22.25 47.75 20 45 20ZM30 42.5C27.25 42.5 25 40.25 25 37.5C25 34.75 27.25 32.5 30 32.5C32.75 32.5 35 34.75 35 37.5C35 40.25 32.75 42.5 30 42.5ZM37.75 20H22.25V15C22.25 10.725 25.725 7.25 30 7.25C34.275 7.25 37.75 10.725 37.75 15V20Z" fill="white"/>
    </g>
    <defs>
      <clipPath id="clip0_2133_749">
        <rect width="60" height="60" fill="white"/>
      </clipPath>
    </defs>
  </svg>
);

// ==================== ИКОНКИ ====================
const CopyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_2140_242)">
      <path d="M14 2H6C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" fill="white"/>
    </g>
    <defs>
      <clipPath id="clip0_2140_242">
        <rect width="24" height="24" fill="white"/>
      </clipPath>
    </defs>
  </svg>
);

const DeleteIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_2140_242)">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="white"/>
    </g>
    <defs>
      <clipPath id="clip0_2140_242">
        <rect width="24" height="24" fill="white"/>
      </clipPath>
    </defs>
  </svg>
);

// ==================== ИКОНКА СБП ====================
const SBPIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.19995 4.78868L4.86415 9.55076V12.4555L2.20307 17.2082L2.19995 4.78868Z" fill="#5B57A2"/>
    <path d="M12.4294 7.81796L14.9259 6.28786L20.035 6.2831L12.4294 10.9423V7.81796Z" fill="#D90751"/>
    <path d="M12.4153 4.76061L12.4295 11.0654L9.75903 9.42461V0L12.4155 4.76061H12.4153Z" fill="#FAB718"/>
    <path d="M20.035 6.28301L14.9257 6.28778L12.4153 4.76061L9.75903 0L20.0349 6.28301H20.035Z" fill="#ED6F26"/>
    <path d="M12.4295 17.2346V14.1757L9.75903 12.566L9.7605 22L12.4295 17.2346Z" fill="#63B22F"/>
    <path d="M14.9196 15.7185L4.86397 9.55076L2.19995 4.78868L20.0242 15.7122L14.9194 15.7185H14.9196Z" fill="#1487C9"/>
    <path d="M9.76074 22L12.4293 17.2346L14.9196 15.7185L20.0241 15.7122L9.76074 22Z" fill="#017F36"/>
    <path d="M2.20312 17.2081L9.78083 12.5661L7.23324 11.003L4.86421 12.4554L2.20312 17.2081Z" fill="#984995"/>
  </svg>
);

// ==================== ИКОНКА КАРТЫ ====================
const CardIcon = () => (
  <svg width="19" height="15" viewBox="0 0 19 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.5 0H1.83333C0.815833 0 0.00916666 0.815833 0.00916666 1.83333L0 12.8333C0 13.8508 0.815833 14.6667 1.83333 14.6667H16.5C17.5175 14.6667 18.3333 13.8508 18.3333 12.8333V1.83333C18.3333 0.815833 17.5175 0 16.5 0ZM16.5 12.8333H1.83333V7.33333H16.5V12.8333ZM16.5 3.66667H1.83333V1.83333H16.5V3.66667Z" fill="white"/>
  </svg>
);

// ==================== SWAP ИКОНКА С АНИМАЦИЕЙ ====================
const SwapIcon = ({ isSwapped }) => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="26" cy="26" r="24" fill="var(--tg-theme-button-color, #3390ec)"/>
    <g
      style={{
        transform: isSwapped ? 'rotate(180deg)' : 'rotate(0deg)',
        transformOrigin: 'center',
        transition: 'transform 0.3s ease'
      }}
    >
      <path 
        d="M34 16C37.31 18.33 39.5 22 39.5 26C39.5 33.1 33.6 39 26.5 39H25.5M18 36C14.69 33.67 12.5 30 12.5 26C12.5 18.9 18.4 13 25.5 13H26.5M28.5 42L25 38.5L28.5 35M25 17L28.5 13.5L25 10" 
        stroke="white"
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
    </g>
  </svg>
);

// ==================== ФУНКЦИЯ ДЛЯ ФОРМАТИРОВАНИЯ АДРЕСА ====================
const formatAddress = (address) => {
  if (!address) return '';
  if (address.length <= 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

// ==================== ФУНКЦИЯ ДЛЯ ФОРМАТИРОВАНИЯ ИМЕНИ ====================
const formatName = (name) => {
  if (!name) return '';
  if (name.length <= 10) return name;
  return `${name.slice(0, 10)}...`;
};

function Home({ navigateTo, telegramUser, showToast }) {
  console.log('🏠 Home загружен');

  // ==================== СОСТОЯНИЯ ====================
  const [isBuyMode, setIsBuyMode] = useState(true);
  const [isSwapped, setIsSwapped] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  
  const [currentRate, setCurrentRate] = useState(88.0);
  const [rateLevels, setRateLevels] = useState([]);
  
  const limits = {
    minBuy: 1000,
    maxBuy: 1000000,
    minSell: 10,
    maxSell: 10000
  };
  
  const [isLoading, setIsLoading] = useState(false);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [activeOrderData, setActiveOrderData] = useState(null);
  
  // Крипто
  const [cryptoNetwork, setCryptoNetwork] = useState('TRC20');
  const [cryptoAddresses, setCryptoAddresses] = useState([]);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  
  // Банки
  const [bankName, setBankName] = useState('СБП');
  const [cardNumber, setCardNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Модалка
  const [isModalOpen, setIsModalOpen] = useState(false);

  const abortControllerRef = useRef(null);

  // ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
  const getUserId = () => {
    try {
      if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
        return window.Telegram.WebApp.initDataUnsafe.user.id.toString();
      }
      return telegramUser?.id?.toString() || '7879866656';
    } catch {
      return '7879866656';
    }
  };

  const checkActiveOrder = async () => {
    try {
      const userId = getUserId();
      const response = await simpleFetch(`/api/user/active-order/${userId}`);
      console.log('📦 Активный ордер:', response);
      if (response.success && response.hasActiveOrder) {
        setHasActiveOrder(true);
        setActiveOrderId(String(response.order.id));
        setActiveOrderData(response.order);
      } else {
        setHasActiveOrder(false);
        setActiveOrderData(null);
      }
    } catch (error) {
      console.error('❌ Ошибка проверки ордера:', error);
    }
  };

  const showMessage = (type, text) => {
    if (showToast) showToast(text, type);
  };

  // ==================== ЗАПРОС КУРСА ====================
  const fetchExchangeRate = (queryAmount, mode) => {
  if (abortControllerRef.current) abortControllerRef.current.abort();
  abortControllerRef.current = new AbortController();

  const type = mode ? 'buy' : 'sell';
  const amount = queryAmount || (mode ? 1000 : 10);
  
  console.log(`📡 Запрос курса: ${type} ${amount}`);
  
  simpleFetch(`/api/exchange-rate?amount=${amount}&type=${type}`)
    .then(result => {
      console.log('📦 Ответ API:', result);
      if (result.success) {
        setCurrentRate(result.rate);
        setRateLevels(result.levels || []);
        console.log(`✅ Курс обновлен: ${result.rate}`);
      } else {
        console.error('❌ Ошибка в ответе:', result.error);
      }
    })
    .catch(error => {
      if (error.name !== 'AbortError') {
        console.error('❌ Ошибка курса:', error);
      }
    });
};

  // ==================== ОБРАБОТЧИКИ ====================
  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.');
    const parts = value.split('.');
    if (parts.length > 1 && parts[1].length > 2) return;
    
    setAmount(value);
    
    if (value) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        if (isBuyMode) {
          if (num < limits.minBuy) {
            setError(`Минимальная сумма: ${limits.minBuy.toLocaleString()} RUB`);
          } else if (num > limits.maxBuy) {
            setError(`Максимальная сумма: ${limits.maxBuy.toLocaleString()} RUB`);
          } else {
            setError('');
          }
        } else {
          if (num < limits.minSell) {
            setError(`Минимальная сумма: ${limits.minSell} USDT`);
          } else if (num > limits.maxSell) {
            setError(`Максимальная сумма: ${limits.maxSell.toLocaleString()} USDT`);
          } else {
            setError('');
          }
        }
        fetchExchangeRate(num, isBuyMode);
      }
    } else {
      setError('');
    }
  };

  const handleSwap = () => {
    if (hasActiveOrder) {
      showMessage('warning', '⚠️ У вас активный ордер');
      return;
    }
    
    setIsSwapped(!isSwapped);
    setIsBuyMode(!isBuyMode);
    setAmount('');
    setError('');
    fetchExchangeRate(1000, !isBuyMode);
  };

  const handleAddCrypto = () => {
    setIsModalOpen(true);
  };

  const handleAddPayment = () => {
    const isSBP = bankName === 'СБП';
    
    if (isSBP) {
      const clean = phoneNumber.replace(/\D/g, '');
      if (clean.length !== 11 || !clean.startsWith('7')) {
        showMessage('error', '❌ Введите +7XXXXXXXXXX');
        return;
      }
    } else {
      const clean = cardNumber.replace(/\s/g, '');
      if (clean.length !== 16) {
        showMessage('error', '❌ 16 цифр');
        return;
      }
    }

    const newPayment = {
      id: Date.now().toString(),
      bankName,
      type: isSBP ? 'sbp' : 'card',
      number: isSBP ? phoneNumber : cardNumber,
      formattedNumber: isSBP ? formatPhone(phoneNumber) : formatCard(cardNumber)
    };

    setPaymentMethods([...paymentMethods, newPayment]);
    setSelectedPayment(newPayment);
    setBankName('СБП');
    setCardNumber('');
    setPhoneNumber('');
    showMessage('success', '✅ Реквизиты добавлены');
  };

  const formatPhone = (phone) => {
    const c = phone.replace(/\D/g, '');
    if (c.length === 11) {
      return `+7 (${c.slice(1,4)}) ${c.slice(4,7)}-${c.slice(7,9)}-${c.slice(9)}`;
    }
    return phone;
  };

  const formatCard = (card) => {
    return card.replace(/\D/g, '').match(/.{1,4}/g)?.join(' ') || card;
  };

  const handlePhoneChange = (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 0) {
      let f = '+7';
      if (v.length > 1) f += ` (${v.slice(1,4)}`;
      if (v.length > 4) f += `) ${v.slice(4,7)}`;
      if (v.length > 7) f += `-${v.slice(7,9)}`;
      if (v.length > 9) f += `-${v.slice(9)}`;
      setPhoneNumber(f);
    } else {
      setPhoneNumber('');
    }
  };

  const handleCardChange = (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 16);
    setCardNumber(v.replace(/(\d{4})(?=\d)/g, '$1 '));
  };

  const handleDeleteCrypto = (id) => {
    setCryptoAddresses(cryptoAddresses.filter(c => c.id !== id));
    if (selectedCrypto?.id === id) setSelectedCrypto(null);
    showMessage('success', '✅ Адрес удален');
  };

  const handleDeletePayment = (id) => {
    setPaymentMethods(paymentMethods.filter(p => p.id !== id));
    if (selectedPayment?.id === id) setSelectedPayment(null);
    showMessage('success', '✅ Реквизиты удалены');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showMessage('success', '✅ Скопировано');
  };

  const handleExchange = async () => {
    if (hasActiveOrder) {
      showMessage('warning', '⚠️ У вас активный ордер');
      navigateTo('history');
      return;
    }

    if (!amount) {
      showMessage('error', '❌ Введите сумму');
      return;
    }

    const num = parseFloat(amount.replace(',', '.'));
    if (isNaN(num)) {
      showMessage('error', '❌ Неверная сумма');
      return;
    }

    if (isBuyMode) {
      if (num < limits.minBuy || num > limits.maxBuy) {
        showMessage('error', `❌ Сумма от ${limits.minBuy.toLocaleString()} до ${limits.maxBuy.toLocaleString()} RUB`);
        return;
      }
      if (!selectedCrypto) {
        showMessage('error', '❌ Добавьте адрес USDT');
        return;
      }
    } else {
      if (num < limits.minSell || num > limits.maxSell) {
        showMessage('error', `❌ Сумма от ${limits.minSell} до ${limits.maxSell.toLocaleString()} USDT`);
        return;
      }
      if (!selectedPayment) {
        showMessage('error', '❌ Добавьте реквизиты');
        return;
      }
    }

    const userId = getUserId();
    
    const orderData = {
      type: isBuyMode ? 'buy' : 'sell',
      amount: num,
      userId: userId,
      telegramId: userId,
      username: telegramUser?.username || 'user',
      firstName: telegramUser?.firstName || 'Клиент',
      lastName: telegramUser?.lastName || '',
      cryptoAddress: isBuyMode ? selectedCrypto?.address : null,
      cryptoNetwork: isBuyMode ? selectedCrypto?.network : null,
      bankDetails: !isBuyMode ? `${selectedPayment?.bankName}: ${selectedPayment?.formattedNumber}` : null
    };

    try {
      setIsLoading(true);
      showMessage('info', '🔄 Создание ордера...');
      const result = await simpleFetch('/api/create-order', orderData);

      if (result.success) {
        showMessage('success', `✅ Ордер #${result.order?.id}`);
        setAmount('');
        
        await checkActiveOrder();
        
        setTimeout(() => navigateTo?.('history'), 1500);
      } else {
        showMessage('error', `❌ Ошибка: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Ошибка сети:', error);
      showMessage('error', '❌ Ошибка сети');
    } finally {
      setIsLoading(false);
    }
  };

  const isExchangeReady = () => {
    if (hasActiveOrder || !amount || error) return false;
    const num = parseFloat(amount.replace(',', '.'));
    if (isNaN(num)) return false;
    if (isBuyMode) return !!(num >= limits.minBuy && num <= limits.maxBuy && selectedCrypto);
    return !!(num >= limits.minSell && num <= limits.maxSell && selectedPayment);
  };

  const convertedAmount = () => {
    if (!amount) return '';
    const num = parseFloat(amount.replace(',', '.'));
    if (isNaN(num)) return '';
    return isBuyMode ? (num / currentRate).toFixed(2) : (num * currentRate).toFixed(2);
  };

  const isSBPSelected = bankName === 'СБП';

  // ==================== EFFECTS ====================
  useEffect(() => {
    fetchExchangeRate(1000, true);
    
    const savedCrypto = localStorage.getItem('userCryptoAddresses');
    if (savedCrypto) {
      try {
        const c = JSON.parse(savedCrypto);
        setCryptoAddresses(c);
        if (c.length > 0) setSelectedCrypto(c[0]);
      } catch (e) {}
    }

    const savedPayments = localStorage.getItem('userPaymentMethods');
    if (savedPayments) {
      try {
        const p = JSON.parse(savedPayments);
        setPaymentMethods(p);
        if (p.length > 0) setSelectedPayment(p[0]);
      } catch (e) {}
    }

    checkActiveOrder();
  }, []);

  useEffect(() => {
    localStorage.setItem('userCryptoAddresses', JSON.stringify(cryptoAddresses));
  }, [cryptoAddresses]);

  useEffect(() => {
    localStorage.setItem('userPaymentMethods', JSON.stringify(paymentMethods));
  }, [paymentMethods]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!hasActiveOrder) checkActiveOrder();
    }, 30000);
    return () => clearInterval(interval);
  }, [hasActiveOrder]);

  // ==================== РЕНДЕР ====================
  return (
    <div className="home-container">
      <AddAddressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(newAddress) => {
          setCryptoAddresses([...cryptoAddresses, newAddress]);
          setSelectedCrypto(newAddress);
        }}
      />

      {hasActiveOrder && activeOrderData ? (
        <div className="tg-home-container">
          {/* Шапка */}
          <div className="tg-header">
            <div className="tg-header-content">
              <button className="tg-back-btn" onClick={() => navigateTo?.('history')}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/>
                </svg>
              </button>
              <div className="tg-header-titles">
                <h1 className="tg-header-title">Активная заявка</h1>
                <p className="tg-header-subtitle">ID: {activeOrderData?.public_id || activeOrderId}</p>
              </div>
              <div className={`tg-status-badge tg-status-${activeOrderData?.status || 'pending'}`}>
                {activeOrderData?.status === 'pending' && '🟡 Ожидание'}
                {activeOrderData?.status === 'processing' && '🟠 В обработке'}
                {activeOrderData?.status === 'accepted' && '✅ Принят'}
                {activeOrderData?.status === 'completed' && '🏁 Завершен'}
                {activeOrderData?.status === 'cancelled' && '🚫 Отменен'}
                {activeOrderData?.status === 'rejected' && '❌ Отклонен'}
              </div>
            </div>
          </div>

          {/* Основной контент */}
          <div className="tg-main-content">
            <div className="tg-order-card">
              {/* Заголовок */}
              <div className="tg-card-header">
                <div className="tg-order-icon">
                  {activeOrderData?.order_type === 'buy' ? '🛒' : '💰'}
                </div>
                <div className="tg-order-info">
                  <h2 className="tg-order-title">
                    {activeOrderData?.order_type === 'buy' ? 'Покупка USDT' : 'Продажа USDT'}
                  </h2>
                  <p className="tg-order-subtitle">
                    {activeOrderData?.created_at 
                      ? new Date(activeOrderData.created_at).toLocaleString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '-'
                    }
                  </p>
                </div>
              </div>

              {/* Детали */}
              <div className="tg-order-details">
                <div className="tg-detail-row">
                  <span className="tg-detail-label">Вы отдаете</span>
                  <span className="tg-detail-value tg-detail-amount">
                    {activeOrderData?.amount || 0} {activeOrderData?.order_type === 'buy' ? 'RUB' : 'USDT'}
                  </span>
                </div>

                <div className="tg-detail-row">
                  <span className="tg-detail-label">Курс</span>
                  <span className="tg-detail-value">
                    {activeOrderData?.rate || 0} ₽
                  </span>
                </div>

                <div className="tg-detail-row tg-detail-highlight">
                  <span className="tg-detail-label">Вы получаете</span>
                  <span className="tg-detail-value tg-detail-amount tg-detail-accent">
                    {activeOrderData?.order_type === 'buy' 
                      ? `${(activeOrderData.amount / activeOrderData.rate).toFixed(2)} USDT`
                      : `${(activeOrderData.amount * activeOrderData.rate).toFixed(2)} ₽`
                    }
                  </span>
                </div>

                {/* Реквизиты */}
                {activeOrderData?.order_type === 'sell' && activeOrderData?.bank_details && (
                  <div className="tg-detail-row tg-detail-full">
                    <span className="tg-detail-label">Реквизиты</span>
                    <div className="tg-detail-value tg-detail-box">
                      <span className="tg-detail-mono">{activeOrderData.bank_details}</span>
                      <button 
                        className="tg-copy-btn"
                        onClick={() => copyToClipboard(activeOrderData.bank_details)}
                      >
                        <CopyIcon />
                      </button>
                    </div>
                  </div>
                )}

                {activeOrderData?.order_type === 'buy' && activeOrderData?.crypto_address && (
                  <div className="tg-detail-row tg-detail-full">
                    <span className="tg-detail-label">Адрес USDT</span>
                    <div className="tg-detail-value tg-detail-box">
                      <span className="tg-detail-mono">{activeOrderData.crypto_address}</span>
                      <button 
                        className="tg-copy-btn"
                        onClick={() => copyToClipboard(activeOrderData.crypto_address)}
                      >
                        <CopyIcon />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Кнопки */}
              <div className="tg-actions">
                <button className="tg-action-btn" onClick={() => navigateTo?.('history')}>
                  📋 История операций
                </button>
              </div>
            </div>

            {/* Предупреждение */}
            <div className="tg-warning">
              <span className="tg-warning-icon">⚠️</span>
              <span className="tg-warning-text">
                Пользователь самостоятельно несет ответственность за правильность введенных реквизитов.
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="home-content">
          {/* ВАЛЮТНЫЕ КАРТОЧКИ */}
          <div className="currency-cards-section">
            <div className="currency-cards-horizontal">
              <div className="currency-card-side left-card">
                <div className="currency-content">
                  <span className="currency-name">{isBuyMode ? "RUB" : "USDT"}</span>
                  {isBuyMode && (
                    <span className="currency-rate">{currentRate.toFixed(2)} ₽</span>
                  )}
                </div>
              </div>

              <button className={`swap-center-button ${isSwapped ? 'swapped' : ''}`} onClick={handleSwap}>
                <SwapIcon isSwapped={isSwapped} />
              </button>

              <div className="currency-card-side right-card">
                <div className="currency-content">
                  <span className="currency-name">{isBuyMode ? "USDT" : "RUB"}</span>
                  {!isBuyMode && (
                    <span className="currency-rate">{currentRate.toFixed(2)} ₽</span>
                  )}
                </div>
              </div>
            </div>

            {/* ПОЛЯ ВВОДА */}
            <div className={`amount-input-section tg-amount ${error ? 'has-error' : ''}`}>
              {/* Отдаёшь */}
              <div className={`tg-amount-card ${error ? 'error' : ''}`}>
                <div className="tg-amount-top">
                  <span className="tg-amount-label">Вы отдаёте</span>
                  <span className="tg-amount-chip">{isBuyMode ? 'RUB' : 'USDT'}</span>
                </div>

                <div className="tg-amount-row">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={handleAmountChange}
                    className="tg-amount-input"
                    placeholder="0"
                    aria-label="Сумма"
                  />
                </div>

                {error && <div className="tg-amount-error">{error}</div>}
              </div>

              {/* Получаешь */}
              <div className="tg-amount-card">
                <div className="tg-amount-top">
                  <span className="tg-amount-label">Вы получаете</span>
                  <span className="tg-amount-chip">{isBuyMode ? 'USDT' : 'RUB'}</span>
                </div>

                <div className="tg-amount-row">
                  <input
                    type="text"
                    value={convertedAmount()}
                    readOnly
                    className="tg-amount-input tg-amount-readonly"
                    placeholder="0"
                    aria-label="Получаемая сумма"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* БЛОК АДРЕСА ДЛЯ USDT */}
          {isBuyMode ? (
            <div className="payment-section-new">
              <h3 className="section-title">Адрес для получения USDT</h3>
              
              <button onClick={handleAddCrypto} className="add-button">
                + Добавить адрес
              </button>

              {cryptoAddresses.length > 0 && (
                <div className="crypto-list">
                  <h4>Сохраненные адреса:</h4>
                  {cryptoAddresses.map(c => (
                    <div key={c.id} className={`crypto-item ${selectedCrypto?.id === c.id ? 'selected' : ''}`}
                         onClick={() => setSelectedCrypto(c)}>
                      <div className="crypto-info">
                        <div className="crypto-header">
                          <span className="crypto-name" title={c.name}>{formatName(c.name)}</span>
                          <span className="crypto-network-badge">{c.network}</span>
                        </div>
                        <div className="crypto-address">
                          {formatAddress(c.address)}
                        </div>
                      </div>
                      <div className="crypto-actions">
                        <button className="action-btn copy-btn" onClick={(e) => { e.stopPropagation(); copyToClipboard(c.address); }}>
                          <CopyIcon />
                        </button>
                        <button className="action-btn delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteCrypto(c.id); }}>
                          <DeleteIcon />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="payment-section-new">
              <h3 className="section-title">Реквизиты для RUB</h3>
              
              {/* Простые кнопки вместо select */}
              <div className="bank-selector">
                <button
                  onClick={() => setBankName('СБП')}
                  className={`bank-option ${bankName === 'СБП' ? 'selected' : ''}`}
                >
                  <SBPIcon />
                  <span>СБП</span>
                </button>
                <button
                  onClick={() => setBankName('Карта')}
                  className={`bank-option ${bankName === 'Карта' ? 'selected' : ''}`}
                >
                  <CardIcon />
                  <span>Карта</span>
                </button>
              </div>

              {isSBPSelected ? (
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="+7 (999) 123-45-67"
                  className="phone-input"
                />
              ) : (
                <input
                  type="text"
                  value={cardNumber}
                  onChange={handleCardChange}
                  placeholder="0000 0000 0000 0000"
                  className="card-input"
                />
              )}

              <button onClick={handleAddPayment} className="add-button">
                + Добавить реквизиты
              </button>

              {paymentMethods.length > 0 && (
                <div className="payments-list">
                  <h4>Ваши реквизиты:</h4>
                  {paymentMethods.map(p => (
                    <div key={p.id} className={`payment-item ${selectedPayment?.id === p.id ? 'selected' : ''}`}
                         onClick={() => setSelectedPayment(p)}>
                      <div className="payment-info">
                        <span className="bank-name">
                          <span className="payment-icon">
                            {p.type === 'sbp' ? <SBPIcon /> : <CardIcon />}
                          </span>
                          {p.bankName}
                        </span>
                        <span className="payment-number">{p.formattedNumber}</span>
                      </div>
                      <button className="action-btn delete-btn" onClick={(e) => { e.stopPropagation(); handleDeletePayment(p.id); }}>
                        <DeleteIcon />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* КНОПКА ОБМЕНА */}
          <button
            className={`exchange-button-new ${isBuyMode ? 'buy' : 'sell'} ${!isExchangeReady() ? 'disabled' : ''}`}
            disabled={!isExchangeReady() || isLoading}
            onClick={handleExchange}
          >
            <span className="exchange-icon">{isBuyMode ? '🛒' : '💰'}</span>
            <span className="exchange-text">
              {isLoading ? 'Обработка...' : (isBuyMode ? 'Купить USDT' : 'Продать USDT')}
            </span>
          </button>

          {/* БЕЗОПАСНОСТЬ */}
          <div className="security-info">
            <SecurityIcon />
            <div className="security-text">
              <strong>Безопасная сделка:</strong> Средства резервируются у операторов до подтверждения сделки системой TetherRabbit
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;