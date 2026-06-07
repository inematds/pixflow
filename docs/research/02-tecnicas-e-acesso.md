# PixFlow: Acesso, Formacao e Tecnicas de Motion Design

**Data da pesquisa:** 2026-06-07
**Fontes:** pixflow.net, GitHub, Codrops, Shadertoy, MDN, pesquisa primaria em multiplos canais.

---

## PARTE A — Como Acessar o Conteudo / Formacao

### 1. Como se acessa o conteudo do PixFlow

**Site oficial:** https://pixflow.net

**Modelos de acesso:**

| Modalidade | Descricao |
|---|---|
| Assinatura mensal | Acesso ilimitado a todos os assets (templates AE/PR, LUTs, plugins, elementos VFX) |
| Assinatura anual | Mesmo acesso, menor custo mensal por pagamento antecipado |
| Lifetime Deal | Acesso vitalicio a todos os assets atuais e futuros — promocionalmente anunciado por $199 (Cyber Monday; verifique disponibilidade atual em pixflow.net/pricing) |
| Fimulation | Produto separado, licenca unica (Pro para pequenas producoes, Studio para equipes grandes) |
| Conta gratuita | Existe — permite acesso a tier gratuito da loja e ao plugin Motion Factory Classic sem custo |

**Pagina de precos:** https://pixflow.net/pricing/
**Loja com assets gratis:** https://pixflow.net/store/

**Nota:** Valores exatos de assinatura nao ficam expostos nos metadados de busca — visitar a pagina de precos para valores vigentes.

---

### 2. Material de formacao / cursos / tutoriais do PixFlow

**Canal YouTube oficial:** https://www.youtube.com/c/PixFlow (https://www.youtube.com/@Pixflow)
- Tutoriais de instalacao e uso do Motion Factory
- Demos de templates e packs
- Tips & Tricks de AE/Premiere
- Conteudo sobre tendencias de motion design

**Blog:** https://pixflow.net/blog/
- Artigos sobre tecnicas, tendencias, guias de plugins

**Motion Factory Classic (plugin gratuito AE):**
- Contem tutoriais embutidos no workflow
- Builders: Particle Builder, ActionFX Builder, Type Builder, HUD Builder, Glitch Builder
- Link: https://pixflow.net/product/motion-factory-classic/

---

### 3. Onde aprender a REPRODUZIR esses efeitos (recursos externos)

**Cursos e canais de referencia:**

| Recurso | Foco | Link |
|---|---|---|
| School of Motion | Curso completo de motion design, After Effects, Cinema 4D | https://www.schoolofmotion.com/courses |
| Ben Marriott | Parallax, depth, UI animation, textura — cursos pagos e YouTube | https://www.benmarriott.com/courses |
| Motion Design School | Motion Practice com Ben Marriott, cursos acessiveis | https://motiondesign.school/courses/motion-practice-with-ben-marriott/ |
| ECAbrams (Video Copilot) | VFX, compositing, particles, shaders em AE | https://www.videocopilot.net/ |
| Codrops | Tutoriais WebGL, shaders, efeitos interativos web | https://tympanus.net/codrops/ |
| Awwwards / Shadertoy | Colecoes de shaders e inspiracao tecnica | https://www.shadertoy.com / https://www.awwwards.com |
| GL Transitions | Biblioteca aberta de transicoes GLSL | https://gl-transitions.com/ |
| naughtyduk/glitchGL | Biblioteca WebGL de glitch effects | https://github.com/naughtyduk/glitchGL |
| remotion-templates | Templates Remotion open source (Ken Burns, parallax) | https://www.reactvideoeditor.com/remotion-templates |
| sniklaus/3d-ken-burns | Implementacao PyTorch do Ken Burns 3D em fotos estaticas | https://github.com/sniklaus/3d-ken-burns |
| DepthFlow (BrokenSource) | Parallax 2.5D open source, usa depth maps, ComfyUI | https://github.com/BrokenSource/DepthFlow |
| MiDaS (isl-org) | Estimativa de profundidade monocular — base do parallax 2.5D | https://github.com/isl-org/MiDaS |

---

