# 06 — Animação de Texto Cinematográfica

> Família: Texto · Ferramenta: GSAP (web) / Three.js TextGeometry (3D) · Dificuldade: 2-4 · Versão: ambos
> Volta para o [[00-INDEX]]

## O que é

Títulos, lower thirds e tipografia cinética animados — texto que entra com estilo (stagger por letra, blur reveal, clip-path wipe, kinetic typography) ou em 3D extrudado.

**Recria do PixFlow:** TypoKing Title, PX-Kinetype, TypeToon (3D), Glitch Titles, Movie Title Templates, Lower Thirds, Animated Film End Credits.

Duas trilhas: **web/2D** com GSAP (a mais usada) e **3D** com Three.js `TextGeometry`. Para render a vídeo, ambas rodam dentro do pipeline headless (Puppeteer/Remotion → frames → FFmpeg).

---

## 1. GSAP SplitText — stagger por caractere

O padrão da indústria web. `SplitText` quebra o texto em `<span>` por linha/palavra/caractere; aí você anima cada um com `stagger`.

```html
<h1 class="title">Cinema em Código</h1>
```

```javascript
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
gsap.registerPlugin(SplitText);

const split = new SplitText('.title', { type: 'chars, words' });

// blur + translateY + opacity, escalonado por caractere
gsap.from(split.chars, {
  opacity: 0,
  filter: 'blur(12px)',
  yPercent: 120,
  rotateX: -40,            // leve tombo 3D
  transformOrigin: '50% 100%',
  stagger: 0.04,           // atraso entre caracteres
  duration: 0.9,
  ease: 'power3.out',
});
```

**Saída por linha** (mais elegante para frases longas): `type: 'lines'` e anime `split.lines` com `yPercent: 100` dentro de um wrapper com `overflow: hidden` (o texto "sobe" de baixo de uma máscara).

### Params

| Param | Faixa | Efeito |
|---|---|---|
| `stagger` | 0.02–0.08 | Atraso entre elementos. Menor = mais "junto" |
| `blur` | 6–20px | Suavidade da entrada. Alto = etéreo |
| `yPercent` | 60–120 | Distância da subida |
| `ease` | `power3.out`, `expo.out` | Curva. `out` = chega rápido e desacelera (cinema) |

---

## 2. Clip-path reveals

Revelar texto/bloco por máscara animada — sem precisar de SplitText. Ótimo para títulos sólidos e lower thirds.

```css
.reveal {
  /* começa totalmente cortado pela direita */
  clip-path: inset(0 100% 0 0);
  animation: wipe 0.8s cubic-bezier(0.77, 0, 0.175, 1) forwards;
}
@keyframes wipe {
  to { clip-path: inset(0 0% 0 0); }   /* revela da esquerda para a direita */
}
```

Variantes de `inset`: `inset(0 0 100% 0)` (de baixo p/ cima), `inset(100% 0 0 0)` (de cima p/ baixo). Para uma **barra de cor** que passa revelando o texto (efeito "swipe"), anime dois elementos: a barra entra cobrindo, depois sai descobrindo o texto por baixo.

Com GSAP (controle e easing melhores):

```javascript
gsap.fromTo('.reveal',
  { clipPath: 'inset(0 100% 0 0)' },
  { clipPath: 'inset(0 0% 0 0)', duration: 0.8, ease: 'expo.inOut' });
```

---

## 3. Kinetic typography

Texto que se move/escala/rotaciona ritmicamente, geralmente no beat. Em web, GSAP timeline; em vídeo programático, **Remotion** (frame-based, sincroniza com áudio).

### Remotion — escala/pop por palavra na batida

```jsx
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

const Word = ({ text, inFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - inFrame;
  const scale = spring({ frame: local, fps, config: { damping: 12, stiffness: 200 } });
  const opacity = interpolate(local, [0, 6], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <span style={{
      display: 'inline-block',
      transform: `scale(${scale})`,
      opacity,
      fontWeight: 800,
    }}>{text}</span>
  );
};

// dispare cada palavra num beat (timestamps de librosa/visualizeAudio)
const BEATS = [0, 12, 24, 38, 52];
export const Kinetic = ({ words }) => (
  <div style={{ display: 'flex', gap: 16 }}>
    {words.map((w, i) => <Word key={i} text={w} inFrame={BEATS[i] ?? i*12} />)}
  </div>
);
```

