// Variant C — 现代产品风 / Modern Product Marketing
// Warm off-white, charcoal text, soft color cards, friendly radii

const C = {
  bg: '#f5f1ea',
  panel: '#ffffff',
  ink: '#1f1c17',
  mute: '#7a7268',
  rule: '#e6dfd2',
  accent: '#d4571a',
  ink2: '#2b2924',
};

const cSans = { fontFamily: '"Inter", "Noto Sans SC", system-ui, sans-serif' };
const cDisplay = { fontFamily: '"Inter", "Noto Sans SC", system-ui, sans-serif', fontWeight: 700, letterSpacing: -1.2 };

const cWrap = {
  width: 1280, height: 800, background: C.bg, color: C.ink,
  ...cSans, fontSize: 13, display: 'flex', flexDirection: 'column', overflow: 'hidden',
};

function CNav({ page, setPage }) {
  const tabs = [['home', '首页'], ['marketplace', '探索 Agent'], ['detail', '示例 Agent'], ['cases', '客户故事']];
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 28px', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: C.ink,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: C.bg, fontWeight: 800, fontSize: 15,
          }}>a</div>
          <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: -0.3 }}>anvil</div>
        </div>
        <nav style={{ display: 'flex', gap: 22, fontSize: 13 }}>
          {tabs.map(([k, lbl]) => (
            <a key={k} onClick={() => setPage(k)} style={{
              cursor: 'pointer', color: page === k ? C.ink : C.mute,
              fontWeight: page === k ? 600 : 500,
            }}>{lbl}</a>
          ))}
          <a style={{ cursor: 'pointer', color: C.mute }}>定价</a>
          <a style={{ cursor: 'pointer', color: C.mute }}>开发者</a>
        </nav>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button style={{ padding: '8px 14px', background: 'transparent', border: 'none', color: C.ink, fontSize: 13, cursor: 'pointer' }}>登录</button>
        <button style={{
          padding: '10px 18px', background: C.ink, color: C.bg, border: 'none', borderRadius: 100,
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>开始免费试用 →</button>
      </div>
    </header>
  );
}

window.C = C; window.cSans = cSans; window.cDisplay = cDisplay; window.cWrap = cWrap; window.CNav = CNav;
