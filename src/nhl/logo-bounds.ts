type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

function bezier(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

function addArc(
  include: (x: number, y: number) => void,
  x1: number,
  y1: number,
  rx: number,
  ry: number,
  rotation: number,
  large: number,
  sweep: number,
  x2: number,
  y2: number,
) {
  rx = Math.abs(rx);
  ry = Math.abs(ry);

  if (
    rx < 1e-6 ||
    ry < 1e-6 ||
    (Math.abs(x1 - x2) < 1e-6 && Math.abs(y1 - y2) < 1e-6)
  ) {
    include(x2, y2);
    return;
  }

  const phi = (rotation * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cos * dx + sin * dy;
  const y1p = -sin * dx + cos * dy;

  let rx2 = rx * rx;
  let ry2 = ry * ry;
  const lambda = (x1p * x1p) / rx2 + (y1p * y1p) / ry2;

  if (lambda > 1) {
    const scale = Math.sqrt(lambda);
    rx *= scale;
    ry *= scale;
    rx2 = rx * rx;
    ry2 = ry * ry;
  }

  const numerator = rx2 * ry2 - rx2 * y1p * y1p - ry2 * x1p * x1p;
  const denominator = rx2 * y1p * y1p + ry2 * x1p * x1p;
  const coef =
    (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, numerator) / denominator);
  const cxp = (coef * rx * y1p) / ry;
  const cyp = (coef * -ry * x1p) / rx;
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2;
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2;

  const angle = (ux: number, uy: number, vx: number, vy: number) => {
    const dot = ux * vx + uy * vy;
    const length = Math.hypot(ux, uy) * Math.hypot(vx, vy);
    const raw = Math.acos(Math.min(1, Math.max(-1, dot / (length || 1))));
    return ux * vy - uy * vx < 0 ? -raw : raw;
  };

  const theta = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let delta = angle(
    (x1p - cxp) / rx,
    (y1p - cyp) / ry,
    (-x1p - cxp) / rx,
    (-y1p - cyp) / ry,
  );

  if (sweep === 0 && delta > 0) {
    delta -= Math.PI * 2;
  }
  if (sweep === 1 && delta < 0) {
    delta += Math.PI * 2;
  }

  const steps = Math.max(2, Math.ceil(Math.abs(delta) / (Math.PI / 24)));

  for (let step = 0; step <= steps; step += 1) {
    const t = theta + (delta * step) / steps;
    const cosT = Math.cos(t);
    const sinT = Math.sin(t);
    include(
      cx + rx * cos * cosT - ry * sin * sinT,
      cy + rx * sin * cosT + ry * cos * sinT,
    );
  }
}

function addCubic(
  include: (x: number, y: number) => void,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
) {
  include(x0, y0);
  include(x3, y3);

  for (const axis of ["x", "y"] as const) {
    const p =
      axis === "x" ? [x0, x1, x2, x3] : [y0, y1, y2, y3];
    const a = -3 * p[0] + 9 * p[1] - 9 * p[2] + 3 * p[3];
    const b = 6 * p[0] - 12 * p[1] + 6 * p[2];
    const c = 3 * p[1] - 3 * p[0];
    const times: number[] = [];

    if (Math.abs(a) < 1e-6) {
      if (Math.abs(b) > 1e-6) {
        times.push(-c / b);
      }
    } else {
      const disc = b * b - 4 * a * c;
      if (disc >= 0) {
        const root = Math.sqrt(disc);
        times.push((-b + root) / (2 * a), (-b - root) / (2 * a));
      }
    }

    for (const t of times) {
      if (t > 0 && t < 1) {
        include(
          bezier(x0, x1, x2, x3, t),
          bezier(y0, y1, y2, y3, t),
        );
      }
    }
  }
}

export function pathBounds(svg: string): Bounds | null {
  const paths = [...svg.matchAll(/d="([^"]+)"/g)].map((match) => match[1]);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const include = (px: number, py: number) => {
    if (!Number.isFinite(px) || !Number.isFinite(py)) {
      return;
    }
    minX = Math.min(minX, px);
    minY = Math.min(minY, py);
    maxX = Math.max(maxX, px);
    maxY = Math.max(maxY, py);
  };

  for (const path of paths) {
    const tokens = path.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi);
    if (!tokens) {
      continue;
    }

    let index = 0;
    let x = 0;
    let y = 0;
    let startX = 0;
    let startY = 0;
    let command = "";
    let prev = "";
    let ctrlX = 0;
    let ctrlY = 0;

    const read = () => Number(tokens[index++]);
    const abs = (raw: number, origin: number, relative: boolean) =>
      relative ? origin + raw : raw;
    const reflected = () =>
      "CcSsQqTt".includes(prev)
        ? { x: 2 * x - ctrlX, y: 2 * y - ctrlY }
        : { x, y };

    while (index < tokens.length) {
      const token = tokens[index];
      if (/[a-zA-Z]/.test(token)) {
        command = token;
        index += 1;
      }

      const relative = command === command.toLowerCase();

      if (command === "Z" || command === "z") {
        x = startX;
        y = startY;
        prev = command;
        continue;
      }

      if (command === "M" || command === "m") {
        x = abs(read(), x, relative);
        y = abs(read(), y, relative);
        startX = x;
        startY = y;
        include(x, y);
        command = relative ? "l" : "L";
        prev = relative ? "m" : "M";
        continue;
      }

      if (command === "L" || command === "l") {
        x = abs(read(), x, relative);
        y = abs(read(), y, relative);
        include(x, y);
      } else if (command === "H" || command === "h") {
        x = abs(read(), x, relative);
        include(x, y);
      } else if (command === "V" || command === "v") {
        y = abs(read(), y, relative);
        include(x, y);
      } else if (command === "C" || command === "c") {
        const x1 = abs(read(), x, relative);
        const y1 = abs(read(), y, relative);
        const x2 = abs(read(), x, relative);
        const y2 = abs(read(), y, relative);
        const x3 = abs(read(), x, relative);
        const y3 = abs(read(), y, relative);
        addCubic(include, x, y, x1, y1, x2, y2, x3, y3);
        ctrlX = x2;
        ctrlY = y2;
        x = x3;
        y = y3;
      } else if (command === "S" || command === "s") {
        const mirror = reflected();
        const x2 = abs(read(), x, relative);
        const y2 = abs(read(), y, relative);
        const x3 = abs(read(), x, relative);
        const y3 = abs(read(), y, relative);
        addCubic(include, x, y, mirror.x, mirror.y, x2, y2, x3, y3);
        ctrlX = x2;
        ctrlY = y2;
        x = x3;
        y = y3;
      } else if (command === "Q" || command === "q") {
        const x1 = abs(read(), x, relative);
        const y1 = abs(read(), y, relative);
        const x2 = abs(read(), x, relative);
        const y2 = abs(read(), y, relative);
        addCubic(include, x, y, x1, y1, x1, y1, x2, y2);
        ctrlX = x1;
        ctrlY = y1;
        x = x2;
        y = y2;
      } else if (command === "T" || command === "t") {
        const mirror = reflected();
        const x2 = abs(read(), x, relative);
        const y2 = abs(read(), y, relative);
        addCubic(include, x, y, mirror.x, mirror.y, mirror.x, mirror.y, x2, y2);
        ctrlX = mirror.x;
        ctrlY = mirror.y;
        x = x2;
        y = y2;
      } else if (command === "A" || command === "a") {
        const rx = read();
        const ry = read();
        const rotation = read();
        const large = read();
        const sweep = read();
        const nextX = abs(read(), x, relative);
        const nextY = abs(read(), y, relative);
        addArc(include, x, y, rx, ry, rotation, large, sweep, nextX, nextY);
        x = nextX;
        y = nextY;
      } else {
        break;
      }

      prev = command;
    }
  }

  if (!Number.isFinite(minX) || maxX - minX < 10 || maxY - minY < 10) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}

export function croppedViewBox(svg: string): string | null {
  const bounds = pathBounds(svg);
  if (!bounds) {
    return null;
  }

  const pad = 16;
  const x = bounds.minX - pad;
  const y = bounds.minY - pad;
  const width = bounds.maxX - bounds.minX + pad * 2;
  const height = bounds.maxY - bounds.minY + pad * 2;
  return `${x} ${y} ${width} ${height}`;
}
