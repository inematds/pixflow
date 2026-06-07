// Gera imagem via servidor inemaimg (flux2-klein por padrão).
// Uso: node cli/genimg.mjs <saida.png> "<prompt>" [model] [WxH] [seed]
import { writeFileSync } from 'node:fs';

const URL = process.env.INEMAIMG_URL || 'http://localhost:8000';

export async function generateImage(outPath, prompt, { model = 'flux2-klein', width = 1280, height = 720, steps = 4, seed } = {}) {
  const body = { model, prompt, width, height, steps };
  if (seed != null) body.seed = seed;
  const res = await fetch(`${URL}/generate`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`inemaimg ${res.status}: ${await res.text()}`);
  const j = await res.json();
  if (!j.image) throw new Error('resposta sem campo image');
  writeFileSync(outPath, Buffer.from(j.image, 'base64'));
  return outPath;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , out, prompt, model, size, seed] = process.argv;
  if (!out || !prompt) { console.error('uso: node cli/genimg.mjs <saida.png> "<prompt>" [model] [WxH] [seed]'); process.exit(1); }
  const [w, h] = (size || '1280x720').toLowerCase().split('x').map(Number);
  generateImage(out, prompt, { model: model || 'flux2-klein', width: w, height: h, seed: seed ? Number(seed) : undefined })
    .then((p) => { console.log('img ->', p); process.exit(0); })
    .catch((e) => { console.error('erro genimg:', e.message); process.exit(1); });
}
