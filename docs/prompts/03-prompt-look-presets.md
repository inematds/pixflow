# Catálogo de Presets de Look

> Liga as três camadas (imagem + grade + efeitos + câmera) num pacote único.

Um **preset de look** é um atalho: em vez de decidir prompt, LUT, grain,
overlays e estilo de câmera a cada cena, você escolhe um preset e tudo vem
amarrado. Cada preset abaixo define:

- **Prompt de imagem recomendado** → reusa os blocos de `01-prompt-imagem-base.md`.
- **Grade / LUT** → arquivo `.cube` sugerido (vive em `docs/efeitos/lut/`).
- **Grain** → intensidade/tamanho.
- **Partículas / overlays** → efeitos de `docs/efeitos/`.
- **Estilo de câmera** → defaults de movimento (ver `02-prompt-roteiro-de-movimento.md`).

No movie spec, use `look: <id-do-preset>`. Os campos do preset preenchem os
`defaults` da cena, que você ainda pode sobrescrever.

> Os efeitos citados referenciam a biblioteca em **`docs/efeitos/`**:
> `grain`, `lut`, `light_leak`, `particles`, `glitch`, `vignette`,
> `chromatic_aberration`, `halation`/`bloom`, `letterbox`, `scanlines`/`crt`,
> `vhs`, `bokeh_dof`.

---

## Índice de presets

| `look` (id) | Vibe | LUT base | Câmera típica |
|---|---|---|---|
| `cinema-dramatico` | filme premiado, sóbrio | `teal_orange.cube` | push_in / pull_out lento |
| `retro-vhs` | fita VHS / CRT anos 80 | `vhs_faded.cube` | ken_burns + handheld |
| `sci-fi-cyberpunk` | neon, chuva, HUD | `neon_night.cube` | orbit / push_in |
| `sonho-etereo` | onírico, suave, bloom | `pastel_dream.cube` | float / pull_out |
| `noir` | preto-e-branco contrastado | `noir_bw.cube` | static / slow pan |
| `acao-epico` | grandioso, quente, fumaça | `warm_epic.cube` | push_in / whip |

---

## 1. `cinema-dramatico`

**Vibe:** look de cinema sóbrio, contraste controlado, pele natural, teal nas
sombras e laranja nos médios. O "default seguro".

**Prompt de imagem (base):** use o exemplo 6.1 de `01-prompt-imagem-base.md`.
Modificadores-chave: `anamorphic cinematic film still`, `shallow depth of field`,
`atmospheric haze`, `--ar 2.39:1`.

**Bloco de preset (cole em `defaults` ou aplique por cena):**

```yaml
look: cinema-dramatico
effects:
  - { effect: lut, name: "teal_orange.cube", mix: 0.8 }
  - { effect: grain, intensity: 0.25, size: 1.2 }
  - { effect: halation, threshold: 0.7, intensity: 0.4 }
  - { effect: letterbox, ratio: 2.39 }
  - { effect: vignette, amount: 0.3 }
camera_default: { type: push_in, intensity: 0.4, easing: easeInOut }
```

Partículas opcionais: `dust` (count ~300, `depth_aware: true`).

---

## 2. `retro-vhs`

**Vibe:** fita VHS gasta — chroma bleed, jitter de tracking, scanlines, cores
lavadas magenta/teal. Inspirado nos plugins **PX-VHS / PX-CRT** do PixFlow.

**Prompt de imagem (base):** exemplo 6.2 de `01-prompt-imagem-base.md`.
Modificadores: `grainy retro film still`, `washed-out 1985 palette`,
`vintage zoom lens`, `--ar 4:3`.

```yaml
look: retro-vhs
effects:
  - { effect: lut, name: "vhs_faded.cube", mix: 0.85 }
  - { effect: vhs, intensity: 0.6 }
  - { effect: scanlines, intensity: 0.35, curvature: 0.08 }   # toque CRT
  - { effect: chromatic_aberration, amount: 0.25 }
  - { effect: grain, intensity: 0.45, size: 1.5 }
  - { effect: vignette, amount: 0.45 }
camera_default: { type: ken_burns, intensity: 0.35, easing: linear }
```

Câmera: combine `ken_burns` com micro `handheld` para parecer fita amadora.
Transição típica: `glitch_cut` ou `dip_to_black`.

---

## 3. `sci-fi-cyberpunk`

**Vibe:** noite neon, chuva, smog, HUD. Ciano + magenta, bloom forte, aberração.
Inspirado nos packs HUD / cyberpunk do PixFlow.

**Prompt de imagem (base):** exemplo 6.3 de `01-prompt-imagem-base.md`.
Modificadores: `volumetric neon glow`, `rain haze`, `holographic ads`,
`electric teal and hot-magenta`, `--ar 16:9` (ou `9:16` p/ Reels).

