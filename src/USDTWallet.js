// USDTWalletTG.js - Стиль Telegram Web App
import React, { useState, useEffect } from 'react';
import './USDTWalletTG.css';

const API_BASE_URL = 'https://tethrab.shop';

function USDTWalletTG({ telegramId, onBack }) {
    const [activeTab, setActiveTab] = useState('balance');
    const [balance, setBalance] = useState({ available: 0, total: 0, totalDeposited: 0, totalWithdrawn: 0 });
    const [address, setAddress] = useState('');
    const [withdrawals, setWithdrawals] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [withdrawData, setWithdrawData] = useState({
        amount: '',
        address: '',
        network: 'BEP20'
    });
    const [showQR, setShowQR] = useState(false);

    // Цвета Telegram
    const tgColors = {
        bg: 'var(--tg-theme-bg-color, #ffffff)',
        secondaryBg: 'var(--tg-theme-secondary-bg-color, #f1f1f1)',
        text: 'var(--tg-theme-text-color, #000000)',
        hint: 'var(--tg-theme-hint-color, #8e8e93)',
        link: 'var(--tg-theme-link-color, #3390ec)',
        button: 'var(--tg-theme-button-color, #3390ec)',
        buttonText: 'var(--tg-theme-button-text-color, #ffffff)'
    };

    // Загрузка данных
    const loadData = async () => {
        if (!telegramId) return;
        
        setIsLoading(true);
        try {
            // Баланс
            const balanceRes = await fetch(`${API_BASE_URL}/api/wallet/usdt/balance/${telegramId}`);
            if (balanceRes.ok) {
                const data = await balanceRes.json();
                if (data.success) setBalance(data.data);
            }
            
            // Адрес
            const addrRes = await fetch(`${API_BASE_URL}/api/wallet/usdt/user-address/${telegramId}`);
            if (addrRes.ok) {
                const data = await addrRes.json();
                if (data.success) setAddress(data.data.address);
            }
            
            // Выводы
            const wdRes = await fetch(`${API_BASE_URL}/api/wallet/withdrawals/${telegramId}`);
            if (wdRes.ok) {
                const data = await wdRes.json();
                if (data.success) setWithdrawals(data.withdrawals);
            }
        } catch (error) {
            console.error('Ошибка загрузки:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [telegramId]);

    // Форматирование
    const formatUSDT = (amount) => `${parseFloat(amount || 0).toFixed(2)} USDT`;
    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Вывод средств
    const handleWithdraw = async (e) => {
        e.preventDefault();
        
        if (!withdrawData.amount || parseFloat(withdrawData.amount) < 10) {
            alert('Минимальная сумма вывода: 10 USDT');
            return;
        }
        
        if (parseFloat(withdrawData.amount) > balance.available) {
            alert(`Недостаточно средств. Доступно: ${formatUSDT(balance.available)}`);
            return;
        }
        
        if (!withdrawData.address || withdrawData.address.length < 20) {
            alert('Введите корректный адрес кошелька');
            return;
        }
        
        try {
            const res = await fetch(`${API_BASE_URL}/api/wallet/withdrawal/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegramId,
                    ...withdrawData,
                    currency: 'USDT'
                })
            });
            
            const data = await res.json();
            if (data.success) {
                alert('✅ Запрос на вывод создан!');
                setWithdrawData({ amount: '', address: '', network: 'BEP20' });
                loadData();
                setActiveTab('history');
            } else {
                alert(`❌ ${data.error}`);
            }
        } catch (error) {
            alert('❌ Ошибка при создании запроса');
        }
    };

    // Копирование
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('✅ Скопировано!');
    };

    if (isLoading && activeTab === 'balance') {
        return (
            <div className="tg-loading">
                <div className="tg-spinner"></div>
                <p style={{ color: tgColors.hint }}>Загрузка...</p>
            </div>
        );
    }

    return (
        <div className="tg-container" style={{ backgroundColor: tgColors.bg }}>
            {/* Хедер */}
            <div className="tg-header" style={{ backgroundColor: tgColors.bg }}>
                <button className="tg-back-btn" onClick={onBack}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M19 12H5" stroke={tgColors.text} strokeWidth="2" strokeLinecap="round"/>
                        <path d="M12 19L5 12L12 5" stroke={tgColors.text} strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                </button>
                <h2 className="tg-title" style={{ color: tgColors.text }}>USDT Кошелек</h2>
                <div className="tg-header-placeholder"></div>
            </div>

            {/* Вкладки */}
            <div className="tg-tabs">
                {['balance', 'deposit', 'withdraw', 'history'].map((tab) => (
                    <button
                        key={tab}
                        className={`tg-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            color: activeTab === tab ? tgColors.button : tgColors.hint,
                            borderBottomColor: activeTab === tab ? tgColors.button : 'transparent'
                        }}
                    >
                        {tab === 'balance' && '💎 Баланс'}
                        {tab === 'deposit' && '📥 Пополнить'}
                        {tab === 'withdraw' && '📤 Вывести'}
                        {tab === 'history' && '📋 История'}
                    </button>
                ))}
            </div>

            {/* Контент */}
            <div className="tg-content">
                {/* БАЛАНС */}
                {activeTab === 'balance' && (
                    <div className="tg-section">
                        <div className="tg-card" style={{ backgroundColor: tgColors.secondaryBg }}>
                            <div className="tg-balance-main">
                                <div className="tg-balance-total" style={{ color: tgColors.text }}>
                                    {formatUSDT(balance.total)}
                                </div>
                                <div className="tg-balance-label" style={{ color: tgColors.hint }}>
                                    Общий баланс
                                </div>
                            </div>
                            
                            <div className="tg-balance-details">
                                <div className="tg-balance-row">
                                    <span style={{ color: tgColors.hint }}>Доступно</span>
                                    <span style={{ color: tgColors.text, fontWeight: '500' }}>
                                        {formatUSDT(balance.available)}
                                    </span>
                                </div>
                                <div className="tg-balance-row">
                                    <span style={{ color: tgColors.hint }}>Пополнено</span>
                                    <span style={{ color: tgColors.text }}>
                                        {formatUSDT(balance.totalDeposited)}
                                    </span>
                                </div>
                                <div className="tg-balance-row">
                                    <span style={{ color: tgColors.hint }}>Выведено</span>
                                    <span style={{ color: tgColors.text }}>
                                        {formatUSDT(balance.totalWithdrawn)}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="tg-actions">
                                <button
                                    className="tg-action-btn primary"
                                    onClick={() => setActiveTab('deposit')}
                                    style={{
                                        backgroundColor: tgColors.button,
                                        color: tgColors.buttonText
                                    }}
                                >
                                    Пополнить
                                </button>
                                <button
                                    className="tg-action-btn secondary"
                                    onClick={() => setActiveTab('withdraw')}
                                    disabled={balance.available < 10}
                                    style={{
                                        borderColor: tgColors.hint,
                                        color: tgColors.text
                                    }}
                                >
                                    Вывести
                                </button>
                            </div>
                        </div>
                        
                        {/* Быстрые действия */}
                        <div className="tg-quick-actions">
                            <button
                                className="tg-quick-btn"
                                onClick={loadData}
                                style={{ color: tgColors.button }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C15.3019 3 18.1885 4.77814 19.7545 7.42909" stroke="currentColor" strokeWidth="2"/>
                                    <path d="M21 3V7.5H16.5" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                                Обновить
                            </button>
                        </div>
                    </div>
                )}

                {/* ПОПОЛНЕНИЕ */}
                {activeTab === 'deposit' && (
                    <div className="tg-section">
                        <div className="tg-card" style={{ backgroundColor: tgColors.secondaryBg }}>
                            <h3 style={{ color: tgColors.text, marginBottom: '16px' }}>
                                Ваш адрес для пополнения
                            </h3>
                            
                            <div className="tg-address-container">
                                <div className="tg-address-label" style={{ color: tgColors.hint }}>
                                    USDT (BEP20)
                                </div>
                                <div className="tg-address-value">
                                    <code style={{ color: tgColors.text }}>
                                        {address || 'Загрузка...'}
                                    </code>
                                    <button
                                        className="tg-copy-btn"
                                        onClick={() => copyToClipboard(address)}
                                        style={{ color: tgColors.button }}
                                    >
                                        Копировать
                                    </button>
                                </div>
                            </div>
                            
                            <div className="tg-qr-section">
                                {showQR && address ? (
                                    <div className="tg-qr-container">
                                        {/* QR код генерируется на сервере */}
                                        <div className="tg-qr-placeholder">
                                            <div className="tg-qr-code" onClick={() => setShowQR(false)}>
                                                {/* Здесь будет QR код */}
                                                QR Code
                                            </div>
                                            <p style={{ color: tgColors.hint, fontSize: '14px' }}>
                                                Отсканируйте для пополнения
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        className="tg-qr-btn"
                                        onClick={() => setShowQR(true)}
                                        style={{ color: tgColors.button }}
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path d="M1 1H5V5H1V1ZM1 19H5V23H1V19ZM19 1H23V5H19V1ZM19 19H23V23H19V19ZM3 3V3H3V3ZM3 21V21H3V3ZM21 3V3H3V3ZM21 21V21H3V3ZM7 7H11V11H7V7ZM7 13H11V17H7V13ZM13 7H17V11H13V7ZM13 13H17V17H13V13Z" fill="currentColor"/>
                                        </svg>
                                        Показать QR код
                                    </button>
                                )}
                            </div>
                            
                            <div className="tg-instructions">
                                <h4 style={{ color: tgColors.text, marginBottom: '12px' }}>
                                    📝 Инструкция
                                </h4>
                                <ol style={{ color: tgColors.text, fontSize: '14px', lineHeight: '1.6' }}>
                                    <li>Отправляйте только USDT в сети BEP20</li>
                                    <li>Минимальная сумма: 10 USDT</li>
                                    <li>Депозит обрабатывается автоматически</li>
                                    <li>Обычное время зачисления: 5-30 минут</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                )}

                {/* ВЫВОД */}
                {activeTab === 'withdraw' && (
                    <div className="tg-section">
                        <div className="tg-card" style={{ backgroundColor: tgColors.secondaryBg }}>
                            <h3 style={{ color: tgColors.text, marginBottom: '20px' }}>
                                Вывод USDT
                            </h3>
                            
                            <div className="tg-withdraw-info" style={{ color: tgColors.hint, marginBottom: '20px' }}>
                                Доступно: <span style={{ color: tgColors.text, fontWeight: '500' }}>
                                    {formatUSDT(balance.available)}
                                </span>
                            </div>
                            
                            <form onSubmit={handleWithdraw} className="tg-form">
                                <div className="tg-form-group">
                                    <label style={{ color: tgColors.hint, fontSize: '14px' }}>
                                        Сумма (USDT)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="10"
                                        max={balance.available}
                                        value={withdrawData.amount}
                                        onChange={(e) => setWithdrawData({...withdrawData, amount: e.target.value})}
                                        placeholder="10.00"
                                        style={{
                                            backgroundColor: tgColors.bg,
                                            color: tgColors.text,
                                            borderColor: tgColors.hint
                                        }}
                                        required
                                    />
                                    <div className="tg-form-hint" style={{ color: tgColors.hint }}>
                                        Минимум: 10 USDT
                                    </div>
                                </div>
                                
                                <div className="tg-form-group">
                                    <label style={{ color: tgColors.hint, fontSize: '14px' }}>
                                        Сеть
                                    </label>
                                    <select
                                        value={withdrawData.network}
                                        onChange={(e) => setWithdrawData({...withdrawData, network: e.target.value})}
                                        style={{
                                            backgroundColor: tgColors.bg,
                                            color: tgColors.text,
                                            borderColor: tgColors.hint
                                        }}
                                    >
                                        <option value="BEP20">BEP20 (Binance Smart Chain)</option>
                                        <option value="ERC20">ERC20 (Ethereum)</option>
                                        <option value="TRC20">TRC20 (Tron)</option>
                                    </select>
                                </div>
                                
                                <div className="tg-form-group">
                                    <label style={{ color: tgColors.hint, fontSize: '14px' }}>
                                        Адрес кошелька
                                    </label>
                                    <textarea
                                        value={withdrawData.address}
                                        onChange={(e) => setWithdrawData({...withdrawData, address: e.target.value})}
                                        placeholder="0x..."
                                        rows="3"
                                        style={{
                                            backgroundColor: tgColors.bg,
                                            color: tgColors.text,
                                            borderColor: tgColors.hint
                                        }}
                                        required
                                    />
                                </div>
                                
                                <div className="tg-withdraw-note" style={{ color: tgColors.hint, fontSize: '13px' }}>
                                    ⚠️ Проверьте адрес перед отправкой. Ошибки необратимы.
                                </div>
                                
                                <button
                                    type="submit"
                                    className="tg-submit-btn"
                                    disabled={!withdrawData.amount || !withdrawData.address}
                                    style={{
                                        backgroundColor: withdrawData.amount && withdrawData.address ? tgColors.button : tgColors.hint,
                                        color: tgColors.buttonText,
                                        opacity: withdrawData.amount && withdrawData.address ? 1 : 0.5
                                    }}
                                >
                                    📤 Отправить на вывод
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* ИСТОРИЯ */}
                {activeTab === 'history' && (
                    <div className="tg-section">
                        <div className="tg-card" style={{ backgroundColor: tgColors.secondaryBg }}>
                            <h3 style={{ color: tgColors.text, marginBottom: '20px' }}>
                                История операций
                            </h3>
                            
                            {withdrawals.length === 0 ? (
                                <div className="tg-empty" style={{ color: tgColors.hint }}>
                                    📭 Нет операций
                                </div>
                            ) : (
                                <div className="tg-history-list">
                                    {withdrawals.map((wd) => (
                                        <div key={wd.id} className="tg-history-item">
                                            <div className="tg-history-icon">
                                                📤
                                            </div>
                                            <div className="tg-history-details">
                                                <div className="tg-history-top">
                                                    <span style={{ color: tgColors.text, fontWeight: '500' }}>
                                                        Вывод USDT
                                                    </span>
                                                    <span style={{ color: tgColors.hint, fontSize: '12px' }}>
                                                        {formatDate(wd.created_at)}
                                                    </span>
                                                </div>
                                                <div className="tg-history-address" style={{ color: tgColors.hint }}>
                                                    {wd.address.substring(0, 20)}...
                                                </div>
                                                <div className={`tg-history-status status-${wd.status}`}>
                                                    {wd.status === 'pending' && '⏳ Ожидание'}
                                                    {wd.status === 'completed' && '✅ Выполнено'}
                                                    {wd.status === 'rejected' && '❌ Отклонено'}
                                                    {wd.status === 'processing' && '🔄 В обработке'}
                                                </div>
                                            </div>
                                            <div className="tg-history-amount" style={{ color: wd.status === 'completed' ? '#34C759' : tgColors.text }}>
                                                -{formatUSDT(wd.amount)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default USDTWalletTG;