# Cadeia de Producao Recomendada — PixFlow (imagem estatica → video cinematografico)

> Data: 2026-06-07 | Escopo: sem IA generativa de video (sem Runway/Kling/Sora)

---

## 1. Comparativo de Abordagens

### 1.1 Tabela Geral

| Criterio | Remotion | HTML+Puppeteer+FFmpeg (HyperFrames) | Three.js/WebGL+GLSL | FFmpeg Puro | Blender (Python headless) | After Effects |
|---|---|---|---|---|---|---|
| **Parallax 2.5D real** | Limitado (CSS transform) | Limitado (CSS) | EXCELENTE (displacement shader + depth map) | Nao | EXCELENTE (geometry nodes) | Excelente |
| **Particulas / fumaca** | Bom via Canvas/p5 | Bom via Canvas | EXCELENTE (GPU, 1M+ particulas) | Nao | Excelente (Cycles) | Excelente |
| **Light leaks / grain** | Bom (overlay video/CSS) | Bom (overlay) | EXCELENTE (GLSL fragment shader) | Bom (overlay+filtros) | Excelente (compositor) | Excelente |
| **Color grade / LUT** | Limitado (CSS filter) | Limitado | EXCELENTE (GLSL LUT 3D) | Excelente (lut3d filter) | Excelente (compositor) | Excelente |
| **Transicoes cinematograficas** | Muito Bom (interpolacao React) | Bom (GSAP) | Excelente (shader transitions) | Basico (xfade) | Bom | Excelente |
| **Camera moves / Ken Burns** | Bom (interpolacao) | Bom (CSS transform) | EXCELENTE (matriz de camera + parallax) | Funcional (zoompan) | Excelente | Excelente |
| **Sincronia com audio** | Muito Bom (nativo, useCurrentFrame) | Manual / GSAP | Manual (precisa calcular BPM) | Manual (timestamps) | Bom (VSE) | Excelente |
| **Render headless Linux** | Sim (Chrome headless) | Sim (Puppeteer) | Sim (headless-gl OU Puppeteer+Chrome) | Nativo | NATIVO (blender -b) | NAO DISPONIVEL |
| **Velocidade de render** | Media (Chrome, 1 frame/instancia) | Media (idem) | Alta (GPU via headless-gl) | MUITO ALTA | Media-baixa (Cycles pesado) | N/A |
| **Curva de aprendizado** | Baixa (React) | Baixa | Alta (GLSL) | Media | Media | Alta (custo) |
| **Custo** | Open source | Open source | Open source | Open source | Open source | Pago / Windows/Mac |
| **Integracao com pipeline JS** | NATIVA | NATIVA | Nativa | Via child_process | Via subprocess Python | N/A no Linux |

---

### 1.2 Analise por Tecnica-Chave

#### Parallax 2.5D (foto + depth map)

**Melhor ferramenta: Three.js + GLSL displacement shader**

O pipeline e:
1. Depth-Anything-V2 gera depth map (16-bit grayscale) da foto
2. SAM2 segmenta sujeito / camadas se necessario (foreground/midground/background)
3. Shader GLSL lê a imagem original + depth map como texturas
4. Fragment shader aplica offset UV proporcional ao depth × vetor de camera virtual
5. Vertex shader (se usar plane subdividido) pode extrudar geometria para parallax 3D real

Referencia tecnica: a tecnica e identica ao demo Codrops "WebGPU Scanning Effect with Depth Maps" (Marco 2025) e ao paper "3D Ken Burns Effect from a Single Image" (SIGGRAPH 2019, Simon Niklaus), que ja separa depth estimation e view synthesis como passos independentes.

**FFmpeg puro:** `zoompan` faz Ken Burns simples (zoom + pan linear), mas NAO faz parallax real — e tudo 2D flat.

**Blender:** faz parallax 3D real com displacement + camera animation, headless via `blender -b`, mas overhead de setup por cena e alto.

#### Particulas / poeira / fumaca

**Melhor: Three.js (BufferGeometry + ShaderMaterial) ou Blender (Cycles particle system)**

- Three.js: 500k+ particulas em tempo real, render headless via headless-gl ou Puppeteer+Chrome-for-Testing com GPU
- Blender: qualidade cinematografica (volume scatter, smoke sim) mas render lento

#### Light leaks / grain / LUT

**Melhor: GLSL (Three.js) para graos e LUT, sobreposicao de video para light leaks organicos**

- Grain: GLSL noise (simplex ou hash) aplicado no fragment shader, parametrizavel por intensidade e tamanho
- LUT: textura 3D 64x64x64 carregada como `DataTexture3D`, sampling no fragment shader — implementacao identica ao DaVinci Resolve internamente
- Light leaks: arquivos ProRes reais (como os do PixFlow) em modo `screen` ou `add` no compositor — Blender VSE ou FFmpeg `blend=screen` overlay

