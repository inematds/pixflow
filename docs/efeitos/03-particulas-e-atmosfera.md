# 03 — Partículas e Atmosfera

> Família: Partícula / Atmosfera · Ferramenta: Three.js Points/instancing + GLSL, FFmpeg p/ overlays · Dificuldade: 3-4 · Versão: ambos
> Volta para o [[00-INDEX]]

## O que é

Camada de partículas e clima sobre a cena: **poeira** flutuando na luz, **fumaça leve**, **faíscas**, **bokeh** (pontos de luz desfocados). É o que dá "ar" e profundidade a um plano de [[01-parallax-2.5d]], fazendo a imagem respirar.

**Recria do PixFlow:** Sahara Dust, Sand & Dust Particles, Magical Particle Elements, Action FX (fumaça/faíscas), e os atmosféricos dos templates cinematográficos.

## Técnica geral

Cada partícula tem posição, velocidade, vida, tamanho e opacidade. Em Three.js, milhares delas vivem num único `THREE.Points` (BufferGeometry) renderizado em uma chamada — performático. A aparência (forma, brilho, fade) é controlada por um `ShaderMaterial` com **blending aditivo** (luz soma) ou **screen-like** (fumaça).

---

## Base: sistema de partículas com THREE.Points

```javascript
// particles.js
import * as THREE from 'three';
import vert from './particles.vert?raw';
import frag from './particles.frag?raw';

export function makeParticles(count = 2000, opts = {}) {
  const positions = new Float32Array(count * 3);
  const seeds     = new Float32Array(count);      // aleatório por partícula
  const sizes     = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i*3+0] = (Math.random() - 0.5) * 2.0;   // x em [-1,1]
    positions[i*3+1] = (Math.random() - 0.5) * 2.0;   // y
    positions[i*3+2] = Math.random();                 // z em [0,1] (profundidade)
    seeds[i]  = Math.random() * 100.0;
    sizes[i]  = THREE.MathUtils.lerp(opts.minSize ?? 2, opts.maxSize ?? 8, Math.random());
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSeed',    new THREE.BufferAttribute(seeds, 1));
  geo.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime:     { value: 0 },
      uColor:    { value: new THREE.Color(opts.color ?? 0xffeecc) },
      uOpacity:  { value: opts.opacity ?? 0.5 },
      uSprite:   { value: opts.sprite ?? null },     // textura RGBA (opcional)
      uDrift:    { value: opts.drift ?? 0.03 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    depthWrite: false,
    blending: opts.blending ?? THREE.AdditiveBlending,
  });

  return new THREE.Points(geo, mat);
}
```

### Vertex shader — movimento e tamanho

```glsl
// particles.vert
uniform float uTime;
uniform float uDrift;
uniform float uPixelRatio;
attribute float aSeed;
attribute float aSize;
varying float vAlpha;
varying float vSeed;

void main() {
  vec3 p = position;

  // deriva orgânica (movimento browniano suave) usando seno por seed
  p.x += sin(uTime * 0.3 + aSeed)        * uDrift;
  p.y += cos(uTime * 0.2 + aSeed * 1.7)  * uDrift
       + uTime * 0.01 * (0.5 + fract(aSeed));   // leve subida (poeira sobe na luz)

  // wrap vertical: quando sai por cima, volta por baixo
  p.y = fract((p.y + 1.0) * 0.5) * 2.0 - 1.0;

  // partículas mais próximas (z alto) maiores e mais opacas → profundidade
  float depth = p.z;
  vAlpha = 0.3 + depth * 0.7;
  vSeed  = aSeed;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = aSize * (0.6 + depth) * uPixelRatio;
  gl_Position = projectionMatrix * mv;
}
```

### Fragment shader — forma e brilho

```glsl
// particles.frag
uniform vec3  uColor;
uniform float uOpacity;
uniform sampler2D uSprite;
varying float vAlpha;
varying float vSeed;

void main() {
  // gl_PointCoord vai de 0..1 dentro do ponto
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);

  // disco suave (sem textura): falloff radial gaussiano
  float disk = smoothstep(0.5, 0.0, d);

  // cintilação leve (twinkle) por partícula
  float tw = 0.7 + 0.3 * sin(vSeed * 6.0);

  float a = disk * vAlpha * uOpacity * tw;
  gl_FragColor = vec4(uColor, a);
}
```

> Com `uSprite` (PNG de poeira/fumaça): troque `disk` por `texture2D(uSprite, gl_PointCoord).a` para usar a forma da textura.

