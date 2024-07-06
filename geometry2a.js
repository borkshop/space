
export const add2a = ({x: x1, y: y1, a: a1}, {x: x2, y: y2, a: a2}) => ({
  x: x1 + x2,
  y: y1 + y2,
  a: a1 + a2,
});

export const scale2a = ({x, y, a}, scale) => ({
  x: x * scale,
  y: y * scale,
  a: a * scale,
});

