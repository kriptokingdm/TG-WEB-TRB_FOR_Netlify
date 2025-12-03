import React from 'react';

const SupportChat = ({ orderId, onClose, exchangeData }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'white',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Чат поддержки</h2>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '24px' }}>✕</button>
      </div>
      <p>Заявка #{orderId}</p>
      <p>Здесь будет чат с поддержкой</p>
    </div>
  );
};

export default SupportChat;