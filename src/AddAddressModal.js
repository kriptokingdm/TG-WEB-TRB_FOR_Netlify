// AddAddressModal.js - исправленная версия
import React, { useState } from 'react';

const CopyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_2140_242)">
      <path d="M14 2H6C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" fill="white"/>
    </g>
    <defs>
      <clipPath id="clip0_2140_242">
        <rect width="24" height="24" fill="white"/>
      </clipPath>
    </defs>
  </svg>
);

const AddAddressModal = ({ isOpen, onClose, onSave }) => {
  const [step, setStep] = useState(1);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [address, setAddress] = useState('');
  const [walletName, setWalletName] = useState('');
  const [addresses, setAddresses] = useState([]);

  const networks = [
    { value: 'TRC20', name: 'TRC20', icon: '🔷' },
    { value: 'ERC20', name: 'ERC20', icon: '💠' },
    { value: 'BEP20', name: 'BEP20', icon: '🔶' },
    { value: 'SOLANA', name: 'Solana', icon: '🟣' },
  ];

  const handleNetworkSelect = (network) => {
    setSelectedNetwork(network);
    setStep(2);
  };

  const handleAddAddress = () => {
    if (!address || address.length < 10) {
      alert('Введите корректный адрес');
      return;
    }

    const newAddress = {
      id: Date.now(),
      network: selectedNetwork,
      address: address,
      name: walletName || `${selectedNetwork} кошелек`,
      icon: networks.find(n => n.value === selectedNetwork)?.icon || '🔷'
    };

    setAddresses([...addresses, newAddress]);
    if (onSave) onSave(newAddress);
    setAddress('');
    setWalletName('');
    setStep(1);
    setSelectedNetwork(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Адрес для получения USDT</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {step === 1 ? (
          // ШАГ 1: ВЫБОР СЕТИ
          <div className="network-list">
            {networks.map(network => (
              <div 
                key={network.value}
                className="network-item"
                onClick={() => handleNetworkSelect(network.value)}
              >
                <span className="network-icon">{network.icon}</span>
                <span className="network-name">{network.name}</span>
                <span className="network-arrow">›</span>
              </div>
            ))}
          </div>
        ) : (
          // ШАГ 2: ВВОД ДАННЫХ
          <>
            <div className="selected-network-info">
              <span className="selected-network-icon">
                {networks.find(n => n.value === selectedNetwork)?.icon}
              </span>
              <span className="selected-network-name">{selectedNetwork}</span>
            </div>

            <div className="input-group">
              <label>Введите адрес кошелька</label>
              <input
                type="text"
                placeholder="Введите адрес кошелька"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="modal-input"
              />
            </div>

            <div className="input-group">
              <label>Введите название кошелька (опционально)</label>
              <input
                type="text"
                placeholder="Например: Основной кошелек"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                className="modal-input"
              />
            </div>

            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setStep(1)}>
                Назад
              </button>
              <button className="modal-btn save" onClick={handleAddAddress}>
                Добавить адрес
              </button>
            </div>
          </>
        )}

        {/* Сохраненные адреса */}
        {addresses.length > 0 && step === 1 && (
          <div className="saved-addresses">
            <h3>Сохраненные адреса</h3>
            {addresses.map(addr => (
              <div key={addr.id} className="saved-address-item">
                <div className="saved-address-info">
                  <span className="saved-network">{addr.icon} {addr.network}</span>
                  <span className="saved-name">"{addr.name}"</span>
                  <span className="saved-hash">
                    {addr.address.slice(0, 6)}...{addr.address.slice(-4)}
                  </span>
                </div>
                <button className="saved-copy" onClick={() => navigator.clipboard.writeText(addr.address)}>
                  <CopyIcon />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddAddressModal;