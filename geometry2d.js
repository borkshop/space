
import { lerp1 } from './geometry1d.js';

export const add2 = ({x: x1, y: y1}, {x: x2, y: y2}) => ({
  x: x1 + x2,
  y: y1 + y2,
});

export const sub2 = ({x: x1, y: y1}, {x: x2, y: y2}) => ({
  x: x1 - x2,
  y: y1 - y2,
});

export const scale2 = ({x, y}, scale) => ({
  x: x * scale,
  y: y * scale,
});

export const ray2 = ({x, y}, angle, distance) => ({
  x: x + Math.cos(angle) * distance,
  y: y + Math.sin(angle) * distance,
});

export const distance2 = ({x: x1, y: y1}, {x: x2, y: y2}) => {
  return Math.hypot(x1 - x2, y1 - y2);
};

export const lerp2 = ({x: x1, y: y1}, {x: x2, y: y2}, p) => {
  return {x: lerp1(x1, x2, p), y: lerp1(y1, y2, p)};
};
