import { rng } from './random.mjs';

const truth = (x) => Math.sin(2.2 * x) * 0.9 + 0.3 * x;

/** @param {number[]} xs @param {number[]} ys @param {number} deg @param {number} lambda @returns {number[]} */
export function fitPoly(xs, ys, deg, lambda) {
  const k = deg + 1;
  const A = Array.from({ length: k }, () => Array(k).fill(0));
  const b = Array(k).fill(0);
  for (let i = 0; i < xs.length; i++) {
    const pw = Array.from({ length: k }, (_, j) => xs[i] ** j);
    for (let r = 0; r < k; r++) {
      b[r] += pw[r] * ys[i];
      for (let c = 0; c < k; c++) A[r][c] += pw[r] * pw[c];
    }
  }
  for (let r = 1; r < k; r++) A[r][r] += lambda;
  // Gaussian elimination with partial pivoting
  for (let col = 0; col < k; col++) {
    let piv = col;
    for (let r = col + 1; r < k; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
    [A[col], A[piv]] = [A[piv], A[col]];
    [b[col], b[piv]] = [b[piv], b[col]];
    const d = A[col][col] || 1e-12;
    for (let r = 0; r < k; r++) {
      if (r === col) continue;
      const f = A[r][col] / d;
      for (let c = col; c < k; c++) A[r][c] -= f * A[col][c];
      b[r] -= f * b[col];
    }
  }
  return b.map((v, i) => v / (A[i][i] || 1e-12));
}

/** @param {number[]} w @param {number} x */
export const evalPoly = (w, x) => w.reduce((s, c, j) => s + c * x ** j, 0);


/** The original lesson's fixed synthetic data, shared with the discovery challenge. */
export function makeGeneralizationData() {
  const r = rng(42);
  /** @returns {[number, number][]} */
  const mk = (n, off) => Array.from({ length: n }, (_, i) => {
    const x = -1.6 + ((i + off) / n) * 3.2 + r.next() * 0.1;
    return [x, truth(x) + r.normal() * 0.28];
  });
  return { train: mk(12, 0.2), test: mk(40, 0.5) };
}

/** @param {number[]} weights @param {[number, number][]} points */
export function meanSquaredError(weights, points) {
  return points.reduce((sum, [x, y]) => sum + (evalPoly(weights, x) - y) ** 2, 0) / points.length;
}

/** @param {number} degree @param {number} [regularization] */
export function runGeneralization(degree, regularization = 0) {
  const data = makeGeneralizationData();
  const weights = fitPoly(data.train.map(p => p[0]), data.train.map(p => p[1]), degree, regularization);
  return { ...data, weights, trainingError: meanSquaredError(weights, data.train), newError: meanSquaredError(weights, data.test) };
}
