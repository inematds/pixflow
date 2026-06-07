# Biblioteca de Efeitos — Índice Geral

Base de conhecimento para recriar efeitos estilo **PixFlow** em código aberto, **sem geradores de vídeo IA**, transformando imagem estática em vídeo cinematográfico.

**Stack alvo:** Three.js + shaders GLSL (motor) · Depth-Anything-V2 (depth map) · SAM2 (segmentação) · Remotion (orquestrador de timeline) · FFmpeg (encoder final). Modelos de apoio open-source.

> Pipeline de referência (ver `research/03-cadeia-recomendada.md`):
> `Depth-Anything-V2 → (SAM2) → Three.js+GLSL → captura de frames → FFmpeg`,
> com Remotion como camada de sequenciamento/áudio quando há múltiplas cenas.

---

## Legenda

**Dificuldade (1-5):**

| Nível | Significado |
|---|---|
| 1 | Trivial — CSS/JS puro, copy-paste e ajusta |
| 2 | Fácil — shader simples ou filtro pronto |
| 3 | Médio — shader customizado + setup Three.js |
| 4 | Difícil — pipeline com modelo (depth/seg) + shader + tuning |
| 5 | Avançado — múltiplos passos, sincronia, pós-processamento encadeado |

**Versão de uso:**

- **v1 (imagem)** — entrada é foto estática.
- **v2 (vídeo)** — entrada é vídeo (frame a frame, com matting/depth temporal).
- **ambos** — funciona nos dois casos.

---

## Mapa Efeito PixFlow → Família → Técnica → Ferramenta → Receita

| Efeito PixFlow (produto que recria) | Família | Técnica | Ferramenta | Dificuldade | Versão | Receita |
|---|---|---|---|---|---|---|
| Parallax / "dar vida" a foto (AI VibeFX, 3D Ken Burns) | Profundidade | UV displacement por depth map + camera virtual | Depth-Anything-V2 + Three.js/GLSL | 4 | v1 (base p/ ambos) | [[01-parallax-2.5d]] |
| Ken Burns 3D, push-in, dolly, orbit | Profundidade / Câmera | Camera move sobre plano com depth | Three.js | 4 | ambos | [[01-parallax-2.5d]] |
| Bold/Artistic/Smooth Transitions, Brush Stroke, Broken Glass | Transição | Shader transition (GL Transitions) | Three.js/GLSL + Remotion | 3 | ambos | [[02-transicoes]] |
| PX-Glitch, Data Glitch Overlay, Glitch Titles | Transição / Distorção | Slice offset + RGB split | GLSL | 3 | ambos | [[02-transicoes]] |
| Optic FX Prism, aberração cromática | Transição / Distorção | RGB split (sample UV deslocado) | GLSL | 2 | ambos | [[02-transicoes]] |
| Zoom blur / whip pan transitions | Transição | Radial/directional blur acumulado | GLSL | 3 | ambos | [[02-transicoes]] |
| Luminous/Real Light Leak Transitions | Transição / Overlay | Overlay screen + wipe | FFmpeg / GLSL | 2 | ambos | [[02-transicoes]] · [[05-light-leaks-overlays]] |
| Sahara Dust, Sand & Dust Particles, Magical Particle | Partícula | Three.js Points / instancing + shader | Three.js/GLSL | 3 | ambos | [[03-particulas-e-atmosfera]] |
| Action FX (fumaça, faíscas), Bokeh atmosférico | Partícula / Atmosfera | Points additive / sprite + overlay ProRes | Three.js + FFmpeg | 3-4 | ambos | [[03-particulas-e-atmosfera]] |
| Film Emulation Pro, grão de filme, Kodak/Fuji | Color / Textura | Grain procedural (simplex) + LUT 3D | GLSL / FFmpeg lut3d | 3 | ambos | [[04-grain-luts-colorgrade]] |
| Color LUTs (1000+ LUTs cinematic) | Color | LUT 3D (.cube → DataTexture3D / LUTPass) | Three.js / FFmpeg | 3 | ambos | [[04-grain-luts-colorgrade]] |
| Real Light Leaks, Punch Hole/Letterbox Overlays | Overlay | Blend screen/add (WebGL e FFmpeg) | GLSL / FFmpeg | 2 | ambos | [[05-light-leaks-overlays]] |
| TypoKing, PX-Kinetype, Glitch Titles, Movie Title | Texto | SplitText stagger / clip-path / TextGeometry | GSAP / Three.js | 2-4 | ambos | [[06-text-animation]] |
| TypeToon (tipografia 3D) | Texto | TextGeometry 3D + camera dolly | Three.js | 4 | ambos | [[06-text-animation]] |
| Fish Eye / WideVision, heat haze, water ripple, dream warp | Distorção | feTurbulence+feDisplacementMap / noise GLSL | SVG / GLSL | 3 | ambos | [[07-displacement-distorcao]] |
| PX-VHS / PX-CRT (look retrô) | Distorção / Color | Displacement + scanlines + RGB split + grain | GLSL | 3-4 | ambos | [[07-displacement-distorcao]] · [[04-grain-luts-colorgrade]] |

---

## Arquivos da biblioteca

1. [[01-parallax-2.5d]] — Parallax 2.5D a partir de foto: depth map (Depth-Anything-V2) + displacement GLSL + camera moves (push-in, dolly, orbit, Ken Burns 3D).
2. [[02-transicoes]] — Transições: glitch, RGB split, zoom blur, whip pan, dissolve, displacement; encadeamento de cenas.
3. [[03-particulas-e-atmosfera]] — Partículas (poeira, fumaça, faíscas, bokeh) e overlays atmosféricos; simular vs. overlay de vídeo real.
4. [[04-grain-luts-colorgrade]] — Grão de filme procedural, LUT 3D .cube em Three.js, fontes de LUTs grátis.
5. [[05-light-leaks-overlays]] — Light leaks e overlays: blend modes em WebGL e FFmpeg; assets grátis.
6. [[06-text-animation]] — Animação de texto cinematográfica: GSAP SplitText, clip-path, kinetic typography, texto 3D.
7. [[07-displacement-distorcao]] — Displacement/turbulência/distorção: SVG feTurbulence e GLSL com ruído; heat haze, water ripple, dream warp.

---

## Ordem de aprendizado sugerida

1. Comece pelo [[01-parallax-2.5d]] — é o coração do produto ("dar vida à foto").
2. Adicione clima com [[03-particulas-e-atmosfera]].
3. Aplique o "look cinema" com [[04-grain-luts-colorgrade]] e [[05-light-leaks-overlays]].
4. Conecte cenas com [[02-transicoes]] e narre com [[06-text-animation]].
5. Tempere com [[07-displacement-distorcao]] para efeitos especiais (heat haze, VHS, dream).
