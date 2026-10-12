import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import type { CaseMotionProfile } from "@/lib/case-motion";

/** Small studio-lit identity sculpture. No idle render loop or external model assets. */
export function createBrandScene(host: HTMLElement, profile: CaseMotionProfile, accent: string) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 30);
  camera.position.set(0, .15, 7.8);
  camera.lookAt(0, 0, 0);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .035);
  scene.environment = environment.texture;
  room.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x202020, 2));
  const light = new THREE.DirectionalLight(0xffffff, 4);
  light.position.set(-3, 4, 5); scene.add(light);
  const group = new THREE.Group(); scene.add(group);
  const material = new THREE.MeshStandardMaterial({ color: accent, roughness: .2, metalness: .75 });
  const geometries: THREE.BufferGeometry[] = [];
  const add = (geometry: THREE.BufferGeometry) => {
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, material); group.add(mesh); return mesh;
  };
  if (profile.form === "architecture") {
    for (let i = 0; i < 9; i++) {
      const slab = add(new THREE.BoxGeometry(2.2, .14, 1.7));
      slab.position.y = (i - 4) * .22;
      slab.rotation.y = (i - 4) * .11 * profile.direction;
    }
    group.rotation.x = .3;
  } else if (profile.form === "petal") {
    const geometry = new THREE.SphereGeometry(.45, 28, 18);
    geometries.push(geometry);
    for (let i = 0; i < 8; i++) {
      const angle = i / 8 * Math.PI * 2;
      const petal = new THREE.Mesh(geometry, material);
      petal.scale.set(.72, 1.85, .4);
      petal.position.set(Math.sin(angle) * .83, Math.cos(angle) * .83, Math.sin(angle * 2) * .08);
      petal.rotation.z = -angle; group.add(petal);
    }
    add(new THREE.SphereGeometry(.32, 24, 16));
  } else if (profile.form === "orbit") {
    for (let i = 0; i < 3; i++) {
      const ring = add(new THREE.TorusGeometry(1.15, .075, 12, 80));
      ring.rotation.set(i * .6, i * .75, i * .35);
    }
    add(new THREE.SphereGeometry(.45, 28, 18));
  } else {
    const gem = add(new THREE.OctahedronGeometry(1.4));
    gem.scale.y = 1.15;
    const ring = add(new THREE.TorusGeometry(1.65, .025, 8, 80));
    ring.rotation.x = Math.PI / 2.8;
  }
  let frame = 0, visible = false, disposed = false, available = true;
  const draw = (progress: number, yaw: number, pitch: number) => {
    group.rotation.y = -.25 + profile.direction * progress * Math.PI * .85 + yaw;
    group.rotation.x = (profile.form === "architecture" ? .3 : .08) + pitch;
    group.rotation.z = Math.sin(progress * Math.PI) * profile.direction * .12;
    if (!frame && visible && available && !disposed && !document.hidden) frame = requestAnimationFrame(() => {
      frame = 0;
      if (disposed || !visible || !available || document.hidden) return;
      renderer.render(scene, camera);
      host.dataset.renderer = "webgl";
    });
  };
  let progress = 0, yaw = 0, pitch = 0;
  const resize = () => {
    if (!host.clientWidth || !host.clientHeight || disposed) return;
    renderer.setSize(host.clientWidth, host.clientHeight, false);
    camera.aspect = host.clientWidth / host.clientHeight;
    camera.updateProjectionMatrix(); draw(progress, yaw, pitch);
  };
  const size = new ResizeObserver(resize); size.observe(host);
  const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; draw(progress, yaw, pitch); });
  io.observe(host);
  const visibility = () => draw(progress, yaw, pitch);
  const lost = (e: Event) => { e.preventDefault(); host.dataset.renderer = "fallback"; available = false; cancelAnimationFrame(frame); frame = 0; };
  const restored = () => { available = true; draw(progress, yaw, pitch); };
  renderer.domElement.addEventListener("webglcontextlost", lost);
  renderer.domElement.addEventListener("webglcontextrestored", restored);
  document.addEventListener("visibilitychange", visibility);
  resize();
  return {
    render(p: number, y = 0, x = 0) { progress = p; yaw = y; pitch = x; draw(p, y, x); },
    dispose() {
      disposed = true; cancelAnimationFrame(frame); size.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      renderer.domElement.removeEventListener("webglcontextrestored", restored);
      geometries.forEach(g => g.dispose()); material.dispose(); environment.dispose();
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}
