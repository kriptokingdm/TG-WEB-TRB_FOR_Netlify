import React, { useState, useEffect } from 'react';
import './Wallet.css';

const API_BASE_URL = 'https://tethrab.shop';

function Wallet({ telegramId, showToast }) {
    const [balanceData, setBalanceData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Загрузка данных баланса
    const loadBalanceData = async () => {
        if (!telegramId) return;
        
        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/wallet/balance/${telegramId}`);
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setBalanceData(result.data);
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки баланса:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    // Обновление баланса
    const refreshBalance = async () => {
        setIsRefreshing(true);
        await loadBalanceData();
    };

    // Кнопка пополнения
    const handleDeposit = () => {
        // Здесь будет логика пополнения
        showToast?.('Функция пополнения скоро будет доступна', 'info');
    };

    // Кнопка вывода
    const handleWithdraw = () => {
        if (!balanceData || balanceData.available < 10) {
            showToast?.('Минимальная сумма для вывода $10', 'warning');
            return;
        }
        // Здесь будет логика вывода
        showToast?.('Функция вывода скоро будет доступна', 'info');
    };

    useEffect(() => {
        loadBalanceData();
    }, [telegramId]);

    const formatUSD = (num) => {
        const value = parseFloat(num || 0);
        return `$${value.toFixed(2)}`;
    };

    if (isLoading && !balanceData) {
        return (
            <div className="balance-loading">
                <div className="loading-spinner"></div>
                <p>Загрузка баланса...</p>
            </div>
        );
    }

    return (
        <div className="wallet-container">
            {balanceData && (
                <div className="balance-card">
                    <div className="balance-header">
                        <h3 className="balance-title">
                            <span>💰 Баланс</span>
                        </h3>
                        <button 
                            className={`refresh-balance-btn ${isRefreshing ? 'loading' : ''}`}
                            onClick={refreshBalance}
                            title="Обновить баланс"
                            disabled={isRefreshing}
                        >
                            {isRefreshing ? '⏳' : '🔄'}
                        </button>
                    </div>
                    
                    <div className="balance-amount">
                        <span className="balance-total">
                            {formatUSD(balanceData.total)}
                        </span>
                        <span className="balance-currency">USD</span>
                    </div>
                    
                    <div className="balance-details">
                        <div className="balance-item">
                            <span className="balance-label">Доступно:</span>
                            <span className="balance-value available">
                                {formatUSD(balanceData.available)}
                            </span>
                        </div>
                        <div className="balance-item">
                            <span className="balance-label">В эскроу:</span>
                            <span className="balance-value escrow">
                                {formatUSD(balanceData.escrow)}
                            </span>
                        </div>
                        <div className="balance-item">
                            <span className="balance-label">Всего пополнено:</span>
                            <span className="balance-value deposited">
                                {formatUSD(balanceData.totalDeposited)}
                            </span>
                        </div>
                        <div className="balance-item">
                            <span className="balance-label">Выведено:</span>
                            <span className="balance-value withdrawn">
                                {formatUSD(balanceData.totalWithdrawn)}
                            </span>
                        </div>
                    </div>
                    
                    <div className="balance-actions">
                        <button 
                            className="balance-action-btn deposit"
                            onClick={handleDeposit}
                        >
                            📥 Пополнить
                        </button>
                        <button 
                            className="balance-action-btn withdraw"
                            onClick={handleWithdraw}
                            disabled={!balanceData || balanceData.available < 10}
                            title={balanceData?.available < 10 ? "Минимум $10 для вывода" : ""}
                        >
                            📤 Вывести
                            {balanceData?.available < 10 && (
                                <span className="min-amount-badge">$10</span>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Wallet;