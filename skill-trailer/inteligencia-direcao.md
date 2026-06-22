# Inteligência de direção — decupagem → câmera

Como traduzir a descrição de um shot (plano, câmera, velocidade, mood) nos parâmetros do pixflow:
**movimento (`type`) + direção + intensidade + amplitude + duração + look + transição + close (framing)**.
Tudo aqui sai dos primitivos reais do motor (`src/camera.js`, `src/looks.js`, `src/layout.js`).

---

## 1. Primitivos de câmera (cheat sheet)

| type | gesto | bom para |
|---|---|---|
| `static` | parado (com micro-respiração) | olhar direto, peso de uma fala, cartela |
| `push_in` | zoom in suave | **close emocional**, foco crescente |
| `pull_out` | zoom out | revelar contexto, recuar |
| `crash_zoom` | zoom acelerado (p²) | **impacto**, susto, corte rápido |
| `ken_burns` | deriva + leve zoom | foto/paisagem viva |
| `pan` | varre horizontal | seguir/abrir paisagem |
| `tilt` | varre vertical | revelar altura, "tilt up/down" |
| `pedestal` | sobe/desce a moldura | variação vertical sutil |
| `tracking` | acompanha lateral (parallax+) | **seguir** criatura/veículo/personagem |
| `truck` | lateral com leve roll | seguir ação com energia |
| `dolly` | translada + zoom | aproximar/afastar com profundidade |
| `crane` | sobe revelando (+roll) | **revelar escala** (sobe), grandiosidade |
| `aerial` | drone: abre + deriva + roll | **estabelecer** vastidão, voo |
| `orbit` | órbita ao redor | dar volta num sujeito |
| `float` | flutua orgânico | subaquático, sonho |
| `handheld` | câmera na mão (tremor) | **ação/combate**, urgência, intimidade nervosa |
| `dolly_zoom` | vertigo (zoom vs parallax) | choque psicológico |
| `whip_pan` | chicote borrado | transição/virada veloz |
| `framing` | de A→B (zoom+ponto) | 1 imagem → "viaja" pra um detalhe (2 keyframes) |

Direções (`direction`): `left right up down upleft upright downleft downright`.

---

## 2. Tradução direta (verbo da decupagem → primitivo)

| na decupagem… | use |
|---|---|
| "dolly out", "afastando", "recuando" | `pull_out` (close) · `aerial`/`crane` (wide, revela) |
| "dolly in", "aproximando" | `push_in` (close) · `dolly` (médio) |
| "push-in", "leve aproximação" | `push_in` (intensidade baixa) |
| "push-in rápido", "zoom de impacto" | `crash_zoom` |
| "tilt up / down" | `tilt` (dir up/down) · revelando figura → `crane` |
| "pan esquerda/direita" | `pan` (dir) |
| "tracking", "travelling", "seguindo" | `tracking` (ou `truck` se rápido/enérgico) |
| "câmera na mão", "handheld", "steadicam" | `handheld` |
| "crane up", "grua subindo", "revela escala" | `crane` |
| "aéreo", "drone", "voo", "estabelecimento amplo" | `aerial` |
| "órbita", "gira ao redor" | `orbit` |
| "estática", "locked-off" | `static` |
| "câmera lenta" | **não existe**: `static`/`push_in` sutil + `duration` maior |
| "rampa de velocidade" (acelera) | aproxime com `easing: ease_in` |
| "crane down" | **não existe**: `dolly` dir `down` |
| "flash branco" | cena `kind:'white'` curtíssima (~0.15s) |

---

## 3. A combinação (a inteligência de fato)

Cada eixo da descrição controla um parâmetro. **Combine os três:**

### a) PLANO (close) → escolhe o movimento e limita a intensidade
- **Extreme close-up** (olho, detalhe): `push_in` **sutil** ou `static`. `amplitude: sutil`. Nunca dramático — rosto não pode "nadar".
- **Close-up** (rosto, ~40% de um trailer): `push_in` (emoção) — `intensity 0.6–0.8`, `amplitude sutil`. Só vire `crash_zoom` se for impacto/rápido.
- **Plano médio** (2–3 figuras, ação): `dolly`/`tracking`/`truck`/`handheld`. `intensity ~1.0`.
- **Wide / estabelecimento**: `aerial`/`crane`/`pull_out`. Aqui pode `amplitude: dramatico`.

### b) VELOCIDADE → intensidade + amplitude + duração
| velocidade | intensity | amplitude | duração típica |
|---|---|---|---|
| lenta | 0.5–0.8 | sutil | 2–4 s |
| média | 0.9–1.1 | normal | 1.2–2.5 s |
| rápida | 1.2–1.4 | dramatico | 0.5–1.2 s |

