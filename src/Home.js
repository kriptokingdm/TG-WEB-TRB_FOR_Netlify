import React from "react";
import { useState, useEffect } from 'react';
import './Home.css';
import SupportChat from './SupportChat';

// ====================== КОНФИГУРАЦИЯ API ======================
const API_URL = 'https://87.242.106.114';

// Простейшая функция для запросов
const simpleFetch = async (endpoint, data = null) => {
    const url = API_URL + endpoint;
    console.log('📡 HTTPS запрос к:', url);
    
    try {
        const options = {
            method: data ? 'POST' : 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        const result = await response.json();
        
        console.log('✅ Ответ API:', result);
        return result;
        
    } catch (error) {
        console.log('❌ Ошибка сети:', error.message);
        return { 
            success: false, 
            error: error.message 
        };
    }
};

function Home({ navigateTo, telegramUser }) {
    const [isBuyMode, setIsBuyMode] = useState(true);
    const [isSwapped, setIsSwapped] = useState(false);
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [userData, setUserData] = useState(null);
    
    // Курсы обмена
    const [rates, setRates] = useState({
        buy: 92.50,
        sell: 93.50
    });

    // Состояния для чата
    const [showSupportChat, setShowSupportChat] = useState(false);
    const [currentOrderId, setCurrentOrderId] = useState(null);
    const [currentExchangeData, setCurrentExchangeData] = useState(null);

    // Состояния для активных ордеров
    const [hasActiveOrder, setHasActiveOrder] = useState(false);
    const [activeOrdersCount, setActiveOrdersCount] = useState(0);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Лимиты
    const MIN_RUB = 1000;
    const MAX_RUB = 1000000;
    const MIN_USDT = 10;
    const MAX_USDT = 10000;

    // Списки банков и сетей
    const availableBanks = [
        'Сбербанк', 'Т-Банк', 'ВТБ', 'Альфа-Банк', 'Газпромбанк', 'СовкомБанк',
        'Россельхоз', 'Райффайзен Банк', 'МТС Банк', 'Яндекс Деньги', 'Озон Банк',
        'ОТП Банк', 'Банк Уралсиб', 'СБП (Система быстрых платежей)'
    ];

    const availableNetworks = [
        { value: 'ERC20', name: 'ERC20 (Ethereum)', icon: '⛓️' },
        { value: 'TRC20', name: 'TRC20 (Tron)', icon: '⚡' },
        { value: 'TON', name: 'TON', icon: '💎' },
        { value: 'SOL', name: 'Solana', icon: '🔥' }
    ];

    // Состояния для реквизитов
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [showAddPayment, setShowAddPayment] = useState(false);
    const [newPayment, setNewPayment] = useState({
        bankName: '',
        cardNumber: '',
        phoneNumber: '',
        cardNumberError: ''
    });
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [showBankDropdown, setShowBankDropdown] = useState(false);

    const [cryptoAddresses, setCryptoAddresses] = useState([]);
    const [showAddCrypto, setShowAddCrypto] = useState(false);
    const [newCryptoAddress, setNewCryptoAddress] = useState({
        address: '',
        network: 'ERC20',
        name: '',
        addressError: ''
    });
    const [selectedCryptoAddress, setSelectedCryptoAddress] = useState(null);

    // Состояние инициализации пользователя
    const [userInitialized, setUserInitialized] = useState(false);

    // ====================== ФУНКЦИИ ======================

    const handleNavigation = (path) => {
        setTimeout(() => {
            navigateTo(path);
        }, 50);
    };

    // Обработка telegramUser
    useEffect(() => {
        console.log('👤 Telegram User в Home:', telegramUser);
        
        if (telegramUser) {
            const newUserData = {
                id: `user_${telegramUser.id}`,
                telegramId: telegramUser.id,
                username: telegramUser.username || `user_${telegramUser.id}`,
                firstName: telegramUser.first_name || 'Пользователь',
                lastName: telegramUser.last_name || '',
                photoUrl: telegramUser.photo_url || null
            };
            setUserData(newUserData);
            
            // Сохраняем в localStorage
            localStorage.setItem('currentUser', JSON.stringify(newUserData));
            localStorage.setItem('telegramUser', JSON.stringify(telegramUser));
        }
    }, [telegramUser]);

    // Функция для расчета конвертированной суммы
    const calculateConvertedAmount = () => {
        if (!amount) return '';
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount)) return '';

        if (isBuyMode) {
            // Покупка USDT за RUB: RUB → USDT
            const rate = rates.buy || 92.50;
            return (numAmount / rate).toFixed(2);
        } else {
            // Продажа USDT за RUB: USDT → RUB
            const rate = rates.sell || 93.50;
            return (numAmount * rate).toFixed(2);
        }
    };

    const convertedAmount = calculateConvertedAmount();

    // Инициализация при загрузке
    useEffect(() => {
        console.log('🚀 Компонент Home загружен');
        
        // Загружаем сохраненные данные
        loadSavedData();
        
        // Инициализируем пользователя
        initializeUser();
        
        // Загружаем курсы
        fetchExchangeRates();

        // Периодическая проверка ордеров
        const interval = setInterval(() => {
            if (userInitialized) {
                checkActiveOrders();
            }
        }, 30000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    // Показать сообщение
    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    // Загрузка сохраненных данных
    const loadSavedData = () => {
        try {
            const savedPayments = localStorage.getItem('userPaymentMethods');
            if (savedPayments) {
                setPaymentMethods(JSON.parse(savedPayments));
            }

            const savedCryptoAddresses = localStorage.getItem('userCryptoAddresses');
            if (savedCryptoAddresses) {
                setCryptoAddresses(JSON.parse(savedCryptoAddresses));
            }

            const savedSelected = localStorage.getItem('selectedPaymentMethod');
            if (savedSelected) {
                setSelectedPayment(JSON.parse(savedSelected));
            }

            const savedSelectedCrypto = localStorage.getItem('selectedCryptoAddress');
            if (savedSelectedCrypto) {
                setSelectedCryptoAddress(JSON.parse(savedSelectedCrypto));
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
        }
    };

    // Инициализация пользователя Telegram
    const initializeUser = () => {
        console.log('🔧 Инициализация пользователя Telegram...');
        
        // Сначала пробуем Telegram WebApp
        if (window.Telegram?.WebApp) {
            console.log('🤖 Telegram WebApp доступен');
            const tg = window.Telegram.WebApp;
            
            tg.ready();
            tg.expand();
            
            // Даем время на инициализацию
            setTimeout(() => {
                const telegramUser = tg.initDataUnsafe?.user;
                if (telegramUser) {
                    console.log('✅ Telegram пользователь найден:', telegramUser);
                    saveUserData(telegramUser);
                    setUserInitialized(true);
                    return;
                }
                
                // Если Telegram не дал данные, используем тестовые
                console.log('⚠️ Telegram данные не получены, используем тестового');
                createTestUser();
            }, 500);
            
            return;
        }
        
        // Пробуем localStorage
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                console.log('✅ Пользователь из localStorage:', userData);
                setUserData(userData);
                setUserInitialized(true);
                return;
            } catch (e) {
                console.error('❌ Ошибка парсинга localStorage:', e);
            }
        }
        
        // Создаем тестового пользователя
        createTestUser();
    };

    // Создание тестового пользователя
    const createTestUser = () => {
        console.log('⚠️ Создаем тестового пользователя');
        const testUser = {
            id: 7879866656,
            username: 'TERBCEO',
            first_name: 'G',
            last_name: ''
        };
        
        saveUserData(testUser);
        setUserInitialized(true);
    };

    // Сохранение данных пользователя
    const saveUserData = (telegramUser) => {
        console.log('💾 Сохранение пользователя:', telegramUser);
        
        localStorage.setItem('telegramUser', JSON.stringify(telegramUser));
        
        const appUser = {
            id: `user_${telegramUser.id}`,
            telegramId: telegramUser.id,
            username: telegramUser.username || `user_${telegramUser.id}`,
            firstName: telegramUser.first_name || '',
            lastName: telegramUser.last_name || '',
            chatId: telegramUser.id
        };
        
        setUserData(appUser);
        localStorage.setItem('currentUser', JSON.stringify(appUser));
        localStorage.setItem('user', JSON.stringify(appUser));
        localStorage.setItem('token', `tg_${telegramUser.id}_${Date.now()}`);
        
        console.log('✅ Данные пользователя сохранены:', appUser);
        setUserInitialized(true);
    };

    // Загрузка курсов с бекенда
    const fetchExchangeRates = async () => {
        try {
            console.log('📡 Запрашиваем динамические курсы...');
            
            // Если есть сумма, используем её для запроса правильного курса
            const queryAmount = amount || (isBuyMode ? MIN_RUB : MIN_USDT);
            const result = await simpleFetch(`/exchange-rate?amount=${queryAmount}`);
            
            if (result.success && result.data) {
                console.log('✅ Динамические курсы получены:', result.data);
                
                // Устанавливаем курсы
                setRates({
                    buy: result.data.buy || 92.50,
                    sell: result.data.sell || 93.50
                });
                
                // Показываем сообщение о уровне курса
                if (result.data.tier && result.data.message) {
                    console.log(`🏆 ${result.data.message}: ${result.data.tier} уровень`);
                    
                    // Можно показать всплывающее сообщение о выгодном курсе
                    if (queryAmount >= 1000 && result.data.tier === 'vip') {
                        showMessage('info', `🎉 VIP курс! ${result.data.buy} RUB за 1 USDT`);
                    }
                }
                
            } else {
                console.log('⚠️ Используем стандартные курсы');
                setRates({
                    buy: 92.50,
                    sell: 93.50
                });
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки курсов:', error);
            // Fallback курсы
            setRates({
                buy: 92.50,
                sell: 93.50
            });
        }
    };

    // Переключение режима покупки/продажи
    const handleSwap = () => {
        setIsSwapped(!isSwapped);
        setIsBuyMode(!isBuyMode);
        setAmount('');
        setError('');
        fetchExchangeRates();
    };

    // Обработка изменения суммы
    const handleAmountChange = (e) => {
        const value = e.target.value;
        setAmount(value);
        
        // Проверка валидности
        if (value && value.trim() !== '') {
            const numAmount = parseFloat(value);
            if (!isNaN(numAmount)) {
                if (isBuyMode) {
                    if (numAmount < MIN_RUB) {
                        setError(`Минимальная сумма: ${MIN_RUB.toLocaleString()} RUB`);
                    } else if (numAmount > MAX_RUB) {
                        setError(`Максимальная сумма: ${MAX_RUB.toLocaleString()} RUB`);
                    } else {
                        setError('');
                        // Загружаем курс для новой суммы (с задержкой для избежания спама запросов)
                        setTimeout(() => {
                            fetchExchangeRates();
                        }, 500);
                    }
                } else {
                    if (numAmount < MIN_USDT) {
                        setError(`Минимальная сумма: ${MIN_USDT} USDT`);
                    } else if (numAmount > MAX_USDT) {
                        setError(`Максимальная сумма: ${MAX_USDT} USDT`);
                    } else {
                        setError('');
                        // Загружаем курс для новой суммы
                        setTimeout(() => {
                            fetchExchangeRates();
                        }, 500);
                    }
                }
            }
        } else {
            setError('');
        }
    };

    // Получение текущего курса для отображения
    const getCurrentRateForDisplay = () => {
        return isBuyMode ? rates.buy : rates.sell;
    };

    // Форматирование курса
    const formatRate = (rate) => {
        return rate.toFixed(2);
    };

    // ====================== ФУНКЦИИ ДЛЯ РЕКВИЗИТОВ ======================

    const handleBankSelect = (bank) => {
        setNewPayment(prev => ({
            ...prev,
            bankName: bank,
            cardNumberError: '',
            phoneNumber: bank === 'СБП (Система быстрых платежей)' ? prev.phoneNumber : '',
            cardNumber: bank === 'СБП (Система быстрых платежей)' ? '' : prev.cardNumber
        }));
        setShowBankDropdown(false);
    };

    const handleCardNumberChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 16) value = value.slice(0, 16);
        
        let formatted = '';
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) {
                formatted += ' ';
            }
            formatted += value[i];
        }

        let cardNumberError = '';
        if (value.length > 0 && value.length < 16) {
            cardNumberError = 'Номер карты должен содержать 16 цифр';
        }

        setNewPayment(prev => ({
            ...prev,
            cardNumber: formatted,
            cardNumberError
        }));
    };

    const handlePhoneNumberChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        
        let formatted = value;
        if (value.length > 0) {
            formatted = '+7';
            if (value.length > 1) {
                formatted += ' (' + value.slice(1, 4);
                if (value.length > 4) {
                    formatted += ') ' + value.slice(4, 7);
                    if (value.length > 7) {
                        formatted += '-' + value.slice(7, 9);
                        if (value.length > 9) {
                            formatted += '-' + value.slice(9, 11);
                        }
                    }
                }
            }
        }

        let cardNumberError = '';
        if (value.length > 0 && value.length < 11) {
            cardNumberError = 'Введите полный номер телефона (11 цифр)';
        }

        setNewPayment(prev => ({
            ...prev,
            phoneNumber: formatted,
            cardNumberError
        }));
    };

    const handleAddPayment = () => {
        const isSBP = newPayment.bankName === 'СБП (Система быстрых платежей)';
        const number = isSBP ? 
            newPayment.phoneNumber.replace(/\D/g, '') : 
            newPayment.cardNumber.replace(/\s/g, '');

        if (isSBP ? number.length !== 11 : number.length !== 16) {
            setNewPayment(prev => ({
                ...prev,
                cardNumberError: isSBP ? 
                    'Номер телефона должен содержать 11 цифр' : 
                    'Номер карты должен содержать 16 цифр'
            }));
            return;
        }

        const newPaymentMethod = {
            id: Date.now().toString(),
            name: newPayment.bankName,
            number: number,
            type: isSBP ? 'sbp' : 'card',
            formattedNumber: isSBP ? newPayment.phoneNumber : newPayment.cardNumber
        };

        setPaymentMethods(prev => [...prev, newPaymentMethod]);
        setSelectedPayment(newPaymentMethod);
        showMessage('success', '✅ Реквизиты добавлены');
        
        setNewPayment({
            bankName: '',
            cardNumber: '',
            phoneNumber: '',
            cardNumberError: ''
        });
        setShowAddPayment(false);
    };

    const handleDeletePayment = (id, e) => {
        e.stopPropagation();
        setPaymentMethods(prev => prev.filter(payment => payment.id !== id));
        if (selectedPayment?.id === id) {
            setSelectedPayment(null);
        }
        showMessage('success', '✅ Реквизиты удалены');
    };

    const handlePaymentSelect = (payment) => {
        setSelectedPayment(payment);
    };

    const handleAddCryptoAddress = () => {
        if (!newCryptoAddress.address || newCryptoAddress.address.length < 10) {
            setNewCryptoAddress(prev => ({
                ...prev,
                addressError: 'Введите корректный адрес кошелька'
            }));
            return;
        }

        const newAddress = {
            id: Date.now().toString(),
            name: newCryptoAddress.name || 'Мой кошелек',
            address: newCryptoAddress.address,
            network: newCryptoAddress.network
        };

        setCryptoAddresses(prev => [...prev, newAddress]);
        setSelectedCryptoAddress(newAddress);
        showMessage('success', '✅ Адрес кошелька добавлен');
        
        setNewCryptoAddress({
            address: '',
            network: 'ERC20',
            name: '',
            addressError: ''
        });
        setShowAddCrypto(false);
    };

    const handleDeleteCryptoAddress = (id, e) => {
        e.stopPropagation();
        setCryptoAddresses(prev => prev.filter(address => address.id !== id));
        if (selectedCryptoAddress?.id === id) {
            setSelectedCryptoAddress(null);
        }
        showMessage('success', '✅ Адрес кошелька удален');
    };

    const handleCryptoAddressSelect = (address) => {
        setSelectedCryptoAddress(address);
    };

    const copyToClipboard = (text, e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text).then(() => {
            showMessage('success', '✅ Адрес скопирован');
        }).catch(err => {
            console.error('Ошибка копирования:', err);
            showMessage('error', '❌ Ошибка копирования');
        });
    };

    // ====================== ФУНКЦИИ ДЛЯ ОБМЕНА ======================

    // Проверка готовности к обмену
    const isExchangeReady = () => {
        if (!userInitialized) {
            console.log('⏳ Пользователь не инициализирован');
            return false;
        }
        
        if (!amount || error) return false;
        
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount)) return false;
        
        // Проверяем лимиты
        if (isBuyMode) {
            if (numAmount < MIN_RUB || numAmount > MAX_RUB) return false;
            if (!selectedCryptoAddress) return false;
        } else {
            if (numAmount < MIN_USDT || numAmount > MAX_USDT) return false;
            if (!selectedPayment) return false;
        }
        
        return !hasActiveOrder;
    };

    // Проверка активных ордеров
    const checkActiveOrders = async () => {
        if (!userInitialized) {
            console.log('⏳ Пользователь не инициализирован, пропускаем проверку');
            return;
        }

        try {
            const userData = JSON.parse(localStorage.getItem('currentUser'));
            if (!userData || !userData.id) {
                console.log('❌ Данные пользователя не найдены');
                return;
            }

            const userId = userData.id;
            console.log('🔍 Проверяем активные ордеры для:', userId);

            const data = await simpleFetch(`/user-orders/${userId}`);

            let ordersList = [];
            if (data.success && data.orders) {
                ordersList = data.orders;
            }
            
            const activeOrders = ordersList.filter(order =>
                order && (order.status === 'pending' || order.status === 'processing')
            );

            console.log('🔥 Активных ордеров:', activeOrders.length);
            setActiveOrdersCount(activeOrders.length);
            setHasActiveOrder(activeOrders.length > 0);
            
        } catch (error) {
            console.log('⚠️ Ошибка проверки активных ордеров:', error.message);
            setHasActiveOrder(false);
            setActiveOrdersCount(0);
        }
    };

    // ОСНОВНАЯ ФУНКЦИЯ СОЗДАНИЯ ОРДЕРА
    const handleExchange = async () => {
        console.log('🎯 Начинаем создание ордера');
        
        // Проверка
        if (!amount || parseFloat(amount) < 1000) {
            alert('❌ Введите сумму от 1000 RUB');
            return;
        }
        
        // Берем пользователя
        const userStr = localStorage.getItem('currentUser') || '{}';
        const telegramStr = localStorage.getItem('telegramUser') || '{}';
        const user = JSON.parse(userStr);
        const telegramUser = JSON.parse(telegramStr);
        
        // Формируем данные
        const orderData = {
            type: isBuyMode ? 'buy' : 'sell',
            amount: parseFloat(amount),
            telegramId: telegramUser.id || user.telegramId || 7879866656,
            username: telegramUser.username || user.username || 'Пользователь',
            firstName: user.firstName || 'Клиент'
        };
        
        console.log('📤 Отправляем на сервер:', orderData);
        
        try {
            const result = await simpleFetch('/create-order', orderData);
            
            if (result.success) {
                alert(`✅ ОРДЕР СОЗДАН!\n\nID: ${result.order?.id || 'успешно'}\nСтатус: ${result.order?.status}\n\nУведомление отправлено оператору в Telegram.`);
                
                // Очищаем поле
                setAmount('');
                setError('');
                setHasActiveOrder(true);
                
                // Обновляем через 2 секунды
                setTimeout(() => {
                    if (user.id) {
                        checkActiveOrders();
                    }
                }, 2000);
                
            } else {
                alert(`❌ Ошибка: ${result.error || 'Неизвестная ошибка'}`);
            }
            
        } catch (error) {
            console.error('❌ Ошибка сети:', error);
            alert('❌ Ошибка сети. Проверь консоль браузера.');
        }
    };

    // Тест подключения к API
    const testAPIConnection = async () => {
        try {
            showMessage('info', '🔄 Тестируем подключение к серверу...');
            
            const result = await simpleFetch('/health');
            
            if (result.status === 'ok') {
                showMessage('success', '✅ Сервер работает! ' + result.message);
            } else {
                showMessage('error', '❌ Ошибка сервера: ' + result.message);
            }
        } catch (error) {
            showMessage('error', '❌ Нет связи с сервером');
        }
    };

    // Сохранение данных в localStorage
    useEffect(() => {
        localStorage.setItem('userPaymentMethods', JSON.stringify(paymentMethods));
    }, [paymentMethods]);

    useEffect(() => {
        localStorage.setItem('userCryptoAddresses', JSON.stringify(cryptoAddresses));
    }, [cryptoAddresses]);

    useEffect(() => {
        if (selectedPayment) {
            localStorage.setItem('selectedPaymentMethod', JSON.stringify(selectedPayment));
        }
    }, [selectedPayment]);

    useEffect(() => {
        if (selectedCryptoAddress) {
            localStorage.setItem('selectedCryptoAddress', JSON.stringify(selectedCryptoAddress));
        }
    }, [selectedCryptoAddress]);

    // ====================== RENDER ======================

    return (
        <div className="home-container">
            {/* Хедер */}
            <div className="home-header-new">
                <div className="header-content">
                    <div className="header-left">
                        <div className="header-titles">
                            <h1 className="header-title-new">TetherRabbit 🥕</h1>
                            <p className="header-subtitle">Быстрый и безопасный обмен</p>
                        </div>
                    </div>
                    
                    {/* Кнопка теста подключения */}
                    <button 
                        className="test-connection-btn"
                        onClick={testAPIConnection}
                        title="Тест подключения к серверу"
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '20px',
                            cursor: 'pointer',
                            padding: '8px'
                        }}
                    >
                        🌐
                    </button>
                </div>

                {/* Активные операции */}
                {hasActiveOrder && (
                    <div className="active-order-warning-new">
                        <div className="warning-content">
                            <div className="warning-icon">⏳</div>
                            <div className="warning-text">
                                <strong>У вас есть активная операция</strong>
                                <span>Завершите текущий обмен перед созданием нового</span>
                            </div>
                            <button
                                className="warning-button"
                                onClick={() => handleNavigation('/history')}
                            >
                                Перейти
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Контент */}
            <div className="home-content">
                {!userInitialized && (
                    <div className="loading-overlay-new">
                        <div className="loading-spinner-new"></div>
                        <p className="loading-text">Инициализация пользователя...</p>
                    </div>
                )}

                <div className={hasActiveOrder ? 'form-disabled' : ''}>
                    {/* Переключатель режимов */}
                    <div className="mode-switcher-simple">
                        <button
                            className={`mode-simple-button ${isBuyMode ? 'active' : ''}`}
                            onClick={() => {
                                setIsBuyMode(true);
                                setIsSwapped(false);
                                setAmount('');
                                setError('');
                                fetchExchangeRates();
                            }}
                        >
                            <span className="mode-simple-text">Покупка</span>
                        </button>
                        <button
                            className={`mode-simple-button ${!isBuyMode ? 'active' : ''}`}
                            onClick={() => {
                                setIsBuyMode(false);
                                setIsSwapped(true);
                                setAmount('');
                                setError('');
                                fetchExchangeRates();
                            }}
                        >
                            <span className="mode-simple-text">Продажа</span>
                        </button>
                    </div>

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
                                            {formatRate(getCurrentRateForDisplay())} ₽
                                        </span>
                                    )}
                                </div>
                            </div>

                            <button
                                className={`swap-center-button ${isSwapped ? 'swapped' : ''}`}
                                onClick={handleSwap}
                            >
                                <svg width="58" height="58" viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="29" cy="29" r="26.5" fill="#007CFF" stroke="#EFEFF3" strokeWidth="5"/>
                                    <path d="M37.3333 17.5423C40.8689 20.1182 43.1667 24.2908 43.1667 29C43.1667 36.824 36.824 43.1667 29 43.1667H28.1667M20.6667 40.4577C17.1311 37.8818 14.8333 33.7092 14.8333 29C14.8333 21.176 21.176 14.8333 29 14.8333H29.8333M30.6667 46.3333L27.3333 43L30.6667 39.6667M27.3333 18.3333L30.6667 15L27.3333 11.6667" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>

                            <div className="currency-card-side right-card">
                                <div className="currency-content">
                                    <span className="currency-name">
                                        {isBuyMode ? "USDT" : "RUB"}
                                    </span>
                                    {!isBuyMode && (
                                        <span className="currency-rate light">
                                            {formatRate(getCurrentRateForDisplay())} ₽
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
                                        disabled={!userInitialized || hasActiveOrder}
                                    />
                                    <span className="amount-currency">
                                        {isBuyMode ? "RUB" : "USDT"}
                                    </span>
                                </div>
                                <div className="min-limit-hint">
                                    Лимиты: {isBuyMode 
                                        ? `${MIN_RUB.toLocaleString()} - ${MAX_RUB.toLocaleString()} RUB`
                                        : `${MIN_USDT} - ${MAX_USDT} USDT`
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

                    {/* Банковские реквизиты для продажи */}
                    {!isBuyMode && (
                        <div className="payment-section-new">
                            <div className="payment-header-new">
                                <h3 className="section-title">Банковские реквизиты для получения RUB</h3>
                                {!showAddPayment && (
                                    <button
                                        className="add-payment-button"
                                        onClick={() => setShowAddPayment(true)}
                                    >
                                        + Добавить
                                    </button>
                                )}
                            </div>

                            {showAddPayment && (
                                <div className="add-payment-form-new">
                                    {/* Форма добавления банковских реквизитов */}
                                </div>
                            )}

                            <div className="payment-methods-new">
                                {/* Список банковских реквизитов */}
                            </div>
                        </div>
                    )}
                
                    {/* Крипто-адреса для покупки */}
                    {isBuyMode && (
                        <div className="payment-section-new">
                            <div className="payment-header-new">
                                <h3 className="section-title">Адрес для получения USDT</h3>
                                {!showAddCrypto && (
                                    <button
                                        className="add-payment-button"
                                        onClick={() => setShowAddCrypto(true)}
                                    >
                                        + Добавить
                                    </button>
                                )}
                            </div>

                            {showAddCrypto && (
                                <div className="add-payment-form-new">
                                    {/* Форма добавления крипто-адреса */}
                                </div>
                            )}

                            <div className="payment-methods-new">
                                {/* Список крипто-адресов */}
                            </div>
                        </div>
                    )}
                </div>

                {/* Кнопка обмена */}
                <button
                    className={`exchange-button-new ${isBuyMode ? 'buy' : 'sell'} ${!isExchangeReady() ? 'disabled' : ''}`}
                    disabled={!isExchangeReady() || hasActiveOrder}
                    onClick={handleExchange}
                >
                    <span className="exchange-icon">
                        {isBuyMode ? '🛒' : '💰'}
                    </span>
                    <span className="exchange-text">
                        {!userInitialized ? '⏳ Загрузка...' : 
                         (isBuyMode ? 'Купить USDT' : 'Продать USDT')}
                    </span>
                </button>

                {/* Информация о безопасности */}
                <div className="security-info">
                    <div className="security-icon">🔒</div>
                    <div className="security-text">
                        <strong>Безопасная сделка:</strong> Все транзакции защищены системой TetherRabbit. 
                        Средства замораживаются у трейдера до подтверждения получения.
                    </div>
                </div>
            </div>

            {/* Toast сообщения */}
            {message.text && (
                <div className={`message-toast-new message-${message.type}`}>
                    <span className="toast-icon">
                        {message.type === 'success' ? '✅' : 
                         message.type === 'error' ? '❌' : '⚠️'}
                    </span>
                    <span className="toast-text">{message.text}</span>
                </div>
            )}

            {/* Support Chat */}
            {showSupportChat && (
                <div className="chat-modal-overlay">
                    <div className="chat-modal">
                        <SupportChat
                            orderId={currentOrderId}
                            onClose={() => setShowSupportChat(false)}
                            exchangeData={currentExchangeData}
                        />
                    </div>
                </div>
            )}

            {/* Навигация */}
            <div className="bottom-nav">
                <button className="nav-item active">
                    <span className="nav-icon">💸</span>
                    <span className="nav-label">Обмен</span>
                </button>

                <button className="nav-item" onClick={() => navigateTo('/profile')}>
                    <span className="nav-icon">👤</span>
                    <span className="nav-label">Профиль</span>
                </button>

                <button className="nav-item" onClick={() => navigateTo('/history')}>
                    <span className="nav-icon">📊</span>
                    <span className="nav-label">История</span>
                </button>

                <button className="nav-item" onClick={() => navigateTo('/help')}>
                    <span className="nav-icon">❓</span>
                    <span className="nav-label">Помощь</span>
                </button>
            </div>
        </div>
    );
}

export default Home;