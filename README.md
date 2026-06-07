# PixFlow → Filmes a partir de imagens estáticas (código aberto, sem IA de vídeo)

Recria a qualidade de efeitos do [PixFlow](https://pixflow.net) em **código aberto**, transformando
**imagens estáticas em vídeos cinematográficos** — parallax 2.5D real, grain, color grade, vinheta,
aberração cromática, bloom, movimentos de câmera e transições — **sem usar geradores de vídeo por IA**
(Runway/Kling/Sora). Todo o movimento é construído programaticamente e o render é determinístico.

> v1: imagem estática → filme. v2: o mesmo motor aceita vídeo no lugar da foto.

## Estrutura

```
docs/                      Base de conhecimento
  00-VISAO-GERAL.md        Doc-mestre (leia primeiro)
  research/                Análise do PixFlow, técnicas, cadeia recomendada, ecossistema
  efeitos/                 Biblioteca de receitas (GLSL/Three.js/Remotion) por efeito
  prompts/                 Padrões de prompt (imagem-base, movie spec, presets de look)
  padroes/                 Padrão geral do ecossistema (OTIO, .cube/ASC CDL, presets)
  screens/                 14 prints reais do pixflow.net
skill/                     Skill executável `pixflow-motion` (instalada via symlink)
examples/                  Movie specs de exemplo + assets
```

## A skill `pixflow-motion`

Pipeline: **movie spec YAML → Depth-Anything-V2 (depth) → WebGL/GLSL (parallax + efeitos) → Remotion → FFmpeg → MP4.**

```bash
cd skill
npm install
node cli/pixflow-motion.mjs check-deps
node cli/pixflow-motion.mjs render ../examples/demo.movie.yaml ../examples/demo.mp4
```

- **Depth sem torch:** roda Depth-Anything-V2-small via transformers.js (onnxruntime).
- **Looks** (donos das intensidades): `cinema-dramatico`, `sci-fi-cyberpunk`, `noir-film`, `retro-vhs`, `sonho-etereo`, `acao-epico`.
- **Câmera:** `push_in`, `pull_out`, `ken_burns`, `pan`, `dolly`, `orbit`, `float`, `handheld`, `static`.
- **Transições:** `cut`, `crossfade`, `dip_to_black`.
- **Legendas:** bloco `caption` por cena (kicker/título/corpo), animadas.

Detalhes e o schema do movie spec: [`skill/SKILL.md`](skill/SKILL.md).

## Ambiente

Testado em **Linux aarch64 (NVIDIA GB10 / DGX)**. Nessa arquitetura o Remotion não baixa o Chrome
sozinho — a CLI reusa um Chromium do Playwright automaticamente (ou defina `PIXFLOW_CHROME`).

## Ecossistema

`pixflow` é a peça de **render em código aberto**. Complementa `mdd` (direção → IA), `video-plan-editor`
(estratégia/beat sheet) e `promptprof` (refino de prompt). O agente `diretor-ecossistema` decide qual usar.
Comparação em [`docs/research/04-ecossistema.md`](docs/research/04-ecossistema.md); padrão de interoperação em
[`docs/padroes/01-padrao-geral.md`](docs/padroes/01-padrao-geral.md).

## Status

MVP funcional ponta a ponta. Backlog: transições GLSL (glitch/whip/zoom-blur), partículas, light leaks
em overlay, LUT `.cube`, beat-sync, segmentação SAM2, export OTIO.
