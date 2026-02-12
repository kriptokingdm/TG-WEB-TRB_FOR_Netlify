// src/History.js (Telegram premium version) — IMPORTS History.css
import { useEffect, useMemo, useRef, useState } from 'react';
import SupportChat from './SupportChat';
import { API_BASE_URL } from './config';
import './History.css';

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
    const tgId = window?.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    if (tgId) return String(tgId);

    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      const id = parsed?.telegram_id || parsed?.telegramId || parsed?.id || parsed?.userId;
      if (id) return String(id);
    }
  } catch {}
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
    minute: '2-digit',
  });
}

function formatTime(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function orderDisplayId(order) {
  return order?.public_id ? order.public_id : `#${order?.id ?? '—'}`;
}

function calcTotal(order) {
  const amount = Number(order?.amount || 0);
  const rate = Number(order?.rate || 0);
  if (!amount || !rate) return '—';

  const isBuy = safeLower(order?.order_type) === 'buy';
  if (isBuy) {
    const usdt = amount / rate;
    if (Number.isNaN(usdt)) return '—';
    return `${usdt.toFixed(2)} USDT`;
  } else {
    const rub = amount * rate;
    if (Number.isNaN(rub)) return '—';
    return `${rub.toFixed(2)} RUB`;
  }
}

async function safeCopy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function vibe(ms = 10) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch {}
}

