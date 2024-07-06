
import * as m2d from './matrix2d.js';

const TAU = Math.PI * 2;

const seed = [0xb0b5c0ff, 0xeefacade, Math.random() * 0xffffff, Math.random() * 0xffffff];

const churn = state => {
  // uint64_t s1 = s[0]
  let s1U = state[0];
  let s1L = state[1];
  // uint64_t s0 = s[1]
  const s0U = state[2];
  const s0L = state[3];

  // result = s0 + s1
  const sumL = (s0L >>> 0) + (s1L >>> 0);
  const high = (s0U + s1U + ((sumL / 2) >>> 31)) >>> 0;
  const low = sumL >>> 0;

  // s[0] = s0
  state[0] = s0U;
  state[1] = s0L;

  // - t1 = [0, 0]
  let t1U = 0;
  let t1L = 0;
  // - t2 = [0, 0]
  let t2U = 0;
  let t2L = 0;

  // s1 ^= s1 << 23;
  // :: t1 = s1 << 23
  const a1 = 23;
  const m1 = 0xffffffff << (32 - a1);
  t1U = (s1U << a1) | ((s1L & m1) >>> (32 - a1));
  t1L = s1L << a1;
  // :: s1 = s1 ^ t1
  s1U ^= t1U;
  s1L ^= t1L;

  // t1 = ( s1 ^ s0 ^ ( s1 >> 17 ) ^ ( s0 >> 26 ) )
  // :: t1 = s1 ^ s0
  t1U = s1U ^ s0U;
  t1L = s1L ^ s0L;
  // :: t2 = s1 >> 18
  const a2 = 18;
  const m2 = 0xffffffff >>> (32 - a2);
  t2U = s1U >>> a2;
  t2L = (s1L >>> a2) | ((s1U & m2) << (32 - a2));
  // :: t1 = t1 ^ t2
  t1U ^= t2U;
  t1L ^= t2L;
  // :: t2 = s0 >> 5
  const a3 = 5;
  const m3 = 0xffffffff >>> (32 - a3);
  t2U = s0U >>> a3;
  t2L = (s0L >>> a3) | ((s0U & m3) << (32 - a3));
  // :: t1 = t1 ^ t2
  t1U ^= t2U;
  t1L ^= t2L;

  // s[1] = t1
  state[2] = t1U;
  state[3] = t1L;

  return { high, low };
};

const fold = (state, words) => {
  let j = 0;
  for (let i = 0; i < words.length; i += 1) {
    state[j] ^= words[i];
    j = (j + 1) & (4 - 1);
  }
};

const random = state => {
  const { high, low } = churn(state);
  // Math.pow(2, -32) = 2.3283064365386963e-10
  // Math.pow(2, -52) = 2.220446049250313e-16
  return high * 2.3283064365386963e-10 + (low >>> 12) * 2.220446049250313e-16;
};

const $plotter = document.querySelector('#plotter');
$plotter.width = window.innerWidth;
$plotter.height = window.innerHeight;

const add2 = ({x: x1, y: y1}, {x: x2, y: y2}) => ({
  x: x1 + x2,
  y: y1 + y2,
});

const add2a = ({x: x1, y: y1, a: a1}, {x: x2, y: y2, a: a2}) => ({
  x: x1 + x2,
  y: y1 + y2,
  a: a1 + a2,
});

const sub2 = ({x: x1, y: y1}, {x: x2, y: y2}) => ({
  x: x1 - x2,
  y: y1 - y2,
});

const scale2 = ({x, y}, scale) => ({
  x: x * scale,
  y: y * scale,
});

const scale2a = ({x, y, a}, scale) => ({
  x: x * scale,
  y: y * scale,
  a: a * scale,
});

const ray = ({x, y}, angle, distance) => ({
  x: x + Math.cos(angle) * distance,
  y: y + Math.sin(angle) * distance,
});

