// USDTWalletTG.js - Telegram Web App style (optimized)
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './USDTWalletTG.css';

const API_BASE_URL = 'https://tethrab.shop';

// --- helpers ---------------------------------------------------------------
function withTimeout(ms, controller) {
  const id = setTimeout(() => controller.abort(), ms);
  return () => clearTimeout(id);
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

function clamp(num, min, max) {
  const n = Number(num);
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}

function formatUSDT(amount) {
  const n = Number(amount || 0);
  return `${(Number.isFinite(n) ? n : 0).toFixed(2)} USDT`;
}

function formatDate(dateStr) {
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

  const [balance, setBalance] = useState({
    available: 0,
    reserved: 0,
    total: 0,
    totalDeposited: 0,
    totalWithdrawn: 0,
    currency: 'USDT',
    updated_at: null,
  });

  const [addressData, setAddressData] = useState({
    address: '',
    network: 'BEP20',
    currency: 'USDT',
    qrCode: '',
  });

  const [withdrawals, setWithdrawals] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [withdrawData, setWithdrawData] = useState({
    amount: '',
    address: '',
    network: 'BEP20',
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

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2200);
  };

  const cacheKey = useMemo(() => (telegramId ? `wallet_ui_cache:${telegramId}` : null), [telegramId]);

  const readCache = () => {
    if (!cacheKey) return null;
    try {
      const raw = sessionStorage.getItem(cacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // cache ttl 60s
      if (!parsed?.ts || Date.now() - parsed.ts > 60_000) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const writeCache = (payload) => {
    if (!cacheKey) return;
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), ...payload }));
    } catch {
      // ignore
    }
  };

  // --- API loaders ---------------------------------------------------------
  const loadData = async ({ silent = false } = {}) => {
    if (!telegramId) return;

    // 1) быстрая отрисовка из кеша
    const cached = readCache();
    if (cached?.balance) setBalance(cached.balance);
    if (cached?.addressData) setAddressData(cached.addressData);
    if (cached?.withdrawals) setWithdrawals(cached.withdrawals);

    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      // 2) параллельная загрузка, чтобы "профиль" не ждал одну апишку
      const [bal, addr, wds] = await Promise.allSettled([
        fetchJSON(`${API_BASE_URL}/api/wallet/usdt/balance/${telegramId}`, { timeoutMs: 8000 }),
        fetchJSON(`${API_BASE_URL}/api/wallet/usdt/user-address/${telegramId}`, { timeoutMs: 8000 }),
        fetchJSON(`${API_BASE_URL}/api/wallet/withdrawals/${telegramId}`, { timeoutMs: 8000 }),
      ]);

      const next = {};

      if (bal.status === 'fulfilled' && bal.value.ok && bal.value.json?.success) {
        next.balance = bal.value.json.data;
        setBalance(bal.value.json.data);
      }

      if (addr.status === 'fulfilled' && addr.value.ok && addr.value.json?.success) {
        const d = addr.value.json.data || {};
        next.addressData = {
          address: d.address || '',
          network: d.network || 'BEP20',
          currency: d.currency || 'USDT',
          qrCode: d.qrCode || '',
        };
        setAddressData(next.addressData);
      }

      // withdrawals endpoint может возвращать разные форматы — делаем безопасно
      if (wds.status === 'fulfilled' && wds.value.ok) {
        const j = wds.value.json;
        const list = j?.withdrawals || j?.data || [];
        if (Array.isArray(list)) {
          next.withdrawals = list;
          setWithdrawals(list);
        }
      }

      if (Object.keys(next).length) writeCache(next);

      // 3) если что-то не загрузилось — мягко уведомим, но UI не блокируем
      const anyFail =
        (bal.status !== 'fulfilled' || !bal.value.ok) ||
        (addr.status !== 'fulfilled' || !addr.value.ok);

      if (anyFail) {
        showToast('Часть данных не загрузилась, попробуй обновить', 'warn');
      }
    } catch (e) {
      console.error('loadData error:', e);
      showToast('Ошибка загрузки', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData({ silent: false });
    // автообновление баланса раз в 15 сек, без "перемаргивания"
    const id = setInterval(() => loadData({ silent: true }), 15000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telegramId]);

  // --- actions -------------------------------------------------------------
  const copyToClipboard = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Скопировано', 'ok');
    } catch {
      showToast('Не удалось скопировать', 'error');
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();

    const amount = Number(withdrawData.amount);
    if (!amount || amount < 10) {
      showToast('Минимальная сумма вывода: 10 USDT', 'warn');
      return;
    }

    if (amount > Number(balance.available || 0)) {
      showToast(`Недостаточно средств. Доступно: ${formatUSDT(balance.available)}`, 'warn');
      return;
    }

    if (!withdrawData.address || withdrawData.address.trim().length < 20) {
      showToast('Введите корректный адрес', 'warn');
      return;
    }

    try {
      const res = await fetchJSON(`${API_BASE_URL}/api/wallet/withdrawal/request`, {
        method: 'POST',
        timeoutMs: 10000,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId,
          amount: withdrawData.amount,
          address: withdrawData.address.trim(),
          network: withdrawData.network,
          currency: 'USDT',
        }),
      });

      const data = res.json;

      if (res.ok && data?.success) {
        showToast('Запрос на вывод создан ✅', 'ok');
        setWithdrawData({ amount: '', address: '', network: 'BEP20' });
        await loadData({ silent: true });
        setActiveTab('history');
      } else {
        showToast(data?.error || 'Ошибка вывода', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Ошибка при создании запроса', 'error');
    }
  };

  const onRefresh = () => loadData({ silent: true });

  // --- UI states -----------------------------------------------------------
  if (isLoading && activeTab === 'balance') {
    return (
      <div className="tg-loading" style={{ background: tgColors.bg }}>
        <div className="tg-spinner" style={{ borderColor: tgColors.hint }} />
        <p style={{ color: tgColors.hint }}>Загрузка...</p>
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
        <button className="tg-back-btn" onClick={onBack} aria-label="Назад">
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
            onClick={() => setActiveTab(tab.key)}
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
                  {formatUSDT(balance.total)}
                </div>
                <div className="tg-balance-label" style={{ color: tgColors.hint }}>
                  Общий баланс
                </div>
              </div>

              <div className="tg-balance-details">
                <div className="tg-balance-row" style={{ borderBottomColor: 'rgba(0,0,0,0.06)' }}>
                  <span style={{ color: tgColors.hint }}>Доступно</span>
                  <span style={{ color: tgColors.text, fontWeight: 600 }}>{formatUSDT(balance.available)}</span>
                </div>
                <div className="tg-balance-row" style={{ borderBottomColor: 'rgba(0,0,0,0.06)' }}>
                  <span style={{ color: tgColors.hint }}>В резерве</span>
                  <span style={{ color: tgColors.text }}>{formatUSDT(balance.reserved)}</span>
                </div>
                <div className="tg-balance-row" style={{ borderBottomColor: 'rgba(0,0,0,0.06)' }}>
                  <span style={{ color: tgColors.hint }}>Пополнено</span>
                  <span style={{ color: tgColors.text }}>{formatUSDT(balance.totalDeposited)}</span>
                </div>
                <div className="tg-balance-row">
                  <span style={{ color: tgColors.hint }}>Выведено</span>
                  <span style={{ color: tgColors.text }}>{formatUSDT(balance.totalWithdrawn)}</span>
                </div>
              </div>

              <div className="tg-actions">
                <button
                  className="tg-action-btn primary"
                  onClick={() => setActiveTab('deposit')}
                  style={{ backgroundColor: tgColors.button, color: tgColors.buttonText }}
                >
                  Пополнить
                </button>

                <button
                  className="tg-action-btn secondary"
                  onClick={() => setActiveTab('withdraw')}
                  disabled={Number(balance.available || 0) < 10}
                  style={{ borderColor: tgColors.hint, color: tgColors.text }}
                >
                  Вывести
                </button>
              </div>

              <div className="tg-meta" style={{ color: tgColors.hint }}>
                Обновлено: {balance.updated_at ? formatDate(balance.updated_at) : '—'}
              </div>
            </div>
          </div>
        )}

        {/* DEPOSIT */}
        {activeTab === 'deposit' && (
          <div className="tg-section">
            <div className="tg-card" style={{ backgroundColor: tgColors.secondaryBg }}>
              <h3 style={{ color: tgColors.text, marginBottom: 16 }}>Ваш адрес для пополнения</h3>

              <div className="tg-address-container">
                <div className="tg-address-label" style={{ color: tgColors.hint }}>
                  {addressData.currency} ({addressData.network})
                </div>

                <div className="tg-address-value" style={{ borderColor: 'rgba(0,0,0,0.10)' }}>
                  <code style={{ color: tgColors.text }}>{addressData.address || 'Загрузка...'}</code>

                  <button
                    className="tg-copy-btn"
                    onClick={() => copyToClipboard(addressData.address)}
                    style={{ color: tgColors.button }}
                    disabled={!addressData.address}
                  >
                    Копировать
                  </button>
                </div>
              </div>

              <div className="tg-qr-section">
                {showQR && addressData.qrCode ? (
                  <div className="tg-qr-container" style={{ borderColor: 'rgba(0,0,0,0.10)' }}>
                    <img
                      src={addressData.qrCode}
                      alt="QR"
                      className="tg-qr-img"
                      onClick={() => setShowQR(false)}
                    />
                    <p style={{ color: tgColors.hint, fontSize: 14 }}>Нажмите на QR, чтобы скрыть</p>
                  </div>
                ) : (
                  <button
                    className="tg-qr-btn"
                    onClick={() => setShowQR(true)}
                    style={{ color: tgColors.button, borderColor: 'rgba(0,0,0,0.10)' }}
                    disabled={!addressData.qrCode}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M1 1H5V5H1V1ZM1 19H5V23H1V19ZM19 1H23V5H19V1ZM19 19H23V23H19V19ZM7 7H11V11H7V7ZM7 13H11V17H7V13ZM13 7H17V11H13V7ZM13 13H17V17H13V13Z"
                        fill="currentColor"
                      />
                    </svg>
                    Показать QR код
                  </button>
                )}
              </div>

              <div className="tg-instructions" style={{ borderColor: 'rgba(0,0,0,0.10)' }}>
                <h4 style={{ color: tgColors.text, marginBottom: 12 }}>📝 Инструкция</h4>
                <ol style={{ color: tgColors.text, fontSize: 14, lineHeight: 1.6, margin: 0, paddingLeft: 20 }}>
                  <li>Отправляйте только {addressData.currency} в сети {addressData.network}</li>
                  <li>Минимальная сумма: 10 USDT</li>
                  <li>Депозит обрабатывается автоматически</li>
                  <li>Обычное время зачисления: 5–30 минут</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* WITHDRAW */}
        {activeTab === 'withdraw' && (
          <div className="tg-section">
            <div className="tg-card" style={{ backgroundColor: tgColors.secondaryBg }}>
              <h3 style={{ color: tgColors.text, marginBottom: 20 }}>Вывод USDT</h3>

              <div className="tg-withdraw-info" style={{ color: tgColors.hint, marginBottom: 20 }}>
                Доступно:{' '}
                <span style={{ color: tgColors.text, fontWeight: 600 }}>{formatUSDT(balance.available)}</span>
              </div>

              <form onSubmit={handleWithdraw} className="tg-form">
                <div className="tg-form-group">
                  <label style={{ color: tgColors.hint, fontSize: 14 }}>Сумма (USDT)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="10"
                    max={Number(balance.available || 0)}
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
                    <option value="BEP20">BEP20 (BSC)</option>
                    <option value="ERC20">ERC20 (Ethereum)</option>
                    <option value="TRC20">TRC20 (Tron)</option>
                  </select>
                </div>

                <div className="tg-form-group">
                  <label style={{ color: tgColors.hint, fontSize: 14 }}>Адрес кошелька</label>
                  <textarea
                    value={withdrawData.address}
                    onChange={(e) => setWithdrawData({ ...withdrawData, address: e.target.value })}
                    placeholder="0x..."
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

              {withdrawals.length === 0 ? (
                <div className="tg-empty" style={{ color: tgColors.hint }}>
                  📭 Нет операций
                </div>
              ) : (
                <div className="tg-history-list">
                  {withdrawals.map((wd) => (
                    <div key={wd.id ?? `${wd.created_at}-${wd.amount}`} className="tg-history-item" style={{ borderColor: 'rgba(0,0,0,0.10)' }}>
                      <div className="tg-history-icon">📤</div>

                      <div className="tg-history-details">
                        <div className="tg-history-top">
                          <span style={{ color: tgColors.text, fontWeight: 600 }}>Вывод USDT</span>
                          <span style={{ color: tgColors.hint, fontSize: 12 }}>{formatDate(wd.created_at)}</span>
                        </div>

                        <div className="tg-history-address" style={{ color: tgColors.hint }}>
                          {(wd.address || '').slice(0, 20)}...
                        </div>

                        <div className={`tg-history-status status-${wd.status || 'pending'}`}>
                          {(wd.status === 'pending' || !wd.status) && '⏳ Ожидание'}
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
