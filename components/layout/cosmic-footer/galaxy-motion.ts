// Strokes outlive the spring response, so slot reuse never snaps stars home.
export const STROKES = 14;
export const STROKE_INTERVAL = .32;
export const RETURN_SECONDS = 4.2;
export const BRUSH_RADIUS = .24;
export const PUSH_STRENGTH = .075;
export const MAX_PUSH = .075;
export const RETURN_DAMPING = 2.2;

export class GalaxyBrush {
  readonly segments = new Float32Array(STROKES * 4);
  readonly events = new Float32Array(STROKES * 2);
  private slot = -1;
  private connected = false;
  private x = 0;
  private y = 0;
  private started = -100;

  constructor() { for (let i = 0; i < STROKES; i++) this.events[i * 2] = -100; }
  leave() { this.connected = false; }
  move(x: number, y: number, time: number, aspect: number) {
    const distance = Math.hypot((x - this.x) * aspect, y - this.y);
    if (this.connected && distance < .002) return;
    const isEntry = !this.connected;
    if (isEntry && this.slot >= 0 && time - this.started < STROKE_INTERVAL) return;
    if (isEntry || time - this.started >= STROKE_INTERVAL) {
      this.slot = (this.slot + 1) % STROKES;
      const index = this.slot * 4;
      this.segments[index] = isEntry ? x : this.x;
      this.segments[index + 1] = isEntry ? y : this.y;
      this.started = time;
    }
    const index = this.slot * 4;
    this.segments[index + 2] = x;
    this.segments[index + 3] = y;
    this.events[this.slot * 2] = this.started;
    this.events[this.slot * 2 + 1] = Math.min(1.3, .65 + distance * 8);
    this.x = x; this.y = y; this.connected = true;
  }
}
