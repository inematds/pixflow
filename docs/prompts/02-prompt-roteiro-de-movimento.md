# Template de Roteiro de Movimento + o "Movie Spec"

> Camada: **MOVIMENTO** | Saída: o **movie spec** (YAML/JSON) que a skill executável consome

A imagem-base é estática. O movimento é o que a transforma em filme: **como a
câmera virtual se move sobre os planos do parallax**, **quais efeitos** rodam por
cima (grain, LUT, light leak, partículas, glitch), **quanto dura** cada cena e
**como** ela transiciona para a próxima.

Este documento define:
1. O vocabulário de movimento (câmera, efeitos, transições).
2. Como descrever uma cena em texto.
3. **O schema do movie spec** — o contrato da futura skill.
4. Um exemplo completo de filme curto (3–4 cenas).

---

## 1. Vocabulário de movimento

### 1.1 Movimentos de câmera (parallax 2.5D)

A câmera virtual do Three.js se move sobre os planos extrudados pelo depth map.
Tipos suportados:

| `type` | O que faz | Bom para |
|---|---|---|
| `push_in` | aproxima (dolly in) — parallax revela profundidade | tensão crescente, revelação |
| `pull_out` | afasta (dolly out) — revela contexto | abertura, "uau" de escala |
| `pan` | desliza horizontal | paisagens, varredura |
| `tilt` | desliza vertical | revelar de baixo p/ cima |
| `orbit` | leve arco lateral (parallax forte, fake 3D) | dar volume ao sujeito |
| `ken_burns` | zoom + pan combinados (clássico) | cenas calmas, documental |
| `float` | drift suave e contínuo (idle) | sonho, contemplação |
| `handheld` | micro-tremor orgânico | realismo, tensão |
| `static` | sem movimento de câmera (só efeitos) | impacto, pausa |

Parâmetros comuns: `intensity` (0–1, quanto a câmera anda), `easing`
(`linear`, `easeInOut`, `easeOut`, `spring`), e a direção quando aplicável
(`direction: "left" | "right" | "up" | "down" | "in" | "out"`).

### 1.2 Efeitos (overlays / shaders)

Cada efeito referencia a biblioteca em `docs/efeitos/`. Comuns:

| `effect` | Descrição | Params principais |
|---|---|---|
| `grain` | grão de filme (GLSL noise) | `intensity`, `size` |
| `lut` | grade de cor 3D | `name` (arquivo .cube), `mix` |
| `light_leak` | vazamento de luz (overlay screen) | `name`, `opacity`, `position` |
| `particles` | poeira / embers / neve / bokeh | `kind`, `count`, `speed`, `depth_aware` |
| `glitch` | datamosh / RGB split / digital | `intensity`, `frequency` |
| `vignette` | escurecimento de bordas | `amount` |
| `chromatic_aberration` | franja RGB nas bordas | `amount` |
| `halation` / `bloom` | brilho difuso nas luzes | `threshold`, `intensity` |
| `letterbox` | barras pretas (cinema) | `ratio` (ex.: 2.39) |
| `scanlines` / `crt` | linhas e curvatura CRT | `intensity`, `curvature` |
| `vhs` | tracking, chroma bleed, jitter | `intensity` |
| `bokeh_dof` | desfoque por profundidade animado | `focus_depth`, `amount` |

`depth_aware: true` faz partículas/DOF usarem o depth map (parecem estar
realmente entre os planos).

### 1.3 Transições entre cenas

| `transition` | Descrição |
|---|---|
| `cut` | corte seco |
| `crossfade` / `dissolve` | dissolução |
| `dip_to_black` / `dip_to_white` | escurece/clareia entre cenas |
| `whip_pan` | varredura rápida com motion blur |
| `light_leak_wipe` | transição via estouro de light leak |
| `glitch_cut` | corte com glitch digital |
| `displacement_wipe` | wipe por shader de deslocamento |
| `zoom_blur` | zoom com desfoque radial |

Cada transição tem `duration` (em segundos) e, quando faz sentido, `name`
(qual asset/variante) e `easing`.

---

## 2. Como descrever uma cena em texto (rascunho antes do spec)

Antes de escrever o YAML, vale rascunhar em PT-BR no formato:

```
CENA 1 — [título curto]
  Imagem:    [prompt ou arquivo da imagem-base]
  Look:      [preset, ex.: cinema-dramatico]
  Câmera:    [push_in lento, intensidade média, easeInOut]
  Efeitos:   [grain leve, LUT teal-orange, partículas de poeira]
  Duração:   [6s]
  Transição: [crossfade 1s] → CENA 2
  Áudio:     [trilha ambiente; corte na batida em 5.5s]
```

Esse rascunho vira o movie spec diretamente.

---

