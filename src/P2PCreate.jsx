// src/P2PCreate.jsx
import React, { useState } from 'react';

const API_BASE_URL = 'https://tethrab.shop';

export default function P2PCreate({ telegramUser, showToast, navigateTo }) {
    const [orderType, setOrderType] = useState('sell');
    const [amount, setAmount] = useState('');
    const [rate, setRate] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [terms, setTerms] = useState('');
    const [loading, setLoading] = useState(false);

    const userId = telegramUser?.id || '7879866656';

    const paymentMethodsList = [
        { value: 'bank_transfer', label: 'Банковский перевод', icon: '🏦' },
        { value: 'card', label: 'Банковская карта', icon: '💳' },
        { value: 'sbp', label: 'СБП', icon: '📱' },
        { value: 'cash', label: 'Наличные', icon: '💰' },
        { value: 'crypto', label: 'Криптовалюта', icon: '₿' }
    ];

    const handleSubmit = async () => {
        if (!amount || !rate) {
            showToast('Заполните сумму и курс', 'error');
            return;
        }

        if (paymentMethods.length === 0) {
            showToast('Выберите способ оплаты', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/p2p/order/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    type: orderType,
                    amount: parseFloat(amount),
                    rate: parseFloat(rate),
                    min_amount: minAmount ? parseFloat(minAmount) : 10,
                    max_amount: maxAmount ? parseFloat(maxAmount) : parseFloat(amount),
                    payment_methods: paymentMethods,
                    terms: terms || null
                })
            });
            const data = await res.json();
            
            if (data.success) {
                showToast('✅ Объявление создано!', 'success');
                navigateTo('p2p');
            } else {
                showToast(data.error || 'Ошибка создания', 'error');
            }
        } catch (error) {
            showToast('Ошибка соединения', 'error');
        } finally {
            setLoading(false);
        }
    };

    const togglePaymentMethod = (method) => {
        setPaymentMethods(prev =>
            prev.includes(method)
                ? prev.filter(m => m !== method)
                : [...prev, method]
        );
    };

    return (
        <div className="tg-p2p-create">
            <div className="tg-create-header">
                <button className="tg-back-btn" onClick={() => navigateTo('p2p')}>←</button>
                <h1>Создание объявления</h1>
            </div>

            <div className="tg-create-content">
                <div className="tg-create-type">
                    <button 
                        className={`tg-type-btn ${orderType === 'sell' ? 'active sell' : ''}`}
                        onClick={() => setOrderType('sell')}
                    >
                        💰 Продажа USDT
                    </button>
                    <button 
                        className={`tg-type-btn ${orderType === 'buy' ? 'active buy' : ''}`}
                        onClick={() => setOrderType('buy')}
                    >
                        🛒 Покупка USDT
                    </button>
                </div>

                <div className="tg-create-field">
                    <label>Сумма (USDT)</label>
                    <input 
                        type="number" 
                        placeholder="Например: 1000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </div>

                <div className="tg-create-field">
                    <label>Курс (RUB за 1 USDT)</label>
                    <input 
                        type="number" 
                        placeholder="Например: 90"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                    />
                </div>

                <div className="tg-create-row">
                    <div className="tg-create-field half">
                        <label>Мин. сумма</label>
                        <input 
                            type="number" 
                            placeholder="10"
                            value={minAmount}
                            onChange={(e) => setMinAmount(e.target.value)}
                        />
                    </div>
                    <div className="tg-create-field half">
                        <label>Макс. сумма</label>
                        <input 
                            type="number" 
                            placeholder={amount || '1000'}
                            value={maxAmount}
                            onChange={(e) => setMaxAmount(e.target.value)}
                        />
                    </div>
                </div>

                <div className="tg-create-field">
                    <label>Способы оплаты</label>
                    <div className="tg-payment-grid">
                        {paymentMethodsList.map(method => (
                            <button
                                key={method.value}
                                className={`tg-payment-option ${paymentMethods.includes(method.value) ? 'selected' : ''}`}
                                onClick={() => togglePaymentMethod(method.value)}
                            >
                                {method.icon} {method.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="tg-create-field">
                    <label>Условия сделки (необязательно)</label>
                    <textarea 
                        placeholder="Например: Встреча в центре, перевод на карту..."
                        value={terms}
                        onChange={(e) => setTerms(e.target.value)}
                        rows="3"
                    />
                </div>

                <button 
                    className="tg-submit-btn"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? 'Создание...' : '✅ Создать объявление'}
                </button>
            </div>
        </div>
    );
}