export default function History({ navigateTo, showToast }) {
  const [orders, setOrders] = useState([]);
  const [viewMode, setViewMode] = useState('active'); // active | all
  const [expandedId, setExpandedId] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const lastFetchRef = useRef(0);
  const intervalRef = useRef(null);

  const toast = (type, text) => {
    if (typeof showToast === 'function') return showToast(type, text);
    console.log(`[${type}] ${text}`);
  };

  const normalizeOrders = (raw) => {
    const arr = Array.isArray(raw) ? raw : [];
    const normalized = arr
      .map((o) => {
        const status = safeLower(o.status);
        return {
          id: Number(o.id),
          public_id: o.public_id || null,
          order_type: safeLower(o.order_type) || 'buy',
          amount: Number(o.amount || 0),
          rate: Number(o.rate || 0),
          status,
          created_at: o.created_at,
          updated_at: o.updated_at,
          bank_details: o.bank_details || null,
          crypto_address: o.crypto_address || null,
        };
      })
      .filter((o) => Number.isFinite(o.id));

    normalized.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return normalized;
  };

  const loadCache = () => {
    try {
      const cached = JSON.parse(localStorage.getItem('userOrders') || '[]');
      if (Array.isArray(cached) && cached.length) return cached;
    } catch {}
    return [];
  };

  const saveCache = (data) => {
    try {
      localStorage.setItem('userOrders', JSON.stringify(data));
      localStorage.setItem('lastOrdersUpdate', new Date().toISOString());
    } catch {}
  };

  const fetchOrders = async (withSpinner = true) => {
    const now = Date.now();
    if (now - lastFetchRef.current < 1200) return;
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
        credentials: 'include',
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const data = await resp.json();
      if (!data?.success) throw new Error(data?.error || 'Ошибка сервера');

      const normalized = normalizeOrders(data.orders);
      setOrders(normalized);
      saveCache(normalized);
      setError('');
    } catch (e) {
      const cached = loadCache();
      if (cached.length) {
        setOrders(cached);
        setError('⚠️ Нет связи с сервером. Показан кэш.');
        toast('warning', 'Показаны сохранённые данные');
      } else {
        setOrders([]);
        setError('❌ Ошибка загрузки истории');
        toast('error', 'Не удалось загрузить историю');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const cached = loadCache();
    if (cached.length) setOrders(cached);

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
    if (viewMode === 'active') return orders.filter((o) => ACTIVE_SET.has(o.status));
    return orders;
  }, [orders, viewMode]);

  const onCopy = async (order) => {
    vibe(8);
    const text = order?.public_id || String(order?.id || '');
    if (!text) return toast('error', 'Нет ID');
    const ok = await safeCopy(text);
    toast(ok ? 'success' : 'error', ok ? 'Скопировано' : 'Не удалось скопировать');
  };

  const onToggleDetails = (order) => {
    vibe(6);
    setExpandedId((prev) => (prev === order.id ? null : order.id));
  };

  const onOpenChat = (order) => {
    vibe(8);
    setActiveChat({ orderId: order.id });
  };

  const onGoHome = () => {
    vibe(8);
    if (navigateTo) navigateTo('home');
  };

  const topActive = viewMode === 'active';

  return (
    <div className="tgH">
      <div className="tgH__wrap">
        <header className="tgH__header">
          <div className="tgH__titleRow">
            <div>
              <h1 className="tgH__title">История</h1>
              <p className="tgH__subtitle">Ваши заявки и статусы</p>
            </div>

            <button
              className="tgBtn tgBtn--ghost tgH__refresh"
              onClick={() => !refreshing && fetchOrders(true)}
              disabled={refreshing}
              aria-label="Обновить"
            >
              <span className={refreshing ? 'tgSpin' : 'tgH__refreshIcon'} />
              <span>{refreshing ? 'Обновляю…' : 'Обновить'}</span>
            </button>
          </div>

          <div className="tgH__stats">
            <div className="tgH__stat tgH__stat--ok">
              <div>
                <div className="tgH__statLabel">Завершено</div>
                <div className="tgH__statValue">{stats.completed}</div>
              </div>
              <div className="tgH__statEmoji">🏁</div>
            </div>

            <div className="tgH__stat tgH__stat--bad">
              <div>
                <div className="tgH__statLabel">Отклонено</div>
                <div className="tgH__statValue">{stats.rejected}</div>
              </div>
              <div className="tgH__statEmoji">❌</div>
            </div>
          </div>

          <div className="tgH__tabs">
            <button
              className={`tgH__tab ${topActive ? 'is-active' : ''}`}
              onClick={() => setViewMode('active')}
            >
              <span>Активные</span>
              <span className="tgH__badge">{stats.active}</span>
            </button>

            <button
              className={`tgH__tab ${!topActive ? 'is-active' : ''}`}
              onClick={() => setViewMode('all')}
            >
              <span>Все</span>
              <span className="tgH__badge">{stats.total}</span>
            </button>
          </div>

          {error ? <div className="tgH__error">{error}</div> : null}
        </header>

        <main className="tgH__list">
          {loading ? (
            <div className="tgSkel">
              <div className="tgSkel__card" />
              <div className="tgSkel__card" />
              <div className="tgSkel__card" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="tgEmpty">
              <div className="tgEmpty__icon">{topActive ? '🫧' : '📚'}</div>
              <h3 className="tgEmpty__title">{topActive ? 'Нет активных заявок' : 'История пуста'}</h3>
              <p className="tgEmpty__text">
                {topActive ? 'Все заявки завершены или отменены' : 'Создайте первую заявку на обмен'}
              </p>
              <button className="tgBtn tgBtn--primary tgBtn--wide" onClick={onGoHome}>
                Начать обмен
              </button>
            </div>
          ) : (
            filtered.map((o) => {
              const st = STATUS[o.status] || { text: o.status || 'Статус', tone: 'muted', emoji: '❓' };
              const isBuy = o.order_type === 'buy';
              const canChat = ACTIVE_SET.has(o.status);
              const isExpanded = expandedId === o.id;

              const statusClass = `tgStatus tgStatus--${st.tone}`;
              const cardAccentClass = isBuy ? 'tgCard--buy' : 'tgCard--sell';

              return (
                <section key={o.id} className={`tgCard ${cardAccentClass}`}>
                  <div className="tgCard__top">
                    <div className="tgCard__left">
                      <div className="tgCard__type">
                        <span className="tgCard__dot" />
                        {isBuy ? '🛒 Покупка USDT' : '💰 Продажа USDT'}
                      </div>

                      <button className="tgCard__id" onClick={() => onCopy(o)} title="Скопировать ID">
                        {orderDisplayId(o)} <span className="tgCard__hint">tap</span>
                      </button>
                    </div>

                    <div className={statusClass}>
                      <span className="tgStatus__emoji">{st.emoji}</span>
                      <span>{st.text}</span>
                    </div>
                  </div>

                  <div className="tgGrid">
                    <div className="tgKV">
                      <div className="tgK">Сумма</div>
                      <div className="tgV">
                        {Number.isFinite(o.amount) ? o.amount.toFixed(2) : '—'} {isBuy ? 'RUB' : 'USDT'}
                      </div>
                    </div>

                    <div className="tgKV">
                      <div className="tgK">Курс</div>
                      <div className="tgV tgV--soft">
                        {Number.isFinite(o.rate) ? o.rate.toFixed(2) : '—'} ₽
                      </div>
                    </div>

                    <div className="tgKV">
                      <div className="tgK">Итого</div>
                      <div className="tgV tgV--glow">{calcTotal(o)}</div>
                    </div>

                    <div className="tgKV">
                      <div className="tgK">Время</div>
                      <div className="tgV tgV--soft">{formatTime(o.created_at)}</div>
                    </div>
                  </div>

                  <div className="tgActions">
                    <button className="tgBtn tgBtn--ghost" onClick={() => onCopy(o)}>
                      📋 Копировать
                    </button>

                    {canChat ? (
                      <button className="tgBtn tgBtn--primary" onClick={() => onOpenChat(o)}>
                        💬 Чат
                      </button>
                    ) : (
                      <button className="tgBtn tgBtn--ghost" onClick={() => onToggleDetails(o)}>
                        {isExpanded ? 'Скрыть' : 'Детали'}
                      </button>
                    )}
                  </div>

                  {isExpanded ? (
                    <div className="tgExpand">
                      <div className="tgRow">
                        <span className="tgRow__k">Public ID</span>
                        <span className="tgCode">{o.public_id || '—'}</span>
                      </div>

                      <div className="tgRow">
                        <span className="tgRow__k">Internal ID</span>
                        <span className="tgCode">#{o.id}</span>
                      </div>

                      <div className="tgRow">
                        <span className="tgRow__k">Создан</span>
                        <span>{formatDateTime(o.created_at)}</span>
                      </div>

                      <div className="tgRow">
                        <span className="tgRow__k">Обновлён</span>
                        <span>{formatDateTime(o.updated_at)}</span>
                      </div>

                      {o.bank_details ? (
                        <div className="tgRow">
                          <span className="tgRow__k">Банк</span>
                          <span className="tgCode">{o.bank_details}</span>
                        </div>
                      ) : null}

                      {o.crypto_address ? (
                        <div className="tgRow">
                          <span className="tgRow__k">Адрес USDT</span>
                          <span className="tgCode">{o.crypto_address}</span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </section>
              );
            })
          )}
        </main>
      </div>

      {/* DEV marker: чтобы ты 100% видел что CSS обновился */}
      <div className="tgH__cssMark">History.css • premium v3</div>

      {activeChat ? (
        <div className="tgModal" onClick={() => setActiveChat(null)}>
          <div className="tgModal__sheet" onClick={(e) => e.stopPropagation()}>
            <SupportChat orderId={activeChat.orderId} onClose={() => setActiveChat(null)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
