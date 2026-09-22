// ─────────────────────────────────────────────────────────────────────────────
//  sale-demo · AI 服务端
//  职责：行为事件接收 / 访客画像 API / AgentScope 会话 / LLM 代理 / TwentyCRM 写入
//  端口：8005   前端静态目录：../public
// ─────────────────────────────────────────────────────────────────────────────

const path    = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors    = require('cors');
const { Pool } = require('pg');

// ── AI / CRM 配置常量 ────────────────────────────────────────────
const VVEAI_API_KEY   = process.env.VVEAI_API_KEY || '';
const VVEAI_BASE_URL  = process.env.VVEAI_BASE_URL || 'https://api.vveai.com/v1';
const AI_MODEL        = process.env.AI_MODEL || 'gpt-5.5';

const AGENTSCOPE_URL      = process.env.AGENTSCOPE_URL || 'http://localhost:8000';
const AGENTSCOPE_AGENT_ID = process.env.AGENTSCOPE_AGENT_ID || '';
const AGENTSCOPE_CRED_ID  = process.env.AGENTSCOPE_CRED_ID || '';
const AGENTSCOPE_USER_ID  = process.env.AGENTSCOPE_USER_ID || 'user-001';

const TWENTYCRM_URL     = process.env.TWENTYCRM_URL || 'http://localhost:8006';
const TWENTYCRM_API_KEY = process.env.TWENTYCRM_API_KEY || '';

const AI_SYSTEM_PROMPT = `你是 Anvil 平台的智能销售助手。你的目标是通过自然对话帮助访客了解产品，渐进式收集他们的需求信息（公司名、岗位、关注点、痛点、联系方式），最终生成销售线索。

行为准则：
1. 首先了解访客的核心需求，不要一上来就索取联系方式
2. 根据访客回答提供针对性的产品介绍
3. 在对话自然推进后，再引导留资
4. 保持专业、亲切、简洁的中文语气
5. 每次回复控制在100字以内，多用问句推进对话`;

const app = express();
const PORT = 8005;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'anvil_demo',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

app.use(cors());
app.use(express.json());

// ── 静态文件：../public 目录 ──────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));

