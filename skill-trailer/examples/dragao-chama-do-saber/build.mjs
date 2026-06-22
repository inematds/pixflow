// "A CHAMA DO SABER" — trailer (≈51 shots) de Vendric, o dragão de óculos que salva Aurális.
// Fonte única: gera imagens (flux2-klein) + escreve .movie.yaml + timeline.json.
// Feito com a skill pixflow-trailer (inteligencia-direcao.md). Uso: node build.mjs [--no-img]
import { generateImage } from '/home/nmaldaner/.claude/skills/pixflow-motion/cli/genimg.mjs';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(ROOT, 'assets');
mkdirSync(ASSETS, { recursive: true });
const NOIMG = process.argv.includes('--no-img');

const PROJECT = 'dragao-trailer';
const STYLE = 'cinematic, hyperrealistic epic fantasy, vibrant colors, high detail, dramatic volumetric lighting, ' +
  'film grain, shallow depth of field, clear separation between foreground / midground / deep background for parallax';
// personagens consistentes
const VEN = 'a young intelligent dragon wearing round spectacles glasses, teal and emerald scales, expressive curious eyes, scholarly not a warrior';
const MOR = 'a colossal black-scaled dragon with glowing molten-red eyes, ember and ash breath, jagged horns, menacing';
const KING = 'Auralis floating islands with crystal towers and a great library, warm golden light, colorful peaceful dragons flying';

const C = (type, o = {}) => ({ type, ...o });
const CAP = (body, accent = '#f2efe6') => ({ body, position: 'bottom', align: 'center', accent });
const TITLE = (title, kicker = '', accent = '#ff6a1a') => ({ title, kicker, position: 'center', align: 'center', accent });

