import { mediaBend } from "./media-plane";

/** Only paint the sliver between the straight join and its displaced centre.
 * The endpoints stay fixed and the middle moves by exactly `bend` pixels. */
export function sectionBendPath(bend: number) {
  return `M0 20 Q500 ${(20 + bend * 2).toFixed(3)} 1000 20 Z`;
}

/** Match Featured Work's bounded velocity response and exponential settling. */
export function createSectionBend(initialY: number, initialTime: number) {
  let y = initialY, sampledAt = initialTime, frameAt = initialTime;
  let target = 0, bend = 0;
  return {
    sample(nextY: number, now: number) {
      const elapsed = Math.max(8, Math.min(64, now - sampledAt));
      target = mediaBend((nextY - y) / elapsed * 1000);
      y = nextY;
      sampledAt = now;
    },
    reset(nextY: number, now: number) {
      y = nextY;
      sampledAt = frameAt = now;
      target = bend = 0;
    },
    tick(now: number) {
      const dt = Math.max(0, Math.min(.05, (now - frameAt) / 1000));
      frameAt = now;
      const goal = now - sampledAt < 80 ? target : 0;
      bend += (goal - bend) * (1 - Math.exp(-dt * 9));
      if (Math.abs(goal) < .02 && Math.abs(bend) < .02) bend = 0;
      return { bend, moving: bend !== 0 || Math.abs(goal) >= .02 };
    },
  };
}
