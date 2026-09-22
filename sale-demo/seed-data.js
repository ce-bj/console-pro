// seed-data.js — 造演示用数据
// 按文档第6章剧本：三个页面，其中 /detail 加载慢+高跳出，/marketplace 正常，一个高意向访客
// 运行: node seed-data.js

const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost', port: 5432,
  database: 'anvil_demo', user: 'simon', password: '123456',
});

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function ts(minutesAgo = 0) {
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
}

async function insert(row) {
  await pool.query(
    `INSERT INTO raw_events
       (event_id, event_type, session_id, visitor_id, tenant_id,
        page_url, referrer, device_type, event_time, props)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (event_id) DO NOTHING`,
    [row.event_id, row.event_type, row.session_id, row.visitor_id,
     'demo', row.page_url, row.referrer || 'direct', row.device_type || 'desktop',
     row.event_time, JSON.stringify(row.props || {})]
  );
}

// ── 模拟一次完整访问 ────────────────────────────────────────────────
async function visit({ visitorId, sessionId, page, loadMs, dwellMs, maxScroll, clicks, device }) {
  const t = Math.floor(Math.random() * 60) + 1;

  await insert({
    event_id: uuid(), event_type: 'page_view',
    session_id: sessionId, visitor_id: visitorId,
    page_url: page, device_type: device,
    event_time: ts(t),
    props: { load_time_ms: loadMs, viewport: '1440x900' },
  });

  const milestones = [25, 50, 75, 100].filter(m => m <= maxScroll);
  for (const m of milestones) {
    await insert({
      event_id: uuid(), event_type: 'scroll_depth',
      session_id: sessionId, visitor_id: visitorId,
      page_url: page, device_type: device,
      event_time: ts(t - 0.2),
      props: { depth_percent: m },
    });
  }

  for (const c of (clicks || [])) {
    await insert({
      event_id: uuid(), event_type: 'click',
      session_id: sessionId, visitor_id: visitorId,
      page_url: page, device_type: device,
      event_time: ts(t - 0.5),
      props: { element_text: c.text, element_id: c.id || '', is_cta: c.isCta || false },
    });
  }

  await insert({
    event_id: uuid(), event_type: 'page_leave',
    session_id: sessionId, visitor_id: visitorId,
    page_url: page, device_type: device,
    event_time: ts(t - 1),
    props: { dwell_time_ms: dwellMs, max_scroll_percent: maxScroll },
  });
}

async function main() {
  console.log('正在清空旧演示数据...');
  await pool.query("DELETE FROM raw_events WHERE tenant_id='demo'");
  await pool.query("DELETE FROM diagnosis_results WHERE tenant_id='demo'");

  console.log('生成演示数据...\n');

  // ── 问题页面 1：/demo.html (首页) — 加载慢，部分跳出 ───────────
  // 20 个访客，其中 8 个真实跳出（停留<10s, 滚动<25%）
  for (let i = 0; i < 12; i++) {
    await visit({
      visitorId: `v-home-${i}`, sessionId: `s-home-${i}`,
      page: '/demo.html', loadMs: 4200 + Math.floor(Math.random() * 800),
      dwellMs: Math.floor(45000 + Math.random() * 30000), maxScroll: 60 + Math.floor(Math.random() * 40),
      clicks: [{ text: '浏览市场 →', id: 'browse-market', isCta: true }],
      device: i % 4 === 0 ? 'mobile' : 'desktop',
    });
  }
  for (let i = 0; i < 8; i++) {
    await visit({
      visitorId: `v-home-bounce-${i}`, sessionId: `s-home-b-${i}`,
      page: '/demo.html', loadMs: 5800 + Math.floor(Math.random() * 1200),
      dwellMs: Math.floor(3000 + Math.random() * 5000), maxScroll: 10,
      clicks: [], device: 'mobile',
    });
  }
  console.log('✓ /demo.html  20 个会话（含 8 真实跳出，加载耗时 ~5000ms，移动端 mobile 比例高）');

  // ── 正常页面：/marketplace ── 低跳出，互动好 ──────────────────
  for (let i = 0; i < 18; i++) {
    await visit({
      visitorId: `v-mkt-${i}`, sessionId: `s-mkt-${i}`,
      page: '/#marketplace', loadMs: 900 + Math.floor(Math.random() * 300),
      dwellMs: Math.floor(60000 + Math.random() * 60000), maxScroll: 70 + Math.floor(Math.random() * 30),
      clicks: [
        { text: '客服/销售 Agent', id: '', isCta: false },
        { text: 'Atlas', id: '', isCta: false },
      ],
      device: i % 6 === 0 ? 'mobile' : 'desktop',
    });
  }
  console.log('✓ /#marketplace  18 个会话（低跳出，加载快 ~1000ms）');

  // ── 正常页面：/detail ── 高意向，CTA 多 ─────────────────────────
  for (let i = 0; i < 15; i++) {
    await visit({
      visitorId: `v-detail-${i}`, sessionId: `s-detail-${i}`,
      page: '/#detail', loadMs: 1100 + Math.floor(Math.random() * 400),
      dwellMs: Math.floor(90000 + Math.random() * 60000), maxScroll: 80 + Math.floor(Math.random() * 20),
      clicks: [
        { text: '开通 Agent →', id: 'activate-agent', isCta: true },
      ],
      device: 'desktop',
    });
  }
  console.log('✓ /#detail  15 个会话（高停留，CTA 点击多）');

  // ── 高意向访客 Zhang Wei：多次访问，看定价，点 CTA ─────────────
  const hvId = 'visitor-zhang-wei-hvip';
  for (let session = 0; session < 3; session++) {
    const sid = `s-zhang-${session}`;
    await visit({
      visitorId: hvId, sessionId: sid,
      page: '/demo.html', loadMs: 4500, dwellMs: 35000, maxScroll: 55,
      clicks: [{ text: '浏览市场 →', id: 'browse-market', isCta: true }],
      device: 'desktop',
    });
    await visit({
      visitorId: hvId, sessionId: sid,
      page: '/#marketplace', loadMs: 950, dwellMs: 80000, maxScroll: 90,
      clicks: [{ text: '数据分析 Agent', id: '', isCta: false }],
      device: 'desktop',
    });
    await visit({
      visitorId: hvId, sessionId: sid,
      page: '/#detail', loadMs: 1000, dwellMs: 120000, maxScroll: 100,
      clicks: [
        { text: '开通 Agent →', id: 'activate-agent', isCta: true },
        { text: '预约方案咨询', id: 'book-consult', isCta: true },
      ],
      device: 'desktop',
    });
    // 模拟定价页访问（用于 M3 SQL pricing_visits 统计）
    await visit({
      visitorId: hvId, sessionId: sid,
      page: '/pricing', loadMs: 800, dwellMs: 45000, maxScroll: 70,
      clicks: [{ text: '申请试用 →', id: 'apply-trial', isCta: true }],
      device: 'desktop',
    });
  }
  console.log(`✓ 高意向访客 ${hvId} — 3 次会话，每次访问首页→市场→详情→定价页，多次 CTA 点击`);

  // ── 汇总 ──────────────────────────────────────────────────────────
  const { rows } = await pool.query("SELECT COUNT(*) FROM raw_events WHERE tenant_id='demo'");
  console.log(`\n✅ 共写入 ${rows[0].count} 条事件`);
  console.log('\n现在可以访问 http://localhost:3001/api/page-metrics 验证指标');
  console.log(`高意向访客 ID: ${hvId}`);
  console.log(`访客画像: http://localhost:3001/api/visitor/${hvId}`);

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
