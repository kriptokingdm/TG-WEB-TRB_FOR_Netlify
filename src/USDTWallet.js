// USDTWalletTG.js (FULL)
// 1:1 по скрину: одна главная страница (баланс + 2 кнопки + история-превью)
// + отдельные экраны deposit / withdraw / history (как раньше)
// Робото везде, без topbar, вибрация на нажатия, цвета от Telegram темы

import React, { useEffect, useMemo, useRef, useState } from "react";
import "./USDTWallet.css";

const API_BASE_URL = "https://tethrab.shop";

// --- helpers ---------------------------------------------------------------
function withTimeout(ms, controller) {
  const id = setTimeout(() => controller.abort(), ms);
  return () => clearTimeout(id);
}

function vibrate(pattern = 8) {
  if (window?.navigator?.vibrate) window.navigator.vibrate(pattern);
}

async function fetchJSON(url, { method = "GET", headers, body, timeoutMs = 8000 } = {}) {
  const controller = new AbortController();
  const clear = withTimeout(timeoutMs, controller);

  try {
    const res = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal,
      credentials: "include",
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
    const aborted = e?.name === "AbortError";
    return { ok: false, status: aborted ? 408 : 0, json: null, error: e };
  } finally {
    clear();
  }
}

function formatUSDTnum(amount) {
  const n = Number(amount || 0);
  return (Number.isFinite(n) ? n : 0).toFixed(2);
}

