#!/usr/bin/env node
// CLI do pixflow-motion: imagem(ns) estática(s) + movie spec -> filme MP4 (parallax 2.5D + efeitos), sem IA.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, join, basename, extname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL = resolve(__dirname, '..');
const PUBLIC = join(SKILL, 'public');
const CACHE = join(SKILL, '.pixflow');

// Em aarch64 o Remotion falha ao baixar o Chrome Headless Shell.
// Reusa um Chromium já presente (Playwright/Puppeteer/sistema). Defina PIXFLOW_CHROME p/ forçar.
function findChrome() {
  if (process.env.PIXFLOW_CHROME && existsSync(process.env.PIXFLOW_CHROME)) return process.env.PIXFLOW_CHROME;
  const pw = join(homedir(), '.cache', 'ms-playwright');
  if (existsSync(pw)) {
    const dirs = readdirSync(pw).filter((d) => d.startsWith('chromium-')).sort((a, b) => parseInt(b.split('-')[1]) - parseInt(a.split('-')[1]));
    for (const d of dirs) {
      const cand = join(pw, d, 'chrome-linux', 'chrome');
      if (existsSync(cand)) return cand;
    }
  }
  for (const c of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/snap/bin/chromium', '/opt/google/chrome/chrome']) {
    if (existsSync(c)) return c;
  }
  return null;
}

function loadSpec(p) {
  const abs = resolve(p);
  const raw = readFileSync(abs, 'utf8');
  const spec = abs.endsWith('.json') ? JSON.parse(raw) : yaml.load(raw);
  return { spec, dir: dirname(abs) };
}

// ---------- validate ----------
function validate(spec, dir) {
  const errs = [], warn = [];
  if (!spec.scenes?.length) errs.push('spec sem `scenes`');
  const assets = {};
  for (const a of (spec.assets?.images || [])) assets[a.id || a.file] = a;
  (spec.scenes || []).forEach((s, i) => {
    const tag = `cena[${i}] (${s.id || '?'})`;
    if (!s.image) errs.push(`${tag}: falta \`image\``);
    if (!s.duration) warn.push(`${tag}: sem \`duration\` (usando 4s)`);
    if (!s.camera?.type) warn.push(`${tag}: sem \`camera.type\` (usando push_in)`);
    const a = assets[s.image];
    const file = a?.file || s.image;
    if (file && !existsSync(resolve(dir, file))) errs.push(`${tag}: arquivo de imagem não encontrado: ${file}`);
  });
  return { errs, warn };
}

// ---------- render ----------
async function ensureDepth(imgAbs, dir) {
  mkdirSync(CACHE, { recursive: true });
  const depthAbs = join(CACHE, basename(imgAbs).replace(/\.\w+$/, '') + '_depth.png');
  if (existsSync(depthAbs)) return depthAbs;
  const { generateDepth } = await import('./depth.mjs');
  await generateDepth(imgAbs, depthAbs);
  return depthAbs;
}

async function render(specPath, outArg, opts) {
  const { spec, dir } = loadSpec(specPath);
  const { errs, warn } = validate(spec, dir);
  warn.forEach((w) => console.warn('  ⚠ ' + w));
  if (errs.length) { errs.forEach((e) => console.error('  ✗ ' + e)); process.exit(1); }

  mkdirSync(PUBLIC, { recursive: true });
  const assets = {};
  for (const a of (spec.assets?.images || [])) assets[a.id || a.file] = a;

  // garante depth + stage de assets em public/
  const staged = JSON.parse(JSON.stringify(spec));
  staged.assets = staged.assets || {};
  staged.assets.images = [];
  const seen = new Set();
  for (const sc of (spec.scenes || [])) {
    const a = assets[sc.image] || { id: sc.image, file: sc.image };
    const id = a.id || a.file;
    if (seen.has(id)) continue;
    seen.add(id);
    const imgAbs = resolve(dir, a.file || sc.image);
    let depthAbs = a.depth ? resolve(dir, a.depth) : null;
    if (!depthAbs || !existsSync(depthAbs)) {
      console.log('  • gerando depth:', basename(imgAbs));
      depthAbs = await ensureDepth(imgAbs, dir);
    }
    const ext = extname(imgAbs) || '.png';
    const imgName = `${id}${ext}`;
    const depthName = `${id}_depth.png`;
    copyFileSync(imgAbs, join(PUBLIC, imgName));
    copyFileSync(depthAbs, join(PUBLIC, depthName));
    staged.assets.images.push({ id, file: imgName, depth: depthName });
  }
  // áudio
  if (staged.audio?.track) {
    const audAbs = resolve(dir, staged.audio.track);
    if (existsSync(audAbs)) { copyFileSync(audAbs, join(PUBLIC, basename(audAbs))); staged.audio.track = basename(audAbs); }
    else { console.warn('  ⚠ áudio não encontrado, ignorando:', staged.audio.track); delete staged.audio.track; }
  }
  // cenas referenciam ids
  staged.scenes = (spec.scenes || []).map((s) => ({ ...s, image: (assets[s.image]?.id || s.image), depth: undefined }));

  mkdirSync(CACHE, { recursive: true });
  const propsPath = join(CACHE, 'props.json');
  writeFileSync(propsPath, JSON.stringify({ spec: staged }));

  const out = resolve(outArg || (spec.output?.filename) || 'pixflow-out.mp4');
  const gl = opts.gl || 'angle';
  const args = ['remotion', 'render', 'src/index.jsx', 'Movie', out,
    `--props=${propsPath}`, `--gl=${gl}`, '--codec=h264', '--overwrite'];
  const chrome = findChrome();
  if (chrome) { args.push(`--browser-executable=${chrome}`); console.log('  • chromium:', chrome); }
  else console.warn('  ⚠ nenhum Chromium encontrado; Remotion tentará baixar (pode falhar em aarch64). Defina PIXFLOW_CHROME.');
  if (opts.quality === 'fast') args.push('--jpeg-quality=80', '--concurrency=4');
  console.log('  • renderizando ->', out);
  const r = spawnSync('npx', args, { cwd: SKILL, stdio: 'inherit', env: process.env });
  if (r.status !== 0) {
    if (gl === 'angle') { console.warn('  ⚠ falhou com --gl=angle, tentando swangle…'); return render(specPath, outArg, { ...opts, gl: 'swangle' }); }
    process.exit(r.status || 1);
  }
  console.log('  ✓ pronto:', out);
}