const distance2 = ({x: x1, y: y1}, {x: x2, y: y2}) => {
  return Math.hypot(x1 - x2, y1 - y2);
};

const lerp1 = (a, b, p) => a * p + b * (1 - p);

const lerp2 = ({x: x1, y: y1}, {x: x2, y: y2}, p) => {
  return {x: lerp1(x1, x2, p), y: lerp1(y1, y2, p)};
};

const project = ({x, y}, C, R, Z) => {
  const angle = Math.atan2(y, x);
  const hypot = Math.hypot(x, y);
  const radius = Math.atan2(hypot, Z) / Math.PI * 2 * R;
  return ray(C, angle, radius);
};

const drawLine = (plotter, source, target, C, R, Z, T) => {
  const points = [source, target];
  let meter = 1000;
  while (points.length >= 2 && meter-- > 0) {
    const c = points.pop();
    const a = points.at(-1);
    const ap = project(a, C, R, Z);
    const cp = project(c, C, R, Z);
    if (distance2(ap, cp) > T) {
      const b = lerp2(a, c, 0.5);
      points.push(b);
      points.push(c);
    } else {
      plotter.beginPath();
      plotter.moveTo(ap.x, ap.y);
      plotter.lineTo(cp.x, cp.y);
      plotter.stroke();
    }
  }
};

const drawCircle = (center, radius, C, R, Z, T) => {
  const angles = [
    0,
    Math.PI / 2,
    Math.PI,
    Math.PI * 3 / 2,
    Math.PI * 2
  ];
  while (angles.length >= 2) {
    const cd = angles.pop();
    const ad = angles.at(-1);
    const a = ray(center, ad, radius);
    const c = ray(center, cd, radius);
    const ap = project(a, C, R, Z);
    const cp = project(c, C, R, Z);
    if (distance2(ap, cp) > T) {
      const bd = lerp1(ad, cd, 0.5);
      angles.push(bd);
      angles.push(cd);
    } else {
      plotter.beginPath();
      plotter.moveTo(ap.x, ap.y);
      plotter.lineTo(cp.x, cp.y);
      plotter.stroke();
    }
  }
};

const drawVessel = (plotter, center, direction, radius, C, R, Z, T) => {
  const top = ray(center, direction, radius);
  const port = ray(center, direction + Math.PI * 4 / 5, radius);
  const stbd = ray(center, direction + Math.PI * 6 / 5, radius);
  drawLine(plotter, top, port, C, R, Z, T);
  drawLine(plotter, top, stbd, C, R, Z, T);
  drawLine(plotter, port, stbd, C, R, Z, T);
};


const drawSurface = (plotter, center, orientation, radius, C, R, Z, T, numerator = 0, divisions = 0, startDepthPoint = undefined) => {
  const denominator = 1 << divisions;
  const startRadius = radius(numerator / denominator);
  const stopRadius = radius(((numerator + 1) % denominator) / denominator);
  const startSurfacePoint = ray(center, orientation + (numerator / denominator) * TAU, startRadius);
  startDepthPoint = startDepthPoint ?? ray(center, orientation + (numerator / denominator) * TAU, startRadius * (1 - 1 / denominator));
  const stopSurfacePoint = ray(center, orientation + ((numerator + 1) / denominator) * TAU, stopRadius);
  const levelSurfacePoint = ray(center, orientation + ((numerator + 1) / denominator) * TAU, startRadius);

  const projectedStartSurfacePoint = project(startSurfacePoint, C, R, Z);
  const projectedLevelSurfacePoint = project(levelSurfacePoint, C, R, Z);
  if (divisions <= 3 || distance2(projectedStartSurfacePoint, projectedLevelSurfacePoint) > T) { 
    drawSurface(plotter, center, orientation, radius, C, R, Z, T, numerator * 2, divisions + 1, startDepthPoint);
    drawSurface(plotter, center, orientation, radius, C, R, Z, T, numerator * 2 + 1, divisions + 1);
  } else {
    drawLine(plotter, startDepthPoint, startSurfacePoint, C, R, Z, T);
    drawLine(plotter, startSurfacePoint, stopSurfacePoint, C, R, Z, T);
  }
};

