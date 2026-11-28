import {
  DoubleSide, LinearFilter, Mesh, OrthographicCamera, PlaneGeometry, Scene,
  ShaderMaterial, TextureLoader, WebGLRenderer,
} from 'three';
import { cloudFragment, cloudVertex, mountainFragment, mountainVertex } from './shaders';

export async function createAlpineScene(canvas: HTMLCanvasElement) {
  const elevation = await new TextureLoader().loadAsync('/textures/quote-shuksan.png');
  elevation.generateMipmaps = false;
  elevation.minFilter = LinearFilter;
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch (error) {
    elevation.dispose();
    throw error;
  }
  renderer.setClearColor(0, 0);
  const scene = new Scene();
  const camera = new OrthographicCamera(-1,1,1,-1,0,1);
  const uniforms = {
    elevation: { value: elevation }, aspect: { value: 1 }, progress: { value: .5 },
    time: { value: 0 }, gust: { value: 0 },
  };
  const ridge = new Mesh(new PlaneGeometry(1, 1, 384, 144), new ShaderMaterial({
    uniforms, vertexShader: mountainVertex, fragmentShader: mountainFragment, side: DoubleSide,
  }));
  const mist = new Mesh(new PlaneGeometry(2, 2), new ShaderMaterial({
    uniforms, vertexShader: cloudVertex, fragmentShader: cloudFragment,
    transparent: true, depthWrite: false, depthTest: false,
  }));
  ridge.frustumCulled = mist.frustumCulled = false;
  scene.add(ridge, mist);
  return {
    resize(w: number, h: number) {
      if (!w || !h) return;
      uniforms.aspect.value = w / h;
      const budget = w < 740 ? 450_000 : 1_500_000;
      renderer.setDrawingBufferSize(w, h, Math.min(devicePixelRatio, 1.6, Math.sqrt(budget / (w*h))));
    },
    draw(time: number, progress: number, gust: number) {
      uniforms.time.value = time;
      uniforms.progress.value = progress;
      uniforms.gust.value = gust;
      renderer.render(scene, camera);
    },
    dispose() {
      elevation.dispose();
      ridge.geometry.dispose(); ridge.material.dispose();
      mist.geometry.dispose(); mist.material.dispose();
      renderer.dispose();
    },
  };
}
