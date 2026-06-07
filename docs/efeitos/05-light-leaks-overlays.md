# 05 — Light Leaks e Overlays

> Família: Overlay · Ferramenta: GLSL (blend WebGL) / FFmpeg blend=screen · Dificuldade: 2 · Versão: ambos
> Volta para o [[00-INDEX]]

## O que é

**Light leak** é o vazamento de luz na película (clarões alaranjados/coloridos que entram nas bordas do quadro). **Overlays** em geral são camadas sobrepostas em modo de blending aditivo/screen: leaks, riscos de filme, sujeira de lente, letterbox, punch holes, cue marks.

**Recria do PixFlow:** Real Light Leaks, Luminous Light Leak Transitions, Punch Hole Overlays, Letterbox Film Frame, Cue Marks, Film Frame.

O segredo de todos é o **blend mode**: `screen` ou `add` fazem o preto do overlay sumir e só a luz somar à cena.

---

## A matemática do blend

| Modo | Fórmula | Uso |
|---|---|---|
| **Add** (linear dodge) | `result = base + overlay` | Leaks intensos, faíscas; pode estourar (clamp em 1) |
| **Screen** | `result = 1 - (1-base)*(1-overlay)` | Padrão para light leaks — clareia sem estourar, preto = transparente |

Screen é o mais usado: matematicamente nunca passa de 1.0, então preserva detalhe nas altas-luzes.

---

## Caminho 1 — Overlay via WebGL (Three.js)

Para integrar o leak na mesma cadeia do parallax/grão, blendando dentro do shader.

### Light leak como vídeo/textura sobreposta

```glsl
// leak.frag — pós-processamento: cena (tDiffuse) + leak (uLeak)
precision highp float;
uniform sampler2D tDiffuse;   // cena renderizada
uniform sampler2D uLeak;      // frame do light leak (footage sobre preto, ou gradiente)
uniform float uIntensity;     // 0.0 .. 1.0
varying vec2 vUv;

vec3 screen(vec3 a, vec3 b){ return 1.0 - (1.0 - a) * (1.0 - b); }

void main(){
  vec3 base = texture2D(tDiffuse, vUv).rgb;
  vec3 leak = texture2D(uLeak, vUv).rgb * uIntensity;
  gl_FragColor = vec4(screen(base, leak), 1.0);
}
```

Setup como `ShaderPass` (a textura `uLeak` pode ser um `THREE.VideoTexture` de um clipe de leak):

```javascript
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const video = document.createElement('video');
video.src = 'lightleak.mp4'; video.loop = true; video.muted = true; video.play();
const leakTex = new THREE.VideoTexture(video);

const leakPass = new ShaderPass({
  uniforms: {
    tDiffuse:   { value: null },
    uLeak:      { value: leakTex },
    uIntensity: { value: 0.6 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: leakFrag,
});
composer.addPass(leakPass);   // ANTES do grão, DEPOIS da LUT (ver ordem em [[04-grain-luts-colorgrade]])
```

### Light leak PROCEDURAL (sem asset)

Quando não quer footage: um clarão animado gerado em GLSL (gradiente radial colorido pulsando nas bordas).

```glsl
// procedural leak — adicionar dentro do leak.frag no lugar de texture2D(uLeak,...)
uniform float uTime;
vec3 proceduralLeak(vec2 uv){
  // foco do leak entra pela borda, oscilando
  vec2 src = vec2(1.1 + 0.1*sin(uTime*0.5), 0.3 + 0.4*sin(uTime*0.3));
  float d = distance(uv, src);
  float glow = smoothstep(0.9, 0.0, d);            // clarão
  glow *= 0.5 + 0.5 * sin(uTime * 0.8);            // pulsação
  vec3 tint = vec3(1.0, 0.55, 0.2);                 // laranja quente
  return tint * glow;
}
```

Use `screen(base, proceduralLeak(vUv) * uIntensity)`. Varie `src` e `tint` para leaks diferentes (azul frio, magenta, branco estourado).

---

## Caminho 2 — Overlay via FFmpeg (blend=screen)

O jeito mais direto quando você já tem o vídeo da cena e um clipe de leak (footage real sobre fundo preto, ex.: ProRes do Mixkit/ResourceBoy).

