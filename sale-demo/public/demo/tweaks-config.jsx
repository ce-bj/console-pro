// Tweaks configuration — palettes, headline moods, intensity presets.

window.TweaksCtx = React.createContext({});

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "vibe": "modern",
  "palette": "earthy",
  "intensity": "balanced"
}/*EDITMODE-END*/;
window.TWEAK_DEFAULTS = TWEAK_DEFAULTS;

// Coherent accent palettes — each maps to the 3 variants in sync.
// A is the editorial olive default; B is the IBM blue default; C is the orange default.
const PALETTES = {
  earthy:   { label: '土系',  A: '#3a4d2b', B: '#7a4d0d', C: '#d4571a', swatches: ['#3a4d2b','#7a4d0d','#d4571a'] },
  electric: { label: '电感',  A: '#1e3a8a', B: '#1f4ad3', C: '#5c2bd6', swatches: ['#1e3a8a','#1f4ad3','#5c2bd6'] },
  forest:   { label: '冷绿',  A: '#0d5d3b', B: '#0a7c5a', C: '#0d7a6c', swatches: ['#0d5d3b','#0a7c5a','#0d7a6c'] },
  noir:     { label: '墨黑',  A: '#171717', B: '#1c1c1c', C: '#262626', swatches: ['#171717','#1c1c1c','#262626'] },
};

const VIBES = {
  editorial: {
    label: '编辑',
    headlineFont: '"Noto Serif SC", "Source Serif Pro", Georgia, serif',
    headlineWeight: 500,
  },
  modern: {
    label: '商务',
    headlineFont: '"Inter", "Noto Sans SC", system-ui, sans-serif',
    headlineWeight: 700,
  },
  technical: {
    label: '技术',
    headlineFont: '"JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace',
    headlineWeight: 600,
  },
};

const INTENSITIES = {
  restrained: { label: '克制', scale: 0.88, sat: 0.65, glow: 0,    weightAdd: -100 },
  balanced:   { label: '平衡', scale: 1.00, sat: 1.00, glow: 0.35, weightAdd: 0 },
  bold:       { label: '张扬', scale: 1.12, sat: 1.35, glow: 0.85, weightAdd: 100 },
};

window.PALETTES = PALETTES;
window.VIBES = VIBES;
window.INTENSITIES = INTENSITIES;

// Build the context value from raw tweak keys.
window.buildTweakValue = function (t) {
  const pal = PALETTES[t.palette] || PALETTES.earthy;
  const vibe = VIBES[t.vibe] || VIBES.modern;
  const inten = INTENSITIES[t.intensity] || INTENSITIES.balanced;
  return {
    accentMap: { A: pal.A, B: pal.B, C: pal.C },
    headlineFont: vibe.headlineFont,
    headlineWeight: Math.max(400, vibe.headlineWeight + inten.weightAdd),
    intensity: t.intensity,
    intensityScale: inten.scale,
    intensitySat: inten.sat,
    intensityGlow: inten.glow,
    raw: t,
  };
};
