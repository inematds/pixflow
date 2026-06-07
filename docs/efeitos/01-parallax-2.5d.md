# 01 — Parallax 2.5D a partir de Foto

> Família: Profundidade · Ferramenta: Depth-Anything-V2 + Three.js/GLSL · Dificuldade: 4 · Versão: v1 (base para ambos)
> Volta para o [[00-INDEX]]

## O que é o efeito

Transforma uma foto plana em uma cena com **profundidade simulada**: ao mover a câmera virtual, os planos mais próximos deslocam mais que os distantes (paralaxe), criando sensação 3D real a partir de um único pixel array.

**Recria do PixFlow:** o efeito "dar vida à imagem" dos templates **AI VibeFX** (Arc Right, Bullet Time, Earth Out, Eyes In) e o **3D Ken Burns** — só que em código aberto, sem IA geradora de vídeo. É o coração do projeto.

## A técnica (pipeline)

```
foto.jpg
   │
   ▼  Depth-Anything-V2 (inferência monocular)
depth.png  (grayscale: branco = perto, preto = longe)
   │
   ▼  (opcional) SAM2 → máscaras para limpar bordas do sujeito
   │
   ▼  Three.js: imagem + depth como texturas em um plano
GLSL fragment shader: uv += (depth - 0.5) * parallax * cameraOffset
   │
   ▼  animar cameraOffset / câmera ao longo do tempo
frames → FFmpeg → vídeo
```

A ideia central, no fragment shader: **deslocar a coordenada UV de amostragem da textura proporcionalmente ao valor de profundidade daquele pixel e ao vetor de movimento da câmera**. Pixels próximos (depth alto) recebem deslocamento maior.

---

## Passo 1 — Gerar o depth map com Depth-Anything-V2

Instalação e inferência (Python):

```bash
# Ambiente
python -m venv venv && source venv/bin/activate
pip install torch torchvision opencv-python pillow
pip install git+https://github.com/DepthAnything/Depth-Anything-V2.git

# Baixar checkpoint (vitl = large, melhor qualidade; vits = mais leve/rápido)
mkdir -p checkpoints && cd checkpoints
wget https://huggingface.co/depth-anything/Depth-Anything-V2-Large/resolve/main/depth_anything_v2_vitl.pth
cd ..
```

Script de inferência que salva um PNG 16-bit (mais gradiente, menos banding no displacement):

```python
# infer_depth.py
import cv2, torch, numpy as np
from depth_anything_v2.dpt import DepthAnythingV2

DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'
model = DepthAnythingV2(encoder='vitl', features=256, out_channels=[256,512,1024,1024])
model.load_state_dict(torch.load('checkpoints/depth_anything_v2_vitl.pth', map_location='cpu'))
model = model.to(DEVICE).eval()

img = cv2.imread('foto.jpg')                       # BGR uint8
depth = model.infer_image(img)                     # HxW float32, valores arbitrários

# Normaliza 0..1 (perto = 1, longe = 0). Depth-Anything dá valores maiores p/ mais perto.
d = (depth - depth.min()) / (depth.max() - depth.min() + 1e-8)
cv2.imwrite('depth.png', (d * 65535).astype(np.uint16))   # PNG 16-bit
```

Comando direto:

```bash
python infer_depth.py     # gera depth.png a partir de foto.jpg
```

> Dica: para suavizar artefatos de borda, aplique um blur leve no depth (`cv2.GaussianBlur(d, (0,0), 1.5)`). Bordas duras no depth viram "rasgos" visíveis no parallax. Para limpar a silhueta do sujeito principal, use SAM2 (ver final) e force depth=1 dentro da máscara do sujeito.

---

## Passo 2 — Shader GLSL de displacement

### Vertex shader

Passa o UV adiante; geometria é um plano simples (o deslocamento é tudo no fragment).

```glsl
// parallax.vert
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

### Fragment shader

```glsl
// parallax.frag
precision highp float;

uniform sampler2D uImage;     // foto original
uniform sampler2D uDepth;     // depth map (grayscale, R = profundidade)
uniform vec2  uOffset;        // deslocamento da câmera virtual (x,y) ~ [-1,1]
uniform float uParallax;      // intensidade global do parallax (ex: 0.06)
uniform float uFocus;         // plano "parado" (0..1); depth==uFocus não se move
uniform float uZoom;          // 1.0 = sem zoom; >1 = push-in

varying vec2 vUv;

