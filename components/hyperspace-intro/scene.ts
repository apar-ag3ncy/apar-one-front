import * as THREE from "three";
import { journeyFrame } from "./journey";

const screenVertex = `varying vec2 vUv;
void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;

const shared = `
uniform float uProgress,uWarp,uTravel,uReveal,uWarmth,uAspect;
float aperture(vec2 p){
  float edge=uReveal*(length(vec2(uAspect,1.))*.55+.2);
  return uReveal<.001?1.:smoothstep(edge-.12,edge+.04,length(p));
}
`;

const tunnelFragment = `${shared}
varying vec2 vUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
void main(){
  vec2 p=(vUv-.5)*vec2(uAspect,1.);
  float r=length(p),a=atan(p.y,p.x);
  // Polar noise gives the tunnel volume without a costly raymarch or bloom pass.
  vec2 q=vec2(a*7.,log(max(r,.012))*3.-uTravel*.16);
  float n=noise(q)*.56+noise(q*2.03)*.29+noise(q*4.07)*.15;
  float rays=pow(noise(vec2(a*72.,uProgress*2.)),5.);
  float cloud=pow(n,3.)*(.18+uWarp*.8);
  float core=exp(-r*19.)*uWarp;
  float halo=exp(-r*3.4)*uWarp;
  vec3 tint=mix(vec3(.18,.53,.85),vec3(.95,.22,.11),uWarmth*.78);
  vec3 col=vec3(.001,.004,.012)+tint*(cloud*uWarp+halo*.36+rays*.1*uWarp);
  col+=vec3(.78,.9,1.)*core*1.35;
  col*=1.-smoothstep(.25,1.1,r)*.3;
  col=1.-exp(-col*1.7);
  gl_FragColor=vec4(col,aperture(p));
}`;

const starVertex = `
attribute vec4 aStar;
attribute vec2 aLook;
uniform float uTravel,uStretch,uWarp,uAspect,uHeight,uProgress;
varying vec2 vUv,vScreen;
varying float vAlpha,vBright,vWarp;
void main(){
  float z=mod(aStar.z-uTravel*(.72+aLook.y*.2),100.)+2.;
  vec2 head=aStar.xy/z;
  vec2 tail=aStar.xy/(z+uStretch*(.8+aLook.y*.35));
  vec2 tangent=normalize(head-tail+vec2(.00001));
  vec2 normal=vec2(-tangent.y,tangent.x);
  float size=aLook.x/uHeight;
  float len=length(head-tail)+size*2.;
  vec2 p=(head+tail)*.5+tangent*position.x*len+normal*position.y*size*4.;
  vScreen=p;
  gl_Position=vec4(p.x/uAspect*2.,p.y*2.,0.,1.);
  vUv=uv;
  vAlpha=smoothstep(2.,5.,z)*(1.-smoothstep(78.,102.,z));
  vAlpha*=.65+.35*sin(aStar.w*83.+uProgress*14.);
  vBright=aStar.w;
  vWarp=uWarp;
}`;

const starFragment = `${shared}
varying vec2 vUv,vScreen;
varying float vAlpha,vBright,vWarp;
void main(){
  vec2 q=vUv*2.-1.;
  float dotStar=exp(-dot(q,q)*4.);
  float streak=exp(-q.y*q.y*7.)*pow(max(0.,1.-q.x*q.x),.65);
  float light=mix(dotStar,streak,smoothstep(.03,.25,vWarp));
  vec3 tint=mix(vec3(.5,.82,1.),vec3(.80,.88,1.),vBright);
  tint=mix(tint,vec3(1.,.72,.5),uWarmth*.45);
  tint=mix(tint,vec3(1.),pow(vBright,8.));
  float alpha=light*vAlpha*(.38+vBright*.6)*aperture(vScreen);
  gl_FragColor=vec4(tint,alpha);
}`;

export function createHyperspace(host: HTMLElement, onLost: () => void) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.5 : 2));
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const uniforms = {
    uProgress: { value: 0 }, uTravel: { value: 0 }, uWarp: { value: 0 },
    uStretch: { value: 0 }, uReveal: { value: 0 }, uWarmth: { value: 0 },
    uAspect: { value: 1 }, uHeight: { value: 800 },
  };
  const background = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms, vertexShader: screenVertex, fragmentShader: tunnelFragment,
    transparent: true, depthTest: false, depthWrite: false,
  }));
  scene.add(background);
  // Three interleaved depth layers; instanced quads retain subpixel trail widths.
  const count = innerWidth < 700 ? 2100 : 4800;
  const stars = new Float32Array(count * 4), looks = new Float32Array(count * 2);
  let seed = 7029;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < count; i++) {
    const angle = random() * Math.PI * 2;
    const radius = 2 + Math.sqrt(random()) * 57;
    stars.set([Math.cos(angle) * radius, Math.sin(angle) * radius, random() * 100, random()], i * 4);
    looks.set([.8 + random() * 1.7, i % 3], i * 2);
  }
  const base = new THREE.PlaneGeometry(1, 1);
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.index = base.index;
  geometry.attributes.position = base.attributes.position;
  geometry.attributes.uv = base.attributes.uv;
  geometry.setAttribute("aStar", new THREE.InstancedBufferAttribute(stars, 4));
  geometry.setAttribute("aLook", new THREE.InstancedBufferAttribute(looks, 2));
  geometry.instanceCount = count;
  const material = new THREE.ShaderMaterial({
    uniforms, vertexShader: starVertex, fragmentShader: starFragment,
    transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false,
  });
  const field = new THREE.Mesh(geometry, material);
  field.frustumCulled = false;
  field.renderOrder = 1;
  scene.add(field);
  let disposed = false, latestProgress = 0;
  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    renderer.setSize(width, height);
    uniforms.uAspect.value = width / Math.max(1, height);
    uniforms.uHeight.value = height;
    render(latestProgress);
  };
  const observer = new ResizeObserver(resize);
  const lost = (event: Event) => { event.preventDefault(); onLost(); };
  renderer.domElement.addEventListener("webglcontextlost", lost);
  const render = (progress: number) => {
    if (disposed) return;
    latestProgress = progress;
    const frame = journeyFrame(progress);
    uniforms.uProgress.value = frame.progress;
    uniforms.uTravel.value = frame.travel;
    uniforms.uWarp.value = frame.warp;
    uniforms.uStretch.value = frame.stretch;
    uniforms.uReveal.value = frame.reveal;
    uniforms.uWarmth.value = frame.warmth;
    renderer.render(scene, camera);
  };
  observer.observe(host);
  resize();
  return {
    render,
    dispose() {
      if (disposed) return;
      disposed = true;
      observer.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      background.geometry.dispose(); background.material.dispose();
      base.dispose(); geometry.dispose(); material.dispose();
      renderer.dispose(); renderer.domElement.remove();
    },
  };
}
