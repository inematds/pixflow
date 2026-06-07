# Meta-Prompt — Da Ideia ao Filme Completo

> Camada: **CENA** (orquestra todas) | Saída: lista de cenas + prompts de imagem + movie spec

Este é o template macro. A partir de **uma ideia de filme/história**, ele deriva:
1. a **lista de cenas** (decupagem),
2. as **imagens necessárias** (1 prompt flux2-klein por cena),
3. o **roteiro de movimento completo** (o movie spec).

Use-o como um meta-prompt que você (ou um agente) executa em sequência.

---

## 1. Entradas que você fornece

```
LOGLINE:      [1 frase: o filme em uma linha]
DURAÇÃO:      [ex.: ~30s]
FORMATO:      [16:9 cinema | 9:16 Reels]
LOOK:         [preset de 03-prompt-look-presets.md, ex.: cinema-dramatico]
TOM:          [contemplativo | tenso | épico | nostálgico | onírico]
TRILHA:       [referência de música/ambiente, se houver]
RESTRIÇÕES:   [nº de cenas alvo, nada de pessoas, etc.]
```

---

## 2. Processo (5 passos)

### Passo 1 — Decupar em cenas

Quebre a logline em **3–6 batidas narrativas** (início → desenvolvimento →
clímax/resolução). Cada batida = 1 cena = 1 imagem-base. Calcule a duração por
cena: `duração_total / nº_cenas`, ajustando ±2s por peso dramático.

Saída do passo 1 (rascunho em PT-BR):

```
CENA 1 — [batida]: [o que se vê] | [duração]
CENA 2 — [batida]: [o que se vê] | [duração]
...
```

### Passo 2 — Escolher câmera + transição por cena

Para cada cena, escolha um movimento (de `02-prompt-roteiro-de-movimento.md`
§1.1) que sirva a batida:

- abertura / revelação de mundo → `pull_out` ou `pan`
- aproximação emocional / tensão → `push_in`
- dar volume ao sujeito → `orbit`
- contemplação → `float` / `ken_burns`
- impacto / clímax → `static` (deixa o efeito falar)

E a transição de saída (corte seco no clímax, crossfade no contemplativo etc.).

### Passo 3 — Escrever os prompts de imagem

Para cada cena, gere **um prompt flux2-klein** seguindo o template de
`01-prompt-imagem-base.md`, **herdando os modificadores do preset de look**
(§3 de `03-prompt-look-presets.md`). Garanta sempre os 3 planos + névoa/DOF.

Saída: um bloco de prompt em inglês por cena.

### Passo 4 — Rodar a cadeia de geração

```
para cada cena:
  flux2-klein(prompt)         → img/cenaN.png
  Depth-Anything-V2(img)      → depth/cenaN.png
  (checar depth map: gradiente claro? senão, regerar imagem)
```

### Passo 5 — Montar o movie spec

Reúna tudo no formato de `02-prompt-roteiro-de-movimento.md` §3:
`meta`, `output`, `defaults` (do preset), `assets`, `audio`, `scenes[]`.
Esse arquivo é o entregável final — a skill executável o consome.

---

## 3. Meta-prompt copiável (para rodar com um agente)

Cole isto preenchendo o cabeçalho; o agente devolve cenas + prompts + spec.

```text
Você é um diretor + diretor de fotografia de uma cadeia que transforma
imagens estáticas (flux2-klein) em filme via parallax 2.5D + efeitos em código.

IDEIA DO FILME:
  Logline: <...>
  Duração alvo: <...>
  Formato: <16:9 | 9:16>
  Look (preset): <cinema-dramatico | retro-vhs | sci-fi-cyberpunk |
                  sonho-etereo | noir | acao-epico>
  Tom: <...>
  Trilha: <...>
  Restrições: <...>

TAREFA:
1. Decupe em 3–6 cenas (batidas narrativas). Para cada uma: título, o que se vê,
   duração em segundos, movimento de câmera, transição de saída.
2. Para cada cena, escreva UM prompt em inglês para o flux2-klein seguindo a
   estrutura: [subject][foreground][midground][background][lighting]
   [lens/DOF][atmosphere/depth cues][palette][style][--ar]. SEMPRE com três
   planos separados e pistas de profundidade (haze, DOF, aerial perspective),
   herdando os modificadores do look escolhido.
3. Monte o movie spec final em YAML (schema pixflow.movie/v1) com meta, output,
   defaults (do preset de look), assets (images com file/depth/prompt), audio e
   scenes[] (id, image, duration, camera, effects, transition_out).

REGRAS:
- Cada cena = uma imagem-base = uma entrada em assets.images.
- Profundidade legível é obrigatória (sem composições chapadas).
- Some os efeitos do preset aos efeitos específicos da cena.
- Use letterbox 2.39 só em formato cinema.
```

