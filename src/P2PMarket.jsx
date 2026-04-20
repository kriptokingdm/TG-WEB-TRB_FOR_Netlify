import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'https://tethrab.shop';

export default function P2PMarket({ telegramUser, showToast, navigateTo }) {
    const [activeTab, setActiveTab] = useState('buy');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [tradeAmount, setTradeAmount] = useState('');
    const [showModal, setShowModal] = useState(false);

    const userId = telegramUser?.id || 'demo';

    useEffect(() => {
        fetchOrders();
    }, [activeTab]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const type = activeTab === 'buy' ? 'sell' : 'buy';
            const res = await fetch(`${API_BASE_URL}/api/p2p/orders?type=${type}`);
            const data = await res.json();
            setOrders(data.orders || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const startTrade = async () => {
        if (!tradeAmount) return showToast('Введите сумму', 'error');

        try {
            const res = await fetch(`${API_BASE_URL}/api/p2p/trade/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: selectedOrder.id,
                    buyerId: userId,
                    amount: parseFloat(tradeAmount)
                })
            });

            const data = await res.json();

            if (data.success) {
                showToast('Сделка создана 🚀', 'success');
                setShowModal(false);
                setTradeAmount('');
            }
        } catch {
            showToast('Ошибка', 'error');
        }
    };

    return (
        <div className="tgp2p">

            {/* HEADER */}
            <div className="tgp2p-header">
                <h1>P2P Market</h1>
                <span>Buy & Sell USDT instantly</span>
            </div>

            {/* TABS */}
            <div className="tgp2p-tabs">
                <button 
                    className={activeTab === 'buy' ? 'active' : ''} 
                    onClick={() => setActiveTab('buy')}
                >
                    Купить
                </button>
                <button 
                    className={activeTab === 'sell' ? 'active' : ''} 
                    onClick={() => setActiveTab('sell')}
                >
                    Продать
                </button>
            </div>

            {/* LIST */}
            <div className="tgp2p-list">
                {loading ? (
                    <div className="tgp2p-loading" />
                ) : orders.map(o => (
                    <div 
                        key={o.id} 
                        className="tgp2p-card"
                        onClick={() => { setSelectedOrder(o); setShowModal(true); }}
                    >

                        <div className="tgp2p-top">
                            <div className="avatar">{o.user_name?.[0] || '👤'}</div>
                            <div>
                                <div className="name">{o.user_name}</div>
                                <div className="rating">⭐ {o.user_rating || 5}</div>
                            </div>
                        </div>

                        <div className="rate">
                            {o.rate} ₽
                        </div>

                        <div className="limits">
                            {o.min_amount} — {o.max_amount} USDT
                        </div>

                        <button className="action">
                            {activeTab === 'buy' ? 'Купить' : 'Продать'}
                        </button>

                    </div>
                ))}
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="tgp2p-modal" onClick={() => setShowModal(false)}>
                    <div className="box" onClick={e => e.stopPropagation()}>
                        <h3>Сделка</h3>

                        <input
                            placeholder="Сумма USDT"
                            value={tradeAmount}
                            onChange={e => setTradeAmount(e.target.value)}
                        />

                        <button onClick={startTrade}>
                            Начать
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}