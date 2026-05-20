/**
 * SoporteBot Widget — v1.0
 * Pegá este script en el footer de tu tienda (Tiendanube o MercadoShops)
 *
 * Uso:
 * <script
 *   src="https://TU-PROYECTO.vercel.app/widget.js"
 *   data-api="https://TU-PROYECTO.vercel.app/api/chat"
 *   data-store="Nombre de tu tienda"
 *   data-bot-name="Sofia"
 *   data-color="#1D9E75"
 *   data-returns-policy="30 días sin uso"
 *   data-shipping-time="3 a 7 días hábiles"
 *   data-support-hours="Lunes a viernes 9 a 18 hs"
 * ><\/script>
 */

(function () {
  const script = document.currentScript;
  const API_URL = script.getAttribute("data-api") || "https://TU-PROYECTO.vercel.app/api/chat";
  const STORE_CONFIG = {
    storeName: script.getAttribute("data-store") || "la tienda",
    botName: script.getAttribute("data-bot-name") || "Sofia",
    tone: script.getAttribute("data-tone") || "amigable y casual",
    returnsPolicy: script.getAttribute("data-returns-policy") || "30 días desde la compra",
    shippingTime: script.getAttribute("data-shipping-time") || "3 a 7 días hábiles",
    supportHours: script.getAttribute("data-support-hours") || "Lunes a viernes de 9 a 18 hs",
  };
  const COLOR = script.getAttribute("data-color") || "#1D9E75";

  let chatHistory = [];
  let isOpen = false;

  // ── Estilos ──────────────────────────────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = `
    #sb-launcher {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      width: 52px; height: 52px; border-radius: 50%;
      background: ${COLOR}; border: none; cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.18);
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s;
    }
    #sb-launcher:hover { transform: scale(1.08); }
    #sb-launcher svg { width: 24px; height: 24px; fill: white; }

    #sb-widget {
      position: fixed; bottom: 88px; right: 24px; z-index: 9998;
      width: 340px; border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      background: #fff; font-family: -apple-system, sans-serif;
      display: none; flex-direction: column; overflow: hidden;
      max-height: 500px;
    }
    #sb-widget.open { display: flex; }

    #sb-header {
      background: ${COLOR}; color: white;
      padding: 14px 16px; display: flex; align-items: center; gap: 10px;
    }
    #sb-header-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: rgba(255,255,255,0.25);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 600;
    }
    #sb-header-info { flex: 1; }
    #sb-header-name { font-weight: 600; font-size: 14px; }
    #sb-header-status { font-size: 11px; opacity: 0.85; }

    #sb-messages {
      flex: 1; overflow-y: auto; padding: 14px;
      display: flex; flex-direction: column; gap: 10px;
      background: #f8f8f7;
    }
    .sb-msg { display: flex; gap: 8px; }
    .sb-msg.user { flex-direction: row-reverse; }
    .sb-bubble {
      max-width: 78%; padding: 9px 13px; border-radius: 14px;
      font-size: 13px; line-height: 1.5;
    }
    .sb-bubble.bot { background: #fff; color: #1a1a1a; border-radius: 4px 14px 14px 14px; }
    .sb-bubble.user { background: ${COLOR}; color: white; border-radius: 14px 4px 14px 14px; }
    .sb-bubble.agent-notice {
      background: #fff3cd; color: #7d5c00; border-radius: 8px;
      font-size: 12px; text-align: center; width: 100%; max-width: 100%;
    }
    .sb-typing span {
      display: inline-block; width: 5px; height: 5px; border-radius: 50%;
      background: #aaa; margin: 0 2px;
      animation: sb-bounce 1s infinite;
    }
    .sb-typing span:nth-child(2) { animation-delay: 0.15s; }
    .sb-typing span:nth-child(3) { animation-delay: 0.3s; }
    @keyframes sb-bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-4px)} }

    #sb-quick { display: flex; gap: 6px; padding: 8px 12px; flex-wrap: wrap; background: #f8f8f7; }
    .sb-qr {
      font-size: 11px; padding: 5px 10px; border-radius: 99px;
      border: 1px solid #ddd; cursor: pointer; background: white;
      color: #555; transition: background 0.15s;
    }
    .sb-qr:hover { background: #f0f0f0; }

    #sb-input-row {
      display: flex; gap: 8px; padding: 10px 12px;
      border-top: 1px solid #eee; background: white;
    }
    #sb-input {
      flex: 1; border: 1px solid #e0e0e0; border-radius: 8px;
      padding: 8px 10px; font-size: 13px; outline: none;
      font-family: -apple-system, sans-serif;
    }
    #sb-input:focus { border-color: ${COLOR}; }
    #sb-send {
      background: ${COLOR}; color: white; border: none;
      border-radius: 8px; padding: 8px 14px; cursor: pointer;
      font-size: 13px; font-family: -apple-system, sans-serif;
    }
    #sb-send:hover { opacity: 0.9; }
  `;
  document.head.appendChild(style);

  // ── HTML ─────────────────────────────────────────────────────────────────
  const launcher = document.createElement("button");
  launcher.id = "sb-launcher";
  launcher.setAttribute("aria-label", "Abrir chat de soporte");
  launcher.innerHTML = `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>`;

  const widget = document.createElement("div");
  widget.id = "sb-widget";
  widget.innerHTML = `
    <div id="sb-header">
      <div id="sb-header-avatar">${STORE_CONFIG.botName[0]}</div>
      <div id="sb-header-info">
        <div id="sb-header-name">${STORE_CONFIG.botName}</div>
        <div id="sb-header-status">● En línea · ${STORE_CONFIG.storeName}</div>
      </div>
    </div>
    <div id="sb-messages"></div>
    <div id="sb-quick">
      <div class="sb-qr" onclick="sbSendQuick('¿Dónde está mi pedido?')">📦 Mi pedido</div>
      <div class="sb-qr" onclick="sbSendQuick('Quiero hacer una devolución')">🔄 Devolución</div>
      <div class="sb-qr" onclick="sbSendQuick('El producto llegó dañado')">⚠️ Reclamo</div>
    </div>
    <div id="sb-input-row">
      <input id="sb-input" type="text" placeholder="Escribí tu consulta..." />
      <button id="sb-send">Enviar</button>
    </div>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(widget);

  // ── Lógica ───────────────────────────────────────────────────────────────
  function addMsg(text, from) {
    const area = document.getElementById("sb-messages");
    const div = document.createElement("div");
    div.className = "sb-msg " + (from === "user" ? "user" : "");
    div.innerHTML = `<div class="sb-bubble ${from}">${text}</div>`;
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
  }

  function showTyping() {
    const area = document.getElementById("sb-messages");
    const div = document.createElement("div");
    div.className = "sb-msg"; div.id = "sb-typing";
    div.innerHTML = `<div class="sb-bubble bot"><div class="sb-typing"><span></span><span></span><span></span></div></div>`;
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
  }

  function hideTyping() {
    const t = document.getElementById("sb-typing");
    if (t) t.remove();
  }

  async function sendToBot(text) {
    chatHistory.push({ role: "user", content: text });
    showTyping();
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory, storeConfig: STORE_CONFIG }),
      });
      const data = await res.json();
      hideTyping();
      chatHistory.push({ role: "assistant", content: data.reply });
      addMsg(data.reply, "bot");
      if (data.needsHuman) {
        addMsg("👤 Transferiéndote con un agente humano...", "agent-notice");
      }
    } catch {
      hideTyping();
      addMsg("Tuve un problema de conexión. Intentá de nuevo.", "bot");
    }
  }

  window.sbSendQuick = function (text) {
    addMsg(text, "user");
    sendToBot(text);
  };

  document.getElementById("sb-send").onclick = function () {
    const input = document.getElementById("sb-input");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    addMsg(text, "user");
    sendToBot(text);
  };

  document.getElementById("sb-input").onkeydown = function (e) {
    if (e.key === "Enter") document.getElementById("sb-send").click();
  };

  launcher.onclick = function () {
    isOpen = !isOpen;
    widget.classList.toggle("open", isOpen);
    if (isOpen && chatHistory.length === 0) {
      addMsg(`¡Hola! Soy ${STORE_CONFIG.botName}, la asistente de ${STORE_CONFIG.storeName}. ¿En qué te puedo ayudar?`, "bot");
    }
  };
})();
