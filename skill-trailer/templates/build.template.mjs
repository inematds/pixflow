// TEMPLATE pixflow-trailer — fonte única: SHOTS -> imagens (flux2-klein) + .movie.yaml + timeline.json
// Copie para o diretório do projeto, preencha a tabela SHOTS (1 objeto por shot) aplicando
// a inteligencia-direcao.md, e rode: `node build.mjs`  (ou `--no-img` p/ só reescrever yaml/timeline).
//
// Schema de um shot:
//   { id:'s01',                       // id único e ORDENADO (define a ordem na timeline)
//     prompt:'...',                   // descrição da imagem (flux2-klein) — OU:
//     kind:'ember'|'black'|'white',   //   fundo sintético (cartela/preto/flash) — não gera imagem
//     reuse:'s02',                    //   reaproveita a imagem de outro shot
//     cam: C('push_in',{intensity:0.8, amplitude:'sutil', direction:'right', easing:'ease_in_out', breath:0.6}),
//     look:'cinema-dramatico',        // sonho-etereo|sci-fi-cyberpunk|acao-epico|cinema-dramatico|noir-film|retro-vhs
//     dur: 2.0,                       // segundos
//     cap: CAP('fala...') | TITLE('TÍTULO','kicker'),  // opcional (legenda/cartela)
//     tout:{type:'cut'} }             // OBRIGATÓRIO: cut|crossfade|dip_to_black (+duration)
//
import { generateImage } from '/home/nmaldaner/.claude/skills/pixflow-motion/cli/genimg.mjs';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(ROOT, 'assets');
mkdirSync(ASSETS, { recursive: true });
const NOIMG = process.argv.includes('--no-img');

// ====== EDITE: identidade do projeto ======
const PROJECT = 'meu-trailer';
const TITLE_TEXT = 'MEU TRAILER';
const STYLE = 'cinematic, hyperrealistic, vibrant colors, high detail, dramatic volumetric lighting, ' +
  'film grain, shallow depth of field, clear separation between foreground / midground / deep background for parallax';

// helpers
const C = (type, o = {}) => ({ type, ...o });
const CAP = (body, accent = '#f2efe6') => ({ body, position: 'bottom', align: 'center', accent });
const TITLE = (title, kicker = '', accent = '#ff6a1a') => ({ title, kicker, position: 'center', align: 'center', accent });

// ====== EDITE: a tabela de shots (aplique inteligencia-direcao.md) ======
const SHOTS = [
  // exemplos (troque pelos seus):
  { id: 's01', prompt: 'wide establishing shot of ...', cam: C('aerial', { intensity: 1.1, amplitude: 'dramatico', easing: 'ease_out' }), look: 'sonho-etereo', dur: 3.0, tout: { type: 'crossfade', duration: 0.6 } },
  { id: 's02', prompt: 'close-up of ...', cam: C('push_in', { intensity: 0.7, amplitude: 'sutil' }), look: 'cinema-dramatico', dur: 2.5, cap: CAP('uma fala curta.'), tout: { type: 'cut' } },
  { id: 's03', kind: 'ember', cam: C('push_in', { intensity: 0.5 }), look: 'acao-epico', dur: 3.5, cap: TITLE(TITLE_TEXT, 'Trailer Oficial'), tout: { type: 'cut' } },
];

// ---------- imagens ----------
const EMBER = 'dark cinematic background of glowing orange embers and floating sparks rising through black smoke, deep pure black background, atmospheric fire particles, no text, empty center';
function solidColor(path, color) {
  if (existsSync(path)) return;
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', `color=c=${color}:s=1280x720`, '-frames:v', '1', path]);
  if (r.status !== 0) throw new Error('ffmpeg solid ' + color);
}
async function ensureImages() {
  if (NOIMG) return;
  const needEmber = SHOTS.some((s) => s.kind === 'ember');
  if (needEmber) { const e = join(ASSETS, 'ember.png'); if (!existsSync(e)) { process.stdout.write('-> ember ... '); await generateImage(e, `${EMBER}, ${STYLE}`, { model: 'flux2-klein', width: 1280, height: 720, steps: 4, seed: 700 }); console.log('ok'); } }
  if (SHOTS.some((s) => s.kind === 'black')) solidColor(join(ASSETS, 'black.png'), 'black');
  if (SHOTS.some((s) => s.kind === 'white')) solidColor(join(ASSETS, 'white.png'), 'white');
  let seed = 100;
  for (const s of SHOTS) {
    seed++;
    if (s.reuse || s.kind) continue;
    const out = join(ASSETS, `${s.id}.png`);
    if (existsSync(out)) { console.log(`-> ${s.id} (já existe)`); continue; }
    process.stdout.write(`-> ${s.id} ... `);
    await generateImage(out, `${s.prompt}, ${STYLE}`, { model: 'flux2-klein', width: 1280, height: 720, steps: 4, seed });
    console.log('ok');
  }
}

