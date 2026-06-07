# 07 — Displacement, Turbulência e Distorção

> Família: Distorção · Ferramenta: SVG feTurbulence+feDisplacementMap / GLSL com ruído · Dificuldade: 3 · Versão: ambos
> Volta para o [[00-INDEX]]

## O que é

Deformar a imagem deslocando suas coordenadas de amostragem (UV) a partir de uma textura de ruído ou função matemática. Gera **heat haze** (ar quente tremulando), **water ripple** (ondulação líquida), **dream warp** (distorção onírica) e o look **VHS/CRT** (distorção horizontal + ruído).

**Recria do PixFlow:** Fish Eye / WideVision (distorção de lente), Optic FX Prism, PX-VHS / PX-CRT (distorções de fita/tubo), e os "warps" dos templates psicodélicos/VFX.

Princípio único: **`uv += deslocamento(ruído, tempo)` antes de amostrar a textura.** O que muda é a fonte do deslocamento e como ele evolui no tempo.

Dois caminhos: **SVG** (`feTurbulence` + `feDisplacementMap`, nativo no browser, sem WebGL) e **GLSL** (controle total, integra com a cadeia Three.js).

---

## Caminho 1 — SVG feTurbulence + feDisplacementMap

Nativo no browser. Aplica a qualquer elemento HTML/imagem via `filter`. `feTurbulence` gera ruído de Perlin; `feDisplacementMap` usa esse ruído para empurrar os pixels do `SourceGraphic`.

```html
<img src="foto.jpg" class="warped">

<svg width="0" height="0">
  <filter id="warp">
    <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02"
                  numOctaves="3" seed="7" result="noise">
      <!-- anima o ruído: muda baseFrequency no tempo = movimento -->
      <animate attributeName="baseFrequency" dur="12s" values="0.012 0.02;0.02 0.012;0.012 0.02"
               repeatCount="indefinite"/>
    </feTurbulence>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="22"
                       xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</svg>
```

```css
.warped { filter: url(#warp); }
```

| Atributo | Efeito |
|---|---|
| `type` | `fractalNoise` (suave, nuvens) vs `turbulence` (mais áspero/marmorizado) |
| `baseFrequency` | Escala do ruído. Baixo = ondas largas; alto = tremor fino. X e Y separados criam anisotropia |
| `numOctaves` | Detalhe/camadas do ruído (1–4) |
| `scale` (no displacement) | Intensidade da distorção em px |
| `seed` | Padrão do ruído |

**Heat haze em SVG:** `baseFrequency="0.01 0.04"` (vertical mais frequente que horizontal, como ar subindo), `scale="8"` (sutil), animando `baseFrequency` lentamente.

> Limitação: SVG filters distorcem o elemento todo igualmente e não reagem ao depth da cena. Para distorção localizada/3D, use GLSL.

---

## Caminho 2 — GLSL com textura de ruído

Integra com Three.js (mesma cena do parallax). Use uma textura de ruído (PNG tileável ou ruído gerado em shader) para deslocar as UVs.

### Fragment shader base (displacement por textura de ruído)

```glsl
// distort.frag
precision highp float;
uniform sampler2D uImage;     // imagem/cena
uniform sampler2D uNoise;     // textura de ruído tileável (RG = direções)
uniform float uTime;
uniform float uStrength;      // intensidade (ex: 0.02)
uniform float uScale;         // escala do ruído (ex: 2.0)
uniform float uSpeed;         // velocidade da animação (ex: 0.1)
varying vec2 vUv;

void main(){
  // amostra o ruído rolando no tempo
  vec2 nuv = vUv * uScale + uTime * uSpeed;
  vec2 disp = texture2D(uNoise, nuv).rg;
  disp = (disp - 0.5) * 2.0 * uStrength;        // centra em 0, escala

  gl_FragColor = texture2D(uImage, vUv + disp);
}
```

### Ruído procedural (sem textura externa)

Se preferir não carregar PNG, gere o deslocamento com seno/valor-noise:

```glsl
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i),            hash(i+vec2(1,0)), u.x),
             mix(hash(i+vec2(0,1)),  hash(i+vec2(1,1)), u.x), u.y);
}
// uso no main, em vez de texture2D(uNoise,...):
vec2 disp = vec2(
  vnoise(vUv*uScale + uTime*uSpeed),
  vnoise(vUv*uScale - uTime*uSpeed + 5.2)
);
disp = (disp - 0.5) * 2.0 * uStrength;
```

---

## Variantes (presets)

### Heat haze (ar quente)

Tremor sutil, mais forte na vertical, lento. Opcionalmente cresce de baixo para cima (calor sobe).

```glsl
// dentro do main:
float gradient = smoothstep(0.0, 1.0, 1.0 - vUv.y);   // mais forte embaixo
vec2 disp;
disp.x = sin(vUv.y * 40.0 + uTime * 3.0) * 0.004;
disp.y = sin(vUv.x * 30.0 + uTime * 2.0) * 0.002;
disp *= gradient * uStrength * 5.0;
gl_FragColor = texture2D(uImage, vUv + disp);
```

