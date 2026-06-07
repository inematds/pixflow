// Resolve a timeline do movie spec em frames: posição de cada cena e overlaps de transição.
import { resolveLook, mergeEffects } from './looks.js';

export function parseResolution(res) {
  if (!res) return [1920, 1080];
  const m = String(res).toLowerCase().split('x');
  return [parseInt(m[0], 10) || 1920, parseInt(m[1], 10) || 1080];
}

const sec = (v, fps) => Math.max(1, Math.round((v || 0) * fps));

// devolve { width, height, fps, durationInFrames, scenes:[{...,fromFrame,durationFrames,fadeInFrames}] }
export function computeLayout(spec, fpsOverride) {
  const output = spec.output || {};
  const [width, height] = parseResolution(output.resolution);
  const fps = fpsOverride || output.fps || 30;
  const defaults = spec.defaults || {};
  const assets = {};
  for (const a of (spec.assets?.images || [])) assets[a.id || a.file] = a;

  const scenes = [];
  let cursor = 0;
  const list = spec.scenes || [];
  list.forEach((sc, i) => {
    const durationFrames = sec(sc.duration ?? 4, fps);
    const asset = assets[sc.image] || { file: sc.image, depth: sc.depth };
    const lookName = sc.look || defaults.look;
    const effects = mergeEffects(resolveLook(lookName), { ...(defaults.effects || {}), ...(sc.effects || {}) });

    // transição que ENTRA nesta cena = transition_out da cena anterior
    const prev = list[i - 1];
    const tName = prev?.transition_out?.type || (i > 0 ? (defaults.transition_out?.type) : null);
    const tDur = prev?.transition_out?.duration ?? defaults.transition_out?.duration ?? 0.5;
    const fadeInFrames = (i > 0 && tName && tName !== 'cut') ? sec(tDur, fps) : 0;

    const fromFrame = i === 0 ? 0 : cursor - fadeInFrames;
    scenes.push({
      id: sc.id || `cena_${i + 1}`,
      image: asset.file, depth: asset.depth || (asset.file ? asset.file.replace(/\.(\w+)$/, '_depth.png') : null),
      camera: sc.camera || { type: 'push_in', intensity: 1 },
      caption: sc.caption || null,
      effects, durationFrames, fromFrame, fadeInFrames,
      transitionIn: i > 0 ? (tName || 'cut') : 'cut',
    });
    cursor = fromFrame + durationFrames;
  });

  return { width, height, fps, durationInFrames: Math.max(1, cursor), scenes };
}
