import { BufferAttribute, BufferGeometry, DynamicDrawUsage, Points, ShaderMaterial } from 'three';

type Cursor = { x: number; y: number } | null;
const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** One small point buffer, sharing the film's renderer and animation loop. */
export class Snowfall {
  readonly mesh: Points<BufferGeometry, ShaderMaterial>;
  private readonly positions: Float32Array;
  private readonly velocities: Float32Array;
  private readonly depths: Float32Array;
  private aspect = 1;
  private count: number;

  constructor(private readonly capacity = 930, random = Math.random) {
    this.count = capacity;
    this.positions = new Float32Array(capacity * 3);
    this.velocities = new Float32Array(capacity * 2);
    this.depths = new Float32Array(capacity);
    const sizes = new Float32Array(capacity);
    for (let i = 0; i < capacity; i++) {
      this.positions[i * 3] = random() * 2.2 - 1.1;
      this.positions[i * 3 + 1] = random() * 2.2 - 1.1;
      const depth = this.depths[i] = random();
      sizes[i] = 1.15 + depth * 1.55;
      this.velocities[i * 2 + 1] = -.07 - depth * .15;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(this.positions, 3).setUsage(DynamicDrawUsage));
    geometry.setAttribute('flakeSize', new BufferAttribute(sizes, 1));
    const material = new ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: false, toneMapped: false,
      uniforms: { aspect: { value: 1 }, pointScale: { value: 1 }, opacity: { value: 0 } },
      vertexShader: `
        attribute float flakeSize;
        uniform float aspect, pointScale;
        varying float strength;
        void main() {
          gl_Position = vec4(position.x / aspect, position.y, 0., 1.);
          gl_PointSize = flakeSize * pointScale * 1.12;
          strength = mix(.28, .76, (flakeSize - 1.15) / 1.55);
        }`,
      fragmentShader: `
        uniform float opacity;
        varying float strength;
        void main() {
          float dotMask = 1. - smoothstep(.28, .5, length(gl_PointCoord - .5));
          gl_FragColor = vec4(.84, .91, .98, dotMask * strength * opacity);
        }`,
    });
    this.mesh = new Points(geometry, material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1;
    this.mesh.visible = false;
  }

  resize(aspect: number, pointScale: number, compact: boolean) {
    const scale = aspect / this.aspect;
    for (let i = 0; i < this.capacity; i++) this.positions[i * 3] *= scale;
    this.aspect = aspect;
    this.count = Math.min(this.capacity, compact ? 360 : this.capacity);
    this.mesh.geometry.setDrawRange(0, this.count);
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.material.uniforms.aspect.value = aspect;
    this.mesh.material.uniforms.pointScale.value = pointScale;
  }

  update(dt: number, time: number, chapter: number, reducedMotion: boolean, cursor: Cursor) {
    const opacity = smooth(2.4, 2.9, chapter) * (1 - smooth(3.45, 3.88, chapter));
    this.mesh.visible = !reducedMotion && opacity > .001;
    if (!this.mesh.visible) return;
    this.mesh.material.uniforms.opacity.value = opacity;
    const step = Math.max(0, Math.min(dt, .05));
    const damping = 1 - Math.exp(-step * 2.4);
    const radius = .25;
    for (let i = 0; i < this.count; i++) {
      const p = i * 3, v = i * 2, depth = this.depths[i];
      const wind = .016 + Math.sin(time * .35 + i * 2.4) * .012;
      this.velocities[v] += (wind - this.velocities[v]) * damping;
      this.velocities[v + 1] += (-.07 - depth * .15 - this.velocities[v + 1]) * damping;
      if (cursor) {
        const dx = this.positions[p] - cursor.x, dy = this.positions[p + 1] - cursor.y;
        const distance = Math.hypot(dx, dy);
        if (distance < radius) {
          const force = (1 - distance / radius) * (1.1 + depth) * step;
          this.velocities[v] += (distance > .001 ? dx / distance : Math.cos(i)) * force;
          this.velocities[v + 1] += (distance > .001 ? dy / distance : Math.sin(i)) * force;
        }
      }
      this.positions[p] += this.velocities[v] * step;
      this.positions[p + 1] += this.velocities[v + 1] * step;
      const width = this.aspect + .12;
      if (this.positions[p] > width) this.positions[p] -= width * 2;
      if (this.positions[p] < -width) this.positions[p] += width * 2;
      if (this.positions[p + 1] < -1.12 || this.positions[p + 1] > 1.2) {
        this.positions[p + 1] = 1.12;
        this.velocities[v] = wind;
        this.velocities[v + 1] = -.07 - depth * .15;
      }
    }
    this.mesh.geometry.attributes.position.needsUpdate = true;
  }

  dispose() { this.mesh.geometry.dispose(); this.mesh.material.dispose(); }
}
