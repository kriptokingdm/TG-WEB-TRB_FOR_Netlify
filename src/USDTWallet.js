// USDTWalletTG.js - Telegram Web App style (С MEMO И ВИБРАЦИЕЙ)
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './USDTWallet.css';

const API_BASE_URL = 'https://tethrab.shop';

// --- helpers ---------------------------------------------------------------
function withTimeout(ms, controller) {
  const id = setTimeout(() => controller.abort(), ms);
  return () => clearTimeout(id);
}

// Функция для вибрации
function vibrate(pattern = 10) {
  if (window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(pattern);
  }
}

async function fetchJSON(url, { method = 'GET', headers, body, timeoutMs = 8000 } = {}) {
  const controller = new AbortController();
  const clear = withTimeout(timeoutMs, controller);

  try {
    const res = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal,
      credentials: 'include',
    });

    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    return { ok: res.ok, status: res.status, json, raw: text };
  } catch (e) {
    const aborted = e?.name === 'AbortError';
    return { ok: false, status: aborted ? 408 : 0, json: null, error: e };
  } finally {
    clear();
  }
}

function formatUSDT(amount) {
  const n = Number(amount || 0);
  return `${(Number.isFinite(n) ? n : 0).toFixed(2)} USDT`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// --- component -------------------------------------------------------------
export default function USDTWalletTG({ telegramId, onBack }) {
  const [activeTab, setActiveTab] = useState('balance');

  // 👇 Инициализируем с дефолтными значениями
  const [balance, setBalance] = useState(0);
  
  const [addressData, setAddressData] = useState({
    address: '',
    memo: '', // ДОБАВИЛИ MEMO
    network: 'BEP20', // Меняем на BEP20 по умолчанию
    currency: 'USDT',
    qrCode: '',
    min_deposit: 10,
    max_deposit: 10000,
    instructions: ''
  });

  const [withdrawals, setWithdrawals] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [withdrawData, setWithdrawData] = useState({
    amount: '',
    address: '',
    network: 'BEP20', // Меняем на BEP20
  });

  const [showQR, setShowQR] = useState(false);
  const [toast, setToast] = useState(null);

  const toastTimerRef = useRef(null);

  const tgColors = useMemo(
    () => ({
      bg: 'var(--tg-theme-bg-color, #ffffff)',
      secondaryBg: 'var(--tg-theme-secondary-bg-color, #f1f1f1)',
      text: 'var(--tg-theme-text-color, #000000)',
      hint: 'var(--tg-theme-hint-color, #8e8e93)',
      link: 'var(--tg-theme-link-color, #3390ec)',
      button: 'var(--tg-theme-button-color, #3390ec)',
      buttonText: 'var(--tg-theme-button-text-color, #ffffff)',
    }),
    []
  );

  const showToastMessage = (message, type = 'info') => {
    vibrate(10); // ВИБРАЦИЯ при тосте
    setToast({ message, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2200);
  };

  // --- API loaders ---------------------------------------------------------
  const loadData = async ({ silent = false } = {}) => {
    if (!telegramId) {
      console.log('❌ Нет telegramId');
      return;
    }

    console.log(`📥 Загрузка данных кошелька для ${telegramId}...`);

    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      // Параллельная загрузка
      const [bal, addr, wds] = await Promise.allSettled([
        fetchJSON(`${API_BASE_URL}/api/wallet/usdt/balance/${telegramId}`, { timeoutMs: 8000 }),
        fetchJSON(`${API_BASE_URL}/api/wallet/usdt/user-address/${telegramId}?network=BEP20`, { timeoutMs: 8000 }),
        fetchJSON(`${API_BASE_URL}/api/wallet/withdrawals/${telegramId}`, { timeoutMs: 8000 }),
      ]);

      console.log('📊 Ответ баланса:', bal.status === 'fulfilled' ? bal.value.json : 'Ошибка');
      console.log('📊 Ответ адреса:', addr.status === 'fulfilled' ? addr.value.json : 'Ошибка');
      console.log('📊 Ответ выводов:', wds.status === 'fulfilled' ? wds.value.json : 'Ошибка');

      // Обработка баланса
      if (bal.status === 'fulfilled' && bal.value.ok && bal.value.json?.success) {
        const data = bal.value.json;
        setBalance(data.balance || 0);
      } else {
        console.log('⚠️ Не удалось загрузить баланс');
      }

      // Обработка адреса - ТЕПЕРЬ С MEMO!
      if (addr.status === 'fulfilled' && addr.value.ok && addr.value.json?.success) {
        const data = addr.value.json;
        setAddressData({
          address: data.address || '',
          memo: data.memo || '', // СОХРАНЯЕМ MEMO
          network: data.network || 'BEP20',
          currency: data.currency || 'USDT',
          qrCode: data.qrCode || '',
          min_deposit: data.min_deposit || 10,
          max_deposit: data.max_deposit || 10000,
          instructions: data.instructions || `Отправляйте USDT (BEP20) на адрес ${data.address} с комментарием (memo): ${data.memo}`
        });
      } else {
        console.log('⚠️ Не удалось загрузить адрес');
      }

      // Обработка выводов
      if (wds.status === 'fulfilled' && wds.value.ok && wds.value.json?.success) {
        const data = wds.value.json;
        const list = data.withdrawals || [];
        setWithdrawals(list);
        console.log(`✅ Загружено ${list.length} выводов`);
      } else {
        console.log('⚠️ Не удалось загрузить выводы');
        setWithdrawals([]);
      }

    } catch (e) {
      console.error('❌ loadData error:', e);
      showToastMessage('Ошибка загрузки', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData({ silent: false });
    
    // автообновление баланса раз в 15 сек
    const id = setInterval(() => loadData({ silent: true }), 15000);
    return () => clearInterval(id);
  }, [telegramId]);

  // --- actions -------------------------------------------------------------
  const copyToClipboard = async (text, type = 'адрес') => {
    if (!text) return;
    vibrate(5); // ВИБРАЦИЯ при копировании
    try {
      await navigator.clipboard.writeText(text);
      showToastMessage(`${type} скопирован`, 'ok');
    } catch {
      showToastMessage('Не удалось скопировать', 'error');
    }
  };

  const copyAll = () => {
    vibrate(8);
    const text = `Address: ${addressData.address}\nMemo: ${addressData.memo}`;
    copyToClipboard(text, 'адрес и memo');
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    vibrate(10);

    const amount = Number(withdrawData.amount);
    if (!amount || amount < 10) {
      showToastMessage('Минимальная сумма вывода: 10 USDT', 'warn');
      return;
    }

    if (amount > balance) {
      showToastMessage(`Недостаточно средств. Доступно: ${formatUSDT(balance)}`, 'warn');
      return;
    }

    if (!withdrawData.address || withdrawData.address.trim().length < 20) {
      showToastMessage('Введите корректный адрес (минимум 20 символов)', 'warn');
      return;
    }

    try {
      const res = await fetchJSON(`${API_BASE_URL}/api/wallet/withdrawal/request`, {
        method: 'POST',
        timeoutMs: 10000,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: telegramId,
          amount: withdrawData.amount,
          address: withdrawData.address.trim(),
          network: withdrawData.network,
        }),
      });

      const data = res.json;

      if (res.ok && data?.success) {
        showToastMessage('Запрос на вывод создан ✅', 'ok');
        setWithdrawData({ amount: '', address: '', network: 'BEP20' });
        await loadData({ silent: true });
        setActiveTab('history');
      } else {
        showToastMessage(data?.error || 'Ошибка вывода', 'error');
      }
    } catch (err) {
      console.error('❌ Ошибка вывода:', err);
      showToastMessage('Ошибка при создании запроса', 'error');
    }
  };

  const onRefresh = () => {
    vibrate(5);
    loadData({ silent: true });
  };

  const onTabChange = (tab) => {
    vibrate(5);
    setActiveTab(tab);
  };

  // --- UI states -----------------------------------------------------------
  if (isLoading && activeTab === 'balance') {
    return (
      <div className="tg-loading" style={{ background: tgColors.bg }}>
        <div className="tg-spinner" style={{ borderColor: tgColors.hint }} />
        <p style={{ color: tgColors.hint }}>Загрузка кошелька...</p>
      </div>
    );
  }

  return (
    <div className="tg-container" style={{ backgroundColor: tgColors.bg, color: tgColors.text }}>
      {/* Toast */}
      {toast && (
        <div className={`tg-toast tg-toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="tg-header" style={{ backgroundColor: tgColors.bg, borderBottomColor: tgColors.secondaryBg }}>
        <button className="tg-back-btn" onClick={() => { vibrate(5); onBack(); }} aria-label="Назад">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5" stroke={tgColors.text} strokeWidth="2" strokeLinecap="round" />
            <path d="M12 19L5 12L12 5" stroke={tgColors.text} strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <h2 className="tg-title" style={{ color: tgColors.text }}>
          USDT Кошелёк
        </h2>

        <button className="tg-icon-btn" onClick={onRefresh} aria-label="Обновить">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C15.3019 3 18.1885 4.77814 19.7545 7.42909"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path d="M21 3V7.5H16.5" stroke="currentColor" strokeWidth="2" />
          </svg>
          {isRefreshing ? <span className="tg-dot" /> : null}
        </button>
      </div>

      {/* Tabs */}
      <div className="tg-tabs" style={{ borderBottomColor: tgColors.secondaryBg }}>
        {[
          { key: 'balance', label: '💎 Баланс' },
          { key: 'deposit', label: '📥 Пополнить' },
          { key: 'withdraw', label: '📤 Вывести' },
          { key: 'history', label: '📋 История' },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`tg-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => onTabChange(tab.key)}
            style={{
              color: activeTab === tab.key ? tgColors.button : tgColors.hint,
              borderBottomColor: activeTab === tab.key ? tgColors.button : 'transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="tg-content">
        {/* BALANCE */}
        {activeTab === 'balance' && (
          <div className="tg-section">
            <div className="tg-card" style={{ backgroundColor: tgColors.secondaryBg }}>
              <div className="tg-balance-main">
                <div className="tg-balance-total" style={{ color: tgColors.text }}>
                  {formatUSDT(balance)}
                </div>
                <div className="tg-balance-label" style={{ color: tgColors.hint }}>
                  Баланс USDT
                </div>
              </div>

              <div className="tg-balance-details">
                <div className="tg-balance-row" style={{ borderBottomColor: 'rgba(0,0,0,0.06)' }}>
                  <span style={{ color: tgColors.hint }}>Доступно для вывода</span>
                  <span style={{ color: tgColors.text, fontWeight: 600 }}>{formatUSDT(balance)}</span>
                </div>
              </div>

              <div className="tg-actions">
                <button
                  className="tg-action-btn primary"
                  onClick={() => onTabChange('deposit')}
                  style={{ backgroundColor: tgColors.button, color: tgColors.buttonText }}
                >
                  Пополнить
                </button>

                <button
                  className="tg-action-btn secondary"
                  onClick={() => onTabChange('withdraw')}
                  disabled={balance < 10}
                  style={{ borderColor: tgColors.hint, color: tgColors.text }}
                >
                  Вывести
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DEPOSIT - ТЕПЕРЬ С MEMO! */}
        {/* DEPOSIT - БЕЗ MEMO */}
{/* DEPOSIT - ПРОСТАЯ ВЕРСИЯ БЕЗ MEMO */}
{/* DEPOSIT - ФИНАЛЬНАЯ ВЕРСИЯ */}
{activeTab === 'deposit' && (
  <div className="tg-section">
    <div className="tg-card" style={{ backgroundColor: tgColors.secondaryBg }}>
      <h3 style={{ color: tgColors.text, marginBottom: 20 }}>Пополнение USDT</h3>

      <div className="tg-address-container">
        <div className="tg-address-label" style={{ color: tgColors.hint }}>
          Ваш адрес для пополнения (BEP20)
        </div>
        <div className="tg-address-value" style={{ borderColor: 'rgba(0,0,0,0.10)' }}>
          <code style={{ color: tgColors.text, wordBreak: 'break-all' }}>
            {addressData?.address || 'Загрузка...'}
          </code>
          <button
            className="tg-copy-btn"
            onClick={() => copyToClipboard(addressData?.address || '', 'адрес')}
            style={{ color: tgColors.button }}
            disabled={!addressData?.address}
          >
            Копировать
          </button>
        </div>
      </div>

      <div className="tg-instructions" style={{ borderColor: 'rgba(0,0,0,0.10)', marginTop: '20px' }}>
        <h4 style={{ color: tgColors.text, marginBottom: 12 }}>📝 Инструкция</h4>
        <ol style={{ color: tgColors.text, fontSize: 14, lineHeight: 1.6 }}>
          <li>Отправляйте только USDT в сети BEP20</li>
          <li>Минимальная сумма: {addressData?.min_deposit || 10} USDT</li>
          <li>Средства зачисляются автоматически</li>
        </ol>
      </div>
    </div>
  </div>
)}

        {/* WITHDRAW - ТЕПЕРЬ BEP20 ПО УМОЛЧАНИЮ */}
        {activeTab === 'withdraw' && (
          <div className="tg-section">
            <div className="tg-card" style={{ backgroundColor: tgColors.secondaryBg }}>
              <h3 style={{ color: tgColors.text, marginBottom: 20 }}>Вывод USDT</h3>

              <div className="tg-withdraw-info" style={{ color: tgColors.hint, marginBottom: 20 }}>
                Доступно: <span style={{ color: tgColors.text, fontWeight: 600 }}>{formatUSDT(balance)}</span>
              </div>

              <form onSubmit={handleWithdraw} className="tg-form">
                <div className="tg-form-group">
                  <label style={{ color: tgColors.hint, fontSize: 14 }}>Сумма (USDT)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="10"
                    max={balance}
                    value={withdrawData.amount}
                    onChange={(e) => setWithdrawData({ ...withdrawData, amount: e.target.value })}
                    placeholder="10.00"
                    style={{ backgroundColor: tgColors.bg, color: tgColors.text, borderColor: 'rgba(0,0,0,0.18)' }}
                    required
                  />
                  <div className="tg-form-hint" style={{ color: tgColors.hint }}>
                    Минимум: 10 USDT
                  </div>
                </div>

                <div className="tg-form-group">
                  <label style={{ color: tgColors.hint, fontSize: 14 }}>Сеть</label>
                  <select
                    value={withdrawData.network}
                    onChange={(e) => setWithdrawData({ ...withdrawData, network: e.target.value })}
                    style={{ backgroundColor: tgColors.bg, color: tgColors.text, borderColor: 'rgba(0,0,0,0.18)' }}
                  >
                    <option value="BEP20">BEP20 (Binance) - рекомендуется</option>
                    <option value="TRC20">TRC20 (Tron)</option>
                    <option value="ERC20">ERC20 (Ethereum) - дорого</option>
                  </select>
                </div>

                <div className="tg-form-group">
                  <label style={{ color: tgColors.hint, fontSize: 14 }}>Адрес кошелька</label>
                  <textarea
                    value={withdrawData.address}
                    onChange={(e) => setWithdrawData({ ...withdrawData, address: e.target.value })}
                    placeholder="Введите адрес для вывода"
                    rows="3"
                    style={{ backgroundColor: tgColors.bg, color: tgColors.text, borderColor: 'rgba(0,0,0,0.18)' }}
                    required
                  />
                </div>

                <div className="tg-withdraw-note" style={{ color: tgColors.hint, fontSize: 13 }}>
                  ⚠️ Проверьте адрес перед отправкой. Ошибки необратимы.
                </div>

                <button
                  type="submit"
                  className="tg-submit-btn"
                  disabled={!withdrawData.amount || !withdrawData.address}
                  style={{
                    backgroundColor: withdrawData.amount && withdrawData.address ? tgColors.button : tgColors.hint,
                    color: tgColors.buttonText,
                    opacity: withdrawData.amount && withdrawData.address ? 1 : 0.5,
                  }}
                >
                  📤 Отправить на вывод
                </button>
              </form>
            </div>
          </div>
        )}

        {/* HISTORY */}
        {activeTab === 'history' && (
          <div className="tg-section">
            <div className="tg-card" style={{ backgroundColor: tgColors.secondaryBg }}>
              <h3 style={{ color: tgColors.text, marginBottom: 20 }}>История операций</h3>

              {!withdrawals || withdrawals.length === 0 ? (
                <div className="tg-empty" style={{ color: tgColors.hint }}>
                  📭 Нет операций
                </div>
              ) : (
                <div className="tg-history-list">
                  {withdrawals.map((wd) => (
                    <div key={wd.id || Math.random()} className="tg-history-item" style={{ borderColor: 'rgba(0,0,0,0.10)' }}>
                      <div className="tg-history-icon">📤</div>

                      <div className="tg-history-details">
                        <div className="tg-history-top">
                          <span style={{ color: tgColors.text, fontWeight: 600 }}>Вывод USDT</span>
                          <span style={{ color: tgColors.hint, fontSize: 12 }}>{formatDate(wd.created_at)}</span>
                        </div>

                        <div className="tg-history-address" style={{ color: tgColors.hint }}>
                          {wd.address ? wd.address.slice(0, 20) : '—'}
                        </div>

                        <div className={`tg-history-status status-${wd.status || 'pending'}`}>
                          {(!wd.status || wd.status === 'pending') && '⏳ Ожидание'}
                          {wd.status === 'completed' && '✅ Выполнено'}
                          {wd.status === 'rejected' && '❌ Отклонено'}
                          {wd.status === 'processing' && '🔄 В обработке'}
                        </div>
                      </div>

                      <div className="tg-history-amount">
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