// ── Webhook: receive tracking events ──────────────────────────────
app.post('/webhook/track', async (req, res) => {
  const p = req.body;
  if (!p.event_id || !p.event_type || !p.session_id) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  const commonKeys = ['event_id','event_type','session_id','visitor_id',
    'tenant_id','page_url','referrer','device_type','timestamp'];
  const props = {};
  for (const k of Object.keys(p)) {
    if (!commonKeys.includes(k)) props[k] = p[k];
  }

  try {
    await pool.query(
      `INSERT INTO raw_events
         (event_id, event_type, session_id, visitor_id, tenant_id,
          page_url, referrer, device_type, event_time, props)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (event_id) DO NOTHING`,
      [
        p.event_id, p.event_type, p.session_id,
        p.visitor_id || 'anon', p.tenant_id || 'demo',
        p.page_url, p.referrer, p.device_type,
        p.timestamp, JSON.stringify(props),
      ]
    );
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('DB insert error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── API: page-level metrics (M1 diagnosis SQL) ────────────────────
app.get('/api/page-metrics', async (req, res) => {
  try {
    const result = await pool.query(`
      WITH sessions AS (
        SELECT
          session_id, page_url,
          MAX((props->>'dwell_time_ms')::numeric)::int      AS dwell_ms,
          MAX((props->>'max_scroll_percent')::numeric)::int AS max_scroll,
          MAX((props->>'load_time_ms')::numeric)::int       AS load_ms,
          COUNT(*) FILTER (WHERE event_type='click') AS click_count,
          MAX(device_type)                         AS device_type
        FROM raw_events
        WHERE tenant_id = 'demo'
        GROUP BY session_id, page_url
      )
      SELECT
        page_url,
        COUNT(*)                                           AS total_sessions,
        ROUND(AVG(load_ms))                                AS avg_load_ms,
        ROUND(
          COUNT(*) FILTER (
            WHERE dwell_ms < 10000 AND max_scroll < 25 AND click_count = 0
          )::numeric / NULLIF(COUNT(*),0), 3)              AS real_bounce_rate,
        ROUND(AVG(dwell_ms))                               AS avg_dwell_ms,
        ROUND(AVG(max_scroll))                             AS avg_scroll_percent,
        COUNT(*) FILTER (WHERE device_type='mobile')       AS mobile_sessions
      FROM sessions
      GROUP BY page_url
      ORDER BY real_bounce_rate DESC NULLS LAST
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── API: single-visitor profile (M3 SQL) ─────────────────────────
app.get('/api/visitor/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        visitor_id,
        COUNT(DISTINCT session_id)                              AS visit_count,
        COUNT(DISTINCT page_url)                               AS pages_viewed,
        ARRAY_AGG(DISTINCT page_url)                           AS visited_pages,
        COUNT(*) FILTER (WHERE event_type='click'
          AND (props->>'is_cta')::boolean = true)              AS cta_clicks,
        COUNT(*) FILTER (WHERE page_url LIKE '%pricing%')      AS pricing_visits,
        MAX((props->>'max_scroll_percent')::int)               AS deepest_scroll,
        MIN(event_time)                                        AS first_seen,
        MAX(event_time)                                        AS last_seen
      FROM raw_events
      WHERE tenant_id='demo' AND visitor_id=$1
      GROUP BY visitor_id
    `, [req.params.id]);
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── API: recent events (for live demo verification) ───────────────
app.get('/api/events', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const result = await pool.query(
      `SELECT id, event_type, session_id, visitor_id, page_url,
              event_time, props
       FROM raw_events
       WHERE tenant_id='demo'
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── API: write diagnosis result ───────────────────────────────────
app.post('/api/diagnosis', async (req, res) => {
  const { page_url, facts, diagnosis, strategy, agent_trace } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO diagnosis_results (tenant_id, page_url, facts, diagnosis, strategy, agent_trace)
       VALUES ('demo', $1, $2, $3, $4, $5) RETURNING id, run_time`,
      [page_url, JSON.stringify(facts), diagnosis, strategy, JSON.stringify(agent_trace)]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── API: list diagnosis results ───────────────────────────────────
app.get('/api/diagnosis', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM diagnosis_results WHERE tenant_id='demo' ORDER BY run_time DESC LIMIT 20`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── AI: 创建 AgentScope Session（用 Node 原生 fetch） ───────────────
app.post('/api/ai/session', async (req, res) => {
  const visitorId = req.body.visitor_id || 'anon';
  try {
    const upstream = await fetch(`${AGENTSCOPE_URL}/sessions/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': AGENTSCOPE_USER_ID,
      },
      body: JSON.stringify({
        agent_id: AGENTSCOPE_AGENT_ID,
        name: `chat-${visitorId}-${new Date().toLocaleString('sv-SE').replace(/[: ]/g, '-')}`,
        chat_model_config: {
          type: 'openai_credential',
          credential_id: AGENTSCOPE_CRED_ID,
          model: AI_MODEL,
          parameters: {},
        },
      }),
    });
    const data = await upstream.json();
    res.json(data);
  } catch (err) {
    console.error('[AgentScope session]', err.message);
    // 降级：返回本地生成的 session_id
    res.json({ session_id: `local-${new Date().toLocaleString('sv-SE').replace(/[: ]/g, '-')}` });
  }
});

// ── OpenAI 兼容透传代理（供 AgentScope 调用）──────────────────────
// AgentScope credential base_url 可指向 http://<sale-demo-host>:8005/v1
app.post('/v1/chat/completions', async (req, res) => {
  // 透传所有字段，保持 OpenAI 协议兼容
  const isStream = req.body.stream !== false;

  if (isStream) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
  }

  try {
    const upstream = await fetch(`${VVEAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VVEAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...req.body, model: req.body.model || AI_MODEL }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error('[proxy /v1] HTTP', upstream.status, errText);
      if (isStream) {
        res.write(`data: ${JSON.stringify({ error: `upstream ${upstream.status}` })}\n\n`);
        return res.end();
      }
      return res.status(upstream.status).json({ error: errText });
    }

    if (isStream) {
      const reader = upstream.body.getReader();
      const pump = async () => {
        while (true) {
          const { value, done } = await reader.read();
          if (done) { res.end(); break; }
          res.write(value);
        }
      };
      pump().catch(() => res.end());
      req.on('close', () => reader.cancel());
    } else {
      const data = await upstream.json();
      res.json(data);
    }
  } catch (err) {
    console.error('[proxy /v1]', err.message);
    if (isStream) { res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`); }
    res.end();
  }
});

// ── AI: 流式对话（通过 AgentScope → Mac /v1 代理 → vveai.com） ──
// AgentScope SSE 事件格式 → 转换为 OpenAI delta 格式透传给浏览器
app.post('/api/ai/chat', async (req, res) => {
  const { messages, session_id, visitor_id } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages 字段必填' });
  }

  // SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // 取最后一条 user 消息作为 AgentScope 的 input
  const lastMsg = messages[messages.length - 1];
  const agInput = {
    name: lastMsg.role === 'user' ? 'user' : 'assistant',
    role: lastMsg.role,
    content: [{ type: 'text', text: lastMsg.content }],
  };

  // 用传入的 session_id；没有则降级直接调 vveai.com
  const sid = session_id;
  if (!sid) {
    console.warn('[chat] 无 session_id，降级走直连 vveai');
    return fallbackToVveai(req, res, messages);
  }

  try {
    const upstream = await fetch(`${AGENTSCOPE_URL}/chat/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': AGENTSCOPE_USER_ID,
      },
      body: JSON.stringify({
        agent_id: AGENTSCOPE_AGENT_ID,
        session_id: sid,
        input: agInput,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error('[AgentScope chat] HTTP', upstream.status, errText);
      return fallbackToVveai(req, res, messages);
    }

    // AgentScope SSE → 转成 OpenAI delta 格式
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    const pump = async () => {
      while (true) {
        const { value, done } = await reader.read();
        if (done) { res.write('data: [DONE]\n\n'); res.end(); break; }

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop(); // 保留未完整的行

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(trimmed.slice(6));
            if (ev.type === 'TEXT_BLOCK_DELTA' && ev.delta) {
              // 转成 OpenAI streaming 格式
              const oaiChunk = {
                choices: [{ delta: { content: ev.delta }, index: 0 }],
              };
              res.write(`data: ${JSON.stringify(oaiChunk)}\n\n`);
            } else if (ev.type === 'REPLY_END') {
              res.write('data: [DONE]\n\n');
            }
          } catch (_) { /* 跳过非 JSON 行 */ }
        }
      }
    };

    pump().catch((err) => {
      console.error('[AgentScope pump]', err.message);
      res.end();
    });

    req.on('close', () => reader.cancel());

  } catch (err) {
    console.error('[AgentScope chat fetch]', err.message);
    return fallbackToVveai(req, res, messages);
  }
});

// 降级：直接调 vveai.com（session_id 缺失或 AgentScope 不可用时）
async function fallbackToVveai(req, res, messages) {
  try {
    const upstream = await fetch(`${VVEAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${VVEAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: 'system', content: AI_SYSTEM_PROMPT }, ...messages],
        stream: true, max_tokens: 512,
      }),
    });
    if (!upstream.ok) { res.write(`data: ${JSON.stringify({ error: 'fallback failed' })}\n\n`); return res.end(); }
    const reader = upstream.body.getReader();
    const pump = async () => {
      while (true) {
        const { value, done } = await reader.read();
        if (done) { res.end(); break; }
        res.write(value);
      }
    };
    pump().catch(() => res.end());
    req.on('close', () => reader.cancel());
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
}

