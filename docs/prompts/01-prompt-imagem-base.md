# Template de Prompt — Imagem-Base para flux2-klein (que anima bem em parallax 2.5D)

> Camada: **IMAGEM** | Modelo: **flux2-klein** | Saída: imagem-base do plano

O objetivo aqui **não é** uma imagem bonita qualquer. É uma imagem cuja
**profundidade seja legível para o Depth-Anything-V2** e cujos planos sejam
**separáveis**, para que o shader de parallax 2.5D tenha o que deslocar. Uma foto
linda e chapada (tudo no mesmo plano focal, fundo colado no sujeito) gera um
depth map quase uniforme e o parallax fica morto.

---

## 1. Por que a separação de planos importa

O pipeline (ver `docs/research/03-cadeia-recomendada.md`) faz:

```
imagem → Depth-Anything-V2 → depth map (cinza 16-bit) → UV offset por depth × vetor de câmera
```

- Pixels **claros** no depth map = perto (foreground). Movem mais.
- Pixels **escuros** = longe (background). Movem menos.
- Se a imagem tem **três faixas de distância distintas**, o parallax cria a
  ilusão de 3D. Se tem uma só, não há paralaxe.

Logo, todo prompt deve **explicitar três planos**: foreground, midground,
background — e dar pistas de profundidade que o estimador adora (névoa
atmosférica, depth of field, sobreposição de objetos, perspectiva forte).

---

## 2. Estrutura do prompt (ordem recomendada)

Monte o prompt em inglês, nesta ordem. Cada bloco é um "slot" que você preenche:

```
[SUBJECT / ACTION]
[FOREGROUND ELEMENTS]
[MIDGROUND ELEMENTS]
[BACKGROUND ELEMENTS]
[LIGHTING]
[LENS / FOCUS / DOF]
[ATMOSPHERE / DEPTH CUES]
[COLOR PALETTE / GRADE]
[STYLE / MOOD]
[TECHNICAL: aspect ratio, quality]
```

### Slots explicados

| Slot | O que pôr | Exemplos de termos |
|---|---|---|
| SUBJECT / ACTION | sujeito principal e o que faz | `a lone traveler walking`, `an abandoned car` |
| FOREGROUND | algo **bem perto** da câmera (cria parallax forte) | `tall grass in the foreground`, `out-of-focus leaves`, `a railing close to camera` |
| MIDGROUND | onde fica o sujeito normalmente | `the subject standing on a wet street` |
| BACKGROUND | plano distante, com profundidade | `distant mountains fading into haze`, `a city skyline far away` |
| LIGHTING | direção e qualidade da luz | `golden hour backlight`, `volumetric god rays`, `single hard key light` |
| LENS / FOCUS | lente e profundidade de campo | `shot on 85mm`, `shallow depth of field`, `f/1.4 bokeh`, `wide 24mm` |
| ATMOSPHERE / DEPTH CUES | **o que mais ajuda o depth map** | `atmospheric fog between layers`, `dust particles in the air`, `layered depth`, `aerial perspective` |
| COLOR PALETTE | paleta / grade | `teal and orange grade`, `desaturated cool tones`, `warm amber` |
| STYLE / MOOD | referência de estilo | `cinematic`, `film still`, `anamorphic`, `moody` |
| TECHNICAL | proporção e qualidade | `--ar 16:9`, `cinematic composition`, `high detail` |

---

## 3. Modificadores que AJUDAM o depth map

Inclua sempre que possível (são os que mais melhoram a separação de planos):

- **Profundidade explícita:** `layered depth`, `strong sense of depth`,
  `foreground midground background clearly separated`, `deep perspective`.
- **Névoa atmosférica entre camadas:** `atmospheric haze`, `volumetric fog`,
  `mist rolling between the layers`, `aerial perspective`. (A névoa cria um
  gradiente de profundidade limpo que o Depth-Anything lê muito bem.)
- **Depth of field / bokeh:** `shallow depth of field`, `blurred foreground`,
  `bokeh background`. (Foco seletivo = pistas fortes de distância.)
- **Sobreposição / occlusion:** `objects overlapping at different distances`,
  `framed by foreground elements`.
- **Perspectiva:** `leading lines`, `vanishing point`, `low angle wide lens`.
- **Partículas no ar:** `floating dust`, `embers`, `snow drifting` — além de
  profundidade, dão âncora para partículas reais no Three.js depois.

---

## 4. O que EVITAR

| Evite | Por quê |
|---|---|
| Composição **chapada / frontal** (flat lay, retrato em fundo liso) | Depth map fica uniforme; parallax morre |
| **Fundo colado** no sujeito (parede atrás da cabeça) | Sem faixa de distância distinta |
| **Tudo em foco** com lente muito fechada (`f/16`, deep focus) sem outras pistas | Sem DOF, perde uma pista de profundidade |
| **Vista aérea top-down** | Comprime profundidade num plano só |
| Sujeito **centralizado preenchendo o quadro inteiro** | Não sobra foreground nem background para mover |
| **Reflexos/espelhos complexos**, vidro, grades finas | Depth-Anything erra; bordas tremem no parallax |
| **Bordas do sujeito muito perto da margem** do quadro | Parallax revela bordas vazias; deixe respiro |

Regra prática: imagine **três cartões de papelão** em distâncias diferentes
(perto, médio, longe). Se sua descrição não consegue mapear nesses três cartões,
ela vai animar mal.

---

## 5. Template copiável (preencha os colchetes)