### 4. Alternativas gratuitas / open-source aos assets do PixFlow

| Plataforma | O que oferece gratuitamente |
|---|---|
| **Mixkit** (Envato) | Light leaks 4K, overlays, transitions, templates AE/PR/FCPX — sem watermark, sem conta | https://mixkit.co |
| **Motion Array** | LUTs, light leaks, transitions, presets — tier gratuito amplo | https://motionarray.com |
| **Pexels / Videvo** | Stock video, overlays, textures — royalty-free | https://pexels.com / https://videvo.net |
| **ResourceBoy** | 250+ light leak overlays 8K — download gratuito | https://resourceboy.com |
| **Video Copilot** | 15 clipes de particulas 720p gratuitos | https://www.videocopilot.net |
| **Enchanted Media** | Light leaks overlay gratuito | https://www.enchanted.media |
| **Synfig** | Ferramenta open-source de motion graphics (tipo AE basico) | https://www.synfig.org |
| **OpenMontage** | Sistema agente open-source: Ken Burns, particulas, pipeline completo | https://github.com/calesthio/OpenMontage |
| **grained.js** | Grain/noise animado em CSS/JS | https://github.com/sarathsaleem/grained |
| **GL Transitions** | Transicoes GLSL abertas (zoom blur, glitch, dissolve, etc.) | https://gl-transitions.com |
| **DepthFlow** | Parallax 2.5D open source — alternativa ao ImmersityAI/PixFlow Parallax | https://github.com/BrokenSource/DepthFlow |

---

## PARTE B — As Tecnicas por Tras dos Efeitos

### 1. Parallax 2.5D a partir de Foto Estatica

**O que e:** Transformar uma foto plana em uma cena com profundidade simulada, onde o "camera move" revela paralaxe entre planos de distancia diferente.

**Como funciona (pipeline completo):**

1. **Estimativa de depth map** — modelo monocular (MiDaS, Depth-Anything, ZoeDepth) analisa a imagem e gera um mapa em escala de cinza onde branco = proximo, preto = longe.
2. **Segmentacao / separacao de camadas** — manualmente (Photoshop) ou por segmentacao semantica (SAM, remove.bg), separa-se sujeito, meio-campo, fundo, com inpainting para preencher areas ocluidas.
3. **Deslocamento por depth** — cada pixel e deslocado em UV space proporcional ao seu valor de profundidade e ao vetor de movimento da camera simulada.
4. **Camera move** — translacao (parallax lateral), dolly (zoom + parallax), orbita circular, etc.
5. **Pos-processamento** — vignette, depth of field (blur nos extremos de profundidade), lens distortion.

**Tecnologias para reproduzir em codigo:**

| Camada | Tecnologia | Detalhes |
|---|---|---|
| Depth estimation | Python / PyTorch | `torch.hub.load("intel-isl/MiDaS", "DPT_Large")` — HuggingFace Space disponivel |
| 2.5D render | **DepthFlow** (Python/GLSL) | Shader GLSL customizado, roda no terminal, exporta video. Suporta ComfyUI. |
| Web interativo | **Three.js + GLSL** | Textura da imagem + textura do depth map; fragment shader desloca UVs: `uv += depthValue * cameraOffset` |
| Web simples | Canvas 2D + JS | Multiplas camadas PNG animadas com `translate()` em velocidades diferentes por profundidade |
| Video programatico | **Remotion (React)** | Template "Parallax Pan" disponivel: `interpolate(frame, [0, 120], [0, -40])` em cada camada |
| Pipeline completo | Python + FFmpeg | MiDaS → frame sequence → FFmpeg video; ou PyTorch + OpenCV render direto |

**Referencias:**
- https://github.com/BrokenSource/DepthFlow
- https://github.com/sniklaus/3d-ken-burns
- https://github.com/isl-org/MiDaS
- https://tympanus.net/codrops/2025/03/31/webgpu-scanning-effect-with-depth-maps/
- https://v2.scrollsequence.com/converting-2d-images-to-fake-3d-immersive-content/

---

### 2. Transicoes (Glitch, RGB Split, Zoom Blur, Whip Pan, Light Leaks)

