# Padrões de Prompt — PixFlow (imagem estática → filme animado)

> Data: 2026-06-07 | Escopo: pipeline em código (sem gerador de vídeo IA)
> Modelo de imagem padrão: **flux2-klein**

---

## 1. Para que serve esta pasta

`docs/prompts/` padroniza **COMO descrever e gerar os insumos** de um filme
construído a partir de imagens estáticas animadas em código (estilo PixFlow:
parallax 2.5D + efeitos GLSL + timeline, sem Runway/Kling/Sora).

A cadeia técnica (ver `docs/research/03-cadeia-recomendada.md`):

```
imagem (flux2-klein)
   → depth map (Depth-Anything-V2)
   → parallax 2.5D + efeitos (Three.js / GLSL)
   → timeline (Remotion)
   → MP4 (FFmpeg)
```

O elo mais frágil é o **primeiro**: se a imagem-base não tiver separação clara
de planos (foreground / midground / background) e profundidade legível, o depth
map fica "chapado" e o parallax 2.5D não tem o que mover. Por isso o prompt da
imagem é tão importante quanto o código de animação.

---

## 2. A lógica dos padrões (ordem de uso)

Pense em três camadas, sempre nesta ordem:

```
CENA          →   IMAGEM             →   MOVIMENTO
(o quê/onde)      (o pixel-base)         (como anima)
```

1. **CENA** — a ideia narrativa: qual história, quantos planos, que clima.
   Definida no macro-template (`04-prompt-filme-completo.md`).

2. **IMAGEM** — o prompt para o flux2-klein gerar cada plano da cena de forma
   que **anime bem em parallax** (profundidade clara, camadas separadas).
   Template em `01-prompt-imagem-base.md`.

3. **MOVIMENTO** — o "roteiro de movimento" de cada cena: câmera (push-in,
   dolly, orbit, Ken Burns), efeitos (grain, LUT, light leak, partículas,
   glitch), duração e transição. Formato estruturado (o **movie spec**) em
   `02-prompt-roteiro-de-movimento.md`.

Os **presets de look** (`03-prompt-look-presets.md`) amarram as três camadas:
cada preset já traz o estilo de prompt de imagem + a grade de cor + os efeitos +
o estilo de câmera, para você não reinventar a roda a cada cena.

---

## 3. Mapa dos arquivos

| Arquivo | Camada | O que entrega |
|---|---|---|
| `00-INDEX.md` | — | Este guia: lógica e ordem de uso |
| `01-prompt-imagem-base.md` | IMAGEM | Template de prompt p/ flux2-klein + 6 exemplos por look |
| `02-prompt-roteiro-de-movimento.md` | MOVIMENTO | Template de movimento + o **movie spec** (YAML/JSON) |
| `03-prompt-look-presets.md` | CENA↔IMAGEM↔MOVIMENTO | Catálogo de presets de look ligados aos efeitos |
| `04-prompt-filme-completo.md` | CENA | Meta-prompt: da ideia → cenas → imagens → movimento |

---

## 4. O contrato: o "movie spec"

O artefato central que conecta tudo é o **movie spec** — um arquivo
YAML/JSON que descreve o filme inteiro (cenas, imagens, câmera, efeitos,
transições, áudio). Ele é a **interface da futura skill executável**: a skill
lê o movie spec e dirige a cadeia (flux2-klein → depth → Three.js → Remotion →
FFmpeg) sem precisar de mais decisões humanas.

Definição completa do schema em `02-prompt-roteiro-de-movimento.md` §3.

---

## 5. Fluxo de trabalho recomendado

```
1. Ideia do filme            → 04-prompt-filme-completo.md  (meta-prompt)
2. Escolhe um preset de look → 03-prompt-look-presets.md
3. Gera prompts de imagem    → 01-prompt-imagem-base.md     (1 por cena/plano)
4. Roda flux2-klein          → imagens-base
5. Escreve o movie spec      → 02-prompt-roteiro-de-movimento.md  (YAML/JSON)
6. (futuro) Skill executável → lê o spec → renderiza o MP4
```

---

## 6. Convenções

- **Idioma dos prompts de imagem:** inglês (modelos de difusão respondem
  melhor). Explicações e specs em PT-BR.
- **Aspect ratio padrão de cinema:** `16:9` (2.39:1 com letterbox para look
  anamórfico). Vertical `9:16` para Shorts/Reels.
- **Resolução-base da imagem:** gere no maior lado possível do flux2-klein e
  faça upscale antes do depth map — parallax revela bordas, então sobra de
  resolução evita serrilhado nas margens reveladas.
- **Biblioteca de efeitos:** os efeitos citados nos presets vivem (ou viverão)
  em `docs/efeitos/` — grain, LUT, light leak, partículas, glitch, vignette,
  letterbox, halation, chromatic aberration, scanlines/CRT, VHS.
