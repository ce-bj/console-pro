// Variant B — market + detail + cases + root

function BMarket({ setPage, setActive }) {
  const B = window.B, bMono = window.bMono;
  const [cat, setCat] = React.useState('全部');
  const list = cat === '全部' ? window.AGENTS : window.AGENTS.filter(a => a.category === cat);
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: B.panel }}>
      <aside style={{ width: 232, padding: 24, background: '#fff', borderRight: `1px solid ${B.rule}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', background: B.panel, borderRadius: 6, padding: '8px 12px', marginBottom: 18 }}>
          <span style={{ color: B.mute, marginRight: 8 }}>⌕</span>
          <input placeholder="搜索 Agent..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: B.mute, flex: 1 }} readOnly/>
          <span style={{ ...bMono, fontSize: 10, color: B.mute, border: `1px solid ${B.rule}`, padding: '0 4px', borderRadius: 3 }}>⌘K</span>
        </div>
        <div style={{ ...bMono, fontSize: 10, color: B.mute, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>分类</div>
        {['全部', ...window.CATEGORIES].map(c => (
          <div key={c} onClick={() => setCat(c)} style={{
            padding: '8px 10px', fontSize: 12, cursor: 'pointer', borderRadius: 6,
            color: cat === c ? B.accent : B.ink, fontWeight: cat === c ? 600 : 500,
            background: cat === c ? '#eaeffc' : 'transparent', marginBottom: 2,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>{c}</span>
            <span style={{ ...bMono, fontSize: 10, color: B.mute }}>{c === '全部' ? window.AGENTS.length : window.AGENTS.filter(a => a.category === c).length}</span>
          </div>
        ))}
        <div style={{ marginTop: 22, ...bMono, fontSize: 10, color: B.mute, textTransform: 'uppercase', marginBottom: 10 }}>能力筛选</div>
        {['流式输出', '私有部署', '审计日志', 'Tool calling', '人机协作'].map(f => (
          <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 12 }}>
            <input type="checkbox" defaultChecked={f === '流式输出'}/> {f}
          </label>
        ))}
      </aside>
      <main style={{ flex: 1, padding: 24, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{cat}</div>
            <div style={{ fontSize: 12, color: B.mute, marginTop: 2 }}>共 {list.length} 个 Agent · 按调用量排序</div>
          </div>
          <div style={{ display: 'flex', background: '#fff', borderRadius: 6, border: `1px solid ${B.rule}` }}>
            {['卡片', '表格', '指标'].map((v, i) => (
              <div key={v} style={{ padding: '6px 12px', fontSize: 12, cursor: 'pointer', background: i === 0 ? B.panel : 'transparent', fontWeight: i === 0 ? 600 : 400 }}>{v}</div>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {list.slice(0, 6).map(a => (
            <div key={a.id} onClick={() => { setActive(a); setPage('detail'); }} style={{
              background: '#fff', borderRadius: 8, border: `1px solid ${B.rule}`, padding: 16, cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, background: a.color, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>{a.name[0]}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: B.mute }}>{a.cn}</div>
                  </div>
                </div>
                <window.BSpark color={B.accent}/>
              </div>
              <div style={{ fontSize: 12, color: B.mute, lineHeight: 1.55, height: 36 }}>{a.desc}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 12, paddingTop: 10, borderTop: `1px solid ${B.rule}`, gap: 6 }}>
                <div><div style={{ fontSize: 10, color: B.mute }}>调用</div><div style={{ ...bMono, fontSize: 13, fontWeight: 600 }}>{a.calls}</div></div>
                <div><div style={{ fontSize: 10, color: B.mute }}>准确</div><div style={{ ...bMono, fontSize: 13, fontWeight: 600, color: B.pos }}>{a.accuracy}%</div></div>
                <div><div style={{ fontSize: 10, color: B.mute }}>单价</div><div style={{ ...bMono, fontSize: 13, fontWeight: 600 }}>¥{a.price.toFixed(3)}</div></div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function BDetail({ active, setPage }) {
  const B = window.B, bMono = window.bMono;
  const a = active || window.AGENTS[0];
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: B.panel }}>
      <div style={{ flex: 1, padding: '28px 32px', overflow: 'hidden' }}>
        <div style={{ ...bMono, fontSize: 11, color: B.mute, marginBottom: 12 }}>
          <span onClick={() => setPage('marketplace')} style={{ cursor: 'pointer', color: B.accent }}>市场</span> / {a.category} / <span style={{ color: B.ink }}>{a.name}</span>
        </div>
        <div style={{ background: '#fff', border: `1px solid ${B.rule}`, borderRadius: 10, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 64, height: 64, background: a.color, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 28 }}>{a.name[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{a.name}</div>
                <div style={{ fontSize: 16, color: B.mute }}>{a.cn}</div>
                <div style={{ marginLeft: 8, padding: '2px 8px', background: '#eaeffc', color: B.accent, borderRadius: 4, fontSize: 11, fontWeight: 600 }}>v2.4.1 · 稳定</div>
              </div>
              <div style={{ fontSize: 13, color: B.mute, marginTop: 6 }}>{a.desc}</div>
            </div>
            <button style={{ padding: '10px 20px', background: B.accent, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>立即接入</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, marginTop: 22, background: B.rule, borderRadius: 8, overflow: 'hidden' }}>
            {[
              ['调用单价', `¥${a.price.toFixed(3)}`, '/调用'],
              ['月调用量', a.calls, '过去30天'],
              ['P50 时延', `${a.latency}s`, 'P99 ' + (a.latency * 2.1).toFixed(1) + 's'],
              ['准确率', `${a.accuracy}%`, '基准评测'],
              ['在用企业', a.customers, '其中 500 强 ' + Math.floor(a.customers / 12)],
            ].map(([k, v, sub], i) => (
              <div key={i} style={{ background: '#fff', padding: 14 }}>
                <div style={{ fontSize: 11, color: B.mute }}>{k}</div>
                <div style={{ ...bMono, fontSize: 22, fontWeight: 700, marginTop: 4, letterSpacing: -0.5 }}>{v}</div>
                <div style={{ ...bMono, fontSize: 10, color: B.mute, marginTop: 2 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Tabs */}
        <div style={{ marginTop: 16, display: 'flex', gap: 4, borderBottom: `1px solid ${B.rule}` }}>
          {['能力详情', '集成方式', '基准评测', '版本日志', '审计与合规'].map((t, i) => (
            <div key={t} style={{ padding: '10px 16px', fontSize: 13, cursor: 'pointer', fontWeight: i === 0 ? 600 : 500, color: i === 0 ? B.accent : B.mute, borderBottom: i === 0 ? `2px solid ${B.accent}` : '2px solid transparent', marginBottom: -1 }}>{t}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
          <div style={{ background: '#fff', border: `1px solid ${B.rule}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>能力清单</div>
            {['多轮上下文 128K', '私有知识库挂载', 'Tool calling · 87 个连接器', '人机协作审批', '完整审计日志', '私有化 / K8s / 信创栈'].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '5px 0', color: B.ink }}>
                <span style={{ color: B.pos }}>✓</span> {t}
              </div>
            ))}
          </div>
          <div style={{ background: B.ink, color: '#cbd5e8', borderRadius: 8, padding: 16, ...bMono, fontSize: 11, lineHeight: 1.7 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, color: '#6b7691' }}>
              <span>// 接入示例</span><span>curl · TypeScript · Python</span>
            </div>
            <div><span style={{ color: '#f06292' }}>POST</span> <span style={{ color: '#fff' }}>/v1/agents/{a.id}/run</span></div>
            <div style={{ color: '#6b7691' }}>Authorization: Bearer sk-•••</div>
            <div style={{ color: '#6b7691' }}>Content-Type: application/json</div>
            <div style={{ marginTop: 8 }}>{`{`}</div>
            <div>&nbsp;&nbsp;<span style={{ color: '#ffb74d' }}>"input"</span>: <span style={{ color: '#a5d6a7' }}>"分析 2025 Q4 财报"</span>,</div>
            <div>&nbsp;&nbsp;<span style={{ color: '#ffb74d' }}>"stream"</span>: <span style={{ color: '#90caf9' }}>true</span>,</div>
            <div>&nbsp;&nbsp;<span style={{ color: '#ffb74d' }}>"tools"</span>: [<span style={{ color: '#a5d6a7' }}>"sql"</span>, <span style={{ color: '#a5d6a7' }}>"vector"</span>]</div>
            <div>{`}`}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BCases({ setPage }) {
  const B = window.B, bMono = window.bMono;
  return (
    <div style={{ flex: 1, padding: '32px 40px', overflow: 'hidden', background: B.panel }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -0.5 }}>客户实证</div>
          <div style={{ fontSize: 13, color: B.mute, marginTop: 4 }}>4 个行业实例 · 真实数据 · 可复现路径</div>
        </div>
        <div style={{ display: 'flex', gap: 8, ...bMono, fontSize: 11 }}>
          {['全部', '金融', '出行', '医疗', '制造'].map((t, i) => (
            <div key={t} style={{ padding: '6px 12px', background: i === 0 ? B.ink : '#fff', color: i === 0 ? '#fff' : B.ink, borderRadius: 100, border: `1px solid ${i === 0 ? B.ink : B.rule}`, cursor: 'pointer' }}>{t}</div>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {window.CASES.map((c, i) => (
          <div key={i} style={{ background: '#fff', border: `1px solid ${B.rule}`, borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, background: B.panel, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>{c.co[0]}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{c.co}</div>
                  <div style={{ fontSize: 11, color: B.mute }}>{c.industry} · {c.agent}</div>
                </div>
              </div>
              <div style={{ ...bMono, fontSize: 10, color: B.mute }}>CASE 0{i + 1}</div>
            </div>
            <div style={{ background: B.panel, borderRadius: 8, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: B.mute }}>核心指标</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: B.accent, ...bMono, letterSpacing: -0.5 }}>{c.metric}</div>
            </div>
            <p style={{ fontSize: 12.5, color: B.mute, lineHeight: 1.7, margin: 0, flex: 1 }}>&ldquo;{c.quote}&rdquo;</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${B.rule}` }}>
              <span style={{ fontSize: 11, color: B.mute }}>年化节省</span>
              <span style={{ ...bMono, fontSize: 16, fontWeight: 700, color: B.pos }}>{c.saved}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VariantB() {
  const [page, setPage] = React.useState('home');
  const [active, setActive] = React.useState(window.AGENTS[0]);
  const t = React.useContext(window.TweaksCtx || React.createContext({})) || {};
  // Mutate window.B before children render
  if (!window.B_BASE) window.B_BASE = { ...window.B };
  Object.assign(window.B, window.B_BASE);
  if (t.accentMap && t.accentMap.B) window.B.accent = t.accentMap.B;
  return (
    <div style={window.bWrap}>
      <window.BNav page={page} setPage={setPage}/>
      {page === 'home' && <window.BHome setPage={setPage} setActive={setActive}/>}
      {page === 'marketplace' && <BMarket setPage={setPage} setActive={setActive}/>}
      {page === 'detail' && <BDetail active={active} setPage={setPage}/>}
      {page === 'cases' && <BCases setPage={setPage}/>}
    </div>
  );
}

window.VariantB = VariantB;
