import * as THREE from "three";
import { rockComposition } from "@/components/home/diamond/composition";
import {
  diamondTriangles,
  createDiamondGeometry,
  createFragmentGeometry,
  createRockGeometry,
  seededRandom,
} from "@/components/home/diamond/geometry";
import { diamondMaterial, fragmentDepthMaterial } from "@/components/home/diamond/fragment-material";
import { createRockMaterial } from "@/components/home/diamond/rock-material";
import { createRockMotion } from "@/components/home/diamond/rock-motion";

/** Render on demand. GSAP supplies the motion; this module never runs an idle animation loop. */
export function createDiamondScene(host, state, onReady, onLost, onPrepared = () => {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  let crispPixelRatio = Math.min(window.devicePixelRatio, host.clientWidth < 768 ? 1.75 : 2);
  let pixelRatio = crispPixelRatio;
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.13;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
  const target = new THREE.Vector3(0, -0.1, 0);
  const orbitRadius = Math.hypot(1.1, 10.4);
  camera.position.set(0, 1.0, 10.4);
  camera.lookAt(target);
  scene.add(new THREE.HemisphereLight(0xfffaf4, 0x181613, 0.95));
  const key = new THREE.DirectionalLight(0xfffaf4, 3.7);
  key.position.set(-4, 7, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = key.shadow.camera.bottom = -7;
  key.shadow.camera.right = key.shadow.camera.top = 7;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 25;
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.radius = 3;
  key.shadow.normalBias = 0.025;
  key.shadow.bias = -0.0003;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xe7cb99, 2.3);
  rim.position.set(4, 4, -4);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 0.35);
  fill.position.set(2, 2, 6);
  scene.add(fill);

  const world = new THREE.Group();
  scene.add(world);
  const diamond = new THREE.Group();
  diamond.position.y = 0.17;
  world.add(diamond);
  const triangles = diamondTriangles();
  const wholeGeometry = createDiamondGeometry(triangles);
  const wholeMaterial = diamondMaterial();
  const whole = new THREE.Mesh(wholeGeometry, wholeMaterial);
  const inverseDiamond = new THREE.Matrix4();
  whole.castShadow = true;
  diamond.add(whole);
  const burst = { value: state.burst };
  const piecesGeometry = createFragmentGeometry(triangles);
  const piecesMaterial = diamondMaterial(burst);
  const pieces = new THREE.Mesh(piecesGeometry, piecesMaterial);
  pieces.customDepthMaterial = fragmentDepthMaterial(burst);
  // The vertices fly beyond the assembled geometry's bounding sphere.
  pieces.frustumCulled = false;
  pieces.castShadow = true;
  diamond.add(pieces);
  const rockSurface = createRockMaterial(renderer, host.clientWidth < 768);
  const rockMaterial = rockSurface.material;
  const rocks = rockComposition.map((data) => {
    const mesh = new THREE.Mesh(createRockGeometry(data.seed), rockMaterial);
    mesh.rotation.set(...data.rotation);
    mesh.castShadow = mesh.receiveShadow = true;
    world.add(mesh);
    return { mesh, data };
  });
  const rockMotion = createRockMotion(world, rocks, rockMaterial);
  const groundGeometry = new THREE.PlaneGeometry(40, 40);
  const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.38 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -2.13;
  ground.receiveShadow = true;
  scene.add(ground);

  const sparksGeometry = new THREE.BufferGeometry();
  const random = seededRandom(2026);
  sparksGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      Array.from({ length: 42 }, () => [(random() - 0.5) * 12, random() * 5 - 1, (random() - 0.5) * 4]).flat(),
      3,
    ),
  );
  const sparksMaterial = new THREE.PointsMaterial({
    color: "#f2e5d4",
    size: 0.018,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  });
  const sparks = new THREE.Points(sparksGeometry, sparksMaterial);
  world.add(sparks);

  let frame = 0,
    idleFrame = 0,
    disposed = false,
    visible = false,
    ready = false,
    mapsReady = false,
    contextAvailable = true,
    mobile = false,
    previousFrame = 0,
    slowFrames = 0,
    shadowBurst = -1,
    refining = false;
  const draw = (time) => {
    frame = 0;
    if (disposed || !mapsReady || !contextAvailable || !visible || document.hidden) return;
    const interval = time - previousFrame;
    previousFrame = time;
    // Only measure continuous interaction, not the gap between on-demand frames.
    if (interval > 250) slowFrames = 0;
    else if (interval > 25) slowFrames++;
    else slowFrames = Math.max(0, slowFrames - 1);
    if (!refining && slowFrames >= 8 && pixelRatio > 0.7) {
      pixelRatio = Math.max(0.7, pixelRatio * 0.8);
      renderer.setPixelRatio(pixelRatio);
      slowFrames = 0;
    }
    burst.value = state.burst;
    whole.visible = state.burst < 0.015;
    pieces.visible = !whole.visible;
    diamond.scale.setScalar(mobile ? 1.03 : 1.3);
    diamond.rotation.y = 0.12;
    // Orbit the view: the sculpture turns on screen while its lighting and floor shadows stay stable.
    const yaw = state.yaw + state.hoverYaw + state.baseYaw;
    const pitch = state.pitch + state.hoverPitch;
    const elevation = THREE.MathUtils.clamp(0.105 + pitch, 0.04, 0.7);
    camera.position.set(
      -Math.sin(yaw) * orbitRadius * Math.cos(elevation),
      target.y + Math.sin(elevation) * orbitRadius,
      Math.cos(yaw) * orbitRadius * Math.cos(elevation),
    );
    camera.lookAt(target);
    rockMotion.update(state.burst, mobile);
    if (shadowBurst !== state.burst) {
      renderer.shadowMap.needsUpdate = true;
      shadowBurst = state.burst;
    }
    sparksMaterial.opacity = 0.1 + state.burst * 0.18;
    scene.updateMatrixWorld();
    wholeMaterial.uniforms.uWorldBasis.value.setFromMatrix4(whole.matrixWorld);
    inverseDiamond.copy(whole.matrixWorld).invert();
    wholeMaterial.uniforms.uCameraLocal.value.copy(camera.position).applyMatrix4(inverseDiamond);
    renderer.render(scene, camera);
    host.dataset.pixelRatio = pixelRatio.toFixed(2);
    host.dataset.rocks = `${rocks.length},${rockMotion.count(mobile)}`;
    host.dataset.rockMaterial = "anthracite-bronze";
    host.dataset.rockMotion = state.burst.toFixed(3);
    host.dataset.rotation = `${pitch.toFixed(3)},${yaw.toFixed(3)}`;
    if (!ready) {
      ready = true;
      onReady(triangles.length);
    }
  };
  const requestRender = () => {
    clearTimeout(idleFrame);
    if (!frame && !disposed && contextAvailable && visible && !document.hidden) frame = requestAnimationFrame(draw);
    // Interaction may adapt resolution, but the resting jewel always resolves crisply.
    idleFrame = window.setTimeout(() => {
      if (disposed || !contextAvailable || !visible || document.hidden || pixelRatio === crispPixelRatio) return;
      pixelRatio = crispPixelRatio;
      renderer.setPixelRatio(pixelRatio);
      slowFrames = 0;
      refining = true;
      if (!frame)
        frame = requestAnimationFrame((time) => {
          draw(time);
          refining = false;
        });
      else refining = false;
    }, 220);
  };
  const resize = () => {
    if (disposed) return;
    const width = host.clientWidth,
      height = host.clientHeight;
    if (!width || !height) return;
    mobile = width < 768;
    crispPixelRatio = Math.min(window.devicePixelRatio, mobile ? 1.75 : 2);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    shadowBurst = -1;
    requestRender();
  };
  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      requestRender();
    },
    { threshold: 0 },
  );
  // Observe the section, whose bounds remain stable through the sticky scroll range.
  observer.observe(host.closest("#diamond-experience") ?? host);
  const sizing = new ResizeObserver(resize);
  sizing.observe(host);
  resize();
  rockSurface.ready
    .then(() => {
      if (disposed) return;
      mapsReady = true;
      host.dataset.prepared = "true";
      // Asset loading is complete even when the section is still offscreen.
      // First-paint readiness is separate so lazy loading cannot time out
      // merely because the visitor has paused above the showcase.
      onPrepared();
      requestRender();
    })
    .catch(() => {
      if (!disposed) onLost();
    });
  const visibility = () => requestRender();
  const lost = (event) => {
    event.preventDefault();
    contextAvailable = false;
    onLost();
  };
  const restored = () => {
    contextAvailable = true;
    shadowBurst = -1;
    ready = false;
    requestRender();
  };
  document.addEventListener("visibilitychange", visibility);
  renderer.domElement.addEventListener("webglcontextlost", lost);
  renderer.domElement.addEventListener("webglcontextrestored", restored);
  return {
    render: requestRender,
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      clearTimeout(idleFrame);
      observer.disconnect();
      sizing.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      renderer.domElement.removeEventListener("webglcontextrestored", restored);
      for (const geometry of [
        wholeGeometry,
        piecesGeometry,
        groundGeometry,
        sparksGeometry,
        ...rocks.map(({ mesh }) => mesh.geometry),
      ])
        geometry.dispose();
      for (const material of [
        wholeMaterial,
        piecesMaterial,
        pieces.customDepthMaterial,
        rockMaterial,
        groundMaterial,
        sparksMaterial,
      ])
        material.dispose();
      rockMotion.dispose();
      rockSurface.textures.forEach((texture) => texture.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
