// Gera depth map (Depth-Anything-V2-small via transformers.js / onnxruntime, sem torch).
// Uso: node cli/depth.mjs <imagem> <saida.png>
import { pipeline } from '@huggingface/transformers';

let _depther = null;
async function getDepther() {
  if (_depther) return _depther;
  process.stderr.write('pixflow: carregando modelo de profundidade (Depth-Anything-V2-small)…\n');
  _depther = await pipeline('depth-estimation', 'onnx-community/depth-anything-v2-small', { dtype: 'fp32' });
  return _depther;
}

export async function generateDepth(imagePath, outPath) {
  const depther = await getDepther();
  const { depth } = await depther(imagePath);
  // depth é RawImage em tons de cinza: branco = perto (disparidade alta) — bate com o shader.
  await depth.save(outPath);
  return outPath;
}

// execução direta
if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , img, out] = process.argv;
  if (!img || !out) { console.error('uso: node cli/depth.mjs <imagem> <saida.png>'); process.exit(1); }
  generateDepth(img, out)
    .then((p) => { console.log('depth ->', p); process.exit(0); })
    .catch((e) => { console.error('erro depth:', e.message); process.exit(1); });
}
