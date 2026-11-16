export const IMAGE_PIXEL_LIFE = 900;
export const IMAGE_PIXEL_RADIUS = 80;
export const IMAGE_PIXEL_WIDTH = 15;
export const IMAGE_PIXEL_HEIGHT = 10;

type Point = { x: number; y: number; time: number };

/** One byte per tile; no full-resolution image readback or idle animation. */
export class ImagePixelField {
  columns = 0;
  rows = 0;
  data = new Uint8Array(0);
  private width = 0;
  private height = 0;
  private points: Point[] = [];

  resize(width: number, height: number) {
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    this.columns = Math.max(1, Math.ceil(width / IMAGE_PIXEL_WIDTH));
    this.rows = Math.max(1, Math.ceil(height / IMAGE_PIXEL_HEIGHT));
    this.data = new Uint8Array(this.columns * this.rows);
    this.clear();
  }

  clear() {
    this.points = [];
    this.data.fill(0);
  }

  add(x: number, y: number, now: number) {
    if (!Number.isFinite(x + y + now) || !this.width || !this.height) return;
    this.points = this.points.filter(point => now - point.time < IMAGE_PIXEL_LIFE);
    const last = this.points[this.points.length - 1];
    const distance = last ? Math.hypot(x - last.x, y - last.y) : 0;
    const count = Math.min(8, Math.max(1, Math.ceil(distance / 12)));
    for (let i = 1; i <= count; i++) {
      const fraction = i / count;
      this.points.push({ x: last ? last.x + (x - last.x) * fraction : x,
        y: last ? last.y + (y - last.y) * fraction : y, time: now - (1 - fraction) * 30 });
    }
    this.points = this.points.slice(-64);
  }

  paint(now: number) {
    this.data.fill(0);
    this.points = this.points.filter(point => now - point.time < IMAGE_PIXEL_LIFE);
    for (const point of this.points) {
      const age = Math.max(0, 1 - (now - point.time) / IMAGE_PIXEL_LIFE);
      const x0 = Math.max(0, Math.floor((point.x - IMAGE_PIXEL_RADIUS) / IMAGE_PIXEL_WIDTH));
      const x1 = Math.min(this.columns, Math.ceil((point.x + IMAGE_PIXEL_RADIUS) / IMAGE_PIXEL_WIDTH));
      const y0 = Math.max(0, Math.floor((point.y - IMAGE_PIXEL_RADIUS) / IMAGE_PIXEL_HEIGHT));
      const y1 = Math.min(this.rows, Math.ceil((point.y + IMAGE_PIXEL_RADIUS) / IMAGE_PIXEL_HEIGHT));
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const distance = Math.hypot((x + .5) * IMAGE_PIXEL_WIDTH - point.x,
          (y + .5) * IMAGE_PIXEL_HEIGHT - point.y) / IMAGE_PIXEL_RADIUS;
        const edge = Math.max(0, Math.min(1, (1 - distance) / .5));
        const strength = Math.round(255 * edge * edge * (3 - 2 * edge) * age * age);
        const index = y * this.columns + x;
        this.data[index] = Math.max(this.data[index], strength);
      }
    }
    return this.points.length > 0;
  }
}
