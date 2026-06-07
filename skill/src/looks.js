// Presets de LOOK. Cada estilo é DONO das intensidades dos seus efeitos
// (conforme docs/padroes/01-padrao-geral.md, ponto 4). Valores já em uniforms do shader.

export const LOOKS = {
  'cinema-dramatico': {
    parallax: 0.10,
    grain: 0.06, vignette: 0.45, chroma: 0.4, exposure: 1.02,
    saturation: 0.95, lift: [0.0, 0.0, 0.01], gain: [1.03, 1.0, 0.97], bloom: 0.12,
  },
  'sci-fi-cyberpunk': {
    parallax: 0.13,
    grain: 0.05, vignette: 0.5, chroma: 1.0, exposure: 1.0,
    saturation: 1.15, lift: [0.0, 0.01, 0.04], gain: [0.95, 1.0, 1.12], bloom: 0.3,
  },
  'noir-film': {
    parallax: 0.08,
    grain: 0.12, vignette: 0.6, chroma: 0.2, exposure: 1.0,
    saturation: 0.05, lift: [0.0, 0.0, 0.0], gain: [1.0, 1.0, 1.0], bloom: 0.05,
  },
  'retro-vhs': {
    parallax: 0.09,
    grain: 0.18, vignette: 0.4, chroma: 1.6, exposure: 1.04,
    saturation: 1.1, lift: [0.02, 0.0, 0.02], gain: [1.05, 0.98, 1.02], bloom: 0.15,
  },
  'sonho-etereo': {
    parallax: 0.11,
    grain: 0.04, vignette: 0.35, chroma: 0.6, exposure: 1.08,
    saturation: 0.9, lift: [0.03, 0.02, 0.03], gain: [1.02, 1.0, 1.03], bloom: 0.4,
  },
  'acao-epico': {
    parallax: 0.12,
    grain: 0.08, vignette: 0.5, chroma: 0.8, exposure: 1.03,
    saturation: 1.08, lift: [0.0, 0.0, 0.0], gain: [1.05, 1.0, 0.95], bloom: 0.2,
  },
};

export const DEFAULT_LOOK = 'cinema-dramatico';

// resolve nome (com apelidos) -> id canônico
const ALIASES = {
  cinematografico: 'cinema-dramatico', cinema: 'cinema-dramatico',
  scifi: 'sci-fi-cyberpunk', cyberpunk: 'sci-fi-cyberpunk',
  noir: 'noir-film', vhs: 'retro-vhs', sonho: 'sonho-etereo',
  acao: 'acao-epico', epico: 'acao-epico',
};

export function resolveLook(name) {
  if (!name) return LOOKS[DEFAULT_LOOK];
  const id = LOOKS[name] ? name : (ALIASES[name] || DEFAULT_LOOK);
  return LOOKS[id] || LOOKS[DEFAULT_LOOK];
}

// aplica overrides de efeito vindos da cena/defaults sobre o look
export function mergeEffects(lookObj, effects = {}) {
  return { ...lookObj, ...effects };
}