No loop: `points.material.uniforms.uTime.value = t;` a cada frame.

---

## Presets por efeito

| Efeito | count | size | blending | color | drift | sprite |
|---|---|---|---|---|---|---|
| **Poeira** | 1500–3000 | 2–6 px | Additive | quente `#ffeecc` | 0.02–0.04 | disco (sem) |
| **Bokeh** | 60–200 | 30–80 px | Additive | branco/dourado | 0.005 | disco grande, alpha baixo |
| **Fumaça leve** | 200–500 | 80–200 px | Normal (screen-like) | cinza `#888` | 0.05, expansão | textura orgânica |
| **Faíscas** | 300–800 | 1–4 px | Additive | laranja `#ff7722` | gravidade + vel. alta | trail/linha |

### Poeira na luz (o mais usado)

```javascript
const dust = makeParticles(2500, {
  color: 0xffeecc, opacity: 0.4, minSize: 2, maxSize: 6,
  drift: 0.03, blending: THREE.AdditiveBlending,
});
scene.add(dust);
```

### Bokeh (pontos de luz desfocados)

Poucas partículas, grandes, alpha baixo, com leve foco/desfoco. No fragment, alargue o falloff (`smoothstep(0.5, 0.2, d)`) para a borda ficar bem macia.

### Faíscas (com gravidade e vida)

Adicione um atributo `aVel` e `aLife`; no vertex, integre `p += aVel * uTime` e aplique gravidade `p.y -= 0.5*g*t*t`. No fragment, fade pela vida. Alongue o ponto na direção da velocidade para virar "trail".

### Fumaça leve

Use sprites de textura orgânica (nuvem com alpha), blending `NormalBlending`, e faça as partículas **crescerem** ao longo da vida (`gl_PointSize` aumenta com `uTime`). Mantenha opacidade baixa — fumaça pesada some o plano de fundo.

---

## Quando SIMULAR vs. usar OVERLAY de vídeo real

Regra prática:

| Situação | Escolha | Por quê |
|---|---|---|
| Poeira, bokeh, faíscas, neve, partículas geométricas | **Simular (Three.js)** | Controle total, profundidade real (responde ao parallax/câmera), resolução livre, sem custo de asset |
| **Fumaça densa, fogo, fluido volumétrico, explosão** | **Overlay de vídeo real (ProRes)** | Simulação volumétrica boa exige Blender Cycles/fluid sim — caro. Footage real fica melhor mais rápido |
| Light leaks orgânicos | **Overlay** | Ver [[05-light-leaks-overlays]] |
| Partículas que precisam reagir ao depth/câmera da cena | **Simular** | Overlay é 2D flat, não tem paralaxe |

### Overlay de vídeo real via FFmpeg (blend=screen)

Footage de fumaça/faísca filmado em fundo preto soma com a cena no modo **screen** (preto vira transparente):

```bash
ffmpeg -i cena.mp4 -i fumaca_prores.mov -filter_complex \
  "[1:v]format=rgba,colorchannelmixer=aa=0.6[ov]; \
   [0:v][ov]blend=all_mode=screen:all_opacity=0.7" out.mp4
```

`colorchannelmixer=aa=0.6` baixa a intensidade do overlay; `screen` é o modo certo para elementos sobre preto. Para integrar no Three.js em vez do FFmpeg, ver blend screen em WebGL no [[05-light-leaks-overlays]].

**Assets grátis de fumaça/faísca/partícula:** Video Copilot (15 clipes grátis), Mixkit, Pexels/Videvo — ver lista completa em `research/02-tecnicas-e-acesso.md`.

---

## Dicas "look cinema"

- **Profundidade vende.** Varie tamanho e opacidade por `z` — partículas próximas maiores e desfocadas, distantes pequenas e nítidas. Sem isso, vira "chuva de pixels" plana.
- **Pouca opacidade, muita quantidade.** Poeira boa é quase invisível individualmente; o conjunto é que dá atmosfera.
- **Cor puxa do plano.** Combine `uColor` com a luz dominante da foto (quente ao pôr do sol, fria à noite).
- **Bokeh + light leak + grão** juntos = aquele plano "anúncio de perfume". Empilhe com [[04-grain-luts-colorgrade]] e [[05-light-leaks-overlays]].
- **Twinkle sutil.** A cintilação no fragment (`tw`) evita que partículas pareçam estáticas/CGI.
- **Não cubra o sujeito.** Mantenha a densidade alta nas bordas/cantos e rala no centro onde está o foco.
