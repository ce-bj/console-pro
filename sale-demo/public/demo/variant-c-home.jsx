// Variant C — Home

function CHome({ setPage, setActive }) {
  const C = window.C;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <section style={{ padding: '24px 28px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Hero card */}
        <div style={{
          background: C.ink, color: C.bg, borderRadius: 24, padding: '44px 44px 0',
          position: 'relative', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column',
        }}>
          {/* Decorative orbs */}
          <div style={{ position: 'absolute', right: -120, top: -120, width: 360, height: 360, borderRadius: '50%', background: `radial-gradient(circle at 30% 30%, ${C.accent}cc, transparent 65%)` }}></div>
          <div style={{ position: 'absolute', right: 120, bottom: -80, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, #f5b067aa, transparent 70%)` }}></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#c8bfb0', marginBottom: 24, position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#ffffff15', borderRadius: 100, border: '1px solid #ffffff20' }}>
              <span style={{ color: C.accent }}>●</span> 2026 Spring 发布
            </div>
            新增 47 个 Agent · 上线编排画布
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 40, flex: 1, position: 'relative' }}>
            <div>
              <h1 style={{ ...window.cDisplay, fontSize: 76, lineHeight: 0.98, margin: 0 }}>
                给企业的<br/>
                每件麻烦事,<br/>
                <span style={{ color: C.accent }}>一个 Agent。</span>
              </h1>
              <p style={{ fontSize: 16, color: '#c8bfb0', marginTop: 24, lineHeight: 1.65, maxWidth: 460 }}>
                320+ 即用即走的企业级 Agent。客服、研发、运营、合规、医疗、金融——
                按调用计费,生产可用,不必从零搭。
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 32 }}>
                <button onClick={() => setPage('marketplace')} style={{
                  padding: '14px 24px', background: C.accent, color: '#fff', border: 'none', borderRadius: 100,
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}>逛逛 Agent 市场 →</button>
                <button onClick={() => setPage('cases')} style={{
                  padding: '14px 24px', background: 'transparent', color: C.bg, border: '1px solid #ffffff30', borderRadius: 100,
                  fontSize: 14, fontWeight: 500, cursor: 'pointer',
                }}>看 4 家公司怎么用</button>
              </div>
            </div>

            {/* Floating agent preview card */}
            <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div style={{ background: C.bg, color: C.ink, borderRadius: 18, padding: 18, boxShadow: '0 24px 60px -10px #00000055', transform: 'rotate(-1.5deg)', marginBottom: -40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, background: C.accent, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16 }}>Q</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Quill · 内容创作</div>
                    <div style={{ fontSize: 11, color: C.mute }}>正在为「极氪 001 春季促销」生成 5 个版本...</div>
                  </div>
                </div>
                <div style={{ background: C.bg, border: `1px solid ${C.rule}`, borderRadius: 10, padding: 10, fontSize: 11.5, lineHeight: 1.55 }}>
                  <span style={{ color: C.mute }}>v3 · 公众号头条 ·</span>{' '}春天来了,把驾驶座留给惊喜。极氪 001 限时换购,送您 365 天的春风路况...
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11 }}>
                  <span style={{ color: C.mute }}>调用 #482,901 · 0.43s</span>
                  <span style={{ color: C.accent, fontWeight: 600 }}>¥ 0.006</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats + trust strip */}
      <section style={{ padding: '52px 28px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
        {window.STATS.map((s, i) => (
          <div key={i} style={{ background: i === 0 ? C.accent : C.panel, color: i === 0 ? '#fff' : C.ink, borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 12, opacity: 0.75 }}>{s.k}</div>
            <div style={{ ...window.cDisplay, fontSize: 36, marginTop: 4, letterSpacing: -1 }}>{s.v}</div>
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </section>
    </div>
  );
}

window.CHome = CHome;
