# Padrão geral do ecossistema (compatível com o mercado)

> Um padrão único para as 4 ferramentas (pixflow, mdd, video-plan-editor, promptprof) trocarem
> dados sem fricção, **reusando formatos de mercado** em vez de inventar os nossos.
> Resolve os pontos 2 (specs incompatíveis), 3 (padrão geral de mercado), 4 (efeitos pertencem ao estilo)
> e 5 (beat_sync × timing travado).

## Princípio: 4 camadas, cada uma com um formato de mercado

```
INTENÇÃO/DIREÇÃO        →  brief (mdd / vpe / promptprof)        [interno]
TIMELINE/INTERCÂMBIO    →  OpenTimelineIO (.otio)                [PADRÃO DE MERCADO]
LOOK / COR              →  LUT .cube  +  ASC CDL                 [PADRÃO DE MERCADO]
RENDER                  →  pixflow (código)  ou  IA (via mdd)    [interno]
```

A regra: **tudo que cruza a fronteira entre ferramentas usa um formato que o mercado já lê.**
O nosso `movie spec` YAML continua sendo a camada de render do pixflow, mas ganha **import/export OTIO**.

---

## Ponto 2 — Resolver specs incompatíveis: OpenTimelineIO como pivô

**OpenTimelineIO (OTIO)** é o padrão aberto da indústria (Pixar/ASWF) para intercâmbio de timeline.
Lê e escreve **Premiere XML, Final Cut FCPXML, DaVinci Resolve, EDL, AAF**. Isso dá compatibilidade
de mercado de graça: qualquer plano nosso pode abrir num editor profissional, e vice-versa.

- Cada ferramenta exporta seu plano como `.otio`:
  - **vpe** `plano-edicao.json` → `.otio` (beats viram clips com markers).
  - **mdd** storyboard (bloco 04) → `.otio` (cada painel = um clip + marker de câmera/efeito).
  - **pixflow** `movie spec` ↔ `.otio` (cenas ⇄ clips; câmera/efeitos em metadata namespaced `pixflow`).
- Conversores ficam em `tools/` (um por ferramenta), não middleware ad-hoc espalhado.
- Metadados específicos vão em `metadata["pixflow"]`, `metadata["mdd"]` — OTIO carrega sem perder, e o que não entende ignora.

> Resultado: um único pivô. mdd → OTIO → pixflow. vpe → OTIO → pixflow. E qualquer um → Premiere/Resolve.

---

## Ponto 3 — Padrão geral de presets/look, compatível com mercado

Um registro único: `presets-central/presets.v1.json`. Cada preset é **superset** que **exporta para os
formatos de mercado** (LUT `.cube` e ASC CDL), em vez de cada projeto guardar o seu.

Padrões de mercado adotados:
- **Cor:** arquivo **LUT `.cube`** (Adobe/Resolve/FFmpeg `lut3d`) + **ASC CDL** (slope/offset/power/saturation) — universais.
- **Lentes/câmera:** nomenclatura padrão (`24mm`, `35mm`, `50mm`, `85mm`, `anamórfica`; `push_in`, `dolly`, `orbit`, `ken_burns`, `whip_pan`).
- **Film emulation:** referência por nome de estoque quando aplicável (ex.: `kodak_2383`, `fuji_3513`).

### Schema do preset (resolve também o ponto 4)

O estilo **é dono** das intensidades dos efeitos. Nada de tabela de tradução separada — "sutil/médio/forte"
são apelidos que o próprio preset resolve em número:

```json
{
  "id": "cinema-dramatico",
  "aliases": ["cinematografico", "cinema_dramatico"],
  "market": {
    "lut_cube": "luts/cinema_warm.cube",
    "asc_cdl": { "slope": [1.02,1.0,0.98], "offset": [0,0,0.01], "power": [0.95,1.0,1.05], "sat": 0.9 }
  },
  "camera": { "default_move": "push_in", "lens": "50mm" },
  "effects": {
    "grain":      { "intensity": 0.25, "size": 1.2 },
    "lut":        { "mix": 0.85 },
    "vignette":   { "intensity": 0.3 },
    "light_leak": { "intensity": 0.15 }
  },
  "intensity_aliases": { "sutil": 0.5, "medio": 1.0, "forte": 1.6 }
}
```

- `intensity_aliases` é um **multiplicador por estilo**: mdd diz "glitch sutil" → o preset multiplica sua própria base de glitch por 0.5. Cada estilo decide o que "sutil" significa nele.
- **Conflito de nome "noir" resolvido por `aliases` + ids distintos:** `noir-film` (clássico, grain+pretos esmagados) vs `noir-neon` (cyberpunk). Ninguém usa "noir" solto; usa o id. Os apelidos antigos de cada projeto mapeiam para o id certo.
- Todas as ferramentas leem `presets.v1.json` por **referência** (`preset: "cinema-dramatico@v1"`), nunca hardcode.

---

## Ponto 4 — Efeitos são propriedade do estilo (confirmado)

Já embutido acima: não existe tabela global de "light/medium/strong → número". Cada preset carrega
`effects{}` com números e um `intensity_aliases{}` próprio. O `movie spec` do pixflow só **referencia** o
preset e, opcionalmente, sobrescreve um efeito pontual na cena.

---

## Ponto 5 — beat_sync × cena travada (um flag só)

`beat_sync` alinha cortes à batida da música. Cenas com duração **intencional** (ex.: mdd "congela no ápice 1.5s")
não podem ser esticadas. Solução única: cada cena declara seu modo de duração.

```yaml
scenes:
  - id: climax
    duration: 1.5
    duration_mode: locked     # locked = beat_sync IGNORA esta cena (duração fixa)
  - id: transicao
    duration: 2.0
    duration_mode: flexible   # flexible = beat_sync pode ajustar p/ bater no beat (padrão)
```

- `locked` quando o storyboard marcar timing crítico (freeze, impacto, leitura de texto).
- `flexible` é o default. O conversor mdd→pixflow marca `locked` automaticamente quando o painel indicar freeze/impacto.

---

## Resumo do que isto cria (a fazer)

1. `presets-central/presets.v1.json` — registro único de looks (exporta `.cube` + ASC CDL).
2. `tools/*-to-otio` e `otio-to-movie-spec` — conversores via OTIO.
3. `movie spec v1` ganha: `preset: "<id>@v1"`, `duration_mode`, e export `.otio`.
4. Apelidos legados de cada projeto mapeados para os ids do registro.