> Regra de ouro: **close = intensidade BAIXA, wide = intensidade ALTA.** A mesma "velocidade média" vira `push_in 0.7 sutil` num rosto e `aerial 1.1 dramatico` numa paisagem.

### c) MOOD → look (`src/looks.js`)
| mood / cena | look |
|---|---|
| maravilha, belo, sereno, sonho | `sonho-etereo` |
| subaquático, tecnológico, espaço, frio | `sci-fi-cyberpunk` |
| ação, batalha, fogo, destruição, épico | `acao-epico` |
| emoção, rosto, íntimo, dramático | `cinema-dramatico` |
| texto/preto, cartela sóbria | `noir-film` |
| flashback, etéreo suave | `sonho-etereo` |

### d) TRANSIÇÃO (`tout`)
- **corte seco** (padrão de trailer, ~30 cortes/min) → `cut`.
- **respiro / quebra de seção / antes de cartela** → `dip_to_black` (0.4–0.7).
- **beleza encadeada (mundo/sonho)** → `crossfade` (0.5–0.6).
- **virada veloz** → o primitivo `whip_pan` na cena (a transição em si é `cut`).

---

## 4. Receita por tipo de shot (defaults prontos)

```
WIDE estabelecimento, lento/médio   → aerial  | intensity 1.0–1.2 | dramatico | 2.5–4s | crossfade/dip
WIDE revela escala (sobe)           → crane   | 1.1–1.2 | dramatico | 2–3s
MÉDIO seguindo personagem           → tracking| dir (lado) 1.1–1.3 | normal | 1.5–3s | cut
MÉDIO ação/combate                  → handheld| 1.2–1.3 | dramatico | 0.8–1.2s | cut
MÉDIO interação calma               → dolly   | dir 1.0 | normal | 2–3s | crossfade
CLOSE emocional (fala/olhar)        → push_in | 0.6–0.8 | sutil | 1.5–3s | cut  (+ legenda)
CLOSE impacto/rápido                → crash_zoom | 1.0–1.1 | — | 0.6–1.0s | cut
EXTREME close (olho/detalhe)        → push_in | 0.5 sutil  ou static | 1.5–2s
ANTAGONISTA olhar de poder          → static  | breath 0.5 | 1.0–1.5s
CARTELA título                      → kind ember/black, push_in 0.4–0.5, TITLE(...), 2–4s, dip
TELA preta (respiro)                → kind black, static, 0.3–0.8s
FLASH branco                        → kind white, static, ~0.15s, cut
```

---

## 5. Ritmo & arco (montar a sequência inteira)

- **Trailer de ação ≈ 30 cortes/min**, média ~2 s/shot, com variação que controla o ritmo.
- Arco padrão (durações sobem/descem com ele):
  1. **Teaser** (0–5s): cortes rápidos (0.6–1.5s) de imagens marcantes.
  2. **Mundo/maravilha**: planos longos (2–4s), `crossfade`, looks `sonho-etereo`.
  3. **Personagens/emoção**: closes (`push_in` sutil) com legendas de diálogo.
  4. **Apostas/destruição**: ritmo sobe, `acao-epico`, `handheld`.
  5. **Clímax**: cortes curtíssimos (0.6–1.0s), `crash_zoom`/`handheld`.
  6. **Declaração final**: 1–2 closes lentos + cartela título.
- **Áudio segue o arco:** braam nos picos (cartela, clímax, flash, título), whoosh nas viradas de seção, música baixa sob a narração.

---

## 6. Legendas e cartelas (`src/Caption.jsx`)

- **Diálogo** → `caption: { body, position:'bottom', align:'center', accent:'#f2efe6' }`.
- **Título de filme** → `{ kicker, title, position:'center', align:'center', accent:'#ff6a1a' }` (laranja fogo).
- **CTA de marca (INEMA)** → `accent:'#ffb347'` (âmbar), `kicker:'assista mais em'`, `title:'INEMA.CLUB'`.
- **Disclaimer honesto** (recriação) → cartela `noir-film`, ex.: kicker "simulação em fotos do" + title "TRAILER X".

---

## 7. Anti-padrões (não faça)

- ❌ Dois movimentos na mesma cena (estoura headroom → bordas pretas). Use 1 primitivo composto.
- ❌ `crash_zoom`/`dramatico` em rosto parado → enjoa. Close = sutil.
- ❌ Cena sem `transition_out` → quebra o build (`.type` de undefined). **Toda** cena tem `tout`.
- ❌ Narração por cima de legenda de diálogo → colidem. Narre nos **vãos** (use os `start` das cenas de diálogo no `timeline.json` para achar os buracos).
- ❌ Pôr a narração tão alta que some a trilha, ou tão baixa que some a voz → ducking ~−10 dB com voz em −14 LUFS.
