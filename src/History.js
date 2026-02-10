// History.js (Telegram clean version)
// Под бекенд: GET {API_BASE_URL}/api/public/user-orders/:userId
// user_orders: id, public_id, order_type, amount, rate, status, created_at, updated_at

import { useEffect, useMemo, useRef, useState } from 'react';
import SupportChat from './SupportChat';
import { API_BASE_URL } from './config';

const STATUS = {
  pending:    { text: 'Ожидание',     tone: 'muted',  emoji: '🟡' },
  processing: { text: 'В обработке',  tone: 'warn',   emoji: '🟠' },
  accepted:   { text: 'Принят',       tone: 'ok',     emoji: '✅' },

  completed:  { text: 'Завершён',     tone: 'ok',     emoji: '🏁' },
  success:    { text: 'Завершён',     tone: 'ok',     emoji: '🏁' },

  rejected:   { text: 'Отклонён',     tone: 'bad',    emoji: '❌' },
  cancelled:  { text: 'Отменён',      tone: 'bad',    emoji: '❌' },
  failed:     { text: 'Ошибка',       tone: 'bad',    emoji: '❌' },
};

const ACTIVE_SET = new Set(['pending', 'processing', 'accepted']);
const COMPLETED_SET = new Set(['completed', 'success']);
const REJECTED_SET = new Set(['rejected', 'cancelled', 'failed']);

function safeLower(v) {
  return String(v || '').toLowerCase().trim();
}

function getUserId() {
  try {
    // Telegram WebApp
    const tgId = window?.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    if (tgId) return String(tgId);

    // localStorage currentUser
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      const id = parsed?.telegram_id || parsed?.telegramId || parsed?.id || parsed?.userId;
      if (id) return String(id);
    }
  } catch (e) {}

  // fallback
  return '7879866656';
}

function formatDateTime(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatTime(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function orderDisplayId(order) {
  // Публичный красивый ID для UI
  return order?.public_id ? order.public_id : `#${order?.id ?? '—'}`;
}

function calcTotal(order) {
  const amount = Number(order?.amount || 0);
  const rate = Number(order?.rate || 0);
  if (!amount || !rate) return '—';

  const isBuy = safeLower(order?.order_type) === 'buy';
  if (isBuy) {
    // buy: amount в RUB -> result в USDT
    const usdt = amount / rate;
    if (Number.isNaN(usdt)) return '—';
    return `${usdt.toFixed(2)} USDT`;
  } else {
    // sell: amount в USDT -> result в RUB
    const rub = amount * rate;
    if (Number.isNaN(rub)) return '—';
    return `${rub.toFixed(2)} RUB`;
  }
}

async function safeCopy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    return false;
  }
}