void main() {
  // recentraliza UV para aplicar zoom a partir do centro
  vec2 uv = (vUv - 0.5) / uZoom + 0.5;

  // amostra o depth nessa posição
  float depth = texture2D(uDepth, uv).r;

  // o quanto este pixel se desloca: relativo ao plano de foco.
  // pixels mais perto (depth > uFocus) vão para um lado; mais longe, para o outro.
  float shift = (depth - uFocus) * uParallax;

  // desloca a UV de amostragem da IMAGEM na direção do movimento da câmera
  vec2 displaced = uv + uOffset * shift;

  gl_FragColor = texture2D(uImage, displaced);
}
```

Pontos importantes:

- `uFocus` define qual plano fica "preso" na tela (o sujeito, geralmente ~0.5..0.7). Tudo na frente e atrás se move em sentidos opostos — é isso que cria a sensação de profundidade.
- `uParallax` controla a força. Acima de ~0.12 começam a aparecer rasgos nas bordas de oclusão (áreas que a câmera deveria "revelar" mas não existem na foto). Para esconder, mantenha o movimento sutil ou use inpainting/SAM2.
- Amostrar o `uDepth` **na UV já com zoom** mantém depth e imagem alinhados.

---

## Passo 3 — Setup mínimo Three.js

Carrega imagem + depth, monta o material e anima a câmera virtual via `uOffset`/`uZoom`.

```javascript
// main.js
import * as THREE from 'three';
import vert from './parallax.vert?raw';
import frag from './parallax.frag?raw';

const W = 1920, H = 1080;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(W, H);
document.body.appendChild(renderer.domElement);

// Câmera ortográfica: o plano preenche a tela exatamente
const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 10);
camera.position.z = 1;
const scene = new THREE.Scene();

const loader = new THREE.TextureLoader();
const uImage = loader.load('foto.jpg');
const uDepth = loader.load('depth.png');
uImage.colorSpace = THREE.SRGBColorSpace;        // foto em sRGB
uDepth.colorSpace = THREE.NoColorSpace;          // depth é linear, não tratar como cor

const material = new THREE.ShaderMaterial({
  uniforms: {
    uImage:    { value: uImage },
    uDepth:    { value: uDepth },
    uOffset:   { value: new THREE.Vector2(0, 0) },
    uParallax: { value: 0.06 },
    uFocus:    { value: 0.55 },
    uZoom:     { value: 1.0 },
  },
  vertexShader: vert,
  fragmentShader: frag,
});

// plano de 1x1 alinhado à câmera ortográfica (ajuste a escala Y p/ o aspect da foto)
const aspect = W / H;
const geo = new THREE.PlaneGeometry(1, 1);
const mesh = new THREE.Mesh(geo, material);
mesh.scale.set(aspect > 1 ? 1 : aspect, aspect > 1 ? 1 / aspect : 1, 1);
mesh.scale.set(1, 1, 1); // se a foto já é 16:9, mantenha 1x1
scene.add(mesh);

// Loop de animação
const DURATION = 6;     // segundos
const start = performance.now();

