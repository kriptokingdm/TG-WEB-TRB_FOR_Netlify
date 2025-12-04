import React from "react";
import { useState, useEffect } from 'react';
import './Home.css';
import SupportChat from './SupportChat';

// Используем HTTPS
const serverUrl = 'https://87.242.106.114.sslip.io';

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

    // Проверяем активные ордеры после инициализации пользователя
    useEffect(() => {
        if (userInitialized) {
            checkActiveOrders();
        }
    }, [userInitialized]);

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
                console.log('✅ Реквизиты загружены');
            }

            const savedCryptoAddresses = localStorage.getItem('userCryptoAddresses');
            if (savedCryptoAddresses) {
                setCryptoAddresses(JSON.parse(savedCryptoAddresses));
                console.log('✅ Адреса загружены');
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
        
        // Проверяем Telegram WebApp
        if (window.Telegram?.WebApp) {
            console.log('🤖 Telegram WebApp доступен');
            const tg = window.Telegram.WebApp;
            
            tg.ready();
            tg.expand();
            
            // Пробуем получить пользователя
            const telegramUser = tg.initDataUnsafe?.user;
            if (telegramUser) {
                console.log('✅ Telegram пользователь найден:', telegramUser);
                saveUserData(telegramUser);
                return;
            }
            
            console.log('⚠️ Telegram пользователь не найден в initDataUnsafe');
        }
        
        // Проверяем сохраненные данные
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                console.log('✅ Пользователь из localStorage:', userData);
                setUserInitialized(true);
                return;
            } catch (e) {
                console.error('❌ Ошибка парсинга localStorage:', e);
            }
        }
        
        // Создаем тестового пользователя
        console.log('⚠️ Создаем тестового пользователя');
        const testUser = {
            id: 7879866656,
            username: 'TERBCEO',
            first_name: 'G',
            last_name: ''
        };
        saveUserData(testUser);
    };

    // Сохранение данных пользователя
    const saveUserData = (telegramUser) => {
        console.log('💾 Сохранение пользователя:', telegramUser);
        
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
        
        console.log('✅ Данные пользователя сохранены:', appUser);
        setUserInitialized(true);
    };

    // Функция проверки активных ордеров
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

            const response = await fetch(`${serverUrl}/api/user-orders/${userId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('📦 Данные ордеров:', data);
                
                // Проверяем разные форматы ответа
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
            } else {
                console.log('ℹ️ Нет активных ордеров или ошибка сервера:', response.status);
                setHasActiveOrder(false);
                setActiveOrdersCount(0);
            }
        } catch (error) {
            console.log('⚠️ Ошибка проверки активных ордеров (может быть CORS или сеть):', error.message);
            // Не блокируем пользователя при ошибке сети
            setHasActiveOrder(false);
        }
    };

    // Загрузка курсов с бекенда
    const fetchExchangeRates = async () => {
        try {
            let requestAmount = amount ? parseFloat(amount) : 100;
            if (requestAmount < MIN_USDT) requestAmount = MIN_USDT;
            
            const type = isBuyMode ? 'buy' : 'sell';
            const url = `${serverUrl}/api/exchange-rate?amount=${requestAmount}&type=${type}`;
            console.log('📡 Запрашиваем курсы по URL:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Курсы получены:', data);
                setBuyRate(data.buy || 85.6);
                setSellRate(data.sell || 81.6);
                setCurrentTier(data.tier || 'standard');
            } else {
                console.log('⚠️ Используем фиктивные курсы');
                setBuyRate(85.6);
                setSellRate(81.6);
                setCurrentTier('standard');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки курсов, используем фиктивные:', error.message);
            setBuyRate(85.6);
            setSellRate(81.6);
            setCurrentTier('standard');
        }
    };

    // Эффект для загрузки курсов при изменении суммы
    useEffect(() => {
        if (amount) {
            fetchExchangeRates();
        }
    }, [amount]);

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
        
        // Форматируем как 0000 0000 0000 0000
        let formatted = '';
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) {
                formatted += ' ';
            }
            formatted += value[i];
        }

        // Валидация номера карты
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
        
        // Форматируем как +7 (XXX) XXX-XX-XX
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

        // Валидация номера телефона
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
        // Определяем тип реквизитов
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
        
        // Сбрасываем форму
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
        // Простая валидация адреса
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
        
        // Сбрасываем форму
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
        if (!userInitialized) {
            console.log('⚠️ Пользователь не инициализирован');
            return false;
        }
        
        if (!amount || error) {
            console.log('⚠️ Неверная сумма или ошибка');
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

    // Обработчик обмена
    const handleExchange = async () => {
        console.log('🔄 Начало создания заявки');
        
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
            
            console.log('👤 Данные для заявки:', { userData, telegramUser });
            
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

            const response = await fetch(`${serverUrl}/api/create-order`, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(exchangeData)
            });

            console.log('📡 Ответ сервера:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('📦 Данные ответа:', result);

                if (result.success) {
                    console.log('✅ Заявка создана:', result.order);

                    setHasActiveOrder(true);
                    setActiveOrdersCount(prev => prev + 1);

                    setCurrentOrderId(result.order.id);
                    setCurrentExchangeData({
                        type: exchangeData.type,
                        amount: exchangeData.amount,
                        rate: exchangeData.rate,
                        convertedAmount: calculateConvertedAmount()
                    });

                    setShowSupportChat(true);
                    
                    showMessage('success', '✅ Заявка создана! Уведомления отправлены в Telegram.');
                    
                } else {
                    console.error('❌ Ошибка при создании заявки:', result.error);
                    showMessage('error', `❌ Ошибка: ${result.error || 'Неизвестная ошибка'}`);
                }
            } else {
                const errorText = await response.text();
                console.error('❌ Ошибка HTTP:', response.status, errorText);
                showMessage('error', `❌ Ошибка сервера: ${response.status}`);
            }

        } catch (error) {
            console.error('❌ Ошибка обмена:', error);
            showMessage('error', '❌ Ошибка при выполнении обмена. Проверьте подключение к серверу.');
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
                            <h1 className="header-title-new">Обмен валют</h1>
                            <p className="header-subtitle">Быстрый и безопасный обмен RUB/USDT</p>
                        </div>
                    </div>
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
                                onClick={() => navigateTo('/history')}
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
                            <span className="mode-simple-text">USDT → RUB</span>
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
                            <span className="mode-simple-text">RUB → USDT</span>
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

                        {/* Информация о курсе */}
                        <div className="rate-info">
                            <div className="rate-info-item">
                                <span className="rate-label">Курс:</span>
                                <span className="rate-value">{formatRate(getCurrentRateForDisplay())} ₽</span>
                            </div>
                            <div className="rate-info-item">
                                <span className="rate-label">Тип:</span>
                                <span className="rate-value">{currentTier || 'Стандарт'}</span>
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
                        <strong>Безопасная сделка:</strong> Все транзакции защищены системой гаранта. 
                        Средства замораживаются до подтверждения получения.
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
                    <span className="nav-icon-svg">
                        <svg width="101" height="53" viewBox="0 0 101 53" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M37.25 18C37.25 10.8203 43.0703 5 50.25 5C57.4297 5 63.25 10.8203 63.25 18C63.25 25.1797 57.4297 31 50.25 31C43.0703 31 37.25 25.1797 37.25 18ZM48.2451 10.9443C48.552 11.2512 48.552 11.7488 48.2451 12.0557L46.6322 13.6686H55.3712C55.8052 13.6686 56.1571 14.0205 56.1571 14.4545C56.1571 14.8886 55.8052 15.2405 55.3712 15.2405H46.6322L48.2451 16.8534C48.552 17.1603 48.552 17.6579 48.2451 17.9648C47.9382 18.2717 47.4406 18.2717 47.1336 17.9648L44.1791 15.0103C44.0317 14.8629 43.9489 14.663 43.9489 14.4545C43.9489 14.2461 44.0317 14.0462 44.1791 13.8988L47.1336 10.9443C47.4406 10.6374 47.9382 10.6374 48.2451 10.9443ZM52.4479 19.1466C52.141 18.8397 52.141 18.3421 52.4479 18.0352C52.7548 17.7283 53.2524 17.7283 53.5594 18.0352L56.5139 20.9897C56.6613 21.1371 56.7441 21.337 56.7441 21.5455C56.7441 21.7539 56.6613 21.9538 56.5139 22.1012L53.5594 25.0557C53.2524 25.3626 52.7548 25.3626 52.4479 25.0557C52.141 24.7488 52.141 24.2512 52.4479 23.9443L54.0608 22.3314H45.3218C44.8878 22.3314 44.5359 21.9795 44.5359 21.5455C44.5359 21.1114 44.8878 20.7595 45.3218 20.7595H54.0608L52.4479 19.1466Z" fill="#007CFF"/>
                            <path d="M36.6305 37.1206C38.8595 37.1206 40.2613 38.6621 40.2613 41.1274C40.2613 43.5928 38.8595 45.1289 36.6305 45.1289C34.3961 45.1289 32.9996 43.5928 32.9996 41.1274C32.9996 38.6621 34.3961 37.1206 36.6305 37.1206ZM36.6305 38.1787C35.1588 38.1787 34.2296 39.3174 34.2296 41.1274C34.2296 42.9321 35.1588 44.0708 36.6305 44.0708C38.1021 44.0708 39.026 42.9321 39.026 41.1274C39.026 39.3174 38.1021 38.1787 36.6305 38.1787ZM44.1922 45.1074C42.4251 45.1074 41.469 43.9526 41.469 41.7183C41.469 38.5815 42.3821 37.3086 44.5306 37.2334L45.0354 37.2173C45.6424 37.1904 46.2547 37.0776 46.5125 36.938V37.8994C46.3675 38.0337 45.7928 38.1733 45.0999 38.2002L44.6058 38.2163C43.0965 38.27 42.6185 38.9468 42.409 40.542H42.452C42.8118 39.876 43.4939 39.5107 44.3802 39.5107C45.9056 39.5107 46.8831 40.5742 46.8831 42.2393C46.8831 44.0171 45.8572 45.1074 44.1922 45.1074ZM44.1814 44.1353C45.1375 44.1353 45.6961 43.4585 45.6961 42.2554C45.6961 41.1113 45.1375 40.4561 44.1814 40.4561C43.22 40.4561 42.6561 41.1113 42.6561 42.2554C42.6561 43.4585 43.2146 44.1353 44.1814 44.1353ZM49.2993 45H48.1821V39.3496H49.6377L51.4478 43.4907H51.4907L53.3115 39.3496H54.7349V45H53.6069V41.0791H53.5693L51.8774 44.7798H51.0288L49.3369 41.0791H49.2993V45ZM58.6496 40.1821C57.8386 40.1821 57.2692 40.7998 57.2102 41.6538H60.0354C60.0085 40.7891 59.4606 40.1821 58.6496 40.1821ZM60.03 43.3403H61.1311C60.9699 44.3716 59.9924 45.1074 58.6979 45.1074C57.0383 45.1074 56.0339 43.9849 56.0339 42.2017C56.0339 40.4292 57.0544 39.2476 58.6496 39.2476C60.218 39.2476 61.1955 40.354 61.1955 42.0674V42.4648H57.2048V42.5347C57.2048 43.5176 57.7956 44.1675 58.7248 44.1675C59.3854 44.1675 59.8742 43.8345 60.03 43.3403ZM66.2006 45V42.54H63.6439V45H62.4892V39.3496H63.6439V41.627H66.2006V39.3496H67.3554V45H66.2006Z" fill="#007CFF"/>
                        </svg>
                    </span>
                    <span className="nav-label">Обмен</span>
                </button>
                
                <button className="nav-item" onClick={() => navigateTo('/profile')}>
                    <span className="nav-icon-svg">
                        <svg width="101" height="53" viewBox="0 0 101 53" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M37.25 18C37.25 10.8203 43.0703 5 50.25 5C57.4297 5 63.25 10.8203 63.25 18C63.25 25.1797 57.4297 31 50.25 31C43.0703 31 37.25 25.1797 37.25 18ZM48.2451 10.9443C48.552 11.2512 48.552 11.7488 48.2451 12.0557L46.6322 13.6686H55.3712C55.8052 13.6686 56.1571 14.0205 56.1571 14.4545C56.1571 14.8886 55.8052 15.2405 55.3712 15.2405H46.6322L48.2451 16.8534C48.552 17.1603 48.552 17.6579 48.2451 17.9648C47.9382 18.2717 47.4406 18.2717 47.1336 17.9648L44.1791 15.0103C44.0317 14.8629 43.9489 14.663 43.9489 14.4545C43.9489 14.2461 44.0317 14.0462 44.1791 13.8988L47.1336 10.9443C47.4406 10.6374 47.9382 10.6374 48.2451 10.9443ZM52.4479 19.1466C52.141 18.8397 52.141 18.3421 52.4479 18.0352C52.7548 17.7283 53.2524 17.7283 53.5594 18.0352L56.5139 20.9897C56.6613 21.1371 56.7441 21.337 56.7441 21.5455C56.7441 21.7539 56.6613 21.9538 56.5139 22.1012L53.5594 25.0557C53.2524 25.3626 52.7548 25.3626 52.4479 25.0557C52.141 24.7488 52.141 24.2512 52.4479 23.9443L54.0608 22.3314H45.3218C44.8878 22.3314 44.5359 21.9795 44.5359 21.5455C44.5359 21.1114 44.8878 20.7595 45.3218 20.7595H54.0608L52.4479 19.1466Z" fill="#64748b"/>
                            <path d="M36.6305 37.1206C38.8595 37.1206 40.2613 38.6621 40.2613 41.1274C40.2613 43.5928 38.8595 45.1289 36.6305 45.1289C34.3961 45.1289 32.9996 43.5928 32.9996 41.1274C32.9996 38.6621 34.3961 37.1206 36.6305 37.1206ZM36.6305 38.1787C35.1588 38.1787 34.2296 39.3174 34.2296 41.1274C34.2296 42.9321 35.1588 44.0708 36.6305 44.0708C38.1021 44.0708 39.026 42.9321 39.026 41.1274C39.026 39.3174 38.1021 38.1787 36.6305 38.1787ZM44.1922 45.1074C42.4251 45.1074 41.469 43.9526 41.469 41.7183C41.469 38.5815 42.3821 37.3086 44.5306 37.2334L45.0354 37.2173C45.6424 37.1904 46.2547 37.0776 46.5125 36.938V37.8994C46.3675 38.0337 45.7928 38.1733 45.0999 38.2002L44.6058 38.2163C43.0965 38.27 42.6185 38.9468 42.409 40.542H42.452C42.8118 39.876 43.4939 39.5107 44.3802 39.5107C45.9056 39.5107 46.8831 40.5742 46.8831 42.2393C46.8831 44.0171 45.8572 45.1074 44.1922 45.1074ZM44.1814 44.1353C45.1375 44.1353 45.6961 43.4585 45.6961 42.2554C45.6961 41.1113 45.1375 40.4561 44.1814 40.4561C43.22 40.4561 42.6561 41.1113 42.6561 42.2554C42.6561 43.4585 43.2146 44.1353 44.1814 44.1353ZM49.2993 45H48.1821V39.3496H49.6377L51.4478 43.4907H51.4907L53.3115 39.3496H54.7349V45H53.6069V41.0791H53.5693L51.8774 44.7798H51.0288L49.3369 41.0791H49.2993V45ZM58.6496 40.1821C57.8386 40.1821 57.2692 40.7998 57.2102 41.6538H60.0354C60.0085 40.7891 59.4606 40.1821 58.6496 40.1821ZM60.03 43.3403H61.1311C60.9699 44.3716 59.9924 45.1074 58.6979 45.1074C57.0383 45.1074 56.0339 43.9849 56.0339 42.2017C56.0339 40.4292 57.0544 39.2476 58.6496 39.2476C60.218 39.2476 61.1955 40.354 61.1955 42.0674V42.4648H57.2048V42.5347C57.2048 43.5176 57.7956 44.1675 58.7248 44.1675C59.3854 44.1675 59.8742 43.8345 60.03 43.3403ZM66.2006 45V42.54H63.6439V45H62.4892V39.3496H63.6439V41.627H66.2006V39.3496H67.3554V45H66.2006Z" fill="#64748b"/>
                        </svg>
                    </span>
                    <span className="nav-label">Профиль</span>
                </button>

                <button className="nav-item" onClick={() => navigateTo('/history')}>
                    <span className="nav-icon-svg">
                        <svg width="101" height="53" viewBox="0 0 101 53" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M50.25 31C57.4297 31 63.25 25.1797 63.25 18C63.25 10.8203 57.4297 5 50.25 5C43.0703 5 37.25 10.8203 37.25 18C37.25 25.1797 43.0703 31 50.25 31ZM51.1955 9.72727C51.1955 9.20511 50.7722 8.78182 50.25 8.78182C49.7278 8.78182 49.3045 9.20511 49.3045 9.72727V18.2364H43.1591C42.6369 18.2364 42.2136 18.6597 42.2136 19.1818C42.2136 19.704 42.6369 20.1273 43.1591 20.1273H50.25C50.7722 20.1273 51.1955 19.704 51.1955 19.1818V9.72727Z" fill="#64748b"/>
                            <path d="M33.9188 45V39.167H33.8383L29.8905 45H28.7196V37.2495H29.912V43.0986H29.9926L33.9403 37.2495H35.1112V45H33.9188ZM41.6256 41.1597H40.5084C40.358 40.6387 39.9283 40.2144 39.2086 40.2144C38.3116 40.2144 37.7262 40.9824 37.7262 42.1748C37.7262 43.3994 38.317 44.1353 39.2193 44.1353C39.9068 44.1353 40.358 43.7915 40.5191 43.2007H41.6363C41.4698 44.334 40.5406 45.1074 39.2086 45.1074C37.5919 45.1074 36.5499 43.9849 36.5499 42.1748C36.5499 40.4023 37.5919 39.2476 39.1979 39.2476C40.5943 39.2476 41.4645 40.1177 41.6256 41.1597ZM47.0496 39.3496V40.2681H45.2771V45H44.1224V40.2681H42.3499V39.3496H47.0496ZM50.5239 45.1074C48.9072 45.1074 47.8438 43.9956 47.8438 42.1748C47.8438 40.3594 48.9126 39.2476 50.5239 39.2476C52.1353 39.2476 53.2041 40.3594 53.2041 42.1748C53.2041 43.9956 52.1406 45.1074 50.5239 45.1074ZM50.5239 44.1514C51.437 44.1514 52.0225 43.4316 52.0225 42.1748C52.0225 40.9233 51.4316 40.2036 50.5239 40.2036C49.6162 40.2036 49.0254 40.9233 49.0254 42.1748C49.0254 43.4316 49.6162 44.1514 50.5239 44.1514ZM57.4519 39.2583C58.8859 39.2583 59.8313 40.3862 59.8313 42.1748C59.8313 43.9634 58.8913 45.0967 57.4733 45.0967C56.6623 45.0967 56.0178 44.6992 55.6955 44.0708H55.6687V46.8691H54.5085V39.3496H55.6311V40.3218H55.6525C55.9855 39.6719 56.6355 39.2583 57.4519 39.2583ZM57.1457 44.1138C58.0642 44.1138 58.6389 43.3618 58.6389 42.1748C58.6389 40.9932 58.0642 40.2358 57.1457 40.2358C56.2595 40.2358 55.6633 41.0093 55.6633 42.1748C55.6633 43.3511 56.2541 44.1138 57.1457 44.1138ZM62.2743 45H61.1303V39.3496H62.2743V43.3081H62.3173L64.9276 39.3496H66.0717V45H64.9276V41.0308H64.8847L62.2743 45ZM69.7608 42.1694H70.7867V40.2627H69.7608C69.1002 40.2627 68.6759 40.6387 68.6759 41.251C68.6759 41.7881 69.1056 42.1694 69.7608 42.1694ZM70.7867 45V43.061H69.9273L68.5577 45H67.2472L68.7887 42.8623C68.0045 42.6313 67.5211 42.0459 67.5211 41.2563C67.5211 40.0801 68.3805 39.3496 69.7018 39.3496H71.9254V45H70.7867Z" fill="#64748b"/>
                        </svg>
                    </span>
                    <span className="nav-label">История</span>
                </button>
               
                <button className="nav-item" onClick={() => navigateTo('/help')}>
                    <span className="nav-icon-svg">
                        <svg width="101" height="53" viewBox="0 0 101 53" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M37.25 18C37.25 10.8203 43.0703 5 50.25 5C57.4297 5 63.25 10.8203 63.25 18C63.25 25.1797 57.4297 31 50.25 31C43.0703 31 37.25 25.1797 37.25 18ZM45.9167 18C45.9167 19.0833 44.8333 20.1667 43.75 20.1667C42.6667 20.1667 41.5833 19.0833 41.5833 18C41.5833 16.9167 42.6667 15.8333 43.75 15.8333C44.8333 15.8333 45.9167 16.9167 45.9167 18ZM52.4167 18C52.4167 19.0833 51.3333 20.1667 50.25 20.1667C49.1667 20.1667 48.0833 19.0833 48.0833 18C48.0833 16.9167 49.1667 15.8333 50.25 15.8333C51.3333 15.8333 52.4167 16.9167 52.4167 18ZM56.75 20.1667C57.8333 20.1667 58.9167 19.0833 58.9167 18C58.9167 16.9167 57.8333 15.8333 56.75 15.8333C55.6667 15.8333 54.5833 16.9167 54.5833 18C54.5833 19.0833 55.6667 20.1667 56.75 20.1667Z" fill="#64748b"/>
                            <path d="M31.9691 45.145C29.7938 45.145 28.4188 43.5928 28.4188 41.1221C28.4188 38.6675 29.8046 37.1045 31.9691 37.1045C33.6771 37.1045 34.9823 38.1411 35.2401 39.688H34.0316C33.7792 38.7695 32.9735 38.1733 31.9691 38.1733C30.5619 38.1733 29.6488 39.3281 29.6488 41.1221C29.6488 42.9321 30.5512 44.0762 31.9745 44.0762C33.0111 44.0762 33.7577 43.5713 34.0316 42.7065H35.2401C34.9071 44.2427 33.7094 45.145 31.9691 45.145ZM40.256 45V40.2681H37.753V45H36.5982V39.3496H41.4161V45H40.256ZM45.9163 39.2583C47.3504 39.2583 48.2957 40.3862 48.2957 42.1748C48.2957 43.9634 47.3558 45.0967 45.9378 45.0967C45.1268 45.0967 44.4822 44.6992 44.16 44.0708H44.1331V46.8691H42.9729V39.3496H44.0955V40.3218H44.117C44.45 39.6719 45.0999 39.2583 45.9163 39.2583ZM45.6102 44.1138C46.5286 44.1138 47.1033 43.3618 47.1033 42.1748C47.1033 40.9932 46.5286 40.2358 45.6102 40.2358C44.7239 40.2358 44.1277 41.0093 44.1277 42.1748C44.1277 43.3511 44.7186 44.1138 45.6102 44.1138ZM51.5767 44.1782C52.3877 44.1782 53.0215 43.6196 53.0215 42.8838V42.438L51.6304 42.5239C50.9375 42.5723 50.5454 42.8784 50.5454 43.3618C50.5454 43.856 50.9536 44.1782 51.5767 44.1782ZM51.2544 45.0967C50.1479 45.0967 49.3745 44.4092 49.3745 43.394C49.3745 42.4058 50.1318 41.7988 51.4746 41.7236L53.0215 41.6323V41.1973C53.0215 40.5688 52.5972 40.1929 51.8882 40.1929C51.2168 40.1929 50.7979 40.5151 50.6958 41.02H49.6001C49.6646 39.9995 50.5347 39.2476 51.9312 39.2476C53.3008 39.2476 54.1763 39.9727 54.1763 41.106V45H53.0645V44.0708H53.0376C52.71 44.6992 51.9956 45.0967 51.2544 45.0967ZM58.0266 40.1929H56.8396V41.6753H57.9138C58.569 41.6753 58.8967 41.4229 58.8967 40.9233C58.8967 40.4561 58.5905 40.1929 58.0266 40.1929ZM57.989 42.4863H56.8396V44.1567H58.1179C58.7731 44.1567 59.1276 43.8667 59.1276 43.3242C59.1276 42.7656 58.7517 42.4863 57.989 42.4863ZM55.6955 45V39.3496H58.2629C59.364 39.3496 60.03 39.8975 60.03 40.7891C60.03 41.3745 59.611 41.9062 59.0686 42.0083V42.0513C59.799 42.1479 60.2824 42.6636 60.2824 43.3726C60.2824 44.3662 59.5197 45 58.2951 45H55.6955ZM63.9071 42.0029L66.5067 45H65.0512L62.8114 42.395H62.7685V45H61.6137V39.3496H62.7685V41.7666H62.8114L65.0243 39.3496H66.4101L63.9071 42.0029ZM69.3741 44.1782C70.1852 44.1782 70.8189 43.6196 70.8189 42.8838V42.438L69.4278 42.5239C68.735 42.5723 68.3429 42.8784 68.3429 43.3618C68.3429 43.856 68.7511 44.1782 69.3741 44.1782ZM69.0519 45.0967C67.9454 45.0967 67.172 44.4092 67.172 43.394C67.172 42.4058 67.9293 41.7988 69.2721 41.7236L70.8189 41.6323V41.1973C70.8189 40.5688 70.3946 40.1929 69.6856 40.1929C69.0143 40.1929 68.5953 40.5151 68.4933 41.02H67.3976C67.462 39.9995 68.3321 39.2476 69.7286 39.2476C71.0982 39.2476 71.9737 39.9727 71.9737 41.106V45H70.8619V44.0708H70.8351C70.5074 44.6992 69.7931 45.0967 69.0519 45.0967Z" fill="#64748b"/>
                        </svg>
                    </span>
                    <span className="nav-label">Справка</span>
                </button>
            </div>
        </div>
    );
}

export default Home;