#### Transicoes cinematograficas

**Melhor: Three.js shaders + Remotion (timing/sequenciamento)**

- Remotion gerencia sequencias, timing, audio sync nativo
- Three.js executa o shader (ink reveal, glitch, displacement wipe) frame a frame
- Combinacao ideal: Remotion como orquestrador, Three.js como motor visual via `<Canvas>` dentro de componente Remotion

#### Camera moves / Ken Burns avancado

**FFmpeg `zoompan`**: funcional para Ken Burns simples. Limitacao: interpolacao linear apenas, sem easing, sem parallax.

**Three.js**: camera virtual com `lerp` / `slerp`, easing customizado, parallax por camada — qualidade cinematografica real.

**Blender**: camera animation curves com bezier — qualidade maxima, mas pipeline mais pesado.

#### Sincronia com audio/musica

**Melhor: Remotion** — `useCurrentFrame()` + `useVideoConfig()` mapeiam diretamente para frames. `getAudioData()` + `visualizeAudio()` permitem beat-sync nativo.

**Alternativa leve**: extrair BPM com `essentia.js` ou Python (`librosa`) antes do render, gerar JSON de timestamps, consumir no pipeline de animacao.

---

## 2. Recomendacao Final

### Stack Principal

```
Depth-Anything-V2 / MiDaS
        ↓ (depth map PNG 16-bit)
SAM2 (segmentacao opcional, foreground/background)
        ↓ (mascaras PNG)
Three.js + GLSL Shaders   ←── motor visual principal
  - displacement parallax (UV offset por depth × camera vector)
  - particulas (BufferGeometry + ShaderMaterial)
  - grain GLSL (simplex noise)
  - LUT 3D (DataTexture3D)
  - light leak overlay (modo screen)
        ↓ (frames PNG/JPEG via Puppeteer ou headless-gl)
FFmpeg
  - encode H.264/H.265/ProRes
  - mix audio
  - filtros residuais (lut3d nativo, eq, loudnorm)
        ↓
MP4 / MOV final
```

**Orquestracao (opcional mas recomendada para projetos complexos):**
Remotion como camada de sequenciamento — gerencia timing, audio sync, composicao de cenas. Three.js roda dentro de `<Canvas>` em componentes Remotion.

### Quando Usar Cada Ferramenta

| Cenario | Ferramenta |
|---|---|
| Prototipo rapido, Ken Burns simples | FFmpeg `zoompan` |
| Ken Burns com easing customizado, sem parallax | Remotion + CSS transform |
| Parallax 2.5D real a partir de foto | Three.js + GLSL + Depth-Anything-V2 |
| Particulas em grande quantidade | Three.js BufferGeometry ShaderMaterial |
| Grain cinematografico + LUT 3D | Three.js GLSL |
| Light leaks organicos (look de pelicula) | Overlay ProRes via FFmpeg blend=screen |
| Sincronia com batida musical | Remotion (useCurrentFrame + beat JSON) |
| Fumaca / volume scatter realista | Blender Cycles (pipeline separado) |
| Batch render CI/CD Linux sem display | headless-gl (Three.js) OU Remotion (Chrome headless shell) |
| Composicao de cenas multiplas com audio | Remotion como orquestrador |

### Modelos Open Source de Apoio

| Modelo | Uso | Integracao |
|---|---|---|
| Depth-Anything-V2 | Gerar depth map de foto | Python script, exporta PNG 16-bit |
| MiDaS v3.1 | Alternativa depth (mais leve) | Python / ONNX |
| SAM2 (Meta) | Segmentar sujeito / camadas | Python, exporta mascaras PNG |
| RVM (Robust Video Matting) | Matting de pessoas em video (v2) | Python, exporta alpha channel |

---

## 3. Diagrama de Pipeline Completo

