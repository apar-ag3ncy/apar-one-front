import { useEffect, useRef, type RefObject } from 'react';
import { Mesh, NoToneMapping, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, SRGBColorSpace, Vector2, WebGLRenderer } from 'three';
import { vertexShader, fragmentShader } from './film-shader';
import { Snowfall } from './snowfall';

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
    // This is a full-screen procedural shader: edges are filtered inside the
    // shader, where MSAA on the covering quad would not help them.
    try { renderer = new WebGLRenderer({ canvas: node, antialias: false, alpha: false, powerPreference: 'high-performance' }); }
    catch { return; } // The illustrated CSS backgrounds remain visible.
    // The existing art-directed shader outputs display-referred sRGB colors.
    // Do not apply a second transfer function or an exposure/bloom pass.
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = NoToneMapping;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const scene = new Scene();
    let frame = 0, previousTime = 0, elapsed = 0, disposed = false;
    let renderScale = 1, sampledSeconds = 0, sampledFrames = 0;
    let contextLost = false;
    const pointer = new Vector2();
    const snowPointer = new Vector2();
    let snowHover = false;
    const uniforms = {
      aspect: { value: 1 }, pixelHeight: { value: 800 }, clockTime: { value: 0 }, pointer: { value: new Vector2() },
      journey: { value: 0 },
    };
    const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader, depthWrite: false, depthTest: false });
    const plane = new PlaneGeometry(2, 2);
    const mesh = new Mesh(plane, material);
    mesh.frustumCulled = false;
    scene.add(mesh);
    const snowfall = new Snowfall();
    scene.add(snowfall.mesh);
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
      if (dt > 0 && !media.matches) {
        sampledSeconds += dt;
        sampledFrames++;
        if (sampledSeconds >= 1.5 && sampledFrames >= 30) {
          const average = sampledSeconds / sampledFrames;
          const next = average > .026 ? Math.max(.72, renderScale * .9)
            : average < .018 ? Math.min(1, renderScale + .04) : renderScale;
          if (Math.abs(next - renderScale) > .005) { renderScale = next; resize(); }
          sampledSeconds = 0;
          sampledFrames = 0;
        }
      }
      uniforms.journey.value = position.current;
      if (!media.matches) elapsed += dt;
      uniforms.clockTime.value = elapsed;
      uniforms.pointer.value.lerp(media.matches ? pointer.set(0, 0) : pointer, 1 - Math.exp(-dt * 4));
      snowfall.update(dt, elapsed, position.current, media.matches, snowHover ? snowPointer : null);
      renderer.render(scene, camera);
      if (node!.style.opacity !== '1') node!.style.opacity = '1';
      if (!media.matches) schedule();
    }
    function resize() {
      const w = node!.clientWidth, h = node!.clientHeight;
      if (!w || !h) return;
      const pixelBudget = w < 740 ? 750_000 : 3_200_000;
      const ratio = renderScale * Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(pixelBudget / (w * h)));
      renderer.setDrawingBufferSize(w, h, ratio);
      uniforms.aspect.value = w / h;
      uniforms.pixelHeight.value = renderer.domElement.height;
      snowfall.resize(w / h, renderer.domElement.height / h, w < 740);
      schedule();
    }
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    function move(e: PointerEvent) {
      if (!inView.current || e.pointerType !== 'mouse') { snowHover = false; return; }
      const box = node!.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const x = (e.clientX - box.left) / box.width, y = (e.clientY - box.top) / box.height;
      snowHover = x >= 0 && x <= 1 && y >= 0 && y <= 1;
      if (snowHover) {
        pointer.set(2*x-1, 1-2*y);
        snowPointer.set(pointer.x * box.width / box.height, pointer.y);
      }
    }
    function leave() { snowHover = false; }
    function pointerOut(e: PointerEvent) { if (!e.relatedTarget) leave(); }
    function visibility() {
      leave();
      cancelAnimationFrame(frame); frame = 0; previousTime = 0; schedule();
    }
    function lost(event: Event) {
      event.preventDefault(); // Permit WebGL to restore after a GPU reset.
      contextLost = true; node!.style.opacity = '0'; cancelAnimationFrame(frame); frame = 0;
    }
    function restored() { contextLost = false; previousTime = 0; resize(); }
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerout', pointerOut);
    window.addEventListener('blur', leave);
    window.addEventListener('scroll', leave, { passive: true });
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
      window.removeEventListener('pointerout', pointerOut); window.removeEventListener('blur', leave);
      window.removeEventListener('scroll', leave);
      media.removeEventListener('change', visibility); node.removeEventListener('webglcontextlost', lost);
      node.removeEventListener('webglcontextrestored', restored);
      snowfall.dispose(); plane.dispose(); material.dispose(); renderer.dispose();
    };
  }, [position]);
  return <canvas ref={canvas} aria-hidden="true" style={{ width:'100%', height:'100%', display:'block', opacity:0 }} />;
}
