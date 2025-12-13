import { useState, useEffect } from 'react';
import './Profile.css';
import { ProfileIcon, ExchangeIcon, HistoryIcon } from './NavIcons';

// Используем порт 3002 как в вашем API
const API_BASE_URL = 'https://tethrab.shop'; 

// SVG иконки
const ProfileSVG = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4" fill="currentColor"/>
    <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" fill="currentColor"/>
  </svg>
);

const ReferralSVG = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H6C4.93913 15 3.92172 15.4214 3.17157 16.1716C2.42143 16.9217 2 17.9391 2 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 11L22 6L17 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 6H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SettingsSVG = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19.4 15C19.2663 15.3031 19.1335 15.6063 19 15.9L21 17.9C21.5 18.2 21.9 18.6 21.9 19.4C21.8 20.2 21.3 20.6 20.7 21L18.7 19C18.4 19.1 18.1 19.2 17.8 19.3C17.5 19.4 17.2 19.5 16.9 19.6L16.5 22H15.5L15.1 19.6C14.8 19.5 14.5 19.4 14.2 19.3C13.9 19.2 13.6 19.1 13.3 19L11.3 21C10.7 20.6 10.2 20.2 10.1 19.4C10 18.6 10.4 18.2 10.9 17.9L12.9 15.9C12.8 15.6 12.7 15.3 12.6 15H12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MoonSVG = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 12.79C20.8427 14.4922 20.2039 16.1144 19.1582 17.4668C18.1125 18.8192 16.7035 19.8458 15.0957 20.4265C13.4879 21.0073 11.748 21.1181 10.0795 20.7461C8.41104 20.3741 6.88203 19.5345 5.67418 18.3267C4.46634 17.1188 3.62675 15.5898 3.25475 13.9214C2.88276 12.2529 2.99354 10.513 3.57432 8.90523C4.1551 7.29745 5.18168 5.88842 6.53407 4.84272C7.88647 3.79702 9.50862 3.15824 11.2108 3.00101C10.2134 4.34827 9.73375 6.00945 9.85843 7.68141C9.98312 9.35338 10.7039 10.9251 11.8894 12.1106C13.0749 13.2961 14.6466 14.0169 16.3186 14.1416C17.9906 14.2663 19.6518 13.7866 21 12.7892V12.79Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Ваша SVG иконка Help
const HelpSVG = () => (
  <svg width="24" height="13" viewBox="0 0 101 53" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M37.25 18C37.25 10.8203 43.0703 5 50.25 5C57.4297 5 63.25 10.8203 63.25 18C63.25 25.1797 57.4297 31 50.25 31C43.0703 31 37.25 25.1797 37.25 18ZM45.9167 18C45.9167 19.0833 44.8333 20.1667 43.75 20.1667C42.6667 20.1667 41.5833 19.0833 41.5833 18C41.5833 16.9167 42.6667 15.8333 43.75 15.8333C44.8333 15.8333 45.9167 16.9167 45.9167 18ZM52.4167 18C52.4167 19.0833 51.3333 20.1667 50.25 20.1667C49.1667 20.1667 48.0833 19.0833 48.0833 18C48.0833 16.9167 49.1667 15.8333 50.25 15.8333C51.3333 15.8333 52.4167 16.9167 52.4167 18ZM56.75 20.1667C57.8333 20.1667 58.9167 19.0833 58.9167 18C58.9167 16.9167 57.8333 15.8333 56.75 15.8333C55.6667 15.8333 54.5833 16.9167 54.5833 18C54.5833 19.0833 55.6667 20.1667 56.75 20.1667Z" fill="currentColor" fillOpacity="0.6"/>
    <path d="M31.9691 45.145C29.7938 45.145 28.4188 43.5928 28.4188 41.1221C28.4188 38.6675 29.8046 37.1045 31.9691 37.1045C33.6771 37.1045 34.9823 38.1411 35.2401 39.688H34.0316C33.7792 38.7695 32.9735 38.1733 31.9691 38.1733C30.5619 38.1733 29.6488 39.3281 29.6488 41.1221C29.6488 42.9321 30.5512 44.0762 31.9745 44.0762C33.0111 44.0762 33.7577 43.5713 34.0316 42.7065H35.2401C34.9071 44.2427 33.7094 45.145 31.9691 45.145ZM40.256 45V40.2681H37.753V45H36.5982V39.3496H41.4161V45H40.256ZM45.9163 39.2583C47.3504 39.2583 48.2957 40.3862 48.2957 42.1748C48.2957 43.9634 47.3558 45.0967 45.9378 45.0967C45.1268 45.0967 44.4822 44.6992 44.16 44.0708H44.1331V46.8691H42.9729V39.3496H44.0955V40.3218H44.117C44.45 39.6719 45.0999 39.2583 45.9163 39.2583ZM45.6102 44.1138C46.5286 44.1138 47.1033 43.3618 47.1033 42.1748C47.1033 40.9932 46.5286 40.2358 45.6102 40.2358C44.7239 40.2358 44.1277 41.0093 44.1277 42.1748C44.1277 43.3511 44.7186 44.1138 45.6102 44.1138ZM51.5767 44.1782C52.3877 44.1782 53.0215 43.6196 53.0215 42.8838V42.438L51.6304 42.5239C50.9375 42.5723 50.5454 42.8784 50.5454 43.3618C50.5454 43.856 50.9536 44.1782 51.5767 44.1782ZM51.2544 45.0967C50.1479 45.0967 49.3745 44.4092 49.3745 43.394C49.3745 42.4058 50.1318 41.7988 51.4746 41.7236L53.0215 41.6323V41.1973C53.0215 40.5688 52.5972 40.1929 51.8882 40.1929C51.2168 40.1929 50.7979 40.5151 50.6958 41.02H49.6001C49.6646 39.9995 50.5347 39.2476 51.9312 39.2476C53.3008 39.2476 54.1763 39.9727 54.1763 41.106V45H53.0645V44.0708H53.0376C52.71 44.6992 51.9956 45.0967 51.2544 45.0967ZM58.0266 40.1929H56.8396V41.6753H57.9138C58.569 41.6753 58.8967 41.4229 58.8967 40.9233C58.8967 40.4561 58.5905 40.1929 58.0266 40.1929ZM57.989 42.4863H56.8396V44.1567H58.1179C58.7731 44.1567 59.1276 43.8667 59.1276 43.3242C59.1276 42.7656 58.7517 42.4863 57.989 42.4863ZM55.6955 45V39.3496H58.2629C59.364 39.3496 60.03 39.8975 60.03 40.7891C60.03 41.3745 59.611 41.9062 59.0686 42.0083V42.0513C59.799 42.1479 60.2824 42.6636 60.2824 43.3726C60.2824 44.3662 59.5197 45 58.2951 45H55.6955ZM63.9071 42.0029L66.5067 45H65.0512L62.8114 42.395H62.7685V45H61.6137V39.3496H62.7685V41.7666H62.8114L65.0243 39.3496H66.4101L63.9071 42.0029ZM69.3741 44.1782C70.1852 44.1782 70.8189 43.6196 70.8189 42.8838V42.438L69.4278 42.5239C68.735 42.5723 68.3429 42.8784 68.3429 43.3618C68.3429 43.856 68.7511 44.1782 69.3741 44.1782ZM69.0519 45.0967C67.9454 45.0967 67.172 44.4092 67.172 43.394C67.172 42.4058 67.9293 41.7988 69.2721 41.7236L70.8189 41.6323V41.1973C70.8189 40.5688 70.3946 40.1929 69.6856 40.1929C69.0143 40.1929 68.5953 40.5151 68.4933 41.02H67.3976C67.462 39.9995 68.3321 39.2476 69.7286 39.2476C71.0982 39.2476 71.9737 39.9727 71.9737 41.106V45H70.8619V44.0708H70.8351C70.5074 44.6992 69.7931 45.0967 69.0519 45.0967Z" fill="currentColor" fillOpacity="0.6"/>
  </svg>
);