export default function History({ navigateTo, showToast }) {
  const [orders, setOrders] = useState([]);
  const [viewMode, setViewMode] = useState('active'); // active | all
  const [expandedId, setExpandedId] = useState(null);
  const [activeChat, setActiveChat] = useState(null); // { orderId: number }
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const lastFetchRef = useRef(0);
  const intervalRef = useRef(null);

  const toast = (type, text) => {
    if (typeof showToast === 'function') {
      showToast(type, text);
      return;
    }
    // fallback
    console.log(`[${type}] ${text}`);
  };

  const fetchOrders = async (withSpinner = true) => {
    const now = Date.now();
    if (now - lastFetchRef.current < 2000) return;
    lastFetchRef.current = now;

    if (withSpinner) setLoading(true);
    setRefreshing(true);
    setError('');

    const userId = getUserId();

    try {
      const url = `${API_BASE_URL}/api/public/user-orders/${encodeURIComponent(userId)}`;
      const resp = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const data = await resp.json();
      if (!data?.success) throw new Error(data?.error || 'Ошибка сервера');

      const raw = Array.isArray(data.orders) ? data.orders : [];

      // нормализуем под UI
      const normalized = raw.map((o) => {
        const status = safeLower(o.status);
        return {
          id: Number(o.id),                // numeric id (для чата)
          public_id: o.public_id || null,  // TRB...
          order_type: safeLower(o.order_type) || 'buy',
          amount: Number(o.amount || 0),
          rate: Number(o.rate || 0),
          status,
          created_at: o.created_at,
          updated_at: o.updated_at,
        };
      }).filter(o => Number.isFinite(o.id));

      // сортировка: новые сверху
      normalized.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setOrders(normalized);

      // cache
      try {
        localStorage.setItem('userOrders', JSON.stringify(normalized));
        localStorage.setItem('lastOrdersUpdate', new Date().toISOString());
      } catch (e) {}
    } catch (e) {
      // fallback cache
      try {
        const cached = JSON.parse(localStorage.getItem('userOrders') || '[]');
        if (Array.isArray(cached) && cached.length) {
          setOrders(cached);
          setError('⚠️ Нет связи с сервером. Показан кэш.');
          toast('warning', 'Показаны сохранённые данные');
        } else {
          setError('Не удалось загрузить историю');
          toast('error', 'Ошибка загрузки истории');
        }
      } catch (e2) {
        setError('Ошибка сети');
        toast('error', 'Ошибка сети');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // если хочешь убрать debug-подстановку — просто не трогаем currentUser
    fetchOrders(true);

    intervalRef.current = setInterval(() => fetchOrders(false), 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const total = orders.length;
    let active = 0, completed = 0, rejected = 0;
    for (const o of orders) {
      if (ACTIVE_SET.has(o.status)) active++;
      else if (COMPLETED_SET.has(o.status)) completed++;
      else if (REJECTED_SET.has(o.status)) rejected++;
    }
    return { total, active, completed, rejected };
  }, [orders]);

  const filtered = useMemo(() => {
    if (viewMode === 'active') return orders.filter(o => ACTIVE_SET.has(o.status));
    return orders;
  }, [orders, viewMode]);

  const styles = useMemo(() => ({
    page: {
      padding: 12,
      background: '#0b0b0d',
      color: '#fff',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
    },
    header: {
      position: 'sticky',
      top: 0,
      zIndex: 5,
      background: 'rgba(11,11,13,0.92)',
      backdropFilter: 'blur(10px)',
      paddingBottom: 10,
    },
    titleRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      padding: '6px 0 10px',
    },
    title: { fontSize: 18, fontWeight: 700, margin: 0 },
    subtitle: { fontSize: 12, opacity: 0.7, margin: 0 },
    pillRow: { display: 'flex', gap: 8, marginTop: 8 },
    pill: (active) => ({
      flex: 1,
      padding: '10px 10px',
      borderRadius: 14,
      border: '1px solid rgba(255,255,255,0.08)',
      background: active ? 'rgba(47, 128, 237, 0.18)' : 'rgba(255,255,255,0.04)',
      color: active ? '#9cc7ff' : '#fff',
      fontWeight: 700,
      fontSize: 13,
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }),
    badge: {
      fontSize: 12,
      padding: '2px 8px',
      borderRadius: 999,
      background: 'rgba(255,255,255,0.10)',
      color: '#fff',
      fontWeight: 700
    },
    statsRow: { display: 'flex', gap: 8, marginTop: 10 },
    statCard: {
      flex: 1,
      padding: 10,
      borderRadius: 14,
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(255,255,255,0.04)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10
    },
    statLabel: { fontSize: 12, opacity: 0.7 },
    statValue: { fontSize: 18, fontWeight: 800 },
    refreshBtn: {
      padding: '10px 12px',
      borderRadius: 14,
      border: '1px solid rgba(255,255,255,0.10)',
      background: 'rgba(255,255,255,0.04)',
      color: '#fff',
      cursor: refreshing ? 'default' : 'pointer',
      opacity: refreshing ? 0.6 : 1,
      fontWeight: 700,
      fontSize: 13,
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    },

    list: { padding: '10px 0 80px', display: 'grid', gap: 10 },
    card: {
      borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(255,255,255,0.04)',
      overflow: 'hidden'
    },
    cardTop: {
      padding: 12,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 10,
      borderBottom: '1px solid rgba(255,255,255,0.06)'
    },
    type: { fontSize: 13, fontWeight: 800 },
    idBtn: {
      marginTop: 6,
      padding: 0,
      border: 0,
      background: 'transparent',
      color: '#9cc7ff',
      fontSize: 12,
      fontWeight: 700,
      cursor: 'pointer',
      textAlign: 'left'
    },
    status: (tone) => {
      const map = {
        ok:    { bg: 'rgba(46, 204, 113, 0.16)', fg: '#b8f5cf' },
        warn:  { bg: 'rgba(241, 196, 15, 0.16)', fg: '#ffe9a6' },
        bad:   { bg: 'rgba(231, 76, 60, 0.16)',  fg: '#ffb9b3' },
        muted: { bg: 'rgba(255,255,255,0.08)',   fg: '#eaeaea' },
      };
      const c = map[tone] || map.muted;
      return {
        padding: '6px 10px',
        borderRadius: 999,
        background: c.bg,
        color: c.fg,
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: 'nowrap',
      };
    },
    grid: {
      padding: 12,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10
    },
    kv: { display: 'grid', gap: 4 },
    k: { fontSize: 12, opacity: 0.7 },
    v: { fontSize: 13, fontWeight: 800 },
    vSoft: { fontSize: 13, fontWeight: 700, opacity: 0.9 },

    actions: {
      padding: 12,
      display: 'flex',
      gap: 8,
      borderTop: '1px solid rgba(255,255,255,0.06)'
    },
    btn: (primary) => ({
      flex: 1,
      padding: '11px 12px',
      borderRadius: 14,
      border: '1px solid rgba(255,255,255,0.10)',
      background: primary ? 'rgba(47, 128, 237, 0.22)' : 'rgba(255,255,255,0.04)',
      color: primary ? '#cfe3ff' : '#fff',
      fontWeight: 800,
      fontSize: 13,
      cursor: 'pointer',
    }),

    expand: {
      padding: 12,
      borderTop: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(0,0,0,0.18)',
      display: 'grid',
      gap: 8,
      fontSize: 12,
      color: 'rgba(255,255,255,0.85)'
    },
    row: { display: 'flex', justifyContent: 'space-between', gap: 10 },
    code: {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      opacity: 0.95
    },

    empty: {
      marginTop: 18,
      padding: 16,
      borderRadius: 16,
      border: '1px dashed rgba(255,255,255,0.14)',
      background: 'rgba(255,255,255,0.03)',
      textAlign: 'center'
    },
    emptyTitle: { margin: '0 0 6px', fontSize: 16, fontWeight: 900 },
    emptyText: { margin: 0, fontSize: 13, opacity: 0.75 },
    emptyBtn: {
      marginTop: 12,
      width: '100%',
      padding: '12px 12px',
      borderRadius: 14,
      border: '1px solid rgba(255,255,255,0.10)',
      background: 'rgba(47, 128, 237, 0.22)',
      color: '#cfe3ff',
      fontWeight: 900,
      fontSize: 14,
      cursor: 'pointer'
    },
    error: {
      marginTop: 10,
      padding: 10,
      borderRadius: 14,
      border: '1px solid rgba(255, 59, 48, 0.25)',
      background: 'rgba(255, 59, 48, 0.10)',
      color: '#ffb9b3',
      fontSize: 13,
      fontWeight: 700
    },
    spinner: {
      display: 'inline-block',
      width: 16,
      height: 16,
      borderRadius: 999,
      border: '2px solid rgba(255,255,255,0.25)',
      borderTopColor: 'rgba(255,255,255,0.85)',
      animation: 'spin 0.9s linear infinite'
    }
  }), [refreshing]);

  const onCopy = async (order) => {
    const text = order?.public_id || String(order?.id || '');
    if (!text) return toast('error', 'Нет ID для копирования');

    const ok = await safeCopy(text);
    toast(ok ? 'success' : 'error', ok ? 'Скопировано' : 'Не удалось скопировать');
  };

  const onOpenChat = (order) => {
    // ВАЖНО: чат принимает orderId как числовой ID из user_orders.id
    setActiveChat({ orderId: order.id });
  };

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg);} to {transform: rotate(360deg);} }
      `}</style>

      <div style={styles.header}>
        <div style={styles.titleRow}>
          <div>
            <h1 style={styles.title}>История</h1>
            <p style={styles.subtitle}>Ваши заявки и статусы</p>
          </div>

          <button
            style={styles.refreshBtn}
            onClick={() => !refreshing && fetchOrders(true)}
            disabled={refreshing}
            title="Обновить"
          >
            <span style={styles.spinner} />
            <span>{refreshing ? 'Обновляю…' : 'Обновить'}</span>
          </button>
        </div>

        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <div>
              <div style={styles.statLabel}>Завершено</div>
              <div style={styles.statValue}>{stats.completed}</div>
            </div>
            <div style={{ fontSize: 20 }}>🏁</div>
          </div>

          <div style={styles.statCard}>
            <div>
              <div style={styles.statLabel}>Отклонено</div>
              <div style={styles.statValue}>{stats.rejected}</div>
            </div>
            <div style={{ fontSize: 20 }}>❌</div>
          </div>
        </div>

        <div style={styles.pillRow}>
          <button style={styles.pill(viewMode === 'active')} onClick={() => setViewMode('active')}>
            <span>Активные</span>
            <span style={styles.badge}>{stats.active}</span>
          </button>
          <button style={styles.pill(viewMode === 'all')} onClick={() => setViewMode('all')}>
            <span>Все</span>
            <span style={styles.badge}>{stats.total}</span>
          </button>
        </div>

        {error ? <div style={styles.error}>{error}</div> : null}
      </div>

      <div style={styles.list}>
        {loading ? (
          <div style={styles.empty}>
            <h3 style={styles.emptyTitle}>Загрузка…</h3>
            <p style={styles.emptyText}>Получаем историю с сервера</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>
            <h3 style={styles.emptyTitle}>
              {viewMode === 'active' ? 'Нет активных заявок' : 'История пуста'}
            </h3>
            <p style={styles.emptyText}>
              {viewMode === 'active'
                ? 'Все заявки завершены или отменены'
                : 'Создайте первую заявку на обмен'}
            </p>

            <button style={styles.emptyBtn} onClick={() => navigateTo?.('home')}>
              Начать обмен
            </button>
          </div>
        ) : (
          filtered.map((o) => {
            const st = STATUS[o.status] || { text: o.status || 'Статус', tone: 'muted', emoji: '❓' };
            const isBuy = o.order_type === 'buy';
            const canChat = ACTIVE_SET.has(o.status);
            const isExpanded = expandedId === o.id;

            return (
              <div key={o.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div>
                    <div style={styles.type}>
                      {isBuy ? '🛒 Покупка USDT' : '💰 Продажа USDT'}
                    </div>

                    <button
                      style={styles.idBtn}
                      onClick={() => onCopy(o)}
                      title="Скопировать ID"
                    >
                      {orderDisplayId(o)}
                    </button>
                  </div>

                  <div style={styles.status(st.tone)}>
                    {st.emoji} {st.text}
                  </div>
                </div>

                <div style={styles.grid}>
                  <div style={styles.kv}>
                    <div style={styles.k}>Сумма</div>
                    <div style={styles.v}>
                      {o.amount.toFixed(2)} {isBuy ? 'RUB' : 'USDT'}
                    </div>
                  </div>

                  <div style={styles.kv}>
                    <div style={styles.k}>Курс</div>
                    <div style={styles.vSoft}>{o.rate.toFixed(2)} ₽</div>
                  </div>

                  <div style={styles.kv}>
                    <div style={styles.k}>Итого</div>
                    <div style={styles.v}>{calcTotal(o)}</div>
                  </div>

                  <div style={styles.kv}>
                    <div style={styles.k}>Время</div>
                    <div style={styles.vSoft}>{formatTime(o.created_at)}</div>
                  </div>
                </div>

                <div style={styles.actions}>
                  <button style={styles.btn(false)} onClick={() => onCopy(o)}>
                    📋 Копировать
                  </button>

                  {canChat ? (
                    <button style={styles.btn(true)} onClick={() => onOpenChat(o)}>
                      💬 Чат
                    </button>
                  ) : (
                    <button
                      style={styles.btn(false)}
                      onClick={() => setExpandedId(isExpanded ? null : o.id)}
                    >
                      {isExpanded ? 'Скрыть' : 'Детали'}
                    </button>
                  )}
                </div>

                {isExpanded && (
                  <div style={styles.expand}>
                    <div style={styles.row}>
                      <span>Public ID</span>
                      <span style={styles.code}>{o.public_id || '—'}</span>
                    </div>
                    <div style={styles.row}>
                      <span>Internal ID</span>
                      <span style={styles.code}>#{o.id}</span>
                    </div>
                    <div style={styles.row}>
                      <span>Создан</span>
                      <span>{formatDateTime(o.created_at)}</span>
                    </div>
                    <div style={styles.row}>
                      <span>Обновлён</span>
                      <span>{formatDateTime(o.updated_at)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {activeChat ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 20,
          }}
          onClick={() => setActiveChat(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 520,
              height: '86vh',
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              background: '#0b0b0d',
              border: '1px solid rgba(255,255,255,0.10)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <SupportChat
              orderId={activeChat.orderId} // ✅ numeric id для /chat/messages/:orderId
              onClose={() => setActiveChat(null)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
