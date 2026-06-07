# PixFlow no ecossistema: comparação com promptprof, MDD e video-plan-editor

> Como o projeto pixflow se relaciona com 3 projetos existentes do usuário.
> O que tem em comum, o que agrega/sinergia, o que destoa/conflita.

## Os 4 projetos em 1 linha

| Projeto | Faz o quê | Saída | Estágio |
|---|---|---|---|
| **pixflow** | imagem estática → filme em **código aberto** (Three.js+GLSL, Depth-Anything, Remotion, FFmpeg), **sem IA** | MP4/ProRes determinístico | fase (a) feita; (b) skill pendente |
| **promptprof** | refina intenção crua em **prompt** cinematográfico (lente/luz/cor) | prompt + negativos + params | skill pronta (framework LLM) |
| **mdd** | assunto → **pacote de direção** (cartão, cena, storyboard, faixa do diretor, prompt) p/ **geradores IA** (Seedance/Kling/Runway/Veo) | storyboard + prompt de vídeo | skill pronta e instalada |
| **video-plan-editor** | assunto → **plano de vídeo de alta performance** (beat sheet viral, renderer-agnóstico) | `plano-edicao.json` + render | skill pronta (CLI `vpe`) |

## O que têm EM COMUM
- **Mesmo vocabulário cinematográfico:** câmera (push-in, orbit, dolly, pan, tilt, ken_burns, whip pan), efeitos (grain, color grade, partículas, glitch, light leak, vignette), transições (cut, crossfade, dip to black).
- **Arquitetura de presets:** todos têm tabelas de estilo (cinema, sci-fi, noir, produto…).
- **Contratos estruturados:** pixflow = YAML `pixflow.movie/v1`; vpe = JSON `plano-edicao.json v1.0`; mdd = markdown em 7 blocos; promptprof = tabelas md.
- **Câmera por FUNÇÃO** (não estética solta): push-in→tensão, crash zoom→impacto, macro→detalhe premium. MDD e VPE explicitam isso.
- **Mesmo fluxo:** esboço → refina → valida → render.

## O que AGREGA / SINERGIA (pipeline completo)
O pipeline profissional que emerge dos 4:
```
ideia → MDD (storyboard dirigido) → PROMPTPROF (refina prompt de imagem)
      → flux2-klein (imagem com boa profundidade) → PIXFLOW (parallax 2.5D + efeitos)
      → MP4 cinematográfico determinístico
```
- **pixflow ← promptprof:** promptprof gera o prompt de imagem otimizado p/ parallax (separação de planos) que alimenta o flux2-klein do pixflow. (Liga direto ao `prompts/01-prompt-imagem-base.md`.)
- **pixflow ← mdd:** o **storyboard do MDD (bloco 04)** mapeia 1:1 para o **`scenes[]` do movie spec** do pixflow → um *middleware* converte MDD → movie spec e o pixflow renderiza sem IA.
- **video-plan-editor → pixflow:** VPE define a ESTRUTURA (beats hook/valor/CTA, pacing); pixflow EXECUTA cada beat com depth+efeitos. Basta o VPE ganhar `engine_hint: pixflow`.
- **promptprof = fonte única de vocabulário:** lentes/luz/cor de `promptprof/vocabulario.md` poderiam ser importados por todos.

## O que DESTOA / CONFLITA (atenção)
1. **IA vs código aberto (o eixo central):** MDD e VPE miram **geradores de vídeo IA**; pixflow é o **oposto** (render determinístico em código). Isso é **complementaridade, não defeito** — mas falta um "qual usar quando" claro. Risco real de confundir na hora.
2. **Specs incompatíveis:** YAML (pixflow) × JSON (vpe) × Markdown (mdd). Sem middleware, um não lê o outro.
3. **Presets com mesmo nome, conteúdo diferente:** ex. **"noir"** — no promptprof é neon/cyberpunk; no pixflow é film noir clássico (grain + pretos esmagados). Aplicar cruzado dá cor errada. MDD usa "presets" como **domínio** (ação, produto, imóvel), não como estilo visual.
4. **Efeitos qualitativo × quantitativo:** MDD diz "glitch sutil"; pixflow precisa `intensity: 0.x`. Falta tabela de tradução (light/medium/strong → número).
5. **beat_sync do pixflow pode quebrar timing intencional do MDD** (ex.: "congelar no ápice 1.5s"). Precisaria de `override_beat_sync` por cena.

## Recomendações (ordenadas por custo/impacto)
1. **`presets-central/presets.v1.json`** — tabela única de looks (id + aliases + lente/luz/cor + efeitos com intensidade default). Todos importam por referência. *(baixo esforço, alto impacto — mata a divergência de "noir".)*
2. **Middleware `mdd-to-pixflow`** — converte storyboard MDD → `scenes[]` do movie spec. *(desbloqueia: direção MDD → render código aberto.)*
3. **`engine_hint: pixflow` no video-plan-editor** — VPE passa a poder despachar beats para o pixflow.
4. **`ECOSYSTEM.md` em `~/projetos`** — guia "qual projeto usar quando" + pipeline recomendado.

## Veredito
Complementaridade **alta**: os 4 cobrem estratégia → direção → prompt → render. pixflow é a **única peça de render em código aberto/determinístico**; os outros 3 produzem **intenção/prompt** (em boa parte mirando IA). O ponto de costura mais valioso é **MDD storyboard → movie spec do pixflow**. A maior fricção a resolver é **unificar presets** (mesmo nome ≠ mesmo look).
