import React from "react";
import { useState, useEffect, useRef } from 'react';
import './Home.css';
import { API_BASE_URL } from './config';
import { 
  BinanceIcon, 
  TRC20Icon, 
  ERCIcon, 
  SolanaIcon,
  BybitIcon,
  OKXIcon,
  MEXIcon,
  BitGetIcon 
} from './CryptoIcons';

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

// Компонент SVG для swap-кнопки
const SwapIcon = ({ isSwapped }) => {
  return (
    <svg 
      width="52" 
      height="52" 
      viewBox="0 0 52 52" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="26" cy="26" r="24" fill="var(--tg-theme-button-color, #3390ec)"/>
      <path 
        d="M34 16C37.31 18.33 39.5 22 39.5 26C39.5 33.1 33.6 39 26.5 39H25.5M18 36C14.69 33.67 12.5 30 12.5 26C12.5 18.9 18.4 13 25.5 13H26.5M28.5 42L25 38.5L28.5 35M25 17L28.5 13.5L25 10" 
        stroke="white"
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
        style={{
          transform: isSwapped ? 'rotate(180deg)' : 'rotate(0deg)',
          transformOrigin: 'center',
          transition: 'transform 0.3s ease'
        }}
      />
    </svg>
  );
};

function Home({ navigateTo, telegramUser, showToast }) {
  console.log('🏠 Home загружен');

  // ==================== СОСТОЯНИЯ ====================
  const [isBuyMode, setIsBuyMode] = useState(true);
  const [isSwapped, setIsSwapped] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  
  // КУРСЫ
  const [currentRate, setCurrentRate] = useState(88.0);
  const [minAmount, setMinAmount] = useState(1000);
  const [maxAmount, setMaxAmount] = useState(1000000);
  
  // ЛИМИТЫ - фиксированные
  const limits = {
    minBuy: 1000,
    maxBuy: 1000000,
    minSell: 10,
    maxSell: 10000
  };
  
  const [isLoading, setIsLoading] = useState(false);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [activeOrderStatus, setActiveOrderStatus] = useState('');
  const [activeOrderData, setActiveOrderData] = useState(null);
  
  // Крипто и платежи
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [cryptoNetwork, setCryptoNetwork] = useState('TRC20');
  const [cryptoUID, setCryptoUID] = useState('');
  const [cryptoAddresses, setCryptoAddresses] = useState([]);
  const [bankName, setBankName] = useState('СБП (Система быстрых платежей)');
  const [cardNumber, setCardNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [cryptoType, setCryptoType] = useState('address');
  const [selectedExchange, setSelectedExchange] = useState('Binance');

  // ==================== REFS ====================
  const abortControllerRef = useRef(null);

  // ==================== КОНСТАНТЫ ====================
  const availableBanks = [
    'СБП (Система быстрых платежей)',
    'Сбербанк',
    'Тинькофф',
    'ВТБ',
    'Альфа-Банк',
    'Газпромбанк',
    'Райффайзен Банк',
    'СовкомБанк',
    'Россельхоз',
    'МТС Банк',
    'Почта Банк',
    'Озон Банк',
    'ОТП Банк',
    'Банк Уралсиб',
    'Кредит Европа Банк',
    'Хоум Кредит',
    'Ренессанс Кредит',
    'Банк Русский Стандарт',
    'Банк Санкт-Петербург',
    'МКБ',
    'Промсвязьбанк',
    'Росбанк',
    'Ак Барс',
    'Бинбанк',
    'ЮМани (Яндекс Деньги)',
    'Т-Банк'
  ];

  const availableNetworks = [
    { value: 'TRC20', name: 'TRC20', icon: <TRC20Icon size={20} />, popular: true },
    { value: 'ERC20', name: 'ERC20', icon: <ERCIcon size={20} />, popular: true },
    { value: 'BEP20', name: 'BEP20', icon: <BinanceIcon size={20} />, popular: true },
    { value: 'SOLANA', name: 'Solana', icon: <SolanaIcon size={20} />, popular: true },
    { value: 'POLYGON', name: 'Polygon', icon: <div className="polygon-icon">P</div>, popular: false },
  ];

  const availableExchanges = [
    { value: 'Binance', name: 'Binance', icon: <BinanceIcon size={20} /> },
    { value: 'Bybit', name: 'Bybit', icon: <BybitIcon size={20} /> },
    { value: 'OKX', name: 'OKX', icon: <OKXIcon size={20} /> },
    { value: 'MEX', name: 'MEX', icon: <MEXIcon size={20} /> },
    { value: 'BitGet', name: 'BitGet', icon: <BitGetIcon size={20} /> }
  ];

  const popularNetworks = availableNetworks.filter(n => n.popular);

  // ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
  const getTelegramUser = () => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) return {
        id: tgUser.id.toString(),
        username: tgUser.username || `user_${tgUser.id}`,
        first_name: tgUser.first_name || 'Пользователь',
        last_name: tgUser.last_name || '',
        photo_url: tgUser.photo_url
      };
    }
    return null;
  };

  const getUserId = () => {
    try {
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        const tgUser = tg.initDataUnsafe?.user;
        if (tgUser?.id) return tgUser.id.toString();
      }
      const urlParams = new URLSearchParams(window.location.search);
      const testUserId = urlParams.get('test_user_id');
      if (testUserId) return testUserId;
      const savedTelegramUser = localStorage.getItem('telegramUser');
      if (savedTelegramUser) {
        const parsed = JSON.parse(savedTelegramUser);
        if (parsed?.id) return parsed.id.toString();
      }
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.telegramId) return parsed.telegramId.toString();
        if (parsed?.id) return parsed.id.toString();
      }
      if (telegramUser?.id) return telegramUser.id.toString();
    } catch (error) {
      console.error('❌ Ошибка получения ID:', error);
    }
    return null;
  };

  const checkActiveOrder = async () => {
    try {
      const userId = getUserId();
      if (!userId) return false;

      const response = await simpleFetch(`/api/user/active-order/${userId}`);
      console.log('🔍 Ответ активного ордера:', response);
      
      if (response.success && response.hasActiveOrder && response.order) {
        setHasActiveOrder(true);
        setActiveOrderId(String(response.order.id || response.order.order_id));
        setActiveOrderStatus(response.order.status);
        setActiveOrderData(response.order);
        return true;
      } else {
        setHasActiveOrder(false);
        setActiveOrderId(null);
        setActiveOrderStatus('');
        setActiveOrderData(null);
        return false;
      }
    } catch (error) {
      console.error('❌ Ошибка проверки активного ордера:', error);
      return false;
    }
  };

  const showMessage = (type, text) => {
    if (showToast) {
      showToast(text, type);
    }
  };

  // ==================== ЗАПРОС КУРСА ====================
  const fetchExchangeRate = (queryAmount, mode) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    const type = mode ? 'buy' : 'sell';
    const amount = queryAmount || (mode ? 1000 : 10);
    
    console.log(`🔄 Запрос курса: ${type}, сумма: ${amount}`);
    
    simpleFetch(`/api/exchange-rate?amount=${amount}&type=${type}`)
      .then(result => {
        if (result.success) {
          setCurrentRate(result.rate);
          setMinAmount(result.min_amount);
          setMaxAmount(mode ? 1000000 : 10000);
          
          if (queryAmount) {
            const numAmount = parseFloat(queryAmount.toString().replace(',', '.'));
            if (!isNaN(numAmount)) {
              if (mode) {
                if (numAmount < limits.minBuy) {
                  setError(`Минимальная сумма: ${limits.minBuy.toLocaleString()} RUB`);
                } else if (numAmount > limits.maxBuy) {
                  setError(`Максимальная сумма: ${limits.maxBuy.toLocaleString()} RUB`);
                } else {
                  setError('');
                }
              } else {
                if (numAmount < limits.minSell) {
                  setError(`Минимальная сумма: ${limits.minSell} USDT`);
                } else if (numAmount > limits.maxSell) {
                  setError(`Максимальная сумма: ${limits.maxSell} USDT`);
                } else {
                  setError('');
                }
              }
            }
          }
        }
      })
      .catch(error => {
        if (error.name === 'AbortError') {
          console.log('🔄 Предыдущий запрос курса отменен');
        } else {
          console.error('❌ Ошибка загрузки курса:', error);
        }
      });
  };

  // ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================
  const handleAmountChange = (e) => {
    const value = e.target.value;
    
    const cleanedValue = value.replace(/[^\d.,]/g, '');
    const normalizedValue = cleanedValue.replace(',', '.');
    
    const parts = normalizedValue.split('.');
    if (parts.length > 1 && parts[1].length > 2) {
      return;
    }
    
    setAmount(cleanedValue);
    
    if (cleanedValue && cleanedValue.trim() !== '') {
      const numAmount = parseFloat(normalizedValue);
      if (!isNaN(numAmount)) {
        fetchExchangeRate(numAmount, isBuyMode);
      }
    } else {
      setError('');
      fetchExchangeRate(isBuyMode ? 1000 : 10, isBuyMode);
    }
  };

  const handleSwap = () => {
    if (hasActiveOrder) {
      showMessage('warning', `⚠️ У вас активный ордер ${activeOrderId}. Дождитесь завершения.`);
      return;
    }
    
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    
    requestAnimationFrame(() => {
      setIsSwapped(!isSwapped);
      setIsBuyMode(!isBuyMode);
      setAmount('');
      setError('');
      fetchExchangeRate(!isBuyMode ? 1000 : 10, !isBuyMode);
    });
  };

  // ==================== ОСТАЛЬНЫЕ ОБРАБОТЧИКИ ====================
  const handleAddPayment = () => {
    const isSBP = bankName === 'СБП (Система быстрых платежей)';
    if (isSBP) {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      if (cleanPhone.length !== 11 || !cleanPhone.startsWith('7')) {
        showMessage('error', '❌ Введите корректный номер телефона (+7XXXXXXXXXX)');
        return;
      }
    } else {
      const cleanCardNumber = cardNumber.replace(/\s/g, '');
      if (cleanCardNumber.length !== 16) {
        showMessage('error', '❌ Номер карты должен содержать 16 цифр');
        return;
      }
    }

    const newPayment = {
      id: Date.now().toString(),
      bankName,
      type: isSBP ? 'sbp' : 'card',
      number: isSBP ? phoneNumber : cardNumber,
      formattedNumber: isSBP ? formatPhoneNumber(phoneNumber) : formatCardNumber(cardNumber)
    };

    setPaymentMethods([...paymentMethods, newPayment]);
    setSelectedPayment(newPayment);
    setBankName('СБП (Система быстрых платежей)');
    setCardNumber('');
    setPhoneNumber('');
    showMessage('success', '✅ Реквизиты добавлены');
  };

  const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9)}`;
    }
    return phone;
  };

  const formatCardNumber = (card) => {
    const cleaned = card.replace(/\D/g, '');
    return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    let formatted = '';
    if (value.length > 0) {
      formatted = '+7';
      if (value.length > 1) {
        formatted += ` (${value.slice(1, 4)}`;
        if (value.length > 4) {
          formatted += `) ${value.slice(4, 7)}`;
          if (value.length > 7) {
            formatted += `-${value.slice(7, 9)}`;
            if (value.length > 9) formatted += `-${value.slice(9)}`;
          }
        }
      }
    }
    setPhoneNumber(formatted);
  };

  const handleCardChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleAddCryptoAddress = () => {
    if (cryptoType === 'address') {
      if (!cryptoAddress || cryptoAddress.length < 10) {
        showMessage('error', '❌ Введите корректный адрес');
        return;
      }
    } else {
      if (!cryptoUID || cryptoUID.length < 5) {
        showMessage('error', '❌ Введите корректный UID');
        return;
      }
    }

    const newCrypto = {
      id: Date.now().toString(),
      address: cryptoType === 'address' ? cryptoAddress : cryptoUID,
      network: cryptoNetwork,
      type: cryptoType,
      exchange: cryptoType === 'uid' ? selectedExchange : null,
      name: cryptoType === 'address' 
        ? `${availableNetworks.find(n => n.value === cryptoNetwork)?.name} кошелек`
        : `${selectedExchange} UID`
    };

    setCryptoAddresses([...cryptoAddresses, newCrypto]);
    setSelectedCrypto(newCrypto);
    setCryptoAddress('');
    setCryptoUID('');
    showMessage('success', '✅ Адрес добавлен');
  };

  const handleDeletePayment = (id) => {
    const updated = paymentMethods.filter(p => p.id !== id);
    setPaymentMethods(updated);
    if (selectedPayment?.id === id) setSelectedPayment(updated.length > 0 ? updated[0] : null);
    showMessage('success', '✅ Реквизиты удалены');
  };

  const handleDeleteCrypto = (id) => {
    const updated = cryptoAddresses.filter(c => c.id !== id);
    setCryptoAddresses(updated);
    if (selectedCrypto?.id === id) setSelectedCrypto(updated.length > 0 ? updated[0] : null);
    showMessage('success', '✅ Адрес удален');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => showMessage('success', '✅ Скопировано'));
  };

  const handleExchange = async () => {
    console.log('🎯 Создание ордера');
    if (hasActiveOrder) {
      showMessage('warning', `⚠️ У вас уже есть активный ордер ${activeOrderId}. Дождитесь завершения.`);
      navigateTo('history');
      return;
    }

    if (!amount) {
      showMessage('error', '❌ Введите сумму');
      return;
    }

    const normalizedAmount = amount.replace(',', '.');
    const numAmount = parseFloat(normalizedAmount);
    
    if (isNaN(numAmount)) {
      showMessage('error', '❌ Введите корректную сумму');
      return;
    }

    if (isBuyMode) {
      if (numAmount < limits.minBuy) {
        showMessage('error', `❌ Минимальная сумма: ${limits.minBuy.toLocaleString()} RUB`);
        return;
      }
      if (numAmount > limits.maxBuy) {
        showMessage('error', `❌ Максимальная сумма: ${limits.maxBuy.toLocaleString()} RUB`);
        return;
      }
      if (!selectedCrypto) {
        showMessage('error', '❌ Добавьте адрес для получения USDT');
        return;
      }
    } else {
      if (numAmount < limits.minSell) {
        showMessage('error', `❌ Минимальная сумма: ${limits.minSell} USDT`);
        return;
      }
      if (numAmount > limits.maxSell) {
        showMessage('error', `❌ Максимальная сумма: ${limits.maxSell} USDT`);
        return;
      }
      if (!selectedPayment) {
        showMessage('error', '❌ Добавьте реквизиты для получения RUB');
        return;
      }
    }

    const userId = getUserId();
    if (!userId) {
      showMessage('error', '❌ Не удалось определить ID пользователя. Обновите страницу.');
      return;
    }

    const getUserData = () => {
      try {
        if (window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          const tgUser = tg.initDataUnsafe?.user;
          if (tgUser) return {
            username: tgUser.username || `user_${tgUser.id}`,
            firstName: tgUser.first_name || 'Клиент',
            lastName: tgUser.last_name || ''
          };
        }
        const savedTelegramUser = localStorage.getItem('telegramUser');
        if (savedTelegramUser) {
          const parsed = JSON.parse(savedTelegramUser);
          return {
            username: parsed.username || `user_${userId}`,
            firstName: parsed.first_name || 'Клиент'
          };
        }
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          return {
            username: parsed.username || `user_${userId}`,
            firstName: parsed.firstName || 'Клиент'
          };
        }
      } catch (error) {
        console.error('❌ Ошибка получения данных:', error);
      }
      return { username: `user_${userId}`, firstName: 'Клиент' };
    };

    const userData = getUserData();
    const orderData = {
      type: isBuyMode ? 'buy' : 'sell',
      amount: numAmount,
      userId: userId,
      telegramId: userId,
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName || '',
      cryptoAddress: isBuyMode ? selectedCrypto?.address : null,
      cryptoUID: isBuyMode && selectedCrypto?.type === 'uid' ? selectedCrypto.address : null,
      cryptoNetwork: isBuyMode ? selectedCrypto?.network : null,
      cryptoExchange: isBuyMode && selectedCrypto?.type === 'uid' ? selectedCrypto.exchange : null,
      bankDetails: !isBuyMode ? `${selectedPayment?.bankName}: ${selectedPayment?.formattedNumber}` : null
    };

    console.log('📤 Отправляем ордер:', orderData);

    try {
      setIsLoading(true);
      showMessage('info', '🔄 Создание ордера...');
      const result = await simpleFetch('/api/create-order', orderData);

      if (result.success) {
        showMessage('success', `✅ Ордер создан! ID: ${result.order?.id}`);
        setAmount('');
        const fullUserData = {
          id: userId,
          telegramId: userId,
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName || ''
        };
        localStorage.setItem('currentUser', JSON.stringify(fullUserData));
        if (window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          const tgUser = tg.initDataUnsafe?.user;
          if (tgUser) localStorage.setItem('telegramUser', JSON.stringify(tgUser));
        }
        setHasActiveOrder(true);
        setActiveOrderId(result.order?.id);
        setTimeout(() => navigateTo('history'), 2000);
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
    if (hasActiveOrder) return false;
    if (!amount || error) return false;
    
    const normalizedAmount = amount.replace(',', '.');
    const numAmount = parseFloat(normalizedAmount);
    
    if (isNaN(numAmount)) return false;
    if (isBuyMode) {
      if (numAmount < limits.minBuy || numAmount > limits.maxBuy) return false;
      if (!selectedCrypto) return false;
    } else {
      if (numAmount < limits.minSell || numAmount > limits.maxSell) return false;
      if (!selectedPayment) return false;
    }
    return true;
  };

  // ==================== EFFECTS ====================
  useEffect(() => {
    console.log('🏠 Home компонент загружен');
    
    fetchExchangeRate(1000, true);
    
    const tgUser = getTelegramUser();
    if (tgUser) {
      const userData = {
        id: tgUser.id.toString(),
        telegramId: tgUser.id,
        username: tgUser.username || `user_${tgUser.id}`,
        firstName: tgUser.first_name || 'Пользователь',
        lastName: tgUser.last_name || '',
        photoUrl: tgUser.photo_url
      };
      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('telegramUser', JSON.stringify(tgUser));
    } else if (telegramUser) {
      const userData = {
        id: `user_${telegramUser.id}`,
        telegramId: telegramUser.id,
        username: telegramUser.username || `user_${telegramUser.id}`,
        firstName: telegramUser.first_name || 'Пользователь'
      };
      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('telegramUser', JSON.stringify(telegramUser));
    }

    loadSavedData();
    setTimeout(() => checkActiveOrder(), 1000);
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const loadSavedData = () => {
    try {
      const savedPayments = localStorage.getItem('userPaymentMethods');
      if (savedPayments) {
        const payments = JSON.parse(savedPayments);
        setPaymentMethods(payments);
        if (payments.length > 0) setSelectedPayment(payments[0]);
      }
      const savedCrypto = localStorage.getItem('userCryptoAddresses');
      if (savedCrypto) {
        const crypto = JSON.parse(savedCrypto);
        setCryptoAddresses(crypto);
        if (crypto.length > 0) setSelectedCrypto(crypto[0]);
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки данных:', error);
    }
  };

  useEffect(() => {
    localStorage.setItem('userPaymentMethods', JSON.stringify(paymentMethods));
    localStorage.setItem('userCryptoAddresses', JSON.stringify(cryptoAddresses));
  }, [paymentMethods, cryptoAddresses]);

  useEffect(() => {
    fetchExchangeRate(amount || (isBuyMode ? 1000 : 10), isBuyMode);
  }, [isBuyMode]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!hasActiveOrder) checkActiveOrder();
    }, 30000);
    return () => clearInterval(interval);
  }, [hasActiveOrder]);

  // ==================== ВЫЧИСЛЯЕМЫЕ ЗНАЧЕНИЯ ====================
  const convertedAmount = () => {
    if (!amount) return '';
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount)) return '';
    return isBuyMode 
      ? (numAmount / currentRate).toFixed(2) 
      : (numAmount * currentRate).toFixed(2);
  };

  const getStatusText = (status) => {
    const statuses = {
      'pending': 'Ожидание',
      'processing': 'В обработке',
      'accepted': 'Принят',
      'completed': 'Завершен',
      'cancelled': 'Отменен',
      'rejected': 'Отклонен'
    };
    return statuses[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#ffd700',
      'processing': '#ffa500',
      'accepted': '#34c759',
      'completed': '#3390ec',
      'cancelled': '#ff3b30',
      'rejected': '#ff3b30'
    };
    return colors[status] || '#8e8e93';
  };

  const isSBPSelected = bankName === 'СБП (Система быстрых платежей)';
  const selectedNetwork = availableNetworks.find(n => n.value === cryptoNetwork);
  const selectedExchangeData = availableExchanges.find(e => e.value === selectedExchange);

  // ==================== РЕНДЕР ====================
  return (
    <div className="home-container">
      {hasActiveOrder ? (
        <div className="tg-home-container">
          {/* Шапка с кнопкой назад */}
          <div className="tg-header">
            <div className="tg-header-content">
              <button 
                className="tg-back-btn"
                onClick={() => navigateTo('history')}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className="tg-header-titles">
                <h1 className="tg-header-title">Активная заявка</h1>
                <p className="tg-header-subtitle">ID: {activeOrderData?.public_id || activeOrderId}</p>
              </div>
              <div 
                className="tg-header-status"
                style={{ 
                  background: `${getStatusColor(activeOrderData?.status)}20`,
                  color: getStatusColor(activeOrderData?.status)
                }}
              >
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
              {/* Заголовок карточки с иконкой */}
              <div className="tg-card-header">
                <div 
                  className="tg-order-icon"
                  style={{ 
                    background: `${getStatusColor(activeOrderData?.status)}15`,
                    color: getStatusColor(activeOrderData?.status)
                  }}
                >
                  {activeOrderData?.order_type === 'buy' ? '🛒' : '💰'}
                </div>
                <div className="tg-order-info">
                  <h2 className="tg-order-title">
                    {activeOrderData?.order_type === 'buy' ? 'Покупка USDT' : 'Продажа USDT'}
                  </h2>
                  <p className="tg-order-subtitle">
                    от {activeOrderData?.created_at ? new Date(activeOrderData.created_at).toLocaleDateString('ru-RU') : '-'}
                  </p>
                </div>
              </div>

              {/* Детали ордера */}
              <div className="tg-order-details">
                {/* Вы отдаете */}
                <div className="tg-detail-row">
                  <span className="tg-detail-label">Вы отдаете</span>
                  <span className="tg-detail-value tg-detail-big">
                    {activeOrderData?.amount} {activeOrderData?.order_type === 'buy' ? 'RUB' : 'USDT'}
                  </span>
                </div>

                {/* Курс */}
                <div className="tg-detail-row">
                  <span className="tg-detail-label">Курс</span>
                  <span className="tg-detail-value">
                    1 USDT = {activeOrderData?.rate} ₽
                  </span>
                </div>

                {/* Вы получаете */}
                <div className="tg-detail-row tg-detail-highlight">
                  <span className="tg-detail-label">Вы получаете</span>
                  <span className="tg-detail-value tg-detail-big tg-detail-accent">
                    {activeOrderData?.order_type === 'buy' 
                      ? `${(activeOrderData.amount / activeOrderData.rate).toFixed(2)} USDT`
                      : `${(activeOrderData.amount * activeOrderData.rate).toFixed(2)} ₽`
                    }
                  </span>
                </div>

                {/* Реквизиты/Адрес */}
                {activeOrderData?.order_type === 'sell' && activeOrderData?.bank_details && (
                  <div className="tg-detail-row tg-detail-full">
                    <span className="tg-detail-label">Реквизиты получателя</span>
                    <div className="tg-detail-value tg-detail-box">
                      <span className="tg-detail-mono">{activeOrderData.bank_details}</span>
                      <button 
                        className="tg-copy-btn"
                        onClick={() => copyToClipboard(activeOrderData.bank_details)}
                      >
                        📋
                      </button>
                    </div>
                  </div>
                )}

                {activeOrderData?.order_type === 'buy' && activeOrderData?.crypto_address && (
                  <div className="tg-detail-row tg-detail-full">
                    <span className="tg-detail-label">Адрес для USDT</span>
                    <div className="tg-detail-value tg-detail-box">
                      <span className="tg-detail-mono">{activeOrderData.crypto_address}</span>
                      <button 
                        className="tg-copy-btn"
                        onClick={() => copyToClipboard(activeOrderData.crypto_address)}
                      >
                        📋
                      </button>
                    </div>
                    {activeOrderData?.crypto_network && (
                      <span className="tg-detail-network">{activeOrderData.crypto_network}</span>
                    )}
                  </div>
                )}

                {/* Дополнительная информация */}
                <div className="tg-detail-row tg-detail-small">
                  <span className="tg-detail-label">Создан</span>
                  <span className="tg-detail-value">
                    {activeOrderData?.created_at 
                      ? new Date(activeOrderData.created_at).toLocaleString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit'
                        })
                      : '-'
                    }
                  </span>
                </div>

                <div className="tg-detail-row tg-detail-small">
                  <span className="tg-detail-label">ID заявки</span>
                  <span className="tg-detail-value tg-detail-mono">
                    #{activeOrderData?.public_id || activeOrderId}
                  </span>
                </div>
              </div>

              {/* Кнопки действий */}
              <div className="tg-actions">
                <button 
                  className="tg-action-btn tg-action-btn-primary"
                  onClick={() => navigateTo('history')}
                >
                  <span className="tg-btn-icon">📋</span>
                  История операций
                </button>
                
                {activeOrderData?.status === 'pending' && (
                  <button 
                    className="tg-action-btn tg-action-btn-secondary"
                    onClick={() => {
                      showMessage('info', '⚡ Функция отмены появится в ближайшее время', 'info');
                    }}
                  >
                    <span className="tg-btn-icon">🚫</span>
                    Отменить заявку
                  </button>
                )}

                {activeOrderData?.status === 'accepted' && (
                  <div className="tg-action-info">
                    ⏳ Ожидайте подтверждения от администратора
                  </div>
                )}
              </div>
            </div>

            {/* Информационный блок */}
            <div className="tg-info-block">
              <div className="tg-info-icon">ℹ️</div>
              <div className="tg-info-text">
                Статус заявки обновляется автоматически. Вы получите уведомление при изменении статуса.
              </div>
            </div>
          </div>
        </div>
      ) : (
        // ОСНОВНОЙ ИНТЕРФЕЙС ОБМЕНА
        <div className="home-content">
          <div className="currency-cards-section">
            <div className="currency-cards-horizontal">
              <div className="currency-card-side left-card">
                <div className="currency-content">
                  <span className="currency-name">
                    {isBuyMode ? "RUB" : "USDT"}
                  </span>
                  {isBuyMode && (
                    <span className="currency-rate light">
                      {currentRate.toFixed(2)} ₽
                    </span>
                  )}
                </div>
              </div>

              <button
                className={`swap-center-button ${isSwapped ? 'swapped' : ''}`}
                onClick={handleSwap}
                disabled={hasActiveOrder}
              >
                <SwapIcon isSwapped={isSwapped} />
              </button>

              <div className="currency-card-side right-card">
                <div className="currency-content">
                  <span className="currency-name">
                    {isBuyMode ? "USDT" : "RUB"}
                  </span>
                  {!isBuyMode && (
                    <span className="currency-rate light">
                      {currentRate.toFixed(2)} ₽
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="amount-input-section">
              <div className="amount-input-group">
                <label className="amount-label">Вы отдаете</label>
                <div className="amount-input-wrapper">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={amount}
                    onChange={handleAmountChange}
                    className="amount-input"
                    disabled={isLoading}
                  />
                  <span className="amount-currency">
                    {isBuyMode ? "RUB" : "USDT"}
                  </span>
                </div>
                <div className="min-limit-hint">
                  {isBuyMode
                    ? `${limits.minBuy.toLocaleString()} - ${limits.maxBuy.toLocaleString()} RUB`
                    : `${limits.minSell} - ${limits.maxSell} USDT`
                  }
                </div>
                {error && <div className="error-message">{error}</div>}
              </div>

              <div className="amount-input-group">
                <label className="amount-label">Вы получаете</label>
                <div className="amount-input-wrapper">
                  <input
                    type="text"
                    placeholder="0"
                    value={convertedAmount()}
                    readOnly
                    className="amount-input"
                  />
                  <span className="amount-currency">
                    {isBuyMode ? "USDT" : "RUB"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {isBuyMode ? (
            <div className="payment-section-new">
              <div className="payment-header-new">
                <h3 className="section-title">Адрес для получения USDT</h3>
              </div>

              <div className="crypto-type-switcher">
                <button 
                  className={`crypto-type-btn ${cryptoType === 'address' ? 'active' : ''}`}
                  onClick={() => setCryptoType('address')}
                >
                  <span className="crypto-type-icon">📫</span>
                  <span className="crypto-type-text">Адрес кошелька</span>
                </button>
                <button 
                  className={`crypto-type-btn ${cryptoType === 'uid' ? 'active' : ''}`}
                  onClick={() => setCryptoType('uid')}
                >
                  <span className="crypto-type-icon">🆔</span>
                  <span className="crypto-type-text">UID перевод</span>
                </button>
              </div>

              <div className="add-form">
                {cryptoType === 'address' ? (
                  <>
                    <div className="select-with-icon">
                      <select
                        value={cryptoNetwork}
                        onChange={(e) => setCryptoNetwork(e.target.value)}
                        className="network-select"
                      >
                        <option value="">Выберите сеть</option>
                        {popularNetworks.map(network => (
                          <option key={network.value} value={network.value}>
                            {network.name}
                          </option>
                        ))}
                      </select>
                      {cryptoNetwork && selectedNetwork && (
                        <div className="selected-network-icon">
                          {selectedNetwork.icon}
                        </div>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="Введите адрес кошелька"
                      value={cryptoAddress}
                      onChange={(e) => setCryptoAddress(e.target.value)}
                      className="address-input"
                    />
                  </>
                ) : (
                  <>
                    <div className="select-with-icon">
                      <select
                        value={selectedExchange}
                        onChange={(e) => setSelectedExchange(e.target.value)}
                        className="exchange-select"
                      >
                        <option value="">Выберите биржу</option>
                        {availableExchanges.map(exchange => (
                          <option key={exchange.value} value={exchange.value}>
                            {exchange.name}
                          </option>
                        ))}
                      </select>
                      {selectedExchange && selectedExchangeData && (
                        <div className="selected-exchange-icon">
                          {selectedExchangeData.icon}
                        </div>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="Введите UID биржи"
                      value={cryptoUID}
                      onChange={(e) => setCryptoUID(e.target.value)}
                      className="uid-input"
                    />
                  </>
                )}

                <button
                  onClick={handleAddCryptoAddress}
                  className="add-button"
                >
                  +
                </button>
              </div>

              {cryptoAddresses.length > 0 && (
                <div className="crypto-list">
                  <h4>Ваши адреса:</h4>
                  {cryptoAddresses.map((crypto) => {
                    const network = crypto.type === 'address' 
                      ? availableNetworks.find(n => n.value === crypto.network)
                      : null;
                    const exchange = crypto.type === 'uid'
                      ? availableExchanges.find(e => e.value === crypto.exchange)
                      : null;
                    
                    return (
                      <div
                        key={crypto.id}
                        className={`crypto-item ${selectedCrypto?.id === crypto.id ? 'selected' : ''}`}
                        onClick={() => setSelectedCrypto(crypto)}
                      >
                        <div className="crypto-info">
                          <div className="crypto-header">
                            <span className="crypto-name">
                              {crypto.name}
                            </span>
                            <span className="crypto-network-badge">
                              {crypto.type === 'address' 
                                ? (network?.icon || crypto.network)
                                : (exchange?.icon || crypto.exchange)
                              }
                              <span className="crypto-network-text">
                                {crypto.type === 'address' ? crypto.network : crypto.exchange}
                              </span>
                            </span>
                          </div>
                          <div className="crypto-address">
                            {crypto.address.length > 20 
                              ? `${crypto.address.slice(0, 12)}...${crypto.address.slice(-8)}`
                              : crypto.address
                            }
                            {crypto.type === 'uid' && <span className="uid-label"> (UID)</span>}
                          </div>
                        </div>
                        <div className="crypto-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(crypto.address);
                            }}
                            className="action-btn copy-btn"
                            title="Копировать"
                          >
                            📋
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCrypto(crypto.id);
                            }}
                            className="action-btn delete-btn"
                            title="Удалить"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {cryptoAddresses.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">🏦</div>
                  <p className="empty-text">
                    {cryptoType === 'address' 
                      ? 'Добавьте адрес для получения USDT'
                      : 'Добавьте UID биржи для получения USDT'
                    }
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="payment-section-new">
              <div className="payment-header-new">
                <h3 className="section-title">Реквизиты для получения RUB</h3>
              </div>

              <div className="add-form">
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="bank-select"
                >
                  {availableBanks.map(bank => (
                    <option key={bank} value={bank}>
                      {bank === 'СБП (Система быстрых платежей)' ? '📱 ' + bank : '💳 ' + bank}
                    </option>
                  ))}
                </select>

                {isSBPSelected ? (
                  <input
                    type="tel"
                    placeholder="+7 (999) 123-45-67"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    className="phone-input"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={handleCardChange}
                    className="card-input"
                    maxLength={19}
                  />
                )}

                <button
                  onClick={handleAddPayment}
                  className="add-button"
                >
                  +
                </button>
              </div>

              {paymentMethods.length > 0 && (
                <div className="payments-list">
                  <h4>Ваши реквизиты:</h4>
                  {paymentMethods.map((payment) => (
                    <div
                      key={payment.id}
                      className={`payment-item ${selectedPayment?.id === payment.id ? 'selected' : ''}`}
                      onClick={() => setSelectedPayment(payment)}
                    >
                      <div className="payment-info">
                        <div className="payment-header">
                          <span className="bank-name">
                            {payment.bankName}
                          </span>
                          {payment.type === 'sbp' && (
                            <span className="sbp-badge">СБП</span>
                          )}
                        </div>
                        <div className="payment-number">
                          {payment.formattedNumber}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePayment(payment.id);
                        }}
                        className="action-btn delete-btn"
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {paymentMethods.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">💳</div>
                  <p className="empty-text">
                    Добавьте реквизиты для получения RUB
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            className={`exchange-button-new ${isBuyMode ? 'buy' : 'sell'} ${!isExchangeReady() ? 'disabled' : ''}`}
            disabled={!isExchangeReady() || isLoading}
            onClick={handleExchange}
          >
            <span className="exchange-icon">
              {isBuyMode ? '🛒' : '💰'}
            </span>
            <span className="exchange-text">
              {isLoading ? '🔄 Обработка...' : (isBuyMode ? 'Купить USDT' : 'Продать USDT')}
            </span>
          </button>

          <div className="security-info">
            <div className="security-icon">🔒</div>
            <div className="security-text">
              <strong>Безопасная сделка:</strong> Средства резервируются у Операторов до подтверждения сделки системой TetherRabbit
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;