---

## 4. Exemplo end-to-end (resumido)

**Entrada:**

```
Logline: Um astronauta acorda sozinho numa estação à deriva e vê a Terra
         pela última vez.
Duração: ~24s | Formato: 16:9 | Look: cinema-dramatico | Tom: melancólico
```

**Passo 1 — cenas:**

```
CENA 1 — Despertar: olho abrindo no escuro do capacete | 6s | push_in | crossfade
CENA 2 — A estação morta: corredor à deriva, luzes piscando | 6s | pan | dip_to_black
CENA 3 — A janela: astronauta flutua até a vigia | 6s | float | crossfade
CENA 4 — A Terra: planeta visto pela vigia, silêncio | 6s | static | dip_to_white
```

**Passo 3 — prompt da CENA 4 (exemplo):**

```text
an astronaut floating before a round window, seen from inside a dark station,
the curved window frame and floating dust close to camera in the foreground,
the astronaut silhouette in the midground reaching toward the glass,
planet Earth glowing far below against deep space in the background,
soft blue earthlight as key, faint warm cabin light rim,
shot on 35mm, shallow depth of field, layered depth,
floating dust motes and faint haze inside the cabin, strong sense of depth,
desaturated teal and steel-blue grade, anamorphic cinematic film still,
--ar 2.39:1
```

**Passo 5 — movie spec (esqueleto):**

```yaml
schema: pixflow.movie/v1
meta: { title: "Última Janela", author: "nmaldaner" }
output: { resolution: [1920,1080], fps: 30, aspect: "2.39:1", codec: h264, format: mp4, filename: "ultima-janela.mp4" }
defaults:
  look: cinema-dramatico
  effects:
    - { effect: lut, name: "teal_orange.cube", mix: 0.8 }
    - { effect: grain, intensity: 0.25, size: 1.2 }
    - { effect: letterbox, ratio: 2.39 }
    - { effect: vignette, amount: 0.3 }
  transition_out: { transition: crossfade, duration: 1.0 }
assets:
  images:
    olho:    { file: "img/olho.png",    depth: "depth/olho.png" }
    corredor:{ file: "img/corredor.png",depth: "depth/corredor.png" }
    vigia:   { file: "img/vigia.png",   depth: "depth/vigia.png" }
    terra:   { file: "img/terra.png",   depth: "depth/terra.png" }
audio:
  track: { file: "audio/space_drone.mp3", gain_db: -4 }
scenes:
  - id: s1, image: olho,     duration: 6, camera: { type: push_in, intensity: 0.4 }
  - id: s2, image: corredor, duration: 6, camera: { type: pan, direction: right, intensity: 0.5 },
    transition_out: { transition: dip_to_black, duration: 1.0 }
  - id: s3, image: vigia,    duration: 6, camera: { type: float, intensity: 0.3 }
  - id: s4, image: terra,    duration: 6, camera: { type: static },
    effects: [ { effect: bloom, threshold: 0.6, intensity: 0.7 } ],
    transition_out: { transition: dip_to_white, duration: 2.0 }
```

(YAML flow acima é ilustrativo; a skill aceita tanto bloco quanto flow.)

---

## 5. Checklist do filme completo

- [ ] Cada cena tem **imagem-base + depth map** validados (gradiente claro)?
- [ ] Câmera de cada cena **serve à batida** narrativa?
- [ ] Look consistente (mesmo LUT/grain via `defaults`)?
- [ ] Transições contam a história (corte no impacto, dissolve no calmo)?
- [ ] Duração total bate com a meta?
- [ ] Movie spec **valida** (todas as `image` existem em `assets.images`)?
- [ ] Áudio/trilha definidos; beat sync se for ritmado?
