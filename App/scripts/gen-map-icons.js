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
// puckRadius = radio visible del puck que rodea; el lienzo es 1.5× el del puck.
const glowRing = (puckRadius) => (x, y, size) => {
  const k = puckRadius / 43;
  const c = size / 2;
  const r = Math.hypot(x - c, y - c);
  const edge = Math.max(0, 1 - Math.abs(r - (puckRadius + 1.5 * k)) / (2.2 * k));
  const glow = r > puckRadius ? Math.exp(-Math.pow((r - puckRadius) / (9 * k), 2)) * 0.75 : 0;
  const a = Math.max(edge, glow);
  const white = edge * 0.55; // núcleo del borde más claro
  return [Math.round(255 * white), Math.round(229 + 26 * white), 255, a];
};
writePng('nav-glow-ring.png', 132, glowRing(43)); // rodea location-circle.png (88px)

// Puck grande para la cámara inclinada (3D): mismo diseño que location-circle.png
// (círculo #0A2E3D, borde #093C4C, flecha #00E5FF), dibujado con supersampling.
const NAV_PUCK_SIZE = 124;
function inPolygon(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const navPuck = (x, y, size) => {
  const SS = 4;
  const c = size / 2;
  const R = 0.455 * size;
  const arrow = [
    [0.5, 0.24],
    [0.69, 0.71],
    [0.5, 0.6],
    [0.31, 0.71],
  ].map(([ax, ay]) => [ax * size, ay * size]);
  let r = 0, g = 0, b = 0, a = 0;
  for (let sy = 0; sy < SS; sy++) {
    for (let sx = 0; sx < SS; sx++) {
      const px = x - 0.5 + (sx + 0.5) / SS;
      const py = y - 0.5 + (sy + 0.5) / SS;
      const d = Math.hypot(px - c, py - c);
      if (d > R) continue;
      let col = d > R - 0.06 * size ? [9, 60, 76] : [10, 46, 61];
      if (inPolygon(px, py, arrow)) col = [0, 229, 255];
      r += col[0]; g += col[1]; b += col[2]; a += 1;
    }
  }
  if (a === 0) return [0, 0, 0, 0];
  return [Math.round(r / a), Math.round(g / a), Math.round(b / a), a / (SS * SS)];
};
writePng('location-circle-nav.png', NAV_PUCK_SIZE, navPuck);
writePng('nav-glow-ring-nav.png', Math.round(NAV_PUCK_SIZE * 1.5), glowRing(0.455 * NAV_PUCK_SIZE + 3));

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