```yaml
look: sci-fi-cyberpunk
effects:
  - { effect: lut, name: "neon_night.cube", mix: 0.9 }
  - { effect: bloom, threshold: 0.6, intensity: 0.8 }
  - { effect: chromatic_aberration, amount: 0.2 }
  - { effect: particles, kind: rain, count: 600, speed: 0.6, depth_aware: true }
  - { effect: grain, intensity: 0.35, size: 1.0 }
  - { effect: vignette, amount: 0.4 }
camera_default: { type: orbit, intensity: 0.5, easing: easeInOut }
```

Overlay opcional: `light_leak` ciano (`leak_neon`). Transição típica:
`glitch_cut`, `whip_pan`, `light_leak_wipe`.

---

## 4. `sonho-etereo`

**Vibe:** onírico, soft focus, bloom difuso, partículas brilhantes flutuando,
paleta pastel. Movimento lento e contínuo.

**Prompt de imagem (base):** exemplo 6.4 de `01-prompt-imagem-base.md`.
Modificadores: `dreamy backlight`, `gentle bloom`, `creamy bokeh`,
`floating glowing particles`, `pale pink lavender and cream`, `--ar 16:9`.

```yaml
look: sonho-etereo
effects:
  - { effect: lut, name: "pastel_dream.cube", mix: 0.7 }
  - { effect: bloom, threshold: 0.5, intensity: 0.9 }
  - { effect: bokeh_dof, focus_depth: 0.5, amount: 0.6 }
  - { effect: particles, kind: glow_motes, count: 350, speed: 0.15, depth_aware: true }
  - { effect: grain, intensity: 0.15, size: 0.9 }
  - { effect: vignette, amount: 0.2 }
camera_default: { type: float, intensity: 0.3, easing: easeInOut }
```

Câmera: `float` ou `pull_out` muito lento. Transição típica: `crossfade`
longo (1.5–2s) ou `dip_to_white`.

---

## 5. `noir`

**Vibe:** preto-e-branco de alto contraste, chiaroscuro, fumaça, fog,
sombras de veneziana. Câmera quieta e tensa.

**Prompt de imagem (base):** exemplo 6.6 de `01-prompt-imagem-base.md`.
Modificadores: `high-contrast black and white`, `film-noir`, `deep chiaroscuro`,
`thick rolling fog`, `heavy grain`, `--ar 2.39:1`.

```yaml
look: noir
effects:
  - { effect: lut, name: "noir_bw.cube", mix: 1.0 }     # B&W
  - { effect: grain, intensity: 0.5, size: 1.4 }
  - { effect: halation, threshold: 0.8, intensity: 0.3 }
  - { effect: particles, kind: smoke, count: 200, speed: 0.1, depth_aware: true }
  - { effect: letterbox, ratio: 2.39 }
  - { effect: vignette, amount: 0.55 }
camera_default: { type: static, intensity: 0.0 }
```

Câmera: `static` ou `pan` muito lento; o drama vem da fumaça e do grain, não do
movimento. Transição típica: `dip_to_black`, `cut` seco.

---

## 6. `acao-epico`

**Vibe:** grandioso, quente, fumaça e embers, god rays, contraste alto.
Inspirado em Action FX Pro do PixFlow (fogo, explosão, fumaça).

**Prompt de imagem (base):** exemplos 6.5 (paisagem) ou 6.7 (ação) de
`01-prompt-imagem-base.md`. Modificadores: `dramatic god rays through smoke`,
`floating embers`, `warm orange and deep teal`, `epic`, `--ar 2.39:1`.

```yaml
look: acao-epico
effects:
  - { effect: lut, name: "warm_epic.cube", mix: 0.85 }
  - { effect: bloom, threshold: 0.65, intensity: 0.7 }
  - { effect: particles, kind: embers, count: 500, speed: 0.4, depth_aware: true }
  - { effect: particles, kind: smoke, count: 250, speed: 0.2, depth_aware: true }
  - { effect: grain, intensity: 0.3, size: 1.1 }
  - { effect: chromatic_aberration, amount: 0.1 }
  - { effect: letterbox, ratio: 2.39 }
  - { effect: vignette, amount: 0.35 }
camera_default: { type: push_in, intensity: 0.6, easing: easeOut }
```

Câmera: `push_in` enérgico ou `whip_pan` nas transições. Transição típica:
`whip_pan`, `zoom_blur`, `light_leak_wipe` quente.

---

## 7. Como criar um preset novo

1. Defina a **paleta** (e o LUT `.cube` correspondente em `docs/efeitos/lut/`).
2. Escolha **2–4 efeitos** que definem a textura (grain + 1 óptico + 1 overlay).
3. Defina o **estilo de câmera** default coerente com a vibe (lento p/
   contemplativo, enérgico p/ ação).
4. Escreva o **bloco de prompt de imagem** seguindo `01-prompt-imagem-base.md`
   (sempre com os 3 planos + névoa/DOF).
5. Registre no índice deste arquivo e dê um `id` curto em kebab-case.