const drawSurface2 = (
  plotter,
  origin,
  orientation,
  radius,
  C, R, Z, T,
  before = 0,
  after = 0,
  numerator = 0,
  divisions = 0,
  denominator = (1 << divisions),
  start = radius(numerator, denominator, before, after, divisions),
  startSurfacePoint = ray(origin, orientation + (numerator / denominator) * TAU, start.radius),
  startDepthPoint = ray(origin, orientation + (numerator / denominator) * TAU, start.radius * (1 - 1 / denominator)),
  stop = radius(((numerator + 1) % denominator), denominator, before, after, divisions),
  stopSurfacePoint = ray(origin, orientation + ((numerator + 1) / denominator) * TAU, stop.radius),
) => {
  const levelSurfacePoint = ray(origin, orientation + ((numerator + 1) / denominator) * TAU, start.radius);
  const projectedStartSurfacePoint = project(startSurfacePoint, C, R, Z);
  const projectedLevelSurfacePoint = project(levelSurfacePoint, C, R, Z);
  if (divisions <= 3 || distance2(projectedStartSurfacePoint, projectedLevelSurfacePoint) > T) { 
    const center = radius(numerator * 2 + 1, denominator * 2, start.entropy, stop.entropy, divisions);
    drawSurface2(
      plotter,
      origin,
      orientation,
      radius,
      C, R, Z, T,
      before,
      center.entropy,
      numerator * 2,
      divisions + 1,
      denominator * 2,
      start,
      startSurfacePoint,
      startDepthPoint,
      center,
    );
    drawSurface2(
      plotter,
      origin,
      orientation,
      radius,
      C, R, Z, T,
      center.entropy,
      after,
      numerator * 2 + 1,
      divisions + 1,
      denominator * 2,
      center,
      undefined,
      undefined,
      stop,
      stopSurfacePoint,
    );
  } else {
    drawLine(plotter, startDepthPoint, startSurfacePoint, C, R, Z, T);
    drawLine(plotter, startSurfacePoint, stopSurfacePoint, C, R, Z, T);
  }
};

const makeRandomSurface = (min, max) => () => min + Math.random() * (max - min);

const makeSinusoidSurface = (mean, amp, count) => (n, d) => mean + amp * Math.sin(n*TAU*count);

const makeSpikeySurface = (state, min, max) => n => {
  const r = ~(n * 0xffffffff);
  state.set(seed);
  fold(state, [r, r >> 8, r >> 16, r >> 24]);
  churn(state);
  churn(state);
  churn(state);
  return min + (max - min) * random(state);
};

const makeAsteroidSurface = (state, min, max) => (n, d, before, after, l) => {
  const s = ~(n * 0xffffffff / d);
  state.set(seed);
  fold(state, [s, s >> 8, s >> 16, s >> 24]);
  churn(state);
  churn(state);
  churn(state);
  let entropy = 0.5;
  for (let i = (8 - l); i >= 0; i--) {
    entropy = (entropy + random(state)) / 2;
  }
  entropy = entropy / d + (1 - 1 / d) * (before + after) / 2;
  const radius = min + (max - min) * entropy;
  return { entropy, radius };
};

