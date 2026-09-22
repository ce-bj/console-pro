// Variant B — pages

function BHome({ setPage, setActive }) {
  const B = window.B, bMono = window.bMono;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', borderBottom: `1px solid ${B.rule}` }}>
        <div style={{ padding: '52px 40px 40px', borderRight: `1px solid ${B.rule}` }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 10px', background: '#eaeffc', borderRadius: 100, fontSize: 11, color: B.accent, fontWeight: 600, marginBottom: 22 }}>
            <span>●</span> Anvil 2026 · 全新企业级 Agent 编排
          </div>
          <h1 style={{ fontSize: 56, lineHeight: 1.05, letterSpacing: -1, margin: 0, fontWeight: 700 }}>
            企业的每一次调用,<br/>都在创造可量化的价值。
          </h1>
          <p style={{ fontSize: 15, color: B.mute, marginTop: 18, lineHeight: 1.65, maxWidth: 480 }}>
            Anvil 是一个面向企业的 AI Agent 市场和编排平台。320+ 入驻 Agent、按调用计费、
            生产级 SLA 保障 ——15 分钟接入,几行代码上线。
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
            <button onClick={() => setPage('marketplace')} style={{
              padding: '12px 22px', background: B.accent, color: '#fff', border: 'none', borderRadius: 6,
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>浏览 Agent 市场 →</button>
            <button onClick={() => setPage('cases')} style={{
              padding: '12px 22px', background: '#fff', color: B.ink, border: `1px solid ${B.rule}`, borderRadius: 6,
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>查看客户案例</button>
          </div>
          <div style={{ marginTop: 28, ...bMono, fontSize: 11, color: B.mute }}>
            已为 <span style={{ color: B.ink, fontWeight: 600 }}>中信资本 · 极氪 · 联影医疗 · 小马出行</span> 等 2,400+ 企业服务
          </div>
        </div>
        {/* Live data panel */}
        <div style={{ padding: '32px 32px', background: B.panel }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ ...bMono, fontSize: 11, color: B.mute }}>● LIVE · 平台 24h 运行</div>
            <div style={{ ...bMono, fontSize: 11, color: B.mute }}>14:32:08 CST</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {window.STATS.map((s, i) => (
              <div key={i} style={{ background: '#fff', padding: '14px 16px', borderRadius: 8, border: `1px solid ${B.rule}` }}>
                <div style={{ fontSize: 11, color: B.mute }}>{s.k}</div>
                <div style={{ ...bMono, fontSize: 24, fontWeight: 700, marginTop: 4, letterSpacing: -0.5 }}>{s.v}</div>
                <div style={{ ...bMono, fontSize: 10, color: B.pos, marginTop: 2 }}>{s.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, background: '#fff', borderRadius: 8, border: `1px solid ${B.rule}`, padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: B.mute }}>调用量趋势 · 24h</span>
              <span style={{ ...bMono, fontSize: 11, color: B.pos }}>+18.4%</span>
            </div>
            <svg viewBox="0 0 280 56" width="100%" height="56">
              <defs><linearGradient id="bg1" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={B.accent} stopOpacity="0.25"/><stop offset="1" stopColor={B.accent} stopOpacity="0"/></linearGradient></defs>
              <path d="M0,38 L20,34 L40,40 L60,28 L80,32 L100,22 L120,26 L140,18 L160,20 L180,14 L200,16 L220,10 L240,12 L260,8 L280,6 L280,56 L0,56 Z" fill="url(#bg1)"/>
              <path d="M0,38 L20,34 L40,40 L60,28 L80,32 L100,22 L120,26 L140,18 L160,20 L180,14 L200,16 L220,10 L240,12 L260,8 L280,6" fill="none" stroke={B.accent} strokeWidth="1.5"/>
            </svg>
          </div>
        </div>
      </section>

      {/* Quick agent table */}
      <section style={{ padding: '24px 40px', flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>热门 Agent · 实时数据</div>
            <div style={{ fontSize: 12, color: B.mute, marginTop: 2 }}>按过去 7 天调用量排序</div>
          </div>
          <a onClick={() => setPage('marketplace')} style={{ ...bMono, fontSize: 12, color: B.accent, cursor: 'pointer' }}>查看全部 320 个 →</a>
        </div>
        <div style={{ border: `1px solid ${B.rule}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '40px 1.4fr 1fr 0.7fr 0.7fr 0.7fr 0.9fr 0.5fr', background: B.panel, padding: '10px 14px', ...bMono, fontSize: 10, color: B.mute, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            <div>#</div><div>Agent</div><div>分类</div><div>调用</div><div>准确率</div><div>P50</div><div>单价</div><div></div>
          </div>
          {window.AGENTS.slice(0, 6).map((a, i) => (
            <div key={a.id} onClick={() => { setActive(a); setPage('detail'); }} style={{
              display: 'grid', gridTemplateColumns: '40px 1.4fr 1fr 0.7fr 0.7fr 0.7fr 0.9fr 0.5fr',
              padding: '12px 14px', borderTop: `1px solid ${B.rule}`, alignItems: 'center', cursor: 'pointer', fontSize: 13,
            }}>
              <div style={{ ...bMono, color: B.mute, fontSize: 11 }}>0{i + 1}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, background: a.color, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>{a.name[0]}</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{a.name} <span style={{ color: B.mute, fontWeight: 400 }}>· {a.cn}</span></div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: B.mute }}>{a.category}</div>
              <div style={{ ...bMono }}>{a.calls}</div>
              <div style={{ ...bMono, color: B.pos }}>{a.accuracy}%</div>
              <div style={{ ...bMono }}>{a.latency}s</div>
              <div style={{ ...bMono, fontWeight: 600 }}>¥{a.price.toFixed(3)}</div>
              <div style={{ textAlign: 'right', color: B.accent, ...bMono, fontSize: 11 }}>详情 →</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

window.BHome = BHome;
