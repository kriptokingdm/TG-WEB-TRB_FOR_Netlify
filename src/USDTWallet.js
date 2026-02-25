// USDTWalletTG.js
// Telegram Web App стиль "как на скрине" (Roboto, мемо/вибрация сохранены, логика/бекенд не ломаем)

import React, { useEffect, useMemo, useRef, useState } from 'react';
import './USDTWallet.css';

const API_BASE_URL = 'https://tethrab.shop';

// --- helpers ---------------------------------------------------------------
function withTimeout(ms, controller) {
  const id = setTimeout(() => controller.abort(), ms);
  return () => clearTimeout(id);
}

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

function formatMoneyUSD(amount) {
  const n = Number(amount || 0);
  const v = Number.isFinite(n) ? n : 0;
  return `$ ${v.toFixed(2)}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  // под скрин: 12.10.2026 13:25
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
}

const formatAddress = (address) => {
  if (!address) return '';
  if (address.length <= 10) return address;
  return `${address.slice(0, 7)}...${address.slice(-4)}`;
};

// --- icons ----------------------------------------------------------------
function IconRefresh({ color = 'currentColor' }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C15.3019 3 18.1885 4.77814 19.7545 7.42909"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M21 3V7.5H16.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconArrowDown({ color = 'currentColor' }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4V16" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M7 12L12 17L17 12" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconArrowUp({ color = 'currentColor' }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 20V8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M7 12L12 7L17 12" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FilterSvg() {
  // твой SVG 1:1
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g clipPath="url(#clip0_2237_409)">
        <path
          d="M11.6667 21H16.3333V18.6667H11.6667V21ZM3.5 7V9.33333H24.5V7H3.5ZM7 15.1667H21V12.8333H7V15.1667Z"
          fill="white"
        />
      </g>
      <defs>
        <clipPath id="clip0_2237_409">
          <rect width="28" height="28" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

// --- component -------------------------------------------------------------
export default function USDTWalletTG({ telegramId, onBack }) {
  // screen: "home" как на скрине + отдельные вкладки deposit/withdraw/history
  const [activeTab, setActiveTab] = useState('home');

  const [balance, setBalance] = useState(0);

  const [addressData, setAddressData] = useState({
    address: '',
    memo: '',
    network: 'BEP20',
    currency: 'USDT',
    qrCode: '',
    min_deposit: 10,
    max_deposit: 10000,
    instructions: '',
  });

  const [withdrawals, setWithdrawals] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [withdrawData, setWithdrawData] = useState({
    amount: '',
    address: '',
    network: 'BEP20',
  });

  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const tgColors = useMemo(
    () => ({
      bg: 'var(--tg-theme-bg-color, #0f1115)',
      secondaryBg: 'var(--tg-theme-secondary-bg-color, #171a22)',
      text: 'var(--tg-theme-text-color, #ffffff)',
      hint: 'var(--tg-theme-hint-color, rgba(255,255,255,0.60))',
      link: 'var(--tg-theme-link-color, #3390ec)',
      button: 'var(--tg-theme-button-color, #2b66ff)',
      buttonText: 'var(--tg-theme-button-text-color, #ffffff)',
    }),
    []
  );

  const showToastMessage = (message, type = 'info') => {
    vibrate(10);
    setToast({ message, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2200);
  };

  // --- saved addresses -----------------------------------------------------
  useEffect(() => {
    const saved = localStorage.getItem('userCryptoAddresses');
    if (saved) {
      try {
        const addresses = JSON.parse(saved);
        setSavedAddresses(addresses || []);
      } catch (e) {
        console.error('Ошибка загрузки адресов:', e);
      }
    }
  }, []);

  // --- API loaders ---------------------------------------------------------
  const loadData = async ({ silent = false } = {}) => {
    if (!telegramId) return;

    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [bal, addr, wds] = await Promise.allSettled([
        fetchJSON(`${API_BASE_URL}/api/wallet/usdt/balance/${telegramId}`, { timeoutMs: 8000 }),
        fetchJSON(`${API_BASE_URL}/api/wallet/usdt/user-address/${telegramId}?network=BEP20`, { timeoutMs: 8000 }),
        fetchJSON(`${API_BASE_URL}/api/wallet/withdrawals/${telegramId}`, { timeoutMs: 8000 }),
      ]);

      if (bal.status === 'fulfilled' && bal.value.ok && bal.value.json?.success) {
        const data = bal.value.json;
        setBalance(data.balance || 0);
      }

      if (addr.status === 'fulfilled' && addr.value.ok && addr.value.json?.success) {
        const data = addr.value.json;
        setAddressData({
          address: data.address || '',
          memo: data.memo || '',
          network: data.network || 'BEP20',
          currency: data.currency || 'USDT',
          qrCode: data.qrCode || '',
          min_deposit: data.min_deposit || 10,
          max_deposit: data.max_deposit || 10000,
          instructions: data.instructions || `Отправляйте USDT (BEP20) на адрес ${data.address}`,
        });
      }

      if (wds.status === 'fulfilled' && wds.value.ok && wds.value.json?.success) {
        const data = wds.value.json;
        const list = data.withdrawals || [];
        setWithdrawals(list);
      } else {
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
    const id = setInterval(() => loadData({ silent: true }), 15000);
    return () => clearInterval(id);
  }, [telegramId]);

  // --- actions -------------------------------------------------------------
  const copyToClipboard = async (text, type = 'адрес') => {
    if (!text) return;
    vibrate(5);
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

  const go = (tab) => {
    vibrate(5);
    setActiveTab(tab);
  };

  // last items (на главном экране)
  const previewOps = useMemo(() => {
    const list = Array.isArray(withdrawals) ? withdrawals.slice() : [];
    list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return list.slice(0, 3);
  }, [withdrawals]);

  // --- UI states -----------------------------------------------------------
  if (isLoading && activeTab === 'home') {
    return (
      <div className="tg-loading tg-dark" style={{ background: tgColors.bg }}>
        <div className="tg-spinner" style={{ borderColor: tgColors.hint }} />
        <p style={{ color: tgColors.hint, fontFamily: 'Roboto, system-ui, -apple-system, Segoe UI, Arial, sans-serif' }}>
          Загрузка кошелька...
        </p>
      </div>
    );
  }

  return (
    <div className="tg-container tg-dark" style={{ backgroundColor: tgColors.bg, color: tgColors.text }}>
      {/* Toast */}
      {toast && <div className={`tg-toast tg-toast-${toast.type}`}>{toast.message}</div>}

      {/* HEADER (минимальный, под тёмный стиль) */}
      {/* <div className="tg-topbar">
        <button className="tg-topbar-btn" onClick={() => { vibrate(5); onBack?.(); }} aria-label="Назад">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <div className="tg-topbar-title">Кошелёк</div>

        <button className="tg-topbar-btn" onClick={onRefresh} aria-label="Обновить">
          <span className="tg-topbar-refresh">
            <IconRefresh />
          </span>
          {isRefreshing ? <span className="tg-dot" /> : null}
        </button>
      </div> */}

      {/* CONTENT */}
      <div className="tg-content tg-content-wide">
        {/* HOME (как на скрине) */}
        {activeTab === 'home' && (
          <div className="tg-section">
            {/* BALANCE CARD */}
            <div className="tg-card tg-card-balance">
              <div className="tg-card-head">
                <div className="tg-card-title">Баланс кошелька</div>
                <button className="tg-mini-icon" onClick={onRefresh} aria-label="Обновить баланс">
                  <IconRefresh />
                </button>
              </div>

              <div className="tg-balance-amount">{formatMoneyUSD(balance)}</div>

              <div className="tg-big-actions">
                <button className="tg-big-action" onClick={() => go('deposit')} type="button">
                  <span className="tg-big-ico">
                    <IconArrowDown />
                  </span>
                  <span className="tg-big-label">Внести</span>
                </button>

                <button className="tg-big-action tg-big-action-secondary" onClick={() => go('withdraw')} type="button">
                  <span className="tg-big-ico">
                    <IconArrowUp />
                  </span>
                  <span className="tg-big-label">Вывести</span>
                </button>
              </div>
            </div>

            {/* HISTORY PREVIEW CARD */}
            <div className="tg-card tg-card-history">
              <button 
  className="tg-history-button" 
  onClick={() => { vibrate(10); go('history'); }}
  type="button"
>
  <span>История транзакций</span>
  <span className="tg-history-arrow">›</span>
</button>

<button 
  className="tg-history-button" 
  onClick={() => { vibrate(10); go('history'); }}
  type="button"
>
  <span>История транзакций</span>
  <span className="tg-history-arrow">›</span>
</button>

              {(!previewOps || previewOps.length === 0) ? (
                <div className="tg-history-empty">Нет операций</div>
              ) : (
                <div className="tg-history-mini-list">
                  {previewOps.map((wd) => {
                    const isOut = true;
                    const title = 'Вывод';
                    const sign = isOut ? '-' : '+';
                    return (
                      <div className="tg-mini-row" key={wd.id || `${wd.created_at}-${wd.amount}`}>
                        <div className={`tg-mini-ico ${isOut ? 'out' : 'in'}`}>
                          {isOut ? <IconArrowUp /> : <IconArrowDown />}
                        </div>

                        <div className="tg-mini-mid">
                          <div className="tg-mini-title">{title}</div>
                          <div className="tg-mini-date">{formatDate(wd.created_at)}</div>
                        </div>

                        <div className="tg-mini-right">
                          <div className={`tg-mini-amt ${isOut ? 'neg' : 'pos'}`}>
                            {sign}{formatUSDT(wd.amount).replace(' USDT', '')} USDT
                          </div>
                          <div className="tg-mini-sub">{formatMoneyUSD(wd.amount)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button className="tg-history-more" onClick={() => go('history')} type="button">
                Смотреть всю историю
              </button>
            </div>
          </div>
        )}

        {/* DEPOSIT */}
        {activeTab === 'deposit' && (
          <div className="tg-section">
            <div className="tg-card tg-card-page">
              <div className="tg-page-head">
                <button className="tg-back-pill" onClick={() => go('home')} type="button">Назад</button>
                <div className="tg-page-title">Пополнение</div>
                <div style={{ width: 64 }} />
              </div>

              <div className="tg-page-sub">Ваш адрес для пополнения (BEP20)</div>

              <div className="tg-address-block">
                <code className="tg-address-code">{addressData?.address || 'Загрузка...'}</code>
                <div className="tg-address-actions">
                  <button className="tg-pill" onClick={() => copyToClipboard(addressData?.address || '', 'адрес')} disabled={!addressData?.address}>
                    Копировать
                  </button>
                </div>
              </div>

              {addressData?.memo ? (
                <>
                  <div className="tg-page-sub">Memo</div>
                  <div className="tg-address-block tg-address-block-memo">
                    <code className="tg-address-code">{addressData.memo}</code>
                    <div className="tg-address-actions">
                      <button className="tg-pill" onClick={() => copyToClipboard(addressData?.memo || '', 'memo')} disabled={!addressData?.memo}>
                        Копировать
                      </button>
                    </div>
                  </div>

                  <button className="tg-wide-pill" onClick={copyAll} type="button">
                    Скопировать адрес + memo
                  </button>
                </>
              ) : null}

              {/* Сохраненные адреса (как было) */}
              {savedAddresses.length > 0 && (
                <div className="tg-saved-addresses">
                  <div className="tg-saved-title">СОХРАНЕННЫЕ АДРЕСА</div>
                  <div className="tg-saved-list">
                    {savedAddresses.map((addr) => (
                      <div key={addr.id} className="tg-saved-item">
                        <div className="tg-saved-info">
                          <span className="tg-saved-name">{addr.name}</span>
                          <span className="tg-saved-address">{formatAddress(addr.address)}</span>
                        </div>
                        <button className="tg-saved-copy" onClick={() => copyToClipboard(addr.address, 'адрес')} type="button">
                          Копировать
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="tg-note">
                <div className="tg-note-title">Инструкция</div>
                <ol className="tg-note-list">
                  <li>Отправляйте только USDT в сети BEP20</li>
                  <li>Минимальная сумма: {addressData?.min_deposit || 10} USDT</li>
                  <li>Средства зачисляются автоматически</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* WITHDRAW */}
        {activeTab === 'withdraw' && (
          <div className="tg-section">
            <div className="tg-card tg-card-page">
              <div className="tg-page-head">
                <button className="tg-back-pill" onClick={() => go('home')} type="button">Назад</button>
                <div className="tg-page-title">Вывод</div>
                <div style={{ width: 64 }} />
              </div>

              <div className="tg-available">
                Доступно: <span className="tg-available-amt">{formatUSDT(balance)}</span>
              </div>

              <form onSubmit={handleWithdraw} className="tg-form">
                <div className="tg-form-group">
                  <label>Сумма (USDT)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="10"
                    max={balance}
                    value={withdrawData.amount}
                    onChange={(e) => setWithdrawData({ ...withdrawData, amount: e.target.value })}
                    placeholder="10.00"
                    required
                  />
                  <div className="tg-form-hint">Минимум: 10 USDT</div>
                </div>

                <div className="tg-form-group">
                  <label>Сеть</label>
                  <select
                    value={withdrawData.network}
                    onChange={(e) => setWithdrawData({ ...withdrawData, network: e.target.value })}
                  >
                    <option value="BEP20">BEP20 (Binance) - рекомендуется</option>
                    <option value="TRC20">TRC20 (Tron)</option>
                    <option value="ERC20">ERC20 (Ethereum) - дорого</option>
                  </select>
                </div>

                <div className="tg-form-group">
                  <label>Адрес кошелька</label>
                  <textarea
                    value={withdrawData.address}
                    onChange={(e) => setWithdrawData({ ...withdrawData, address: e.target.value })}
                    placeholder="Введите адрес для вывода"
                    rows="3"
                    required
                  />
                </div>

                <div className="tg-warn">⚠️ Проверьте адрес перед отправкой. Ошибки необратимы.</div>

                <button
                  type="submit"
                  className="tg-primary"
                  disabled={!withdrawData.amount || !withdrawData.address}
                >
                  Отправить
                </button>
              </form>
            </div>
          </div>
        )}

        {/* HISTORY (полная) */}
        {activeTab === 'history' && (
          <div className="tg-section">
            <div className="tg-card tg-card-page">
              <div className="tg-page-head">
                <button className="tg-back-pill" onClick={() => go('home')} type="button">Назад</button>
                <div className="tg-page-title">История</div>
                <div style={{ width: 64 }} />
              </div>

              {!withdrawals || withdrawals.length === 0 ? (
                <div className="tg-history-empty">Нет операций</div>
              ) : (
                <div className="tg-history-full">
                  {withdrawals
                    .slice()
                    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
                    .map((wd) => (
                      <div key={wd.id || `${wd.created_at}-${wd.amount}`} className="tg-full-row">
                        <div className="tg-full-left">
                          <div className="tg-full-title">Вывод</div>
                          <div className="tg-full-sub">
                            {formatDate(wd.created_at)} • {wd.address ? formatAddress(wd.address) : '—'}
                          </div>

                          <div className={`tg-status status-${wd.status || 'pending'}`}>
                            {(!wd.status || wd.status === 'pending') && '⏳ Ожидание'}
                            {wd.status === 'completed' && '✅ Выполнено'}
                            {wd.status === 'rejected' && '❌ Отклонено'}
                            {wd.status === 'processing' && '🔄 В обработке'}
                          </div>
                        </div>

                        <div className="tg-full-right">
                          <div className="tg-full-amt">-{formatUSDT(wd.amount)}</div>
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