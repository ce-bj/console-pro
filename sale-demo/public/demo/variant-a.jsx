// Variant A — 极简编辑风 / Editorial Minimal
// Sober off-white, large serif headline (Noto Serif SC), monospace meta,
// hairline rules, single warm-olive accent.

const A = {
  bg: '#f7f5f0',
  panel: '#ffffff',
  ink: '#161513',
  mute: '#6b665d',
  rule: '#d9d4c8',
  accent: '#3a4d2b',
  card: '#efece4',
};

const aWrap = {
  width: 1280,
  height: 800,
  background: A.bg,
  color: A.ink,
  fontFamily: '"Inter", "Noto Sans SC", system-ui, sans-serif',
  fontSize: 13,
  letterSpacing: 0.1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const aSerif = { fontFamily: '"Noto Serif SC", "Source Serif Pro", Georgia, serif', fontWeight: 500 };
const aMono = { fontFamily: '"JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace', letterSpacing: 0.4 };

function ANav({ page, setPage }) {
  const tabs = [
    ['home', '首页'],
    ['marketplace', 'Agent 市场'],
    ['detail', 'Agent 详情'],
    ['cases', '客户实例'],
  ];
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 56px', borderBottom: `1px solid ${A.rule}`, background: A.bg,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 22, height: 22, background: A.ink, transform: 'rotate(45deg)' }}></div>
        <div style={{ ...aSerif, fontSize: 19, letterSpacing: 1 }}>Anvil<span style={{ color: A.accent, marginLeft: 2 }}>.</span></div>
        <div style={{ ...aMono, fontSize: 10, color: A.mute, marginLeft: 6, textTransform: 'uppercase' }}>企业 AI Agent 市场</div>
      </div>
      <nav style={{ display: 'flex', gap: 28, fontSize: 13 }}>
        {tabs.map(([k, lbl]) => (
          <a key={k} onClick={() => setPage(k)} style={{
            cursor: 'pointer', color: page === k ? A.ink : A.mute,
            paddingBottom: 4, borderBottom: page === k ? `1px solid ${A.ink}` : '1px solid transparent',
          }}>{lbl}</a>
        ))}
        <a style={{ cursor: 'pointer', color: A.mute }}>文档</a>
        <a style={{ cursor: 'pointer', color: A.mute }}>定价</a>
      </nav>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ ...aMono, fontSize: 11, color: A.mute }}>登录</div>
        <button style={{
          padding: '8px 18px', background: A.ink, color: A.bg, border: 'none',
          ...aMono, fontSize: 11, letterSpacing: 1, cursor: 'pointer',
        }}>申请试用 →</button>
      </div>
    </header>
  );
}