#### 2a. Glitch / Digital Corruption

**Tecnica:** Divisao da imagem em slices horizontais aleatorios deslocados em X/Y com timing randomizado; aberracao cromatica (RGB split) aplicada simultaneamente.

**Codigo (GLSL fragment shader):**
```glsl
vec2 uv = vUv;
float glitchAmount = 0.05;
float offset = random(floor(uv.y * 20.0) + time) * glitchAmount;
uv.x += offset;
vec4 r = texture2D(tex, uv + vec2(0.01, 0.0));
vec4 g = texture2D(tex, uv);
vec4 b = texture2D(tex, uv - vec2(0.01, 0.0));
gl_FragColor = vec4(r.r, g.g, b.b, 1.0);
```

**Tecnologias:**
- WebGL + GLSL (Three.js como wrapper): biblioteca `glitchGL` — https://github.com/naughtyduk/glitchGL
- CSS puro: `filter: hue-rotate()` + `transform: translateX()` animado com `@keyframes` e `steps()`
- After Effects / Premiere: Motion Factory Glitch Builder (gratuito)
- GL Transitions: transicao `glitch` incluida — https://gl-transitions.com/

#### 2b. RGB Split (Aberracao Cromatica)

**Tecnica:** Amostragem da textura em 3 coordenadas UV ligeiramente deslocadas para R, G e B separadamente.

```glsl
float spread = 0.008 * intensity;
float r = texture2D(tex, uv + vec2(spread, 0.0)).r;
float g = texture2D(tex, uv).g;
float b = texture2D(tex, uv - vec2(spread, 0.0)).b;
gl_FragColor = vec4(r, g, b, 1.0);
```

**Tecnologias:** GLSL / Three.js / PixiJS (filtro nativo `ColorMatrixFilter`). Em CSS: `text-shadow` com offsets em vermelho e azul.

#### 2c. Zoom Blur (Radial Blur)

**Tecnica:** Acumula N amostras da textura ao longo de um vetor radial a partir do centro, com peso decrescente.

```glsl
// Shadertoy reference: https://www.shadertoy.com/view/Ml3XR2
vec2 dir = uv - vec2(0.5);
float strength = 0.02;
vec4 color = vec4(0.0);
for(int i = 0; i < 16; i++) {
    float t = float(i) / 16.0;
    color += texture2D(tex, uv - dir * strength * t);
}
gl_FragColor = color / 16.0;
```

**Tecnologias:** GLSL (Shadertoy, Three.js), CSS `filter: blur()` com `transform: scale()` animado (aproximacao grosseira).

#### 2d. Whip Pan

**Tecnica:** Motion blur direcional horizontal intenso. Em video: keyframe de posicao com curva de easing agressiva + motion blur de camera. Em shader: blur linear na direcao X.

**Tecnologias:** Remotion (`spring()` + `blur` CSS filter), Three.js (motion blur por acumulacao de frames), FFmpeg (`minterpolate` + `tblend`).

#### 2e. Light Leaks (como overlay de video)

**Tecnica:** Overlay de clip de luz (flare/leak gravado ou gerado) em modo de blending Screen ou Add sobre o footage principal.

**Em codigo:**
- CSS: `mix-blend-mode: screen` em elemento `<video>` ou `<img>` sobreposto
- WebGL: `gl_FragColor = base + leak * leakIntensity` (blend aditivo)
- FFmpeg: `ffmpeg -i footage.mp4 -i leak.mp4 -filter_complex "[0][1]blend=all_mode=screen" out.mp4`

**Assets gratuitos:** Mixkit (50+ clips 4K), ResourceBoy (250 overlays 8K), Enchanted Media.

---

### 3. Particulas e Elementos (Poeira, Fumaca, Faiscas, Bokeh)

**Tecnica geral:** Sistema de particulas — cada particula tem posicao, velocidade, vida, tamanho, opacidade. Atualiza em loop, renderiza como sprite ou ponto.

#### Implementacao em codigo:

**Canvas 2D (simples):**
```javascript
particles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.life -= 0.01;
    ctx.globalAlpha = p.life;
    ctx.drawImage(dustSprite, p.x, p.y, p.size, p.size);
});
```