const SHOTS = [
  // ENTRADA
  { id: 's00', kind: 'black', cam: C('push_in', { intensity: 0.4 }), look: 'noir-film', dur: 2.6, cap: { kicker: 'trailer simulado com imagens', title: 'A CHAMA DO SABER', position: 'center', align: 'center', accent: '#ffb347' }, tout: { type: 'dip_to_black', duration: 0.4 } },
  // TEASER (rápido)
  { id: 's01', prompt: `wide aerial establishing of ${KING}, dawn, vast scale`, cam: C('aerial', { intensity: 1.0, amplitude: 'dramatico' }), look: 'sonho-etereo', dur: 1.0, tout: { type: 'cut' } },
  { id: 's02', prompt: `extreme close-up of ${VEN}, eyes behind round glasses catching light, curious`, cam: C('crash_zoom', { intensity: 1.0 }), look: 'cinema-dramatico', dur: 0.7, tout: { type: 'cut' } },
  { id: 's03', prompt: `${MOR} roaring, breathing ember fire toward camera, dark smoke`, cam: C('crash_zoom', { intensity: 1.1 }), look: 'acao-epico', dur: 0.7, tout: { type: 'cut' } },
  { id: 's04', prompt: 'interior of a vast magical library, towering shelves, glowing floating scrolls, a small dragon reading', cam: C('push_in', { intensity: 0.8 }), look: 'cinema-dramatico', dur: 1.0, tout: { type: 'cut' } },
  { id: 's05', kind: 'ember', cam: C('push_in', { intensity: 0.5 }), look: 'acao-epico', dur: 2.3, cap: TITLE('A CHAMA DO SABER', 'Trailer Oficial'), tout: { type: 'dip_to_black', duration: 0.4 } },
  { id: 's06', kind: 'black', cam: C('static', { breath: 0 }), look: 'noir-film', dur: 0.5, tout: { type: 'cut' } },

  // MUNDO / MARAVILHA
  { id: 's07', prompt: `wide aerial of ${KING}, crystal towers, waterfalls of light, dragons gliding, golden hour`, cam: C('aerial', { intensity: 1.1, amplitude: 'dramatico', easing: 'ease_out' }), look: 'sonho-etereo', dur: 3.5, tout: { type: 'crossfade', duration: 0.6 } },
  { id: 's08', prompt: `${VEN} perched reading a giant glowing book, warm library light, dust motes`, cam: C('push_in', { intensity: 0.7, amplitude: 'sutil' }), look: 'cinema-dramatico', dur: 3.0, tout: { type: 'crossfade', duration: 0.6 } },
  { id: 's09', prompt: 'the Grand Library of a dragon kingdom, colossal shelves spiraling upward, glowing scrolls, majestic', cam: C('crane', { intensity: 1.1 }), look: 'sonho-etereo', dur: 2.5, tout: { type: 'cut' } },
  { id: 's10', prompt: 'extreme close-up of an ancient prophecy scroll with glowing runes igniting one by one', cam: C('push_in', { intensity: 0.6, amplitude: 'sutil' }), look: 'cinema-dramatico', dur: 2.5, tout: { type: 'cut' } },
  { id: 's11', prompt: 'a council of many colorful peaceful dragons gathered in a crystal hall, solemn', cam: C('dolly', { direction: 'right', intensity: 1.0 }), look: 'sonho-etereo', dur: 2.5, tout: { type: 'crossfade', duration: 0.5 } },
  { id: 's12', prompt: `${VEN} adjusting his round glasses with a claw, a small determined smile, soft light`, cam: C('push_in', { intensity: 0.7, amplitude: 'sutil' }), look: 'cinema-dramatico', dur: 2.2, cap: CAP('O saber é a nossa última chama.'), tout: { type: 'cut' } },
  { id: 's13', kind: 'black', cam: C('push_in', { intensity: 0.4 }), look: 'noir-film', dur: 1.8, cap: TITLE('UMA FÁBULA DE DRAGÕES', '', '#cfd6df'), tout: { type: 'dip_to_black', duration: 0.4 } },

  // AMEAÇA / INVASÃO
  { id: 's14', prompt: `dark storm clouds and falling ash rolling over ${KING}, ominous`, cam: C('aerial', { intensity: 1.0 }), look: 'acao-epico', dur: 2.5, tout: { type: 'cut' } },
  { id: 's15', prompt: 'dark winged ash dragons with glowing ember cracks in their scales descending from black smoke', cam: C('tracking', { direction: 'right', intensity: 1.2, amplitude: 'dramatico' }), look: 'acao-epico', dur: 1.8, tout: { type: 'cut' } },
  { id: 's16', prompt: `${MOR} landing on a crystal tower, wings spread, embers raining, imposing`, cam: C('crane', { intensity: 1.2, amplitude: 'dramatico' }), look: 'acao-epico', dur: 2.2, tout: { type: 'dip_to_black', duration: 0.4 } },
  { id: 's17', prompt: 'the great library in flames, books and scrolls burning, swirling embers, tragic', cam: C('handheld', { intensity: 1.2 }), look: 'acao-epico', dur: 1.2, tout: { type: 'cut' } },
  { id: 's18', prompt: 'colorful dragons fleeing in panic across a smoke-filled sky, chaos', cam: C('handheld', { intensity: 1.3, amplitude: 'dramatico' }), look: 'acao-epico', dur: 1.0, tout: { type: 'cut' } },
  { id: 's19', prompt: `close-up of ${VEN} shocked, fire reflected in his round glasses`, cam: C('push_in', { intensity: 1.0 }), look: 'cinema-dramatico', dur: 2.0, cap: CAP('Eles vieram pela Grande Biblioteca.'), tout: { type: 'cut' } },
  { id: 's20', prompt: `close-up of ${MOR} snarling, molten-red eyes glowing, ash drifting`, cam: C('static', { breath: 0.6 }), look: 'acao-epico', dur: 1.2, tout: { type: 'cut' } },
  { id: 's21', prompt: 'a tiny dragon hatchling crying amid falling ash and rubble, vulnerable', cam: C('push_in', { intensity: 0.6, amplitude: 'sutil' }), look: 'cinema-dramatico', dur: 1.5, tout: { type: 'cut' } },

  // NÚCLEO EMOCIONAL / DECISÃO
  { id: 's22', prompt: `${VEN} alone in the ruined smoldering library, clutching a glowing prophecy scroll`, cam: C('push_in', { intensity: 0.7, amplitude: 'sutil' }), look: 'cinema-dramatico', dur: 2.5, tout: { type: 'crossfade', duration: 0.5 } },
  { id: 's23', prompt: `close-up of ${VEN}, eyes widening behind glasses as runes ignite, realization`, cam: C('push_in', { intensity: 0.8 }), look: 'cinema-dramatico', dur: 2.0, cap: CAP('Há um modo de vencê-los.'), tout: { type: 'cut' } },
  { id: 's24', prompt: 'a wise old elder dragon with long whiskers speaking gravely, dim crystal light', cam: C('static', { breath: 0.6 }), look: 'cinema-dramatico', dur: 2.0, cap: CAP('Você não tem garras para isso, Vendric.'), tout: { type: 'cut' } },
  { id: 's25', prompt: `close-up of ${VEN} replying, resolute, glasses gleaming with firelight`, cam: C('push_in', { intensity: 0.8 }), look: 'cinema-dramatico', dur: 2.0, cap: CAP('Mas tenho a mente.'), tout: { type: 'cut' } },
  { id: 's26', kind: 'black', cam: C('static', { breath: 0 }), look: 'noir-film', dur: 1.6, cap: TITLE('EM BREVE', '', '#cfd6df'), tout: { type: 'dip_to_black', duration: 0.4 } },

  // PREPARAÇÃO / UNIÃO
  { id: 's27', prompt: `${VEN} drawing a glowing battle strategy over a star map / constellations, clever`, cam: C('dolly', { direction: 'left', intensity: 1.0 }), look: 'sci-fi-cyberpunk', dur: 2.0, tout: { type: 'cut' } },
  { id: 's28', prompt: 'many dragons gathering and rallying behind a small bespectacled dragon, hopeful, golden light', cam: C('crane', { intensity: 1.1, amplitude: 'dramatico' }), look: 'sonho-etereo', dur: 2.2, tout: { type: 'cut' } },
  { id: 's29', prompt: 'young dragons learning coordinated formation flight at dawn, training montage', cam: C('tracking', { direction: 'right', intensity: 1.2 }), look: 'acao-epico', dur: 1.5, tout: { type: 'cut' } },
  { id: 's30', prompt: `${VEN} taking off into a gust, wind in his scales, glasses strapped tight, brave`, cam: C('push_in', { intensity: 0.8 }), look: 'acao-epico', dur: 1.5, tout: { type: 'cut' } },
  { id: 's31', prompt: 'a wide army of colorful dragons taking off together into a vast bright sky, epic', cam: C('aerial', { intensity: 1.2, amplitude: 'dramatico' }), look: 'acao-epico', dur: 2.2, tout: { type: 'dip_to_black', duration: 0.4 } },

  // CLÍMAX (rápido)
  { id: 's32', prompt: 'a chaotic aerial dragon battle, good dragons vs dark ash dragons, fire trails crisscrossing the sky', cam: C('handheld', { intensity: 1.3, amplitude: 'dramatico' }), look: 'acao-epico', dur: 1.0, tout: { type: 'cut' } },
  { id: 's33', prompt: `${VEN} dodging a torrent of fire mid-air, calculating, glasses flashing`, cam: C('crash_zoom', { intensity: 1.0 }), look: 'acao-epico', dur: 0.8, tout: { type: 'cut' } },
  { id: 's34', prompt: `${MOR} breathing a massive torrent of ember fire across the sky`, cam: C('tracking', { direction: 'left', intensity: 1.2 }), look: 'acao-epico', dur: 0.9, tout: { type: 'cut' } },
  { id: 's35', prompt: 'a good dragon struck by fire, tumbling and falling through smoke, dramatic', cam: C('handheld', { intensity: 1.3 }), look: 'acao-epico', dur: 0.8, tout: { type: 'cut' } },
  { id: 's36', prompt: `close-up of ${VEN} shouting a command mid-battle, fierce and focused`, cam: C('push_in', { intensity: 1.0 }), look: 'acao-epico', dur: 1.0, cap: CAP('Agora! Para a luz!'), tout: { type: 'cut' } },
  { id: 's37', prompt: 'dozens of dragons forming a coordinated glowing spiral formation in the sky, a clever plan', cam: C('aerial', { intensity: 1.2, amplitude: 'dramatico' }), look: 'acao-epico', dur: 1.2, tout: { type: 'cut' } },
  { id: 's38', prompt: `${VEN} angling a giant crystal to redirect sunlight into a blinding beam of light`, cam: C('crash_zoom', { intensity: 1.1 }), look: 'sci-fi-cyberpunk', dur: 1.0, tout: { type: 'cut' } },
  { id: 's39', prompt: `${MOR} blinded by a brilliant beam of light, roaring, recoiling`, cam: C('static', { breath: 0.6 }), look: 'acao-epico', dur: 0.9, tout: { type: 'cut' } },
  { id: 's40', prompt: `${VEN} and ${MOR} in a mid-air standoff, tiny clever dragon versus colossal dark dragon`, cam: C('truck', { direction: 'right', intensity: 1.2, amplitude: 'dramatico' }), look: 'acao-epico', dur: 1.2, tout: { type: 'cut' } },
  { id: 's41', kind: 'white', cam: C('static', { breath: 0 }), look: 'noir-film', dur: 0.15, tout: { type: 'cut' } },
  { id: 's42', prompt: `${MOR} defeated, falling backward into a sea of clouds, embers fading`, cam: C('push_in', { intensity: 0.9 }), look: 'acao-epico', dur: 1.2, tout: { type: 'cut' } },
  { id: 's43', prompt: `close-up of ${VEN} exhausted, one glasses lens cracked, a tired triumphant smile`, cam: C('push_in', { intensity: 0.7, amplitude: 'sutil' }), look: 'cinema-dramatico', dur: 1.8, tout: { type: 'cut' } },
  { id: 's44', prompt: `the dragons of ${KING} cheering as dawn breaks over the restored floating islands`, cam: C('crane', { intensity: 1.2, amplitude: 'dramatico' }), look: 'sonho-etereo', dur: 2.2, tout: { type: 'crossfade', duration: 0.5 } },

  // FINALE
  { id: 's45', prompt: 'a small bespectacled dragon rebuilding the great library, glowing books flying back onto shelves', cam: C('aerial', { intensity: 1.0 }), look: 'sonho-etereo', dur: 2.0, tout: { type: 'cut' } },
  { id: 's46', prompt: `a tiny hatchling offering ${VEN} a brand new pair of round glasses, tender, warm light`, cam: C('push_in', { intensity: 0.6, amplitude: 'sutil' }), look: 'cinema-dramatico', dur: 2.2, cap: CAP('Nem sempre o herói tem as maiores garras.'), tout: { type: 'cut' } },
  { id: 's47', prompt: `${VEN} looking to a bright horizon, wise and calm, new glasses on, breeze`, cam: C('static', { breath: 0.5 }), look: 'cinema-dramatico', dur: 2.2, tout: { type: 'dip_to_black', duration: 0.6 } },
  { id: 's48', kind: 'ember', cam: C('push_in', { intensity: 0.5 }), look: 'acao-epico', dur: 4.0, cap: TITLE('A CHAMA DO SABER', 'AURÁLIS — Trailer Oficial'), tout: { type: 'dip_to_black', duration: 0.6 } },
  { id: 's49', kind: 'black', cam: C('static', { breath: 0 }), look: 'noir-film', dur: 2.6, cap: { kicker: 'simulação em fotos · IA', title: 'pixflow-trailer', position: 'center', align: 'center', accent: '#8a8f98' }, tout: { type: 'dip_to_black', duration: 0.6 } },
  { id: 's50', kind: 'ember', cam: C('push_in', { intensity: 0.5, easing: 'ease_in_out' }), look: 'acao-epico', dur: 4.6, cap: { kicker: 'assista mais em', title: 'INEMA.CLUB', body: 'cursos · ferramentas · IA', position: 'center', align: 'center', accent: '#ffb347' }, tout: { type: 'cut' } },
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
  const e = join(ASSETS, 'ember.png');
  if (!existsSync(e)) { process.stdout.write('-> ember ... '); await generateImage(e, `${EMBER}, ${STYLE}`, { model: 'flux2-klein', width: 1280, height: 720, steps: 4, seed: 700 }); console.log('ok'); }
  solidColor(join(ASSETS, 'black.png'), 'black');
  solidColor(join(ASSETS, 'white.png'), 'white');
  let seed = 200;
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
  return `# A CHAMA DO SABER — pixflow.movie/v1 (gerado por build.mjs)
schema: pixflow.movie/v1
meta: { title: A Chama do Saber, author: nmaldaner }
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
  return {
    fps, totalSec: +(cursor / fps).toFixed(3), scenes,
    marks: { teaserHit: 0.15, title1: find('s05'), worldStart: find('s07'), destructStart: find('s16'), climaxStart: find('s31'), whiteFlash: find('s41'), titleFinal: find('s48'), ctaStart: find('s50') },
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
