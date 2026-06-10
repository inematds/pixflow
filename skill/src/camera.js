// Movimentos de câmera cinematográficos — v2 ("F1: amplitude + vocabulário + respiração").
// Cada função recebe p (progresso 0..1, já com easing) e a intensidade,
// e devolve { offset:[x,y], zoom, rotate, blur, parallaxBoost } para o shader.
//
// v2 muda a física: offset agora é TRANSLAÇÃO REAL da moldura (o shader move o
// enquadramento, não só o parallax). Por isso cada movimento garante "headroom"
// de zoom para a translação não amostrar fora da imagem (fit()).
//
// Novos (port do fpfilmv1/curso/trilha4): tilt, tracking, truck, pedestal,
// crane, aerial, dolly_zoom (vertigo), whip_pan, crash_zoom.
// amplitude: sutil | normal | dramatico (multiplica a intensidade).
// breath: respiração de câmera sempre presente (0 desliga) — mata o "slideshow".

function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

const EASINGS = {
  linear: t => t,
  ease: easeInOut,
  ease_in: t => t * t,
  ease_out: t => 1 - (1 - t) * (1 - t),
  ease_in_out: easeInOut,
};

const AMPLITUDES = { sutil: 0.65, normal: 1.0, dramatico: 1.5 };

// zoom mínimo p/ uma translação máxima t caber no quadro (com margem p/ parallax+rotação)
function fit(t) { return 1 / Math.max(1 - 2 * (Math.abs(t) + 0.045), 0.4); }

const D2R = Math.PI / 180;

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
// quanto a moldura pode transladar num dado zoom sem amostrar fora da imagem
const travelLimit = (z) => Math.max(0, 0.5 * (1 - 1 / Math.max(z, 1.0001)) - 0.008);

