// Gera imagens de teste com planos separados (céu, montanhas, foreground) — boas p/ parallax.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

function svgScene({ sky1, sky2, mount, fg, sun }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${sky1}"/><stop offset="100%" stop-color="${sky2}"/>
    </linearGradient>
    <radialGradient id="sun" cx="50%" cy="40%" r="20%">
      <stop offset="0%" stop-color="${sun}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${sun}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#sky)"/>
  <circle cx="640" cy="280" r="260" fill="url(#sun)"/>
  <circle cx="640" cy="280" r="80" fill="${sun}"/>
  <path d="M0 520 L220 360 L420 480 L640 320 L880 470 L1080 360 L1280 510 L1280 720 L0 720 Z" fill="${mount}" opacity="0.85"/>
  <path d="M0 620 L300 520 L560 600 L820 500 L1080 590 L1280 540 L1280 720 L0 720 Z" fill="${fg}"/>
  <ellipse cx="320" cy="700" rx="120" ry="60" fill="#000" opacity="0.5"/>
  <rect x="900" y="560" width="40" height="160" fill="#0a0a0a"/>
  <circle cx="920" cy="540" r="40" fill="#111"/>
</svg>`;
}

const scenes = {
  cena1: { sky1: '#1a2a6c', sky2: '#fdbb2d', mount: '#2a2440', fg: '#0d0b1a', sun: '#ffd27a' },
  cena2: { sky1: '#0f2027', sky2: '#2c5364', mount: '#16323b', fg: '#08151a', sun: '#7fd8e8' },
};

const outDir = resolve(process.argv[2] || 'examples/assets');
mkdirSync(outDir, { recursive: true });
for (const [name, c] of Object.entries(scenes)) {
  const buf = Buffer.from(svgScene(c));
  await sharp(buf).png().toFile(resolve(outDir, `${name}.png`));
  console.log('gerado:', resolve(outDir, `${name}.png`));
}
