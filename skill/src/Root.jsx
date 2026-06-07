import React from 'react';
import { Composition } from 'remotion';
import { Movie } from './Movie.jsx';
import { computeLayout } from './layout.js';

const EMPTY_SPEC = {
  output: { resolution: '1920x1080', fps: 30 },
  scenes: [{ id: 'placeholder', image: 'placeholder.png', duration: 4, camera: { type: 'push_in' } }],
};

export const RemotionRoot = () => {
  return (
    <Composition
      id="Movie"
      component={Movie}
      defaultProps={{ spec: EMPTY_SPEC }}
      // dimensões e duração derivam do movie spec recebido via --props
      calculateMetadata={({ props }) => {
        const spec = props.spec || EMPTY_SPEC;
        const L = computeLayout(spec);
        return {
          width: L.width,
          height: L.height,
          fps: L.fps,
          durationInFrames: L.durationInFrames,
          props,
        };
      }}
    />
  );
};