## 3. O MOVIE SPEC (contrato da skill executável)

Formato canônico: **YAML** (legível para humanos). A skill aceita YAML ou o
JSON equivalente (mesmas chaves). Este é o **artefato central** do projeto — a
skill lê isto e produz o MP4 sem mais decisões humanas.

### 3.1 Estrutura de alto nível

```
movie spec
├── meta          (título, autor, versão do schema)
├── output        (resolução, fps, codec, aspect)
├── defaults      (look/efeitos herdados por todas as cenas)
├── assets        (imagens-base + depth maps + overlays)
├── audio         (trilha, sfx, beat sync)
└── scenes[]      (lista ordenada de cenas)
     ├── image / depth
     ├── look (preset)
     ├── duration
     ├── camera
     ├── effects[]
     └── transition_out
```

### 3.2 Schema comentado (YAML)

```yaml
# ---- movie.spec.yaml ----
schema: pixflow.movie/v1          # versão do contrato

meta:
  title: "O Último Farol"
  author: "nmaldaner"
  description: "curta contemplativo de 3 cenas"

output:
  resolution: [1920, 1080]        # [w, h] em px
  fps: 30
  aspect: "2.39:1"                # letterbox aplicado se != da resolução
  codec: h264                     # h264 | h265 | prores
  format: mp4                     # mp4 | mov
  filename: "ultimo-farol.mp4"

# herdado por todas as cenas; cada cena pode sobrescrever
defaults:
  look: cinema-dramatico          # ref. a 03-prompt-look-presets.md
  effects:
    - effect: grain
      intensity: 0.25
      size: 1.2
    - effect: letterbox
      ratio: 2.39
    - effect: vignette
      amount: 0.3
  transition_out:                 # transição padrão entre cenas
    transition: crossfade
    duration: 1.0
    easing: easeInOut

# insumos gerados pela cadeia (flux2-klein → Depth-Anything)
assets:
  images:
    cena1_farol:
      file: "img/cena1_farol.png"
      depth: "depth/cena1_farol_depth.png"   # gerado pelo Depth-Anything-V2
      prompt: "a lighthouse on a stormy cliff, ... --ar 2.39:1"  # rastreabilidade
    cena2_barco:
      file: "img/cena2_barco.png"
      depth: "depth/cena2_barco_depth.png"
    cena3_amanhecer:
      file: "img/cena3_amanhecer.png"
      depth: "depth/cena3_amanhecer_depth.png"
  overlays:
    leak_warm: "overlays/light_leak_warm.mov"   # ProRes alpha p/ blend=screen

audio:
  track:
    file: "audio/ambient_drone.mp3"
    gain_db: -3
  beat_sync:
    enabled: false                # se true, skill alinha cortes a beat.json
    beats_file: null
  sfx:
    - file: "sfx/wave_crash.wav"
      at: 4.5                      # segundo do filme

scenes:
  # ---------- CENA 1 ----------
  - id: cena1
    image: cena1_farol            # ref. a assets.images
    look: cinema-dramatico        # sobrescreve defaults.look se quiser
    duration: 7.0                 # segundos
    camera:
      type: push_in
      intensity: 0.4
      direction: in
      easing: easeInOut
    effects:                      # SOMADOS aos defaults.effects
      - effect: lut
        name: "teal_orange.cube"
        mix: 0.8
      - effect: particles
        kind: dust
        count: 400
        speed: 0.2
        depth_aware: true
      - effect: halation
        threshold: 0.7
        intensity: 0.5
    transition_out:               # sobrescreve o default
      transition: dip_to_black
      duration: 1.2

  # ---------- CENA 2 ----------
  - id: cena2
    image: cena2_barco
    duration: 6.0
    camera:
      type: pan
      intensity: 0.5
      direction: right
      easing: linear
    effects:
      - effect: lut
        name: "teal_orange.cube"
        mix: 0.8
      - effect: particles
        kind: sea_spray
        count: 250
        depth_aware: true
    # sem transition_out -> usa defaults (crossfade 1s)

  # ---------- CENA 3 ----------
  - id: cena3
    image: cena3_amanhecer
    duration: 8.0
    camera:
      type: pull_out
      intensity: 0.6
      direction: out
      easing: easeOut
    effects:
      - effect: lut
        name: "warm_sunrise.cube"
        mix: 0.9
      - effect: light_leak
        name: leak_warm
        opacity: 0.4
        position: top_right
      - effect: bloom
        threshold: 0.6
        intensity: 0.7
    transition_out:
      transition: dip_to_white     # encerramento
      duration: 2.0
```

### 3.3 Regras de herança

- `defaults.effects` são aplicados a **todas** as cenas; os `effects` da cena
  são **somados** (não substituem). Para desligar um default numa cena, use
  `effect: <nome>` com `enabled: false`.
