// Zeta(1/2 + it) for the homepage plot, 0 <= t <= 40.
// Euler–Maclaurin tail after 63 direct terms, through the B4 correction.
const N = 64;
const logs = Array.from({ length: N + 1 }, (_, n) => Math.log(n));
const amplitudes = logs.map((_, n) => 1 / Math.sqrt(n));
export const zeroHeights = [14.134725142, 21.022039639, 25.010857580, 30.424876126, 32.935061588, 37.586178159];

export function criticalValue(t) {
  let real = 0, imaginary = 0;
  for (let n = 1; n < N; n++) {
    real += amplitudes[n] * Math.cos(t * logs[n]);
    imaginary -= amplitudes[n] * Math.sin(t * logs[n]);
  }
  // The remaining tail is N^(-s) times the complex correction a + ib.
  const denominator = .25 + t * t;
  const a = -N * .5 / denominator + .5 + .5 / (12 * N) - (1.875 - 4.5 * t * t) / (720 * N ** 3);
  const b = -N * t / denominator + t / (12 * N) - (5.75 * t - t ** 3) / (720 * N ** 3);
  const c = amplitudes[N] * Math.cos(t * logs[N]);
  const d = -amplitudes[N] * Math.sin(t * logs[N]);
  return [real + a * c - b * d, imaginary + a * d + b * c];
}