**WebGL / Three.js (performatico):**
```javascript
// THREE.Points com BufferGeometry
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const material = new THREE.PointsMaterial({ map: dustTexture, blending: THREE.AdditiveBlending, transparent: true });
scene.add(new THREE.Points(geometry, material));
```

**Efeitos especificos:**
- **Poeira / Sand:** particulas pequenas, movimento browniano suave, opacidade baixa, sprite circular com blur
- **Fumaca:** particulas grandes (sprites de textura organica), blending Screen, expansao ao longo da vida
- **Faiscas:** velocidade alta, trail (rastro via canvas `shadowBlur` ou linhas), gravidade, fade rapido
- **Bokeh:** sprites circulares grandes em modo additive blending, simulam pontos de luz desfocados

**Ferramentas:** Three.js, PixiJS (GPU particles), tsParticles (JS puro), After Effects Particle Builder (PixFlow gratuito), Lottie (para animacoes pre-renderizadas).

---

### 4. Light Leaks / Overlays / Grain de Filme

#### Grain de Filme

**Tecnica:** Ruido procedural (Perlin noise ou simplex noise) gerado por frame com seed variavel no tempo, sobreposto com blending Screen ou Overlay em baixa opacidade.

**CSS (mais simples):**
```css
.grain::after {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url('noise.png'); /* PNG de ruido tileavel */
    opacity: 0.08;
    animation: grain 0.3s steps(1) infinite;
}
@keyframes grain {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(-5%, 10%); }
    50% { transform: translate(10%, -5%); }
    75% { transform: translate(-8%, -10%); }
}
```

**GLSL (mais autentico):**
```glsl
float noise = fract(sin(dot(uv + time, vec2(12.9898, 78.233))) * 43758.5453);
gl_FragColor = mix(color, vec4(noise), grainStrength);
```

**Bibliotecas:** grained.js (CSS/JS), p5.grain, Pixlated Web Components.

#### Overlays / Textures (Sujeira de Lente, Vinheta)

**Vinheta GLSL:**
```glsl
float vignette = 1.0 - smoothstep(0.4, 1.0, length(uv - 0.5) * 1.5);
gl_FragColor.rgb *= vignette;
```

---

### 5. Ken Burns / Camera Moves Cinematograficos

**O que e:** Pan + zoom suave em imagem estatica para simular camera em movimento. Criado por Ken Burns em documentarios.

**Mecanismo:**
- Anima `scale` de 1.0 → 1.1 (zoom in) e `translateX/Y` simultaneamente
- Curva de easing: ease-in-out ou cubic-bezier suave

**CSS puro:**
```css
.ken-burns {
    animation: kb 8s ease-in-out infinite alternate;
}
@keyframes kb {
    from { transform: scale(1) translate(0, 0); }
    to   { transform: scale(1.15) translate(-3%, -2%); }
}
```

**Remotion (React):**
```jsx
const scale = interpolate(frame, [0, durationInFrames], [1, 1.15], { easing: Easing.inOut(Easing.ease) });
const x = interpolate(frame, [0, durationInFrames], [0, -30]);
// Aplicar via style={{ transform: `scale(${scale}) translateX(${x}px)` }}
```

**3D Ken Burns (com paralaxe real):**
- Usa depth map para deslocar camadas com velocidades diferentes
- `sniklaus/3d-ken-burns`: implementacao PyTorch completa
- DepthFlow: versao interativa com GPU

**Referencias:**
- https://www.reactvideoeditor.com/remotion-templates/ken-burns
- https://github.com/sniklaus/3d-ken-burns

---

### 6. Displacement / Distorcao / Turbulencia

**Tecnica:** Usa uma textura de ruido (ou flow field) para deslocar as coordenadas UV da textura principal antes de amostrar.

**GLSL:**
```glsl
vec2 distortion = texture2D(noiseTex, uv * 2.0 + time * 0.1).rg;
distortion = (distortion - 0.5) * displacementStrength;
vec4 color = texture2D(mainTex, uv + distortion);
```