`spring()` dá o "pop" elástico que define kinetic typography. Sincronizar `inFrame` com a batida (ver beat-sync em `research/03-cadeia-recomendada.md`) é o que faz parecer profissional.

---

## 4. Glitch text (CSS steps)

Recria Glitch Titles / PX-Glitch no texto. Dois pseudo-elementos duplicam o texto deslocados em ciano/magenta, recortados por `clip-path` que pula em `steps()`.

```css
.glitch { position: relative; color: #fff; font-weight: 800; }
.glitch::before, .glitch::after {
  content: attr(data-text);
  position: absolute; inset: 0;
}
.glitch::before { color: #0ff; animation: gl 2s steps(8) infinite; left: 2px; }
.glitch::after  { color: #f0f; animation: gl 2s steps(8) infinite reverse; left: -2px; }
@keyframes gl {
  0%   { clip-path: inset(0 0 85% 0); }
  20%  { clip-path: inset(40% 0 40% 0); }
  40%  { clip-path: inset(75% 0 5% 0); }
  60%  { clip-path: inset(10% 0 70% 0); }
  80%  { clip-path: inset(55% 0 25% 0); }
}
```

```html
<h1 class="glitch" data-text="GLITCH">GLITCH</h1>
```

Para a versão shader (mais forte), aplique o glitch de [[02-transicoes]] num plano com o texto rasterizado como textura.

---

## 5. Texto 3D com TextGeometry (Three.js)

Recria TypeToon / títulos 3D extrudados, com câmera em dolly revelando profundidade.

```javascript
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

new FontLoader().load('helvetiker_bold.typeface.json', (font) => {
  const geo = new TextGeometry('CINEMA', {
    font, size: 1, depth: 0.3,          // depth = extrusão (era "height" em versões antigas)
    bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.02, bevelSegments: 4,
    curveSegments: 12,
  });
  geo.center();

  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.6, roughness: 0.25 });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  scene.add(new THREE.DirectionalLight(0xffffff, 2).translateX(3).translateY(4));
  scene.add(new THREE.AmbientLight(0xffffff, 0.3));
});
```

Reveal por **câmera dolly** + entrada por letra (anime a posição Z de cada mesh de letra com stagger):

```javascript
// no loop: a câmera aproxima suavemente
const p = Math.min(t / 2, 1);
const e = p*p*(3-2*p);                 // smoothstep
camera.position.z = THREE.MathUtils.lerp(8, 4, e);
mesh.rotation.y = (1 - e) * 0.3;       // termina de frente
```

Para extrudar **por letra** com stagger, gere uma `TextGeometry` por caractere, agrupe num `THREE.Group` e anime `position.y`/`scale` de cada uma com atraso crescente.

---

## Onde aplicar no pipeline

- **Web/artifact:** GSAP/CSS direto no DOM.
- **Vídeo:** texto como camada do **Remotion** (HTML/CSS/GSAP renderizados frame a frame), composto sobre o plano de [[01-parallax-2.5d]]. Ou texto 3D Three.js no mesmo `<Canvas>` da cena.
- **Lower third sobre vídeo:** renderize o texto com fundo transparente (PNG sequence com alpha via Remotion/Puppeteer) e componha no FFmpeg (`overlay`).

---

## Dicas "look cinema"

- **Easing `out` / `expo`** sempre na entrada — chega rápido e assenta devagar. Linear mata o texto.
- **Stagger pequeno + blur** = a entrada "premium" mais usada em abertura de filme. Não exagere o `yPercent`.
- **Hierarquia:** título grande entra primeiro, subtítulo com atraso e mais sutil. Nunca tudo ao mesmo tempo.
- **Saída também importa.** Anime a saída (fade + blur + subida) — texto que some por corte seco parece amador.
- **Sincronize com áudio** (kinetic): cada palavra/letra no beat. É o que diferencia motion design real de "animação genérica".
- **3D com parcimônia.** Texto 3D extrudado tem impacto, mas combine com luz boa (rim light, metalness) ou parece tipografia de PowerPoint. Tempere com grão/LUT ([[04-grain-luts-colorgrade]]).
- **Fonte importa mais que a animação.** Use pesos bold/black, tracking ajustado. Tipografia fraca não se salva com movimento.
