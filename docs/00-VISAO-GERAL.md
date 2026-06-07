# PixFlow → Filmes a partir de imagens estáticas (em código aberto)

> **Doc-mestre.** Amarra toda a base de conhecimento deste projeto: o que o PixFlow oferece,
> a cadeia de produção recomendada, e como usar a biblioteca de efeitos + padrões de prompt
> para construir vídeos cinematográficos a partir de imagens estáticas — **sem geradores de vídeo IA**.

---

## 1. Objetivo

Recriar a **qualidade de efeitos do PixFlow** (motion design, transições, grain de filme, glitch,
parallax, color grade cinema) usando **código aberto**, transformando **imagens estáticas em vídeos
completos** com movimento e profundidade reais.

- **v1 — Imagem estática:** foto/render (gerado no `flux2-klein`) → profundidade → parallax 2.5D + efeitos → MP4.
- **v2 — Vídeo:** o mesmo motor aceita textura de vídeo no lugar da foto; os mesmos shaders de efeito,
  grade e transição se aplicam. A arquitetura já nasce pronta pra isso.

**Princípio:** quase tudo que o PixFlow vende é, por baixo, **shader GLSL + overlay + LUT + animação de
câmera**. Logo, é reproduzível em código, sem assinatura e sem gerador de vídeo.

---

## 2. O que o PixFlow é (resumo)

Três negócios em um, vendidos por assinatura ($15–30/mês). Detalhe em [`research/01-catalogo-pixflow.md`](research/01-catalogo-pixflow.md).

| Bloco | O que entrega | Nosso equivalente em código |
|---|---|---|
| **Stock Templates** | Transições, títulos, logo reveals, HUDs, overlays VFX, +1.000 LUTs 3D, SFX | `efeitos/` (GLSL/Three.js) + LUTs grátis |
| **Gen AI** | AI VibeFX, AI Voiceover, AI SFX | fora de escopo (usamos TTS/SFX próprios) |
| **Plugins Adobe** | Motion Factory, PX-VHS, PX-CRT, PX-Glitch, TypeToon | `efeitos/07` (VHS/CRT), `02` (glitch), `06` (texto) |

**Estilo visual deles:** retrô/analógico (VHS, CRT, film grain), cinematográfico (títulos de filme),
sci-fi/HUD, glitch, tipografia cinética 3D, action VFX. Prints reais em [`screens/`](screens/) (14 telas).

---

## 3. Cadeia de produção recomendada

Decisão técnica completa em [`research/03-cadeia-recomendada.md`](research/03-cadeia-recomendada.md).

```
IMAGEM (flux2-klein)
   ├─ Depth-Anything-V2  → depth map (PNG 16-bit)   ← dá o parallax 2.5D REAL
   └─ SAM2 (opcional)    → segmenta / isola elementos
        ↓
  THREE.JS + GLSL  (motor visual)
   • parallax por displacement de UV (profundidade real)   → efeitos/01
   • câmera cinematográfica (push-in, dolly, orbit, Ken Burns 3D)
   • partículas (poeira / fumaça / bokeh / faíscas)         → efeitos/03
   • transições (glitch, RGB split, zoom blur, whip pan)    → efeitos/02
   • grain de filme + LUT 3D (.cube) = color grade cinema   → efeitos/04
   • light leaks (overlay ProRes via blend screen)          → efeitos/05
   • displacement / turbulência / distorção                 → efeitos/07
   • texto cinematográfico (GSAP / TextGeometry)            → efeitos/06
        ↓
  REMOTION (orquestrador) — timeline, múltiplas cenas, sync com música (librosa → beats JSON)
        ↓
  FFmpeg → MP4 / ProRes final (+ áudio / SFX)
```

**Stack:** Three.js + GLSL (motor) · Depth-Anything-V2 (profundidade) · SAM2 (segmentação) ·
Remotion (timeline) · FFmpeg (encode). **Blender headless** só para fumaça/fogo volumétrico pesado.
**After Effects está fora** (não roda no Linux).

---

## 4. Mapa da base de conhecimento

### `research/` — pesquisa-fonte
- `01-catalogo-pixflow.md` — catálogo completo do site + modelo de negócio.
- `02-tecnicas-e-acesso.md` — como acessar/aprender + técnicas por trás de cada efeito.
- `03-cadeia-recomendada.md` — comparação de stacks e recomendação final.