// type -> gerador. intensity ~0.5 a 2.0 escala o efeito. dir = [x,y]. cam = spec bruto.
const MOVES = {
  static: () => ({ offset: [0, 0], zoom: 1 }),

  // ENQUADRAMENTO LIVRE: viaja de um enquadramento a outro ("mergulha no rosto").
  // camera: { type: framing, from: {zoom, at:[x,y]}, to: {zoom, at:[x,y]} }
  // at = ponto da IMAGEM (0..1) que fica no centro do quadro. Habilita 1 imagem → N shots.
  framing: (p, k, dir, cam) => {
    const F = cam?.from || { zoom: 1.0, at: [0.5, 0.5] };
    const T = cam?.to || { zoom: 1.35, at: [0.5, 0.5] };
    const z = (F.zoom ?? 1) + ((T.zoom ?? 1.35) - (F.zoom ?? 1)) * p;
    const ax = (F.at?.[0] ?? 0.5) + ((T.at?.[0] ?? 0.5) - (F.at?.[0] ?? 0.5)) * p;
    const ay = (F.at?.[1] ?? 0.5) + ((T.at?.[1] ?? 0.5) - (F.at?.[1] ?? 0.5)) * p;
    const lim = travelLimit(z);
    return { offset: [clamp(ax - 0.5, -lim, lim), clamp(ay - 0.5, -lim, lim)], zoom: z };
  },

  // ---- recalibrados (amplitude de cinema, não de slideshow) ----
  push_in: (p, k) => ({ offset: [0, 0], zoom: 1 + 0.30 * k * p }),
  pull_out: (p, k) => ({ offset: [0, 0], zoom: 1 + 0.30 * k * (1 - p) }),
  crash_zoom: (p, k) => ({ offset: [0, 0], zoom: 1 + 0.45 * k * p * p, blur: 0.010 * k * p }),

  ken_burns: (p, k, dir) => {
    const t = 0.085 * k;
    return { offset: [dir[0] * (p - 0.5) * t * 2, dir[1] * (p - 0.5) * t * 1.3], zoom: fit(t) + 0.22 * k * p };
  },

  pan: (p, k, dir) => {
    const t = 0.10 * k;
    return { offset: [dir[0] * (p - 0.5) * t * 2, dir[1] * (p - 0.5) * t * 2], zoom: fit(t) };
  },
  tilt: (p, k, dir) => {
    const t = 0.09 * k; const vy = dir[1] !== 0 ? dir[1] : -1;
    return { offset: [0, vy * (p - 0.5) * t * 2], zoom: fit(t) };
  },
  pedestal: (p, k, dir) => {
    const t = 0.10 * k; const vy = dir[1] !== 0 ? dir[1] : -1;
    return { offset: [0, vy * (p - 0.5) * t * 2], zoom: fit(t) + 0.04 * k };
  },
  tracking: (p, k, dir) => {
    const t = 0.12 * k;
    return { offset: [dir[0] * (p - 0.5) * t * 2, 0], zoom: fit(t), parallaxBoost: 1.15 };
  },
  truck: (p, k, dir) => {
    const t = 0.11 * k;
    return {
      offset: [dir[0] * (p - 0.5) * t * 2, 0], zoom: fit(t),
      rotate: -dir[0] * 1.0 * D2R * k * (p - 0.5) * 2, parallaxBoost: 1.2,
    };
  },

  dolly: (p, k, dir) => {
    const t = 0.09 * k;
    return { offset: [dir[0] * (p - 0.5) * t * 2, dir[1] * (p - 0.5) * t * 2], zoom: fit(t) + 0.14 * k * p };
  },

  crane: (p, k) => {
    // grua subindo: desce o enquadramento → revela; recua o zoom; leve roll
    const t = 0.10 * k;
    return {
      offset: [0.05 * k * (p - 0.5) * 2, t * (0.5 - p) * 2 * -1], // sobe (y de +t a -t)
      zoom: fit(t) + 0.18 * k * (1 - p),
      rotate: 0.8 * D2R * k * (p - 0.5) * 2,
    };
  },

  aerial: (p, k) => {
    // drone: abre revelando, deriva diagonal, roll lento
    const t = 0.06 * k;
    return {
      offset: [t * (p - 0.5) * 2, -0.045 * k * (p - 0.5) * 2],
      zoom: fit(t) + 0.30 * k * (1 - p),
      rotate: 1.0 * D2R * k * (p - 0.5) * 2,
      parallaxBoost: 1.15,
    };
  },

  orbit: (p, k) => ({
    offset: [Math.sin(p * Math.PI * 2) * 0.07 * k, Math.cos(p * Math.PI * 2) * 0.05 * k],
    zoom: fit(0.07 * k) + 0.08 * k,
    rotate: Math.sin(p * Math.PI * 2) * 1.2 * D2R * k,
    parallaxBoost: 1.15,
  }),

  float: (p, k) => ({
    offset: [Math.sin(p * Math.PI * 2) * 0.035 * k, Math.sin(p * Math.PI * 4) * 0.025 * k],
    zoom: fit(0.035 * k) + 0.05 * k,
    rotate: Math.sin(p * Math.PI * 2 + 1) * 0.5 * D2R * k,
  }),

  handheld: (p, k) => {
    const n = (s) => (Math.sin(p * 60 + s) + Math.sin(p * 23.3 + s * 2)) * 0.5;
    return {
      offset: [n(0) * 0.018 * k, n(11) * 0.018 * k],
      zoom: fit(0.018 * k) + 0.03 * k * p,
      rotate: n(5) * 0.45 * D2R * k,
    };
  },

  dolly_zoom: (p, k) => ({
    // vertigo/Hitchcock: aproxima enquanto o fundo "estica" (parallax cresce muito)
    offset: [0, 0],
    zoom: 1 + 0.26 * k * p,
    parallaxBoost: 1 + 1.2 * k * p,
    blur: 0.004 * k * p,
  }),

  whip_pan: (p, k, dir) => {
    const t = 0.14 * k;
    const peak = Math.pow(Math.sin(p * Math.PI), 2); // blur máximo no meio do chicote
    return {
      offset: [dir[0] * (p - 0.5) * t * 2, 0],
      zoom: fit(t),
      blur: peak * 0.030 * k,
      rotate: dir[0] * peak * 0.6 * D2R * k,
    };
  },
};

const DIRS = {
  left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1],
  upleft: [-1, -1], upright: [1, -1], downleft: [-1, 1], downright: [1, 1],
};

// respiração de câmera: drift orgânico sempre presente (a vida que separa filme de slideshow)
function breathe(out, progress, b) {
  if (b <= 0) return out;
  const t = progress * Math.PI * 2;
  out.offset[0] += Math.sin(t * 0.7 + 0.8) * 0.004 * b;
  out.offset[1] += Math.cos(t * 0.5 + 2.1) * 0.003 * b;
  out.zoom *= 1 + Math.sin(t * 0.8 + 1.3) * 0.004 * b;
  out.rotate = (out.rotate || 0) + Math.sin(t * 0.6 + 0.4) * 0.0009 * b;
  return out;
}

// camera: { type, intensity, direction, easing, amplitude, breath }
export function cameraAt(progress, camera = {}) {
  const type = camera.type || 'push_in';
  const amp = AMPLITUDES[camera.amplitude] ?? 1.0;
  const k = (camera.intensity ?? 1.0) * amp;
  const easeFn = EASINGS[camera.easing] || EASINGS.ease_in_out;
  const dir = DIRS[camera.direction] || DIRS.right;
  const p = easeFn(Math.min(Math.max(progress, 0), 1));
  const fn = MOVES[type] || MOVES.push_in;
  const out = { rotate: 0, blur: 0, parallaxBoost: 1, ...fn(p, k, dir, camera) };
  const b = camera.breath ?? (type === 'static' ? 0.6 : 1.0);
  return breathe(out, Math.min(Math.max(progress, 0), 1), b);
}