- `defaults.look` e `defaults.transition_out` são **sobrescritos** quando a cena
  define o seu.
- Duração total do filme = soma das `duration` das cenas
  − soma das `transition_out.duration` (transições sobrepõem cenas).

### 3.4 Campos obrigatórios mínimos

Uma cena válida precisa apenas de: `id`, `image`, `duration`, `camera.type`.
Tudo o mais cai no `defaults`. Isso mantém specs simples viáveis:

```yaml
schema: pixflow.movie/v1
output: { resolution: [1920,1080], fps: 30, format: mp4, filename: "teste.mp4" }
assets:
  images:
    foto: { file: "foto.png", depth: "foto_depth.png" }
scenes:
  - { id: s1, image: foto, duration: 6, camera: { type: ken_burns } }
```

---

## 4. Exemplo completo — curta de 4 cenas "Cidade que Não Dorme"

Look cyberpunk, ~26s, vertical para Reels.

```yaml
schema: pixflow.movie/v1

meta:
  title: "Cidade que Não Dorme"
  author: "nmaldaner"
  description: "noir cyberpunk vertical, 4 cenas"

output:
  resolution: [1080, 1920]
  fps: 30
  aspect: "9:16"
  codec: h264
  format: mp4
  filename: "cidade-nao-dorme.mp4"

defaults:
  look: sci-fi-cyberpunk
  effects:
    - { effect: grain, intensity: 0.35, size: 1.0 }
    - { effect: chromatic_aberration, amount: 0.15 }
    - { effect: vignette, amount: 0.4 }
  transition_out:
    transition: glitch_cut
    duration: 0.4

assets:
  images:
    alley:    { file: "img/alley.png",    depth: "depth/alley.png" }
    courier:  { file: "img/courier.png",  depth: "depth/courier.png" }
    skyline:  { file: "img/skyline.png",  depth: "depth/skyline.png" }
    eyes:     { file: "img/eyes.png",     depth: "depth/eyes.png" }
  overlays:
    leak_neon: "overlays/light_leak_cyan.mov"

audio:
  track: { file: "audio/synthwave.mp3", gain_db: -2 }
  beat_sync: { enabled: true, beats_file: "audio/synthwave.beats.json" }

scenes:
  - id: s1_alley
    image: alley
    duration: 6.0
    camera: { type: push_in, intensity: 0.4, direction: in, easing: easeInOut }
    effects:
      - { effect: lut, name: "neon_night.cube", mix: 0.9 }
      - { effect: particles, kind: rain, count: 600, speed: 0.6, depth_aware: true }
      - { effect: bloom, threshold: 0.6, intensity: 0.8 }

  - id: s2_courier
    image: courier
    duration: 5.0
    camera: { type: orbit, intensity: 0.5, direction: left, easing: easeInOut }
    effects:
      - { effect: lut, name: "neon_night.cube", mix: 0.9 }
      - { effect: light_leak, name: leak_neon, opacity: 0.35, position: left }
    transition_out: { transition: whip_pan, duration: 0.5 }

  - id: s3_skyline
    image: skyline
    duration: 7.0
    camera: { type: pull_out, intensity: 0.6, direction: out, easing: easeOut }
    effects:
      - { effect: lut, name: "neon_night.cube", mix: 0.9 }
      - { effect: particles, kind: dust, count: 300, depth_aware: true }
      - { effect: scanlines, intensity: 0.2, curvature: 0.05 }
    transition_out: { transition: light_leak_wipe, name: leak_neon, duration: 0.8 }

  - id: s4_eyes
    image: eyes
    duration: 4.0
    camera: { type: static }
    effects:
      - { effect: lut, name: "neon_night.cube", mix: 1.0 }
      - { effect: glitch, intensity: 0.6, frequency: 0.3 }
    transition_out: { transition: dip_to_black, duration: 1.0 }
```

---

## 5. Notas para a futura skill executável

- **Ordem de aplicação dos efeitos** = ordem na lista, de baixo (mais perto da
  imagem) para cima. Convenção sugerida: cor (LUT) → óptica (DOF, aberração,
  halation/bloom) → overlays (light leak, partículas) → textura (grain) →
  enquadramento (letterbox, vignette, scanlines/CRT).
- **Validação:** a skill deve checar que cada `image` referenciada existe em
  `assets.images` e que o `depth` aponta para um arquivo gerado. Sem depth →
  cair para `ken_burns` 2D (degradação graciosa).
- **Determinismo:** seeds de partículas/grain devem vir do `id` da cena para
  render reproduzível.
- **Beat sync:** se `audio.beat_sync.enabled`, ajustar `transition_out.at` /
  cortes para o beat mais próximo do `beats_file`.
