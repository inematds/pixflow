// Narração de trailer (voz masculina grave, edge-tts pt-BR-AntonioNeural) por cima da trilha,
// com ducking (música abaixa sob a voz) e re-mux no vídeo SEM re-render.
// Uso: node gen-narracao.mjs
import { existsSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const VO = join(ROOT, 'assets', 'vo');
mkdirSync(VO, { recursive: true });

const VOICE = 'pt-BR-AntonioNeural';
const RATE = '-10%';   // mais lento = gravidade de trailer
const PITCH = '-22Hz'; // mais grave

// falas posicionadas nos vãos (fora das legendas de diálogo), arco de trailer
const LINES = [
  { id: 'vo1', t: 2.0,  text: 'Num reino que flutua entre as nuvens,' },
  { id: 'vo2', t: 9.0,  text: 'o maior tesouro nunca foi o ouro. Foi o saber.' },
  { id: 'vo3', t: 28.5, text: 'Mas as cinzas vieram para apagar tudo.' },
  { id: 'vo4', t: 45.5, text: 'E nenhuma garra era forte o bastante.' },
  { id: 'vo5', t: 53.5, text: 'Até um dragão enxergar o que ninguém viu.' },
  { id: 'vo6', t: 64.5, text: 'A maior chama nasce da mente.' },
];

// 1) gerar cada fala (cache: não regera se já existe)
const probeDur = (f) => parseFloat(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf8' }).stdout) || 0;
for (const l of LINES) {
  const out = join(VO, `${l.id}.mp3`);
  if (existsSync(out)) { l.dur = probeDur(out); console.log(`-> ${l.id} (cache, ${l.dur.toFixed(1)}s)`); continue; }
  process.stdout.write(`-> ${l.id} @${l.t}s ... `);
  const r = spawnSync('edge-tts', ['--voice', VOICE, `--rate=${RATE}`, `--pitch=${PITCH}`, '--text', l.text, '--write-media', out], { encoding: 'utf8' });
  if (r.status !== 0) { console.error('FALHOU edge-tts:', r.stderr || r.stdout); process.exit(1); }
  l.dur = probeDur(out);
  console.log(`ok (${l.dur.toFixed(1)}s)`);
}

// 2) mix (ducking) + re-mux no vídeo
const VIDEO = join(ROOT, 'dragao-trailer.mp4');
const TRILHA = join(ROOT, 'trilha.wav');
const OUT = join(ROOT, 'dragao-trailer-narrado.mp4');
if (!existsSync(VIDEO) || !existsSync(TRILHA)) { console.error('vídeo ou trilha ausente'); process.exit(1); }

// inputs: 0=vídeo, 1=trilha, 2..=falas
const inputs = ['-i', VIDEO, '-i', TRILHA];
LINES.forEach((l) => { inputs.push('-i', join(VO, `${l.id}.mp3`)); });

const fc = [];
// bus de voz: cada fala normalizada (alta) e atrasada
LINES.forEach((l, i) => {
  const ms = Math.round(l.t * 1000);
  fc.push(`[${2 + i}:a]loudnorm=I=-14:TP=-1.5,adelay=${ms}|${ms}[v${i}]`);
});
fc.push(`${LINES.map((_, i) => `[v${i}]`).join('')}amix=inputs=${LINES.length}:normalize=0,volume=1.6,aformat=sample_fmts=fltp:channel_layouts=stereo[vobus]`);
// ducking DETERMINÍSTICO: música cai p/ ~0.32 nas janelas de narração
const W = LINES.map((l) => `between(t,${(l.t - 0.15).toFixed(2)},${(l.t + l.dur + 0.35).toFixed(2)})`).join('+');
fc.push(`[1:a]volume=eval=frame:volume='1-0.68*min(1,(${W}))'[ducked]`);
// mix final
fc.push(`[ducked][vobus]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.97,loudnorm=I=-15:TP=-1.2,aformat=sample_fmts=s16:channel_layouts=stereo[outa]`);

// duração do vídeo p/ fixar o corte (sem -shortest)
const vd = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', VIDEO], { encoding: 'utf8' });
const VDUR = (parseFloat(vd.stdout) || 135.7).toFixed(3);
const args = ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', fc.join(';'),
  '-map', '0:v', '-c:v', 'copy', '-map', '[outa]', '-c:a', 'aac', '-b:a', '192k', '-t', VDUR, OUT];
console.log('\nmixando + re-mux (sem re-render)...');
const r = spawnSync('ffmpeg', args, { stdio: 'inherit' });
if (r.status !== 0) { console.error('ffmpeg falhou'); process.exit(1); }

const p = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', OUT], { encoding: 'utf8' });
console.log('\n✓ narrado:', parseFloat(p.stdout).toFixed(1) + 's ->', OUT);
