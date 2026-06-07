// Shaders GLSL do motor pixflow-motion.
// Parallax 2.5D por displacement de UV proporcional ao depth + pilha de efeitos cinematográficos.

export const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export const FRAG = `
precision highp float;
varying vec2 vUv;

uniform sampler2D uImage;
uniform sampler2D uDepth;
uniform vec2  uResolution;
uniform float uTime;

// câmera / parallax
uniform vec2  uOffset;     // deslocamento da câmera (normalizado)
uniform float uZoom;       // >1 = aproxima (push-in)
uniform float uParallax;   // força do parallax 2.5D

// efeitos (0 = desligado)
uniform float uGrain;
uniform float uVignette;
uniform float uChroma;     // aberração cromática
uniform float uExposure;
uniform float uSaturation;
uniform vec3  uLift;       // grade: sombras
uniform vec3  uGain;       // grade: ganho geral
uniform float uBloom;      // glow suave nas altas luzes

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

vec2 zoomUv(vec2 uv, float z){ return (uv - 0.5) / z + 0.5; }

void main() {
  // 1) zoom (push-in / ken burns)
  vec2 uv = zoomUv(vUv, uZoom);

  // 2) parallax 2.5D: desloca por profundidade. depth ~1 = perto, ~0 = longe.
  float d = texture2D(uDepth, uv).r;
  vec2 disp = uOffset * uParallax * (d - 0.5);
  vec2 suv = clamp(uv + disp, 0.0, 1.0);

  // 3) aberração cromática proporcional ao movimento
  float ca = uChroma * 0.004;
  vec3 col;
  col.r = texture2D(uImage, clamp(suv + vec2(ca, 0.0), 0.0, 1.0)).r;
  col.g = texture2D(uImage, suv).g;
  col.b = texture2D(uImage, clamp(suv - vec2(ca, 0.0), 0.0, 1.0)).b;

  // 4) exposição + grade simples (lift/gain) + saturação
  col *= uExposure;
  col = col * uGain + uLift;
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(l), col, uSaturation);

  // 5) bloom barato: realça altas luzes
  if (uBloom > 0.0) {
    float hi = smoothstep(0.6, 1.0, l);
    col += hi * uBloom * 0.5;
  }

  // 6) vinheta
  vec2 q = vUv - 0.5;
  float vig = smoothstep(0.95, 0.25, length(q) * 1.35);
  col *= mix(1.0, vig, uVignette);

  // 7) grão de filme
  if (uGrain > 0.0) {
    float g = (hash(vUv * uResolution + fract(uTime)) - 0.5) * uGrain;
    col += g;
  }

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;
