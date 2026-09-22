// Variant C — market + detail + cases + root

function CMarket({ setPage, setActive }) {
  const C = window.C;
  const [cat, setCat] = React.useState('全部');
  const list = cat === '全部' ? window.AGENTS : window.AGENTS.filter(a => a.category === cat);
  const tints = ['#fdebd8', '#e6e9f5', '#dfeee6', '#f5dfe6', '#ece6dd', '#dde9f0'];
  return (
    <div style={{ flex: 1, padding: '8px 28px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <div style={{ ...window.cDisplay, fontSize: 42, lineHeight: 1 }}>探索 Agent 市场</div>
          <div style={{ fontSize: 13, color: C.mute, marginTop: 6 }}>320+ 个企业级 Agent · 15 分钟接入 · 按调用付费</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', background: C.panel, borderRadius: 100, padding: '6px 14px', border: `1px solid ${C.rule}`, width: 280 }}>
          <span style={{ color: C.mute, marginRight: 8 }}>⌕</span>
          <span style={{ fontSize: 13, color: C.mute }}>试试搜「自动回邮件」</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['全部', ...window.CATEGORIES].map(c => (
          <div key={c} onClick={() => setCat(c)} style={{
            padding: '7px 16px', borderRadius: 100, fontSize: 12.5, cursor: 'pointer',
            background: cat === c ? C.ink : C.panel,
            color: cat === c ? C.bg : C.ink, fontWeight: cat === c ? 600 : 500,
            border: `1px solid ${cat === c ? C.ink : C.rule}`,
          }}>{c}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, flex: 1 }}>
        {list.slice(0, 6).map((a, i) => (
          <div key={a.id} onClick={() => { setActive(a); setPage('detail'); }} style={{
            background: C.panel, borderRadius: 18, padding: 18, cursor: 'pointer',
            border: `1px solid ${C.rule}`, display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              background: tints[i % tints.length], borderRadius: 12, padding: 14, marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 44, height: 44, background: C.ink, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.bg, fontWeight: 800, fontSize: 20 }}>{a.name[0]}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17 }}>{a.name}</div>
                <div style={{ fontSize: 11.5, color: C.mute }}>{a.cn} · {a.tag}</div>
              </div>
            </div>
            <div style={{ fontSize: 12.5, color: C.mute, lineHeight: 1.6, flex: 1 }}>{a.desc}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${C.rule}` }}>
              <div>
                <div style={{ fontSize: 10, color: C.mute }}>调用价</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>¥{a.price.toFixed(3)}<span style={{ color: C.mute, fontSize: 10, fontWeight: 400 }}> / 次</span></div>
              </div>
              <div style={{ padding: '6px 12px', background: C.ink, color: C.bg, borderRadius: 100, fontSize: 11, fontWeight: 600 }}>试用 →</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CDetail({ active, setPage }) {
  const C = window.C;
  const a = active || window.AGENTS[0];
  return (
    <div style={{ flex: 1, padding: '8px 28px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 12, color: C.mute, marginBottom: 14 }}>
        <span onClick={() => setPage('marketplace')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Agent 市场</span> &nbsp;›&nbsp; {a.category} &nbsp;›&nbsp; <span style={{ color: C.ink }}>{a.name}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, flex: 1 }}>
        <div style={{ background: C.panel, borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
            <div style={{ width: 64, height: 64, background: C.accent, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 28 }}>{a.name[0]}</div>
            <div>
              <div style={{ ...window.cDisplay, fontSize: 38, lineHeight: 1 }}>{a.name}</div>
              <div style={{ fontSize: 14, color: C.mute, marginTop: 4 }}>{a.cn} · {a.category}</div>
            </div>
          </div>
          <p style={{ fontSize: 14.5, color: C.ink2, lineHeight: 1.7, margin: 0 }}>
            {a.desc}。基于 Anvil 编排引擎,即开即用,首月赠送 5 万次调用额度;
            支持私有部署、流式输出与完整审计日志,通过 ISO 27001 与 SOC 2 Type II 认证。
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 22 }}>
            {[
              ['多轮上下文 128K', '记得整段对话'],
              ['私有知识库', '挂你的文档,即问即答'],
              ['87 个连接器', '一键打通飞书/钉钉/Slack'],
              ['人机协作', '关键节点交由真人审批'],
            ].map(([k, v], i) => (
              <div key={i} style={{ background: C.bg, borderRadius: 12, padding: 12, border: `1px solid ${C.rule}` }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>✦ {k}</div>
                <div style={{ fontSize: 11.5, color: C.mute, marginTop: 4 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 18, display: 'flex', gap: 10 }}>
            <button style={{ flex: 1, padding: '14px 22px', background: C.ink, color: C.bg, border: 'none', borderRadius: 100, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>立即接入 {a.name} →</button>
            <button style={{ padding: '14px 22px', background: 'transparent', color: C.ink, border: `1px solid ${C.ink}`, borderRadius: 100, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>预约演示</button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: C.accent, color: '#fff', borderRadius: 20, padding: 22 }}>
            <div style={{ fontSize: 12, opacity: 0.85 }}>按调用计费 · 无最低消费</div>
            <div style={{ ...window.cDisplay, fontSize: 56, lineHeight: 1, marginTop: 6 }}>¥{a.price.toFixed(3)}</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>每次调用 · 失败不计费</div>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #ffffff30', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
              <div><div style={{ opacity: 0.7 }}>月调用</div><div style={{ fontWeight: 700, fontSize: 18 }}>{a.calls}</div></div>
              <div><div style={{ opacity: 0.7 }}>P50 时延</div><div style={{ fontWeight: 700, fontSize: 18 }}>{a.latency}s</div></div>
              <div><div style={{ opacity: 0.7 }}>准确率</div><div style={{ fontWeight: 700, fontSize: 18 }}>{a.accuracy}%</div></div>
              <div><div style={{ opacity: 0.7 }}>在用企业</div><div style={{ fontWeight: 700, fontSize: 18 }}>{a.customers}</div></div>
            </div>
          </div>
          <div style={{ background: C.panel, borderRadius: 20, padding: 18, border: `1px solid ${C.rule}`, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>谁在用 {a.name}</div>
            {['中信资本', '极氪汽车', '联影医疗', '小马出行'].map((co, i) => (
              <div key={co} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? `1px solid ${C.rule}` : 'none' }}>
                <div style={{ width: 30, height: 30, background: C.bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{co[0]}</div>
                <div style={{ flex: 1, fontSize: 12.5, fontWeight: 500 }}>{co}</div>
                <div style={{ fontSize: 11, color: C.mute }}>{['金融', '智造', '医疗', '出行'][i]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CCases({ setPage }) {
  const C = window.C;
  const accents = ['#d4571a', '#0d5d8a', '#0a7c5a', '#5c2bd6'];
  return (
    <div style={{ flex: 1, padding: '8px 28px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <div style={{ ...window.cDisplay, fontSize: 48, lineHeight: 1 }}>真实的企业,<br/>真实的回报。</div>
          <div style={{ fontSize: 13, color: C.mute, marginTop: 10 }}>2,400+ 家企业在 Anvil 上,把流程交给了 Agent。</div>
        </div>
        <button style={{ padding: '12px 22px', background: C.ink, color: C.bg, border: 'none', borderRadius: 100, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>查看全部 134 个案例 →</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, flex: 1 }}>
        {window.CASES.map((c, i) => (
          <div key={i} style={{
            background: C.panel, borderRadius: 20, padding: 24, position: 'relative',
            border: `1px solid ${C.rule}`, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, borderRadius: '50%', background: accents[i] + '22' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
              <div>
                <div style={{ fontSize: 11, color: C.mute, marginBottom: 4 }}>{c.industry} · 使用 {c.agent}</div>
                <div style={{ ...window.cDisplay, fontSize: 26, lineHeight: 1 }}>{c.co}</div>
              </div>
              <div style={{ padding: '4px 10px', background: accents[i], color: '#fff', borderRadius: 100, fontSize: 10, fontWeight: 700 }}>CASE 0{i + 1}</div>
            </div>
            <div style={{ marginTop: 18, fontSize: 11, color: C.mute }}>核心成果</div>
            <div style={{ ...window.cDisplay, fontSize: 32, lineHeight: 1.05, color: accents[i], marginTop: 4 }}>{c.metric}</div>
            <p style={{ fontSize: 13, color: C.ink2, lineHeight: 1.7, marginTop: 14, marginBottom: 0, flex: 1 }}>&ldquo;{c.quote}&rdquo;</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${C.rule}` }}>
              <div>
                <div style={{ fontSize: 10, color: C.mute }}>年化节省</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{c.saved}</div>
              </div>
              <div style={{ fontSize: 11, color: C.mute, textDecoration: 'underline' }}>读完整案例 →</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VariantC() {
  const [page, setPage] = React.useState('home');
  const [active, setActive] = React.useState(window.AGENTS[3]); // Quill default for warm feel
  const t = React.useContext(window.TweaksCtx || React.createContext({})) || {};
  if (!window.C_BASE) window.C_BASE = { ...window.C };
  if (!window.cDisplay_BASE) window.cDisplay_BASE = { ...window.cDisplay };
  Object.assign(window.C, window.C_BASE);
  Object.assign(window.cDisplay, window.cDisplay_BASE);
  if (t.accentMap && t.accentMap.C) window.C.accent = t.accentMap.C;
  if (t.headlineFont) window.cDisplay.fontFamily = t.headlineFont;
  if (t.headlineWeight) window.cDisplay.fontWeight = t.headlineWeight;
  return (
    <div style={window.cWrap}>
      <window.CNav page={page} setPage={setPage}/>
      {page === 'home' && <window.CHome setPage={setPage} setActive={setActive}/>}
      {page === 'marketplace' && <CMarket setPage={setPage} setActive={setActive}/>}
      {page === 'detail' && <CDetail active={active} setPage={setPage}/>}
      {page === 'cases' && <CCases setPage={setPage}/>}
    </div>
  );
}

window.VariantC = VariantC;
