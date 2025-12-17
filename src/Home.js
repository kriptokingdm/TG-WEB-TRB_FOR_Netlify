// Home.js - обновленная версия с Telegram стилем для активного ордера
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

// Компоненты SVG для swap-кнопки
const LightThemeSwapIcon = ({ isSwapped }) => (
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
    <circle cx="26" cy="26" r="24" fill="#36B2FF" stroke="#EFEFF3" strokeWidth="3"/>
    <path d="M34 16C37.31 18.33 39.5 22 39.5 26C39.5 33.1 33.6 39 26.5 39H25.5M18 36C14.69 33.67 12.5 30 12.5 26C12.5 18.9 18.4 13 25.5 13H26.5M28.5 42L25 38.5L28.5 35M25 17L28.5 13.5L25 10" 
      stroke="white" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"/>
  </svg>
);

const DarkThemeSwapIcon = ({ isSwapped }) => (
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
    <circle cx="26" cy="26" r="24" fill="#30A353" stroke="#1C1C1C" strokeWidth="3"/>
    <path d="M34 16C37.31 18.33 39.5 22 39.5 26C39.5 33.1 33.6 39 26.5 39H25.5M18 36C14.69 33.67 12.5 30 12.5 26C12.5 18.9 18.4 13 25.5 13H26.5M28.5 42L25 38.5L28.5 35M25 17L28.5 13.5L25 10" 
      stroke="white" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"/>
  </svg>
);

