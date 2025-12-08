import React from "react";
import { useState, useEffect } from 'react';
import './Home.css';
import SupportChat from './SupportChat';

// Умная функция fetch для работы с self-signed SSL и CORS
const apiFetch = async (path, options = {}) => {
    const baseUrls = [
        'https://tethrab.shop/api',      // Основной домен
        'https://87.242.106.114/api',    // IP как fallback
        `https://api.allorigins.win/raw?url=${encodeURIComponent('https://tethrab.shop/api')}`  // CORS proxy
    ];
    
    let lastError = '';
    
    for (const baseUrl of baseUrls) {
        try {
            const url = `${baseUrl}${path}`;
            console.log(`🌐 Пробуем: ${url}`);
            
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                mode: 'cors',
                credentials: 'omit'
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Успех с ${baseUrl}`);
                return data;
            }
            
            lastError = `HTTP ${response.status}`;
            console.log(`⚠️ ${url}: ${lastError}`);
            
        } catch (error) {
            lastError = error.message;
            console.log(`❌ ${baseUrl}: ${lastError}`);
        }
    }
    
    throw new Error(`Не удалось подключиться. Последняя ошибка: ${lastError}`);
};

// Тест подключения
const testConnection = async () => {
    try {
        const result = await apiFetch('/health');
        console.log('✅ API работает:', result);
        return true;
    } catch (error) {
        console.error('❌ API не доступен:', error);
        return false;
    }
};

function Home({ navigateTo, telegramUser }) {
    const [isBuyMode, setIsBuyMode] = useState(true);
    const [isSwapped, setIsSwapped] = useState(false);
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [userData, setUserData] = useState(null);
    
    // ПРОСТЫЕ КУРСЫ
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

    // Обновите этот useEffect:
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

        // Тестируем подключение
        setTimeout(() => {
            testConnection();
        }, 2000);

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

    // ДОБАВЬТЕ ЭТУ ФУНКЦИЮ ПОСЛЕ initializeUser:
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

    // Загрузка курсов с бекенда - ИСПРАВЛЕННАЯ ВЕРСИЯ
    const fetchExchangeRates = async () => {
        try {
            console.log('📡 Запрашиваем курсы...');
            
            // Используем нашу умную функцию fetch
            const result = await apiFetch('/exchange-rate');
            
            if (result.success) {
                console.log('✅ Курсы получены:', result.data);
                setRates({
                    buy: result.data.buy || 92.50,
                    sell: result.data.sell || 93.50
                });
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
            
            // Показываем пользователю, но не блокируем
            showMessage('warning', '⚠️ Используем кэшированные курсы');
        }
    };

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
    
        // ПРОСТАЯ ПРОВЕРКА
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
            setError(''); // Очищаем ошибку если поле пустое
        }
    };

    const getCurrentRateForDisplay = () => {
        return isBuyMode ? rates.buy : rates.sell;
    };

    const formatRate = (rate) => {
        return rate.toFixed(2);
    };

    // Функции для работы с реквизитами
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

    // Проверка готовности к обмену
    const isExchangeReady = () => {
        // Быстрая проверка без лишнего логирования
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

    // Функция проверки активных ордеров - ИСПРАВЛЕННАЯ
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

            // Используем нашу умную функцию fetch
            const data = await apiFetch(`/user-orders/${userId}`);

            let ordersList = [];
            if (data.orders) {
                ordersList = data.orders;
            } else if (Array.isArray(data)) {
                ordersList = data;
            }
            
            const activeOrders = ordersList.filter(order =>
                order && (order.status === 'pending' || order.status === 'paid' || order.status === 'processing')
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

    // Обработчик обмена - ФИНАЛЬНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ
    const handleExchange = async () => {
        console.log('🔄 Создание ордера...');
        
        if (!userInitialized) {
            showMessage('error', '❌ Пользователь не инициализирован');
            return;
        }

        if (!isExchangeReady()) {
            showMessage('error', '❌ Заполните все поля правильно');
            return;
        }

        try {
            const userData = JSON.parse(localStorage.getItem('currentUser'));
            const telegramUser = JSON.parse(localStorage.getItem('telegramUser') || '{}');
            
            const exchangeData = {
                type: isBuyMode ? 'buy' : 'sell',
                amount: parseFloat(amount),
                rate: rates[isBuyMode ? 'buy' : 'sell'],
                telegramId: telegramUser.id || userData.telegramId,
                username: telegramUser.username || userData.username || 'Пользователь',
                firstName: userData.firstName,
                paymentMethod: isBuyMode ? null : selectedPayment,
                cryptoAddress: isBuyMode ? selectedCryptoAddress : null
            };

            console.log('📋 Данные ордера:', exchangeData);

            // Используем нашу умную функцию fetch
            const result = await apiFetch('/create-order', {
                method: 'POST',
                body: JSON.stringify(exchangeData)
            });

            console.log('📦 Ответ сервера:', result);

            if (result.success) {
                setHasActiveOrder(true);
                setActiveOrdersCount(prev => prev + 1);
                setAmount('');
                setError('');
                
                const notificationMsg = result.notification_sent 
                    ? '✅ Ордер создан! Уведомление отправлено оператору.'
                    : '✅ Ордер создан! (Уведомление не отправлено)';
                
                showMessage('success', notificationMsg);
                
                // Обновляем список ордеров
                setTimeout(() => {
                    checkActiveOrders();
                }, 2000);

            } else {
                showMessage('error', `❌ Ошибка API: ${result.error || 'Неизвестная ошибка'}`);
            }

        } catch (error) {
            console.error('❌ Ошибка обмена:', error);
            showMessage('error', `❌ Ошибка сети: ${error.message}`);
        }
    };

    // Сохранение данных
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

    return (
        <div className="home-container">
            {/* Хедер */}
            <div className="home-header-new">
                <div className="header-content">
                    <div className="header-left">
                        <div className="header-titles">
                            <h1 className="header-title-new">TetherRabbit 🥕</h1>
                            <p className="header-subtitle"> Быстрый и безопасный обмен c нами !</p>
                        </div>
                    </div>
                    {/* Кнопка теста подключения */}
                    <button 
                        className="test-connection-btn"
                        onClick={testConnection}
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
                                    <div className="form-header-new">
                                        <h4>Добавить реквизиты</h4>
                                        <button
                                            className="close-form"
                                            onClick={() => {
                                                setShowAddPayment(false);
                                                setShowBankDropdown(false);
                                                setNewPayment({
                                                    bankName: '',
                                                    cardNumber: '',
                                                    phoneNumber: '',
                                                    cardNumberError: ''
                                                });
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <div className="form-input-group">
                                        <label className="input-label">Банк</label>
                                        <div className="bank-select-container">
                                            <div
                                                className={`bank-select ${newPayment.bankName ? 'has-value' : ''}`}
                                                onClick={() => setShowBankDropdown(!showBankDropdown)}
                                            >
                                                {newPayment.bankName || 'Выберите банк'}
                                                <span className="dropdown-arrow">▼</span>
                                            </div>

                                            {showBankDropdown && (
                                                <div className="bank-dropdown">
                                                    {availableBanks.map((bank, index) => (
                                                        <div
                                                            key={index}
                                                            className="bank-option"
                                                            onClick={() => handleBankSelect(bank)}
                                                        >
                                                            {bank}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {newPayment.bankName === 'СБП (Система быстрых платежей)' ? (
                                        <div className="form-input-group">
                                            <label className="input-label">Номер телефона для СБП</label>
                                            <input
                                                type="tel"
                                                placeholder="+7 (900) 123-45-67"
                                                value={newPayment.phoneNumber}
                                                onChange={handlePhoneNumberChange}
                                                className={`payment-input ${newPayment.cardNumberError ? 'error' : ''}`}
                                                maxLength="18"
                                            />
                                            {newPayment.cardNumberError && (
                                                <div className="input-error">{newPayment.cardNumberError}</div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="form-input-group">
                                            <label className="input-label">Номер карты</label>
                                            <input
                                                type="text"
                                                placeholder="0000 0000 0000 0000"
                                                value={newPayment.cardNumber}
                                                onChange={handleCardNumberChange}
                                                className={`payment-input ${newPayment.cardNumberError ? 'error' : ''}`}
                                                maxLength="19"
                                            />
                                            {newPayment.cardNumberError && (
                                                <div className="input-error">{newPayment.cardNumberError}</div>
                                            )}
                                        </div>
                                    )}

                                    <button
                                        className="save-payment-button"
                                        onClick={handleAddPayment}
                                        disabled={
                                            !newPayment.bankName || 
                                            (newPayment.bankName === 'СБП (Система быстрых платежей)' 
                                                ? !newPayment.phoneNumber 
                                                : !newPayment.cardNumber.replace(/\s/g, '')
                                            )
                                        }
                                    >
                                        Сохранить реквизиты
                                    </button>
                                </div>
                            )}

                            <div className="payment-methods-new">
                                {paymentMethods.length === 0 ? (
                                    <div className="no-payments-message">
                                        <div className="no-payments-icon">💳</div>
                                        <p>Добавьте банковские реквизиты для получения рублей</p>
                                    </div>
                                ) : (
                                    paymentMethods.map((payment) => (
                                        <div
                                            key={payment.id}
                                            className={`payment-method-item-new ${payment.type === 'sbp' ? 'sbp' : ''} ${selectedPayment?.id === payment.id ? 'selected' : ''}`}
                                            onClick={() => handlePaymentSelect(payment)}
                                        >
                                            <div className="payment-info">
                                                <div className="payment-header-info">
                                                    <span className="payment-name">{payment.name}</span>
                                                    {payment.type === 'sbp' && (
                                                        <span className="sbp-badge">СБП</span>
                                                    )}
                                                </div>
                                                <span className="payment-number">
                                                    {payment.type === 'sbp' ? '📱 ' + payment.number : '💳 •••• ' + payment.number}
                                                </span>
                                            </div>
                                            <button
                                                className="delete-payment"
                                                onClick={(e) => handleDeletePayment(payment.id, e)}
                                                title="Удалить реквизиты"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))
                                )}
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
                                    <div className="form-header-new">
                                        <h4>Добавить адрес USDT</h4>
                                        <button
                                            className="close-form"
                                            onClick={() => {
                                                setShowAddCrypto(false);
                                                setNewCryptoAddress({
                                                    address: '',
                                                    network: 'ERC20',
                                                    name: '',
                                                    addressError: ''
                                                });
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <div className="form-input-group">
                                        <label className="input-label">Название кошелька</label>
                                        <input
                                            type="text"
                                            placeholder="Например: Мой основной кошелек"
                                            value={newCryptoAddress.name}
                                            onChange={(e) => setNewCryptoAddress(prev => ({
                                                ...prev,
                                                name: e.target.value,
                                                addressError: ''
                                            }))}
                                            className="payment-input"
                                        />
                                    </div>

                                    <div className="form-input-group">
                                        <label className="input-label">Сеть</label>
                                        <div className="network-select-container">
                                            <select
                                                value={newCryptoAddress.network}
                                                onChange={(e) => setNewCryptoAddress(prev => ({
                                                    ...prev,
                                                    network: e.target.value,
                                                    addressError: ''
                                                }))}
                                                className="network-select"
                                            >
                                                {availableNetworks.map(network => (
                                                    <option key={network.value} value={network.value}>
                                                        {network.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-input-group">
                                        <label className="input-label">Адрес кошелька {newCryptoAddress.network}</label>
                                        <input
                                            type="text"
                                            placeholder={`Введите адрес кошелька ${newCryptoAddress.network}`}
                                            value={newCryptoAddress.address}
                                            onChange={(e) => setNewCryptoAddress(prev => ({
                                                ...prev,
                                                address: e.target.value,
                                                addressError: ''
                                            }))}
                                            className={`payment-input ${newCryptoAddress.addressError ? 'error' : ''}`}
                                        />
                                        {newCryptoAddress.addressError && (
                                            <div className="input-error">{newCryptoAddress.addressError}</div>
                                        )}
                                    </div>

                                    <button
                                        className="save-payment-button"
                                        onClick={handleAddCryptoAddress}
                                        disabled={!newCryptoAddress.address || !newCryptoAddress.name}
                                    >
                                        Сохранить адрес
                                    </button>
                                </div>
                            )}

                            <div className="payment-methods-new">
                                {cryptoAddresses.length === 0 ? (
                                    <div className="no-payments-message">
                                        <div className="no-payments-icon">₿</div>
                                        <p>Добавьте адрес кошелька для получения USDT</p>
                                    </div>
                                ) : (
                                    cryptoAddresses.map((address) => {
                                        const networkInfo = availableNetworks.find(net => net.value === address.network);
                                        return (
                                            <div
                                                key={address.id}
                                                className={`payment-method-item-new ${selectedCryptoAddress?.id === address.id ? 'selected' : ''}`}
                                                onClick={() => handleCryptoAddressSelect(address)}
                                            >
                                                <div className="payment-info">
                                                    <div className="crypto-header">
                                                        <span className="payment-name">{address.name}</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <span>{networkInfo?.icon}</span>
                                                            <span className="crypto-network">{address.network}</span>
                                                        </div>
                                                    </div>
                                                    <div className="crypto-address">
                                                        {address.address.slice(0, 8)}...{address.address.slice(-8)}
                                                        <button
                                                            className="copy-address"
                                                            onClick={(e) => copyToClipboard(address.address, e)}
                                                            title="Скопировать адрес"
                                                        >
                                                            📋
                                                        </button>
                                                    </div>
                                                </div>
                                                <button
                                                    className="delete-payment"
                                                    onClick={(e) => handleDeleteCryptoAddress(address.id, e)}
                                                    title="Удалить адрес"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
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