// src/Profile.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './Profile.css';
import ReferralSystem from './ReferralSystem';
import USDTWallet from './USDTWallet';

const API_BASE_URL = 'https://tethrab.shop';

const Icon = ({ children }) => <span className="tg-icon">{children}</span>;

const HelpSVG = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"
      fill="currentColor"
    />
  </svg>
);

const USDTSVG = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M19 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4H19ZM20 18H4V6H20V18Z"
      fill="currentColor"
    />
    <path
      d="M13.25 10.5H12.75V9H10.25V10.5H9.75V12H10.25V13.5H9.75V15H12.25V13.5H12.75V12H13.25V10.5ZM11 12H10.5V13.5H11V12ZM12.5 12H12V13.5H12.5V12Z"
      fill="currentColor"
    />
  </svg>
);

const ReferralSVG = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z"
      fill="currentColor"
    />
  </svg>
);

const CopySVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z"
      fill="currentColor"
    />
  </svg>
);

async function fetchJSON(url, { timeoutMs = 8000 } = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      credentials: 'include',
    });

    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = null; }
    return { ok: res.ok, status: res.status, json };
  } catch (e) {
    return { ok: false, status: e?.name === 'AbortError' ? 408 : 0, json: null, error: e };
  } finally {
    clearTimeout(t);
  }
}

