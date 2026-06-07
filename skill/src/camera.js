// Movimentos de câmera cinematográficos.
// Cada função recebe p (progresso 0..1, já com easing) e a intensidade,
// e devolve { offset:[x,y], zoom } para o shader de parallax.

function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

const EASINGS = {
  linear: t => t,
  ease: easeInOut,
  ease_in: t => t * t,
  ease_out: t => 1 - (1 - t) * (1 - t),
  ease_in_out: easeInOut,
};

// type -> gerador. intensity ~0.5 a 2.0 escala o efeito.
const MOVES = {
  static: () => ({ offset: [0, 0], zoom: 1 }),

  push_in: (p, k, dir) => ({ offset: [0, 0], zoom: 1 + 0.18 * k * p }),
  pull_out: (p, k) => ({ offset: [0, 0], zoom: 1 + 0.18 * k * (1 - p) }),

  ken_burns: (p, k) => ({
    offset: [(p - 0.5) * 0.06 * k, (p - 0.5) * 0.04 * k],
    zoom: 1 + 0.16 * k * p,
  }),

  pan: (p, k, dir) => ({ offset: [dir[0] * (p - 0.5) * 0.12 * k, dir[1] * (p - 0.5) * 0.12 * k], zoom: 1 + 0.04 * k }),
  dolly: (p, k, dir) => ({ offset: [dir[0] * (p - 0.5) * 0.10 * k, dir[1] * (p - 0.5) * 0.10 * k], zoom: 1 + 0.08 * k * p }),

  orbit: (p, k) => ({
    offset: [Math.sin(p * Math.PI * 2) * 0.05 * k, Math.cos(p * Math.PI * 2) * 0.035 * k],
    zoom: 1 + 0.05 * k,
  }),

  float: (p, k) => ({
    offset: [Math.sin(p * Math.PI * 2) * 0.02 * k, Math.sin(p * Math.PI * 4) * 0.015 * k],
    zoom: 1 + 0.03 * k,
  }),

  handheld: (p, k) => {
    const n = (s) => (Math.sin(p * 60 + s) + Math.sin(p * 23.3 + s * 2)) * 0.5;
    return { offset: [n(0) * 0.012 * k, n(11) * 0.012 * k], zoom: 1.02 + 0.02 * k * p };
  },
};

const DIRS = {
  left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1],
  upleft: [-1, -1], upright: [1, -1], downleft: [-1, 1], downright: [1, 1],
};

// camera: { type, intensity, direction, easing }
export function cameraAt(progress, camera = {}) {
  const type = camera.type || 'push_in';
  const k = camera.intensity ?? 1.0;
  const easeFn = EASINGS[camera.easing] || EASINGS.ease_in_out;
  const dir = DIRS[camera.direction] || DIRS.right;
  const p = easeFn(Math.min(Math.max(progress, 0), 1));
  const fn = MOVES[type] || MOVES.push_in;
  return fn(p, k, dir);
}
