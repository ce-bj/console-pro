// portal-tracker.js — 埋点 SDK (MVP Demo)
// 采集 page_view / scroll_depth / click / page_leave 四类事件
// 上报到本地 demo server: http://localhost:8005/webhook/track

(function () {
  const ENDPOINT = 'http://localhost:8005/webhook/track';
  const TENANT_ID = 'demo';

  // ── ID 管理（8位短 ID，易读）────────────────────────────────────
  function shortId() {
    return Math.random().toString(36).slice(2, 10);
  }
  function getVisitorId() {
    var id = localStorage.getItem('pt_visitor_id');
    if (!id) { id = 'v-' + shortId(); localStorage.setItem('pt_visitor_id', id); }
    return id;
  }
  function getSessionId() {
    var id = sessionStorage.getItem('pt_session_id');
    if (!id) { id = 's-' + shortId(); sessionStorage.setItem('pt_session_id', id); }
    return id;
  }

  // ── 公共字段 ─────────────────────────────────────────────────────
  function basePayload(eventType) {
    return {
      event_id:    shortId(),
      event_type:  eventType,
      session_id:  getSessionId(),
      visitor_id:  getVisitorId(),
      tenant_id:   TENANT_ID,
      page_url:    location.pathname + location.hash,
      referrer:    document.referrer || 'direct',
      device_type: /Mobi/.test(navigator.userAgent) ? 'mobile' : 'desktop',
      timestamp:   new Date().toISOString(),
    };
  }

  // ── 上报（fetch + keepalive，CORS 友好，页面卸载时也能发出）────────
  function send(payload) {
    // 通知 debug panel（在上报前 dispatch，page_leave 时也能捕到）
    document.dispatchEvent(new CustomEvent('pt:event', { detail: payload }));

    var body = JSON.stringify(payload);
    fetch(ENDPOINT, {
      method: 'POST',
      body: body,
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
    }).catch(function() {
      // 静默失败：demo 环境下服务器未启动时不报错
    });
  }

  // ── ① page_view ─────────────────────────────────────────────────
  var pageEnterTime = Date.now();
  window.addEventListener('load', function() {
    var nav = performance.getEntriesByType('navigation')[0];
    send(Object.assign(basePayload('page_view'), {
      load_time_ms: nav ? Math.round(nav.duration) : null,
      viewport: window.innerWidth + 'x' + window.innerHeight,
    }));
  });

  // ── ② scroll_depth（每个里程碑只报一次）──────────────────────────
  var reached = {};
  var maxScroll = 0;
  window.addEventListener('scroll', function() {
    var scrollHeight = document.body.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;
    var pct = Math.round(window.scrollY / scrollHeight * 100);
    pct = Math.min(pct, 100);
    maxScroll = Math.max(maxScroll, pct);
    [25, 50, 75, 100].forEach(function(m) {
      if (pct >= m && !reached[m]) {
        reached[m] = true;
        send(Object.assign(basePayload('scroll_depth'), { depth_percent: m }));
      }
    });
  }, { passive: true });

  // ── ③ click（按钮、链接、data-cta 元素）──────────────────────────
  document.addEventListener('click', function(e) {
    var el = e.target.closest('a, button, [data-cta]');
    if (!el) return;
    send(Object.assign(basePayload('click'), {
      element_text: (el.innerText || '').trim().slice(0, 50),
      element_id:   el.id || el.getAttribute('data-cta') || '',
      is_cta:       el.hasAttribute('data-cta'),
    }));
  });

  // ── ④ page_leave ─────────────────────────────────────────────────
  window.addEventListener('pagehide', function() {
    send(Object.assign(basePayload('page_leave'), {
      dwell_time_ms:      Date.now() - pageEnterTime,
      max_scroll_percent: maxScroll,
    }));
  });

  console.log('[portal-tracker] 已加载，上报至', ENDPOINT);
})();