**Variantes:**
- **Turbulencia de ar/calor:** noise de baixa frequencia, movimento lento
- **Onda liquida:** sin/cos modulado no tempo
- **Distorcao de entrada:** displacement forte no inicio de uma transicao, reduzindo a zero

**Tecnologias:** GLSL (Shadertoy), Three.js `DisplacementMap`, PixiJS `DisplacementFilter`, CSS `backdrop-filter: blur()` (aproximacao), SVG `feTurbulence` + `feDisplacementMap` (nativo no browser):

```svg
<filter id="turbulence">
  <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" />
  <feDisplacementMap in="SourceGraphic" scale="20" />
</filter>
```

---

### 7. Text Animation Cinematografico

**Tecnicas principais:**

| Efeito | Mecanismo | Tecnologia |
|---|---|---|
| Reveal por linha | Clip-path animado: `inset(0 100% 0 0)` → `inset(0 0% 0 0)` | CSS / GSAP |
| Character stagger | Split em `<span>` por letra, stagger de `opacity + translateY` | GSAP SplitText |
| Blur reveal | `filter: blur(20px) → blur(0)` + `opacity: 0 → 1` | CSS / GSAP |
| Kinetic typography | Posicao/escala/rotacao animadas por frame | Remotion, AE |
| Glitch text | Pseudo-elementos deslocados com `clip-path` alternando por frame | CSS `@keyframes steps()` |
| 3D extrude reveal | Mesh de texto em Three.js com camera dolly | Three.js `TextGeometry` |

**Fluxo GSAP (mais usado em web):**
```javascript
gsap.from(".char", {
    opacity: 0,
    filter: "blur(10px)",
    y: 30,
    stagger: 0.05,
    duration: 0.8,
    ease: "power3.out"
});
```

**Referencias:**
- https://gsap.com/text/
- https://www.annnimate.com/blog/gsap-text-animation-splittext-guide

---

### 8. Color Grading / LUTs Cinematograficos

**O que e:** LUT (Look-Up Table) e uma funcao que mapeia cada cor de entrada para uma cor de saida, definindo o "look" cinematografico (tons frios, vintage, teal-and-orange, etc.).

**Tipos:**
- **1D LUT:** ajuste de curvas por canal (brilho, contraste)
- **3D LUT:** mapeamento volumetrico RGB → RGB (mais poderoso, padrao em cinema)

**Implementacao WebGL (Three.js):**
```javascript
import { LUTPass } from 'three/addons/postprocessing/LUTPass.js';
// Carrega .cube ou .png 32x32x32
const lutPass = new LUTPass();
lutPass.lut = lutTexture;
composer.addPass(lutPass);
```

**GLSL puro:**
```glsl
// LUT armazenada como textura 3D 32x32x32
vec3 lutCoord = color.rgb * (31.0 / 32.0) + (0.5 / 32.0);
vec3 graded = texture3D(lutTexture, lutCoord).rgb;
```

**CSS (aproximacao grosseira):**
```css
filter: saturate(1.2) contrast(1.1) sepia(0.15) hue-rotate(-5deg);
```

**LUTs gratuitas:**
- Motion Array: https://motionarray.com
- FILM CRUX: https://www.filmcrux.com/blog/free-film-resources
- No Film School: https://nofilmschool.com/free-film-assets

**Referencias:**
- https://threejsfundamentals.org/threejs/lessons/threejs-post-processing-3dlut.html
- https://blog.frost.kiwi/WebGL-LUTS-made-simple/
- https://www.shadertoy.com/view/4dyBWD

---

### 9. Como "Dar Vida" a uma Imagem Estatica

**Abordagens, da mais simples a mais sofisticada:**

#### Nivel 1 — Ken Burns puro (CSS/JS)
Pan + zoom suave. Sem profundidade real. Facil de implementar.

#### Nivel 2 — Parallax por camadas (Canvas/CSS)
Separar manualmente sujeito e fundo (Photoshop + inpainting). Animar cada camada em velocidades diferentes com base na "profundidade" relativa. Implementavel em CSS puro com `translateX/Y` por camada.

