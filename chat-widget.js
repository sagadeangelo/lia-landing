console.log("CHAT WIDGET LOADED");

(function() {
  // Configuración
  const LIA_CONFIG = {
    API_URL: (() => {
      const host = window.location.hostname;
      // Detectar si estamos en local (localhost, 127.0.0.1 o abriendo el archivo directamente)
      if (host === 'localhost' || host === '127.0.0.1' || host === '') {
        console.log("🛠️ MODO DESARROLLO: Conectando a backend local (8000)");
        return "http://127.0.0.1:8000/chat";
      }
      console.log("🌐 MODO PRODUCCIÓN: Conectando a agents.lasagadeangelo.com.mx");
      return "https://agents.lasagadeangelo.com.mx/chat";
    })(),
    CHUNK_PAUSE: 1200,
    AUTO_OPEN_DELAY: 3000
  };

  // Detección de contexto REAL (Compatible con Cloudflare Pretty URLs)
  const detectContext = () => {
    const path = window.location.pathname.toLowerCase();
    let detectedContext = 'general';
    
    // EGEL / Simulador
    if (path.includes('egel') || path.includes('simulador')) {
      detectedContext = 'egel';
    }
    // Staylo / LIA App (pretty URLs)
    else if (path.includes('staylo') || path.includes('lia')) {
      detectedContext = 'lia_staylo';
    }
    
    // Debug temporal para validación en producción
    console.log("PATH:", window.location.pathname);
    console.log("CTX DETECTADO:", detectedContext);
    
    return detectedContext;
  };

  // Estado persistente
  const LIA_STATE = {
    sessionId: localStorage.getItem('lia_session_id') || ("user_" + Math.random().toString(36).substr(2, 9)),
    isOpen: false,
    isSending: false,
    context: (() => {
      const current = detectContext();
      // PRIORIDAD ABSOLUTA al contexto detectado actualmente en la página
      if (current !== 'general') {
        return current;
      }
      return sessionStorage.getItem('lia_active_context') || current;
    })()
  };
  localStorage.setItem('lia_session_id', LIA_STATE.sessionId);
  sessionStorage.setItem('lia_active_context', LIA_STATE.context);

  // Inicialización Segura
  const initWidget = () => {
    try {
      // Inyectar Estilos
      const style = document.createElement('style');
      style.innerHTML = `
        #lia-chat-container * { box-sizing: border-box; font-family: 'Inter', sans-serif; -webkit-tap-highlight-color: transparent; }
        #lia-chat-container { position: fixed; bottom: 25px; right: 25px; z-index: 999999; display: flex; flex-direction: column; align-items: flex-end; }
        #lia-chat-toggle { width: 64px; height: 64px; background: #7c3aed; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; box-shadow: 0 8px 32px rgba(124, 58, 237, 0.4); transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        #lia-chat-toggle:hover { transform: scale(1.1); background: #8b5cf6; }
        #lia-chat-toggle svg { fill: white; width: 30px; height: 30px; }
        #lia-chat-window { display: none; flex-direction: column; width: 380px; height: 600px; max-height: calc(100vh - 120px); background: #0b141a; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.6); overflow: hidden; border: 1px solid rgba(124, 58, 237, 0.2); transition: 0.4s; transform: translateY(30px) scale(0.9); opacity: 0; }
        #lia-chat-window.active { display: flex; transform: translateY(0) scale(1); opacity: 1; }
        #lia-chat-header { background: #1b1633; padding: 18px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(124, 58, 237, 0.2); }
        .lia-avatar { width: 42px; height: 42px; background: linear-gradient(135deg, #7c3aed, #ec4899); border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: bold; color: white; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3); }
        .lia-title { font-size: 15px; font-weight: 700; margin: 0; color: #fff; letter-spacing: 0.5px; }
        .lia-status { font-size: 11px; color: #10b981; margin: 2px 0 0 0; display: flex; align-items: center; gap: 5px; font-weight: 500; }
        .lia-status::before { content: ''; width: 7px; height: 7px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        #lia-chat-body { flex: 1; padding: 22px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; background: #0b141a; scroll-behavior: smooth; }
        #lia-chat-body::-webkit-scrollbar { width: 4px; }
        #lia-chat-body::-webkit-scrollbar-thumb { background: rgba(124, 58, 237, 0.3); border-radius: 10px; }
        .lia-msg { max-width: 85%; padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.55; color: #e9edef; position: relative; animation: msgFadeIn 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
        @keyframes msgFadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .lia-msg-bot { align-self: flex-start; background: #202c33; border-top-left-radius: 2px; box-shadow: 2px 4px 12px rgba(0,0,0,0.1); }
        .lia-msg-user { align-self: flex-end; background: #7c3aed; color: #fff; border-top-right-radius: 2px; box-shadow: -2px 4px 12px rgba(124, 58, 237, 0.2); }
        #lia-chat-footer { background: #1b1633; padding: 16px; display: flex; gap: 12px; border-top: 1px solid rgba(124, 58, 237, 0.2); }
        #lia-chat-input { flex: 1; background: rgba(42, 57, 66, 0.5); border: 1px solid rgba(124, 58, 237, 0.1); padding: 12px 18px; border-radius: 26px; color: #e9edef; outline: none; transition: 0.3s; font-size: 14px; }
        #lia-chat-input:focus { border-color: #7c3aed; background: rgba(42, 57, 66, 0.8); }
        #lia-chat-send { background: #7c3aed; border: none; width: 46px; height: 46px; border-radius: 50%; cursor: pointer; display: flex; justify-content: center; align-items: center; transition: 0.3s; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3); }
        #lia-chat-send:hover { background: #8b5cf6; transform: scale(1.05); }
        .lia-typing { display: flex; gap: 4px; padding: 6px 0; }
        .lia-dot { width: 5px; height: 5px; background: #8696a0; border-radius: 50%; animation: liaBounce 1.4s infinite ease-in-out both; }
        .lia-dot:nth-child(1) { animation-delay: -0.32s; }
        .lia-dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes liaBounce { 0%, 80%, 100% { transform: scale(0.3); opacity: 0.3; } 40% { transform: scale(1); opacity: 1; } }
        @media (max-width: 480px) { #lia-chat-window { width: 100vw; height: 100vh; max-height: 100vh; border-radius: 0; bottom: 0; right: 0; border: none; } #lia-chat-container { bottom: 15px; right: 15px; } }
      `;
      document.head.appendChild(style);

      // Inyectar HTML
      const container = document.createElement('div');
      container.id = 'lia-chat-container';
      container.innerHTML = `
        <div id="lia-chat-toggle">
          <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        </div>
        <div id="lia-chat-window">
          <div id="lia-chat-header">
            <div class="lia-avatar">L</div>
            <div><p class="lia-title">LIA Asesor</p><p class="lia-status">Activa ahora</p></div>
            <button id="lia-chat-close" style="background:none;border:none;color:#8696a0;font-size:24px;cursor:pointer;line-height:1;">&times;</button>
          </div>
          <div id="lia-chat-body"></div>
          <div id="lia-chat-footer">
            <input type="text" id="lia-chat-input" placeholder="Escribe aquí..." autocomplete="off">
            <button id="lia-chat-send">
              <svg viewBox="0 0 24 24" style="fill:white;width:18px;"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(container);

      // UI Helpers
      const LIA_UI = {
        renderMessage: (text, type) => {
          const body = document.getElementById('lia-chat-body');
          const div = document.createElement('div');
          div.className = `lia-msg lia-msg-${type}`;
          div.innerHTML = text.replace(/\n/g, '<br>');
          body.appendChild(div);
          body.scrollTop = body.scrollHeight;
        },
        showTyping: () => {
          const body = document.getElementById('lia-chat-body');
          if (document.getElementById('lia-typing')) return;
          const div = document.createElement('div');
          div.id = 'lia-typing';
          div.className = 'lia-msg lia-msg-bot';
          div.innerHTML = `<div class="lia-typing"><div class="lia-dot"></div><div class="lia-dot"></div><div class="lia-dot"></div></div>`;
          body.appendChild(div);
          body.scrollTop = body.scrollHeight;
        },
        hideTyping: () => { const el = document.getElementById('lia-typing'); if (el) el.remove(); }
      };

      // Acciones
      const LIA_ACTIONS = {
        toggleChat: () => {
          const win = document.getElementById('lia-chat-window');
          LIA_STATE.isOpen = !LIA_STATE.isOpen;
          if (LIA_STATE.isOpen) {
            win.classList.add('active');
            LIA_ACTIONS.checkGreeting();
            setTimeout(() => document.getElementById('lia-chat-input').focus(), 300);
          } else {
            win.classList.remove('active');
          }
        },
        checkGreeting: () => {
          const body = document.getElementById('lia-chat-body');
          if (body.children.length > 0) return;
          
          let greeting = "¡Hola! 👋 Soy LIA. ¿Te interesa el simulador EGEL o herramientas IA?";
          
          if (LIA_STATE.context === 'egel') {
            greeting = "¡Hola! 👋 Soy LIA, tu asesora del EGEL. ¿Qué carrera presentarás?";
          } else if (LIA_STATE.context === 'lia_staylo') {
            greeting = "¡Hola! ✨ Soy LIA. ¿Quieres crear libros inmersivos, audiolibros o contenido IA?";
          }
          
          LIA_UI.renderMessage(greeting, 'bot');
        },
        handleSend: () => {
          const input = document.getElementById('lia-chat-input');
          const val = input.value.trim();
          if (val && !LIA_STATE.isSending) {
            input.value = '';
            LIA_ACTIONS.sendMessage(val);
          }
        },
        sendMessage: async (message) => {
          LIA_STATE.isSending = true;
          LIA_UI.renderMessage(message, 'user');
          LIA_UI.showTyping();
          try {
            const res = await fetch(LIA_CONFIG.API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ session_id: LIA_STATE.sessionId, message: message, contexto: LIA_STATE.context })
            });
            const data = await res.json();
            LIA_UI.hideTyping();
            await LIA_ACTIONS.processResponse(data.response);
          } catch (e) {
            console.error("❌ LIA ERROR DE CONEXIÓN:", e);
            LIA_UI.hideTyping();
            LIA_UI.renderMessage("Híjole, tuve un pequeño problema de conexión. 😅 ¿Me lo podrías repetir?", 'bot');
          } finally { LIA_STATE.isSending = false; }
        },
        processResponse: async (text) => {
          const chunks = text.split(/\n\n|\. |\? /).filter(c => c.trim().length > 0);
          for (let i = 0; i < chunks.length; i++) {
            LIA_UI.showTyping();
            const typingDuration = Math.min(chunks[i].length * 30, 2500);
            await new Promise(r => setTimeout(r, typingDuration));
            LIA_UI.hideTyping();
            LIA_UI.renderMessage(chunks[i], 'bot');
            if (i < chunks.length - 1) await new Promise(r => setTimeout(r, LIA_CONFIG.CHUNK_PAUSE));
          }
        }
      };

      // Eventos
      document.getElementById('lia-chat-toggle').onclick = LIA_ACTIONS.toggleChat;
      document.getElementById('lia-chat-close').onclick = LIA_ACTIONS.toggleChat;
      document.getElementById('lia-chat-send').onclick = LIA_ACTIONS.handleSend;
      document.getElementById('lia-chat-input').onkeypress = (e) => { if (e.key === 'Enter') LIA_ACTIONS.handleSend(); };

      // Auto-open
      if (!sessionStorage.getItem('lia_chat_auto_opened')) {
        setTimeout(() => {
          if (!LIA_STATE.isOpen) LIA_ACTIONS.toggleChat();
          sessionStorage.setItem('lia_chat_auto_opened', 'true');
        }, LIA_CONFIG.AUTO_OPEN_DELAY);
      }
    } catch (err) {
      console.error("WIDGET INIT ERROR", err);
    }
  };

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();
