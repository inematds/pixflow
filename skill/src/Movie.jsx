import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate, Audio, staticFile } from 'remotion';
import { ParallaxCanvas } from './ParallaxCanvas.jsx';
import { Caption } from './Caption.jsx';
import { computeLayout } from './layout.js';

// fade de entrada (crossfade / dip_to_black) controlado dentro da Sequence (frame local)
const SceneWrapper = ({ scene }) => {
  const frame = useCurrentFrame();
  const f = scene.fadeInFrames;
  let opacity = 1;
  if (f > 0 && scene.transitionIn !== 'cut') {
    opacity = interpolate(frame, [0, f], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  }
  return (
    <AbsoluteFill style={{ opacity, backgroundColor: 'black' }}>
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

// overlay preto para dip_to_black: escurece no fim da cena anterior
const DipToBlack = ({ fromFrame, durationFrames }) => (
  <Sequence from={fromFrame} durationInFrames={durationFrames} layout="none">
    <AbsoluteFill style={{ backgroundColor: 'black' }} />
  </Sequence>
);

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
