// FULL READY P2P WALLET UI (JSX + CSS)
// Просто вставь как есть

import React, { useState } from "react";
import "./P2P.css";

export default function P2PWallet() {
  const [screen, setScreen] = useState("main");

  return (
    <div className="app">
      {screen === "main" && (
        <div className="profile">
          <div className="avatarWrap">
            <div className="avatar">A</div>
            <div className="name">Alex</div>
            <div className="balance">💰 120.54 USDT</div>
          </div>

          <div className="stats">
            <div><b>23</b><span>Всего</span></div>
            <div><b>20</b><span>Завершено</span></div>
            <div><b>2</b><span>Активные</span></div>
            <div><b>1</b><span>Отменено</span></div>
          </div>

          <div className="actions">
            <button className="buy" onClick={()=>setScreen("buy")}>Купить</button>
            <button className="sell" onClick={()=>setScreen("sell")}>Продать</button>
          </div>

          <div className="menu">
            <button onClick={()=>setScreen("ads")}>📋 Мои объявления</button>
            <button onClick={()=>setScreen("orders")}>📦 Мои ордера</button>
            <button onClick={()=>setScreen("help")}>❓ Помощь</button>
          </div>
        </div>
      )}

      {screen !== "main" && (
        <div className="screen">
          <div className="header">
            <button onClick={()=>setScreen("main")}>←</button>
            <h2>{screen}</h2>
            <div />
          </div>

          <div className="list">
            {[1,2,3].map(i => (
              <div key={i} className="card">
                <div className="user">
                  <div className="ava">U</div>
                  <div>user{i}</div>
                </div>
                <div className="price">95 ₽</div>
                <div className="amount">120 USDT</div>
                <button className="action">Открыть</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}