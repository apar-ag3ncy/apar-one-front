import * as THREE from "three";
import { randomSource } from "./particle-material";

/** Reference-derived artwork with live depth parallax, light flow and glyph rain. */
export function createCharacter(host: HTMLElement, ready: () => void, failed: () => void) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x000304, 1);
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
  camera.position.z = 2;
  let alive = true, visible = false, frame = 0, last = 0, time = 0;
  const target = new THREE.Vector2(), pointer = new THREE.Vector2();
  const random = randomSource(7719);
  const texture = new THREE.TextureLoader().load("/people/feline-particles.webp", () => {
    if (!alive) { texture.dispose(); return; }
    ready(); wake();
  }, undefined, failed);
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uImage: { value: texture }, uTime: { value: 0 }, uPointer: { value: pointer },
      uCrop: { value: new THREE.Vector2(1, 1) }, uCenter: { value: new THREE.Vector2(.5, .5) },
      uScreenCenter: { value: new THREE.Vector2(.5, .5) }, uReveal: { value: 1 },
    },
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader: `
      uniform sampler2D uImage;uniform float uTime,uReveal;
      uniform vec2 uPointer,uCrop,uCenter,uScreenCenter;varying vec2 vUv;
      void main(){
        vec2 uv=(vUv-uScreenCenter)*uCrop+uCenter;
        vec2 head=(uv-vec2(.425,.68))*vec2(4.,3.);
        float relief=exp(-dot(head,head)*1.4);
        uv+=uPointer*vec2(.009,.006)*(.25+relief);
        // Sub-pixel breathing preserves the photographed particle topology.
        uv.y+=sin(uTime*.55)*.0013*relief;
        float shoulders=1.-smoothstep(.37,.61,uv.y);
        uv.x+=sin(uv.y*29.+uTime*.6)*.0012*shoulders;
        if(any(lessThan(uv,vec2(0.)))||any(greaterThan(uv,vec2(1.)))){gl_FragColor=vec4(0.,.003,.006,1.);return;}
        vec3 col=texture2D(uImage,uv).rgb;
        float light=dot(col,vec3(.2126,.7152,.0722));
        float current=pow(.5+.5*sin(uv.x*18.-uv.y*10.-uTime*.8),5.);
        col*=1.+shoulders*smoothstep(.16,.7,light)*current*.35;
        vec2 cursor=(uPointer+1.)*.5;
        float near=exp(-dot(vUv-cursor,vUv-cursor)*28.);
        col+=col*near*.12;
        float edge=smoothstep(0.,.035,uv.x)*(1.-smoothstep(.97,1.,uv.x));
        col*=edge*(.28+.72*smoothstep(0.,.7,uReveal));
        gl_FragColor=vec4(col,1.);
      }`,
    depthTest: false, depthWrite: false,
  });
  const artwork = new THREE.Mesh(geometry, material); artwork.renderOrder = 0; scene.add(artwork);

  // A tiny glyph atlas supplies real moving columns instead of baked background streaks.
  const atlasCanvas = document.createElement("canvas"); atlasCanvas.width = 256; atlasCanvas.height = 128;
  const context = atlasCanvas.getContext("2d");
  if (context) {
    context.fillStyle = "white"; context.font = '19px "APAR Argon"';
    context.textAlign = "center"; context.textBaseline = "middle";
    const chars = "APAR0123456789<>+*:;/[]{}|=~!?XYZ";
    for (let i = 0; i < 32; i++) context.fillText(chars[i % chars.length], (i % 8) * 32 + 16, Math.floor(i / 8) * 32 + 16);
  }
  const atlas = new THREE.CanvasTexture(atlasCanvas);
  const positions: number[] = [], seeds: number[] = [], depths: number[] = [];
  for (let column = 0; column < 35; column++) {
    const x = (column / 34 - .5) * 2.15 + (random() - .5) * .035;
    const depth = random();
    for (let row = 0; row < 90; row++) {
      positions.push(x, row / 90 * 2.8 - 1.4, 0);
      seeds.push(random()); depths.push(depth);
    }
  }
  const rainGeometry = new THREE.BufferGeometry();
  rainGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  rainGeometry.setAttribute("aSeed", new THREE.Float32BufferAttribute(seeds, 1));
  rainGeometry.setAttribute("aDepth", new THREE.Float32BufferAttribute(depths, 1));
  const rainMaterial = new THREE.ShaderMaterial({
    uniforms: { uAtlas: { value: atlas }, uTime: { value: 0 }, uDpr: { value: renderer.getPixelRatio() }, uPointer: { value: pointer } },
    vertexShader: `attribute float aSeed,aDepth;uniform float uTime,uDpr;uniform vec2 uPointer;varying float vLight,vGlyph;
      void main(){vec2 p=position.xy;p.y=mod(p.y+1.4-uTime*(.027+aDepth*.02),2.8)-1.4;
        p.x+=uPointer.x*.015*aDepth+sin(p.y*3.+uTime*.18)*.003;
        float corridor=smoothstep(.17,.5,abs(p.x+.14));
        float pulse=pow(.5+.5*sin(p.y*2.8+position.x*19.+uTime*.2),5.);
        vLight=(.035+pulse*.5)*(.3+aDepth*.7)*corridor;
        vGlyph=floor(aSeed*31.);gl_Position=vec4(p,.1,1.);gl_PointSize=(3.+aDepth*5.)*uDpr;}`,
    fragmentShader: `uniform sampler2D uAtlas;varying float vLight,vGlyph;
      void main(){vec2 tile=vec2(mod(vGlyph,8.),3.-floor(vGlyph/8.));
        vec2 uv=(tile+vec2(gl_PointCoord.x,1.-gl_PointCoord.y))/vec2(8.,4.);
        float glyph=texture2D(uAtlas,uv).a;gl_FragColor=vec4(.4,.69,.83,glyph*vLight);}`,
    transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const rain = new THREE.Points(rainGeometry, rainMaterial); rain.renderOrder = 1; scene.add(rain);
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    if (w < 700) {
      const artHeight = Math.min(h * .72, w * 1.55);
      material.uniforms.uCrop.value.set(w / artHeight / 2, h / artHeight);
      material.uniforms.uCenter.value.set(.425, .5);
      material.uniforms.uScreenCenter.value.set(.5, .43);
    } else {
      material.uniforms.uCrop.value.set(Math.min(1, aspect / 2), Math.min(1, 2 / aspect));
      material.uniforms.uCenter.value.set(aspect < 1.7 ? .45 : .5, .5);
      material.uniforms.uScreenCenter.value.set(.5, .5);
    }
  };
  const render = () => {
    frame = 0; if (!alive || !visible || document.hidden) return;
    const now = performance.now(); const dt = Math.min((now - last) / 1000, .05); last = now; time += dt;
    pointer.lerp(target, 1 - Math.exp(-dt * 5));
    material.uniforms.uTime.value = rainMaterial.uniforms.uTime.value = time;
    renderer.render(scene, camera); frame = requestAnimationFrame(render);
  };
  const wake = () => { if (!frame && alive && visible && !document.hidden) { last = performance.now(); frame = requestAnimationFrame(render); } };
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) wake(); else { cancelAnimationFrame(frame); frame = 0; }
  }); io.observe(host);
  const ro = new ResizeObserver(() => { resize(); wake(); }); ro.observe(host); resize();
  const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else wake(); };
  const lost = (event: Event) => { event.preventDefault(); failed(); };
  document.addEventListener("visibilitychange", visibility); renderer.domElement.addEventListener("webglcontextlost", lost);
  return {
    progress(value: number) { material.uniforms.uReveal.value = value; },
    pointer(x: number, y: number) { target.set(x, y); },
    dispose() {
      alive = false; cancelAnimationFrame(frame); io.disconnect(); ro.disconnect();
      document.removeEventListener("visibilitychange", visibility); renderer.domElement.removeEventListener("webglcontextlost", lost);
      geometry.dispose(); material.dispose(); texture.dispose(); atlas.dispose(); rainGeometry.dispose(); rainMaterial.dispose();
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}
