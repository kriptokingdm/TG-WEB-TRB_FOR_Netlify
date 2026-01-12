import React, { useState, useEffect } from 'react';
import './USDTWallet.css';

const API_BASE_URL = 'https://tethrab.shop';

// Иконки
const CopySVG = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
    </svg>
);

const QRCodeSVG = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1H5V5H1V1ZM1 19H5V23H1V19ZM19 1H23V5H19V1ZM19 19H23V23H19V19ZM3 3V3H3V3ZM3 21V21H3V3ZM21 3V3H3V3ZM21 21V21H3V3ZM7 7H11V11H7V7ZM7 13H11V17H7V13ZM13 7H17V11H13V7ZM13 13H17V17H13V13Z" fill="currentColor"/>
    </svg>
);

function USDTWallet({ telegramId, showToast }) {
    const [activeTab, setActiveTab] = useState('balance');
    const [balanceData, setBalanceData] = useState(null);
    const [addressData, setAddressData] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawAddress, setWithdrawAddress] = useState('');
    const [withdrawNetwork, setWithdrawNetwork] = useState('BEP20');

    // Загрузка баланса USDT
    const loadBalanceData = async () => {
        if (!telegramId) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/wallet/usdt/balance/${telegramId}`);
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setBalanceData(result.data);
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки баланса USDT:', error);
        }
    };

    // Загрузка уникального адреса
    const loadAddressData = async () => {
        if (!telegramId) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/wallet/usdt/user-address/${telegramId}`);
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setAddressData(result.data);
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки адреса:', error);
        }
    };

    // Загрузка истории транзакций
    const loadTransactions = async () => {
        if (!telegramId) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/wallet/usdt/transactions/${telegramId}?limit=10`);
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setTransactions(result.data);
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки транзакций:', error);
        }
    };

    // Загрузка всех данных
    const loadAllData = async () => {
        setIsLoading(true);
        await Promise.all([
            loadBalanceData(),
            loadAddressData(),
            loadTransactions()
        ]);
        setIsLoading(false);
        setIsRefreshing(false);
    };

    // Обновление данных
    const refreshData = async () => {
        setIsRefreshing(true);
        await loadAllData();
        showToast?.('✅ Данные обновлены', 'success');
    };

    // Копирование в буфер обмена
    const copyToClipboard = (text, label) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        showToast?.(`✅ ${label} скопирован`, 'success');
    };

    // Форматирование USDT
    const formatUSDT = (num) => {
        const value = parseFloat(num || 0);
        return `${value.toFixed(2)} USDT`;
    };

    // Обработка пополнения
    const handleDeposit = () => {
        // Адрес уже загружен и отображается
    };

    // Обработка вывода
    const handleWithdrawSubmit = async (e) => {
        e.preventDefault();
        
        if (!telegramId) {
            showToast?.('❌ Не указан ID пользователя', 'error');
            return;
        }

        const amount = parseFloat(withdrawAmount);
        if (!amount || amount < 10) {
            showToast?.('❌ Минимальная сумма вывода: 10 USDT', 'error');
            return;
        }

        if (!withdrawAddress || withdrawAddress.length < 20) {
            showToast?.('❌ Введите корректный адрес USDT', 'error');
            return;
        }

        if (balanceData && amount > balanceData.available) {
            showToast?.(`❌ Недостаточно средств. Доступно: ${formatUSDT(balanceData.available)}`, 'error');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/wallet/withdrawal/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    telegramId,
                    amount: amount,
                    address: withdrawAddress,
                    network: withdrawNetwork,
                    currency: 'USDT'
                })
            });

            const result = await response.json();
            if (result.success) {
                showToast?.(`✅ Запрос на вывод ${formatUSDT(amount)} создан!`, 'success');
                setWithdrawAmount('');
                setWithdrawAddress('');
                // Обновляем баланс
                setTimeout(() => loadBalanceData(), 2000);
            } else {
                showToast?.(`❌ ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка вывода:', error);
            showToast?.('❌ Ошибка при создании запроса на вывод', 'error');
        }
    };

    // Ручная проверка депозитов (для админа)
    const checkDeposits = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/check-usdt-deposits`);
            const result = await response.json();
            if (result.success) {
                showToast?.(`✅ ${result.message}`, 'success');
                setTimeout(() => loadAllData(), 3000);
            }
        } catch (error) {
            showToast?.('❌ Ошибка проверки депозитов', 'error');
        }
    };

    // Эффект загрузки данных при монтировании
    useEffect(() => {
        if (telegramId) {
            loadAllData();
        }
    }, [telegramId]);

    if (isLoading && !balanceData) {
        return (
            <div className="usdt-loading">
                <div className="loading-spinner"></div>
                <p>Загрузка USDT кошелька...</p>
            </div>
        );
    }

    return (
        <div className="usdt-wallet">
            {/* Вкладки */}
            <div className="usdt-tabs">
                <button 
                    className={`usdt-tab ${activeTab === 'balance' ? 'active' : ''}`}
                    onClick={() => setActiveTab('balance')}
                >
                    💎 Баланс
                </button>
                <button 
                    className={`usdt-tab ${activeTab === 'deposit' ? 'active' : ''}`}
                    onClick={() => setActiveTab('deposit')}
                >
                    📥 Пополнить
                </button>
                <button 
                    className={`usdt-tab ${activeTab === 'withdraw' ? 'active' : ''}`}
                    onClick={() => setActiveTab('withdraw')}
                >
                    📤 Вывести
                </button>
                <button 
                    className={`usdt-tab ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    📋 История
                </button>
            </div>

            {/* Контент вкладок */}
            <div className="usdt-content">
                {/* Вкладка баланса */}
                {activeTab === 'balance' && (
                    <div className="balance-tab">
                        <div className="usdt-balance-card">
                            <div className="balance-header">
                                <h3>Ваш баланс USDT</h3>
                                <button 
                                    className="refresh-btn"
                                    onClick={refreshData}
                                    disabled={isRefreshing}
                                    title="Обновить"
                                >
                                    {isRefreshing ? '⏳' : '🔄'}
                                </button>
                            </div>
                            
                            <div className="balance-main">
                                <div className="balance-total">
                                    {balanceData ? formatUSDT(balanceData.total) : '0.00 USDT'}
                                </div>
                                
                                <div className="balance-details">
                                    <div className="balance-detail">
                                        <span className="detail-label">Доступно:</span>
                                        <span className="detail-value available">
                                            {balanceData ? formatUSDT(balanceData.available) : '0.00 USDT'}
                                        </span>
                                    </div>
                                    <div className="balance-detail">
                                        <span className="detail-label">Всего пополнено:</span>
                                        <span className="detail-value">
                                            {balanceData ? formatUSDT(balanceData.totalDeposited) : '0.00 USDT'}
                                        </span>
                                    </div>
                                    <div className="balance-detail">
                                        <span className="detail-label">Выведено:</span>
                                        <span className="detail-value">
                                            {balanceData ? formatUSDT(balanceData.totalWithdrawn) : '0.00 USDT'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="balance-actions">
                                <button 
                                    className="action-btn deposit-btn"
                                    onClick={() => setActiveTab('deposit')}
                                >
                                    Пополнить
                                </button>
                                <button 
                                    className="action-btn withdraw-btn"
                                    onClick={() => setActiveTab('withdraw')}
                                    disabled={!balanceData || balanceData.available < 10}
                                >
                                    Вывести
                                </button>
                            </div>
                        </div>

                        {/* Быстрые действия */}
                        <div className="quick-actions">
                            <button 
                                className="quick-action"
                                onClick={() => checkDeposits()}
                                title="Проверить депозиты"
                            >
                                🔍 Проверить депозиты
                            </button>
                            <button 
                                className="quick-action"
                                onClick={() => loadAddressData()}
                                title="Обновить адрес"
                            >
                                🔄 Обновить адрес
                            </button>
                        </div>
                    </div>
                )}

                {/* Вкладка пополнения */}
                {activeTab === 'deposit' && addressData && (
                    <div className="deposit-tab">
                        <div className="deposit-card">
                            <div className="deposit-header">
                                <h3>Пополнение USDT</h3>
                                <div className="network-badge">{addressData.network}</div>
                            </div>
                            
                            <div className="address-info">
                                <div className="address-label">Ваш уникальный адрес:</div>
                                <div className="address-container">
                                    <code className="address-value">
                                        {addressData.address}
                                    </code>
                                    <button 
                                        className="copy-btn"
                                        onClick={() => copyToClipboard(addressData.address, 'Адрес')}
                                        title="Копировать адрес"
                                    >
                                        <CopySVG />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="qr-code-container">
                                {addressData.qrCode && (
                                    <>
                                        <img 
                                            src={addressData.qrCode} 
                                            alt="QR Code" 
                                            className="qr-code"
                                        />
                                        <div className="qr-hint">Отсканируйте для пополнения</div>
                                    </>
                                )}
                            </div>
                            
                            <div className="deposit-instructions">
                                <h4>Инструкция по пополнению:</h4>
                                <ol>
                                    <li>Откройте Trust Wallet или Binance</li>
                                    <li>Выберите USDT (BEP20 сеть)</li>
                                    <li>Отправьте USDT на адрес выше</li>
                                    <li>Минимальная сумма: 10 USDT</li>
                                    <li>Средства зачислятся автоматически</li>
                                </ol>
                                
                                <div className="deposit-warning">
                                    ⚠️ <strong>Внимание:</strong> Отправляйте только USDT в сети {addressData.network}!<br/>
                                    Другие монеты будут утеряны!
                                </div>
                            </div>
                            
                            <div className="deposit-actions">
                                <button 
                                    className="action-btn copy-all-btn"
                                    onClick={() => copyToClipboard(addressData.address, 'Адрес')}
                                >
                                    <CopySVG /> Копировать адрес
                                </button>
                                <button 
                                    className="action-btn back-btn"
                                    onClick={() => setActiveTab('balance')}
                                >
                                    Назад
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Вкладка вывода */}
                {activeTab === 'withdraw' && (
                    <div className="withdraw-tab">
                        <div className="withdraw-card">
                            <div className="withdraw-header">
                                <h3>Вывод USDT</h3>
                                {balanceData && (
                                    <div className="available-balance">
                                        Доступно: {formatUSDT(balanceData.available)}
                                    </div>
                                )}
                            </div>
                            
                            <form onSubmit={handleWithdrawSubmit} className="withdraw-form">
                                <div className="form-group">
                                    <label htmlFor="withdrawAmount">
                                        Сумма вывода (USDT)
                                    </label>
                                    <input
                                        id="withdrawAmount"
                                        type="number"
                                        step="0.01"
                                        min="10"
                                        max={balanceData?.available || 0}
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        placeholder="Введите сумму"
                                        required
                                    />
                                    <div className="amount-hint">
                                        Минимум: 10 USDT
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="withdrawNetwork">
                                        Сеть
                                    </label>
                                    <select
                                        id="withdrawNetwork"
                                        value={withdrawNetwork}
                                        onChange={(e) => setWithdrawNetwork(e.target.value)}
                                    >
                                        <option value="BEP20">BEP20 (Binance Smart Chain)</option>
                                        <option value="ERC20">ERC20 (Ethereum)</option>
                                        <option value="TRC20">TRC20 (Tron)</option>
                                    </select>
                                    <div className="network-hint">
                                        Убедитесь, что адрес поддерживает выбранную сеть
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="withdrawAddress">
                                        Адрес кошелька
                                    </label>
                                    <textarea
                                        id="withdrawAddress"
                                        value={withdrawAddress}
                                        onChange={(e) => setWithdrawAddress(e.target.value)}
                                        placeholder="Введите адрес USDT кошелька"
                                        rows="2"
                                        required
                                    />
                                    <div className="address-hint">
                                        Пример: 0x742d35Cc6634C0532925a3b844Bc9e
                                    </div>
                                </div>
                                
                                <div className="withdraw-info">
                                    <div className="info-item">
                                        <span>Комиссия сети:</span>
                                        <span>≈ $1-3</span>
                                    </div>
                                    <div className="info-item">
                                        <span>Время обработки:</span>
                                        <span>1-24 часа</span>
                                    </div>
                                </div>
                                
                                <div className="withdraw-actions">
                                    <button 
                                        type="submit"
                                        className="action-btn submit-btn"
                                        disabled={!withdrawAmount || !withdrawAddress}
                                    >
                                        📤 Отправить запрос на вывод
                                    </button>
                                    <button 
                                        type="button"
                                        className="action-btn back-btn"
                                        onClick={() => setActiveTab('balance')}
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Вкладка истории */}
                {activeTab === 'history' && (
                    <div className="history-tab">
                        <div className="history-card">
                            <div className="history-header">
                                <h3>История операций USDT</h3>
                                <button 
                                    className="refresh-btn"
                                    onClick={() => loadTransactions()}
                                    title="Обновить историю"
                                >
                                    🔄
                                </button>
                            </div>
                            
                            {transactions.length === 0 ? (
                                <div className="no-transactions">
                                    <div className="no-transactions-icon">📭</div>
                                    <p>Нет операций с USDT</p>
                                    <button 
                                        className="action-btn make-deposit"
                                        onClick={() => setActiveTab('deposit')}
                                    >
                                        Сделать первый депозит
                                    </button>
                                </div>
                            ) : (
                                <div className="transactions-list">
                                    {transactions.map((tx) => (
                                        <div key={tx._id} className="transaction-item">
                                            <div className="transaction-icon">
                                                {tx.type === 'deposit' ? '📥' : 
                                                 tx.type === 'withdrawal' ? '📤' : '💸'}
                                            </div>
                                            
                                            <div className="transaction-details">
                                                <div className="transaction-header">
                                                    <span className="transaction-type">
                                                        {tx.type === 'deposit' ? 'Пополнение' : 
                                                         tx.type === 'withdrawal' ? 'Вывод' : tx.type}
                                                    </span>
                                                    <span className="transaction-date">
                                                        {new Date(tx.createdAt).toLocaleDateString('ru-RU')}
                                                    </span>
                                                </div>
                                                
                                                <div className="transaction-description">
                                                    {tx.description || 'USDT транзакция'}
                                                </div>
                                                
                                                {tx.status && (
                                                    <div className={`transaction-status ${tx.status}`}>
                                                        {tx.status === 'completed' ? '✅ Завершено' : 
                                                         tx.status === 'pending' ? '⏳ В обработке' : 
                                                         tx.status === 'failed' ? '❌ Ошибка' : tx.status}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className={`transaction-amount ${tx.type === 'deposit' ? 'positive' : 'negative'}`}>
                                                {tx.type === 'deposit' ? '+' : '-'}{formatUSDT(tx.amount)}
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

export default USDTWallet;