function formatMoneyUSD(amount) {
  const n = Number(amount || 0);
  const v = Number.isFinite(n) ? n : 0;
  return `$ ${v.toFixed(2)}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
}

const formatAddress = (address) => {
  if (!address) return "";
  if (address.length <= 10) return address;
  return `${address.slice(0, 7)}...${address.slice(-4)}`;
};

// --- icons ----------------------------------------------------------------
function IconRefresh() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C15.3019 3 18.1885 4.77814 19.7545 7.42909"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M21 3V7.5H16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconArrowDown() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4V16" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M7 12L12 17L17 12" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconArrowUp() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 20V8" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M7 12L12 7L17 12" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCheckCircle() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" />
      <path d="M8.5 12.5L10.8 14.8L15.6 10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// твой SVG фильтра (справа в истории)
function FilterSvg() {
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
  // home как на скрине + отдельные экраны
  const [activeTab, setActiveTab] = useState("home");

  const [balance, setBalance] = useState(0);

  const [addressData, setAddressData] = useState({
    address: "",
    memo: "",
    network: "BEP20",
    currency: "USDT",
    qrCode: "",
    min_deposit: 10,
    max_deposit: 10000,
    instructions: "",
  });

  const [withdrawals, setWithdrawals] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [withdrawData, setWithdrawData] = useState({
    amount: "",
    address: "",
    network: "BEP20",
  });

  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToastMessage = (message, type = "info") => {
    vibrate(10);
    setToast({ message, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2200);
  };

  // Лёгкая вибрация на любой тап в мини-аппе (кроме скролла)
  useEffect(() => {
    const handler = (e) => {
      const t = e.target;
      if (!t) return;
      // только интерактивные элементы
      const interactive = t.closest?.("button, a, input, select, textarea, [role='button']");
      if (interactive) vibrate(6);
    };
    document.addEventListener("click", handler, { capture: true });
    return () => document.removeEventListener("click", handler, { capture: true });
  }, []);

  // --- saved addresses -----------------------------------------------------
  useEffect(() => {
    const saved = localStorage.getItem("userCryptoAddresses");
    if (saved) {
      try {
        const addresses = JSON.parse(saved);
        setSavedAddresses(addresses || []);
      } catch (e) {
        console.error("Ошибка загрузки адресов:", e);
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

      if (bal.status === "fulfilled" && bal.value.ok && bal.value.json?.success) {
        setBalance(bal.value.json.balance || 0);
      }

      if (addr.status === "fulfilled" && addr.value.ok && addr.value.json?.success) {
        const data = addr.value.json;
        setAddressData({
          address: data.address || "",
          memo: data.memo || "",
          network: data.network || "BEP20",
          currency: data.currency || "USDT",
          qrCode: data.qrCode || "",
          min_deposit: data.min_deposit || 10,
          max_deposit: data.max_deposit || 10000,
          instructions: data.instructions || `Отправляйте USDT (BEP20) на адрес ${data.address}`,
        });
      }

      if (wds.status === "fulfilled" && wds.value.ok && wds.value.json?.success) {
        setWithdrawals(wds.value.json.withdrawals || []);
      } else {
        setWithdrawals([]);
      }
    } catch (e) {
      console.error("❌ loadData error:", e);
      showToastMessage("Ошибка загрузки", "error");
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
  const copyToClipboard = async (text, type = "адрес") => {
    if (!text) return;
    vibrate(6);
    try {
      await navigator.clipboard.writeText(text);
      showToastMessage(`${type} скопирован`, "ok");
    } catch {
      showToastMessage("Не удалось скопировать", "error");
    }
  };

  const copyAll = () => {
    vibrate(8);
    const text = `Address: ${addressData.address}\nMemo: ${addressData.memo}`;
    copyToClipboard(text, "адрес и memo");
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    vibrate(10);

    const amount = Number(withdrawData.amount);
    if (!amount || amount < 10) {
      showToastMessage("Минимальная сумма вывода: 10 USDT", "warn");
      return;
    }
    if (amount > balance) {
      showToastMessage(`Недостаточно средств. Доступно: ${balance.toFixed(2)} USDT`, "warn");
      return;
    }
    if (!withdrawData.address || withdrawData.address.trim().length < 20) {
      showToastMessage("Введите корректный адрес (минимум 20 символов)", "warn");
      return;
    }

    try {
      const res = await fetchJSON(`${API_BASE_URL}/api/wallet/withdrawal/request`, {
        method: "POST",
        timeoutMs: 10000,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: telegramId,
          amount: withdrawData.amount,
          address: withdrawData.address.trim(),
          network: withdrawData.network,
        }),
      });

      const data = res.json;

      if (res.ok && data?.success) {
        showToastMessage("Запрос на вывод создан ✅", "ok");
        setWithdrawData({ amount: "", address: "", network: "BEP20" });
        await loadData({ silent: true });
        setActiveTab("history");
      } else {
        showToastMessage(data?.error || "Ошибка вывода", "error");
      }
    } catch (err) {
      console.error("❌ Ошибка вывода:", err);
      showToastMessage("Ошибка при создании запроса", "error");
    }
  };

  const go = (tab) => setActiveTab(tab);

  // --- history preview rows: делаем 3 строки как на скрине -----------------
  // По бэку у нас есть withdrawals. Депозитов/чеков может не быть.
  // Поэтому: 1) если в объекте wd.type есть — используем
  // 2) иначе withdrawals считаем "Вывод"
  const miniOps = useMemo(() => {
    const list = Array.isArray(withdrawals) ? withdrawals.slice() : [];
    list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return list.slice(0, 3).map((x) => {
      const t = (x.type || x.operation || x.kind || "").toLowerCase();
      let kind = "withdraw";
      if (t.includes("deposit") || t.includes("пополн")) kind = "deposit";
      else if (t.includes("check") || t.includes("чек")) kind = "check";
      else kind = "withdraw";

      const usdt = Number(x.amount || 0);
      // рубли — если бэк отдаёт
      const rub =
        x.rub_amount ?? x.rubAmount ?? x.amount_rub ?? x.amountRub ?? x.rub ?? x.rubles ?? null;

      return {
        id: x.id || `${x.created_at}-${x.amount}`,
        kind,
        created_at: x.created_at,
        usdt,
        rub,
      };
    });
  }, [withdrawals]);

  // --- UI states -----------------------------------------------------------
  if (isLoading && activeTab === "home") {
    return (
      <div className="tg-loading tg-ui" role="status">
        <div className="tg-spinner" />
        <div className="tg-loading-text">Загрузка кошелька...</div>
      </div>
    );
  }

  return (
    <div className="tg-container tg-ui">
      {/* Toast */}
      {toast && <div className={`tg-toast tg-toast-${toast.type}`}>{toast.message}</div>}

      {/* CONTENT */}
      <div className="tg-content">
        {/* HOME (как на скрине) */}
        {activeTab === "home" && (
          <div className="tg-stack">
            {/* BALANCE CARD */}
            <div className="tg-card">
              <div className="tg-card-header">
                <div className="tg-card-title">Баланс кошелька</div>
                <button className="tg-icon-btn" onClick={() => loadData({ silent: true })} aria-label="Обновить">
                  <IconRefresh />
                </button>
              </div>

              <div className="tg-balance">{formatMoneyUSD(balance)}</div>

              <div className="tg-actions">
                <button className="tg-big-action tg-big-action-primary" onClick={() => go("deposit")} type="button">
                  <span className="tg-big-icon">
                    <IconArrowDown />
                  </span>
                  <span className="tg-big-text">Внести</span>
                </button>

                <button className="tg-big-action tg-big-action-secondary" onClick={() => go("withdraw")} type="button">
                  <span className="tg-big-icon">
                    <IconArrowUp />
                  </span>
                  <span className="tg-big-text">Вывести</span>
                </button>
              </div>
            </div>

            {/* HISTORY CARD */}
            <div className="tg-card">
              <div className="tg-card-header">
                <div className="tg-card-title">История транзакций</div>
                <button className="tg-icon-btn" onClick={() => go("history")} aria-label="История">
                  <FilterSvg />
                </button>
              </div>

              <div className="tg-history">
                {miniOps.length === 0 ? (
                  <div className="tg-empty">Нет операций</div>
                ) : (
                  miniOps.map((op) => {
                    const isDeposit = op.kind === "deposit";
                    const isWithdraw = op.kind === "withdraw";
                    const isCheck = op.kind === "check";

                    const title = isDeposit ? "Пополнение" : isCheck ? "Чек" : "Вывод";
                    const sign = isDeposit ? "+" : isCheck ? "-/+" : "-";
                    const icon = isDeposit ? <IconArrowDown /> : isCheck ? <IconCheckCircle /> : <IconArrowUp />;

                    // USDT строка справа (как на скрине: +100.00 USDT)
                    const usdtText = `${sign}${formatUSDTnum(op.usdt)} USDT`;
                    // ₽ строка — если есть в данных, иначе скрываем
                    const rubText = op.rub != null && op.rub !== "" ? `${Number(op.rub).toLocaleString("ru-RU")} ₽` : "";

                    return (
                      <button
                        key={op.id}
                        className="tg-history-row"
                        type="button"
                        onClick={() => go("history")}
                      >
                        <span className={`tg-row-icon ${isDeposit ? "in" : isCheck ? "check" : "out"}`}>
                          {icon}
                        </span>

                        <span className="tg-row-mid">
                          <span className="tg-row-title">{title}</span>
                          <span className="tg-row-date">{formatDate(op.created_at)}</span>
                        </span>

                        <span className="tg-row-right">
                          <span className={`tg-row-usdt ${isDeposit ? "pos" : "neg"}`}>{usdtText}</span>
                          {rubText ? <span className="tg-row-rub">{rubText}</span> : null}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              <button className="tg-history-more" onClick={() => go("history")} type="button">
                Смотреть всю историю
              </button>
            </div>
          </div>
        )}

        {/* DEPOSIT */}
        {activeTab === "deposit" && (
          <div className="tg-stack">
            <div className="tg-page-top">
              <button className="tg-back" onClick={() => go("home")} type="button">
                Назад
              </button>
              <div className="tg-page-title">Пополнение</div>
              <div className="tg-page-spacer" />
            </div>

            <div className="tg-card">
              <div className="tg-subtitle">Ваш адрес для пополнения (BEP20)</div>

              <div className="tg-addr">
                <code className="tg-addr-code">{addressData?.address || "Загрузка..."}</code>
                <button
                  className="tg-pill"
                  onClick={() => copyToClipboard(addressData?.address || "", "адрес")}
                  disabled={!addressData?.address}
                  type="button"
                >
                  Копировать
                </button>
              </div>

              {addressData?.memo ? (
                <>
                  <div className="tg-subtitle">Memo</div>
                  <div className="tg-addr tg-addr-memo">
                    <code className="tg-addr-code">{addressData.memo}</code>
                    <button
                      className="tg-pill"
                      onClick={() => copyToClipboard(addressData?.memo || "", "memo")}
                      disabled={!addressData?.memo}
                      type="button"
                    >
                      Копировать
                    </button>
                  </div>

                  <button className="tg-wide" onClick={copyAll} type="button">
                    Скопировать адрес + memo
                  </button>
                </>
              ) : null}

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
                        <button className="tg-saved-copy" onClick={() => copyToClipboard(addr.address, "адрес")} type="button">
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
        {activeTab === "withdraw" && (
          <div className="tg-stack">
            <div className="tg-page-top">
              <button className="tg-back" onClick={() => go("home")} type="button">
                Назад
              </button>
              <div className="tg-page-title">Вывод</div>
              <div className="tg-page-spacer" />
            </div>

            <div className="tg-card">
              <div className="tg-available">
                Доступно: <span className="tg-available-amt">{balance.toFixed(2)} USDT</span>
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

                <button className="tg-submit" type="submit" disabled={!withdrawData.amount || !withdrawData.address}>
                  Отправить
                </button>
              </form>
            </div>
          </div>
        )}

        {/* HISTORY FULL */}
        {activeTab === "history" && (
          <div className="tg-stack">
            <div className="tg-page-top">
              <button className="tg-back" onClick={() => go("home")} type="button">
                Назад
              </button>
              <div className="tg-page-title">История</div>
              <div className="tg-page-spacer" />
            </div>

            <div className="tg-card">
              {(!withdrawals || withdrawals.length === 0) ? (
                <div className="tg-empty">Нет операций</div>
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
                            {formatDate(wd.created_at)} • {wd.address ? formatAddress(wd.address) : "—"}
                          </div>
                          <div className={`tg-status status-${wd.status || "pending"}`}>
                            {(!wd.status || wd.status === "pending") && "⏳ Ожидание"}
                            {wd.status === "completed" && "✅ Выполнено"}
                            {wd.status === "rejected" && "❌ Отклонено"}
                            {wd.status === "processing" && "🔄 В обработке"}
                          </div>
                        </div>

                        <div className="tg-full-right">
                          <div className="tg-full-amt">-{formatUSDTnum(wd.amount)} USDT</div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* footer back (если надо) */}
        {onBack && activeTab !== "home" ? null : null}
      </div>
    </div>
  );
}