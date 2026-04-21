// 🔥 BINANCE P2P + TELEGRAM WALLET HYBRID (FULL READY)

      <div className="tabs">
        <button className={mode==='buy'?'active':''} onClick={()=>setMode('buy')}>BUY</button>
        <button className={mode==='sell'?'active':''} onClick={()=>setMode('sell')}>SELL</button>
      </div>

      <div className="table-head">
        <span>Пользователь</span>
        <span>Цена / Лимиты</span>
        <span></span>
      </div>

      <div className="list">
        {loading ? (
          [...Array(8)].map((_,i)=>(<div key={i} className="skeleton"/>))
        ) : (
          (mode==='buy'?sellOrders:buyOrders).map(o => (
            <Row key={o.id} o={o} type={mode} />
          ))
        )}
      </div>

      {selected && (
        <div className="modal" onClick={()=>setSelected(null)}>
          <div className="sheet" onClick={e=>e.stopPropagation()}>
            <h3>Сделка</h3>

            <div className="info">
              <div>Курс: {selected.rate}</div>
              <div>Лимит: {selected.min_amount}-{selected.max_amount}</div>
            </div>

            <input
              value={amount}
              onChange={e=>setAmount(e.target.value)}
              placeholder="Введите USDT"
            />

            {amount && (
              <div className="calc">
                ≈ {(+amount * selected.rate).toLocaleString()} ₽
              </div>
            )}

            <button className="confirm" onClick={startTrade}>
              Подтвердить
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
