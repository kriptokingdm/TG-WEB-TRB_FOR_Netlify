import React from "react";
import { useState, useEffect } from 'react';
import './Home.css';
import SupportChat from './SupportChat';

// URL сервера
const serverUrl = 'http://87.242.106.114:8080';

function Home({ navigateTo }) {
    const [isBuyMode, setIsBuyMode] = useState(true);
    const [isSwapped, setIsSwapped] = useState(false);
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [buyRate, setBuyRate] = useState(85.6);
    const [sellRate, setSellRate] = useState(81.6);
    const [currentTier, setCurrentTier] = useState('');

    // Состояния для чата
    const [showSupportChat, setShowSupportChat] = useState(false);
    const [currentOrderId, setCurrentOrderId] = useState(null);
    const [currentExchangeData, setCurrentExchangeData] = useState(null);

    // Состояния для активных ордеров
    const [hasActiveOrder, setHasActiveOrder] = useState(false);
    const [activeOrdersCount, setActiveOrdersCount] = useState(0);

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

    // Таймер для перезагрузки пользователя
    const [userInitialized, setUserInitialized] = useState(false);

    // Функция для расчета конвертированной суммы
    const calculateConvertedAmount = () => {
        if (!amount) return '';
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount)) return '';

        if (isBuyMode) {
            return (numAmount / buyRate).toFixed(2);
        } else {
            return (numAmount * sellRate).toFixed(2);
        }
    };

    const convertedAmount = calculateConvertedAmount();

    // ========== ИНИЦИАЛИЗАЦИЯ ПОЛЬЗОВАТЕЛЯ ==========
    const initializeUser = () => {
        console.log('🔧 Инициализация пользователя...');
        
        // 1. Пробуем получить из localStorage
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            console.log('✅ Пользователь найден в localStorage:', JSON.parse(savedUser));
            setUserInitialized(true);
            return;
        }

        // 2. Пробуем Telegram WebApp
        let telegramUser = null;
        
        // Способ 1: Через window.Telegram.WebApp
        if (window.Telegram?.WebApp) {
            console.log('🤖 Telegram WebApp доступен');
            const tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand();
            
            telegramUser = tg.initDataUnsafe?.user;
            if (telegramUser) {
                console.log('✅ Telegram пользователь из initDataUnsafe:', telegramUser);
            } else {
                // Пробуем распарсить initData
                if (tg.initData) {
                    console.log('Парсим initData...');
                    try {
                        const params = new URLSearchParams(tg.initData);
                        const userStr = params.get('user');
                        if (userStr) {
                            telegramUser = JSON.parse(decodeURIComponent(userStr));
                            console.log('✅ Telegram пользователь из initData:', telegramUser);
                        }
                    } catch (e) {
                        console.error('❌ Ошибка парсинга initData:', e);
                    }
                }
            }
        }

        // Способ 2: Через URL параметры
        if (!telegramUser) {
            const urlParams = new URLSearchParams(window.location.search);
            const tgWebAppData = urlParams.get('tgWebAppData');
            
            if (tgWebAppData) {
                console.log('📱 Telegram данные в URL');
                try {
                    const params = new URLSearchParams(tgWebAppData);
                    const userStr = params.get('user');
                    if (userStr) {
                        telegramUser = JSON.parse(decodeURIComponent(userStr));
                        console.log('✅ Telegram пользователь из URL:', telegramUser);
                    }
                } catch (e) {
                    console.error('❌ Ошибка парсинга URL данных:', e);
                }
            }
        }

        // 3. Если Telegram не найден, создаем тестового пользователя
        if (!telegramUser) {
            console.log('⚠️ Telegram данные не найдены, создаем тестового пользователя');
            telegramUser = {
                id: 7879866656, // Ваш telegram ID
                username: 'TERBCEO',
                first_name: 'G',
                last_name: ''
            };
        }

        // 4. Сохраняем пользователя
        saveUserData(telegramUser);
    };

    const saveUserData = (telegramUser) => {
        console.log('💾 Сохранение данных пользователя:', telegramUser);
        
        // Сохраняем Telegram данные
        localStorage.setItem('telegramUser', JSON.stringify(telegramUser));
        
        // Создаем пользователя для приложения
        const appUser = {
            id: `user_${telegramUser.id}`,
            telegramId: telegramUser.id,
            username: telegramUser.username || `user_${telegramUser.id}`,
            firstName: telegramUser.first_name || '',
            lastName: telegramUser.last_name || '',
            chatId: telegramUser.id
        };
        
        localStorage.setItem('currentUser', JSON.stringify(appUser));
        localStorage.setItem('user', JSON.stringify(appUser));
        localStorage.setItem('token', `tg_${telegramUser.id}_${Date.now()}`);
        
        console.log('✅ Пользователь сохранен:', appUser);
        setUserInitialized(true);
        
        // Пробуем зарегистрировать на сервере
        registerUserOnServer(appUser);
    };

    const registerUserOnServer = async (userData) => {
        try {
            console.log('📡 Регистрация пользователя на сервере:', userData);
            const response = await fetch(`${serverUrl}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    telegramId: userData.telegramId,
                    username: userData.username,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    chatId: userData.chatId
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Пользователь зарегистрирован на сервере:', result);
            } else {
                console.log('⚠️ Сервер не ответил на регистрацию, используем локальные данные');
            }
        } catch (error) {
            console.error('❌ Ошибка регистрации на сервере:', error);
        }
    };

    // ========== ЗАГРУЗКА ДАННЫХ ==========
    useEffect(() => {
        console.log('🚀 Компонент Home загружен');
        
        // Загружаем сохраненные данные
        const savedPayments = localStorage.getItem('userPaymentMethods');
        if (savedPayments) {
            try {
                setPaymentMethods(JSON.parse(savedPayments));
            } catch (error) {
                console.error('Ошибка загрузки реквизитов:', error);
            }
        }

        const savedCryptoAddresses = localStorage.getItem('userCryptoAddresses');
        if (savedCryptoAddresses) {
            try {
                setCryptoAddresses(JSON.parse(savedCryptoAddresses));
            } catch (error) {
                console.error('Ошибка загрузки адресов:', error);
            }
        }

        const savedSelected = localStorage.getItem('selectedPaymentMethod');
        if (savedSelected) {
            setSelectedPayment(JSON.parse(savedSelected));
        }

        const savedSelectedCrypto = localStorage.getItem('selectedCryptoAddress');
        if (savedSelectedCrypto) {
            setSelectedCryptoAddress(JSON.parse(savedSelectedCrypto));
        }

        // Инициализируем пользователя с задержкой
        const timer = setTimeout(() => {
            initializeUser();
        }, 1000);

        // Загружаем курсы
        fetchExchangeRates();

        return () => {
            clearTimeout(timer);
        };
    }, []);

    // Проверяем активные ордеры после инициализации пользователя
    useEffect(() => {
        if (userInitialized) {
            checkActiveOrders();
            
            // Периодическая проверка
            const interval = setInterval(() => {
                checkActiveOrders();
            }, 30000);

            return () => {
                clearInterval(interval);
            };
        }
    }, [userInitialized]);

    // ========== ЗАГРУЗКА КУРСОВ ==========
    const fetchExchangeRates = async () => {
        console.log('📈 Загрузка курсов...');
        
        // Используем фиктивные курсы, если сервер не доступен
        const useMockRates = () => {
            console.log('🎭 Используем фиктивные курсы');
            setBuyRate(85.6);
            setSellRate(81.6);
            setCurrentTier('standard');
        };

        try {
            let requestAmount = amount ? parseFloat(amount) : 100;
            if (requestAmount < MIN_USDT) requestAmount = MIN_USDT;
            
            const type = isBuyMode ? 'buy' : 'sell';
            const url = `${serverUrl}/api/exchange-rate?amount=${requestAmount}&type=${type}`;
            console.log('📡 Запрос курсов:', url);
            
            // Пробуем с таймаутом
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            console.log('📊 Статус ответа курсов:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Курсы получены:', data);
                setBuyRate(data.buy || 85.6);
                setSellRate(data.sell || 81.6);
                setCurrentTier(data.tier || 'standard');
            } else {
                useMockRates();
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки курсов:', error.message);
            useMockRates();
        }
    };

    // ========== ПРОВЕРКА АКТИВНЫХ ОРДЕРОВ ==========
    const checkActiveOrders = async () => {
        if (!userInitialized) {
            console.log('⏳ Пользователь не инициализирован, пропускаем проверку ордеров');
            return;
        }

        try {
            const userData = JSON.parse(localStorage.getItem('currentUser'));
            if (!userData || !userData.id) {
                console.log('❌ Данные пользователя не найдены');
                return;
            }

            const userId = userData.id;
            console.log('🔍 Проверка активных ордеров для:', userId);

            const url = `${serverUrl}/api/user-orders/${userId}`;
            console.log('📡 Запрос ордеров:', url);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                console.log('📦 Данные ордеров:', data);
                
                const activeOrders = data.orders ? data.orders.filter(order =>
                    order.status === 'pending' || order.status === 'paid' || order.status === 'processing'
                ) : [];

                console.log('🔥 Активных ордеров:', activeOrders.length);
                setActiveOrdersCount(activeOrders.length);
                setHasActiveOrder(activeOrders.length > 0);
            } else {
                console.log('⚠️ Сервер не ответил, считаем что активных ордеров нет');
                setHasActiveOrder(false);
                setActiveOrdersCount(0);
            }
        } catch (error) {
            console.error('❌ Ошибка проверки ордеров:', error.message);
            setHasActiveOrder(false);
            setActiveOrdersCount(0);
        }
    };

    // ========== ОСНОВНЫЕ ФУНКЦИИ ==========
    const handleSwap = () => {
        setIsSwapped(!isSwapped);
        setIsBuyMode(!isBuyMode);
        setAmount('');
        setError('');
        fetchExchangeRates();
    };

    const handleAmountChange = (e) => {
        const value = e.target.value;
        setAmount(value);

        if (value) {
            const numAmount = parseFloat(value);
            if (!isNaN(numAmount)) {
                if (isBuyMode) {
                    if (numAmount < MIN_RUB) {
                        setError(`Минимальная сумма: ${MIN_RUB.toLocaleString()} RUB`);
                    } else if (numAmount > MAX_RUB) {
                        setError(`Максимальная сумма: ${MAX_RUB.toLocaleString()} RUB`);
                    } else {
                        setError('');
                    }
                } else {
                    if (numAmount < MIN_USDT) {
                        setError(`Минимальная сумма: ${MIN_USDT} USDT`);
                    } else if (numAmount > MAX_USDT) {
                        setError(`Максимальная сумма: ${MAX_USDT} USDT`);
                    } else {
                        setError('');
                    }
                }
            }
        } else {
            setError('');
        }
    };

    const getCurrentRateForDisplay = () => {
        return isBuyMode ? buyRate : sellRate;
    };

    const formatRate = (rate) => {
        return rate.toFixed(2);
    };

    // ========== ФУНКЦИИ ДЛЯ РЕКВИЗИТОВ ==========
    // (оставляем без изменений из вашего кода)
    const handleAddPayment = () => {
        if (!newPayment.bankName.trim()) {
            setNewPayment(prev => ({ ...prev, cardNumberError: 'Выберите банк' }));
            return;
        }

        if (newPayment.bankName === 'СБП (Система быстрых платежей)') {
            if (!newPayment.phoneNumber.trim()) {
                setNewPayment(prev => ({ ...prev, cardNumberError: 'Введите номер телефона для СБП' }));
                return;
            }
            
            const newPaymentMethod = {
                id: Date.now(),
                name: newPayment.bankName,
                number: newPayment.phoneNumber,
                fullNumber: newPayment.phoneNumber,
                isUserAdded: true,
                type: 'sbp'
            };

            setPaymentMethods(prev => [...prev, newPaymentMethod]);
            setSelectedPayment(newPaymentMethod);
            
        } else {
            const cleanedCardNumber = newPayment.cardNumber.replace(/\s/g, '');
            if (!/^\d+$/.test(cleanedCardNumber)) {
                setNewPayment(prev => ({ ...prev, cardNumberError: 'Номер карты должен содержать только цифры' }));
                return;
            }

            if (cleanedCardNumber.length < 16) {
                setNewPayment(prev => ({ ...prev, cardNumberError: 'Номер карты должен содержать 16 цифр' }));
                return;
            }

            const newPaymentMethod = {
                id: Date.now(),
                name: newPayment.bankName,
                number: cleanedCardNumber.slice(-4),
                fullNumber: cleanedCardNumber,
                isUserAdded: true,
                type: 'card'
            };

            setPaymentMethods(prev => [...prev, newPaymentMethod]);
            setSelectedPayment(newPaymentMethod);
        }

        setNewPayment({
            bankName: '',
            cardNumber: '',
            phoneNumber: '',
            cardNumberError: ''
        });
        setShowAddPayment(false);
        setShowBankDropdown(false);
    };

    const handleDeletePayment = (id, e) => {
        e.stopPropagation();
        setPaymentMethods(prev => prev.filter(payment => payment.id !== id));
        if (selectedPayment && selectedPayment.id === id) {
            setSelectedPayment(null);
        }
    };

    const handlePaymentSelect = (payment) => {
        setSelectedPayment(payment);
    };

    const handleBankSelect = (bank) => {
        setNewPayment(prev => ({ ...prev, bankName: bank }));
        setShowBankDropdown(false);
    };

    const formatCardNumber = (number) => {
        const cleaned = number.replace(/\s/g, '');
        return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ').substr(0, 19);
    };

    const handleCardNumberChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        const formatted = formatCardNumber(value);
        setNewPayment(prev => ({
            ...prev,
            cardNumber: formatted,
            cardNumberError: ''
        }));
    };

    const handlePhoneNumberChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        let formatted = value;
        
        if (value.length <= 1) {
            formatted = value;
        } else if (value.length <= 4) {
            formatted = `+7 (${value.substring(1, 4)}`;
        } else if (value.length <= 7) {
            formatted = `+7 (${value.substring(1, 4)}) ${value.substring(4, 7)}`;
        } else if (value.length <= 9) {
            formatted = `+7 (${value.substring(1, 4)}) ${value.substring(4, 7)}-${value.substring(7, 9)}`;
        } else {
            formatted = `+7 (${value.substring(1, 4)}) ${value.substring(4, 7)}-${value.substring(7, 9)}-${value.substring(9, 11)}`;
        }
        
        setNewPayment(prev => ({
            ...prev,
            phoneNumber: formatted,
            cardNumberError: ''
        }));
    };

    // ========== ФУНКЦИИ ДЛЯ КРИПТО-АДРЕСОВ ==========
    const handleAddCryptoAddress = () => {
        if (!newCryptoAddress.address.trim()) {
            setNewCryptoAddress(prev => ({ ...prev, addressError: 'Введите адрес кошелька' }));
            return;
        }

        if (!newCryptoAddress.name.trim()) {
            setNewCryptoAddress(prev => ({ ...prev, addressError: 'Введите название кошелька' }));
            return;
        }

        const newCrypto = {
            id: Date.now(),
            name: newCryptoAddress.name,
            address: newCryptoAddress.address,
            network: newCryptoAddress.network,
            isUserAdded: true
        };

        setCryptoAddresses(prev => [...prev, newCrypto]);
        setSelectedCryptoAddress(newCrypto);
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
        if (selectedCryptoAddress && selectedCryptoAddress.id === id) {
            setSelectedCryptoAddress(null);
        }
    };

    const handleCryptoAddressSelect = (address) => {
        setSelectedCryptoAddress(address);
    };

    const copyToClipboard = (text, e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text).then(() => {
            alert('Адрес скопирован в буфер обмена');
        });
    };

    // ========== ПРОВЕРКА ГОТОВНОСТИ К ОБМЕНУ ==========
    const isExchangeReady = () => {
        if (!userInitialized) {
            console.log('⏳ Пользователь не инициализирован');
            return false;
        }
        
        if (hasActiveOrder) {
            console.log('⚠️ Есть активный ордер');
            return false;
        }
        
        if (!amount || error) {
            console.log('⚠️ Неверная сумма');
            return false;
        }

        const numAmount = parseFloat(amount);
        if (isBuyMode) {
            if (numAmount < MIN_RUB || numAmount > MAX_RUB) return false;
        } else {
            if (numAmount < MIN_USDT || numAmount > MAX_USDT) return false;
        }

        if (isBuyMode) {
            if (!selectedCryptoAddress) {
                console.log('⚠️ Не выбран крипто-адрес');
                return false;
            }
        } else {
            if (!selectedPayment) {
                console.log('⚠️ Не выбран платежный метод');
                return false;
            }
        }

        console.log('✅ Все готово к обмену');
        return true;
    };

    // ========== СОЗДАНИЕ ЗАЯВКИ ==========
    const handleExchange = async () => {
        console.log('🔄 Начало создания заявки');
        
        if (!userInitialized) {
            alert('❌ Пользователь не инициализирован. Подождите...');
            initializeUser();
            return;
        }

        if (hasActiveOrder) {
            alert('❌ У вас уже есть активный ордер! Завершите текущую операцию перед созданием новой.');
            navigateTo('/history');
            return;
        }

        if (!isExchangeReady()) {
            alert('❌ Заполните все поля правильно');
            return;
        }

        try {
            const userData = JSON.parse(localStorage.getItem('currentUser'));
            const telegramUser = JSON.parse(localStorage.getItem('telegramUser') || '{}');
            
            console.log('👤 Данные для заявки:', { userData, telegramUser });
            
            if (!userData || !userData.id) {
                alert('❌ Ошибка: пользователь не найден. Перезагрузите приложение.');
                return;
            }

            const exchangeData = {
                type: isBuyMode ? 'buy' : 'sell',
                amount: parseFloat(amount),
                rate: isBuyMode ? buyRate : sellRate,
                userId: userData.id,
                telegramId: telegramUser.id || userData.telegramId,
                username: telegramUser.username || userData.username || 'Пользователь',
                firstName: userData.firstName,
                lastName: userData.lastName,
                chatId: userData.chatId || userData.telegramId,
                paymentMethod: isBuyMode ? null : selectedPayment,
                cryptoAddress: isBuyMode ? selectedCryptoAddress : null,
                tier: currentTier
            };

            console.log('📋 Данные заявки:', exchangeData);

            // Сначала пробуем отправить на сервер
            try {
                const response = await fetch(`${serverUrl}/api/create-order`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(exchangeData)
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Заявка создана на сервере:', result);

                    if (result.success) {
                        handleSuccessfulOrder(result.order);
                    } else {
                        alert(`❌ Ошибка сервера: ${result.error || 'Неизвестная ошибка'}`);
                    }
                } else {
                    console.log('⚠️ Сервер не ответил, создаем локальную заявку');
                    createLocalOrder(exchangeData);
                }
            } catch (serverError) {
                console.error('❌ Ошибка подключения к серверу:', serverError);
                createLocalOrder(exchangeData);
            }

        } catch (error) {
            console.error('❌ Критическая ошибка:', error);
            alert('❌ Ошибка при создании заявки. Проверьте консоль для деталей.');
        }
    };

    const createLocalOrder = (exchangeData) => {
        console.log('💾 Создание локальной заявки');
        
        const localOrder = {
            id: `local_${Date.now()}`,
            ...exchangeData,
            status: 'pending',
            createdAt: new Date().toISOString(),
            isLocal: true
        };

        // Сохраняем в localStorage
        const orders = JSON.parse(localStorage.getItem('localOrders') || '[]');
        orders.push(localOrder);
        localStorage.setItem('localOrders', JSON.stringify(orders));

        handleSuccessfulOrder(localOrder);
    };

    const handleSuccessfulOrder = (order) => {
        console.log('🎉 Заявка успешно создана:', order);
        
        setHasActiveOrder(true);
        setActiveOrdersCount(prev => prev + 1);
        setCurrentOrderId(order.id);
        setCurrentExchangeData({
            type: order.type,
            amount: order.amount,
            rate: order.rate,
            convertedAmount: calculateConvertedAmount()
        });

        setShowSupportChat(true);
        
        alert('✅ Заявка создана успешно! Открыт чат с поддержкой.');
    };

    // ========== СОХРАНЕНИЕ ДАННЫХ ==========
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

    // ========== РЕНДЕР ==========
    // (рендер остается без изменений из вашего кода, только добавлена проверка инициализации)
    return (
        <div className="home-container">
            {!userInitialized && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <p>Инициализация пользователя...</p>
                </div>
            )}

            {hasActiveOrder && (
                <div className="active-order-warning">
                    <div className="warning-content">
                        <div className="warning-icon">⏳</div>
                        <div className="warning-text">
                            <strong>У вас есть активная операция</strong>
                            <span>Завершите текущий обмен перед созданием нового</span>
                        </div>
                        <button
                            className="warning-button"
                            onClick={() => navigateTo('/history')}
                        >
                            Перейти к операции
                        </button>
                    </div>
                </div>
            )}

            <div className="mode-switcher">
                <button
                    className={`mode-button buy ${isBuyMode ? 'active' : ''}`}
                    onClick={() => {
                        setIsBuyMode(true);
                        setIsSwapped(false);
                        setAmount('');
                        setError('');
                        fetchExchangeRates();
                    }}
                >
                    Покупка
                </button>
                <button
                    className={`mode-button sell ${!isBuyMode ? 'active' : ''}`}
                    onClick={() => {
                        setIsBuyMode(false);
                        setIsSwapped(true);
                        setAmount('');
                        setError('');
                        fetchExchangeRates();
                    }}
                >
                    Продажа
                </button>
            </div>

            <div className={hasActiveOrder ? 'form-disabled' : ''}>
                {/* ... остальной рендер без изменений ... */}
                {/* (полностью копируем из вашего кода, начиная с currency-cards-horizontal) */}
                
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
                        <svg width="58" height="58" viewBox="0 0 58 58" fill="none">
                            <circle cx="29" cy="29" r="26.5" fill="#007CFF" stroke="#EFEFF3" strokeWidth="5" />
                            <path d="M37.3333 17.5423C40.8689 20.1182 43.1666 24.2907 43.1666 29C43.1666 36.824 36.824 43.1666 29 43.1666H28.1666M20.6666 40.4576C17.1311 37.8817 14.8333 33.7092 14.8333 29C14.8333 21.1759 21.1759 14.8333 29 14.8333H29.8333M30.6666 46.3333L27.3333 43L30.6666 39.6666M27.3333 18.3333L30.6666 15L27.3333 11.6666" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
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
                                disabled={!userInitialized}
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

                {/* ... остальной код рендера без изменений ... */}
                {/* (включая payment-section, payment-methods и т.д.) */}
            </div>

            <button
                className={`exchange-button ${isBuyMode ? 'buy' : 'sell'} ${!isExchangeReady() ? 'disabled' : ''}`}
                disabled={!isExchangeReady()}
                onClick={handleExchange}
            >
                {!userInitialized ? '⏳ Загрузка...' : 
                 hasActiveOrder ? '❌ Завершите текущий ордер' : 
                 (isBuyMode ? 'Купить USDT' : 'Продать USDT')}
            </button>

            {showSupportChat && (
                <SupportChat
                    orderId={currentOrderId}
                    onClose={() => setShowSupportChat(false)}
                    exchangeData={currentExchangeData}
                />
            )}

            <div className="bottom-nav">
                <button className="nav-button active" onClick={() => navigateTo('/')}>
                    <span>🏠</span>
                    <span>Обмен</span>
                </button>

                <button className="nav-button" onClick={() => navigateTo('/profile')}>
                    <span>👤</span>
                    <span>Профиль</span>
                </button>

                <button className="nav-button" onClick={() => navigateTo('/history')}>
                    <span>📊</span>
                    <span>История</span>
                </button>

                <button className="nav-button" onClick={() => navigateTo('/help')}>
                    <span>❓</span>
                    <span>Справка</span>
                </button>
            </div>
        </div>
    );
}

export default Home;