const main = () => {
  const plotter = $plotter.getContext('2d');

  const state = new Uint32Array(seed);

  const viewportSizePx = {x: window.innerWidth, y: window.innerHeight};
  const margin = 20;

  // Z is the distance from the center that corresponds to
  // 50% the radius of the projection, or the elevation of an
  // observer over the center that can see to infinity in all
  // directions within a circle of radius 2 Z.
  const Z = 10;

  // T is the threshold for partitioning a segment, used to
  // reduce level of detail for indistinct features.
  const T = 20;

  // R is the radius of the view.
  const R = Math.min(viewportSizePx.x, viewportSizePx.y) / 2 - margin;

  // C is the center of the view.
  const C = scale2(viewportSizePx, 0.5);

  const asteroidSurfaceRadius = makeAsteroidSurface(state, 50, 100);
  // const spikeySurfaceRadius = makeSpikeySurface(state, 10, 15);
  // const pentasterSurfaceRadius = makeSinusoidSurface(13, 2, 5);
  // const starSurfaceRadius = makeRandomSurface(1000, 1100);

  let vesselPosition = {x: 0, y: 0, a: 0};
  let vesselVelocity = {x: 0, y: 0, a: 0};

  let targetPosition = {x: 100, y: 0, a: 0};
  let targetVelocity = {x: 1 / 1000, y: 0, a: 0};

  let t = performance.now();

  const keys = {
    __proto__: null,
    q: 0,
    w: 0,
    e: 0,
    a: 0,
    s: 0,
    d: 0,
  };

  /**
   * @param {KeyboardEvent} event
   */
  const onKeyDown = event => {
    const { key, repeat, metaKey } = event;
    if (repeat || metaKey) return;
    if (key in keys) {
      keys[key] = 1;
      event.stopPropagation();
    }
  };

  /**
   * @param {KeyboardEvent} event
   */
  const onKeyUp = event => {
    const { key, repeat, metaKey } = event;
    if (repeat || metaKey) return;
    if (key in keys) {
      keys[key] = 0;
      event.stopPropagation();
    }
  };

  const onBlur = _event => {
    for (const key in keys) {
      keys[key] = false;
    }
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);

  const simulate = () => {
    const t2 = performance.now();
    const dt = t2 - t;
    t = t2;

    setTimeout(simulate, 100);

    const vesselThrust = {
      x: (keys.w - keys.s) / 1000000,
      y: (keys.d - keys.a) / 1000000,
    };
    const vesselImpulse = {
      ...m2d.transform(
        vesselThrust,
        m2d.rotate(-vesselPosition.a),
      ),
      a: (keys.q - keys.e) * TAU / 10000000,
    };

    vesselVelocity = add2a(vesselVelocity, scale2a(vesselImpulse, dt));
    vesselPosition = add2a(vesselPosition, scale2a(vesselVelocity, dt));
    targetPosition = add2a(targetPosition, scale2a(targetVelocity, dt));
  };

  const draw = () => {
    requestAnimationFrame(draw);
    plotter.fillStyle = 'solid black';
    plotter.fillRect(0, 0, $plotter.width, $plotter.height);

    const viewMatrix = m2d.compose(
      m2d.scale(-1),
      m2d.translate(vesselPosition),
      m2d.rotate(vesselPosition.a),
      m2d.rotate(TAU/4),
    );

    plotter.strokeStyle = 'white';
    drawVessel(plotter, m2d.transform(vesselPosition, viewMatrix), vesselPosition.a - vesselPosition.a - TAU/4, 0.5, C, R, Z, T);
    // drawVessel(plotter, m2d.transform(targetPosition, viewMatrix), targetPosition.a - vesselPosition.a - TAU/4, 0.5, C, R, Z, T);
    drawSurface2(plotter, m2d.transform(targetPosition, viewMatrix), vesselPosition.a - targetPosition.a - TAU/4, asteroidSurfaceRadius, C, R, Z, T);

    // drawSurface(plotter, {x: 2000, y: 0}, Math.random() * Math.PI * 2, starSurfaceRadius, C, R, Z, T);
    // drawSurface(plotter, {x: 0, y: 15}, planetRotation, pentasterSurfaceRadius, C, R, Z, T);
    // drawSurface(plotter, {x: 0, y: 0}, 0, spikeySurfaceRadius, C, R, Z, T);
  };

  requestAnimationFrame(draw);
  setTimeout(simulate, 100);
};

main();