// ---------- summary ----------
function summary(spec) {
  const o = spec.output || {};
  console.log(`Filme: ${spec.meta?.title || '(sem título)'}`);
  console.log(`Saída: ${o.resolution || '1920x1080'} @ ${o.fps || 30}fps`);
  let total = 0;
  (spec.scenes || []).forEach((s, i) => {
    total += (s.duration || 4);
    const to = s.transition_out?.type || spec.defaults?.transition_out?.type || 'cut';
    console.log(`  ${i + 1}. ${s.id || ''}  [${s.look || spec.defaults?.look || 'cinema'}]  ${s.camera?.type || 'push_in'}  ${s.duration || 4}s  →${to}`);
  });
  console.log(`Duração ~${total.toFixed(1)}s, ${spec.scenes?.length || 0} cenas`);
}

// ---------- check-deps ----------
function checkDeps() {
  const node = process.version;
  const ff = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
  console.log('node     :', node);
  console.log('ffmpeg   :', ff.status === 0 ? ff.stdout.split('\n')[0] : '✗ não encontrado');
  console.log('remotion :', existsSync(join(SKILL, 'node_modules', 'remotion')) ? 'ok' : '✗ rode npm install');
  console.log('transformers.js :', existsSync(join(SKILL, 'node_modules', '@huggingface', 'transformers')) ? 'ok' : '✗ rode npm install');
  console.log('public/  :', existsSync(PUBLIC) ? 'ok' : 'será criado no render');
}

// ---------- main ----------
const [cmd, arg1, arg2] = process.argv.slice(2);
const flags = process.argv.slice(2).filter((a) => a.startsWith('--'));
const opts = { quality: flags.includes('--fast') ? 'fast' : 'full', gl: (flags.find((f) => f.startsWith('--gl='))?.split('=')[1]) };

try {
  if (cmd === 'check-deps') checkDeps();
  else if (cmd === 'validate') { const { spec, dir } = loadSpec(arg1); const { errs, warn } = validate(spec, dir); warn.forEach((w) => console.warn('⚠ ' + w)); if (errs.length) { errs.forEach((e) => console.error('✗ ' + e)); process.exit(1); } console.log('✓ spec válido'); }
  else if (cmd === 'summary') { const { spec } = loadSpec(arg1); summary(spec); }
  else if (cmd === 'depth') { const { generateDepth } = await import('./depth.mjs'); await generateDepth(resolve(arg1), resolve(arg2 || arg1.replace(/\.\w+$/, '_depth.png'))); console.log('✓ depth gerado'); }
  else if (cmd === 'render') { await render(arg1, arg2 && !arg2.startsWith('--') ? arg2 : null, opts); }
  else {
    console.log(`pixflow-motion — imagens estáticas → filme (parallax 2.5D + efeitos), sem IA

  pixflow-motion check-deps
  pixflow-motion validate <spec.yaml>
  pixflow-motion summary  <spec.yaml>
  pixflow-motion depth    <imagem> [saida.png]
  pixflow-motion render   <spec.yaml> [saida.mp4] [--fast] [--gl=angle|swangle|egl]
`);
  }
} catch (e) { console.error('erro:', e.message); process.exit(1); }
