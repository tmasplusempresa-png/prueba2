/* global __dirname */
/**
 * Genera íconos del mapa de navegación del conductor:
 *  - nav-glow-ring.png: anillo brillante que rodea location-circle.png (88px → lienzo 132px, mismo centro).
 *  - route-turn-arrow(@2x,@3x).png: flecha blanca de giro que va dentro de la línea de ruta.
 *
 * Uso: node scripts/gen-map-icons.js
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const OUT_DIR = path.join(__dirname, '..', 'assets', 'images', 'icon-map-vector');

function writePng(name, size, pixelFn) {
  const png = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixelFn(x + 0.5, y + 0.5, size);
      const i = (y * size + x) * 4;
      png.data[i] = r;
      png.data[i + 1] = g;
      png.data[i + 2] = b;
      png.data[i + 3] = Math.round(Math.max(0, Math.min(1, a)) * 255);
    }
  }
  fs.writeFileSync(path.join(OUT_DIR, name), PNG.sync.write(png));
  console.log('ok', name);
}

// Anillo: borde nítido justo fuera del círculo del puck + halo que se desvanece.
const PUCK_RADIUS = 43; // radio visible de location-circle.png (88px)
writePng('nav-glow-ring.png', 132, (x, y, size) => {
  const c = size / 2;
  const r = Math.hypot(x - c, y - c);
  const edge = Math.max(0, 1 - Math.abs(r - (PUCK_RADIUS + 1.5)) / 2.2);
  const glow = r > PUCK_RADIUS ? Math.exp(-Math.pow((r - PUCK_RADIUS) / 9, 2)) * 0.75 : 0;
  const a = Math.max(edge, glow);
  const white = edge * 0.55; // núcleo del borde más claro
  return [Math.round(0 + 255 * white), Math.round(229 + 26 * white), 255, a];
});

// Chevron "^" apuntando hacia arriba (rotation = rumbo de salida del giro).
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
const arrow = (x, y, size) => {
  const s = size;
  const pts = [
    [0.22 * s, 0.7 * s],
    [0.5 * s, 0.34 * s],
    [0.78 * s, 0.7 * s],
  ];
  const d = Math.min(
    distToSegment(x, y, ...pts[0], ...pts[1]),
    distToSegment(x, y, ...pts[1], ...pts[2]),
  );
  const half = 0.11 * s;
  const a = Math.max(0, Math.min(1, half - d + 0.5));
  return [255, 255, 255, a];
};
writePng('route-turn-arrow.png', 14, arrow);
writePng('route-turn-arrow@2x.png', 28, arrow);
writePng('route-turn-arrow@3x.png', 42, arrow);