function frame() {
  const t = ((performance.now() - start) / 1000) % DURATION;
  const p = t / DURATION;                          // 0..1

  applyCameraMove('push-in', p, material.uniforms);

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
frame();
```

> Render headless (para virar vídeo): substitua o `requestAnimationFrame` por um loop que avança um frame fixo (`p = frame/totalFrames`), chama `renderer.render`, lê o canvas (`renderer.domElement.toBlob` ou `gl.readPixels` no headless-gl) e grava PNGs sequenciais. Depois encode com FFmpeg:
> ```bash
> ffmpeg -framerate 30 -i frames/%05d.png -c:v libx264 -pix_fmt yuv420p -crf 18 out.mp4
> ```
> Ver pipeline completo em `research/03-cadeia-recomendada.md`.

---

## Passo 4 — Camera moves (a função `applyCameraMove`)

Cada "movimento de câmera" é só uma forma de animar `uOffset` e `uZoom` ao longo de `p` (0..1). Easing suave (smoothstep) é o que dá look cinema — nada de rampas lineares.

```javascript
// easing: começa e termina devagar (ease-in-out)
const smooth = p => p * p * (3 - 2 * p);

function applyCameraMove(kind, p, u) {
  const e = smooth(p);
  switch (kind) {

    // PUSH-IN: aproximação lenta. Zoom sobe; offset mínimo.
    // Sensação: "entrando" na cena. O clássico de abertura.
    case 'push-in':
      u.uZoom.value   = 1.0 + 0.12 * e;        // 1.0 → 1.12
      u.uOffset.value.set(0, 0.02 * e);
      break;

    // DOLLY: zoom + deriva lateral simultânea (parallax forte revelado).
    case 'dolly':
      u.uZoom.value   = 1.0 + 0.08 * e;
      u.uOffset.value.set(0.10 * (e - 0.0), 0.0);
      break;

    // ORBIT SUTIL: a câmera descreve um pequeno arco; offset segue um círculo.
    // Mantém zoom fixo. Dá a ilusão de "rodar" levemente em torno do sujeito.
    case 'orbit': {
      const a = p * Math.PI * 2;               // volta completa suave
      u.uZoom.value = 1.04;
      u.uOffset.value.set(Math.sin(a) * 0.06, Math.cos(a) * 0.03);
      break;
    }

    // KEN BURNS 3D: pan diagonal + zoom lento, COM parallax real (≠ Ken Burns 2D).
    // É o Ken Burns clássico potencializado pela profundidade do depth map.
    case 'ken-burns-3d':
      u.uZoom.value = 1.0 + 0.15 * e;
      u.uOffset.value.set(-0.06 * e, -0.04 * e);  // deriva diagonal
      break;
  }
}
```

### Referência rápida dos movimentos

| Movimento | uZoom | uOffset | Quando usar |
|---|---|---|---|
| **Push-in** | 1.0 → ~1.12 | ~0 | Abertura, foco no sujeito, dramatismo crescente |
| **Dolly** | 1.0 → ~1.08 | deriva lateral | Revelar profundidade, sensação de travelling |
| **Orbit sutil** | fixo ~1.04 | círculo pequeno | Retratos, produtos — "vida" sem sair do lugar |
| **Ken Burns 3D** | 1.0 → ~1.15 | diagonal | Fotos de paisagem/documental com profundidade |

---

## Parâmetros ajustáveis

| Uniform / param | Faixa típica | Efeito |
|---|---|---|
| `uParallax` | 0.03 – 0.12 | Força do 3D. Alto = mais imersivo, mais risco de rasgos de oclusão |
| `uFocus` | 0.4 – 0.7 | Plano que fica "parado". Aponte para o sujeito principal |
| `uZoom` (delta) | 0.08 – 0.18 | Quanto de push-in ao longo da cena |
| `DURATION` | 5 – 10 s | Mais lento = mais cinematográfico |
| Amplitude de `uOffset` | 0.02 – 0.10 | Quanto a câmera anda |

---

## Dicas "look cinema"

- **Movimento sutil ganha sempre.** Parallax exagerado parece videogame. Cinema é deriva lenta e quase imperceptível.
- **Easing ease-in-out obrigatório.** Nunca linear. `smoothstep` no começo e no fim de cada move.
- **Combine push-in + orbit minúsculo** ao mesmo tempo para movimento orgânico (a câmera "respira").
- **Limpe a silhueta do sujeito** (SAM2, abaixo) — é onde os rasgos de oclusão mais aparecem e mais quebram a ilusão.
- **Depois empilhe o look:** grão + LUT ([[04-grain-luts-colorgrade]]), partículas de poeira ([[03-particulas-e-atmosfera]]) e um light leak suave ([[05-light-leaks-overlays]]) transformam o parallax cru num plano de filme.
- **Profundidade de campo falsa:** amostre o depth e aplique blur leve onde `abs(depth - uFocus)` é grande (ver técnica de blur em [[02-transicoes]]).

---

## Passo opcional — SAM2 para limpar bordas

Quando há um sujeito nítido (pessoa, produto), separá-lo do fundo evita que o parallax "rasgue" sua silhueta.

```bash
pip install git+https://github.com/facebookresearch/sam2.git
```

```python
# segment.py — gera mask_fg.png (sujeito = branco)
import numpy as np, cv2
from sam2.build_sam import build_sam2
from sam2.sam2_image_predictor import SAM2ImagePredictor

predictor = SAM2ImagePredictor(build_sam2(
    "sam2_hiera_l.yaml", "checkpoints/sam2_hiera_large.pt"))
img = cv2.cvtColor(cv2.imread('foto.jpg'), cv2.COLOR_BGR2RGB)
predictor.set_image(img)

# clique no sujeito (x,y) como prompt
masks, scores, _ = predictor.predict(
    point_coords=np.array([[960, 540]]),
    point_labels=np.array([1]))
mask = masks[scores.argmax()]
cv2.imwrite('mask_fg.png', (mask * 255).astype(np.uint8))
```

Use a máscara para: (a) forçar `depth = 1` dentro do sujeito (mantém-no num plano coeso) e (b), em montagens mais avançadas, renderizar sujeito e fundo em dois planos separados com inpainting do fundo atrás do sujeito.
