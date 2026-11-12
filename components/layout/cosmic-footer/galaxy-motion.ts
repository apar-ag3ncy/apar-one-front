// Each hover sample stays at the place it was emitted until its stars settle.
export const PULSE_INTERVAL = .32;
export const RETURN_SECONDS = 4.2;
export const PULSE_COUNT = Math.ceil(RETURN_SECONDS / PULSE_INTERVAL);
export const BRUSH_RADIUS = .26;
export const MAX_PUSH = .075;

export class GalaxyBrush {
  // Packed GPU uniform: pointer x/y in clip space and current pulse strength.
  readonly pulses = new Float32Array(PULSE_COUNT * 3);
  private readonly started = new Float64Array(PULSE_COUNT).fill(-Infinity);
  private readonly strength = new Float32Array(PULSE_COUNT);
  private slot = -1;
  private connected = false;

  leave() { this.connected = false; }

  move(x: number, y: number, time: number, aspect: number) {
    const previous = this.slot * 3;
    const distance = this.connected
      ? Math.hypot((x - this.pulses[previous]) * aspect, y - this.pulses[previous + 1])
      : 0;
    if (this.slot >= 0 && time - this.started[this.slot] < PULSE_INTERVAL) return;
    if (this.connected && distance < .012) return;

    this.slot = (this.slot + 1) % PULSE_COUNT;
    const index = this.slot * 3;
    this.pulses[index] = x;
    this.pulses[index + 1] = y;
    this.started[this.slot] = time;
    this.strength[this.slot] = Math.min(1.15, .8 + distance * 2);
    this.connected = true;
  }

  update(time: number) {
    for (let i = 0; i < PULSE_COUNT; i++) {
      const age = time - this.started[i];
      // A gentle lift, then a long tail that reaches zero before slot reuse.
      this.pulses[i * 3 + 2] = age >= 0 && age < RETURN_SECONDS
        ? this.strength[i] * age * 4.4 * Math.exp(-2.2 * age) * (1 - age / RETURN_SECONDS)
        : 0;
    }
  }
}