```
ENTRADA
┌─────────────────────────────────────────────────────┐
│  Foto estatica (JPG/PNG)   ou   Video (v2)          │
└──────────────┬──────────────────────────────────────┘
               │
       ┌───────▼───────┐
       │ Depth-Anything│  → depth_map.png (16-bit grayscale)
       │    V2 / MiDaS │
       └───────┬───────┘
               │ (opcional)
       ┌───────▼───────┐
       │     SAM2      │  → mask_fg.png, mask_bg.png
       │  segmentacao  │
       └───────┬───────┘
               │
ANIMACAO
┌──────────────▼──────────────────────────────────────┐
│              Three.js + GLSL Shaders                 │
│                                                      │
│  ┌─────────────────┐   ┌──────────────────────────┐ │
│  │ Parallax shader │   │ Particle system          │ │
│  │ (UV displacement│   │ (fumaca, poeira, bokeh)  │ │
│  │  por depth map) │   └──────────────────────────┘ │
│  └─────────────────┘                                 │
│  ┌─────────────────┐   ┌──────────────────────────┐ │
│  │ Grain GLSL      │   │ LUT 3D (DataTexture3D)   │ │
│  │ (simplex noise) │   │ + color grade            │ │
│  └─────────────────┘   └──────────────────────────┘ │
│  ┌─────────────────┐   ┌──────────────────────────┐ │
│  │ Light leak      │   │ Camera virtual           │ │
│  │ (overlay screen)│   │ (lerp/slerp + easing)    │ │
│  └─────────────────┘   └──────────────────────────┘ │
└──────────────┬──────────────────────────────────────┘
               │ (Remotion como orquestrador opcional)
               │ gerencia timing, sequencias, audio sync
               │
CAPTURA DE FRAMES
┌──────────────▼──────────────────────────────────────┐
│  headless-gl (GPU, rapido)                           │
│  OU Puppeteer + Chrome-for-Testing (mais compativel) │
│  → frames PNG sequenciais                            │
└──────────────┬──────────────────────────────────────┘
               │
AUDIO
┌──────────────▼──────────────────────────────────────┐
│  librosa / essentia.js                               │
│  → BPM, beat timestamps, loudness normalization      │
└──────────────┬──────────────────────────────────────┘
               │
ENCODE FINAL
┌──────────────▼──────────────────────────────────────┐
│  FFmpeg                                              │
│  - encode: libx264 (h264) / libx265 / prores_ks     │
│  - audio mix: aac / flac                            │
│  - filtros residuais: lut3d, eq, loudnorm            │
│  - overlays: light leaks ProRes (blend=screen)       │
└──────────────┬──────────────────────────────────────┘
               │
SAIDA
┌──────────────▼──────────────────────────────────────┐
│  MP4 / MOV (H.264, H.265, ProRes)                   │
│  Pronto para publicacao ou composicao adicional      │
└─────────────────────────────────────────────────────┘
```

---

## 4. Limitacoes e Notas

- **After Effects no Linux**: inviavel. Nao existe versao nativa. Wine/Crossover tem suporte parcial mas instavel para render programatico.
- **Blender headless**: totalmente viavel (`blender -b scene.blend --render-output //frames/ -f 1`), mas overhead de setup por cena e alto para automacao em lote. Melhor reservado para efeitos volumetricos (fumaca, fogo) que Three.js nao atinge com qualidade equivalente.
- **GPU no headless Chrome**: em servidores sem GPU fisica, usar `--disable-gpu` e renderizar CPU. Com GPU (mesmo integrada), usar `Chrome for Testing` com flags `--use-gl=egl`. Em bare metal Linux com NVIDIA: `headless-gl` e a opcao mais rapida.
- **Depth-Anything-V2 vs MiDaS**: Depth-Anything-V2 produz mapas mais suaves e consistentes para rostos e cenas complexas. MiDaS v3.1 Large ainda e competitivo e tem inferencia ONNX mais simples. Para producao em lote, ONNX runtime e preferivel.
- **v2 (video como entrada)**: RVM (Robust Video Matting) extrai alpha de pessoa em video sem chroma key. Depth em video: Depth-Anything-V2 Video mode processa frame a frame com consistencia temporal.

---

## 5. Referencias

- [Remotion GPU docs](https://www.remotion.dev/docs/gpu)
- [Remotion Performance Tips](https://www.remotion.dev/docs/performance)
- [HyperFrames (HeyGen) — HTML to MP4](https://www.creativeainews.com/blog/heygen-hyperframes-html-to-video-ai-agents/)
- [Codrops — WebGPU Depth Map Scanning Effect](https://tympanus.net/codrops/2025/03/31/webgpu-scanning-effect-with-depth-maps/)
- [Codrops — Fake 3D WebGL depth map](https://tympanus.net/codrops/2019/02/20/how-to-create-a-fake-3d-image-effect-with-webgl/)
- [Simon Niklaus — 3D Ken Burns from Single Image](https://sniklaus.com/kenburns)
- [GitHub sniklaus/3d-ken-burns](https://github.com/sniklaus/3d-ken-burns)
- [FFmpeg Ken Burns / zoompan](https://hadna.space/en/notes/11-ffmpeg-ken-burns-effect-zoom-pan)
- [Blender CLI automation](https://renderday.com/blog/mastering-the-blender-cli)
- [Three.js headless-gl rendering](https://discourse.threejs.org/t/headless-rendering/14401)
- [GPU-accelerated headless Chromium (Kubernetes)](https://medium.com/musixmatch-blog/gpu-accelerated-headless-chromium-on-kubernetes-a-practical-guide-b4171c72e87e)
- [BrandLens — FFmpeg + WebGL + Shaders pipeline](https://brandlens.io/blog/beyond-ios-26-and-webgpu-how-we-use-ffmpeg-webgl-and-shaders-to-power-brandlens-video/)