Params: amplitude `0.002–0.006` (sutil!), frequência alta (`30–50`). Combine com leve tint quente.

### Water ripple (ondulação líquida)

Ondas concêntricas a partir de um ponto (gota) ou ondulação contínua (superfície d'água).

```glsl
// ripple concêntrico a partir do centro
uniform vec2 uCenter;        // ex: vec2(0.5)
float d = distance(vUv, uCenter);
float wave = sin(d * 50.0 - uTime * 5.0) * exp(-d * 4.0);  // amortece com a distância
vec2 dir = normalize(vUv - uCenter);
vec2 disp = dir * wave * uStrength;
gl_FragColor = texture2D(uImage, vUv + disp);
```

Params: `50.0` = nº de ondas; `exp(-d*4.0)` = amortecimento (gota); remova o `exp` para superfície contínua. Para água parada, some duas senoides cruzadas em X e Y.

### Dream warp (distorção onírica)

Ruído de baixa frequência, lento e amplo, dando sensação de sonho/memória. Bom com blur leve e LUT desaturada.

```glsl
vec2 disp;
disp.x = vnoise(vUv * 1.5 + uTime * 0.05) - 0.5;
disp.y = vnoise(vUv * 1.5 - uTime * 0.04 + 9.1) - 0.5;
disp *= uStrength * 2.0;   // strength ~0.03 (amplo)
gl_FragColor = texture2D(uImage, vUv + disp);
```

### VHS / CRT (recria PX-VHS / PX-CRT)

Combina displacement horizontal por linha + RGB split + scanlines + ruído. Junta esta página com [[02-transicoes]] (RGB split) e [[04-grain-luts-colorgrade]] (grão).

```glsl
// jitter horizontal por linha (tracking ruim da fita)
float line = floor(vUv.y * 240.0);
float jitter = (hash(vec2(line, floor(uTime*15.0))) - 0.5) * 0.01;
vec2 uv = vec2(vUv.x + jitter, vUv.y);

// RGB split horizontal
float s = 0.004;
float r = texture2D(uImage, uv + vec2(s, 0.0)).r;
float g = texture2D(uImage, uv).g;
float b = texture2D(uImage, uv - vec2(s, 0.0)).b;
vec3 col = vec3(r, g, b);

// scanlines
col *= 0.85 + 0.15 * sin(vUv.y * 800.0);

gl_FragColor = vec4(col, 1.0);
```

Adicione grão por cima ([[04-grain-luts-colorgrade]]) e uma leve curvatura/vinheta para o look CRT.

---

## Setup Three.js (pós-processamento)

Qualquer um dos shaders acima entra como `ShaderPass` no `EffectComposer` (mesma estrutura de [[04-grain-luts-colorgrade]]):

```javascript
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import distortFrag from './distort.frag?raw';

const distortPass = new ShaderPass({
  uniforms: {
    tDiffuse:  { value: null },     // se for pós-proc, use tDiffuse no shader
    uNoise:    { value: noiseTex },
    uTime:     { value: 0 },
    uStrength: { value: 0.02 },
    uScale:    { value: 2.0 },
    uSpeed:    { value: 0.1 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: distortFrag,   // troque uImage por tDiffuse para usar como pós-proc
});
composer.addPass(distortPass);
// loop: distortPass.uniforms.uTime.value = t;
```

> Se usar como **pós-processamento**, renomeie `uImage` → `tDiffuse` no shader (é a textura que o composer injeta com a cena renderizada).

---

## Parâmetros e dicas "look cinema"

| Efeito | uStrength | uScale | uSpeed | Look |
|---|---|---|---|---|
| Heat haze | 0.002–0.006 | alto (30–50) | lento | calor sutil, realista |
| Water ripple | 0.01–0.04 | — | médio | gota/superfície |
| Dream warp | 0.02–0.05 | baixo (1–2) | bem lento | onírico, memória |
| VHS/CRT | 0.004–0.01 | — | rápido | retrô, glitch |

- **Sutileza no haze.** Heat haze bom é quase imperceptível — só se nota quando some. `uStrength` acima de ~0.008 vira "vidro derretendo".
- **Amorteça o ripple.** Sem o `exp(-d)`, a ondulação parece falsa. Ondas perdem energia com a distância.
- **Dream = lento + amplo + dessaturado.** Combine warp com blur leve, LUT fria/desaturada ([[04-grain-luts-colorgrade]]) e talvez bokeh ([[03-particulas-e-atmosfera]]).
- **VHS é uma pilha.** Sozinho o jitter não convence: precisa de RGB split + scanlines + grão + leve tracking + saturação alta. É a soma que vende o retrô.
- **Distorção como acento de transição.** Um displacement forte que decai a zero no início de uma cena (ver [[02-transicoes]], displacement transition) dá entrada com personalidade.
- **Respeite o sujeito.** Distorcer o rosto/produto principal incomoda. Module por máscara (SAM2, [[01-parallax-2.5d]]) ou por gradiente para distorcer só o fundo/bordas.