### `efeitos/` — biblioteca de receitas (com código GLSL/Three.js/Remotion real)
- `00-INDEX.md` — índice: Efeito PixFlow → Técnica → Ferramenta → Dificuldade → Versão.
- `01-parallax-2.5d.md` — **núcleo**: depth map + displacement de UV + camera moves.
- `02-transicoes.md` — glitch, RGB split, zoom blur, whip pan, dissolve, displacement.
- `03-particulas-e-atmosfera.md` — poeira, fumaça, faíscas, bokeh; simular vs overlay.
- `04-grain-luts-colorgrade.md` — grain procedural + LUT 3D .cube (color grade cinema).
- `05-light-leaks-overlays.md` — blend modes, light leaks (WebGL/FFmpeg/CSS), assets grátis.
- `06-text-animation.md` — GSAP SplitText, kinetic typography, texto 3D.
- `07-displacement-distorcao.md` — turbulência, heat haze, water ripple, dream warp, VHS/CRT.

### `prompts/` — padrões de prompt (como descrever e gerar os insumos)
- `00-INDEX.md` — lógica e ordem de uso (CENA → IMAGEM → MOVIMENTO).
- `01-prompt-imagem-base.md` — template flux2-klein p/ imagens que animam bem em parallax + 7 exemplos.
- `02-prompt-roteiro-de-movimento.md` — vocabulário de câmera/efeitos + o **movie spec** (contrato).
- `03-prompt-look-presets.md` — 6 presets de look (cinema, VHS, sci-fi, sonho, noir, ação/épico).
- `04-prompt-filme-completo.md` — meta-prompt: da ideia de filme → cenas → imagens → spec final.

### `screens/` — 14 prints reais do pixflow.net (referência visual).

---

## 5. Fluxo de trabalho (como usar isto hoje)

1. **Ideia → cenas.** Use [`prompts/04-prompt-filme-completo.md`](prompts/04-prompt-filme-completo.md) para decupar a história em cenas.
2. **Escolha o look.** Pegue um preset em [`prompts/03-prompt-look-presets.md`](prompts/03-prompt-look-presets.md).
3. **Gere as imagens.** Use [`prompts/01-prompt-imagem-base.md`](prompts/01-prompt-imagem-base.md) no `flux2-klein` (boa separação de planos!).
4. **Escreva o movie spec.** Formato em [`prompts/02-prompt-roteiro-de-movimento.md`](prompts/02-prompt-roteiro-de-movimento.md) (YAML `pixflow.movie/v1`).
5. **Monte os efeitos.** Use as receitas de [`efeitos/`](efeitos/00-INDEX.md) para cada cena/transição.
   *(Hoje manual; na fase (b) a skill `pixflow-motion` consome o spec e renderiza sozinha.)*

---

## 6. O contrato: `movie spec` (`pixflow.movie/v1`)

A interface entre os padrões de prompt (hoje) e a skill executável (fase b). YAML versionado com:
`meta`, `output`, `defaults` (look + efeitos herdados), `assets` (images com `file`/`depth`/`prompt` + overlays),
`audio` (track + beat_sync + sfx) e `scenes[]` (cada cena: `id`, `image`, `look`, `duration`, `camera`,
`effects[]`, `transition_out`). Detalhe e exemplos em [`prompts/02-prompt-roteiro-de-movimento.md`](prompts/02-prompt-roteiro-de-movimento.md).

---

## 7. Próximo passo — Fase (b): skill executável `pixflow-motion`

Com a base de conhecimento pronta (fase a, **concluída**), a fase (b) constrói a skill que **executa** a cadeia:

- Recebe `movie spec` + imagens → roda Depth-Anything → renderiza Three.js/GLSL → orquestra no Remotion → encoda no FFmpeg.
- Presets de look já mapeados (cinema, VHS, sci-fi, sonho, noir, ação).
- Exige instalar dependências pesadas (Node/Remotion, Python/Depth-Anything, FFmpeg) no ambiente.

> Pendência registrada: iniciar a fase (b) quando o usuário aprovar a base atual.
