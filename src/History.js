// src/History.js (Telegram rich clean version)
import { useEffect, useMemo, useRef, useState } from 'react';
import SupportChat from './SupportChat';
import { API_BASE_URL } from './config';
import './HistoryTG.css';

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
  } catch (e) {}
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
    if (now - lastFetchRef.current < 1500) return;
    lastFetchRef.current = now;

    if (withSpinner) setLoading(true);
    setRefreshing(true);
    setError('');

    const userId = getUserId();

    try {
      // основной эндпоинт (как у тебя в логах)
      const url1 = `${API_BASE_URL}/api/public/user-orders/${encodeURIComponent(userId)}`;

      const resp = await fetch(url1, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        
      });

      if (!resp.ok) {
        // иногда полезно показать человеку, что это не “сервер умер”, а блок по доступу/проксированию
        throw new Error(`HTTP ${resp.status}`);
      }

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
        setError(`⚠️ Нет связи с сервером. Показан кэш.`);
        toast('warning', 'Показаны сохранённые данные');
      } else {
        setOrders([]);
        setError(`❌ Ошибка загрузки истории`);
        toast('error', 'Не удалось загрузить историю');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // при первом заходе — сначала кэш (быстро), потом сеть
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
    let active = 0,
      completed = 0,
      rejected = 0;

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
    <div className="tg-history">
      <div className="tg-history__wrap">
        <header className="tg-history__header">
          <div className="tg-history__titleRow">
            <div>
              <h1 className="tg-history__title">История</h1>
              <p className="tg-history__subtitle">Ваши заявки и статусы</p>
            </div>

            <button
              className="tg-btn tg-btn--ghost tg-refresh"
              onClick={() => !refreshing && fetchOrders(true)}
              disabled={refreshing}
              aria-label="Обновить"
            >
              <span className={refreshing ? 'tg-spinner' : 'tg-refreshIcon'} />
              <span>{refreshing ? 'Обновляю…' : 'Обновить'}</span>
            </button>
          </div>

          <div className="tg-stats">
            <div className="tg-statCard tg-statCard--ok">
              <div>
                <div className="tg-statLabel">Завершено</div>
                <div className="tg-statValue">{stats.completed}</div>
              </div>
              <div className="tg-statEmoji">🏁</div>
            </div>

            <div className="tg-statCard tg-statCard--bad">
              <div>
                <div className="tg-statLabel">Отклонено</div>
                <div className="tg-statValue">{stats.rejected}</div>
              </div>
              <div className="tg-statEmoji">❌</div>
            </div>
          </div>

          <div className="tg-tabs">
            <button
              className={`tg-tab ${topActive ? 'tg-tab--active' : ''}`}
              onClick={() => setViewMode('active')}
            >
              <span>Активные</span>
              <span className="tg-badge">{stats.active}</span>
            </button>

            <button
              className={`tg-tab ${!topActive ? 'tg-tab--active' : ''}`}
              onClick={() => setViewMode('all')}
            >
              <span>Все</span>
              <span className="tg-badge">{stats.total}</span>
            </button>
          </div>

          {error ? <div className="tg-error">{error}</div> : null}
        </header>

        <main className="tg-list">
          {loading ? (
            <div className="tg-skeleton">
              <div className="tg-skelCard" />
              <div className="tg-skelCard" />
              <div className="tg-skelCard" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="tg-empty">
              <div className="tg-empty__icon">{topActive ? '🫧' : '📚'}</div>
              <h3 className="tg-empty__title">
                {topActive ? 'Нет активных заявок' : 'История пуста'}
              </h3>
              <p className="tg-empty__text">
                {topActive ? 'Все заявки завершены или отменены' : 'Создайте первую заявку на обмен'}
              </p>
              <button className="tg-btn tg-btn--primary tg-btn--wide" onClick={onGoHome}>
                Начать обмен
              </button>
            </div>
          ) : (
            filtered.map((o) => {
              const st = STATUS[o.status] || { text: o.status || 'Статус', tone: 'muted', emoji: '❓' };
              const isBuy = o.order_type === 'buy';
              const canChat = ACTIVE_SET.has(o.status);
              const isExpanded = expandedId === o.id;

              const statusClass = `tg-status tg-status--${st.tone}`;
              const cardAccentClass = isBuy ? 'tg-card--buy' : 'tg-card--sell';

              return (
                <section key={o.id} className={`tg-card ${cardAccentClass}`}>
                  <div className="tg-card__top">
                    <div className="tg-card__left">
                      <div className="tg-card__type">
                        <span className="tg-card__typeDot" />
                        {isBuy ? '🛒 Покупка USDT' : '💰 Продажа USDT'}
                      </div>

                      <button className="tg-card__idBtn" onClick={() => onCopy(o)} title="Скопировать ID">
                        {orderDisplayId(o)} <span className="tg-card__idHint">tap to copy</span>
                      </button>
                    </div>

                    <div className={statusClass}>
                      <span className="tg-status__emoji">{st.emoji}</span>
                      <span>{st.text}</span>
                    </div>
                  </div>

                  <div className="tg-grid">
                    <div className="tg-kv">
                      <div className="tg-k">Сумма</div>
                      <div className="tg-v">
                        {Number.isFinite(o.amount) ? o.amount.toFixed(2) : '—'} {isBuy ? 'RUB' : 'USDT'}
                      </div>
                    </div>

                    <div className="tg-kv">
                      <div className="tg-k">Курс</div>
                      <div className="tg-vsoft">
                        {Number.isFinite(o.rate) ? o.rate.toFixed(2) : '—'} ₽
                      </div>
                    </div>

                    <div className="tg-kv">
                      <div className="tg-k">Итого</div>
                      <div className="tg-v tg-v--glow">{calcTotal(o)}</div>
                    </div>

                    <div className="tg-kv">
                      <div className="tg-k">Время</div>
                      <div className="tg-vsoft">{formatTime(o.created_at)}</div>
                    </div>
                  </div>

                  <div className="tg-actions">
                    <button className="tg-btn tg-btn--ghost" onClick={() => onCopy(o)}>
                      📋 Копировать
                    </button>

                    {canChat ? (
                      <button className="tg-btn tg-btn--primary" onClick={() => onOpenChat(o)}>
                        💬 Чат
                      </button>
                    ) : (
                      <button className="tg-btn tg-btn--ghost" onClick={() => onToggleDetails(o)}>
                        {isExpanded ? 'Скрыть' : 'Детали'}
                      </button>
                    )}
                  </div>

                  {isExpanded ? (
                    <div className="tg-expand">
                      <div className="tg-row">
                        <span className="tg-row__k">Public ID</span>
                        <span className="tg-code">{o.public_id || '—'}</span>
                      </div>

                      <div className="tg-row">
                        <span className="tg-row__k">Internal ID</span>
                        <span className="tg-code">#{o.id}</span>
                      </div>

                      <div className="tg-row">
                        <span className="tg-row__k">Создан</span>
                        <span>{formatDateTime(o.created_at)}</span>
                      </div>

                      <div className="tg-row">
                        <span className="tg-row__k">Обновлён</span>
                        <span>{formatDateTime(o.updated_at)}</span>
                      </div>

                      {o.bank_details ? (
                        <div className="tg-row">
                          <span className="tg-row__k">Банк</span>
                          <span className="tg-code">{o.bank_details}</span>
                        </div>
                      ) : null}

                      {o.crypto_address ? (
                        <div className="tg-row">
                          <span className="tg-row__k">Адрес USDT</span>
                          <span className="tg-code">{o.crypto_address}</span>
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

      {activeChat ? (
        <div className="tg-modal" onClick={() => setActiveChat(null)}>
          <div className="tg-modal__sheet" onClick={(e) => e.stopPropagation()}>
            <SupportChat orderId={activeChat.orderId} onClose={() => setActiveChat(null)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
