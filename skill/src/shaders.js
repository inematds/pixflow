// Shaders GLSL do motor pixflow-motion — v2.
// v2: o offset da câmera agora TRANSLADA a moldura de verdade (antes só alimentava o
// parallax diferencial ≈0.1×, por isso "pan" mal saía do lugar). Pipeline:
//   rotação (roll/dutch) → zoom → translação global → parallax 2.5D por profundidade
//   (translação E zoom geram displacement diferencial — dolly com sensação de profundidade)
//   → blur direcional (whip pan / crash zoom) → pilha de efeitos.

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
uniform vec2  uOffset;     // translação REAL da moldura (fração do quadro)
uniform float uZoom;       // >1 = aproxima (push-in)
uniform float uRotate;     // roll/dutch em radianos
uniform float uParallax;   // força do parallax 2.5D
uniform float uBlur;       // blur direcional (whip pan / crash zoom), raio em UV

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

vec3 sampleScene(vec2 uv) {
  // parallax 2.5D: depth ~1 = perto, ~0 = longe.
  // anti-fantasma em 2 camadas:
  //  (a) depth SUAVIZADO (5 taps) — transição perto→longe gradual não rasga o contorno;
  //  (b) supressão CIENTE DE BORDA — onde o gradiente de profundidade é alto (contorno
  //      do sujeito), o displacement cai ~85%; profundidade plena fica no céu/fundo/chão.
  vec2 px = 3.0 / uResolution;
  float dC = texture2D(uDepth, clamp(uv, 0.0, 1.0)).r;
  float dR = texture2D(uDepth, clamp(uv + vec2(px.x, 0.0), 0.0, 1.0)).r;
  float dL = texture2D(uDepth, clamp(uv - vec2(px.x, 0.0), 0.0, 1.0)).r;
  float dU = texture2D(uDepth, clamp(uv + vec2(0.0, px.y), 0.0, 1.0)).r;
  float dD = texture2D(uDepth, clamp(uv - vec2(0.0, px.y), 0.0, 1.0)).r;
  float d = (dC * 2.0 + dR + dL + dU + dD) / 6.0;
  float edge = clamp(length(vec2(dR - dL, dU - dD)) * 7.0, 0.0, 1.0);
  float atten = 1.0 - edge * 0.85;
  // diferencial da translação (perto desloca mais) + diferencial do zoom (dolly em profundidade)
  // diferenciais contidos: acima de ~0.7 a borda de profundidade duplica o contorno ("fantasma")
  vec2 disp = (uOffset * 0.7 + (uv - 0.5) * (uZoom - 1.0) * 0.5) * uParallax * (d - 0.5) * atten;
  vec2 suv = clamp(uv + disp, 0.0, 1.0);

  // aberração cromática proporcional ao movimento
  float ca = uChroma * 0.0012; // contido: 0.004 dobrava contornos visivelmente
  vec3 col;
  col.r = texture2D(uImage, clamp(suv + vec2(ca, 0.0), 0.0, 1.0)).r;
  col.g = texture2D(uImage, suv).g;
  col.b = texture2D(uImage, clamp(suv - vec2(ca, 0.0), 0.0, 1.0)).b;
  return col;
}

void main() {
  // 1) rotação (roll) em torno do centro, corrigindo aspecto
  vec2 uv = vUv - 0.5;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  uv.x *= aspect;
  float cs = cos(uRotate), sn = sin(uRotate);
  uv = mat2(cs, -sn, sn, cs) * uv;
  uv.x /= aspect;

  // 2) zoom + 3) translação global da moldura
  uv = uv / uZoom + 0.5 + uOffset;

  // 4) amostra com parallax (+ blur direcional de 5 taps quando uBlur > 0)
  vec3 col;
  if (uBlur > 0.0005) {
    vec2 bdir = vec2(uBlur, 0.0);
    col = sampleScene(uv) * 0.30;
    col += sampleScene(uv + bdir * 0.5) * 0.20;
    col += sampleScene(uv - bdir * 0.5) * 0.20;
    col += sampleScene(uv + bdir) * 0.15;
    col += sampleScene(uv - bdir) * 0.15;
  } else {
    col = sampleScene(uv);
  }

  // 5) exposição + grade simples (lift/gain) + saturação
  col *= uExposure;
  col = col * uGain + uLift;
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(l), col, uSaturation);

  // 6) bloom barato: realça altas luzes
  if (uBloom > 0.0) {
    float hi = smoothstep(0.6, 1.0, l);
    col += hi * uBloom * 0.5;
  }

  // 7) vinheta
  vec2 q = vUv - 0.5;
  float vig = smoothstep(0.95, 0.25, length(q) * 1.35);
  col *= mix(1.0, vig, uVignette);

  // 8) grão de filme
  if (uGrain > 0.0) {
    float g = (hash(vUv * uResolution + fract(uTime)) - 0.5) * uGrain;
    col += g;
  }

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;