// ── CRM: 写入线索到 TwentyCRM ─────────────────────────────────────
app.post('/api/crm/lead', async (req, res) => {
  const { name, email, phone, company, session_id, visitor_id } = req.body;

  const nameParts = (name || '未知访客').split(' ');
  const gql = {
    query: `
      mutation CreatePerson($data: PersonCreateInput!) {
        createPerson(data: $data) {
          id
          name { firstName lastName }
          emails { primaryEmail }
        }
      }
    `,
    variables: {
      data: {
        name: {
          firstName: nameParts[0] || '未知',
          lastName:  nameParts.slice(1).join(' ') || '',
        },
        ...(email && { emails: { primaryEmail: email, additionalEmails: [] } }),
        ...(phone && { phones: { primaryPhoneNumber: phone, additionalPhones: [], primaryPhoneCountryCode: 'CN' } }),
        city: '',
        jobTitle: company || '',
        linkedinLink: { primaryLinkUrl: '', primaryLinkLabel: '' },
        xLink:        { primaryLinkUrl: '', primaryLinkLabel: '' },
      },
    },
  };

  try {
    const upstream = await fetch(`${TWENTYCRM_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TWENTYCRM_API_KEY}`,
      },
      body: JSON.stringify(gql),
    });
    const parsed = await upstream.json();
    if (parsed.errors) {
      console.error('[TwentyCRM]', JSON.stringify(parsed.errors));
      return res.status(400).json({ error: parsed.errors[0]?.message, raw: parsed.errors });
    }
    res.json({ ok: true, person: parsed.data?.createPerson });
  } catch (err) {
    console.error('[TwentyCRM fetch]', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n✅ Anvil Demo Server running on http://localhost:${PORT}`);
  console.log(`   POST /webhook/track      — 接收埋点事件`);
  console.log(`   GET  /api/events         — 查看最近事件`);
  console.log(`   GET  /api/page-metrics   — M1 页面诊断指标`);
  console.log(`   GET  /api/visitor/:id    — M3 访客画像`);
  console.log(`   POST /api/diagnosis      — 写入诊断结果`);
  console.log(`   GET  /api/diagnosis      — 查看诊断历史`);
  console.log(`   POST /api/ai/session     — 创建 AgentScope 会话`);
  console.log(`   POST /api/ai/chat        — AI 流式对话（SSE → vveai.com）`);
  console.log(`   POST /api/crm/lead       — 线索写入 TwentyCRM\n`);
});
