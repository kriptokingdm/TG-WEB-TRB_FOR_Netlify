import React from "react";
import { useState, useEffect } from 'react';
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

const simpleFetch = async (endpoint, data = null) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method: data ? 'POST' : 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
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
  const buttonColor = getComputedStyle(document.documentElement).getPropertyValue('--tg-button-color').trim() || '#3390ec';
  const buttonTextColor = getComputedStyle(document.documentElement).getPropertyValue('--tg-button-text-color').trim() || '#ffffff';
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  
  return (
    <svg 
      width="52" 
      height="52" 
      viewBox="0 0 52 52" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ 
        transform: isSwapped ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.3s ease'
      }}
    >
      <circle cx="26" cy="26" r="24" fill={buttonColor} stroke={theme === 'dark' ? '#2c2c2c' : '#EFEFF3'} strokeWidth="3"/>
      <path d="M34 16C37.31 18.33 39.5 22 39.5 26C39.5 33.1 33.6 39 26.5 39H25.5M18 36C14.69 33.67 12.5 30 12.5 26C12.5 18.9 18.4 13 25.5 13H26.5M28.5 42L25 38.5L28.5 35M25 17L28.5 13.5L25 10" 
        stroke={buttonTextColor} 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"/>
    </svg>
  );
};

function Home({ navigateTo, telegramUser, showToast }) {
  console.log('🏠 Home загружен');

  const [isBuyMode, setIsBuyMode] = useState(true);
  const [isSwapped, setIsSwapped] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [rates, setRates] = useState({ buy: 88.0, sell: 84.0 });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [activeOrderStatus, setActiveOrderStatus] = useState('');
  const [limits, setLimits] = useState({
    minBuy: 1000,
    maxBuy: 100000,
    minSell: 10,
    maxSell: 10000
  });
  
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
  const [activeOrderData, setActiveOrderData] = useState(null);

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
    { 
      value: 'TRC20', 
      name: 'TRC20', 
      icon: <TRC20Icon size={20} />, 
      popular: true 
    },
    { 
      value: 'ERC20', 
      name: 'ERC20', 
      icon: <ERCIcon size={20} />, 
      popular: true 
    },
    { 
      value: 'BEP20', 
      name: 'BEP20', 
      icon: <BinanceIcon size={20} />, 
      popular: true 
    },
    { 
      value: 'SOLANA', 
      name: 'Solana', 
      icon: <SolanaIcon size={20} />, 
      popular: true 
    },
    { 
      value: 'POLYGON', 
      name: 'Polygon', 
      icon: <div className="polygon-icon">P</div>, 
      popular: false 
    },
  ];

  const availableExchanges = [
    { 
      value: 'Binance', 
      name: 'Binance', 
      icon: <BinanceIcon size={20} /> 
    },
    { 
      value: 'Bybit', 
      name: 'Bybit', 
      icon: <BybitIcon size={20} /> 
    },
    { 
      value: 'OKX', 
      name: 'OKX', 
      icon: <OKXIcon size={20} /> 
    },
    { 
      value: 'MEX', 
      name: 'MEX', 
      icon: <MEXIcon size={20} /> 
    },
    { 
      value: 'BitGet', 
      name: 'BitGet', 
      icon: <BitGetIcon size={20} /> 
    }
  ];

  const popularNetworks = availableNetworks.filter(n => n.popular);

  // Получение текущих цветов темы
  const getThemeColors = () => {
    return {
      bgColor: getComputedStyle(document.documentElement).getPropertyValue('--tg-bg-color').trim() || '#ffffff',
      textColor: getComputedStyle(document.documentElement).getPropertyValue('--tg-text-color').trim() || '#000000',
      hintColor: getComputedStyle(document.documentElement).getPropertyValue('--tg-hint-color').trim() || '#8e8e93',
      buttonColor: getComputedStyle(document.documentElement).getPropertyValue('--tg-button-color').trim() || '#3390ec',
      buttonTextColor: getComputedStyle(document.documentElement).getPropertyValue('--tg-button-text-color').trim() || '#ffffff',
      secondaryBgColor: getComputedStyle(document.documentElement).getPropertyValue('--tg-secondary-bg-color').trim() || '#f1f1f1',
      sectionBgColor: getComputedStyle(document.documentElement).getPropertyValue('--tg-section-bg-color').trim() || '#e7e8ec'
    };
  };

  // Функции
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
        setActiveOrderId(response.order.order_id);
        setActiveOrderStatus(response.order.admin_status);
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

  // Показать сообщение
  const showMessage = (type, text) => {
    if (showToast) {
      showToast(text, type);
    } else {
      setMessage(text);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Инициализация
  useEffect(() => {
    console.log('🏠 Home компонент загружен');
    fetchExchangeRates();

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

    return () => {};
  }, [telegramUser]);

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

  const calculateConvertedAmount = () => {
    if (!amount) return '';
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount)) return '';
    const rate = isBuyMode ? rates.buy : rates.sell;
    const converted = isBuyMode ? (numAmount / rate).toFixed(2) : (numAmount * rate).toFixed(2);
    return converted;
  };

  const fetchExchangeRates = async () => {
    try {
      const queryAmount = amount || (isBuyMode ? 1000 : 10);
      const type = isBuyMode ? 'buy' : 'sell';
      const result = await simpleFetch(`/exchange-rate?amount=${queryAmount}&type=${type}`);
      console.log('📊 Получены курсы и лимиты:', result);
      
      if (result.success) {
        setRates(prev => ({
          ...prev,
          [isBuyMode ? 'buy' : 'sell']: result.rate || (isBuyMode ? 88.0 : 84.0)
        }));
        if (result.min_amount && result.max_amount) {
          setLimits(prev => ({
            minBuy: isBuyMode ? result.min_amount : prev.minBuy,
            maxBuy: result.max_amount,
            minSell: !isBuyMode ? result.min_amount : prev.minSell,
            maxSell: result.max_amount
          }));
        }
      }
    } catch (error) {
      console.error('Ошибка курсов:', error);
    }
  };

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
        if (isBuyMode) {
          if (numAmount < limits.minBuy) {
            setError(`Минимальная сумма: ${limits.minBuy.toLocaleString()} RUB`);
          } else if (numAmount > limits.maxBuy) {
            setError(`Максимальная сумма: ${limits.maxBuy.toLocaleString()} RUB`);
          } else {
            setError('');
            fetchExchangeRates();
          }
        } else {
          if (numAmount < limits.minSell) {
            setError(`Минимальная сумма: ${limits.minSell} USDT`);
          } else if (numAmount > limits.maxSell) {
            setError(`Максимальная сумма: ${limits.maxSell} USDT`);
          } else {
            setError('');
            fetchExchangeRates();
          }
        }
      }
    } else {
      setError('');
    }
  };

  const handleSwap = () => {
    if (hasActiveOrder) {
      showMessage('warning', `⚠️ У вас активный ордер ${activeOrderId}. Дождитесь его завершения.`);
      return;
    }
    
    // ВИБРАЦИЯ
    const triggerHapticFeedback = () => {
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
      
      if (window.Telegram?.WebApp?.HapticFeedback) {
        try {
          const tg = window.Telegram.WebApp;
          if (tg.HapticFeedback.selectionChanged) {
            tg.HapticFeedback.selectionChanged();
          }
        } catch (e) {}
      }
    };
    
    triggerHapticFeedback();
    
    setIsSwapped(!isSwapped);
    setIsBuyMode(!isBuyMode);
    setAmount('');
    setError('');
    fetchExchangeRates();
  };

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
      showMessage('warning', `⚠️ У вас уже есть активный ордер ${activeOrderId}. Дождитесь его завершения.`);
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
      const result = await simpleFetch('/create-order', orderData);

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

  useEffect(() => {
    fetchExchangeRates();
  }, [isBuyMode]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!hasActiveOrder) checkActiveOrder();
    }, 30000);
    return () => clearInterval(interval);
  }, [hasActiveOrder]);

  const currentRate = isBuyMode ? rates.buy : rates.sell;
  const convertedAmount = calculateConvertedAmount();
  const isSBPSelected = bankName === 'СБП (Система быстрых платежей)';
  const selectedNetwork = availableNetworks.find(n => n.value === cryptoNetwork);
  const selectedExchangeData = availableExchanges.find(e => e.value === selectedExchange);

  // Получаем цвета темы
  const themeColors = getThemeColors();

  // Стили для элементов
  const cardStyle = {
    background: themeColors.bgColor,
    borderColor: themeColors.sectionBgColor,
    color: themeColors.textColor
  };

  const inputStyle = {
    background: themeColors.secondaryBgColor,
    borderColor: themeColors.sectionBgColor,
    color: themeColors.textColor
  };

  const buttonStyle = {
    background: themeColors.buttonColor,
    color: themeColors.buttonTextColor
  };

  const accentButtonStyle = {
    background: '#30d158',
    color: themeColors.buttonTextColor
  };

  const warningButtonStyle = {
    background: '#ff9500',
    color: themeColors.buttonTextColor
  };

  const errorButtonStyle = {
    background: '#ff3b30',
    color: themeColors.buttonTextColor
  };

  const secondaryButtonStyle = {
    background: themeColors.secondaryBgColor,
    color: themeColors.textColor,
    borderColor: themeColors.sectionBgColor
  };

  const hintStyle = {
    color: themeColors.hintColor
  };

  return (
    <div className="home-container">
      {hasActiveOrder ? (
        // ТЕЛЕГРАМ СТИЛЬ ДЛЯ АКТИВНОГО ОРДЕРА
        <div className="tg-home-container">
          {/* Шапка в стиле Telegram */}
          <div className="tg-header" style={cardStyle}>
            <div className="tg-header-content">
              <button 
                className="tg-back-btn"
                onClick={() => navigateTo('history')}
                title="К истории операций"
                style={{ color: themeColors.buttonColor }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className="tg-header-titles">
                <h1 className="tg-header-title" style={{ color: themeColors.textColor }}>Активная заявка</h1>
                <p className="tg-header-subtitle" style={hintStyle}>Ваш ордер в обработке</p>
              </div>
              <div className="tg-header-status" style={{ color: themeColors.buttonColor }}>
                ⏳ Обрабатывается
              </div>
            </div>
          </div>

          {/* Основной контент */}
          <div className="tg-main-content">
            {/* Карточка ордера */}
            <div className="tg-order-card" style={cardStyle}>
              <div className="tg-card-header">
                <div className="tg-order-icon" style={{ background: `${themeColors.buttonColor}20`, color: themeColors.buttonColor }}>
                  ⏳
                </div>
                <div className="tg-order-info">
                  <h2 className="tg-order-title" style={{ color: themeColors.textColor }}>
                    Заявка #{activeOrderId?.substring(0, 8)}
                  </h2>
                  <p className="tg-order-subtitle" style={hintStyle}>
                    {activeOrderData?.operation_type === 'buy' ? '🛒 Покупка USDT' : '💰 Продажа USDT'}
                  </p>
                </div>
              </div>

              {/* Детали ордера */}
              <div className="tg-order-details">
                <div className="tg-detail-row" style={secondaryButtonStyle}>
                  <span className="tg-detail-label" style={hintStyle}>Сумма</span>
                  <span className="tg-detail-value" style={{ color: themeColors.textColor }}>
                    <strong>{activeOrderData?.amount} {activeOrderData?.operation_type === 'buy' ? 'RUB' : 'USDT'}</strong>
                  </span>
                </div>
                
                <div className="tg-detail-row" style={secondaryButtonStyle}>
                  <span className="tg-detail-label" style={hintStyle}>Курс</span>
                  <span className="tg-detail-value" style={{ color: themeColors.textColor }}>
                    {activeOrderData?.rate} ₽/USDT
                  </span>
                </div>
                
                <div className="tg-detail-row" style={secondaryButtonStyle}>
                  <span className="tg-detail-label" style={hintStyle}>К получению</span>
                  <span className="tg-detail-value" style={{ color: themeColors.buttonColor }}>
                    <strong>
                      {activeOrderData?.operation_type === 'buy' 
                        ? `${(activeOrderData?.amount / activeOrderData?.rate).toFixed(2)} USDT`
                        : `${(activeOrderData?.amount * activeOrderData?.rate).toFixed(2)} ₽`}
                    </strong>
                  </span>
                </div>
                
                <div className="tg-detail-row" style={secondaryButtonStyle}>
                  <span className="tg-detail-label" style={hintStyle}>Создано</span>
                  <span className="tg-detail-value" style={{ color: themeColors.textColor }}>
                    {activeOrderData?.created_at ? new Date(activeOrderData.created_at).toLocaleString('ru-RU') : '-'}
                  </span>
                </div>
                
                {activeOrderData?.bank_details && (
                  <div className="tg-detail-row" style={secondaryButtonStyle}>
                    <span className="tg-detail-label" style={hintStyle}>Реквизиты</span>
                    <span className="tg-detail-value tg-detail-mono" style={{ color: themeColors.textColor }}>
                      {activeOrderData.bank_details}
                    </span>
                  </div>
                )}
                
                {activeOrderData?.crypto_address && (
                  <div className="tg-detail-row" style={secondaryButtonStyle}>
                    <span className="tg-detail-label" style={hintStyle}>Адрес USDT</span>
                    <span className="tg-detail-value tg-detail-mono" style={{ color: themeColors.textColor }}>
                      {activeOrderData.crypto_address}
                    </span>
                  </div>
                )}
              </div>

              {/* Кнопки действий */}
              <div className="tg-actions">
                <button 
                  className="tg-action-btn primary"
                  onClick={() => navigateTo('history')}
                  style={buttonStyle}
                >
                  <span className="tg-btn-icon">📋</span>
                  Детали заявки
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // ОБЫЧНЫЙ ИНТЕРФЕЙС ОБМЕНА
        <div className="home-content">
          {/* Карточки валют */}
          <div className="currency-cards-section" style={cardStyle}>
            <div className="currency-cards-horizontal">
              <div className="currency-card-side left-card" style={{ background: `${themeColors.buttonColor}15`, borderColor: themeColors.sectionBgColor }}>
                <div className="currency-content">
                  <span className="currency-name" style={{ color: themeColors.textColor }}>
                    {isBuyMode ? "RUB" : "USDT"}
                  </span>
                  {isBuyMode && (
                    <span className="currency-rate light" style={hintStyle}>
                      {currentRate.toFixed(2)} ₽
                    </span>
                  )}
                </div>
              </div>

              <button
                className={`swap-center-button ${isSwapped ? 'swapped' : ''}`}
                onClick={handleSwap}
                disabled={hasActiveOrder}
                title={hasActiveOrder ? "Дождитесь завершения активного ордера" : "Поменять местами"}
              >
                <SwapIcon isSwapped={isSwapped} />
              </button>

              <div className="currency-card-side right-card" style={{ background: `${themeColors.buttonColor}15`, borderColor: themeColors.sectionBgColor }}>
                <div className="currency-content">
                  <span className="currency-name" style={{ color: themeColors.textColor }}>
                    {isBuyMode ? "USDT" : "RUB"}
                  </span>
                  {!isBuyMode && (
                    <span className="currency-rate light" style={hintStyle}>
                      {currentRate.toFixed(2)} ₽
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="amount-input-section">
              <div className="amount-input-group">
                <label className="amount-label" style={hintStyle}>Вы отдаете</label>
                <div className="amount-input-wrapper">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={amount}
                    onChange={handleAmountChange}
                    className="amount-input"
                    disabled={isLoading}
                    style={inputStyle}
                  />
                  <span className="amount-currency" style={hintStyle}>
                    {isBuyMode ? "RUB" : "USDT"}
                  </span>
                </div>
                <div className="min-limit-hint" style={hintStyle}>
                  {isBuyMode
                    ? `${limits.minBuy.toLocaleString()} - ${limits.maxBuy.toLocaleString()} RUB`
                    : `${limits.minSell} - ${limits.maxSell} USDT`
                  }
                </div>
                {error && <div className="error-message" style={{ color: '#ff3b30' }}>{error}</div>}
              </div>

              <div className="amount-input-group">
                <label className="amount-label" style={hintStyle}>Вы получаете</label>
                <div className="amount-input-wrapper">
                  <input
                    type="text"
                    placeholder="0"
                    value={convertedAmount}
                    readOnly
                    className="amount-input"
                    style={inputStyle}
                  />
                  <span className="amount-currency" style={hintStyle}>
                    {isBuyMode ? "USDT" : "RUB"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {isBuyMode && (
            <div className="payment-section-new" style={cardStyle}>
              <div className="payment-header-new">
                <h3 className="section-title" style={{ color: themeColors.textColor }}>Адрес для получения USDT</h3>
              </div>

              <div className="crypto-type-switcher" style={secondaryButtonStyle}>
                <button 
                  className={`crypto-type-btn ${cryptoType === 'address' ? 'active' : ''}`}
                  onClick={() => setCryptoType('address')}
                  style={cryptoType === 'address' ? buttonStyle : { background: 'transparent', color: themeColors.hintColor }}
                >
                  <span className="crypto-type-icon">📫</span>
                  <span className="crypto-type-text">Адрес кошелька</span>
                </button>
                <button 
                  className={`crypto-type-btn ${cryptoType === 'uid' ? 'active' : ''}`}
                  onClick={() => setCryptoType('uid')}
                  style={cryptoType === 'uid' ? buttonStyle : { background: 'transparent', color: themeColors.hintColor }}
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
                        style={inputStyle}
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
                      style={inputStyle}
                    />
                  </>
                ) : (
                  <>
                    <div className="select-with-icon">
                      <select
                        value={selectedExchange}
                        onChange={(e) => setSelectedExchange(e.target.value)}
                        className="exchange-select"
                        style={inputStyle}
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
                      style={inputStyle}
                    />
                  </>
                )}

                <button
                  onClick={handleAddCryptoAddress}
                  className="add-button"
                  style={buttonStyle}
                >
                  + Добавить {cryptoType === 'address' ? 'адрес' : 'UID'}
                </button>
              </div>

              {cryptoAddresses.length > 0 && (
                <div className="crypto-list">
                  <h4 style={hintStyle}>Ваши адреса:</h4>
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
                        style={selectedCrypto?.id === crypto.id ? 
                          { background: `${themeColors.buttonColor}15`, borderColor: themeColors.buttonColor } : 
                          secondaryButtonStyle
                        }
                      >
                        <div className="crypto-info">
                          <div className="crypto-header">
                            <span className="crypto-name" style={{ color: themeColors.textColor }}>
                              {crypto.name}
                            </span>
                            <span className="crypto-network-badge" style={{ background: `${themeColors.buttonColor}20`, color: themeColors.buttonColor }}>
                              {crypto.type === 'address' 
                                ? (network?.icon || crypto.network)
                                : (exchange?.icon || crypto.exchange)
                              }
                              <span className="crypto-network-text">
                                {crypto.type === 'address' ? crypto.network : crypto.exchange}
                              </span>
                            </span>
                          </div>
                          <div className="crypto-address" style={hintStyle}>
                            {crypto.address.length > 20 
                              ? `${crypto.address.slice(0, 12)}...${crypto.address.slice(-8)}`
                              : crypto.address
                            }
                            {crypto.type === 'uid' && <span className="uid-label" style={{ background: `${themeColors.buttonColor}20`, color: themeColors.buttonColor }}> (UID)</span>}
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
                            style={{ color: themeColors.buttonColor }}
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
                            style={{ color: '#ff3b30' }}
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
                  <div className="empty-icon" style={hintStyle}>🏦</div>
                  <p className="empty-text" style={hintStyle}>
                    {cryptoType === 'address' 
                      ? 'Добавьте адрес для получения USDT'
                      : 'Добавьте UID биржи для получения USDT'
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {!isBuyMode && (
            <div className="payment-section-new" style={cardStyle}>
              <div className="payment-header-new">
                <h3 className="section-title" style={{ color: themeColors.textColor }}>Реквизиты для получения RUB</h3>
              </div>

              <div className="add-form">
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="bank-select"
                  style={inputStyle}
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
                    style={inputStyle}
                  />
                ) : (
                  <input
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={handleCardChange}
                    className="card-input"
                    maxLength={19}
                    style={inputStyle}
                  />
                )}

                <button
                  onClick={handleAddPayment}
                  className="add-button"
                  style={buttonStyle}
                >
                  + Добавить реквизиты
                </button>
              </div>

              {paymentMethods.length > 0 && (
                <div className="payments-list">
                  <h4 style={hintStyle}>Ваши реквизиты:</h4>
                  {paymentMethods.map((payment) => (
                    <div
                      key={payment.id}
                      className={`payment-item ${selectedPayment?.id === payment.id ? 'selected' : ''}`}
                      onClick={() => setSelectedPayment(payment)}
                      style={selectedPayment?.id === payment.id ? 
                        { background: `${themeColors.buttonColor}15`, borderColor: themeColors.buttonColor } : 
                        secondaryButtonStyle
                      }
                    >
                      <div className="payment-info">
                        <div className="payment-header">
                          <span className="bank-name" style={{ color: themeColors.textColor }}>
                            {payment.bankName}
                          </span>
                          {payment.type === 'sbp' && (
                            <span className="sbp-badge" style={{ background: '#34c759', color: '#ffffff' }}>СБП</span>
                          )}
                        </div>
                        <div className="payment-number" style={hintStyle}>
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
                        style={{ color: '#ff3b30' }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {paymentMethods.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon" style={hintStyle}>💳</div>
                  <p className="empty-text" style={hintStyle}>Добавьте реквизиты для получения RUB</p>
                </div>
              )}
            </div>
          )}

          <button
            className={`exchange-button-new ${isBuyMode ? 'buy' : 'sell'} ${!isExchangeReady() ? 'disabled' : ''}`}
            disabled={!isExchangeReady() || isLoading}
            onClick={handleExchange}
            style={!isExchangeReady() || isLoading ? 
              { background: themeColors.hintColor, color: themeColors.buttonTextColor } : 
              isBuyMode ? accentButtonStyle : buttonStyle
            }
          >
            <span className="exchange-icon">
              {isBuyMode ? '🛒' : '💰'}
            </span>
            <span className="exchange-text">
              {isLoading ? '🔄 Обработка...' : (isBuyMode ? 'Купить USDT' : 'Продать USDT')}
            </span>
          </button>

          <div className="security-info" style={secondaryButtonStyle}>
            <div className="security-icon" style={{ color: themeColors.buttonColor }}>🔒</div>
            <div className="security-text" style={hintStyle}>
              <strong style={{ color: themeColors.textColor }}>Безопасная сделка:</strong> Средства резервируются у Операторов до подтверждения сделки системой TetherRabbit
            </div>
          </div>
        </div>
      )}

      {message && !showToast && (
        <div className={`message-toast-new ${message.includes('✅') ? 'success' : message.includes('❌') ? 'error' : message.includes('⚠️') ? 'warning' : 'info'}`}>
          <span className="toast-text">{message}</span>
        </div>
      )}
    </div>
  );
}

export default Home;