function fileFor(s) {
  if (s.kind === 'ember') return 'assets/ember.png';
  if (s.kind === 'black') return 'assets/black.png';
  if (s.kind === 'white') return 'assets/white.png';
  if (s.reuse) return `assets/${s.reuse}.png`;
  return `assets/${s.id}.png`;
}
const y = (o) => JSON.stringify(o);

function buildYaml() {
  const imgs = SHOTS.map((s) => `    - { id: ${s.id}, file: ${fileFor(s)} }`).join('\n');
  const scenes = SHOTS.map((s) => {
    const tout = s.tout || { type: 'cut' };
    const lines = [`  - id: ${s.id}`, `    image: ${s.id}`, `    look: ${s.look}`, `    duration: ${s.dur}`, `    camera: ${y(s.cam)}`];
    if (s.cap) lines.push(`    caption: ${y(s.cap)}`);
    lines.push(`    transition_out: ${y(tout)}`);
    return lines.join('\n');
  }).join('\n\n');
  return `# ${TITLE_TEXT} — pixflow.movie/v1 (gerado por build.mjs)
schema: pixflow.movie/v1
meta: { title: ${TITLE_TEXT}, author: nmaldaner }
output: { resolution: 1280x720, fps: 30, filename: ${PROJECT}.mp4 }
defaults: { look: cinema-dramatico, transition_out: { type: cut } }
audio: { track: trilha.wav, volume: 0.92 }
assets:
  images:
${imgs}
scenes:
${scenes}
`;
}

// timeline.json — mesma lógica do src/layout.js; expõe MARCOS p/ o gen-audio.mjs
function buildTimeline() {
  const fps = 30; const sec = (v) => Math.max(1, Math.round((v || 0) * fps));
  let cursor = 0; const scenes = [];
  SHOTS.forEach((s, i) => {
    const durF = sec(s.dur); const prev = SHOTS[i - 1];
    const tName = prev?.tout?.type; const tDur = prev?.tout?.duration ?? 0.5;
    const fadeIn = (i > 0 && tName && tName !== 'cut') ? sec(tDur) : 0;
    const from = i === 0 ? 0 : cursor - fadeIn;
    scenes.push({ id: s.id, start: +(from / fps).toFixed(3), dur: s.dur, toutType: s.tout?.type || 'cut', kind: s.kind || (s.reuse ? 'reuse' : 'img') });
    cursor = from + durF;
  });
  const find = (id) => scenes.find((x) => x.id === id)?.start;
  // EDITE: aponte os marcos para os ids reais das suas cartelas/clímax/flash
  return {
    fps, totalSec: +(cursor / fps).toFixed(3), scenes,
    marks: {
      teaserHit: 0.15,
      title1: find('s03'),       // 1ª cartela de título
      worldStart: find('s01'),   // virada p/ o "mundo"
      destructStart: undefined,  // virada p/ destruição/apostas
      climaxStart: undefined,    // início do clímax
      whiteFlash: undefined,     // flash branco, se houver
      titleFinal: undefined,     // cartela de título final
      ctaStart: undefined,       // cena do CTA
    },
  };
}

const run = async () => {
  await ensureImages();
  writeFileSync(join(ROOT, `${PROJECT}.movie.yaml`), buildYaml());
  const tl = buildTimeline();
  writeFileSync(join(ROOT, 'timeline.json'), JSON.stringify(tl, null, 2));
  console.log(`\nYAML + timeline escritos. ${SHOTS.length} cenas, total ~${tl.totalSec}s.`);
};
run().catch((e) => { console.error('FALHOU:', e.message); process.exit(1); });