function AHome({ setPage, setActive }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Hero */}
      <section style={{ padding: '64px 56px 36px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 56 }}>
        <div>
          <div style={{ ...aMono, fontSize: 11, color: A.accent, marginBottom: 28, textTransform: 'uppercase' }}>
            ◆ &nbsp; 2026 Q2 · 320+ Agents on Anvil
          </div>
          <h1 style={{ ...aSerif, fontSize: 72, lineHeight: 1.02, letterSpacing: -0.5, margin: 0 }}>
            为每个<br />
            企业流程,<br />
            <span style={{ color: A.accent, fontStyle: 'italic', fontWeight: 400 }}>装上一个 Agent。</span>
          </h1>
          <p style={{ marginTop: 24, fontSize: 15, lineHeight: 1.7, color: A.mute, maxWidth: 480 }}>
            Anvil 是一个面向企业的 AI Agent 市场。从客服、研发、运营到合规、医疗、金融
            ——按调用次数付费,15 分钟接入,生产可用。
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 36 }}>
            <button onClick={() => setPage('marketplace')} style={{
              padding: '14px 26px', background: A.ink, color: A.bg, border: 'none',
              ...aMono, fontSize: 12, letterSpacing: 1, cursor: 'pointer',
            }}>浏览市场 →</button>
            <button onClick={() => setPage('cases')} style={{
              padding: '14px 26px', background: 'transparent', color: A.ink, border: `1px solid ${A.ink}`,
              ...aMono, fontSize: 12, letterSpacing: 1, cursor: 'pointer',
            }}>查看案例</button>
          </div>
        </div>
        {/* Right: ticker / featured */}
        <div style={{ borderLeft: `1px solid ${A.rule}`, paddingLeft: 40 }}>
          <div style={{ ...aMono, fontSize: 10, color: A.mute, marginBottom: 18, textTransform: 'uppercase' }}>
            实时调用 · 截至 14:32:08
          </div>
          {window.AGENTS.slice(0, 5).map((a, i) => (
            <div key={a.id} onClick={() => { setActive(a); setPage('detail'); }} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              padding: '14px 0', borderBottom: `1px solid ${A.rule}`, cursor: 'pointer',
            }}>
              <div>
                <div style={{ ...aSerif, fontSize: 17 }}>{a.name}<span style={{ color: A.mute, fontSize: 13, marginLeft: 8 }}>· {a.cn}</span></div>
                <div style={{ ...aMono, fontSize: 10, color: A.mute, marginTop: 4 }}>{a.tag.toUpperCase()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ ...aMono, fontSize: 14 }}>¥{a.price.toFixed(3)}</div>
                <div style={{ ...aMono, fontSize: 10, color: A.mute }}>/调用</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats strip */}
      <section style={{
        margin: '0 56px', borderTop: `1px solid ${A.rule}`, borderBottom: `1px solid ${A.rule}`,
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
      }}>
        {window.STATS.map((s, i) => (
          <div key={i} style={{
            padding: '22px 24px',
            borderRight: i < 3 ? `1px solid ${A.rule}` : 'none',
          }}>
            <div style={{ ...aSerif, fontSize: 34, lineHeight: 1 }}>{s.v}</div>
            <div style={{ fontSize: 12, marginTop: 8, color: A.ink }}>{s.k}</div>
            <div style={{ ...aMono, fontSize: 10, color: A.mute, marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </section>

      {/* Featured agents */}
      <section style={{ padding: '32px 56px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
          <div style={{ ...aMono, fontSize: 10, color: A.mute, textTransform: 'uppercase' }}>本周精选 · CURATED</div>
          <a onClick={() => setPage('marketplace')} style={{ ...aMono, fontSize: 11, cursor: 'pointer' }}>查看全部 320 个 →</a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {window.AGENTS.slice(0, 4).map((a) => (
            <div key={a.id} onClick={() => { setActive(a); setPage('detail'); }} style={{
              background: A.panel, padding: 18, cursor: 'pointer', border: `1px solid ${A.rule}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ ...aSerif, fontSize: 20 }}>{a.name}</div>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: A.accent }}></div>
              </div>
              <div style={{ ...aMono, fontSize: 10, color: A.mute, marginTop: 2 }}>{a.cn.toUpperCase()}</div>
              <div style={{ fontSize: 12, color: A.mute, marginTop: 10, lineHeight: 1.5, height: 50 }}>{a.desc}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: `1px dashed ${A.rule}` }}>
                <span style={{ ...aMono, fontSize: 11 }}>¥{a.price.toFixed(3)}</span>
                <span style={{ ...aMono, fontSize: 10, color: A.mute }}>{a.customers} 家在用</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function AMarket({ setPage, setActive }) {
  const [cat, setCat] = React.useState('全部');
  const list = cat === '全部' ? window.AGENTS : window.AGENTS.filter(a => a.category === cat);
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <aside style={{ width: 240, padding: '32px 28px', borderRight: `1px solid ${A.rule}`, flexShrink: 0 }}>
        <div style={{ ...aMono, fontSize: 10, color: A.mute, marginBottom: 14, textTransform: 'uppercase' }}>分类</div>
        {['全部', ...window.CATEGORIES].map(c => (
          <div key={c} onClick={() => setCat(c)} style={{
            padding: '8px 0', cursor: 'pointer', fontSize: 13,
            color: cat === c ? A.ink : A.mute, fontWeight: cat === c ? 500 : 400,
            borderLeft: cat === c ? `2px solid ${A.accent}` : '2px solid transparent',
            paddingLeft: 10, marginLeft: -10,
          }}>{c}</div>
        ))}
        <div style={{ marginTop: 32, ...aMono, fontSize: 10, color: A.mute, textTransform: 'uppercase' }}>价格区间</div>
        <div style={{ marginTop: 12, height: 4, background: A.rule, position: 'relative' }}>
          <div style={{ position: 'absolute', left: '10%', right: '30%', top: 0, bottom: 0, background: A.ink }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, ...aMono, fontSize: 10 }}>
          <span>¥0.003</span><span>¥0.018</span>
        </div>
      </aside>
      <main style={{ flex: 1, padding: '32px 40px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 22 }}>
          <h2 style={{ ...aSerif, fontSize: 32, margin: 0 }}>{cat}<span style={{ ...aMono, fontSize: 12, color: A.mute, marginLeft: 12 }}>· {list.length} 个 Agent</span></h2>
          <div style={{ display: 'flex', gap: 16, ...aMono, fontSize: 11, color: A.mute }}>
            <span>排序: 最新</span><span>·</span><span>调用量</span><span>·</span><span>评分</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {list.slice(0, 6).map(a => (
            <div key={a.id} onClick={() => { setActive(a); setPage('detail'); }} style={{
              background: A.panel, border: `1px solid ${A.rule}`, padding: 20, cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ ...aSerif, fontSize: 22 }}>{a.name}</div>
                  <div style={{ ...aMono, fontSize: 10, color: A.mute, marginTop: 4 }}>{a.category.toUpperCase()}</div>
                </div>
                <div style={{ ...aMono, fontSize: 10, color: A.accent, padding: '2px 6px', border: `1px solid ${A.accent}` }}>{a.tag}</div>
              </div>
              <div style={{ fontSize: 12, color: A.mute, marginTop: 12, lineHeight: 1.55, height: 36 }}>{a.desc}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', marginTop: 16, paddingTop: 12, borderTop: `1px solid ${A.rule}` }}>
                <div>
                  <div style={{ ...aMono, fontSize: 10, color: A.mute }}>调用</div>
                  <div style={{ ...aSerif, fontSize: 16 }}>{a.calls}</div>
                </div>
                <div>
                  <div style={{ ...aMono, fontSize: 10, color: A.mute }}>准确率</div>
                  <div style={{ ...aSerif, fontSize: 16 }}>{a.accuracy}%</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ ...aMono, fontSize: 10, color: A.mute }}>单价</div>
                  <div style={{ ...aSerif, fontSize: 16 }}>¥{a.price.toFixed(3)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function ADetail({ active, setPage }) {
  const a = active || window.AGENTS[0];
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <div style={{ flex: 1, padding: '40px 56px', overflow: 'hidden' }}>
        <div style={{ ...aMono, fontSize: 10, color: A.mute, marginBottom: 14 }}>
          <span onClick={() => setPage('marketplace')} style={{ cursor: 'pointer' }}>市场</span> &nbsp;/&nbsp; {a.category} &nbsp;/&nbsp; {a.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <h1 style={{ ...aSerif, fontSize: 64, margin: 0, lineHeight: 1 }}>{a.name}</h1>
          <div style={{ ...aSerif, fontSize: 22, color: A.mute, fontStyle: 'italic' }}>· {a.cn}</div>
        </div>
        <p style={{ fontSize: 16, color: A.mute, marginTop: 16, lineHeight: 1.65, maxWidth: 560 }}>
          {a.desc}。基于 Anvil 编排引擎,支持私有部署、流式输出与完整审计日志,通过 ISO 27001 与 SOC 2 Type II。
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, marginTop: 32, border: `1px solid ${A.rule}`, background: A.panel }}>
          {[
            ['调用单价', `¥${a.price.toFixed(3)}`, '/ 次'],
            ['月调用', a.calls, '过去 30 天'],
            ['平均时延', `${a.latency}s`, 'P50'],
            ['客户数', `${a.customers}`, '在用企业'],
          ].map(([k, v, sub], i) => (
            <div key={i} style={{ padding: 20, borderRight: i < 3 ? `1px solid ${A.rule}` : 'none' }}>
              <div style={{ ...aMono, fontSize: 10, color: A.mute, textTransform: 'uppercase' }}>{k}</div>
              <div style={{ ...aSerif, fontSize: 26, marginTop: 6 }}>{v}</div>
              <div style={{ ...aMono, fontSize: 10, color: A.mute, marginTop: 2 }}>{sub}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 28 }}>
          <div style={{ ...aMono, fontSize: 10, color: A.mute, marginBottom: 12, textTransform: 'uppercase' }}>能力清单</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13, lineHeight: 1.7 }}>
            {[
              '多轮对话 · 上下文 128K',
              '私有知识库挂载 (向量 + 全文)',
              'Tool calling · 87 个标准连接器',
              '人机协作 · 关键节点人工审批',
              '完整审计日志 · 可追溯',
              '私有化部署 · K8s / 信创栈',
            ].map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ color: A.accent }}>◆</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside style={{ width: 380, borderLeft: `1px solid ${A.rule}`, padding: 40, background: A.panel, flexShrink: 0 }}>
        <div style={{ ...aMono, fontSize: 10, color: A.mute, textTransform: 'uppercase', marginBottom: 16 }}>立即接入</div>
        <div style={{ background: A.card, padding: 18, marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: A.mute }}>按调用计费</span>
            <span style={{ ...aMono }}>¥ {a.price.toFixed(3)} / 次</span>
          </div>
          <div style={{ marginTop: 12, ...aSerif, fontSize: 28 }}>¥{(a.price * 100000).toFixed(0)}<span style={{ ...aMono, fontSize: 12, color: A.mute }}> / 10万次</span></div>
          <div style={{ ...aMono, fontSize: 10, color: A.mute, marginTop: 6 }}>首月赠送 5 万次额度</div>
        </div>
        <button style={{
          width: '100%', padding: 14, background: A.ink, color: A.bg, border: 'none',
          ...aMono, fontSize: 12, letterSpacing: 1, cursor: 'pointer', marginBottom: 8,
        }}>开通 Agent →</button>
        <button style={{
          width: '100%', padding: 14, background: 'transparent', color: A.ink, border: `1px solid ${A.ink}`,
          ...aMono, fontSize: 12, letterSpacing: 1, cursor: 'pointer',
        }}>预约方案咨询</button>
        <div style={{ marginTop: 22, paddingTop: 18, borderTop: `1px solid ${A.rule}` }}>
          <div style={{ ...aMono, fontSize: 10, color: A.mute, marginBottom: 10 }}>SAMPLE</div>
          <pre style={{ ...aMono, fontSize: 10.5, lineHeight: 1.55, background: A.bg, padding: 12, margin: 0, color: A.ink, overflow: 'hidden' }}>{`POST /v1/agents/${a.id}/run
Authorization: Bearer •••
{
  "input": "...",
  "stream": true
}`}</pre>
        </div>
      </aside>
    </div>
  );
}

function ACases({ setPage }) {
  return (
    <div style={{ flex: 1, padding: '40px 56px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1 style={{ ...aSerif, fontSize: 56, margin: 0, lineHeight: 1 }}>
          它们已经在用<br/><span style={{ fontStyle: 'italic', color: A.accent }}>Anvil 改写流程。</span>
        </h1>
        <div style={{ ...aMono, fontSize: 11, color: A.mute, textAlign: 'right' }}>
          截至 2026 Q2<br/>
          <span style={{ color: A.ink, fontSize: 20, ...aSerif }}>2,400+</span> 家企业
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 36 }}>
        {window.CASES.map((c, i) => (
          <div key={i} style={{ background: A.panel, border: `1px solid ${A.rule}`, padding: 28, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ ...aSerif, fontSize: 22 }}>{c.co}</div>
                <div style={{ ...aMono, fontSize: 10, color: A.mute, marginTop: 4 }}>{c.industry.toUpperCase()} · 使用 {c.agent}</div>
              </div>
              <div style={{ ...aMono, fontSize: 10, color: A.accent, border: `1px solid ${A.accent}`, padding: '2px 6px' }}>CASE 0{i + 1}</div>
            </div>
            <div style={{ ...aSerif, fontSize: 28, marginTop: 20, lineHeight: 1.2 }}>{c.metric}</div>
            <p style={{ fontSize: 13, color: A.mute, marginTop: 14, lineHeight: 1.7, flex: 1 }}>&ldquo;{c.quote}&rdquo;</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 16, paddingTop: 14, borderTop: `1px dashed ${A.rule}` }}>
              <span style={{ ...aMono, fontSize: 10, color: A.mute }}>年化节省</span>
              <span style={{ ...aSerif, fontSize: 20 }}>{c.saved}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const A_BASE = { ...A };
const aSerif_BASE = { ...aSerif };
function VariantA() {
  const [page, setPage] = React.useState('home');
  const [active, setActive] = React.useState(window.AGENTS[0]);
  const t = React.useContext(window.TweaksCtx || React.createContext({})) || {};
  Object.assign(A, A_BASE);
  Object.assign(aSerif, aSerif_BASE);
  if (t.accentMap && t.accentMap.A) A.accent = t.accentMap.A;
  if (t.headlineFont) aSerif.fontFamily = t.headlineFont;
  if (t.headlineFont) aSerif.fontWeight = t.headlineWeight || 500;
  return (
    <div style={aWrap}>
      <ANav page={page} setPage={setPage} />
      {page === 'home' && <AHome setPage={setPage} setActive={setActive} />}
      {page === 'marketplace' && <AMarket setPage={setPage} setActive={setActive} />}
      {page === 'detail' && <ADetail active={active} setPage={setPage} />}
      {page === 'cases' && <ACases setPage={setPage} />}
    </div>
  );
}

window.VariantA = VariantA;
