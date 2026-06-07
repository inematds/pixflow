---
name: pixflow-motion
description: Transforma IMAGENS ESTÁTICAS em FILMES cinematográficos (parallax 2.5D real + grain/LUT/vinheta/aberração/bloom + movimentos de câmera + transições) em CÓDIGO ABERTO, SEM geradores de vídeo IA. Use SEMPRE que o usuário quiser "transformar imagem em vídeo", "dar movimento a uma foto", "parallax 2.5D", "filme a partir de imagens", "ken burns cinematográfico", "vídeo sem IA / determinístico", ou der uma ou mais imagens (ex.: geradas no flux2-klein) e quiser um vídeo com profundidade e efeitos. Consome um "movie spec" YAML (pixflow.movie/v1). Pipeline: Depth-Anything-V2 (depth) → Three.js/WebGL+GLSL (parallax+efeitos) → Remotion → FFmpeg → MP4.
---

# pixflow-motion

Render determinístico de **imagem estática → filme** com profundidade real e efeitos de cinema, sem IA de vídeo.

## Quando usar
- Há uma ou mais imagens (foto/render, ex.: flux2-klein) e o usuário quer um **vídeo cinematográfico**.
- Pedem **parallax 2.5D**, **Ken Burns**, "dar vida à imagem", "filme de fotos", "sem Runway/Kling/Sora".

## Pré-requisitos (uma vez)
```bash
cd <skill>/   # diretório desta skill
npm install   # remotion + @huggingface/transformers + sharp + js-yaml
node cli/pixflow-motion.mjs check-deps
```
Em **aarch64** (ex.: DGX/GB10) o Remotion não baixa o Chrome sozinho — a CLI reusa um Chromium do
Playwright automaticamente. Para forçar: `export PIXFLOW_CHROME=/caminho/para/chrome`.

## Fluxo de uso
1. **Gere/colete as imagens.** Para bom parallax, use prompts com separação de planos — ver
   `../docs/prompts/01-prompt-imagem-base.md`.
2. **Escreva o movie spec** (YAML `pixflow.movie/v1`). Modelo: `../examples/demo.movie.yaml`.
   Schema e vocabulário: `../docs/prompts/02-prompt-roteiro-de-movimento.md`.
3. **Renderize:**
```bash
node cli/pixflow-motion.mjs render meu-filme.movie.yaml saida.mp4
```
A CLI gera os depth maps faltantes, prepara os assets e renderiza.

## Comandos
```bash
pixflow-motion check-deps                 # verifica node/ffmpeg/remotion/transformers/chromium
pixflow-motion validate <spec.yaml>       # valida campos e arquivos
pixflow-motion summary  <spec.yaml>       # resumo do filme (cenas, look, câmera, duração)
pixflow-motion depth    <img> [out.png]   # só o depth map de uma imagem
pixflow-motion render   <spec.yaml> [out.mp4] [--fast] [--gl=angle|swangle|egl]
```
`--fast` baixa qualidade p/ preview. Se `--gl=angle` falhar, a CLI tenta `swangle` (software) sozinha.

## Movie spec (resumo)
```yaml
schema: pixflow.movie/v1
output: { resolution: 1920x1080, fps: 30, filename: out.mp4 }
defaults:
  look: cinema-dramatico
  transition_out: { type: crossfade, duration: 0.6 }
assets:
  images:
    - { id: cena1, file: assets/cena1.png }
scenes:
  - id: abertura
    image: cena1
    look: cinema-dramatico        # cinema-dramatico | sci-fi-cyberpunk | noir-film | retro-vhs | sonho-etereo | acao-epico
    duration: 4
    camera: { type: push_in, intensity: 1.0, easing: ease_in_out }  # push_in|pull_out|ken_burns|pan|dolly|orbit|float|handheld|static
    duration_mode: flexible       # flexible (default) | locked (beat_sync ignora)
    transition_out: { type: crossfade, duration: 0.6 }              # cut | crossfade | dip_to_black
```
- **Look é dono dos efeitos** (intensidades já no preset). Sobrescreva pontual via `effects:` na cena.
- `direction` (em pan/dolly): left,right,up,down,upleft,…

## Arquitetura
- `cli/pixflow-motion.mjs` — CLI (validate/depth/render…).
- `cli/depth.mjs` — Depth-Anything-V2-small via transformers.js (sem torch).
- `src/shaders.js` — GLSL (parallax + efeitos). `src/ParallaxCanvas.jsx` — motor WebGL.
- `src/camera.js` — movimentos. `src/looks.js` — presets. `src/layout.js` — timeline.
- `src/Movie.jsx` / `Root.jsx` / `index.jsx` — composição Remotion.

## Estado (MVP)
Funciona ponta a ponta: parallax 2.5D + push_in/ken_burns/orbit/etc. + grain/LUT-grade/vinheta/aberração/bloom
+ crossfade/cut/dip_to_black + áudio. Próximos: transições GLSL (glitch/whip/zoom-blur), partículas, light leaks
em overlay, LUT .cube, beat-sync, segmentação SAM2, export OTIO. Ver `../docs/efeitos/` e `../docs/padroes/`.