```text
[subject and action],
[foreground element] in the foreground,
[midground / subject placement] in the midground,
[distant element] in the background fading into atmospheric haze,
[lighting description],
shot on [lens], shallow depth of field, layered depth,
[atmosphere / depth cues: fog, dust, aerial perspective],
[color palette], cinematic film still, strong sense of depth,
--ar 16:9
```

Versão genérica preenchida:

```text
a lone figure standing on a rocky cliff,
windblown grass and small stones in the foreground,
the figure in the midground silhouetted against the light,
a vast valley and distant mountains in the background fading into atmospheric haze,
golden hour backlight with volumetric god rays,
shot on 35mm, shallow depth of field, layered depth,
drifting dust particles in the air, aerial perspective,
warm amber and teal grade, cinematic film still, strong sense of depth,
--ar 16:9
```

---

## 6. Exemplos prontos por look

Cada bloco já está estruturado para parallax (3 planos + névoa/DOF). Copie,
ajuste o sujeito, mantenha as pistas de profundidade.

### 6.1 Cinema dramático (cinematic / film still)

```text
a weathered fisherman looking out to sea,
coiled rope and wet netting in the foreground,
the fisherman in the midground at the edge of a wooden pier,
a stormy horizon and distant lighthouse fading into mist in the background,
dramatic overcast key light, soft rim light on the face,
shot on 50mm, shallow depth of field, layered depth,
sea spray and haze between the planes, aerial perspective,
desaturated teal and steel-blue grade, anamorphic cinematic film still,
strong sense of depth, high detail,
--ar 2.39:1
```

### 6.2 Retrô VHS (retro / analog / 80s)

```text
a teenager riding a bike down a suburban street at dusk,
a chain-link fence and tall weeds close to camera in the foreground,
the cyclist in the midground under a flickering streetlamp,
rows of identical houses and a hazy purple sky in the background,
warm sodium-vapor streetlight glow, soft backlight,
shot on a vintage zoom lens, shallow depth of field, layered depth,
faint haze and floating dust in the warm air, slight motion blur,
washed-out magenta and teal 1985 palette, grainy retro film still,
nostalgic mood, strong sense of depth,
--ar 4:3
```

### 6.3 Sci-fi / cyberpunk (neon / HUD-ready)

```text
a hooded courier standing in a rain-slick alley,
glowing neon signage and dripping cables in the foreground,
the courier in the midground reflected in a wet puddle,
a towering megacity skyline with holographic ads fading into smog in the background,
hard cyan key light and magenta rim light, volumetric neon glow,
shot on 35mm, shallow depth of field, layered depth,
heavy atmospheric smog and rain haze between the layers,
electric teal and hot-magenta cyberpunk palette, cinematic film still,
strong sense of depth, high detail,
--ar 16:9
```

### 6.4 Sonho / etéreo (dreamlike / soft)

```text
a girl in a flowing dress floating among clouds,
soft out-of-focus blossom petals drifting in the foreground,
the girl in the midground suspended in gentle light,
endless pastel cloudscape and a faint distant sun in the background,
soft diffused glow, dreamy backlight, gentle bloom,
shot on 85mm, very shallow depth of field, creamy bokeh, layered depth,
floating glowing particles and soft mist between the planes,
pale pink lavender and cream palette, ethereal cinematic film still,
strong sense of depth, soft focus,
--ar 16:9
```

### 6.5 Natureza épica (epic landscape / grand scale)

```text
a tiny hiker on a ridge overlooking a glacial valley,
jagged dark rocks and alpine flowers in the foreground,
the hiker in the midground for scale on the ridgeline,
immense snow peaks and a sea of clouds in the background fading into aerial haze,
crisp morning sidelight, long shadows, volumetric god rays,
shot on 24mm wide, deep but layered depth, leading lines,
thin cloud mist drifting between the mountain layers, aerial perspective,
cool blue-green with warm highlights, epic cinematic film still,
strong sense of depth, ultra detailed,
--ar 2.39:1
```

### 6.6 Noir (black & white / high contrast)

```text
a detective lighting a cigarette under a streetlamp at night,
venetian-blind shadow bars and a foreground railing close to camera,
the detective in the midground in a long coat, hat low,
a deep wet street with distant car headlights fading into fog in the background,
single hard key light from the lamp, deep chiaroscuro shadows,
shot on 40mm, shallow depth of field, layered depth,
thick rolling fog between the planes, cigarette smoke curling,
high-contrast black and white, film-noir cinematic still,
strong sense of depth, heavy grain,
--ar 2.39:1
```

### 6.7 (Bônus) Ação / épico colorido

```text
a warrior charging across a battlefield at dawn,
trampled grass and a fallen shield in the foreground,
the warrior mid-stride in the midground, cloak billowing,
distant armies and smoke columns fading into orange haze in the background,
low-angle backlight, dramatic god rays through smoke,
shot on 35mm, shallow depth of field, layered depth,
floating embers, dust and smoke between the planes,
warm orange and deep teal grade, epic cinematic film still,
strong sense of depth, high detail,
--ar 2.39:1
```

---

## 7. Checklist antes de aprovar uma imagem-base

- [ ] Dá para apontar **foreground, midground e background** distintos?
- [ ] Há **névoa, DOF ou perspectiva** separando os planos?
- [ ] O sujeito tem **respiro** nas bordas (não coladinho na margem)?
- [ ] Sem reflexos/grades finas que façam o depth map tremer?
- [ ] Proporção e resolução corretas para a cena?
- [ ] (Após rodar o depth map) o mapa mostra **gradiente claro→escuro**,
      não uma chapa cinza uniforme?
