// Variant B — 数据驱动企业风 / Data-driven Enterprise
// Crisp white + IBM-style navy accent, dense grids, mono numerics

const B = {
  bg: '#ffffff',
  panel: '#f6f8fb',
  ink: '#0b1530',
  mute: '#5a6478',
  rule: '#e3e7ee',
  accent: '#2147d4',
  pos: '#0a7c5a',
};

const bSans = { fontFamily: '"Inter", "Noto Sans SC", system-ui, sans-serif' };
const bMono = { fontFamily: '"JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace', fontVariantNumeric: 'tabular-nums' };

const bWrap = {
  width: 1280, height: 800, background: B.bg, color: B.ink,
  ...bSans, fontSize: 13, display: 'flex', flexDirection: 'column', overflow: 'hidden',
};

function BNav({ page, setPage }) {
  const tabs = [['home', '总览'], ['marketplace', 'Agent 市场'], ['detail', 'Agent 详情'], ['cases', '客户案例']];
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px', height: 56, borderBottom: `1px solid ${B.rule}`, background: B.bg, flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="22" height="22" viewBox="0 0 22 22"><rect x="2" y="2" width="8" height="8" fill={B.accent}/><rect x="12" y="2" width="8" height="8" fill={B.ink}/><rect x="2" y="12" width="8" height="8" fill={B.ink}/><rect x="12" y="12" width="8" height="8" fill={B.accent} opacity="0.4"/></svg>
          <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: 0.3 }}>Anvil<span style={{ color: B.accent }}>·</span>AI</div>
        </div>
        <nav style={{ display: 'flex', gap: 4, fontSize: 13 }}>
          {tabs.map(([k, lbl]) => (
            <a key={k} onClick={() => setPage(k)} style={{
              cursor: 'pointer', padding: '8px 14px',
              color: page === k ? B.accent : B.mute,
              background: page === k ? '#eaeffc' : 'transparent',
              borderRadius: 6, fontWeight: page === k ? 600 : 500,
            }}>{lbl}</a>
          ))}
          <a style={{ cursor: 'pointer', padding: '8px 14px', color: B.mute }}>开发文档</a>
          <a style={{ cursor: 'pointer', padding: '8px 14px', color: B.mute }}>定价</a>
        </nav>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: B.panel, borderRadius: 6, ...bMono, fontSize: 11 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: B.pos }}></span> 全球网关正常
        </div>
        <button style={{ padding: '8px 14px', background: 'transparent', border: 'none', color: B.ink, fontSize: 13, cursor: 'pointer' }}>登录</button>
        <button style={{
          padding: '8px 16px', background: B.accent, color: '#fff', border: 'none', borderRadius: 6,
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>免费接入</button>
      </div>
    </header>
  );
}

// Tiny sparkline for hero ticker
function BSpark({ color }) {
  const pts = [8, 12, 10, 14, 11, 17, 15, 19, 16, 22, 20, 26];
  const w = 80, h = 24;
  const d = pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i / (pts.length - 1)) * w},${h - (v / 28) * h}`).join(' ');
  return <svg width={w} height={h}><path d={d} fill="none" stroke={color} strokeWidth="1.5"/></svg>;
}

window.B = B; window.bSans = bSans; window.bMono = bMono; window.bWrap = bWrap; window.BNav = BNav; window.BSpark = BSpark;
