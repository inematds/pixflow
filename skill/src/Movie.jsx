import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate, Audio, staticFile } from 'remotion';
import { ParallaxCanvas } from './ParallaxCanvas.jsx';
import { Caption } from './Caption.jsx';
import { computeLayout } from './layout.js';

// fade de entrada (crossfade) controlado dentro da Sequence (frame local).
// IMPORTANTE: sem backgroundColor aqui — fundo preto no wrapper escurecia a cena
// de trás durante o fade ("pulso de brilho" em toda troca). Crossfade verdadeiro:
// a cena que entra sobe a opacidade SOBRE a anterior, sem véu preto no meio.
const SceneWrapper = ({ scene }) => {
  const frame = useCurrentFrame();
  const f = scene.fadeInFrames;
  const tIn = scene.transitionIn;
  let opacity = 1, transform, filter;
  if (f > 0 && tIn && tIn !== 'cut') {
    const t = interpolate(frame, [0, f], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const ease = 1 - Math.pow(1 - t, 3); // expo-out: chega rápido, assenta suave
    if (tIn === 'whip' || tIn === 'whip_left') {
      // chicote: a cena nova varre por cima da anterior com motion blur
      const dir = tIn === 'whip_left' ? -1 : 1;
      transform = `translateX(${dir * (1 - ease) * 70}%)`;
      filter = `blur(${(1 - ease) * 22}px)`;
      opacity = Math.min(1, t * 4);
    } else if (tIn === 'zoom_blur') {
      // mergulho: a cena nova chega "caindo" de um zoom borrado
      transform = `scale(${1.45 - 0.45 * ease})`;
      filter = `blur(${(1 - ease) * 16}px)`;
      opacity = Math.min(1, t * 4);
    } else {
      // crossfade / dip_to_black: fade simples (sem fundo — ver dica nº 2)
      opacity = t;
    }
  }
  return (
    <AbsoluteFill style={{ opacity, transform, filter }}>
      <ParallaxCanvas
        image={scene.image}
        depth={scene.depth}
        camera={scene.camera}
        effects={scene.effects}
        durationInFrames={scene.durationFrames}
      />
      {scene.caption && (
        <Caption caption={scene.caption} durationInFrames={scene.durationFrames + scene.fadeInFrames} />
      )}
    </AbsoluteFill>
  );
};

// overlay preto para dip_to_black: FADE real (escurece → preto → clareia),
// não um flash preto instantâneo.
const DipToBlack = ({ fromFrame, durationFrames }) => {
  const frame = useCurrentFrame();
  const local = frame - fromFrame;
  const half = Math.max(1, Math.floor(durationFrames / 2));
  const opacity = interpolate(local, [0, half, durationFrames], [0, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <Sequence from={fromFrame} durationInFrames={durationFrames} layout="none">
      <AbsoluteFill style={{ backgroundColor: 'black', opacity }} />
    </Sequence>
  );
};

export const Movie = ({ spec }) => {
  const { fps } = useVideoConfig();
  const layout = computeLayout(spec, fps);
  const audio = spec.audio || {};

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {layout.scenes.map((scene, i) => {
        const total = scene.durationFrames + scene.fadeInFrames;
        return (
          <Sequence key={scene.id} from={scene.fromFrame} durationInFrames={total} name={scene.id}>
            <SceneWrapper scene={scene} />
          </Sequence>
        );
      })}
      {audio.track && (
        <Audio src={staticFile(audio.track)} volume={audio.volume ?? 1} />
      )}
    </AbsoluteFill>
  );
};
