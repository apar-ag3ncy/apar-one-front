/** One continuous shot: drift → accelerate → tunnel → arrive. */
export const JOURNEY_SECONDS = 5.5;
export const HERO_REVEAL_PROGRESS = 0.52;

function smooth(a: number, b: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function journeyFrame(progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  const acceleration = smooth(0.1, 0.42, p);
  const arrival = smooth(0.72, 1, p);
  return {
    progress: p,
    // Travel is monotonic, so a scroll reversal retraces the same stars.
    travel: p * 7 + smooth(0.08, 0.92, p) * 220,
    warp: acceleration * (1 - arrival * 0.65),
    stretch: 0.025 + acceleration * (1 - arrival * 0.5) * 11,
    reveal: smooth(0.79, 1, p),
    warmth: smooth(0.69, 0.93, p),
  };
}
