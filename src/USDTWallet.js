import React, { useState, useEffect } from 'react';
import './USDTWallet.css';

const API_BASE_URL = 'https://tethrab.shop';

const CopySVG = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
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

    const formatUSDT = (n) => `${Number(n || 0).toFixed(2)} USDT`;

    const loadBalanceData = async () => {
        const r = await fetch(`${API_BASE_URL}/api/wallet/usdt/balance/${telegramId}`);
        const j = await r.json();
        if (j.success) setBalanceData(j.data);
    };

    const loadAddressData = async () => {
        const r = await fetch(`${API_BASE_URL}/api/wallet/usdt/user-address/${telegramId}`);
        const j = await r.json();
        if (j.success) setAddressData(j.data);
    };

    const loadTransactions = async () => {
        const r = await fetch(`${API_BASE_URL}/api/wallet/usdt/transactions/${telegramId}?limit=10`);
        const j = await r.json();
        if (j.success) setTransactions(j.data);
    };

    const loadAllData = async () => {
        setIsLoading(true);
        await Promise.all([loadBalanceData(), loadAddressData(), loadTransactions()]);
        setIsLoading(false);
        setIsRefreshing(false);
    };

    const refreshData = async () => {
        setIsRefreshing(true);
        await loadAllData();
        showToast?.('Обновлено', 'success');
    };

    const copyToClipboard = (t) => {
        navigator.clipboard.writeText(t);
        showToast?.('Скопировано', 'success');
    };

    useEffect(() => {
        if (telegramId) loadAllData();
    }, [telegramId]);

    if (isLoading && !balanceData) {
        return (
            <div className="usdt-loading">
                <div className="loading-spinner" />
                <p>Загрузка...</p>
            </div>
        );
    }

    return (
        <div className="usdt-wallet">

            <div className="usdt-tabs">
                {['balance','deposit','withdraw','history'].map(t => (
                    <button
                        key={t}
                        className={`usdt-tab ${activeTab === t ? 'active' : ''}`}
                        onClick={() => setActiveTab(t)}
                    >
                        {t === 'balance' && 'Баланс'}
                        {t === 'deposit' && 'Пополнить'}
                        {t === 'withdraw' && 'Вывести'}
                        {t === 'history' && 'История'}
                    </button>
                ))}
            </div>

            <div className="usdt-content">

                {activeTab === 'balance' && (
                    <div className="usdt-balance-card">
                        <div className="balance-header">
                            <h3>Баланс USDT</h3>
                            <button className="refresh-btn" onClick={refreshData}>
                                {isRefreshing ? '⏳' : '↻'}
                            </button>
                        </div>

                        <div className="balance-total">
                            {formatUSDT(balanceData?.total)}
                        </div>

                        <div className="balance-details">
                            <div className="balance-detail">
                                <span>Доступно</span>
                                <span className="available">{formatUSDT(balanceData?.available)}</span>
                            </div>
                            <div className="balance-detail">
                                <span>Пополнено</span>
                                <span>{formatUSDT(balanceData?.totalDeposited)}</span>
                            </div>
                            <div className="balance-detail">
                                <span>Выведено</span>
                                <span>{formatUSDT(balanceData?.totalWithdrawn)}</span>
                            </div>
                        </div>

                        <div className="balance-actions">
                            <button className="action-btn primary" onClick={() => setActiveTab('deposit')}>
                                Пополнить
                            </button>
                            <button className="action-btn secondary" onClick={() => setActiveTab('withdraw')}>
                                Вывести
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'deposit' && addressData && (
                    <div className="deposit-card">
                        <h3>Пополнение</h3>

                        <div className="address-container">
                            <code>{addressData.address}</code>
                            <button onClick={() => copyToClipboard(addressData.address)}>
                                <CopySVG />
                            </button>
                        </div>

                        <img src={addressData.qrCode} className="qr-code" alt="qr"/>

                        <div className="deposit-warning">
                            Отправляйте только USDT ({addressData.network})
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="history-card">
                        {transactions.map(tx => (
                            <div key={tx._id} className="transaction-item">
                                <div>{tx.type}</div>
                                <div className={tx.type === 'deposit' ? 'pos' : 'neg'}>
                                    {formatUSDT(tx.amount)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}

export default USDTWallet;
