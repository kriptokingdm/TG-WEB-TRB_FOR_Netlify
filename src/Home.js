// Home.js - с красивым Telegram-стилем для активного ордера
import React from "react";
import { useState, useEffect } from 'react';
import './Home.css';
import { ProfileIcon, ExchangeIcon, HistoryIcon } from './NavIcons';
import { API_BASE_URL } from './config';

const simpleFetch = async (endpoint, data = null) => {
    console.log(`🔗 Запрос ${endpoint}`);
    const url = API_BASE_URL + endpoint;
    console.log(`🌐 URL: ${url}`);

    try {
        const options = {
            method: data ? 'POST' : 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors',
            credentials: 'omit'
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        console.log('✅ Ответ:', result);
        return result;

    } catch (error) {
        console.error('❌ Ошибка запроса:', error.message);
        if (endpoint.includes('/exchange-rate')) {
            return {
                success: true,
                rate: 88.0,
                min_amount: 100,
                max_amount: 100000
            };
        }
        return { success: false, error: error.message };
    }
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

    // Реквизиты
    const [cryptoAddress, setCryptoAddress] = useState('');
    const [cryptoNetwork, setCryptoNetwork] = useState('TRC20');
    const [cryptoAddresses, setCryptoAddresses] = useState([]);
    const [bankName, setBankName] = useState('СБП (Система быстрых платежей)');
    const [cardNumber, setCardNumber] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [selectedCrypto, setSelectedCrypto] = useState(null);

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
        { value: 'TRC20', name: 'TRC20 (Tron)', icon: '⚡', popular: true },
        { value: 'ERC20', name: 'ERC20 (Ethereum)', icon: '⛓️', popular: true },
        { value: 'BEP20', name: 'BEP20 (Binance)', icon: '🟡', popular: true },
        { value: 'POLYGON', name: 'Polygon', icon: '🔺', popular: false },
        { value: 'ARBITRUM', name: 'Arbitrum', icon: '↔️', popular: false },
        { value: 'OPTIMISM', name: 'Optimism', icon: '🔵', popular: false },
        { value: 'AVALANCHE', name: 'Avalanche', icon: '❄️', popular: false },
        { value: 'SOLANA', name: 'Solana', icon: '🔥', popular: true },
        { value: 'TON', name: 'TON', icon: '💎', popular: true },
        { value: 'BASE', name: 'Base', icon: '🏢', popular: false }
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
        const numAmount = parseFloat(amount);
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
        setAmount(value);
        if (value && value.trim() !== '') {
            const numAmount = parseFloat(value);
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
        if (!cryptoAddress || cryptoAddress.length < 10) {
            showMessage('❌ Введите корректный адрес');
            return;
        }

        const newCrypto = {
            id: Date.now().toString(),
            address: cryptoAddress,
            network: cryptoNetwork,
            name: `${availableNetworks.find(n => n.value === cryptoNetwork)?.name} кошелек`
        };

        setCryptoAddresses([...cryptoAddresses, newCrypto]);
        setSelectedCrypto(newCrypto);
        setCryptoAddress('');
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

        const numAmount = parseFloat(amount);
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
        const numAmount = parseFloat(amount);
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

    return (
        <div className="home-container">
            {/* Хедер */}
            {/* <div className="home-header-new">
                <div className="header-content">
                    <div className="header-left">
                        <h1 className="header-title-new">TetherRabbit 🥕</h1>
                    </div>
                </div>
            </div> */}

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

                                <button
                                    className={`swap-center-button ${isSwapped ? 'swapped' : ''}`}
                                    onClick={handleSwap}
                                    disabled={hasActiveOrder}
                                >
                                    <svg width="58" height="58" viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="29" cy="29" r="26.5" fill="#36B2FF" stroke="#EFEFF3" strokeWidth="5" />
                                        <path d="M37.3333 17.5423C40.8689 20.1182 43.1667 24.2908 43.1667 29C43.1667 36.824 36.824 43.1667 29 43.1667H28.1667M20.6667 40.4577C17.1311 37.8818 14.8333 33.7092 14.8333 29C14.8333 21.176 21.176 14.8333 29 14.8333H29.8333M30.6667 46.3333L27.3333 43L30.6667 39.6667M27.3333 18.3333L30.6667 15L27.3333 11.6667" stroke="#F6F6F6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
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
                                            type="number"
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

                                {/* Добавление адреса */}
                                <div className="add-form">
                                    <select
                                        value={cryptoNetwork}
                                        onChange={(e) => setCryptoNetwork(e.target.value)}
                                        className="network-select"
                                    >
                                        <option value="">Выберите сеть</option>
                                        {popularNetworks.map(network => (
                                            <option key={network.value} value={network.value}>
                                                {network.icon} {network.name}
                                            </option>
                                        ))}
                                    </select>

                                    <input
                                        type="text"
                                        placeholder="Введите адрес кошелька"
                                        value={cryptoAddress}
                                        onChange={(e) => setCryptoAddress(e.target.value)}
                                        className="address-input"
                                    />

                                    <button
                                        onClick={handleAddCryptoAddress}
                                        className="add-button"
                                    >
                                        + Добавить адрес
                                    </button>
                                </div>

                                {/* Список адресов */}
                                {cryptoAddresses.length > 0 && (
                                    <div className="crypto-list">
                                        <h4>Ваши адреса:</h4>
                                        {cryptoAddresses.map((crypto) => (
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
                                                            {availableNetworks.find(n => n.value === crypto.network)?.icon}
                                                            {crypto.network}
                                                        </span>
                                                    </div>
                                                    <div className="crypto-address">
                                                        {crypto.address.slice(0, 12)}...{crypto.address.slice(-8)}
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
                                        ))}
                                    </div>
                                )}

                                {cryptoAddresses.length === 0 && (
                                    <div className="empty-state">
                                        <div className="empty-icon">🏦</div>
                                        <p className="empty-text">Добавьте адрес для получения USDT</p>
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

            {/* Навигация */}
            <div className="bottom-nav-new">
                <button
                    className="nav-item-new"
                    onClick={() => navigateTo('profile')}
                >
                    <div className="nav-icon-wrapper">
                        <ProfileIcon />
                    </div>
                    <span className="nav-label">Профиль</span>
                </button>

                <button
                    className="nav-center-item active"
                    onClick={() => navigateTo('home')}
                >
                    <div className="nav-center-circle">
                        <ExchangeIcon active={true} />
                    </div>
                    <span className="nav-center-label">Обмен</span>
                </button>

                <button
                    className="nav-item-new"
                    onClick={() => navigateTo('history')}
                >
                    <div className="nav-icon-wrapper">
                        <HistoryIcon />
                    </div>
                    <span className="nav-label">История</span>
                </button>
            </div>
        </div>
    );
}

export default Home;