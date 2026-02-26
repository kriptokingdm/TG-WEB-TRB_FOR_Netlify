import React, { useEffect, useMemo, useRef, useState } from "react";
import "./USDTWallet.css";

const API_BASE_URL = "https://tethrab.shop";

// --- helpers ---
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

// --- icons ---
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

// --- component ---
export default function USDTWalletTG({ telegramId }) {
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
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToastMessage = (message, type = "info") => {
    vibrate(10);
    setToast({ message, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2200);
  };

  // лёгкая вибрация на интерактив
  useEffect(() => {
    const handler = (e) => {
      const t = e.target;
      const interactive = t?.closest?.("button, a, input, select, textarea, [role='button']");
      if (interactive) vibrate(6);
    };
    document.addEventListener("click", handler, { capture: true });
    return () => document.removeEventListener("click", handler, { capture: true });
  }, []);

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
      console.error("loadData error:", e);
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

  const go = (tab) => setActiveTab(tab);

  const miniOps = useMemo(() => {
    const list = Array.isArray(withdrawals) ? withdrawals.slice() : [];
    list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return list.slice(0, 3).map((x) => {
      const t = (x.type || x.operation || x.kind || "").toLowerCase();
      let kind = "withdraw";
      if (t.includes("deposit") || t.includes("пополн")) kind = "deposit";
      else if (t.includes("check") || t.includes("чек")) kind = "check";

      const usdt = Number(x.amount || 0);
      const rub = x.rub_amount ?? x.rubAmount ?? x.amount_rub ?? x.amountRub ?? x.rub ?? x.rubles ?? null;

      return {
        id: x.id || `${x.created_at}-${x.amount}`,
        kind,
        created_at: x.created_at,
        usdt,
        rub,
      };
    });
  }, [withdrawals]);

  if (isLoading && activeTab === "home") {
    return (
      <div className="tg-loading">
        <div className="tg-spinner" />
        <div className="tg-loading-text">Загрузка кошелька...</div>
      </div>
    );
  }

  return (
    <div className="tg-container">
      {toast && <div className={`tg-toast tg-toast-${toast.type}`}>{toast.message}</div>}

      <div className="tg-content tg-content-wide">
        {activeTab === "home" && (
          <div className="tg-stack">
            {/* BALANCE */}
            <div className="tg-card">
              <div className="tg-balance-head">
                <div className="tg-balance-title">Баланс кошелька</div>

                <button className="tg-icon-btn" onClick={() => loadData({ silent: true })} type="button" aria-label="Обновить">
                  <IconRefresh />
                </button>

                {isRefreshing ? <span className="tg-refresh-dot" /> : null}
              </div>

              <div className="tg-balance">{formatMoneyUSD(balance)}</div>

              <div className="tg-actions">
                <button className="tg-big-action tg-big-action-primary" onClick={() => go("deposit")} type="button">
                  <span className="tg-big-icon"><IconArrowDown /></span>
                  <span className="tg-big-text">Внести</span>
                </button>

                <button className="tg-big-action tg-big-action-secondary" onClick={() => go("withdraw")} type="button">
                  <span className="tg-big-icon"><IconArrowUp /></span>
                  <span className="tg-big-text">Вывести</span>
                </button>
              </div>
            </div>

            {/* HISTORY */}
            <div className="tg-card">
              <button className="tg-card-title-btn" onClick={() => go("history")} type="button">
                <span className="tg-card-title-center">История транзакций</span>
                <span className="tg-card-title-right" aria-hidden="true">
                  <FilterSvg />
                </span>
              </button>

              <div className="tg-history">
                {miniOps.length === 0 ? (
                  <div className="tg-empty">Нет операций</div>
                ) : (
                  miniOps.map((op) => {
                    const isDeposit = op.kind === "deposit";
                    const isCheck = op.kind === "check";

                    const title = isDeposit ? "Пополнение" : isCheck ? "Чек" : "Вывод";
                    const sign = isDeposit ? "+" : isCheck ? "-/+" : "-";
                    const icon = isDeposit ? <IconArrowDown /> : isCheck ? <IconCheckCircle /> : <IconArrowUp />;

                    const usdtText = `${sign}${formatUSDTnum(op.usdt)} USDT`;
                    const rubText =
                      op.rub != null && op.rub !== ""
                        ? `${Number(op.rub).toLocaleString("ru-RU")} ₽`
                        : "";

                    return (
                      <button key={op.id} className="tg-tx-card" type="button" onClick={() => go("history")}>
                        <span className={`tg-tx-icon ${isDeposit ? "in" : isCheck ? "check" : "out"}`}>{icon}</span>

                        <span className="tg-tx-mid">
                          <span className="tg-tx-title">{title}</span>
                          <span className="tg-tx-date">{formatDate(op.created_at)}</span>
                        </span>

                        <span className="tg-tx-right">
                          <span className="tg-tx-usdt">{usdtText}</span>
                          {rubText ? <span className="tg-tx-rub">{rubText}</span> : null}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Заглушки табов чтобы бек не ломать */}
        {activeTab !== "home" && (
          <div className="tg-card">
            <div className="tg-empty">Экран {activeTab} (подключи как было раньше)</div>
            <button className="tg-back-simple" onClick={() => go("home")} type="button">
              Назад
            </button>
          </div>
        )}
      </div>
    </div>
  );
}