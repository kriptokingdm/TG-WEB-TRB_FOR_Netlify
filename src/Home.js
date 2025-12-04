import React from "react";
import { useState, useEffect, useRef } from 'react';
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
    
    // Анимация переключения
    const [swapAnimation, setSwapAnimation] = useState(false);
    const [isSwapDisabled, setIsSwapDisabled] = useState(false);
    const [glowEffect, setGlowEffect] = useState(false);
    const [particles, setParticles] = useState([]);

    // Состояния для чата
    const [showSupportChat, setShowSupportChat] = useState(false);
    const [currentOrderId, setCurrentOrderId] = useState(null);
    const [currentExchangeData, setCurrentExchangeData] = useState(null);

    // Состояния для активных ордеров
    const [hasActiveOrder, setHasActiveOrder] = useState(false);
    const [activeOrdersCount, setActiveOrdersCount] = useState(0);

    // Рефы для анимаций
    const swapButtonRef = useRef(null);
    const amountInputRef = useRef(null);
    const modeSwitcherRef = useRef(null);

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

    // Эффект частиц для анимации
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (Math.random() > 0.7) {
                const newParticle = {
                    x: e.clientX,
                    y: e.clientY,
                    id: Date.now(),
                    color: isBuyMode ? '#00ffaa' : '#ff6b9d'
                };
                setParticles(prev => [...prev.slice(-20), newParticle]);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isBuyMode]);

    // Эффект для очистки частиц
    useEffect(() => {
        const interval = setInterval(() => {
            if (particles.length > 0) {
                setParticles(prev => prev.slice(1));
            }
        }, 100);
        return () => clearInterval(interval);
    }, [particles.length]);

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
        
        if (window.Telegram?.WebApp) {
            console.log('🤖 Telegram WebApp доступен');
            const tg = window.Telegram.WebApp;
            
            tg.ready();
            tg.expand();
            
            const telegramUser = tg.initDataUnsafe?.user;
            if (telegramUser) {
                console.log('✅ Telegram пользователь найден:', telegramUser);
                saveUserData(telegramUser);
                return;
            }
            
            console.log('⚠️ Telegram пользователь не найден в initDataUnsafe');
        }
        
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
        
        localStorage.setItem('telegramUser', JSON.stringify(telegramUser));
        
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

    // Анимация свапа с кд 2 секунды
    const handleSwap = () => {
        if (isSwapDisabled) return;
        
        // Активируем анимацию
        setSwapAnimation(true);
        setIsSwapDisabled(true);
        setGlowEffect(true);
        
        // Создаем эффект частиц
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const newParticle = {
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 2,
                    id: Date.now() + i,
                    color: isBuyMode ? '#ff6b9d' : '#00ffaa'
                };
                setParticles(prev => [...prev, newParticle]);
            }, i * 50);
        }
        
        // Изменяем состояние с задержкой
        setTimeout(() => {
            setIsSwapped(!isSwapped);
            setIsBuyMode(!isBuyMode);
            setAmount('');
            setError('');
            fetchExchangeRates();
            setGlowEffect(false);
        }, 300);
        
        // Сбрасываем анимацию
        setTimeout(() => {
            setSwapAnimation(false);
        }, 600);
        
        // Снимаем блокировку через 2 секунды
        setTimeout(() => {
            setIsSwapDisabled(false);
        }, 2000);
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
    };

    const handleCryptoAddressSelect = (address) => {
        setSelectedCryptoAddress(address);
    };

    const copyToClipboard = (text, e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text).then(() => {
            alert('Адрес скопирован в буфер обмена!');
        }).catch(err => {
            console.error('Ошибка копирования:', err);
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
            alert('❌ Пользователь не инициализирован');
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
                    
                    alert('✅ Заявка создана успешно! Уведомления отправлены в Telegram.');
                    
                } else {
                    console.error('❌ Ошибка при создании заявки:', result.error);
                    alert(`❌ Ошибка при создании заявки: ${result.error || 'Неизвестная ошибка'}`);
                }
            } else {
                const errorText = await response.text();
                console.error('❌ Ошибка HTTP:', response.status, errorText);
                alert(`❌ Ошибка сервера: ${response.status}`);
            }

        } catch (error) {
            console.error('❌ Ошибка обмена:', error);
            alert('❌ Ошибка при выполнении обмена. Проверьте подключение к серверу.');
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
            {/* Частицы анимации */}
            {particles.map(particle => (
                <div
                    key={particle.id}
                    className="particle"
                    style={{
                        left: particle.x,
                        top: particle.y,
                        backgroundColor: particle.color
                    }}
                />
            ))}

            {/* Анимированный бэкграунд */}
            <div className={`gradient-bg ${isBuyMode ? 'buy-mode' : 'sell-mode'}`}></div>
            
            {/* Анимированные орбиты */}
            <div className="orbit orbit-1"></div>
            <div className="orbit orbit-2"></div>
            <div className="orbit orbit-3"></div>

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

            {/* Хедер с анимацией */}
            <div className="app-header">
                <div className="logo-container">
                    <div className="logo-icon">₿</div>
                    <div className="logo-text">
                        <h1>CryptoExchange</h1>
                        <p>Мгновенный обмен криптовалют</p>
                    </div>
                </div>
                <div className="user-status">
                    <button className="notification-btn">
                        🔔 <span className="notification-count">2</span>
                    </button>
                    <div className="user-balance">
                        <span className="balance-label">Баланс:</span>
                        <span className="balance-amount">15,450 ₽</span>
                    </div>
                </div>
            </div>

            {/* Карточка с курсами */}
            <div className="rates-card">
                <div className="rates-header">
                    <span className="rates-title">Текущий курс</span>
                    <div className="rate-badge">
                        <span className="rate-trend">📈</span>
                        <span className="rate-change">+0.5%</span>
                    </div>
                </div>
                <div className="rates-grid">
                    <div className="rate-item">
                        <div className="rate-label">Покупка USDT</div>
                        <div className="rate-value">{buyRate.toFixed(2)} ₽</div>
                    </div>
                    <div className="rate-divider"></div>
                    <div className="rate-item">
                        <div className="rate-label">Продажа USDT</div>
                        <div className="rate-value">{sellRate.toFixed(2)} ₽</div>
                    </div>
                </div>
            </div>

            {/* Переключатель режимов */}
            <div className="mode-switcher-wrapper" ref={modeSwitcherRef}>
                <div className="mode-switcher-3d">
                    <button
                        className={`mode-button-3d buy ${isBuyMode ? 'active' : ''}`}
                        onClick={() => {
                            if (isBuyMode) return;
                            setIsBuyMode(true);
                            setAmount('');
                            setError('');
                            fetchExchangeRates();
                        }}
                    >
                        <div className="button-content">
                            <span className="mode-icon">🛒</span>
                            <span className="mode-text">Купить USDT</span>
                        </div>
                        <div className="button-glow"></div>
                    </button>
                    <button
                        className={`mode-button-3d sell ${!isBuyMode ? 'active' : ''}`}
                        onClick={() => {
                            if (!isBuyMode) return;
                            setIsBuyMode(false);
                            setAmount('');
                            setError('');
                            fetchExchangeRates();
                        }}
                    >
                        <div className="button-content">
                            <span className="mode-icon">💰</span>
                            <span className="mode-text">Продать USDT</span>
                        </div>
                        <div className="button-glow"></div>
                    </button>
                </div>
            </div>

            <div className={hasActiveOrder ? 'form-disabled' : ''}>
                {/* Карточки валют с улучшенным дизайном */}
                <div className="currency-cards-enhanced">
                    <div className={`currency-card-3d left-card ${isBuyMode ? 'buy-glow' : 'sell-glow'}`}>
                        <div className="currency-header">
                            <span className="currency-icon">{isBuyMode ? "💳" : "₿"}</span>
                            <span className="currency-label">Вы отдаете</span>
                        </div>
                        <div className="currency-amount">
                            <input
                                type="number"
                                placeholder="0"
                                value={amount}
                                onChange={handleAmountChange}
                                className="amount-input-enhanced"
                                disabled={!userInitialized}
                                ref={amountInputRef}
                            />
                            <span className="currency-code">
                                {isBuyMode ? "RUB" : "USDT"}
                            </span>
                        </div>
                        <div className="currency-details">
                            <span className="currency-rate-enhanced">
                                {formatRate(getCurrentRateForDisplay())} ₽
                            </span>
                            <div className="min-limit">
                                Лимит: {isBuyMode 
                                    ? `${MIN_RUB.toLocaleString()} RUB`
                                    : `${MIN_USDT} USDT`
                                }
                            </div>
                        </div>
                        {error && <div className="error-message-enhanced">{error}</div>}
                    </div>

                    {/* Кнопка свапа с анимацией */}
                    <div className="swap-center-wrapper">
                        <button
                            ref={swapButtonRef}
                            className={`swap-center-enhanced ${swapAnimation ? 'rotating' : ''} ${isSwapDisabled ? 'disabled' : ''} ${glowEffect ? 'glowing' : ''}`}
                            onClick={handleSwap}
                            disabled={isSwapDisabled}
                        >
                            <div className="swap-inner">
                                <div className="swap-icon">🔄</div>
                                <div className="swap-rings">
                                    <div className="ring ring-1"></div>
                                    <div className="ring ring-2"></div>
                                    <div className="ring ring-3"></div>
                                </div>
                            </div>
                            {isSwapDisabled && (
                                <div className="swap-cooldown">
                                    <div className="cooldown-text">{Math.ceil(2000/1000)}с</div>
                                </div>
                            )}
                        </button>
                    </div>

                    <div className={`currency-card-3d right-card ${isBuyMode ? 'buy-glow' : 'sell-glow'}`}>
                        <div className="currency-header">
                            <span className="currency-icon">{isBuyMode ? "₿" : "💳"}</span>
                            <span className="currency-label">Вы получаете</span>
                        </div>
                        <div className="currency-amount">
                            <div className="converted-amount">
                                {convertedAmount || '0'}
                            </div>
                            <span className="currency-code">
                                {isBuyMode ? "USDT" : "RUB"}
                            </span>
                        </div>
                        <div className="currency-details">
                            <span className="total-label">Итого к получению</span>
                            <div className="total-amount">
                                {convertedAmount || '0'} {isBuyMode ? 'USDT' : 'RUB'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Детали обмена */}
                <div className="exchange-details">
                    <div className="detail-item">
                        <span className="detail-label">Комиссия</span>
                        <span className="detail-value">0%</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Скорость обработки</span>
                        <span className="detail-value">5-15 минут</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Резервы</span>
                        <span className="detail-value">Высокие</span>
                    </div>
                </div>

                {/* Банковские реквизиты для продажи */}
                {!isBuyMode && (
                    <div className="payment-section-enhanced">
                        <div className="section-header-3d">
                            <div className="header-left">
                                <span className="section-icon">🏦</span>
                                <h3>Банковские реквизиты</h3>
                            </div>
                            {!showAddPayment && (
                                <button
                                    className="add-button-3d"
                                    onClick={() => setShowAddPayment(true)}
                                >
                                    <span className="add-icon">+</span>
                                    <span>Добавить</span>
                                </button>
                            )}
                        </div>

                        {showAddPayment && (
                            <div className="add-form-3d">
                                <div className="form-header-3d">
                                    <h4>Новые реквизиты</h4>
                                    <button
                                        className="close-form-3d"
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

                                <div className="form-inputs-3d">
                                    <div className="input-group-3d">
                                        <label className="input-label-3d">Банк</label>
                                        <div className="bank-select-3d">
                                            <div
                                                className={`select-trigger ${newPayment.bankName ? 'has-value' : ''}`}
                                                onClick={() => setShowBankDropdown(!showBankDropdown)}
                                            >
                                                {newPayment.bankName || 'Выберите банк'}
                                                <span className="dropdown-arrow-3d">▼</span>
                                            </div>
                                            {showBankDropdown && (
                                                <div className="bank-dropdown-3d">
                                                    {availableBanks.map((bank, index) => (
                                                        <div
                                                            key={index}
                                                            className="bank-option-3d"
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
                                        <div className="input-group-3d">
                                            <label className="input-label-3d">Номер телефона</label>
                                            <input
                                                type="tel"
                                                placeholder="+7 (900) 123-45-67"
                                                value={newPayment.phoneNumber}
                                                onChange={handlePhoneNumberChange}
                                                className={`input-3d ${newPayment.cardNumberError ? 'error' : ''}`}
                                                maxLength="18"
                                            />
                                        </div>
                                    ) : (
                                        <div className="input-group-3d">
                                            <label className="input-label-3d">Номер карты</label>
                                            <input
                                                type="text"
                                                placeholder="0000 0000 0000 0000"
                                                value={newPayment.cardNumber}
                                                onChange={handleCardNumberChange}
                                                className={`input-3d ${newPayment.cardNumberError ? 'error' : ''}`}
                                                maxLength="19"
                                            />
                                        </div>
                                    )}
                                </div>

                                <button
                                    className="save-button-3d"
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

                        <div className="payment-methods-3d">
                            {paymentMethods.length === 0 ? (
                                <div className="empty-state-3d">
                                    <div className="empty-icon-3d">💳</div>
                                    <p>Добавьте банковские реквизиты</p>
                                </div>
                            ) : (
                                paymentMethods.map((payment) => (
                                    <div
                                        key={payment.id}
                                        className={`payment-card-3d ${payment.type === 'sbp' ? 'sbp-card' : ''} ${selectedPayment?.id === payment.id ? 'selected' : ''}`}
                                        onClick={() => handlePaymentSelect(payment)}
                                    >
                                        <div className="payment-card-header">
                                            <div className="bank-info">
                                                <span className="bank-name">{payment.name}</span>
                                                {payment.type === 'sbp' && (
                                                    <span className="sbp-badge-3d">СБП</span>
                                                )}
                                            </div>
                                            <button
                                                className="delete-card-btn"
                                                onClick={(e) => handleDeletePayment(payment.id, e)}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <div className="payment-card-number">
                                            {payment.type === 'sbp' 
                                                ? `📱 ${payment.formattedNumber}`
                                                : `💳 •••• ${payment.number.slice(-4)}`
                                            }
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Крипто-адреса для покупки */}
                {isBuyMode && (
                    <div className="payment-section-enhanced">
                        <div className="section-header-3d">
                            <div className="header-left">
                                <span className="section-icon">₿</span>
                                <h3>Крипто-адреса</h3>
                            </div>
                            {!showAddCrypto && (
                                <button
                                    className="add-button-3d"
                                    onClick={() => setShowAddCrypto(true)}
                                >
                                    <span className="add-icon">+</span>
                                    <span>Добавить</span>
                                </button>
                            )}
                        </div>

                        {showAddCrypto && (
                            <div className="add-form-3d">
                                <div className="form-header-3d">
                                    <h4>Новый адрес</h4>
                                    <button
                                        className="close-form-3d"
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

                                <div className="form-inputs-3d">
                                    <div className="input-group-3d">
                                        <label className="input-label-3d">Название</label>
                                        <input
                                            type="text"
                                            placeholder="Мой кошелек"
                                            value={newCryptoAddress.name}
                                            onChange={(e) => setNewCryptoAddress(prev => ({
                                                ...prev,
                                                name: e.target.value
                                            }))}
                                            className="input-3d"
                                        />
                                    </div>

                                    <div className="input-group-3d">
                                        <label className="input-label-3d">Сеть</label>
                                        <div className="network-select-3d">
                                            <select
                                                value={newCryptoAddress.network}
                                                onChange={(e) => setNewCryptoAddress(prev => ({
                                                    ...prev,
                                                    network: e.target.value
                                                }))}
                                                className="select-3d"
                                            >
                                                {availableNetworks.map(network => (
                                                    <option key={network.value} value={network.value}>
                                                        {network.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="input-group-3d">
                                        <label className="input-label-3d">Адрес кошелька</label>
                                        <input
                                            type="text"
                                            placeholder={`Введите адрес ${newCryptoAddress.network}`}
                                            value={newCryptoAddress.address}
                                            onChange={(e) => setNewCryptoAddress(prev => ({
                                                ...prev,
                                                address: e.target.value
                                            }))}
                                            className={`input-3d ${newCryptoAddress.addressError ? 'error' : ''}`}
                                        />
                                    </div>
                                </div>

                                <button
                                    className="save-button-3d"
                                    onClick={handleAddCryptoAddress}
                                    disabled={!newCryptoAddress.address || !newCryptoAddress.name}
                                >
                                    Сохранить адрес
                                </button>
                            </div>
                        )}

                        <div className="payment-methods-3d">
                            {cryptoAddresses.length === 0 ? (
                                <div className="empty-state-3d">
                                    <div className="empty-icon-3d">₿</div>
                                    <p>Добавьте адрес кошелька</p>
                                </div>
                            ) : (
                                cryptoAddresses.map((address) => {
                                    const networkInfo = availableNetworks.find(net => net.value === address.network);
                                    return (
                                        <div
                                            key={address.id}
                                            className={`payment-card-3d ${selectedCryptoAddress?.id === address.id ? 'selected' : ''}`}
                                            onClick={() => handleCryptoAddressSelect(address)}
                                        >
                                            <div className="payment-card-header">
                                                <div className="crypto-info">
                                                    <span className="address-name">{address.name}</span>
                                                    <span className="network-badge">
                                                        {networkInfo?.icon} {address.network}
                                                    </span>
                                                </div>
                                                <button
                                                    className="delete-card-btn"
                                                    onClick={(e) => handleDeleteCryptoAddress(address.id, e)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            <div className="crypto-address-wrapper">
                                                <div className="crypto-address-display">
                                                    {address.address.slice(0, 10)}...{address.address.slice(-10)}
                                                </div>
                                                <button
                                                    className="copy-btn-3d"
                                                    onClick={(e) => copyToClipboard(address.address, e)}
                                                >
                                                    📋
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Главная кнопка обмена */}
            <button
                className={`exchange-button-enhanced ${isBuyMode ? 'buy' : 'sell'} ${!isExchangeReady() ? 'disabled' : ''}`}
                disabled={!isExchangeReady()}
                onClick={handleExchange}
            >
                <div className="button-content-enhanced">
                    <span className="button-icon">{isBuyMode ? '🛒' : '💰'}</span>
                    <span className="button-text">
                        {!userInitialized ? 'Загрузка...' : 
                         (isBuyMode ? 'Купить USDT сейчас' : 'Продать USDT сейчас')}
                    </span>
                </div>
                <div className="button-sparkle"></div>
                <div className="button-glow-enhanced"></div>
            </button>

            {/* Быстрые действия */}
            <div className="quick-actions">
                <button className="quick-action">
                    <span className="action-icon">📱</span>
                    <span className="action-text">Приложение</span>
                </button>
                <button className="quick-action" onClick={() => navigateTo('/history')}>
                    <span className="action-icon">📊</span>
                    <span className="action-text">История</span>
                </button>
                <button className="quick-action" onClick={() => navigateTo('/help')}>
                    <span className="action-icon">❓</span>
                    <span className="action-text">Помощь</span>
                </button>
                <button className="quick-action">
                    <span className="action-icon">⭐</span>
                    <span className="action-text">Отзывы</span>
                </button>
            </div>

            {showSupportChat && (
                <SupportChat
                    orderId={currentOrderId}
                    onClose={() => setShowSupportChat(false)}
                    exchangeData={currentExchangeData}
                />
            )}

            {/* Навигация */}
            <div className="bottom-nav-enhanced">
                <button className="nav-item-enhanced active" onClick={() => navigateTo('/')}>
                    <div className="nav-icon-wrapper">
                        <span className="nav-icon-enhanced">🏠</span>
                    </div>
                    <span className="nav-label-enhanced">Главная</span>
                </button>
                
                <button className="nav-item-enhanced" onClick={() => navigateTo('/profile')}>
                    <div className="nav-icon-wrapper">
                        <span className="nav-icon-enhanced">👤</span>
                    </div>
                    <span className="nav-label-enhanced">Профиль</span>
                </button>

                <div className="nav-center">
                    <button className="nav-center-button" onClick={handleExchange} disabled={!isExchangeReady()}>
                        <span className="nav-center-icon">💸</span>
                    </button>
                </div>

                <button className="nav-item-enhanced" onClick={() => navigateTo('/history')}>
                    <div className="nav-icon-wrapper">
                        <span className="nav-icon-enhanced">📊</span>
                    </div>
                    <span className="nav-label-enhanced">История</span>
                </button>
               
                <button className="nav-item-enhanced" onClick={() => navigateTo('/help')}>
                    <div className="nav-icon-wrapper">
                        <span className="nav-icon-enhanced">❓</span>
                    </div>
                    <span className="nav-label-enhanced">Помощь</span>
                </button>
            </div>

            {/* Индикатор сети */}
            <div className="network-status">
                <div className="status-dot online"></div>
                <span className="status-text">Сеть: {selectedCryptoAddress?.network || 'Не выбрана'}</span>
            </div>
        </div>
    );
}

export default Home;