```bash
# leak somado em screen sobre a cena, com opacidade controlada
ffmpeg -i cena.mp4 -i lightleak.mov -filter_complex \
  "[1:v]format=rgba,colorchannelmixer=aa=0.7,scale=1920:1080[lk]; \
   [0:v][lk]blend=all_mode=screen" \
  -c:v libx264 -crf 18 -pix_fmt yuv420p out.mp4
```

- `all_mode=screen` — o blend correto para leaks.
- `colorchannelmixer=aa=0.7` — reduz a intensidade do leak (alpha global).
- `scale` — garante que o leak case com a resolução da cena.

**Add em vez de screen** (mais estourado): `all_mode=addition`.

**Light leak como transição** (entra no corte entre cenas): faça o leak cobrir o quadro inteiro (clarão branco) exatamente no ponto de corte — ver encadeamento em [[02-transicoes]].

### Letterbox / film frame / punch holes

Esses overlays geralmente têm alpha (PNG/ProRes 4444). Sobreponha em modo normal respeitando o alpha:

```bash
ffmpeg -i cena.mp4 -i letterbox.png -filter_complex "[0][1]overlay=0:0" out.mp4
```

Ou letterbox puro sem asset (barras 2.39:1):

```bash
ffmpeg -i cena.mp4 -vf "drawbox=y=0:h=ih*0.11:c=black:t=fill, \
  drawbox=y=ih*0.89:h=ih*0.11:c=black:t=fill" out.mp4
```

---

## Caminho 3 — Web simples (CSS mix-blend-mode)

Sem WebGL nem FFmpeg, para páginas/artifacts:

```html
<div class="scene">
  <img src="foto.jpg">
  <video class="leak" src="lightleak.mp4" autoplay loop muted></video>
</div>
```

```css
.scene { position: relative; overflow: hidden; }
.leak {
  position: absolute; inset: 0;
  width: 100%; height: 100%; object-fit: cover;
  mix-blend-mode: screen;     /* preto do leak some, luz soma */
  opacity: 0.7;
  pointer-events: none;
}
```

---

## Fontes de assets grátis

| Fonte | O que tem | Link |
|---|---|---|
| **Mixkit** | 50+ light leaks 4K, sem watermark, sem conta | mixkit.co |
| **ResourceBoy** | 250+ light leak overlays 8K, download grátis | resourceboy.com |
| **Enchanted Media** | Light leaks overlay grátis | enchanted.media |
| **Motion Array** | Leaks/overlays no tier gratuito | motionarray.com |
| **Pexels / Videvo** | Stock de overlays royalty-free | pexels.com · videvo.net |

Lista completa e notas em `research/02-tecnicas-e-acesso.md`.

Footage para blend **screen** deve ser filmado/exportado sobre **fundo preto**. Se o asset tiver alpha real (ProRes 4444 / PNG sequence), use overlay normal respeitando o alpha.

---

## Parâmetros e dicas "look cinema"

| Param | Faixa | Efeito |
|---|---|---|
| Intensidade (`uIntensity` / `aa` / opacity) | 0.4–0.8 | Quanto o leak aparece. Acima disso lava a imagem |
| Posição do clarão | borda | Leaks entram pelas bordas/cantos, raramente pelo centro |
| Cor (tint) | laranja/dourado | Quente é o clássico de película; frio para sci-fi |
| Timing | picos curtos | Leaks pulsam, não ficam constantes |

- **Sutileza.** Um leak suave nas sombras dá calor de película; um leak forte vira "filtro de Instagram 2014". Mantenha 0.4–0.7.
- **Quente combina com pele.** Leaks dourados/alaranjados nas bordas valorizam retratos e a hora dourada.
- **Pulse, não trave.** Leak constante denuncia overlay. Anime intensidade/posição (procedural) ou use footage que já oscila.
- **Use também como transição.** Um clarão branco no ponto de corte esconde a emenda entre cenas ([[02-transicoes]]).
- **Ordem na pilha:** LUT → light leak → grão (ver [[04-grain-luts-colorgrade]]). Leak entra sobre a imagem já corrigida; grão por cima de tudo.
