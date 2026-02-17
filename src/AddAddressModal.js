// AddAddressModal.js
import React, { useState } from 'react';
import { 
  TRC20Icon, ERC20Icon, BEP20Icon, SolanaIcon,
  BinanceIcon, BybitIcon, MEXCIcon, OKXIcon, BitGetIcon 
} from './CryptoIcons';

const CopyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
  </svg>
);

const AddAddressModal = ({ isOpen, onClose, onSave }) => {
  const [tab, setTab] = useState('wallet'); // 'wallet' или 'uid'
  const [step, setStep] = useState(1);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [address, setAddress] = useState('');
  const [walletName, setWalletName] = useState('');
  const [addresses, setAddresses] = useState([]);

  const networks = [
    { value: 'TRC20', name: 'TRC20', icon: <TRC20Icon /> },
    { value: 'ERC20', name: 'ERC20', icon: <ERC20Icon /> },
    { value: 'BEP20', name: 'BEP20', icon: <BEP20Icon /> },
    { value: 'SOLANA', name: 'Solana', icon: <SolanaIcon /> },
  ];

  const exchanges = [
    { value: 'Binance', name: 'Binance', icon: <BinanceIcon />, badge: 'Binance' },
    { value: 'Bybit', name: 'Bybit', icon: <BybitIcon />, badge: 'BYBIT' },
    { value: 'MEXC', name: 'MEXC', icon: <MEXCIcon />, badge: 'МЕХС' },
    { value: 'OKX', name: 'OKX', icon: <OKXIcon />, badge: 'OKX' },
    { value: 'BitGet', name: 'BitGet', icon: <BitGetIcon />, badge: 'BITGET' },
  ];

  const handleNetworkSelect = (network) => {
    setSelectedNetwork(network);
    setStep(2);
  };

  const handleExchangeSelect = (exchange) => {
    setSelectedExchange(exchange);
    setStep(2);
  };

  const handleAddAddress = () => {
    if (!address || address.length < (tab === 'wallet' ? 10 : 5)) {
      alert('Введите корректные данные');
      return;
    }

    const newAddress = {
      id: Date.now(),
      type: tab,
      network: tab === 'wallet' ? selectedNetwork : null,
      exchange: tab === 'uid' ? selectedExchange : null,
      address: address,
      name: walletName || (tab === 'wallet' ? `${selectedNetwork} кошелек` : `${selectedExchange} UID`),
      icon: tab === 'wallet' 
        ? networks.find(n => n.value === selectedNetwork)?.icon 
        : exchanges.find(e => e.value === selectedExchange)?.icon
    };

    setAddresses([...addresses, newAddress]);
    if (onSave) onSave(newAddress);
    setAddress('');
    setWalletName('');
    setStep(1);
    setSelectedNetwork(null);
    setSelectedExchange(null);
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

        {/* Вкладки */}
        <div className="modal-tabs">
          <button 
            className={`modal-tab ${tab === 'wallet' ? 'active' : ''}`}
            onClick={() => {
              setTab('wallet');
              setStep(1);
              setSelectedNetwork(null);
            }}
          >
             Адрес кошелька
          </button>
          <button 
            className={`modal-tab ${tab === 'uid' ? 'active' : ''}`}
            onClick={() => {
              setTab('uid');
              setStep(1);
              setSelectedExchange(null);
            }}
          >
             UID перевод
          </button>
        </div>

        {step === 1 ? (
          // ШАГ 1: ВЫБОР
          <div className="network-list">
            <div className="selector-label">
              {tab === 'wallet' ? 'Выберите сеть' : 'Выберите биржу'}
            </div>
            {(tab === 'wallet' ? networks : exchanges).map(item => (
              <div 
                key={item.value}
                className="network-item"
                onClick={() => tab === 'wallet' 
                  ? handleNetworkSelect(item.value) 
                  : handleExchangeSelect(item.value)
                }
              >
                <span className="network-icon">{item.icon}</span>
                <span className="network-name">{item.name}</span>
                {item.badge && <span className="network-badge">{item.badge}</span>}
                <span className="network-arrow">›</span>
              </div>
            ))}
          </div>
        ) : (
          // ШАГ 2: ВВОД ДАННЫХ
          <>
            <div className="selected-info">
              <span className="selected-icon">
                {tab === 'wallet' 
                  ? networks.find(n => n.value === selectedNetwork)?.icon
                  : exchanges.find(e => e.value === selectedExchange)?.icon
                }
              </span>
              <span className="selected-name">
                {tab === 'wallet' ? selectedNetwork : selectedExchange}
              </span>
            </div>

            <div className="input-group">
              <label>
                {tab === 'wallet' ? 'Введите адрес кошелька' : 'Введите UID биржи'}
              </label>
              <input
                type="text"
                placeholder={tab === 'wallet' 
                  ? "Введите адрес кошелька" 
                  : "Введите UID биржи"
                }
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="modal-input"
              />
            </div>

            <div className="input-group">
              <label>Введите название (опционально)</label>
              <input
                type="text"
                placeholder={tab === 'wallet' 
                  ? "Например: Основной кошелек" 
                  : "Например: Основной кошелек"
                }
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
            <h3>Сохраненные адреса:</h3>
            {addresses.map(addr => (
              <div key={addr.id} className="saved-address-item">
                <div className="saved-address-info">
                  <span className="saved-icon">{addr.icon}</span>
                  <div className="saved-details">
                    <span className="saved-name">"{addr.name}"</span>
                    <span className="saved-hash">
                      {addr.address.length > 20 
                        ? `${addr.address.slice(0, 8)}...${addr.address.slice(-8)}`
                        : addr.address
                      }
                    </span>
                  </div>
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