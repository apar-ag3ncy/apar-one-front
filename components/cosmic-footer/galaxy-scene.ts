import * as THREE from "three";
import { particleMaterial, randomSource } from "./particle-material";
import { GalaxyBrush } from "./galaxy-motion";

type StarData = { position: number[]; size: number[]; light: number[]; tint: number[]; seed: number[] };

export function createGalaxy(host: HTMLElement, ready: () => void, failed: () => void) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
  const mobile = host.clientWidth < 700;
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.5));
  renderer.setClearColor(0, 0); host.appendChild(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(43, 1, .1, 80);
  camera.position.z = 10;
  const random = randomSource(20261008), brush = new GalaxyBrush();
  const geometries: THREE.BufferGeometry[] = [], materials: THREE.ShaderMaterial[] = [];
  const data = (): StarData => ({ position: [], size: [], light: [], tint: [], seed: [] });
  const addStar = (d: StarData, x: number, y: number, z: number, size: number, light: number, tint: number) => {
    d.position.push(x, y, z); d.size.push(size); d.light.push(light); d.tint.push(tint); d.seed.push(random());
  };
  const field = (d: StarData, orbit: number, scatter: number) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(d.position, 3));
    for (const key of ['size', 'light', 'tint', 'seed'] as const) {
      geometry.setAttribute(`a${key[0].toUpperCase()}${key.slice(1)}`, new THREE.Float32BufferAttribute(d[key], 1));
    }
    const material = particleMaterial(brush, orbit, scatter);
    material.uniforms.uDpr.value = renderer.getPixelRatio();
    geometries.push(geometry); materials.push(material);
    const points = new THREE.Points(geometry, material);
    // Shader displacement can briefly extend beyond the rest-position sphere.
    points.frustumCulled = false;
    return points;
  };

  const galaxy = new THREE.Group(); galaxy.rotation.set(.93, -.08, .26); scene.add(galaxy);
  const stars = data(), count = mobile ? 28000 : 68000;
  for (let i = 0; i < count; i++) {
    const r = Math.pow(random(), .72) * 7.8;
    const arm = (i % 3) * Math.PI * 2 / 3;
    const angle = arm + r * .86 + (random() - .5) * (.33 + r * .045);
    const spread = (random() + random() + random() - 1.5) * (.13 + r * .055);
    const bright = random();
    addStar(stars, Math.cos(angle) * r + spread, Math.sin(angle) * r + spread,
      (random() + random() - 1) * (.1 + r * .04),
      bright > .997 ? 10 + random() * 9 : bright > .97 ? 3.5 + random() * 3 : 1.6 + random() * 1.8,
      bright > .97 ? .9 + random() * .5 : .3 + random() * .6,
      random() < .27 ? .76 + random() * .24 : .07 + random() * .37);
  }
  // A spherical central bulge and diffuse inter-arm stars make the disc feel volumetric.
  for (let i = 0; i < (mobile ? 4000 : 9000); i++) {
    const r = Math.pow(random(), 1.6) * 2.1, theta = random() * Math.PI * 2, z = random() * 2 - 1;
    const ring = Math.sqrt(1 - z * z) * r;
    addStar(stars, Math.cos(theta) * ring, Math.sin(theta) * ring, z * r * .36,
      1.3 + random() * 2, .22 + random() * .5, .35 + random() * .65);
  }
  galaxy.add(field(stars, .033, 1));

  const space = data();
  for (let i = 0; i < (mobile ? 1900 : 4800); i++) {
    const bright = random() > .994;
    addStar(space, (random() - .5) * 28, (random() - .5) * 17, -7 + random() * 10,
      bright ? 8 + random() * 9 : 1.2 + random() * 2.1,
      bright ? .8 : .12 + random() * .38, random() < .78 ? .9 : .3);
  }
  const starField = field(space, 0, .55); scene.add(starField);

  const hazeGeometry = new THREE.PlaneGeometry(19, 19);
  const hazeMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 vUv;uniform float uTime;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
      float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+4.7;a*=.5;}return v;}
      void main(){vec2 p=(vUv-.5)*19.;float r=length(p),angle=atan(p.y,p.x);
        float arm=pow(.5+.5*cos((angle-r*.86+uTime*.015)*3.),10.);
        float cloud=fbm(p*2.4+uTime*.018);
        float dust=arm*exp(-r*r*.025)*smoothstep(.23,.85,cloud);
        float core=exp(-r*r*1.5);
        vec3 color=mix(vec3(.45,.065,.016),vec3(1.,.52,.27),cloud);
        color=mix(color,vec3(.87,.88,.94),core*.6);
        float density=(dust*.3+core*.2)*(1.-smoothstep(7.,9.,r));
        gl_FragColor=vec4(color,density);}`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const haze = new THREE.Mesh(hazeGeometry, hazeMaterial); haze.position.z = -.35; galaxy.add(haze);

  let alive = true, visible = false, frame = 0, time = 0, last = 0, progress = .5;
  let pointerX = 0, pointerY = 0, pointerActive = false;
  let logo: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> | null = null;
  const image = new Image();
  image.onload = () => {
    if (!alive) return;
    const canvas = document.createElement('canvas'); canvas.width = 440; canvas.height = 244;
    const ctx = canvas.getContext('2d'); if (!ctx) { failed(); return; }
    ctx.drawImage(image, 0, 0, 440, 244);
    const pixels = ctx.getImageData(0, 0, 440, 244).data, d = data();
    for (let y = 0; y < 244; y += 2) for (let x = 0; x < 440; x += 2) {
      if (pixels[(y * 440 + x) * 4 + 3] < 100) continue;
      const bright = random() > .996;
      addStar(d, ((x + (random() - .5) * 1.8) / 440 - .5) * 6.5,
        (.5 - (y + (random() - .5) * 1.8) / 244) * 3.6,
        .6 + (random() - .5) * .22, bright ? 9 : 3.5 + random() * 1.5,
        .6 + random() * .6, .3 + random() * .62);
    }
    logo = field(d, 0, 1.15); scene.add(logo); resize(); wake(); ready();
  };
  image.onerror = failed; image.src = '/assets/apar-logo-cream.svg';
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.position.z = w < h ? 13.8 : 10;
    camera.updateProjectionMatrix();
    for (const material of materials) material.uniforms.uAspect.value = w / h;
  };
  const render = () => {
    frame = 0; if (!alive || !visible || document.hidden) return;
    const now = performance.now(), dt = Math.min((now - last) / 1000, .05); last = now; time += dt;
    if (pointerActive) brush.move(pointerX, pointerY, time, camera.aspect);
    const smooth = 1 - Math.exp(-dt * 2.5);
    galaxy.rotation.y += ((pointerActive ? pointerX * .08 : 0) - .08 - galaxy.rotation.y) * smooth;
    galaxy.rotation.x = .93 + Math.sin(time * .13) * .035;
    galaxy.rotation.z = .26 + Math.sin(time * .075) * .05;
    starField.position.x += ((pointerActive ? pointerX * -.18 : 0) - starField.position.x) * smooth;
    starField.position.y = Math.sin(time * .09) * .055;
    for (const material of materials) material.uniforms.uTime.value = time;
    hazeMaterial.uniforms.uTime.value = time;
    if (logo) {
      logo.material.uniforms.uOpacity.value = .16 + THREE.MathUtils.smoothstep(progress, .08, .5) * .86;
      logo.position.y = (1 - THREE.MathUtils.smoothstep(progress, 0, .55)) * .28;
      logo.rotation.y = galaxy.rotation.y * .22;
    }
    renderer.render(scene, camera); frame = requestAnimationFrame(render);
  };
  const wake = () => { if (!frame && alive && visible && !document.hidden) { last = performance.now(); frame = requestAnimationFrame(render); } };
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) wake(); else { cancelAnimationFrame(frame); frame = 0; brush.leave(); pointerActive = false; }
  }); io.observe(host);
  const ro = new ResizeObserver(() => { resize(); wake(); }); ro.observe(host); resize();
  const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; brush.leave(); pointerActive = false; } else wake(); };
  const lost = (event: Event) => { event.preventDefault(); visible = false; cancelAnimationFrame(frame); frame = 0; failed(); };
  document.addEventListener('visibilitychange', visibility); renderer.domElement.addEventListener('webglcontextlost', lost);
  return {
    progress(value: number) { progress = value; },
    pointer(x: number, y: number, active = true) { pointerX = x; pointerY = y; pointerActive = active; if (!active) brush.leave(); },
    dispose() {
      alive = false; cancelAnimationFrame(frame); image.onload = null; image.onerror = null;
      io.disconnect(); ro.disconnect(); document.removeEventListener('visibilitychange', visibility);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); hazeGeometry.dispose(); hazeMaterial.dispose();
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}
