// Home.js - исправленная версия
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
  // ... (оставляем как есть)
};

// Компонент SVG для swap-кнопки с динамическими цветами
const SwapIcon = ({ isSwapped, isDarkTheme }) => {
  const circleFill = isDarkTheme ? "#30A353" : "#36B2FF";
  const circleStroke = isDarkTheme ? "#1C1C1C" : "#EFEFF3";
  
  return (
    <svg 
      width="58" 
      height="58" 
      viewBox="0 0 58 58" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ 
        transform: isSwapped ? 'rotate(180deg)' : 'rotate(0deg)', 
        transition: 'transform 0.3s ease' 
      }}
    >
      <circle cx="29" cy="29" r="26.5" fill={circleFill} stroke={circleStroke} strokeWidth="5"/>
      <path d="M37.3333 17.5423C40.8689 20.1182 43.1667 24.2908 43.1667 29C43.1667 36.824 36.824 43.1667 29 43.1667H28.1667M20.6667 40.4577C17.1311 37.8818 14.8333 33.7092 14.8333 29C14.8333 21.176 21.176 14.8333 29 14.8333H29.8333M30.6667 46.3333L27.3333 43L30.6667 39.6667M27.3333 18.3333L30.6667 15L27.3333 11.6667" 
        stroke="#F6F6F6" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"/>
    </svg>
  );
};

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
  
  // Состояние для темы
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // Реквизиты
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

  // Данные активного ордера
  const [activeOrderData, setActiveOrderData] = useState(null);

  // Списки
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

  // Проверка активного ордера
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

  // ПРОСТАЯ ПРОВЕРКА ТЕМЫ - БОЛЕЕ НАДЕЖНАЯ ВЕРСИЯ
  const checkTheme = () => {
    try {
      // Проверяем непосредственно html элемент
      const htmlElement = document.documentElement;
      
      // 1. Проверяем data-theme атрибут
      const themeFromAttribute = htmlElement.getAttribute('data-theme');
      if (themeFromAttribute === 'dark') {
        console.log('🎨 Тема из data-theme атрибута: Темная');
        setIsDarkTheme(true);
        return true;
      }
      if (themeFromAttribute === 'light') {
        console.log('🎨 Тема из data-theme атрибута: Светлая');
        setIsDarkTheme(false);
        return false;
      }
      
      // 2. Проверяем CSS класс
      if (htmlElement.classList.contains('dark')) {
        console.log('🎨 Тема из класса .dark: Темная');
        setIsDarkTheme(true);
        return true;
      }
      if (htmlElement.classList.contains('light')) {
        console.log('🎨 Тема из класса .light: Светлая');
        setIsDarkTheme(false);
        return false;
      }
      
      // 3. Проверяем цвет фона (эмпирический метод)
      const computedBg = window.getComputedStyle(htmlElement).backgroundColor;
      const isDarkByColor = computedBg.includes('15, 15, 15') || 
                           computedBg.includes('0, 0, 0') || 
                           computedBg.includes('28, 28, 28');
      
      if (isDarkByColor) {
        console.log('🎨 Тема по цвету фона: Темная', computedBg);
        setIsDarkTheme(true);
        return true;
      }
      
      // 4. По умолчанию - светлая тема
      console.log('🎨 Тема по умолчанию: Светлая');
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
    
    // Проверяем тему сразу при загрузке с задержкой
    setTimeout(() => {
      const theme = checkTheme();
      console.log('🎨 Начальная тема:', theme ? 'Темная' : 'Светлая');
    }, 100);

    // Простой слушатель для изменения темы
    const htmlElement = document.documentElement;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'data-theme' || mutation.attributeName === 'class')) {
          console.log('🔄 Атрибут темы изменился');
          checkTheme();
        }
      });
    });
    
    observer.observe(htmlElement, { 
      attributes: true,
      attributeFilter: ['data-theme', 'class']
    });

    // Также проверяем тему при каждом рендере
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
      console.log('✅ Пользователь сохранен:', userData);
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

    // Очистка
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
    
    // Разрешаем ввод только чисел, точки и запятой
    const cleanedValue = value.replace(/[^\d.,]/g, '');
    
    // Заменяем запятую на точку для правильного парсинга
    const normalizedValue = cleanedValue.replace(',', '.');
    
    // Проверяем, что после точки не больше 2 знаков
    const parts = normalizedValue.split('.');
    if (parts.length > 1 && parts[1].length > 2) {
      return; // Не позволяем вводить больше 2 знаков после запятой
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

    // Нормализуем сумму (заменяем запятую на точку)
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
    
    // Нормализуем сумму для проверки
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

  // Статус тексты и иконки
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending': return { text: '⏳ Ожидание', color: '#FF9500', bg: '#FF9500' };
      case 'processing': return { text: '🔄 В обработке', color: '#007AFF', bg: '#007AFF' };
      case 'accepted': return { text: '✅ Принят', color: '#34C759', bg: '#34C759' };
      default: return { text: '⏳ В обработке', color: '#FF9500', bg: '#FF9500' };
    }
  };

  const statusInfo = getStatusInfo(activeOrderStatus);

  // Получаем выбранную сеть и биржу для отображения иконок
  const selectedNetwork = availableNetworks.find(n => n.value === cryptoNetwork);
  const selectedExchangeData = availableExchanges.find(e => e.value === selectedExchange);

  // ДЕБАГ - логируем текущую тему
  console.log('🔍 Текущая тема в состоянии:', isDarkTheme ? 'Темная' : 'Светлая');

  return (
    <div className="home-container">
      {/* Бейдж активного ордера в хедере */}
      {hasActiveOrder && (
        <div className="active-order-header-badge" onClick={() => navigateTo('history')}>
          <div className="badge-icon">📊</div>
          <div className="badge-content">
            <span className="badge-title">Активная заявка</span>
            <span className="badge-id">#{activeOrderId?.substring(0, 10)}...</span>
          </div>
          <div className="badge-status" style={{ color: statusInfo.color, backgroundColor: `${statusInfo.bg}15` }}>
            {statusInfo.text}
          </div>
        </div>
      )}

      {/* Контент */}
      <div className="home-content">
        {hasActiveOrder ? (
          // ТЕЛЕГРАМ-СТИЛЬ ДЛЯ АКТИВНОГО ОРДЕРА
          <div className="tg-active-order-container">
            {/* Заголовок */}
            <div className="tg-order-header">
              <div className="tg-order-icon">📋</div>
              <div className="tg-order-title">
                <h2>Активная заявка</h2>
                <p>Ваш ордер находится в обработке</p>
              </div>
            </div>

            {/* Карточка ордера */}
            <div className="tg-order-card">
              <div className="tg-order-card-header">
                <div className="tg-order-id">
                  <span className="tg-order-label">ID заявки</span>
                  <span className="tg-order-value">#{activeOrderId}</span>
                </div>
                <div className="tg-order-status" style={{ color: statusInfo.color }}>
                  {statusInfo.text}
                </div>
              </div>

              <div className="tg-order-details">
                {activeOrderData && (
                  <>
                    <div className="tg-order-detail">
                      <span className="tg-detail-label">Тип операции</span>
                      <span className="tg-detail-value">
                        {activeOrderData.operation_type === 'buy' ? '🛒 Покупка USDT' : '💰 Продажа USDT'}
                      </span>
                    </div>
                    <div className="tg-order-detail">
                      <span className="tg-detail-label">Сумма</span>
                      <span className="tg-detail-value">
                        {activeOrderData.amount} {activeOrderData.operation_type === 'buy' ? 'RUB' : 'USDT'}
                      </span>
                    </div>
                    <div className="tg-order-detail">
                      <span className="tg-detail-label">Курс</span>
                      <span className="tg-detail-value">{activeOrderData.rate} RUB/USDT</span>
                    </div>
                    <div className="tg-order-detail">
                      <span className="tg-detail-label">К получению</span>
                      <span className="tg-detail-value">
                        {activeOrderData.operation_type === 'buy' 
                          ? `${(activeOrderData.amount / activeOrderData.rate).toFixed(2)} USDT`
                          : `${(activeOrderData.amount * activeOrderData.rate).toFixed(2)} RUB`}
                      </span>
                    </div>
                    <div className="tg-order-detail">
                      <span className="tg-detail-label">Создано</span>
                      <span className="tg-detail-value">
                        {new Date(activeOrderData.created_at).toLocaleString('ru-RU')}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Кнопки действий */}
              <div className="tg-order-actions">
                <button 
                  className="tg-action-btn primary"
                  onClick={() => navigateTo('history')}
                >
                  📋 Перейти к деталям
                </button>
                <button 
                  className="tg-action-btn secondary"
                  onClick={checkActiveOrder}
                >
                  🔄 Проверить статус
                </button>
              </div>

              {/* Информация */}
              <div className="tg-order-info">
                <div className="tg-info-icon">💬</div>
                <div className="tg-info-text">
                  Вы можете общаться с оператором в чате заявки для уточнения деталей
                </div>
              </div>
            </div>

            {/* Предупреждение */}
            <div className="tg-order-warning">
              <div className="tg-warning-icon">⚠️</div>
              <div className="tg-warning-text">
                <strong>Новая заявка не может быть создана</strong>
                <span>Дождитесь завершения текущей заявки для создания новой</span>
              </div>
            </div>
          </div>
        ) : (
          // ОБЫЧНЫЙ ИНТЕРФЕЙС ОБМЕНА
          <>
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

                {/* Кнопка swap с динамическими цветами */}
                <button
                  className={`swap-center-button ${isSwapped ? 'swapped' : ''}`}
                  onClick={handleSwap}
                  disabled={hasActiveOrder}
                  title={hasActiveOrder ? "Дождитесь завершения активного ордера" : "Поменять местами"}
                >
                  {/* ДЕБАГ - показываем текущую тему */}
                  <div style={{ 
                    display: 'none',
                    position: 'absolute',
                    background: 'red',
                    color: 'white',
                    padding: '2px',
                    fontSize: '10px'
                  }}>
                    Тема: {isDarkTheme ? 'Темная' : 'Светлая'}
                  </div>
                  
                  <SwapIcon isSwapped={isSwapped} isDarkTheme={isDarkTheme} />
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

              {/* Поля ввода суммы */}
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

            {/* Реквизиты для покупки USDT */}
            {isBuyMode && (
              <div className="payment-section-new">
                <div className="payment-header-new">
                  <h3 className="section-title">Адрес для получения USDT</h3>
                </div>

                {/* Тип ввода адреса */}
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

                {/* Добавление адреса */}
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

                {/* Список адресов */}
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

            {/* Реквизиты для продажи USDT */}
            {!isBuyMode && (
              <div className="payment-section-new">
                <div className="payment-header-new">
                  <h3 className="section-title">Реквизиты для получения RUB</h3>
                </div>

                {/* Добавление реквизитов */}
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

                {/* Список реквизитов */}
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

            {/* Кнопка обмена */}
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

            {/* Информация */}
            <div className="security-info">
              <div className="security-icon">🔒</div>
              <div className="security-text">
                <strong>Безопасная сделка:</strong> Средства резервируются у Операторов до подтверждения сделки системой TetherRabbit
              </div>
            </div>
          </>
        )}
      </div>

      {/* Сообщение */}
      {message && (
        <div className={`message-toast-new ${message.includes('✅') ? 'success' : message.includes('❌') ? 'error' : message.includes('⚠️') ? 'warning' : 'info'}`}>
          <span className="toast-text">{message}</span>
        </div>
      )}
    </div>
  );
}

export default Home;