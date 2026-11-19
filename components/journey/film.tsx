import { useEffect, useRef, type RefObject } from 'react';
import { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, WebGLRenderer } from 'three';
import { vertexShader, fragmentShader } from './film-shader';

export default function Film({ position, target, active }: { position: RefObject<number>; target: number; active: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const inView = useRef(active);
  const refresh = useRef<() => void>(() => {});
  const wake = useRef<() => void>(() => {});
  useEffect(() => {
    inView.current = active;
    refresh.current();
  }, [active]);
  useEffect(() => { wake.current(); }, [target]);

  useEffect(() => {
    const node = canvas.current;
    if (!node) return;
    let renderer: WebGLRenderer;
    try { renderer = new WebGLRenderer({ canvas: node, antialias: false, alpha: false, powerPreference: 'low-power' }); }
    catch { return; } // The illustrated CSS backgrounds remain visible.
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const scene = new Scene();
    let frame = 0, previousTime = 0, elapsed = 0, disposed = false;
    let renderScale = 1, sampledSeconds = 0, sampledFrames = 0;
    let contextLost = false;
    const pointer = new Vector2();
    const uniforms = {
      aspect: { value: 1 }, pixelHeight: { value: 800 }, clockTime: { value: 0 }, pointer: { value: new Vector2() },
      journey: { value: 0 },
    };
    const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader, depthWrite: false, depthTest: false });
    const plane = new PlaneGeometry(2, 2);
    const mesh = new Mesh(plane, material);
    mesh.frustumCulled = false;
    scene.add(mesh);
    function schedule() {
      if (!disposed && !frame && inView.current && !document.hidden && !contextLost) frame = requestAnimationFrame(draw);
    }
    function draw(now: number) {
      frame = 0;
      if (disposed || document.hidden) return;
      const dt = previousTime ? Math.min(.1, (now - previousTime) / 1000) : 0;
      previousTime = now;
      // Lower the canvas resolution only after sustained slow frames. The
      // captions and controls always retain the display's native resolution.
      if (dt > 0 && !media.matches && renderScale > .65) {
        sampledSeconds += dt;
        sampledFrames++;
        if (sampledSeconds >= .5 && sampledFrames >= 5) {
          if (sampledSeconds / sampledFrames > .023) {
            renderScale = Math.max(.65, renderScale * .85);
            resize();
          }
          sampledSeconds = 0;
          sampledFrames = 0;
        }
      }
      uniforms.journey.value = position.current;
      if (!media.matches) elapsed += dt;
      uniforms.clockTime.value = elapsed;
      uniforms.pointer.value.lerp(media.matches ? pointer.set(0, 0) : pointer, 1 - Math.exp(-dt * 4));
      renderer.render(scene, camera);
      if (node!.style.opacity !== '1') node!.style.opacity = '1';
      if (!media.matches) schedule();
    }
    function resize() {
      const w = node!.clientWidth, h = node!.clientHeight;
      if (!w || !h) return;
      const pixelBudget = w < 740 ? 450_000 : 1_100_000;
      const ratio = renderScale * Math.min(window.devicePixelRatio || 1, 1.4, Math.sqrt(pixelBudget / (w * h)));
      renderer.setDrawingBufferSize(w, h, ratio);
      uniforms.aspect.value = w / h;
      uniforms.pixelHeight.value = h * ratio;
      schedule();
    }
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    function move(e: PointerEvent) {
      if (inView.current && e.pointerType === 'mouse') pointer.set(2*e.clientX/innerWidth-1, 1-2*e.clientY/innerHeight);
    }
    function visibility() {
      cancelAnimationFrame(frame); frame = 0; previousTime = 0; schedule();
    }
    function lost() { contextLost = true; node!.style.opacity = '0'; cancelAnimationFrame(frame); frame = 0; }
    function restored() { contextLost = false; previousTime = 0; resize(); }
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('visibilitychange', visibility);
    media.addEventListener('change', visibility);
    node.addEventListener('webglcontextlost', lost);
    node.addEventListener('webglcontextrestored', restored);
    refresh.current = visibility;
    wake.current = schedule;
    resize();
    return () => {
      disposed = true; wake.current = refresh.current = () => {}; cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener('pointermove', move); document.removeEventListener('visibilitychange', visibility);
      media.removeEventListener('change', visibility); node.removeEventListener('webglcontextlost', lost);
      node.removeEventListener('webglcontextrestored', restored);
      plane.dispose(); material.dispose(); renderer.dispose();
    };
  }, [position]);
  return <canvas ref={canvas} aria-hidden="true" style={{ width:'100%', height:'100%', display:'block', opacity:0 }} />;
}