function Profile({ navigateTo, telegramUser }) {
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showReferral, setShowReferral] = useState(false);
    const [referralStats, setReferralStats] = useState({
        totalReferrals: 0,
        activeReferrals: 0,
        earned: 0,
        pendingEarned: 0,
        referralLink: '',
        referralCode: ''
    });
    const [photoError, setPhotoError] = useState(false);
    const [userOrders, setUserOrders] = useState([]);

    // Получаем ID пользователя из Telegram Web App
    const getUserId = () => {
        try {
            // Пробуем получить из Telegram Web App
            if (window.Telegram?.WebApp) {
                const tg = window.Telegram.WebApp;
                const tgUser = tg.initDataUnsafe?.user;
                
                if (tgUser) {
                    console.log('🤖 Telegram Web App User:', tgUser);
                    return tgUser.id.toString();
                }
            }

            // Пробуем получить из URL параметров (для тестирования)
            const urlParams = new URLSearchParams(window.location.search);
            const testUserId = urlParams.get('test_user_id');
            if (testUserId) {
                console.log('🧪 Тестовый пользователь из URL:', testUserId);
                return testUserId;
            }

            // Пробуем получить из localStorage
            const savedTelegramUser = localStorage.getItem('telegramUser');
            if (savedTelegramUser) {
                const parsed = JSON.parse(savedTelegramUser);
                return parsed.id?.toString();
            }

            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                const parsed = JSON.parse(savedUser);
                return parsed.telegramId?.toString() || parsed.id?.toString();
            }

        } catch (error) {
            console.error('❌ Ошибка получения ID:', error);
        }

        // Дефолтный пользователь для админа
        return '7879866656';
    };

    // Получение данных пользователя из его ордеров
    const loadUserData = async () => {
        try {
            const userId = getUserId();
            console.log('👤 Загружаем данные для ID:', userId);

            // Если есть Telegram Web App данные, используем их
            if (window.Telegram?.WebApp) {
                const tg = window.Telegram.WebApp;
                const tgUser = tg.initDataUnsafe?.user;
                
                if (tgUser) {
                    const userData = {
                        id: tgUser.id.toString(),
                        telegramId: tgUser.id,
                        username: tgUser.username || `user_${tgUser.id}`,
                        firstName: tgUser.first_name || 'Пользователь',
                        lastName: tgUser.last_name || '',
                        photoUrl: tgUser.photo_url
                    };

                    console.log('✅ Telegram данные:', userData);
                    setUserData(userData);
                    
                    // Сохраняем в localStorage
                    localStorage.setItem('telegramUser', JSON.stringify(tgUser));
                    localStorage.setItem('currentUser', JSON.stringify(userData));
                    
                    return;
                }
            }

            // АДАПТИРОВАННЫЙ ЗАПРОС: используем существующий endpoint для получения ордеров пользователя
            // Из ордеров мы можем извлечь данные о пользователе
            const response = await fetch(`${API_BASE_URL}/user-orders/${userId}`);
            
            if (response.ok) {
                const result = await response.json();
                console.log('📊 Ответ от API ордеров:', result);
                
                if (result.success && result.orders && result.orders.length > 0) {
                    // Берем данные из первого ордера
                    const firstOrder = result.orders[0];
                    
                    const userData = {
                        id: userId,
                        telegramId: firstOrder.telegram_id || userId,
                        username: firstOrder.username || `user_${userId}`,
                        firstName: firstOrder.first_name || 'Пользователь',
                        lastName: '',
                        photoUrl: null,
                        totalOrders: result.count,
                        lastOrderDate: firstOrder.created_at
                    };

                    console.log('✅ Данные пользователя из ордеров:', userData);
                    setUserData(userData);
                    localStorage.setItem('currentUser', JSON.stringify(userData));
                    
                    // Сохраняем ордера для статистики
                    setUserOrders(result.orders);
                    
                    // Рассчитываем статистику из ордеров
                    calculateUserStats(result.orders);
                    
                    return;
                }
            }

            // Если нет данных в API, создаем пользователя на основе ID
            const defaultUserData = {
                id: userId,
                telegramId: userId,
                username: `user_${userId}`,
                firstName: 'Пользователь',
                lastName: '',
                photoUrl: null,
                totalOrders: 0
            };

            console.log('⚙️ Создаем пользователя по умолчанию:', defaultUserData);
            setUserData(defaultUserData);
            localStorage.setItem('currentUser', JSON.stringify(defaultUserData));

        } catch (error) {
            console.error('❌ Ошибка загрузки данных пользователя:', error);
            
            // Пробуем загрузить из localStorage
            try {
                const savedUser = localStorage.getItem('currentUser');
                if (savedUser) {
                    const parsed = JSON.parse(savedUser);
                    console.log('📱 Данные из localStorage:', parsed);
                    setUserData(parsed);
                }
            } catch (localError) {
                console.error('❌ Ошибка локальных данных:', localError);
            }
        }
    };

    // Рассчитываем статистику пользователя из его ордеров
    const calculateUserStats = (orders) => {
        if (!orders || orders.length === 0) return;
        
        // Подсчитываем общую сумму сделок
        let totalAmount = 0;
        let completedOrders = 0;
        
        orders.forEach(order => {
            if (order.admin_status === 'completed') {
                totalAmount += parseFloat(order.amount) || 0;
                completedOrders++;
            }
        });
        
        // Здесь можно добавить расчет заработанного по рефералам
        // Пока используем заглушку
    };

    // Загрузка статистики рефералов - временная заглушка
    const loadReferralStats = async () => {
        try {
            const userId = getUserId();
            console.log('📊 Загрузка реферальной статистики для ID:', userId);

            // ВРЕМЕННАЯ ЗАГЛУШКА - можно будет доработать когда добавите endpoint
            // Пока используем статические данные
            const stats = {
                totalReferrals: 0,
                activeReferrals: 0,
                earned: 0,
                pendingEarned: 0,
                referralLink: `https://t.me/TetherRabbitBot?start=ref_${userId}`,
                referralCode: `REF-${String(userId).slice(-6).toUpperCase()}`
            };
            
            // Пробуем рассчитать из ордеров пользователя
            if (userOrders.length > 0) {
                // Здесь можно добавить логику расчета, если в будущем будет реферальная система
            }
            
            setReferralStats(stats);
            
            console.log('📊 Установлена реферальная статистика:', stats);

        } catch (error) {
            console.error('❌ Ошибка загрузки статистики:', error);
            
            // Даже при ошибке устанавливаем базовые данные
            const userId = getUserId();
            setReferralStats({
                totalReferrals: 0,
                activeReferrals: 0,
                earned: 0,
                pendingEarned: 0,
                referralLink: `https://t.me/TetherRabbitBot?start=ref_${userId}`,
                referralCode: `REF-${String(userId).slice(-6).toUpperCase()}`
            });
        }
    };

    useEffect(() => {
        const loadData = async () => {
            await loadUserData();
            await loadReferralStats();
            
            // Таймер для скрытия загрузки
            const timer = setTimeout(() => {
                setIsLoading(false);
            }, 1000);
            
            return () => clearTimeout(timer);
        };
        
        loadData();
    }, []);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const copyToClipboard = (text, label) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        showMessage('success', `✅ ${label} скопирован`);
    };

    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        showMessage('success', `Тема изменена на ${newTheme === 'dark' ? 'тёмную' : 'светлую'}`);
    };

    const handlePhotoError = () => {
        setPhotoError(true);
    };

    // Простой обработчик для кнопки помощи
    const handleHelpClick = () => {
        console.log('🆘 Help button clicked');
        // Просто меняем hash в URL
        window.location.hash = 'help';
    };

    if (isLoading) {
        return (
            <div className="profile-container">
                <div className="profile-loading">
                    <div className="loading-spinner-new"></div>
                    <p className="loading-text">Загрузка профиля...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            {/* Хедер профиля */}
            <div className="profile-header-new">
                <div className="header-content">
                    <div className="header-left">
                        <div className="header-titles">
                            <h1 className="header-title-new">Профиль</h1>
                            <p className="header-subtitle">Управление вашим аккаунтом</p>
                        </div>
                    </div>
                    
                    {/* Кнопка помощи с вашей SVG иконкой */}
                    <button 
                        className="help-button-new"
                        onClick={handleHelpClick}
                        title="Помощь и поддержка"
                    >
                        <HelpSVG />
                    </button>
                </div>

                {/* Карточка профиля */}
                <div className="profile-main-card">
                    <div className="profile-avatar-section">
                        {userData?.photoUrl && !photoError ? (
                            <img
                                src={userData.photoUrl}
                                alt="Avatar"
                                className="profile-avatar-image"
                                onError={handlePhotoError}
                            />
                        ) : (
                            <div className="profile-avatar-fallback">
                                {userData?.firstName?.[0]?.toUpperCase() || userData?.username?.[0]?.toUpperCase() || '👤'}
                            </div>
                        )}
                    </div>

                    <div className="profile-info-section">
                        <h2 className="profile-display-name">
                            {userData?.firstName || 'Пользователь'}
                        </h2>
                        <p className="profile-username">
                            @{userData?.username || 'user'}
                        </p>

                        <div className="profile-id-section">
                            <span className="id-label">Ваш ID:</span>
                            <button
                                className="id-value"
                                onClick={() => copyToClipboard(userData?.id, 'ID пользователя')}
                            >
                                {userData?.id || '—'}
                            </button>
                        </div>
                        {/* Дополнительная статистика если есть */}
                        {userData?.totalOrders > 0 && (
                            <div className="user-stats-brief">
                                <span className="stat-brief">
                                    Всего сделок: <strong>{userData.totalOrders}</strong>
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Контент профиля */}
            <div className="profile-content-container">
                {/* Реферальная система */}
                <div className="profile-card-new referral-card">
                    <div className="referral-header">
                        <div className="referral-icon">
                            <ReferralSVG />
                        </div>
                        <div className="referral-title">
                            <h3 className="section-title-profile">Реферальная система</h3>
                            <p className="referral-subtitle">Приглашайте друзей и получайте 0.5% от каждой их сделки</p>
                        </div>
                    </div>

                    <div className="referral-stats">
                        <div className="referral-stat-item">
                            <div className="referral-stat-value">{referralStats.totalReferrals}</div>
                            <div className="referral-stat-label">Всего рефералов</div>
                        </div>
                        <div className="referral-stat-item">
                            <div className="referral-stat-value">{referralStats.activeReferrals}</div>
                            <div className="referral-stat-label">Активных</div>
                        </div>
                        <div className="referral-stat-item">
                            <div className="referral-stat-value">{referralStats.earned || 0} $</div>
                            <div className="referral-stat-label">Заработано</div>
                        </div>
                    </div>

                    {showReferral ? (
                        <div className="referral-details">
                            {/* Реферальная ссылка */}
                            <div className="referral-input-group">
                                <label className="referral-label">Ваша реферальная ссылка</label>
                                <div className="referral-input-wrapper">
                                    <input
                                        type="text"
                                        value={referralStats.referralLink}
                                        readOnly
                                        className="referral-input"
                                    />
                                    <button
                                        className="referral-copy-btn"
                                        onClick={() => copyToClipboard(referralStats.referralLink, 'Реферальная ссылка')}
                                    >
                                        📋 Копировать
                                    </button>
                                </div>
                            </div>

                            <div className="referral-info">
                                <div className="info-icon">💡</div>
                                <div className="info-text">
                                    <strong>Как это работает:</strong>
                                    <br />1. Приглашайте друзей по вашей ссылке
                                    <br />2. Когда они делают обмен USDT/RUB
                                    <br />3. Вы получаете 0.5% от суммы каждой их сделки
                                    <br />4. Выводите заработанные средства
                                </div>
                            </div>

                            <button
                                className="referral-hide-btn"
                                onClick={() => setShowReferral(false)}
                            >
                                Скрыть детали
                            </button>
                        </div>
                    ) : (
                        <button
                            className="referral-show-btn"
                            onClick={() => setShowReferral(true)}
                        >
                            <span className="btn-icon">
                                <ReferralSVG />
                            </span>
                            <span>Показать реферальную ссылку</span>
                            {referralStats.earned > 0 && (
                                <span className="earned-badge">+{referralStats.earned} $</span>
                            )}
                        </button>
                    )}
                </div>

                {/* Настройки */}
                <div className="profile-card-new">
                    <div className="settings-header">
                        <SettingsSVG />
                        <h3 className="section-title-profile">Настройки</h3>
                    </div>
                    <div className="settings-list">
                        <button
                            className="settings-item"
                            onClick={toggleTheme}
                        >
                            <div className="settings-icon">
                                <MoonSVG />
                            </div>
                            <div className="settings-content">
                                <div className="settings-title">Тема оформления</div>
                                <div className="settings-description">
                                    Переключить между светлой и тёмной темой
                                </div>
                            </div>
                            <div className="settings-action">
                                <div className={`toggle-switch ${document.documentElement.getAttribute('data-theme') === 'dark' ? 'active' : ''}`}>
                                    <div className="toggle-slider"></div>
                                </div>
                            </div>
                        </button>
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

            {/* Навигация */}
            <div className="bottom-nav-new">
                <button 
                    className="nav-item-new active" 
                    onClick={() => {
                        if (navigateTo && typeof navigateTo === 'function') {
                            navigateTo('profile');
                        } else {
                            window.location.hash = 'profile';
                        }
                    }}
                >
                    <div className="nav-icon-wrapper">
                        <ProfileIcon active={true} />
                    </div>
                    <span className="nav-label">Профиль</span>
                </button>
                
                <button 
                    className="nav-center-item" 
                    onClick={() => {
                        if (navigateTo && typeof navigateTo === 'function') {
                            navigateTo('home');
                        } else {
                            window.location.hash = '';
                        }
                    }}
                >
                    <div className="nav-center-circle">
                        <ExchangeIcon />
                    </div>
                    <span className="nav-center-label">Обмен</span>
                </button>
                
                <button 
                    className="nav-item-new" 
                    onClick={() => {
                        if (navigateTo && typeof navigateTo === 'function') {
                            navigateTo('history');
                        } else {
                            window.location.hash = 'history';
                        }
                    }}
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

export default Profile;