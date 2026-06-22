# Exemplo: "Avatar: Fogo e Cinzas" (recriação / simulação em fotos)

Exemplo completo da skill `pixflow-trailer`: de uma **decupagem** (78 shots) a um **trailer narrado** de 2:16, tudo em código aberto (sem gerador de vídeo IA).

## Arquivos
- **`decupagem.md`** — a ENTRADA: análise shot-a-shot do trailer (formato + padrões + receita).
- **`build.mjs`** — a fonte única já PREENCHIDA: a tabela `SHOTS` com os 78 shots mapeados (câmera + intensidade + close + duração + look + transição + legendas), aplicando a `inteligencia-direcao.md`. Gera as imagens (flux2-klein) + `avatar-full.movie.yaml` + `timeline.json`.
- **`gen-audio.mjs`** — monta `trilha.wav`: música royalty-free + braam nos marcos (clímax/cartela/flash) + whoosh nas viradas, sincronizado ao `timeline.json`.
- **`gen-narracao.mjs`** — narração masculina (edge-tts `pt-BR-AntonioNeural`, grave) nos vãos, com ducking, re-muxada **sem re-render**.

## Como foi produzido (pipeline)
```bash
node build.mjs                       # imagens + yaml + timeline
# música/SFX baixados via inemavox (baixar_v1.py --quality audio) p/ assets/audio/{music,braam,whoosh}/
node gen-audio.mjs                   # -> trilha.wav
node <skill-motor>/cli/pixflow-motion.mjs render avatar-full.movie.yaml avatar-fogo-cinzas-full.mp4
node gen-narracao.mjs                # -> ...-narrado.mp4 (re-mux, sem re-render)
```

## Decisões de direção que valem reusar (resumo da inteligência aplicada)
- **Closes = `push_in` sutil** (rosto não nada); só `crash_zoom` em impacto/teaser.
- **Wides = `aerial`/`crane`** com `amplitude: dramatico` (revelam escala).
- **Ação = `handheld` dramatico**, durações curtas (0.8–1.2s); **mundo = `crossfade`** + `sonho-etereo`.
- **Cartelas/seções** separadas por `dip_to_black`; **cortes secos** no resto (ritmo de trailer).
- **Legendas de diálogo** embaixo/centro; **narração nos vãos** entre elas.
- **Disclaimer honesto** ("simulação em fotos") + **CTA INEMA.CLUB** (âmbar) no fim.

## Limites do motor que apareceram
- 1 movimento por cena (combos "dolly out + tilt" → um primitivo composto).
- "Câmera lenta"/"speed ramp" → simulado com `duration` + `easing`.
- "Crane down" → `dolly` dir `down`; "flash branco" → cena `kind:'white'` de ~0.15s.
- Toda cena PRECISA de `transition_out` (senão o build quebra).
