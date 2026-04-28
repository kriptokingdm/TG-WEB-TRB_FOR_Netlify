import React from 'react';

export default function P2POrder({ orderId, telegramUser, showToast, navigateTo }) {
    return (
        <div className="p2p-order-page">
            <div className="header">
                <button onClick={() => navigateTo('p2p')}>←</button>
                <h2>Объявление #{orderId}</h2>
                <div />
            </div>
            <div className="loading">Страница в разработке</div>
        </div>
    );
}