function Profile({ navigateTo, telegramUser }) {
  const [userData, setUserData] = useState(null);
  const [usdtBalanceData, setUsdtBalanceData] = useState(null);
  const [referralData, setReferralData] = useState(null);
  const [activeTab, setActiveTab] = useState('usdt');
  const [isLoading, setIsLoading] = useState(true);

  const refreshTimerRef = useRef(null);

  const tg = useMemo(() => window.Telegram?.WebApp || null, []);
  const tgUser = useMemo(() => tg?.initDataUnsafe?.user || null, [tg]);

  const haptic = (type = 'selection', style = 'light') => {
    try {
      const hf = tg?.HapticFeedback;
      if (!hf) return;
      if (type === 'impact') hf.impactOccurred(style);
      if (type === 'selection') hf.selectionChanged();
    } catch {}
  };

  const getUserId = useCallback(() => {
    try {
      if (tgUser?.id) {
        localStorage.setItem('telegramUserId', String(tgUser.id));
        return String(tgUser.id);
      }
      const saved = localStorage.getItem('telegramUserId');
      if (saved) return saved;
      return '7879866656';
    } catch {
      return '7879866656';
    }
  }, [tgUser]);

  const getDefaultReferralData = useCallback((userId) => ({
    referralLink: `https://t.me/TetherRabbitBot?start=ref_${userId}`,
    stats: { totalReferrals: 0, totalEarnings: 0, level1: 0, level2: 0, level3: 0 },
    commissionRates: { level1: 0.3, level2: 0.15, level3: 0.05 },
    hasReferrer: false,
    withdrawals: [],
  }), []);

  const formatUSDT = (num) => `${Number(num || 0).toFixed(2)} USDT`;
  const formatUSD = (num) => `$${Number(num || 0).toFixed(2)}`;

  const copyToClipboard = useCallback(async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(String(text));
      haptic('impact', 'light');
    } catch {}
  }, [haptic]);

  const loadUSDTBalanceData = useCallback(async () => {
    const userId = getUserId();
    const r = await fetchJSON(`${API_BASE_URL}/api/wallet/usdt/balance/${userId}`);
    if (r.ok && r.json?.success) setUsdtBalanceData(r.json.data);
  }, [getUserId]);

  const loadReferralData = useCallback(async () => {
    const userId = getUserId();
    const r = await fetchJSON(`${API_BASE_URL}/api/referrals/info/${userId}`);
    if (r.ok && r.json?.success) setReferralData(r.json.data);
    else setReferralData(getDefaultReferralData(userId));
  }, [getUserId, getDefaultReferralData]);

  const loadUserData = useCallback(async () => {
    const userId = getUserId();
    setIsLoading(true);

    setUserData({
      id: userId,
      username: telegramUser?.username || tgUser?.username || `user_${userId}`,
      firstName: telegramUser?.firstName || telegramUser?.first_name || tgUser?.first_name || 'Пользователь',
      photoUrl: telegramUser?.photoUrl || tgUser?.photo_url || null,
    });

    await Promise.allSettled([loadUSDTBalanceData(), loadReferralData()]);
    setIsLoading(false);
  }, [getUserId, telegramUser, tgUser, loadUSDTBalanceData, loadReferralData]);

  // Telegram BackButton only
  useEffect(() => {
    if (!tg) return;

    try {
      tg.ready();
      tg.expand();
      tg.setHeaderColor?.('secondary_bg_color');
      tg.setBackgroundColor?.('bg_color');
    } catch {}

    try {
      tg.BackButton.show();
      tg.BackButton.onClick(() => navigateTo('home'));
    } catch {}

    return () => {
      try { tg.BackButton.hide(); } catch {}
    };
  }, [tg, navigateTo]);

  useEffect(() => {
    loadUserData();

    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    refreshTimerRef.current = setInterval(() => {
      if (activeTab === 'usdt') loadUSDTBalanceData();
    }, 30000);

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [activeTab, loadUserData, loadUSDTBalanceData]);

  if (isLoading) {
    return (
      <div className="tg-page">
        <div className="tg-shell">
          <div className="tg-loading">
            <div className="tg-spinner" />
            <div className="tg-loading-text">Загрузка…</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tg-page">
      <div className="tg-shell">
        <div className="tg-section">
          <div className="tg-profile-card">
            <div className="tg-avatar">
              {userData?.photoUrl ? (
                <img src={userData.photoUrl} alt={userData.firstName} />
              ) : (
                <div className="tg-avatar-fallback">
                  {(userData?.firstName?.[0] || 'U').toUpperCase()}
                </div>
              )}
            </div>

            <div className="tg-profile-meta">
              <div className="tg-profile-name">{userData?.firstName || 'Пользователь'}</div>
              <div className="tg-profile-username">@{userData?.username || 'user'}</div>

              <button className="tg-id-chip" onClick={() => copyToClipboard(userData?.id)}>
                <span>ID: {userData?.id || '—'}</span>
                <CopySVG />
              </button>
            </div>

            {/* ✅ только кнопка справки, справа по центру */}
            <button
              className="tg-help-btn"
              onClick={() => { haptic('selection'); navigateTo('help'); }}
              aria-label="Справка"
              title="Справка"
            >
              <HelpSVG />
            </button>
          </div>
        </div>

        <div className="tg-section">
          <div className="tg-segment">
            <button
              className={`tg-seg-btn ${activeTab === 'usdt' ? 'active' : ''}`}
              onClick={() => { haptic('selection'); setActiveTab('usdt'); }}
            >
              {/* <Icon><USDTSVG /></Icon> */}
              Кошелек
              {usdtBalanceData?.available > 0 ? (
                <span className="tg-seg-sub">{formatUSDT(usdtBalanceData.available)}</span>
              ) : null}
            </button>

            <button
              className={`tg-seg-btn ${activeTab === 'referrals' ? 'active' : ''}`}
              onClick={() => { haptic('selection'); setActiveTab('referrals'); }}
            >
              <Icon><ReferralSVG /></Icon>
              Рефералы
              {referralData?.stats?.totalEarnings > 0 ? (
                <span className="tg-seg-sub">{formatUSD(referralData.stats.totalEarnings)}</span>
              ) : null}
            </button>
          </div>
        </div>

        <div className="tg-content">
          {activeTab === 'usdt' && (
            <USDTWallet
              telegramId={getUserId()}
              showToast={() => {}}
              onRefresh={() => {}}
              isRefreshing={false}
            />
          )}

          {activeTab === 'referrals' && (
            <ReferralSystem
              referralData={referralData || getDefaultReferralData(getUserId())}
              onClose={() => setActiveTab('usdt')}
              showMessage={() => {}}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
