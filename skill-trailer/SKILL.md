---
name: pixflow-trailer
description: Transforma uma DECUPAGEM (lista de shots/planos com câmera, velocidade e mood — ex.: análise de um trailer) num TRAILER completo e narrado, sem IA de vídeo. Gera as imagens (flux2-klein), mapeia cada shot para os primitivos de câmera do pixflow-motion (movimento + intensidade + close + duração + look + transição), monta o movie spec + timeline, baixa/sintetiza música e SFX (inemavox/ffmpeg), adiciona narração masculina (edge-tts) com ducking, e renderiza (pixflow-motion → MP4). Use quando o usuário der uma decupagem / "análise de trailer" / "lista de shots" / "recriar um trailer com imagens" / "trailer simulado em fotos" e quiser o vídeo pronto (com trilha e/ou narração). Constrói POR CIMA da skill pixflow-motion.
---

# pixflow-trailer

**Decupagem → trailer narrado**, determinístico, sem gerador de vídeo IA. É a camada de *direção* sobre o motor [`pixflow-motion`](../skill/SKILL.md): pega uma lista de shots (plano, câmera, velocidade, mood) e a transforma num filme.

## Quando usar
- O usuário deu uma **decupagem** (análise shot-a-shot de um trailer/vídeo) e quer **recriar com imagens novas**.
- "trailer simulado em fotos", "recria esse trailer", "lista de shots → vídeo", "vira filme com narração".
- Qualquer caso em que há **muitos planos com câmera/mood descritos** e se quer o vídeo montado com ritmo de trailer + trilha + voz.

## Pré-requisitos
- Skill **pixflow-motion** instalada (`~/.claude/skills/pixflow-motion`) e suas deps (`npm install`, `check-deps`).
- Servidor de imagem **flux2-klein** (`inemaimg`, `localhost:8000`) no ar.
- **ffmpeg** + **edge-tts** (`pip install edge-tts`) para áudio/narração.
- (Opcional) **inemavox** (`~/projetos/inemavox2/baixar_v1.py`) para baixar música/SFX royalty-free.

## Fluxo (o que fazer)
1. **Leia a decupagem.** Identifique por shot: plano (wide/médio/close/extreme), câmera (dolly/tilt/pan/tracking/crane/handheld/push…), velocidade (lenta/média/rápida), mood, transição, legendas/cartelas.
2. **Aplique a inteligência de direção** → veja [`inteligencia-direcao.md`](inteligencia-direcao.md). É o coração: como combinar **movimento + intensidade + close + duração + look + transição** a partir da descrição.
3. **Escreva o `build.mjs`** a partir de [`templates/build.template.mjs`](templates/build.template.mjs): preencha a tabela `SHOTS` (1 objeto por shot). O build é **fonte única** → gera as imagens (flux2-klein), escreve o `.movie.yaml` e o `timeline.json` (com os marcos de áudio).
   - Cartelas/preto/branco: `kind: 'ember'|'black'|'white'` (não geram imagem).
   - Repetições do roteiro: `reuse: '<id>'`.
   - **Sempre** dê `tout` (transition_out) a TODA cena (inclusive a última) — senão o build quebra.
4. **Rode** `node build.mjs` (gera imagens + yaml + timeline).
5. **Áudio** com [`templates/gen-audio.mjs`](templates/gen-audio.mjs): baixa (via inemavox) ou aponta música + braam + whoosh em `assets/audio/{music,braam,whoosh}/video.mp3`; o script crava o braam nos marcos (clímax, cartela, flash) e whoosh nas viradas, mixa e normaliza → `trilha.wav`.
   - **Pegadinha de SFX:** clipe de braam/whoosh é riser→impacto (pico no meio). Meça o pico (`volumedetect` em janelas de 1s) e alinhe `adelay = marco − tempo_do_pico`.
6. **Renderize:** `node <skill>/cli/pixflow-motion.mjs render trailer.movie.yaml saida.mp4`. (≈ nº_frames; trailer de 2 min ≈ ~3900 frames ≈ 30–40 min.)
7. **Narração (opcional)** com [`templates/gen-narracao.mjs`](templates/gen-narracao.mjs): escreve falas curtas de trailer nos **vãos** (fora das legendas de diálogo), gera com **edge-tts `pt-BR-AntonioNeural`** (rate −10%, pitch −22Hz = grave), faz **ducking** (música cai ~10 dB sob a voz) e **re-muxa no MP4 sem re-render**.

## Princípio de eficiência
- **Imagem e render são caros; áudio é barato.** Faça o vídeo (música) primeiro; narração/ajustes de áudio entram por **re-mux sem re-render**.
- Mudar uma cena no meio **desloca a timeline** → re-render. Junte várias mudanças num render só.
- Cache de depth (`<skill>/.pixflow`) e de imagens (o build pula o que já existe) acelera iterações.

## Limites herdados do motor (citar ao usuário quando relevante)
- **1 movimento por cena** (somar dois estoura o headroom de zoom do `fit()` → bordas pretas). Combos tipo "dolly out + tilt" → use um primitivo composto (`crane`/`aerial`/`dolly`) ou `framing` (2 keyframes).
- **Sem slow-mo/speed-ramp de footage** (é still) → simule com `duration` + `easing`.
- **Sem crane-down nem white-flash** nativos → `dolly` direção `down`; flash = imagem branca curtíssima.

## Exemplo completo
[`examples/avatar-fogo-cinzas/`](examples/avatar-fogo-cinzas/) — a decupagem de um trailer (78 shots) + o `build.mjs` preenchido + os scripts de áudio/narração que produziram o trailer narrado de 2:16. É a referência de como uma decupagem vira `SHOTS`.
