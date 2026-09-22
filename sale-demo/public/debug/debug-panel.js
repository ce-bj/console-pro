// debug-panel.js — 埋点调试面板
// 提供：开始记录 / 停止记录 / 清空 / 实时展示采集到的事件

(function () {
  // ── 状态 ────────────────────────────────────────────────────────
  var recording = false;
  var events = [];
  var collapsed = false;

  // ── 事件类型样式 ─────────────────────────────────────────────────
  var TYPE_META = {
    page_view:    { color: '#1f4ad3', bg: '#e8eeff', label: 'PAGE_VIEW' },
    scroll_depth: { color: '#7c3aed', bg: '#f3eeff', label: 'SCROLL' },
    click:        { color: '#b8421a', bg: '#fff1ec', label: 'CLICK' },
    page_leave:   { color: '#555',    bg: '#f2f2f2', label: 'LEAVE' },
  };

  // ── 构建面板 DOM ─────────────────────────────────────────────────
  var panel = document.createElement('div');
  panel.id = 'pt-debug-panel';
  panel.innerHTML = [
    '<div id="pt-header">',
      '<div id="pt-title">',
        '<span id="pt-dot"></span>',
        '<span>埋点调试</span>',
        '<span id="pt-badge">0</span>',
      '</div>',
      '<div id="pt-controls">',
        '<button id="pt-btn-start">▶ 开始记录</button>',
        '<button id="pt-btn-stop"  disabled>■ 停止</button>',
        '<button id="pt-btn-clear">✕ 清空</button>',
        '<button id="pt-btn-toggle">收起 ▲</button>',
      '</div>',
    '</div>',
    '<div id="pt-identity">',
      '<div id="pt-id-title">🔧 用户身份模拟</div>',
      '<div id="pt-id-btns">',
        '<button class="pt-id-btn" data-type="anonymous">👤 匿名访客</button>',
        '<button class="pt-id-btn" data-type="same_ip">🌐 同IP回访</button>',
        '<button class="pt-id-btn" data-type="lead">📝 已留资</button>',
        '<button class="pt-id-btn" data-type="member">⭐ 已登录会员</button>',
      '</div>',
      '<div id="pt-id-member-row">',
        '<span>会员ID</span>',
        '<input id="pt-member-id" placeholder="M-DEMO001" value="M-DEMO001">',
        '<a href="/chat.html" target="_blank" id="pt-open-chat">打开对话页 ↗</a>',
      '</div>',
      '<div id="pt-id-status">点击上方按钮切换身份，再打开对话页测试</div>',
    '</div>',
    '<div id="pt-body">',
      '<div id="pt-empty">点击"开始记录"后操作页面，事件会实时出现在这里</div>',
      '<div id="pt-list"></div>',
    '</div>',
  ].join('');

  var style = document.createElement('style');
  style.textContent = [
    '#pt-debug-panel {',
      'position:fixed; bottom:20px; right:20px; z-index:9999;',
      'width:500px; font-family:"JetBrains Mono","IBM Plex Mono",monospace;',
      'font-size:12px; background:#1a1a2e; color:#e8e8f0;',
      'border-radius:10px; box-shadow:0 8px 32px rgba(0,0,0,0.45);',
      'overflow:hidden; transition:height 0.2s ease;',
    '}',
    '#pt-header {',
      'display:flex; justify-content:space-between; align-items:center;',
      'padding:10px 14px; background:#111128; cursor:default;',
      'border-bottom:1px solid #2a2a4a;',
    '}',
    '#pt-title { display:flex; align-items:center; gap:8px; font-weight:600; font-size:13px; }',
    '#pt-dot {',
      'width:8px; height:8px; border-radius:50%; background:#555;',
      'transition:background 0.3s; flex-shrink:0;',
    '}',
    '#pt-dot.recording { background:#22c55e; box-shadow:0 0 6px #22c55e; animation:ptpulse 1.2s infinite; }',
    '@keyframes ptpulse { 0%,100%{opacity:1} 50%{opacity:0.4} }',
    '#pt-badge {',
      'background:#2a2a4a; color:#aaa; font-size:11px;',
      'padding:1px 7px; border-radius:10px; min-width:22px; text-align:center;',
    '}',
    '#pt-badge.has-events { background:#3a3a6a; color:#c8c8ff; }',
    '#pt-controls { display:flex; gap:6px; }',
    '#pt-controls button {',
      'padding:4px 10px; border:none; border-radius:5px; cursor:pointer;',
      'font-family:inherit; font-size:11px; font-weight:500;',
      'background:#2a2a4a; color:#aaa; transition:all 0.15s;',
    '}',
    '#pt-controls button:hover:not(:disabled) { background:#3a3a6a; color:#e8e8f0; }',
    '#pt-controls button:disabled { opacity:0.35; cursor:default; }',
    '#pt-btn-start:not(:disabled) { background:#14532d; color:#86efac; }',
    '#pt-btn-stop:not(:disabled)  { background:#7f1d1d; color:#fca5a5; }',
    '#pt-btn-clear { }',
    '#pt-body { max-height:420px; overflow-y:auto; }',
    '#pt-body.collapsed { max-height:0; }',
    '#pt-empty { padding:28px 16px; color:#555; text-align:center; line-height:1.6; }',
    '#pt-list { }',
    '.pt-session-header {',
      'padding:6px 14px; font-size:11px; color:#6a6a9a;',
      'border-bottom:1px dashed #2a2a4a; background:#141428;',
    '}',
    '.pt-session-header b { color:#9090c8; }',
    '.pt-row {',
      'display:grid; grid-template-columns:60px 90px 1fr; gap:0;',
      'padding:7px 14px; border-bottom:1px solid #1e1e38;',
      'align-items:start; transition:background 0.15s;',
    '}',
    '.pt-row:hover { background:#1e1e38; }',
    '.pt-row.new { animation:ptflash 0.5s ease; }',
    '@keyframes ptflash { 0%{background:#2a2a5a} 100%{background:transparent} }',
    '.pt-time { color:#555; font-size:10.5px; padding-top:1px; }',
    '.pt-type { }',
    '.pt-type span {',
      'display:inline-block; padding:2px 6px; border-radius:4px;',
      'font-size:10px; font-weight:600; letter-spacing:0.3px;',
    '}',
    '.pt-props { color:#9090b8; font-size:11px; line-height:1.55; word-break:break-all; }',
    '.pt-props b { color:#c8c8e8; font-weight:500; }',
    '.pt-cta { color:#f59e0b; font-weight:600; }',
    '#pt-footer {',
      'padding:7px 14px; background:#0f0f22; color:#444; font-size:10.5px;',
      'display:flex; justify-content:space-between; border-top:1px solid #1e1e38;',
    '}',
    /* 身份模拟区 */
    '#pt-identity {',
      'padding:10px 14px 8px; border-bottom:1px solid #2a2a4a; background:#0e0e26;',
    '}',
    '#pt-id-title { font-size:11px; color:#6a6a9a; margin-bottom:7px; font-weight:600; }',
    '#pt-id-btns { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:7px; }',
    '.pt-id-btn {',
      'padding:3px 10px; border:1px solid #2a2a4a; border-radius:12px;',
      'font-size:11px; background:#1a1a3a; color:#9090c8; cursor:pointer;',
      'font-family:inherit; transition:all 0.15s;',
    '}',
    '.pt-id-btn:hover { background:#2a2a5a; color:#e8e8f0; }',
    '.pt-id-btn.active { background:#1d4ed8; color:#fff; border-color:#2563eb; }',
    '#pt-id-member-row {',
      'display:flex; align-items:center; gap:7px; margin-bottom:6px;',
    '}',
    '#pt-id-member-row span { font-size:11px; color:#555; white-space:nowrap; }',
    '#pt-member-id {',
      'flex:1; background:#111128; border:1px solid #2a2a4a; border-radius:5px;',
      'padding:3px 7px; font-size:11px; color:#9090c8; font-family:inherit;',
      'outline:none;',
    '}',
    '#pt-open-chat {',
      'padding:3px 10px; background:#14532d; color:#86efac; border-radius:5px;',
      'font-size:11px; text-decoration:none; white-space:nowrap;',
      'border:1px solid #166534;',
    '}',
    '#pt-id-status { font-size:10.5px; color:#3a3a6a; }',
  ].join('\n');

  document.head.appendChild(style);

  // ── 等 body 就绪再插入 ───────────────────────────────────────────
  function inject() {
    document.body.appendChild(panel);
    bindEvents();
  }
  if (document.body) { inject(); }
  else { document.addEventListener('DOMContentLoaded', inject); }

  // ── 渲染单条事件 ─────────────────────────────────────────────────
  function formatTime(iso) {
    var d = new Date(iso);
    return [d.getHours(), d.getMinutes(), d.getSeconds()]
      .map(function(n) { return String(n).padStart(2, '0'); })
      .join(':');
  }

  function buildProps(e) {
    var parts = [];
    parts.push('<b>page</b> ' + (e.page_url || '-'));
    if (e.event_type === 'page_view') {
      if (e.load_time_ms != null)
        parts.push('<b>load</b> ' + e.load_time_ms + 'ms');
      if (e.viewport) parts.push('<b>vp</b> ' + e.viewport);
    }
    if (e.event_type === 'scroll_depth') {
      parts.push('<b>depth</b> ' + e.depth_percent + '%');
    }
    if (e.event_type === 'click') {
      var ctaStr = e.is_cta ? ' <span class="pt-cta">⚑ CTA</span>' : '';
      parts.push('<b>el</b> "' + (e.element_text || '-') + '"' + ctaStr);
      if (e.element_id) parts.push('<b>id</b> ' + e.element_id);
    }
    if (e.event_type === 'page_leave') {
      if (e.dwell_time_ms != null)
        parts.push('<b>dwell</b> ' + (e.dwell_time_ms / 1000).toFixed(1) + 's');
      if (e.max_scroll_percent != null)
        parts.push('<b>scroll</b> ' + e.max_scroll_percent + '%');
    }
    return parts.join('  ');
  }

  function addEventRow(e) {
    var list = document.getElementById('pt-list');
    var empty = document.getElementById('pt-empty');
    if (empty) empty.style.display = 'none';

    var meta = TYPE_META[e.event_type] || { color: '#888', bg: '#eee', label: e.event_type.toUpperCase() };
    var row = document.createElement('div');
    row.className = 'pt-row new';
    row.innerHTML = [
      '<div class="pt-time">' + formatTime(e.timestamp) + '</div>',
      '<div class="pt-type"><span style="color:' + meta.color + ';background:' + meta.bg + '">' + meta.label + '</span></div>',
      '<div class="pt-props">' + buildProps(e) + '</div>',
    ].join('');

    // 插到列表顶部（最新在上）
    list.insertBefore(row, list.firstChild);
    setTimeout(function() { row.classList.remove('new'); }, 600);

    // 更新 badge
    var badge = document.getElementById('pt-badge');
    badge.textContent = events.length;
    badge.classList.toggle('has-events', events.length > 0);
  }

  // ── 事件绑定 ─────────────────────────────────────────────────────
  function bindEvents() {
    // 录制按钮
    document.getElementById('pt-btn-start').addEventListener('click', function () {
      recording = true;
      document.getElementById('pt-dot').classList.add('recording');
      document.getElementById('pt-btn-start').disabled = true;
      document.getElementById('pt-btn-stop').disabled = false;

      // 开始记录时插入会话信息头
      var sid = sessionStorage.getItem('pt_session_id') || '-';
      var vid = localStorage.getItem('pt_visitor_id') || '-';
      var list = document.getElementById('pt-list');
      var empty = document.getElementById('pt-empty');
      if (empty) empty.style.display = 'none';
      var header = document.createElement('div');
      header.className = 'pt-session-header';
      header.innerHTML = '▶ 开始记录 &nbsp; <b>sid</b> ' + sid + ' &nbsp; <b>vid</b> ' + vid;
      list.insertBefore(header, list.firstChild);
    });

    document.getElementById('pt-btn-stop').addEventListener('click', function () {
      recording = false;
      document.getElementById('pt-dot').classList.remove('recording');
      document.getElementById('pt-btn-start').disabled = false;
      document.getElementById('pt-btn-stop').disabled = true;
    });

    document.getElementById('pt-btn-clear').addEventListener('click', function () {
      events = [];
      document.getElementById('pt-list').innerHTML = '';
      document.getElementById('pt-empty').style.display = '';
      var badge = document.getElementById('pt-badge');
      badge.textContent = '0';
      badge.classList.remove('has-events');
    });

    // 收起/展开
    document.getElementById('pt-btn-toggle').addEventListener('click', function () {
      collapsed = !collapsed;
      document.getElementById('pt-body').classList.toggle('collapsed', collapsed);
      this.textContent = collapsed ? '展开 ▼' : '收起 ▲';
    });

    // 监听 SDK 的 pt:event
    document.addEventListener('pt:event', function (ev) {
      if (!recording) return;
      var e = ev.detail;
      events.push(e);
      addEventRow(e);
    });

    // ── 身份模拟 ─────────────────────────────────────────────────
    var identityBtns = document.querySelectorAll('.pt-id-btn');
    identityBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        identityBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');

        var type = btn.dataset.type;
        var sim = { user_type: type };

        // 同IP：复用同一个 visitor_id（不刷新）
        if (type === 'same_ip') {
          sim.visitor_id = localStorage.getItem('pt_visitor_id') || ('v-sameip');
        }
        // 会员：生成 member_id
        if (type === 'member') {
          sim.member_id = document.getElementById('pt-member-id').value.trim() || 'M-DEMO001';
          sim.visitor_id = 'v-member-' + sim.member_id;
        }
        // 已留资：保留现有 visitor_id（代表曾经来过）
        if (type === 'lead') {
          sim.visitor_id = localStorage.getItem('pt_visitor_id') || ('v-lead-' + Math.random().toString(36).slice(2, 7));
        }
        // 匿名：重置
        if (type === 'anonymous') {
          sim.visitor_id = 'v-' + Math.random().toString(36).slice(2, 10);
          localStorage.setItem('pt_visitor_id', sim.visitor_id);
        }

        window.SIMULATE_IDENTITY = sim;
        sessionStorage.setItem('pt_simulate_identity', JSON.stringify(sim));
        document.getElementById('pt-id-status').textContent = '已设为：' + btn.textContent.trim();
      });
    });

    // 加载已保存的模拟设置
    var savedSim = sessionStorage.getItem('pt_simulate_identity');
    if (savedSim) {
      try {
        window.SIMULATE_IDENTITY = JSON.parse(savedSim);
        var savedType = window.SIMULATE_IDENTITY.user_type;
        identityBtns.forEach(function (b) {
          if (b.dataset.type === savedType) b.classList.add('active');
        });
      } catch (e) {}
    }
  }
})();
