/**
 * chat-widget.js — CRM 智能助手对话弹窗
 * 依赖：portal-tracker.js 已先加载（使用 window.PT_VISITOR_ID / window.PT_SESSION_ID）
 * 后端：http://localhost:8005/api/ai/chat (SSE)
 *       http://localhost:8005/api/ai/session (AgentScope 会话)
 *       http://localhost:8005/api/crm/lead  (TwentyCRM 线索)
 */
(function () {
  'use strict';

  /* ─── 配置 ─────────────────────────────────────────────────────── */
  const API_BASE   = 'http://localhost:8005';
  const BOT_NAME   = 'Anvil 助手';
  const BOT_AVATAR = '🤖';

  /* ─── 状态 ──────────────────────────────────────────────────────── */
  let sessionId    = null;   // AgentScope session_id
  let visitorId    = null;   // 来自 portal-tracker
  let isOpen       = false;
  let isStreaming  = false;
  let messages     = [];     // { role, content }
  // 线索收集进度
  let leadInfo     = { name: null, email: null, phone: null, company: null };
  let leadSubmitted = false;

  /* ─── 快捷选项（引导首轮） ──────────────────────────────────────── */
  const QUICK_REPLIES = [
    { label: '📦 产品功能介绍', value: '我想了解 Anvil 平台的产品功能' },
    { label: '💰 价格方案咨询', value: '能介绍一下你们的价格方案吗？' },
    { label: '🔗 API 对接集成', value: '我们需要做 API 集成，怎么对接？' },
    { label: '👤 咨询人工客服', value: '我想和真人客服沟通' },
  ];

  /* ─── 样式注入 ───────────────────────────────────────────────────── */
  const STYLES = `
    #cw-btn {
      position: fixed; top: 20px; right: 28px; z-index: 9998;
      width: 44px; height: 44px; border-radius: 22px;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #fff; font-size: 20px; border: none; cursor: pointer;
      box-shadow: 0 2px 12px rgba(37,99,235,.40);
      display: flex; align-items: center; justify-content: center;
      transition: transform .2s, box-shadow .2s;
    }
    #cw-btn:hover { transform: scale(1.08); box-shadow: 0 4px 16px rgba(37,99,235,.55); }
    #cw-btn .cw-badge {
      position: absolute; top: -4px; right: -4px;
      background: #ef4444; color: #fff; font-size: 10px;
      border-radius: 10px; padding: 1px 5px; font-weight: 700;
    }

    #cw-panel {
      position: fixed; top: 74px; right: 28px; z-index: 9999;
      width: 380px; max-height: 600px;
      background: #fff; border-radius: 16px;
      box-shadow: 0 8px 40px rgba(0,0,0,.18);
      display: flex; flex-direction: column;
      font-family: "Inter","Noto Sans SC",system-ui,sans-serif;
      font-size: 14px; overflow: hidden;
      transform: translateY(-12px); opacity: 0;
      transition: transform .25s ease, opacity .25s ease;
      pointer-events: none;
    }
    #cw-panel.open { transform: translateY(0); opacity: 1; pointer-events: all; }

    #cw-header {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #fff; padding: 14px 16px;
      display: flex; align-items: center; gap: 10px; flex-shrink: 0;
    }
    #cw-header .cw-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: rgba(255,255,255,.2);
      display: flex; align-items: center; justify-content: center; font-size: 18px;
    }
    #cw-header .cw-info { flex: 1; }
    #cw-header .cw-info h4 { margin: 0; font-size: 14px; font-weight: 600; }
    #cw-header .cw-info p  { margin: 0; font-size: 11px; opacity: .8; }
    #cw-header .cw-dot {
      width: 8px; height: 8px; border-radius: 50%; background: #4ade80;
      box-shadow: 0 0 0 2px rgba(74,222,128,.3);
    }
    #cw-close-btn {
      background: none; border: none; color: #fff; cursor: pointer;
      font-size: 18px; opacity: .8; line-height: 1; padding: 4px;
    }
    #cw-close-btn:hover { opacity: 1; }

    #cw-messages {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 12px;
      min-height: 0;
    }
    #cw-messages::-webkit-scrollbar { width: 4px; }
    #cw-messages::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }

    .cw-msg { display: flex; gap: 8px; align-items: flex-end; max-width: 100%; }
    .cw-msg.user  { flex-direction: row-reverse; }
    .cw-msg .cw-bubble {
      max-width: 80%; padding: 10px 13px; border-radius: 16px;
      line-height: 1.5; word-break: break-word;
    }
    .cw-msg.bot  .cw-bubble { background: #f3f4f6; color: #111; border-bottom-left-radius: 4px; }
    .cw-msg.user .cw-bubble { background: #2563eb; color: #fff; border-bottom-right-radius: 4px; }
    .cw-msg .cw-av {
      width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
      background: #e0e7ff; display: flex; align-items: center;
      justify-content: center; font-size: 14px;
    }
    .cw-msg.user .cw-av { background: #dbeafe; }

    .cw-typing { display: flex; gap: 4px; padding: 12px 14px; }
    .cw-typing span {
      width: 7px; height: 7px; border-radius: 50%; background: #9ca3af;
      animation: cw-bounce .9s infinite ease-in-out;
    }
    .cw-typing span:nth-child(2) { animation-delay: .15s; }
    .cw-typing span:nth-child(3) { animation-delay: .3s; }
    @keyframes cw-bounce {
      0%,80%,100% { transform: translateY(0); }
      40%          { transform: translateY(-6px); }
    }

    #cw-quick-replies {
      padding: 0 16px 12px; display: flex; flex-wrap: wrap; gap: 6px; flex-shrink: 0;
    }
    #cw-quick-replies button {
      background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe;
      border-radius: 20px; padding: 5px 12px; font-size: 12px; cursor: pointer;
      transition: background .15s;
    }
    #cw-quick-replies button:hover { background: #dbeafe; }

    #cw-input-area {
      border-top: 1px solid #f3f4f6; padding: 12px 14px;
      display: flex; gap: 8px; align-items: flex-end; flex-shrink: 0;
    }
    #cw-input {
      flex: 1; border: 1px solid #e5e7eb; border-radius: 10px;
      padding: 8px 12px; font-size: 13px; outline: none; resize: none;
      max-height: 80px; line-height: 1.5; font-family: inherit;
      transition: border-color .15s;
    }
    #cw-input:focus { border-color: #2563eb; }
    #cw-send-btn {
      width: 36px; height: 36px; border-radius: 10px;
      background: #2563eb; color: #fff; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; flex-shrink: 0; transition: background .15s;
    }
    #cw-send-btn:hover:not(:disabled) { background: #1d4ed8; }
    #cw-send-btn:disabled { background: #93c5fd; cursor: default; }

    .cw-lead-form {
      background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px;
      padding: 12px; margin-top: 4px;
    }
    .cw-lead-form p { margin: 0 0 8px; font-size: 12px; color: #15803d; font-weight: 500; }
    .cw-lead-form input {
      width: 100%; box-sizing: border-box;
      border: 1px solid #d1fae5; border-radius: 8px;
      padding: 6px 10px; font-size: 13px; margin-bottom: 6px;
      outline: none;
    }
    .cw-lead-form input:focus { border-color: #22c55e; }
    .cw-lead-form button {
      width: 100%; background: #16a34a; color: #fff;
      border: none; border-radius: 8px; padding: 8px;
      font-size: 13px; cursor: pointer; font-weight: 500;
    }
    .cw-lead-form button:hover { background: #15803d; }

    .cw-crm-badge {
      display: inline-flex; align-items: center; gap: 4px;
      background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;
      border-radius: 20px; padding: 3px 10px; font-size: 11px; margin-top: 4px;
    }
  `;

  /* ─── DOM 构建 ───────────────────────────────────────────────────── */
  function buildUI() {
    // 注入样式
    const style = document.createElement('style');
    style.textContent = STYLES;
    document.head.appendChild(style);

    // 浮动按钮
    const btn = document.createElement('button');
    btn.id = 'cw-btn';
    btn.title = '联系智能助手';
    btn.innerHTML = '💬<span class="cw-badge" id="cw-badge" style="display:none">1</span>';
    btn.onclick = toggle;
    document.body.appendChild(btn);

    // 对话面板
    const panel = document.createElement('div');
    panel.id = 'cw-panel';
    panel.innerHTML = `
      <div id="cw-header">
        <div class="cw-avatar">${BOT_AVATAR}</div>
        <div class="cw-info">
          <h4>${BOT_NAME}</h4>
          <p>AI 智能销售助手 · 在线</p>
        </div>
        <div class="cw-dot"></div>
        <button id="cw-close-btn" title="关闭">✕</button>
      </div>
      <div id="cw-messages"></div>
      <div id="cw-quick-replies"></div>
      <div id="cw-input-area">
        <textarea id="cw-input" placeholder="输入消息…" rows="1"></textarea>
        <button id="cw-send-btn" title="发送">➤</button>
      </div>
    `;
    document.body.appendChild(panel);

    // 事件绑定
    panel.querySelector('#cw-close-btn').onclick = toggle;
    const input = panel.querySelector('#cw-input');
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 80) + 'px';
    });
    panel.querySelector('#cw-send-btn').onclick = () => sendMessage();

    renderQuickReplies();
  }

  /* ─── 快捷选项渲染 ───────────────────────────────────────────────── */
  function renderQuickReplies(options) {
    const container = document.getElementById('cw-quick-replies');
    if (!container) return;
    const items = options || QUICK_REPLIES;
    container.innerHTML = '';
    items.forEach((opt) => {
      const btn = document.createElement('button');
      btn.textContent = opt.label;
      btn.onclick = () => sendMessage(opt.value);
      container.appendChild(btn);
    });
  }

  function hideQuickReplies() {
    const c = document.getElementById('cw-quick-replies');
    if (c) c.innerHTML = '';
  }

  /* ─── 开关面板 ───────────────────────────────────────────────────── */
  function toggle() {
    isOpen = !isOpen;
    const panel = document.getElementById('cw-panel');
    if (isOpen) {
      panel.classList.add('open');
      document.getElementById('cw-badge').style.display = 'none';
      if (!sessionId) initSession();
    } else {
      panel.classList.remove('open');
    }
  }

  /* ─── 初始化 Session ─────────────────────────────────────────────── */
  async function initSession() {
    // 获取 portal-tracker 的 visitor_id
    visitorId = localStorage.getItem('pt_visitor_id') || ('v-' + Math.random().toString(36).slice(2, 10));

    try {
      const resp = await fetch(`${API_BASE}/api/ai/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor_id: visitorId }),
      });
      const data = await resp.json();
      sessionId = data.session_id || null;
      if (sessionId) console.log('[CW] AgentScope session:', sessionId);
    } catch (e) {
      console.warn('[CW] AgentScope session 创建失败，将用本地 session:', e.message);
      sessionId = 'local-' + Date.now();
    }

    // 显示欢迎消息
    appendBotMessage('你好！👋 我是 Anvil 智能助手，专注帮助企业提升销售线索转化。\n\n请问您目前最关注哪方面？', true);
  }

  /* ─── 发送消息 ───────────────────────────────────────────────────── */
  function sendMessage(text) {
    const input = document.getElementById('cw-input');
    const content = (text || input?.value || '').trim();
    if (!content || isStreaming) return;
    if (input) { input.value = ''; input.style.height = 'auto'; }

    hideQuickReplies();
    appendUserMessage(content);
    messages.push({ role: 'user', content });
    streamBotReply();
  }

  /* ─── 追加用户气泡 ───────────────────────────────────────────────── */
  function appendUserMessage(text) {
    const container = document.getElementById('cw-messages');
    const msg = document.createElement('div');
    msg.className = 'cw-msg user';
    msg.innerHTML = `
      <div class="cw-av">👤</div>
      <div class="cw-bubble">${escHtml(text)}</div>
    `;
    container.appendChild(msg);
    scrollToBottom();
  }

  /* ─── 追加 Bot 气泡（支持流式） ────────────────────────────────── */
  function appendBotMessage(text, withQuickReplies) {
    const container = document.getElementById('cw-messages');
    const msgEl = document.createElement('div');
    msgEl.className = 'cw-msg bot';

    const bubble = document.createElement('div');
    bubble.className = 'cw-bubble';
    bubble.innerHTML = formatText(text);

    msgEl.innerHTML = `<div class="cw-av">${BOT_AVATAR}</div>`;
    msgEl.appendChild(bubble);
    container.appendChild(msgEl);
    scrollToBottom();

    if (withQuickReplies) renderQuickReplies();
    return bubble;
  }

  /* ─── 打字动画占位 ───────────────────────────────────────────────── */
  function showTyping() {
    const container = document.getElementById('cw-messages');
    const el = document.createElement('div');
    el.id = 'cw-typing';
    el.className = 'cw-msg bot';
    el.innerHTML = `
      <div class="cw-av">${BOT_AVATAR}</div>
      <div class="cw-bubble cw-typing">
        <span></span><span></span><span></span>
      </div>`;
    container.appendChild(el);
    scrollToBottom();
  }

  function hideTyping() {
    const el = document.getElementById('cw-typing');
    if (el) el.remove();
  }

  /* ─── 流式请求 Bot 回复 ─────────────────────────────────────────── */
  async function streamBotReply() {
    if (isStreaming) return;
    isStreaming = true;
    setSendDisabled(true);
    showTyping();

    let fullText = '';
    let bubble = null;

    try {
      const resp = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          visitor_id: visitorId,
          session_id: sessionId,
        }),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        // 按 SSE 行切割
        const lines = buf.split('\n');
        buf = lines.pop(); // 保留不完整行

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const raw = line.slice(5).trim();
          if (raw === '[DONE]') continue;
          try {
            const chunk = JSON.parse(raw);
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
              if (!bubble) { hideTyping(); bubble = appendBotMessage('', false); }
              fullText += delta;
              bubble.innerHTML = formatText(fullText) + '<span class="cw-cursor">▌</span>';
              scrollToBottom();
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (err) {
      console.error('[CW] stream error:', err);
      hideTyping();
      bubble = appendBotMessage(`抱歉，连接出现问题：${err.message}`);
    }

    // 流结束
    if (bubble) {
      bubble.innerHTML = formatText(fullText);
    } else if (!bubble && fullText === '') {
      hideTyping();
      bubble = appendBotMessage('抱歉，暂时无法回复，请稍后再试。');
    }

    if (fullText) {
      messages.push({ role: 'assistant', content: fullText });
      // 分析是否应展示留资表单
      checkLeadIntent(fullText);
    }

    isStreaming = false;
    setSendDisabled(false);
    scrollToBottom();
  }

  /* ─── 分析意图，酌情展示留资表单 ────────────────────────────────── */
  function checkLeadIntent(botText) {
    if (leadSubmitted) return;
    const triggers = ['联系方式', '留下', '邮箱', '电话', '预约', '演示', '报价', '顾问'];
    const hit = triggers.some((t) => botText.includes(t));
    if (hit && messages.length >= 4) showLeadForm();
  }

  /* ─── 留资表单 ───────────────────────────────────────────────────── */
  function showLeadForm() {
    if (leadSubmitted) return;
    const container = document.getElementById('cw-messages');
    const formEl = document.createElement('div');
    formEl.className = 'cw-msg bot';
    formEl.innerHTML = `
      <div class="cw-av">${BOT_AVATAR}</div>
      <div class="cw-bubble">
        <div class="cw-lead-form" id="cw-lead-form">
          <p>📋 填写以下信息，我们会安排专属顾问联系您：</p>
          <input id="clf-name"    placeholder="姓名 *" />
          <input id="clf-company" placeholder="公司名称" />
          <input id="clf-email"   placeholder="邮箱 *" type="email" />
          <input id="clf-phone"   placeholder="手机号" />
          <button onclick="window._cwSubmitLead()">✅ 提交留资</button>
        </div>
      </div>
    `;
    container.appendChild(formEl);
    scrollToBottom();
  }

  /* ─── 提交留资 → TwentyCRM ───────────────────────────────────────── */
  window._cwSubmitLead = async function () {
    const name    = document.getElementById('clf-name')?.value.trim();
    const company = document.getElementById('clf-company')?.value.trim();
    const email   = document.getElementById('clf-email')?.value.trim();
    const phone   = document.getElementById('clf-phone')?.value.trim();

    if (!name || !email) { alert('姓名和邮箱为必填项'); return; }

    const submitBtn = document.querySelector('#cw-lead-form button');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '提交中…'; }

    try {
      const resp = await fetch(`${API_BASE}/api/crm/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, phone, company,
          session_id: sessionId,
          visitor_id: visitorId,
          intent_level: 'high',
          pain_points: [],
        }),
      });
      const data = await resp.json();

      const formEl = document.getElementById('cw-lead-form');
      if (formEl) {
        formEl.innerHTML = `
          <p style="color:#065f46;font-weight:600">✅ 信息已提交成功！</p>
          <p style="margin:0;font-size:12px;color:#047857">顾问将在1个工作日内与您联系。</p>
          ${data.person?.id ? `<span class="cw-crm-badge">✓ 已同步 TwentyCRM</span>` : ''}
        `;
      }
      leadSubmitted = true;
      leadInfo = { name, email, phone, company };

      // 留资成功 → Bot 感谢消息
      setTimeout(() => {
        appendBotMessage(`太棒了，${name}！我已收到您的信息 🎉 \n\n顾问会尽快与您联系，期待进一步交流！有其他问题随时告诉我。`);
        messages.push({ role: 'assistant', content: `已收到 ${name} 的留资信息，正在安排跟进。` });
      }, 500);

    } catch (err) {
      console.error('[CW] CRM 提交失败:', err);
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '重试提交'; }
      alert('提交失败，请稍后重试：' + err.message);
    }
  };

  /* ─── 工具函数 ───────────────────────────────────────────────────── */
  function scrollToBottom() {
    const el = document.getElementById('cw-messages');
    if (el) el.scrollTop = el.scrollHeight;
  }

  function setSendDisabled(disabled) {
    const btn = document.getElementById('cw-send-btn');
    if (btn) btn.disabled = disabled;
  }

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
              .replace(/"/g,'&quot;').replace(/\n/g,'<br>');
  }

  function formatText(text) {
    // 换行转 <br>，**bold** 转粗体
    return escHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  /* ─── 入口 ───────────────────────────────────────────────────────── */
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', buildUI);
    } else {
      buildUI();
    }

    // 3 秒后显示红点提示（模拟主动打招呼触发）
    setTimeout(() => {
      if (!isOpen) {
        const badge = document.getElementById('cw-badge');
        if (badge) badge.style.display = 'block';
      }
    }, 3000);
  }

  init();
})();
