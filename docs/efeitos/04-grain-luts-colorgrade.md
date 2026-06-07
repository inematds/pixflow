# 04 — Grão de Filme, LUTs e Color Grade

> Família: Color / Textura · Ferramenta: GLSL (grão) + Three.js LUTPass/DataTexture3D / FFmpeg lut3d · Dificuldade: 3 · Versão: ambos
> Volta para o [[00-INDEX]]

## O que é

Duas camadas que dão o "look cinema" final a qualquer plano:

1. **Grão de filme** — ruído sutil animado que quebra o digital "limpo demais" e dá textura de película.
2. **Color grade via LUT 3D** — um Look-Up Table mapeia cada cor de entrada para uma cor de saída, aplicando paletas cinematográficas (teal & orange, vintage, frio, etc.).

**Recria do PixFlow:** Film Emulation Pro, Kodak/Fuji Film looks, grão de filme dos packs retrô, e os **1000+ Color LUTs** vendidos no site.

Aplicação típica: como **pós-processamento** depois do parallax + partículas, no fim da cadeia (Three.js `EffectComposer` ou filtros FFmpeg).

---

## Parte 1 — Grão de filme

### 1a. Grão procedural em GLSL (recomendado — mais autêntico)

Ruído simplex animado, sobreposto em modo overlay/screen, com intensidade calibrada pela luminância (sombras recebem mais grão, como em filme real).

```glsl
// grain.frag — passa de pós-processamento (recebe a cena já renderizada em tDiffuse)
precision highp float;
uniform sampler2D tDiffuse;
uniform float uTime;
uniform float uAmount;     // 0.04 .. 0.12
uniform float uSize;       // tamanho do grão (ex: 1.5)
varying vec2 vUv;

// simplex noise 2D (Ashima / Stefan Gustavson) — versão compacta
vec3 permute(vec3 x){ return mod((x*34.0+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865, 0.366025403, -0.577350269, 0.024390243);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291 - 0.85373472 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x*x0.x + h.x*x0.y;
  g.yz = a0.yz*x12.xz + h.yz*x12.yw;
  return 130.0 * dot(m, g);
}

void main(){
  vec4 color = texture2D(tDiffuse, vUv);

  // ruído que muda a cada frame (uTime quebra o padrão estático)
  float n = snoise(vUv / uSize * 800.0 + uTime * 50.0);
  n = n * 0.5 + 0.5;                       // 0..1

  // luminância: sombras pegam mais grão (como filme)
  float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  float shadowBoost = mix(1.5, 0.6, lum);  // sombra=1.5, alta-luz=0.6

  // aplica em modo overlay (centrado em 0.5)
  float grain = (n - 0.5) * uAmount * shadowBoost;
  color.rgb += grain;

  gl_FragColor = color;
}
```

Setup como `ShaderPass` no `EffectComposer`:

```javascript
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import grainFrag from './grain.frag?raw';

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const grainPass = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null },
    uTime:    { value: 0 },
    uAmount:  { value: 0.07 },
    uSize:    { value: 1.5 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: grainFrag,
});
composer.addPass(grainPass);

// no loop:
grainPass.uniforms.uTime.value = t;
composer.render();
```

### 1b. Alternativa CSS com `steps()` (sem WebGL)

Para overlays web simples: um PNG de ruído tileável animado em saltos discretos (steps) — cada salto reposiciona o grão, simulando troca de frame de filme.

```css
.grain::after {
  content: '';
  position: fixed; inset: -50%;
  width: 200%; height: 200%;
  background-image: url('noise.png');   /* PNG de ruído tileável ~256px */
  opacity: 0.08;
  pointer-events: none;
  mix-blend-mode: overlay;
  animation: grain 0.5s steps(6) infinite;  /* steps = "frames" do grão */
}
@keyframes grain {
  0%   { transform: translate(0,    0);    }
  17%  { transform: translate(-5%,  -8%);  }
  34%  { transform: translate(8%,   3%);   }
  51%  { transform: translate(-3%,  10%);  }
  68%  { transform: translate(6%,  -6%);   }
  85%  { transform: translate(-8%,  4%);   }
}
```

O `steps(6)` é o que dá o caráter "filme" (saltos, não interpolação suave). Gere o `noise.png` com qualquer gerador de ruído tileável.

### Params do grão

| Param | Faixa | Efeito |
|---|---|---|
| `uAmount` / opacity | 0.04–0.12 | Intensidade. >0.15 vira "sujo demais" |
| `uSize` | 1.0–2.5 | Tamanho do grão (filme 35mm fino; 16mm/super8 grosso) |
| velocidade (`uTime`/steps) | — | Lento = filme; rápido = ruído de sensor/digital |

---

## Parte 2 — Color grade via LUT 3D

### 2a. Caminho fácil: LUTPass do Three.js

O Three.js traz `LUTPass` + loaders de `.cube`/`.3dl`. Carrega a LUT, joga no composer.

```javascript
import { LUTPass } from 'three/addons/postprocessing/LUTPass.js';
import { LUTCubeLoader } from 'three/addons/loaders/LUTCubeLoader.js';

new LUTCubeLoader().load('cinematic_teal_orange.cube', (result) => {
  const lutPass = new LUTPass({ lut: result.texture3D, intensity: 0.9 });
  composer.addPass(lutPass);     // adicione APÓS o grão? não: LUT antes, grão por último
});
```