function Home({ navigateTo, telegramUser }) {
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
  
  const [isDarkTheme, setIsDarkTheme] = useState(false);
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

  const checkTheme = () => {
    try {
      const htmlElement = document.documentElement;
      const themeFromAttribute = htmlElement.getAttribute('data-theme');
      
      if (themeFromAttribute === 'dark') {
        setIsDarkTheme(true);
        return true;
      }
      if (themeFromAttribute === 'light') {
        setIsDarkTheme(false);
        return false;
      }
      
      setIsDarkTheme(false);
      return false;
      
    } catch (error) {
      console.error('❌ Ошибка проверки темы:', error);
      setIsDarkTheme(false);
      return false;
    }
  };

  // Инициализация
  useEffect(() => {
    console.log('🏠 Home компонент загружен');
    fetchExchangeRates();
    
    setTimeout(() => {
      checkTheme();
    }, 100);

    const htmlElement = document.documentElement;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'data-theme' || mutation.attributeName === 'class')) {
          checkTheme();
        }
      });
    });
    
    observer.observe(htmlElement, { 
      attributes: true,
      attributeFilter: ['data-theme', 'class']
    });

    const interval = setInterval(checkTheme, 1000);

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
      observer.disconnect();
      clearInterval(interval);
    };
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

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
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
      showMessage(`⚠️ У вас активный ордер ${activeOrderId}. Дождитесь его завершения.`);
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
        showMessage('❌ Введите корректный номер телефона (+7XXXXXXXXXX)');
        return;
      }
    } else {
      const cleanCardNumber = cardNumber.replace(/\s/g, '');
      if (cleanCardNumber.length !== 16) {
        showMessage('❌ Номер карты должен содержать 16 цифр');
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
    showMessage('✅ Реквизиты добавлены');
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
        showMessage('❌ Введите корректный адрес');
        return;
      }
    } else {
      if (!cryptoUID || cryptoUID.length < 5) {
        showMessage('❌ Введите корректный UID');
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
    showMessage('✅ Адрес добавлен');
  };

  const handleDeletePayment = (id) => {
    const updated = paymentMethods.filter(p => p.id !== id);
    setPaymentMethods(updated);
    if (selectedPayment?.id === id) setSelectedPayment(updated.length > 0 ? updated[0] : null);
    showMessage('✅ Реквизиты удалены');
  };

  const handleDeleteCrypto = (id) => {
    const updated = cryptoAddresses.filter(c => c.id !== id);
    setCryptoAddresses(updated);
    if (selectedCrypto?.id === id) setSelectedCrypto(updated.length > 0 ? updated[0] : null);
    showMessage('✅ Адрес удален');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => showMessage('✅ Скопировано'));
  };

  const handleExchange = async () => {
    console.log('🎯 Создание ордера');
    if (hasActiveOrder) {
      showMessage(`⚠️ У вас уже есть активный ордер ${activeOrderId}. Дождитесь его завершения.`);
      navigateTo('history');
      return;
    }

    if (!amount) {
      showMessage('❌ Введите сумму');
      return;
    }

    const normalizedAmount = amount.replace(',', '.');
    const numAmount = parseFloat(normalizedAmount);
    
    if (isNaN(numAmount)) {
      showMessage('❌ Введите корректную сумму');
      return;
    }

    if (isBuyMode) {
      if (numAmount < limits.minBuy) {
        showMessage(`❌ Минимальная сумма: ${limits.minBuy.toLocaleString()} RUB`);
        return;
      }
      if (numAmount > limits.maxBuy) {
        showMessage(`❌ Максимальная сумма: ${limits.maxBuy.toLocaleString()} RUB`);
        return;
      }
      if (!selectedCrypto) {
        showMessage('❌ Добавьте адрес для получения USDT');
        return;
      }
    } else {
      if (numAmount < limits.minSell) {
        showMessage(`❌ Минимальная сумма: ${limits.minSell} USDT`);
        return;
      }
      if (numAmount > limits.maxSell) {
        showMessage(`❌ Максимальная сумма: ${limits.maxSell} USDT`);
        return;
      }
      if (!selectedPayment) {
        showMessage('❌ Добавьте реквизиты для получения RUB');
        return;
      }
    }

    const userId = getUserId();
    if (!userId) {
      showMessage('❌ Не удалось определить ID пользователя. Обновите страницу.');
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
      showMessage('🔄 Создание ордера...');
      const result = await simpleFetch('/create-order', orderData);

      if (result.success) {
        showMessage(`✅ Ордер создан! ID: ${result.order?.id}`);
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
        showMessage(`❌ Ошибка: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Ошибка сети:', error);
      showMessage('❌ Ошибка сети');
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

  // Функция для получения статуса
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending': return { 
        text: '⏳ Ожидание', 
        color: isDarkTheme ? '#FF9500' : '#FF9500',
        bg: isDarkTheme ? '#2C2C2C' : '#FFF5E6',
        icon: '⏳'
      };
      case 'processing': return { 
        text: '🔄 В обработке', 
        color: isDarkTheme ? '#0A84FF' : '#007AFF',
        bg: isDarkTheme ? '#1C283C' : '#E6F2FF',
        icon: '🔄'
      };
      case 'accepted': return { 
        text: '✅ Принят', 
        color: isDarkTheme ? '#30D158' : '#34C759',
        bg: isDarkTheme ? '#1C3425' : '#E6F9EC',
        icon: '✅'
      };
      default: return { 
        text: '⏳ Обрабатывается', 
        color: isDarkTheme ? '#FF9500' : '#FF9500',
        bg: isDarkTheme ? '#2C2C2C' : '#FFF5E6',
        icon: '⏳'
      };
    }
  };

  const statusInfo = getStatusInfo(activeOrderStatus);

  return (
    <div className="home-container">
      {hasActiveOrder ? (
        // ТЕЛЕГРАМ СТИЛЬ ДЛЯ АКТИВНОГО ОРДЕРА
        <div className="tg-home-container">
          {/* Шапка в стиле Telegram */}
          <div className="tg-header">
            <div className="tg-header-content">
              <button 
                className="tg-back-btn"
                onClick={() => navigateTo('history')}
                title="К истории операций"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className="tg-header-titles">
                <h1 className="tg-header-title">Активная заявка</h1>
                <p className="tg-header-subtitle">Ваш ордер в обработке</p>
              </div>
              <div className="tg-header-status" style={{ color: statusInfo.color }}>
                 {statusInfo.text}
              </div>
            </div>
          </div>

          {/* Основной контент */}
          <div className="tg-main-content">
            {/* Карточка ордера */}
            <div className="tg-order-card">
              <div className="tg-card-header">
                <div className="tg-order-icon" style={{ background: statusInfo.bg, color: statusInfo.color }}>
                  {statusInfo.icon}
                </div>
                <div className="tg-order-info">
                  <h2 className="tg-order-title">Заявка #{activeOrderId?.substring(0, 8)}</h2>
                  <p className="tg-order-subtitle">
                    {activeOrderData?.operation_type === 'buy' ? '🛒 Покупка USDT' : '💰 Продажа USDT'}
                  </p>
                </div>
              </div>

              {/* Детали ордера */}
              <div className="tg-order-details">
                <div className="tg-detail-row">
                  <span className="tg-detail-label">Сумма</span>
                  <span className="tg-detail-value">
                    <strong>{activeOrderData?.amount} {activeOrderData?.operation_type === 'buy' ? 'RUB' : 'USDT'}</strong>
                  </span>
                </div>
                
                <div className="tg-detail-row">
                  <span className="tg-detail-label">Курс</span>
                  <span className="tg-detail-value">{activeOrderData?.rate} ₽/USDT</span>
                </div>
                
                <div className="tg-detail-row">
                  <span className="tg-detail-label">К получению</span>
                  <span className="tg-detail-value">
                    <strong>
                      {activeOrderData?.operation_type === 'buy' 
                        ? `${(activeOrderData?.amount / activeOrderData?.rate).toFixed(2)} USDT`
                        : `${(activeOrderData?.amount * activeOrderData?.rate).toFixed(2)} ₽`}
                    </strong>
                  </span>
                </div>
                
                <div className="tg-detail-row">
                  <span className="tg-detail-label">Создано</span>
                  <span className="tg-detail-value">
                    {activeOrderData?.created_at ? new Date(activeOrderData.created_at).toLocaleString('ru-RU') : '-'}
                  </span>
                </div>
                
                {activeOrderData?.bank_details && (
                  <div className="tg-detail-row">
                    <span className="tg-detail-label">Реквизиты</span>
                    <span className="tg-detail-value tg-detail-mono">
                      {activeOrderData.bank_details}
                    </span>
                  </div>
                )}
                
                {activeOrderData?.crypto_address && (
                  <div className="tg-detail-row">
                    <span className="tg-detail-label">Адрес USDT</span>
                    <span className="tg-detail-value tg-detail-mono">
                      {activeOrderData.crypto_address}
                    </span>
                  </div>
                )}
              </div>

              {/* Прогресс бар */}
              <div className="tg-progress-section">
                <div className="tg-progress-header">
                  <span>Статус обработки</span>
                  <span className="tg-progress-percent">75%</span>
                </div>
                <div className="tg-progress-bar">
                  <div 
                    className="tg-progress-fill" 
                    style={{ 
                      width: '75%',
                      background: statusInfo.color
                    }}
                  ></div>
                </div>
                <div className="tg-progress-steps">
                  <div className="tg-step active">
                    <div className="tg-step-dot"></div>
                    <span className="tg-step-text">Создана</span>
                  </div>
                  <div className="tg-step active">
                    <div className="tg-step-dot"></div>
                    <span className="tg-step-text">Обработка</span>
                  </div>
                  <div className="tg-step">
                    <div className="tg-step-dot"></div>
                    <span className="tg-step-text">Завершена</span>
                  </div>
                </div>
              </div>

              {/* Кнопки действий */}
              <div className="tg-actions">
                <button 
                  className="tg-action-btn primary"
                  onClick={() => navigateTo('history')}
                >
                  <span className="tg-btn-icon">📋</span>
                  Детали заявки
                </button>
              </div>

              {/* Информация */}
              <div className="tg-info-note">
                <div className="tg-info-icon">💬</div>
                <div className="tg-info-text">
                  <strong>Общайтесь с оператором</strong>
                  <span>Все вопросы по заявке решаются в чате с оператором</span>
                </div>
              </div>
            </div>

            {/* Предупреждение */}
            {/* <div className="tg-warning-card">
              <div className="tg-warning-icon">⚠️</div>
              <div className="tg-warning-content">
                <strong>Новая заявка недоступна</strong>
                <span>Дождитесь завершения текущей операции</span>
              </div>
            </div> */}

            {/* Статистика */}
            {/* <div className="tg-stats-card">
              <h3 className="tg-stats-title">Информация</h3>
              <div className="tg-stats-grid">
                <div className="tg-stat-item">
                  <div className="tg-stat-icon">⏱️</div>
                  <div className="tg-stat-content">
                    <span className="tg-stat-label">Время ожидания</span>
                    <span className="tg-stat-value">5-15 минут</span>
                  </div>
                </div>
                <div className="tg-stat-item">
                  <div className="tg-stat-icon">🔒</div>
                  <div className="tg-stat-content">
                    <span className="tg-stat-label">Безопасность</span>
                    <span className="tg-stat-value">Средства резервируются</span>
                  </div>
                </div>
              </div>
            </div> */}
          </div>

          {/* Нижняя панель */}
          <div className="tg-bottom-nav">
            <button 
              className="tg-nav-btn active"
              onClick={() => navigateTo('history')}
            >
              <span className="tg-nav-icon">📋</span>
              <span className="tg-nav-label">История</span>
            </button>
            <button 
              className="tg-nav-btn"
              onClick={() => navigateTo('profile')}
            >
              <span className="tg-nav-icon">👤</span>
              <span className="tg-nav-label">Профиль</span>
            </button>
            <button 
              className="tg-nav-btn"
              onClick={() => checkActiveOrder()}
            >
              <span className="tg-nav-icon">🔄</span>
              <span className="tg-nav-label">Обновить</span>
            </button>
          </div>
        </div>
      ) : (
        // ОБЫЧНЫЙ ИНТЕРФЕЙС ОБМЕНА
        <div className="home-content">
          {/* Карточки валют */}
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
                title={hasActiveOrder ? "Дождитесь завершения активного ордера" : "Поменять местами"}
              >
                {isDarkTheme ? (
                  <DarkThemeSwapIcon isSwapped={isSwapped} />
                ) : (
                  <LightThemeSwapIcon isSwapped={isSwapped} />
                )}
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
                    value={convertedAmount}
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

          {isBuyMode && (
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
                  + Добавить {cryptoType === 'address' ? 'адрес' : 'UID'}
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
          )}

          {!isBuyMode && (
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
                  + Добавить реквизиты
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
                  <p className="empty-text">Добавьте реквизиты для получения RUB</p>
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

      {message && (
        <div className={`message-toast-new ${message.includes('✅') ? 'success' : message.includes('❌') ? 'error' : message.includes('⚠️') ? 'warning' : 'info'}`}>
          <span className="toast-text">{message}</span>
        </div>
      )}
    </div>
  );
}

export default Home;