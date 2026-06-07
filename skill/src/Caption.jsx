import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

// Legenda cinematográfica por cena: número, kicker, título e corpo, com scrim e animação rise+fade.
// caption: { number, kicker, title, body, position: 'bottom'|'center'|'top', align: 'left'|'center', accent }
export const Caption = ({ caption, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  if (!caption || (!caption.title && !caption.body && !caption.kicker)) return null;

  const pos = caption.position || 'bottom';
  const align = caption.align || 'left';
  const accent = caption.accent || '#ffb347';

  const inDur = Math.round(fps * 0.6);
  const outStart = durationInFrames - Math.round(fps * 0.5);
  const appear = spring({ frame, fps, config: { damping: 200 }, durationInFrames: inDur });
  const out = interpolate(frame, [outStart, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = Math.min(appear, out);
  const rise = interpolate(appear, [0, 1], [40, 0]);

  const u = height / 1080; // escala relativa à resolução
  const justify = pos === 'center' ? 'center' : pos === 'top' ? 'flex-start' : 'flex-end';
  const items = align === 'center' ? 'center' : 'flex-start';
  const textAlign = align === 'center' ? 'center' : 'left';

  const scrimStyle = pos === 'bottom'
    ? { background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 35%, rgba(0,0,0,0) 70%)' }
    : pos === 'top'
      ? { background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 60%)' }
      : { background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0) 100%)' };

  return (
    <AbsoluteFill style={{ justifyContent: justify, alignItems: 'stretch', padding: `${90 * u}px ${110 * u}px` }}>
      <AbsoluteFill style={scrimStyle} />
      <div style={{
        position: 'relative', display: 'flex', flexDirection: 'column', alignItems: items,
        textAlign, opacity, transform: `translateY(${rise}px)`,
        fontFamily: 'Inter, "Helvetica Neue", Arial, sans-serif', color: '#fff',
        maxWidth: align === 'center' ? '85%' : '70%', alignSelf: align === 'center' ? 'center' : 'flex-start',
      }}>
        {caption.number != null && (
          <div style={{ fontSize: 130 * u, fontWeight: 800, lineHeight: 0.9, color: accent, opacity: 0.95, marginBottom: 6 * u, letterSpacing: -2 }}>
            {String(caption.number).padStart(2, '0')}
          </div>
        )}
        {caption.kicker && (
          <div style={{ fontSize: 26 * u, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', color: accent, marginBottom: 14 * u }}>
            {caption.kicker}
          </div>
        )}
        {caption.title && (
          <div style={{ fontSize: 62 * u, fontWeight: 800, lineHeight: 1.05, textShadow: '0 4px 30px rgba(0,0,0,0.6)' }}>
            {caption.title}
          </div>
        )}
        {caption.body && (
          <div style={{ fontSize: 30 * u, fontWeight: 400, lineHeight: 1.4, marginTop: 18 * u, color: 'rgba(255,255,255,0.86)', maxWidth: 900 * u, textShadow: '0 2px 16px rgba(0,0,0,0.7)' }}>
            {caption.body}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
