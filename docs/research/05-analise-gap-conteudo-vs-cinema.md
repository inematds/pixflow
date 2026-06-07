# Análise: por que o filme do Hormozi impressiona na imagem mas falha no conteúdo

> Análise dos problemas do filme-teste (`hormozi.mp4`) cruzando pixflow-motion com a skill
> `video-explicativo`. **Diagnóstico, não implementação.**

## O contraste central (a chave de tudo)

| | `video-explicativo` | `pixflow-motion` (hoje) |
|---|---|---|
| Narração (TTS) | ✅ Kokoro, voz, durações medidas | ❌ inexistente |
| Conteúdo estruturado (tópicos) | ✅ roteiro 6–9 cenas, ponto a ponto | ❌ 1 legenda solta por cena |
| "Mostrar o que narra" | ✅ cada ponto narrado vira elemento na tela | ❌ não há |
| Texto animado (GSAP) | ✅ stagger, captions karaokê, ênfase | ❌ um fade+rise no bloco todo |
| Timing áudio↔animação | ✅ fonte única (`AUDIO[]`) sincroniza tudo | ❌ duração fixa no YAML, sem áudio |
| Ilustração visual | ❌ motion graphics chapado (HTML) | ✅ foto cinematográfica + parallax 2.5D |
| Variedade de efeito/câmera | — (limitado) | ⚠️ repetitivo (mesma pilha sempre) |

**Conclusão:** as duas skills são **metades complementares**. `video-explicativo` acerta o *conteúdo*
(narração, tópicos, sincronia, texto animado) e erra a *animação visual* (chapado). `pixflow-motion`
acerta a *animação visual* (cinema, profundidade) e erra o *conteúdo* (sem narração, sem tópicos, texto parado).
O filme do Hormozi expôs isso: lindo de ver, vazio de ensinar.

---

## Problema 1 — Faltou narração
**Causa-raiz:** o pixflow MVP não tem camada de roteiro/voz; só aceita uma trilha de música opcional.
O `video-explicativo` é *script-first*: roteiro → TTS Kokoro (voz `pf_dora`) → mede durações com ffprobe →
as durações **governam o tempo das cenas e dos tweens** (timing de fonte única).
**O que falta no pixflow:** roteiro por cena, geração de voz (Kokoro grátis ou inemavox clonada), e fazer a
**duração de cada cena vir do áudio**, não de um número fixo no YAML.

## Problema 2 — Efeitos repetitivos
**Causa-raiz:** toda cena usa a MESMA pilha (parallax + grade + vinheta + grão) e só 2–3 movimentos de câmera;
todas as transições são crossfade. Os *looks* mudam a cor, mas o **vocabulário de movimento é monótono**.
**O que falta:** variedade real — transições distintas por cena (glitch, whip-pan, zoom-blur, dip), acentos de
movimento (punch/shake) nos momentos de ênfase, e elementos atmosféricos (partículas, light leaks) que a
biblioteca `docs/efeitos/` já especifica mas o motor ainda não implementa. Hoje só existe o parallax + grade.

## Problema 3 — Imagem não remete ao propósito da cena
**Exemplo seu:** "fale com seus clientes" virou *café com um amigo*, não *interação com cliente*.
**Causa-raiz:** os prompts foram **metafóricos/criativos**, não **fiéis ao conceito**. O flux2-klein produziu uma
cena bonita mas semanticamente errada, e **não houve etapa de validação** ("essa imagem lê como o conceito?").
**O que falta:** um passo de *brief visual fiel* — descrever o sujeito de forma literal ao conceito
(ex.: "vendedor e cliente fechando negócio numa mesa de reunião, aperto de mão, laptop com proposta") — e um
**loop de revisão** que rejeita a imagem quando ela não comunica o ponto. É exatamente o que o `mdd`/`promptprof`
fazem (direção + prompt fiel) e que o pixflow pulou ao gerar direto.

## Problema 4 — Sem movimento e impacto nas legendas
**Causa-raiz:** `Caption.jsx` faz **um** fade+rise no bloco inteiro. Não há revelação palavra a palavra, ênfase em
palavra-chave, punch de escala, destaque, contador — nada sincronizado com a fala.
**O que falta:** **tipografia cinética** de verdade — texto entrando por palavra/linha em stagger, *keyword* com
escala/cor/realce, sincronizado à narração (estilo "karaokê" do preset `viral` do `video-explicativo`).
A `docs/efeitos/06-text-animation.md` já descreve isso (GSAP SplitText); o motor não usa.

## Problema 5 — Faltou citar os tópicos e "mostrar o que se narra"
**Causa-raiz:** o pixflow mostrou **uma legenda decorativa por cena**, enquanto o conteúdo real (a lição
destrinchada em pontos) e a narração não existiam. O princípio **"o que você fala, você mostra"** ficou de fora.
**O que falta:** uma **camada de conteúdo** que, a cada frase narrada, faça surgir o elemento correspondente na
tela — bullet, palavra-chave, número, micro-diagrama. Texto como **conteúdo** (reforço visual do que é dito),
não como rótulo. É o núcleo do `video-explicativo` (roteiro ponto-a-ponto, captions sincronizados).

---

## Síntese — o que o filme precisava ser

Um filme que **mostra o que narra**, com:
1. **Roteiro por lição** (gancho → ponto → exemplo), não uma frase solta.
2. **Narração TTS** cujas durações governam o tempo das cenas (sincronia de fonte única).
3. **Imagem fiel ao conceito** (brief literal + revisão), não metáfora bonita ao acaso.
4. **Texto cinético** (palavra a palavra, ênfase em keyword) sobre a imagem.
5. **Conteúdo na tela** (tópicos/pontos aparecendo conforme a fala), não só uma legenda.
6. **Variedade de efeito e câmera** por cena, mais transições com impacto.

## Recomendação de rota (para depois — não implementado agora)

A convergência já está prevista no ecossistema (`docs/research/04-ecossistema.md` e `docs/padroes/01-padrao-geral.md`):

- **O conteúdo vem do fluxo `video-plan-editor` (`plano-edicao.json`)**: roteiro, narração, captions, tópicos por cena.
- **A animação visual vem do pixflow**: imagem cinematográfica + parallax 2.5D como *canvas* de fundo.
- **A camada de texto** ganha tipografia cinética (GSAP/SplitText) sincronizada à narração — o que o
  `video-explicativo` faz, mas agora **sobre fundo cinematográfico animado**, não sobre HTML chapado.
- **Timing de fonte única** (durações do TTS) governa cenas, texto e cortes — padrão herdado do `video-explicativo`.
- **Prompt de imagem fiel ao conceito** (via `promptprof`/`mdd`) + revisão semântica antes de aceitar a imagem.

Ou seja: **pixflow vira o motor de fundo cinematográfico do `video-explicativo`**, e o `video-explicativo`
empresta ao pixflow a disciplina de roteiro/narração/tópicos/sincronia. Cada um cobre o buraco do outro.

> Resumo de uma linha: o filme foi um **trailer** (lindo, vago); falta virar **aula** (mostra, narra, prova).
