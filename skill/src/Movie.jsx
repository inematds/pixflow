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
  let opacity = 1;
  if (f > 0 && scene.transitionIn !== 'cut') {
    opacity = interpolate(frame, [0, f], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  }
  return (
    <AbsoluteFill style={{ opacity }}>
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
