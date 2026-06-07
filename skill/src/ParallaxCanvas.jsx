import React, { useRef, useEffect, useCallback } from 'react';
import { useCurrentFrame, useVideoConfig, delayRender, continueRender, staticFile } from 'remotion';
import { VERT, FRAG } from './shaders.js';
import { cameraAt } from './camera.js';

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error('Shader compile error: ' + gl.getShaderInfoLog(s));
  }
  return s;
}

function makeTexture(gl, img) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return tex;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Falha ao carregar ' + src));
    img.src = src;
  });
}

// Motor WebGL: 1 imagem + 1 depth map -> parallax 2.5D + efeitos, por cena.
export const ParallaxCanvas = ({ image, depth, camera, effects, durationInFrames }) => {
  const canvasRef = useRef(null);
  const glRef = useRef(null);
  const stateRef = useRef(null); // { program, locs, imgTex, depthTex }
  const [handle] = React.useState(() => delayRender('Carregando texturas do pixflow'));
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // init uma vez
  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, antialias: true });
    if (!gl) { continueRender(handle); throw new Error('WebGL indisponível'); }
    glRef.current = gl;

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error('Link error: ' + gl.getProgramInfoLog(prog));
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const U = (n) => gl.getUniformLocation(prog, n);
    const locs = {
      uImage: U('uImage'), uDepth: U('uDepth'), uResolution: U('uResolution'), uTime: U('uTime'),
      uOffset: U('uOffset'), uZoom: U('uZoom'), uParallax: U('uParallax'),
      uGrain: U('uGrain'), uVignette: U('uVignette'), uChroma: U('uChroma'),
      uExposure: U('uExposure'), uSaturation: U('uSaturation'),
      uLift: U('uLift'), uGain: U('uGain'), uBloom: U('uBloom'),
    };

    Promise.all([loadImage(staticFile(image)), loadImage(staticFile(depth))])
      .then(([imgEl, depthEl]) => {
        if (cancelled) return;
        const imgTex = makeTexture(gl, imgEl);
        const depthTex = makeTexture(gl, depthEl);
        stateRef.current = { program: prog, locs, imgTex, depthTex };
        continueRender(handle);
      })
      .catch((err) => { continueRender(handle); throw err; });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const draw = useCallback(() => {
    const gl = glRef.current;
    const st = stateRef.current;
    if (!gl || !st) return;
    const { locs, imgTex, depthTex } = st;

    gl.viewport(0, 0, width, height);
    gl.useProgram(st.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, imgTex);
    gl.uniform1i(locs.uImage, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, depthTex);
    gl.uniform1i(locs.uDepth, 1);

    const progress = durationInFrames > 1 ? frame / (durationInFrames - 1) : 0;
    const cam = cameraAt(progress, camera);
    const e = effects;

    gl.uniform2f(locs.uResolution, width, height);
    gl.uniform1f(locs.uTime, frame * 0.137);
    gl.uniform2f(locs.uOffset, cam.offset[0], cam.offset[1]);
    gl.uniform1f(locs.uZoom, cam.zoom);
    gl.uniform1f(locs.uParallax, e.parallax ?? 0.1);
    gl.uniform1f(locs.uGrain, e.grain ?? 0);
    gl.uniform1f(locs.uVignette, e.vignette ?? 0);
    gl.uniform1f(locs.uChroma, e.chroma ?? 0);
    gl.uniform1f(locs.uExposure, e.exposure ?? 1);
    gl.uniform1f(locs.uSaturation, e.saturation ?? 1);
    gl.uniform3fv(locs.uLift, e.lift ?? [0, 0, 0]);
    gl.uniform3fv(locs.uGain, e.gain ?? [1, 1, 1]);
    gl.uniform1f(locs.uBloom, e.bloom ?? 0);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }, [frame, width, height, camera, effects, durationInFrames]);

  // desenha a cada frame (após o commit). preserveDrawingBuffer garante a captura.
  useEffect(() => { draw(); }, [draw]);

  return <canvas ref={canvasRef} width={width} height={height} style={{ width: '100%', height: '100%' }} />;
};
