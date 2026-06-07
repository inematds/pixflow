# 02 — Transições Cinematográficas

> Família: Transição · Ferramenta: Three.js/GLSL + Remotion · Dificuldade: 2-3 · Versão: ambos
> Volta para o [[00-INDEX]]

## O que é

Transições conectam duas cenas (ou dois planos de [[01-parallax-2.5d]]) com um efeito visual em vez de um corte seco. O padrão da indústria open-source é **[GL Transitions](https://gl-transitions.com/)**: cada transição é um fragment shader que recebe duas texturas (`from`, `to`) e um `progress` 0→1 e retorna o pixel misturado.

**Recria do PixFlow:** Bold/Artistic/Smooth Transitions, Brush Stroke, Broken Glass, Glitch Titles, Optic FX Prism, Luminous Light Leak Transitions.

## Convenção GL Transitions

Todo shader desta página segue a assinatura do GL Transitions:

```glsl
// uniforms padrão (declarados uma vez no host)
uniform sampler2D from;     // cena de saída
uniform sampler2D to;       // cena de entrada
uniform float progress;     // 0.0 = só "from", 1.0 = só "to"
uniform float ratio;        // aspect ratio (largura/altura)
varying vec2 vUv;

vec4 getFromColor(vec2 uv){ return texture2D(from, uv); }
vec4 getToColor(vec2 uv){ return texture2D(to, uv); }

// cada transição implementa:
vec4 transition(vec2 uv);

void main(){ gl_FragColor = transition(vUv); }
```

> Helper de ruído usado por vários shaders abaixo:
> ```glsl
> float rand(vec2 c){ return fract(sin(dot(c, vec2(12.9898,78.233)))*43758.5453); }
> ```

---

## 1. Glitch (digital corruption)

**Técnica:** divide a imagem em faixas horizontais; desloca cada faixa em X por um valor aleatório que cresce no meio da transição; soma RGB split. Recria PX-Glitch / Data Glitch Overlay.

```glsl
// progress 0..1; pico de corrupção em progress=0.5
float rand(vec2 c){ return fract(sin(dot(c, vec2(12.9898,78.233)))*43758.5453); }

vec4 transition(vec2 uv){
  // força do glitch: sobe e desce (sino) ao longo da transição
  float amt = sin(progress * 3.14159) * 0.08;

  // faixas horizontais: ~24 blocos
  float band = floor(uv.y * 24.0);
  float jitter = (rand(vec2(band, floor(progress * 30.0))) - 0.5) * 2.0 * amt;

  vec2 guv = vec2(uv.x + jitter, uv.y);

  // mistura from/to com hard cut por banda (algumas faixas já mostram "to")
  float swap = step(rand(vec2(band, 7.0)), progress);
  vec4 base = mix(getFromColor(guv), getToColor(guv), swap);

  // RGB split proporcional ao glitch
  float s = amt * 0.5;
  float r = mix(getFromColor(guv + vec2(s,0.0)), getToColor(guv + vec2(s,0.0)), swap).r;
  float b = mix(getFromColor(guv - vec2(s,0.0)), getToColor(guv - vec2(s,0.0)), swap).b;
  return vec4(r, base.g, b, 1.0);
}
```

**Params:** amplitude `0.08` (força), `24.0` (nº de faixas), `30.0` (velocidade do jitter). Mais faixas = glitch mais "digital".

## 2. RGB Split (aberração cromática)

**Técnica:** amostra cada canal numa UV ligeiramente deslocada. Recria Optic FX Prism. Pode ser transição (separar e juntar) ou efeito de cena.

```glsl
vec4 transition(vec2 uv){
  // separação máxima no meio, zero nas pontas
  float spread = sin(progress * 3.14159) * 0.02;
  vec2 dir = normalize(uv - 0.5);      // separa radialmente a partir do centro

  vec4 cur = mix(getFromColor(uv), getToColor(uv), progress);
  float r = mix(getFromColor(uv + dir*spread),     getToColor(uv + dir*spread),     progress).r;
  float b = mix(getFromColor(uv - dir*spread),     getToColor(uv - dir*spread),     progress).b;
  return vec4(r, cur.g, b, 1.0);
}
```

**Versão "efeito de cena" (sem `to`):** troque `mix(...)` por `getFromColor(...)` e controle `spread` por um uniform `uIntensity`. Bom para acentos rítmicos na batida (beat-sync via Remotion).

## 3. Zoom Blur (radial blur)

**Técnica:** acumula N amostras ao longo de um vetor radial saindo do centro. Recria as zoom transitions. Dá impacto/energia.

```glsl
vec4 transition(vec2 uv){
  vec2 dir = uv - 0.5;
  float strength = sin(progress * 3.14159) * 0.5;   // 0 → 0.5 → 0
  vec4 acc = vec4(0.0);
  const int N = 16;
  for(int i = 0; i < N; i++){
    float t = float(i) / float(N);
    vec2 suv = uv - dir * strength * t;
    acc += mix(getFromColor(suv), getToColor(suv), progress);
  }
  return acc / float(N);
}
```

**Params:** `strength` (intensidade do borrão), `N` (qualidade vs. custo — 16 é bom equilíbrio). Centro do zoom em `0.5,0.5`; mova para focar outra parte.

## 4. Whip Pan

**Técnica:** motion blur direcional horizontal intenso, simulando giro brusco de câmera. A imagem "from" sai borrando para um lado e "to" entra borrando do outro.

```glsl
uniform float angle;   // 0.0 = horizontal (pan p/ esquerda)
vec4 transition(vec2 uv){
  vec2 d = vec2(cos(angle), sin(angle));
  float blur = sin(progress * 3.14159) * 0.25;   // pico no meio
  vec4 acc = vec4(0.0);
  const int N = 20;
  for(int i = 0; i < N; i++){
    float t = (float(i)/float(N) - 0.5) * blur;
    // primeira metade mostra "from" deslizando; segunda mostra "to"
    vec4 c = progress < 0.5
      ? getFromColor(uv + d * (t + progress * 0.5))
      : getToColor(uv + d * (t - (1.0 - progress) * 0.5));
    acc += c;
  }
  return acc / float(N);
}
```

**Dica look cinema:** combine com um som de whoosh (a biblioteca de SFX do PixFlow tem isso; equivalente grátis em Mixkit). Use easing agressivo no `progress` (ex.: `power4.in` na entrada).

## 5. Dissolve

**Técnica:** mistura por limiar de ruído — pixels "trocam" individualmente conforme o ruído fica abaixo do progress. Mais orgânico que um crossfade linear.

```glsl
float rand(vec2 c){ return fract(sin(dot(c, vec2(12.9898,78.233)))*43758.5453); }
vec4 transition(vec2 uv){
  float n = rand(uv);
  // borda suave de ~0.1 em torno do limiar
  float m = smoothstep(n - 0.05, n + 0.05, progress);
  return mix(getFromColor(uv), getToColor(uv), m);
}
```

Para dissolve mais "filme", troque `rand(uv)` por uma textura de grão/nuvem (Perlin) amostrada — ver ruído em [[07-displacement-distorcao]].

## 6. Displacement Transition

**Técnica:** usa uma textura de ruído/mapa para empurrar as UVs; a primeira cena "derrete" e a segunda "emerge". É a base das Brush Stroke / Broken Glass / Paper Burn do PixFlow (troque o mapa de displacement pelo desenho da pincelada/rachadura).

```glsl
uniform sampler2D dispMap;   // textura: pincelada, rachadura, nuvem...
uniform float strength;      // ex: 0.4

vec4 transition(vec2 uv){
  float disp = texture2D(dispMap, uv).r;

  // "from" é empurrada para fora conforme progress sobe
  vec2 uvFrom = uv + progress * disp * strength * vec2(1.0, 0.0);
  // "to" vem do lado oposto, chegando ao lugar
  vec2 uvTo   = uv - (1.0 - progress) * disp * strength * vec2(1.0, 0.0);

  // a máscara segue o próprio mapa: revela "to" onde disp < progress
  float m = smoothstep(disp - 0.1, disp + 0.1, progress);
  return mix(getFromColor(uvFrom), getToColor(uvTo), m);
}
```

**Trocar o "feel":** o `dispMap` decide tudo. Pincelada → brush transition. Mapa de cacos → broken glass. Mapa de bordas queimadas + tint laranja → paper burn.

---

## Como encadear cenas

### Opção A — Remotion (recomendado p/ timeline e áudio)

Remotion orquestra timing e áudio; cada cena pode ser um `<Canvas>` Three.js (ou imagem). Use `@remotion/transitions` para sequenciar, ou conduza um shader manualmente via `progress = (frame - inStart) / durFrames`.

```jsx
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from 'remotion';

const T = 20;  // frames de transição

const Show = () => {
  const frame = useCurrentFrame();
  // cena A: frames 0..120 ; cena B: 100..220 (sobrepõem 20 frames = transição)
  return (
    <AbsoluteFill>
      <Sequence from={0}   durationInFrames={120}><SceneA /></Sequence>
      <Sequence from={100} durationInFrames={120}>
        <TransitionShader
          progress={interpolate(frame, [100, 100 + T], [0, 1], { extrapolateRight: 'clamp' })}
        />
        <SceneB />
      </Sequence>
    </AbsoluteFill>
  );
};
```

O segredo é a **sobreposição** (overlap) das `Sequence`: durante esses frames, o shader recebe `from` (último frame de A) e `to` (primeiro de B) e anima `progress`.

### Opção B — FFmpeg `xfade` (rápido, transições básicas)

Para crossfade/wipe/slide simples sem shader próprio:

```bash
ffmpeg -i a.mp4 -i b.mp4 -filter_complex \
  "[0][1]xfade=transition=fade:duration=1:offset=4" out.mp4
# transitions: fade, wipeleft, slideup, circleopen, dissolve, pixelize, radial...
```

`xfade` não cobre glitch/whip customizados — para esses use os shaders acima dentro do pipeline Three.js → frames → FFmpeg.

---

## Parâmetros e dicas "look cinema"

| Transição | Param-chave | Faixa | Look |
|---|---|---|---|
| Glitch | amplitude | 0.05–0.12 | digital/agressivo |
| RGB split | spread | 0.01–0.03 | sutil = chique; alto = trash retrô |
| Zoom blur | strength | 0.3–0.6 | impacto, energia |
| Whip pan | blur | 0.2–0.35 | ritmo rápido, ação |
| Dissolve | borda smoothstep | 0.03–0.1 | suave, documental |
| Displacement | strength + mapa | 0.2–0.5 | artístico, depende do mapa |

- **Duração:** transições "energéticas" (glitch, whip, zoom) curtas — 8 a 15 frames a 30fps. Dissolve/displacement podem durar mais (20–40 frames).
- **Sincronize com a batida:** corte/transicione no beat. Remotion lê BPM via `visualizeAudio`; ou gere timestamps com `librosa` e dispare `progress` neles.
- **Não abuse de variedade:** escolha 2-3 transições e seja consistente — isso dá identidade. Misturar dez tipos parece amador.
- **Encadeie com som:** cada transição pede um whoosh/impact (ver biblioteca SFX). O áudio "vende" o corte mais que o visual.
