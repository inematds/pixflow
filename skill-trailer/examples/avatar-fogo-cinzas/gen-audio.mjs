// Monta trilha.wav: música (cama) + braam (riser→impacto) nos marcos + whoosh nas viradas.
// Fontes baixadas via inemavox em assets/audio/{music,braam,whoosh}/video.mp3.
// Perfis medidos: braam pico ~2.4s, whoosh pico ~2.3s.
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const A = join(ROOT, 'assets', 'audio');
const tl = JSON.parse(readFileSync(join(ROOT, 'timeline.json'), 'utf8'));
const T = tl.totalSec;
const m = tl.marks;

const F = { music: join(A, 'music', 'video.mp3'), braam: join(A, 'braam', 'video.mp3'), whoosh: join(A, 'whoosh', 'video.mp3') };
const inputs = []; const idx = {};
const add = (k) => { if (existsSync(F[k])) { idx[k] = inputs.length; inputs.push(F[k]); } };
add('music'); add('braam'); add('whoosh');
if (idx.music == null) { console.error('FALHOU: música ausente'); process.exit(1); }

const fc = []; const mix = [];
const delay = (label, t, out) => { const ms = Math.max(0, Math.round(t * 1000)); fc.push(`[${label}]adelay=${ms}|${ms}[${out}]`); mix.push(out); };

// 1) cama de música
fc.push(`[${idx.music}:a]atrim=0:${T.toFixed(2)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=1.2,afade=t=out:st=${(T - 3).toFixed(2)}:d=3,volume=0.78,aformat=sample_fmts=fltp:channel_layouts=stereo[mus]`);
mix.push('mus');

// 2) braam: versão "com riser" (impacto ~2.1s do clipe cortado) e versão "só impacto"
const BR_PEAK = 2.1; // pico dentro do clipe cortado em 0.3
if (idx.braam != null) {
  fc.push(`[${idx.braam}:a]asplit=2[braw0][braw1]`);
  fc.push(`[braw0]atrim=0.3:7.0,asetpts=PTS-STARTPTS,afade=t=out:st=5.5:d=1.2,volume=0.92,aformat=sample_fmts=fltp:channel_layouts=stereo[brfull]`);
  fc.push(`[braw1]atrim=2.0:6.5,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.01,volume=0.72,aformat=sample_fmts=fltp:channel_layouts=stereo[brboom]`);
  // marcos estruturais com riser
  const hits = [m.title1, m.climaxStart, m.whiteFlash, m.titleFinal].filter((x) => x != null);
  fc.push(`[brfull]asplit=${hits.length}${hits.map((_, i) => `[bf${i}]`).join('')}`);
  hits.forEach((t, i) => delay(`bf${i}`, t - BR_PEAK, `brd${i}`));
  // sting de entrada (impacto na cartela AVATAR)
  delay('brboom', Math.max(0, (m.teaserHit ?? 0.15) - 0.3), 'brop');
}

// 3) whoosh nas viradas de seção (mundo, destruição)
if (idx.whoosh != null) {
  const WH_PEAK = 2.3;
  const sweeps = [m.worldStart, m.destructStart].filter((x) => x != null);
  fc.push(`[${idx.whoosh}:a]atrim=0:3.9,asetpts=PTS-STARTPTS,volume=0.42,aformat=sample_fmts=fltp:channel_layouts=stereo[whp]`);
  fc.push(`[whp]asplit=${sweeps.length}${sweeps.map((_, i) => `[w${i}]`).join('')}`);
  sweeps.forEach((t, i) => delay(`w${i}`, t - WH_PEAK, `whd${i}`));
}

// 4) mix + limiter + loudness
fc.push(`${mix.map((l) => `[${l}]`).join('')}amix=inputs=${mix.length}:duration=longest:normalize=0,alimiter=limit=0.96,loudnorm=I=-15:TP=-1.2,aformat=sample_fmts=s16:channel_layouts=stereo[out]`);

const out = join(ROOT, 'trilha.wav');
const args = ['-y', '-loglevel', 'error', ...inputs.flatMap((f) => ['-i', f]), '-filter_complex', fc.join(';'), '-map', '[out]', '-t', (T + 0.4).toFixed(2), out];
console.log('fontes:', Object.keys(idx).join(' + '));
console.log('braam (riser) @', [m.title1, m.climaxStart, m.whiteFlash, m.titleFinal].join(', '), 's | impacto abertura @', m.teaserHit);
console.log('whoosh @', [m.worldStart, m.destructStart].join(', '), 's');
const r = spawnSync('ffmpeg', args, { stdio: 'inherit' });
if (r.status !== 0) { console.error('ffmpeg falhou'); process.exit(1); }
const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out], { encoding: 'utf8' });
console.log('\n✓ trilha.wav:', parseFloat(probe.stdout).toFixed(1) + 's ->', out);