> Ordem na cadeia: `RenderPass → (parallax já está na cena) → LUTPass → GrainPass`. Color grade vem **antes** do grão, para o grão ficar por cima da imagem já corrigida (como na revelação do filme).

### 2b. Caminho manual: DataTexture3D + GLSL

Quando quer controle total (ou misturar com outros efeitos no mesmo shader). Carrega o `.cube` como `THREE.Data3DTexture` e amostra no fragment.

Parser mínimo de `.cube` → `Data3DTexture`:

```javascript
import * as THREE from 'three';

async function loadCubeLUT(url) {
  const txt = await (await fetch(url)).text();
  let size = 0; const data = [];
  for (const line of txt.split('\n')) {
    const l = line.trim();
    if (l.startsWith('LUT_3D_SIZE')) size = parseInt(l.split(/\s+/)[1]);
    else if (/^[\d.]/.test(l)) {
      const [r,g,b] = l.split(/\s+/).map(Number);
      data.push(r*255, g*255, b*255, 255);
    }
  }
  const tex = new THREE.Data3DTexture(new Uint8Array(data), size, size, size);
  tex.format = THREE.RGBAFormat;
  tex.type = THREE.UnsignedByteType;
  tex.minFilter = tex.magFilter = THREE.LinearFilter;   // interpolação trilinear
  tex.unpackAlignment = 1;
  tex.needsUpdate = true;
  return { texture: tex, size };
}
```

Fragment shader que aplica a LUT (GLSL ES 3.0 — Three.js WebGL2):

```glsl
// lut.frag  (precisa de `glslVersion: THREE.GLSL3` no ShaderMaterial)
precision highp float;
precision highp sampler3D;
uniform sampler2D tDiffuse;
uniform sampler3D uLUT;
uniform float uSize;        // ex: 32.0
uniform float uIntensity;   // 0..1 (mistura entre original e graded)
in vec2 vUv;
out vec4 outColor;

void main(){
  vec4 src = texture(tDiffuse, vUv);
  // remapeia 0..1 para o centro dos texels (evita clamp nas bordas da LUT)
  vec3 uvw = src.rgb * ((uSize - 1.0) / uSize) + (0.5 / uSize);
  vec3 graded = texture(uLUT, uvw).rgb;
  outColor = vec4(mix(src.rgb, graded, uIntensity), src.a);
}
```

```javascript
const { texture, size } = await loadCubeLUT('look.cube');
const lutPass = new ShaderPass({
  uniforms: {
    tDiffuse:   { value: null },
    uLUT:       { value: texture },
    uSize:      { value: size },
    uIntensity: { value: 0.85 },
  },
  glslVersion: THREE.GLSL3,
  vertexShader: `in vec3 position; in vec2 uv; out vec2 vUv;
                 void main(){ vUv=uv; gl_Position=vec4(position,1.0); }`,
  fragmentShader: lutFrag,
});
```

### 2c. LUT direto no FFmpeg (sem WebGL)

Se a cor é a última etapa antes do encode:

```bash
ffmpeg -i cena.mp4 -vf "lut3d=look.cube" -c:v libx264 -crf 18 out.mp4
# misturar parcialmente a LUT:
ffmpeg -i cena.mp4 -filter_complex \
  "[0:v]lut3d=look.cube[g];[0:v][g]blend=all_mode=normal:all_opacity=0.85" out.mp4
```

### 2d. Aproximação CSS (sem LUT real)

Para web rápida, sem LUT: filtros encadeados imitam um look (grosseiro, mas serve).

```css
.cine { filter: contrast(1.12) saturate(1.15) sepia(0.12) hue-rotate(-6deg) brightness(0.98); }
```

---

## Onde achar LUTs grátis (.cube)

| Fonte | O que tem |
|---|---|
| **FILM CRUX** (filmcrux.com/blog/free-film-resources) | Pacote de LUTs cinematográficas grátis |
| **No Film School** (nofilmschool.com/free-film-assets) | Coletâneas de LUTs e assets |
| **Motion Array** (motionarray.com) | LUTs no tier gratuito |
| Lista completa | `research/02-tecnicas-e-acesso.md` |

Formato `.cube` é texto puro e portável — funciona em DaVinci, Premiere, FFmpeg e no loader acima. Tamanhos comuns: 17, 32 ou 64 (cubo³). 32 é o equilíbrio padrão.

---

## Dicas "look cinema"

- **Ordem:** color grade (LUT) primeiro, **grão por último**. Grão sobre imagem já corrigida = película; LUT sobre grão = errado, achata o ruído.
- **Intensidade da LUT < 1.0.** Aplicar a 100% costuma exagerar. 0.7–0.9 dá look profissional. Use `uIntensity`/`all_opacity`.
- **Grão na sombra, não na luz.** O `shadowBoost` no shader replica o comportamento físico do filme — é o detalhe que separa "filtro" de "película".
- **Anime o grão.** Grão estático parece sujeira na lente. Mude `uTime` (ou use `steps()` no CSS).
- **Empilhe o look completo:** parallax ([[01-parallax-2.5d]]) → partículas/atmosfera ([[03-particulas-e-atmosfera]]) → LUT → light leak ([[05-light-leaks-overlays]]) → grão. Essa pilha é o "filme" do PixFlow recriado em código.
- **Teal & orange** é o look comercial padrão (pele quente, sombras frias). Para "vintage", LUT desaturada com leve sepia + grão grosso + vinheta (vinheta em GLSL no [[01-parallax-2.5d]] / `research/02`).