#### Nivel 3 — Parallax por depth map (DepthFlow / WebGL)
Pipeline automatico:
1. Rodar MiDaS ou Depth-Anything na imagem → depth map
2. Shader GLSL usa depth map para deslocar UVs por pixel
3. Camera move suave revela paralaxe realista

```
MiDaS.infer(image) → depth.png
DepthFlow(image, depth, motion="dolly") → video.mp4
```

#### Nivel 4 — Segmentacao + animacao de elementos
- SAM (Segment Anything Model) segmenta elementos individualmente
- Cada elemento recebe animacao propria (cabelo balancando, folhas movendo)
- Tecnica usada em "cinemagraphs" e em ferramentas como Runway, Kaiber, ImmersityAI

#### Nivel 5 — Depth-based 3D warp (Ken Burns 3D)
`sniklaus/3d-ken-burns`: PyTorch, gera novel views verdadeiros com inpainting das areas ocluidas, produz camera moves com paralaxe fisica correta.

**Stack recomendado para implementacao em codigo (sem IA geradora de video):**

```
Depth estimation: Depth-Anything v2 (ONNX, roda no browser via ONNX Runtime Web)
Shader: Three.js + GLSL displacement por depth
Camera move: Remotion (interpolate + spring) ou Three.js camera animation
Compositing: FFmpeg (overlay de grain, light leak, LUT)
Particulas: Three.js Points com blending aditivo
```

---

## Resumo da Stack Tecnica por Objetivo

| Objetivo | Stack recomendada |
|---|---|
| Parallax 2.5D rapido | DepthFlow (Python) + MiDaS |
| Parallax 2.5D no browser | Three.js + GLSL + Depth-Anything ONNX |
| Transicoes video | GL Transitions (GLSL) + FFmpeg |
| Glitch / RGB split web | glitchGL ou GLSL customizado |
| Particulas web | Three.js Points ou tsParticles |
| Grain de filme web | CSS @keyframes + PNG noise ou GLSL |
| LUT color grading web | Three.js LUTPass + arquivo .cube |
| Ken Burns video | Remotion (React) |
| Text cinematico | GSAP SplitText + CSS clip-path |
| Displacement / turbulencia | SVG feTurbulence ou GLSL |
| Pipeline completo video | Remotion + FFmpeg + Python (MiDaS) |

---

## Fontes

- https://pixflow.net/pricing/
- https://pixflow.net/product/motion-factory-classic/
- https://pixflow.net/blog/
- https://www.youtube.com/c/PixFlow
- https://github.com/BrokenSource/DepthFlow
- https://github.com/isl-org/MiDaS
- https://github.com/sniklaus/3d-ken-burns
- https://tympanus.net/codrops/2025/03/31/webgpu-scanning-effect-with-depth-maps/
- https://gl-transitions.com/
- https://github.com/naughtyduk/glitchGL
- https://www.shadertoy.com/view/Ml3XR2
- https://threejsfundamentals.org/threejs/lessons/threejs-post-processing-3dlut.html
- https://blog.frost.kiwi/WebGL-LUTS-made-simple/
- https://www.shadertoy.com/view/4dyBWD
- https://gsap.com/text/
- https://www.annnimate.com/blog/gsap-text-animation-splittext-guide
- https://www.reactvideoeditor.com/remotion-templates/ken-burns
- https://www.reactvideoeditor.com/remotion-templates/parallax-pan
- https://mixkit.co/free-stock-video/light-leak/
- https://motionarray.com/learn/video-effects/free-light-leaks-overlays/
- https://resourceboy.com/textures/light-leak-overlays/
- https://github.com/sarathsaleem/grained
- https://www.schoolofmotion.com/courses
- https://www.benmarriott.com/courses
- https://motiondesign.school/courses/motion-practice-with-ben-marriott/
- https://pypi.org/project/depthflow/
- https://github.com/akatz-ai/ComfyUI-Depthflow-Nodes
- https://v2.scrollsequence.com/converting-2d-images-to-fake-3d-immersive-content/
- https://arxiv.org/html/2502.04299v1
- https://github.com/calesthio/OpenMontage
- https://www.filmcrux.com/blog/free-film-resources
- https://nofilmschool.com/free-film-assets
