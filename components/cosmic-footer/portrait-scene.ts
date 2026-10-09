import * as THREE from "three";
import { randomSource } from "./particle-material";

/** Photo-derived shallow relief, never a fabricated 360-degree head. */
export function createPortrait(host: HTMLElement, ready: () => void, failed: () => void) {
  const renderer = new THREE.WebGLRenderer({alpha:true,antialias:false,powerPreference:'low-power'});
  renderer.setClearColor(0,0);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));host.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,1,.1,40);
  camera.position.z=8;
  const world=new THREE.Group();scene.add(world);
  const resources:{dispose:()=>void}[]=[];
  let alive=true,visible=false,frame=0,last=0,time=0,px=0,py=0,progress=1;
  let sampleSize=360;
  let face:THREE.Points<THREE.BufferGeometry,THREE.ShaderMaterial>|null=null;
  const random=randomSource(27);
  const image=new Image();
  image.onload=()=>{
    if(!alive)return;
    const size=host.clientWidth<700?220:360;sampleSize=size;
    const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
    const ctx=canvas.getContext('2d');if(!ctx){failed();return;}
    ctx.drawImage(image,0,0,size,size);const data=ctx.getImageData(0,0,size,size).data;
    const positions:number[]=[],luminance:number[]=[],jitter:number[]=[];
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const index=(y*size+x)*4;if(data[index+3]<160)continue;
      const u=x/size,v=y/size,lum=(data[index]*.2126+data[index+1]*.7152+data[index+2]*.0722)/255;
      const head=Math.max(0,1-Math.pow((u-.51)/.36,2)-Math.pow((v-.43)/.53,2));
      // Shirt fades into the light contours; the face retains its photographed tonal structure.
      const shoulder=1-THREE.MathUtils.smoothstep(v,.65,.98);
      positions.push((u-.5)*5.3,(.5-v)*5.3,Math.sqrt(head)*.65+lum*.05);
      luminance.push((.06+Math.pow(lum,1.9)*.94)*(.1+.9*shoulder));jitter.push(random());
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('aLight',new THREE.Float32BufferAttribute(luminance,1));geometry.setAttribute('aSeed',new THREE.Float32BufferAttribute(jitter,1));
    const material=new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uProgress:{value:1},uScale:{value:host.clientHeight/size*1.28},uPointer:{value:new THREE.Vector2()}},
      vertexShader:`attribute float aLight,aSeed; uniform float uTime,uProgress,uScale;uniform vec2 uPointer;varying float vLight;
      void main(){vec3 p=position;float reveal=smoothstep(aSeed*.35,aSeed*.35+.65,uProgress);
        p.x+=(1.-reveal)*sin(aSeed*34.)*2.;p.y+=(1.-reveal)*cos(aSeed*71.)*1.8;
        p.z+=sin(uTime*.7+aSeed*30.)*.008;
        vec2 delta=p.xy-uPointer;float near=exp(-dot(delta,delta)*4.);p.xy+=delta*near*.05;
        vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp(uScale*8./-mv.z,1.,3.4);vLight=min(1.,pow(aLight,.82)*1.7)*reveal;}`,
      fragmentShader:`varying float vLight;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;
        vec3 col=mix(vec3(.13,.28,.35),vec3(.79,.91,1.),pow(vLight,.7));
        gl_FragColor=vec4(col,(1.-smoothstep(.3,1.,r))*(.1+vLight*.9));}`,
      transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
    resources.push(geometry,material);face=new THREE.Points(geometry,material);world.add(face);wake();ready();
  };image.onerror=failed;image.src='/people/suraj-cutout.png';

  // Connected light contours flow out from the neck into a broad shoulder silhouette.
  const lp:number[]=[],la:number[]=[];
  for(let row=0;row<38;row++){
    const curve=(x:number)=>-1.4-row*.058+.44*Math.exp(-x*x/.75)+Math.sin(x*2.4+row*.21)*.045+Math.sin(x*8+row*.37)*.012;
    for(let i=0;i<190;i++){
      const x=(i/190-.5)*10,nx=((i+1)/190-.5)*10;
      const intensity=(row%8===0?.82:.18)*(1-Math.abs(x)/6);
      lp.push(x,curve(x),.1,nx,curve(nx),.1);la.push(intensity,intensity);
    }
  }
  const linesGeometry=new THREE.BufferGeometry();linesGeometry.setAttribute('position',new THREE.Float32BufferAttribute(lp,3));linesGeometry.setAttribute('aLight',new THREE.Float32BufferAttribute(la,1));
  const lineMaterial=new THREE.ShaderMaterial({uniforms:{uTime:{value:0}},vertexShader:`attribute float aLight;uniform float uTime;varying float vLight;
    void main(){vec3 p=position;p.y+=sin(p.x*2.+uTime*.65+p.y*3.)*.035;vLight=aLight*(.55+.45*pow(.5+.5*sin(p.x*1.8-uTime*.65),4.));gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader:`varying float vLight;void main(){gl_FragColor=vec4(.62,.84,1.,vLight);}`,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
  world.add(new THREE.LineSegments(linesGeometry,lineMaterial));resources.push(linesGeometry,lineMaterial);

  const rp:number[]=[],rs:number[]=[];
  for(let col=0;col<45;col++)for(let row=0;row<65;row++){
    const x=(col/44-.5)*15+(random()-.5)*.1;
    rp.push(x,(row/64-.5)*10,-1-random()*2);rs.push(random());
  }
  const rainGeometry=new THREE.BufferGeometry();rainGeometry.setAttribute('position',new THREE.Float32BufferAttribute(rp,3));rainGeometry.setAttribute('aSeed',new THREE.Float32BufferAttribute(rs,1));
  const rainMaterial=new THREE.ShaderMaterial({uniforms:{uTime:{value:0}},vertexShader:`attribute float aSeed;uniform float uTime;varying float vLight;
   void main(){vec3 p=position;p.y=mod(p.y+5.-uTime*(.04+aSeed*.035),10.)-5.;p.x+=sin(uTime*.15+p.y*.4)*.035;
   vLight=(.035+pow(aSeed,5.)*.35)*smoothstep(.8,3.6,abs(p.x));gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);gl_PointSize=1.+aSeed*2.;}`,
   fragmentShader:`varying float vLight;void main(){float edge=1.-smoothstep(.3,.5,abs(gl_PointCoord.x-.5));gl_FragColor=vec4(.35,.72,.91,vLight*edge);}`,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
  scene.add(new THREE.Points(rainGeometry,rainMaterial));resources.push(rainGeometry,rainMaterial);
  const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);if(face)face.material.uniforms.uScale.value=h/sampleSize*1.28;camera.aspect=w/h;camera.position.z=w<700?12.5:8;world.position.x=w<700?0:-1.25;world.position.y=w<700?-.15:0;camera.updateProjectionMatrix();};
  const render=()=>{frame=0;if(!alive||!visible||document.hidden)return;const now=performance.now();time+=Math.min((now-last)/1000,.05);last=now;
    world.rotation.y+=(px*.095-world.rotation.y)*.04;world.rotation.x+=(-py*.035-world.rotation.x)*.04;
    if(face){face.material.uniforms.uTime.value=time;face.material.uniforms.uProgress.value=progress;face.material.uniforms.uPointer.value.set(px*4,py*3);}
    lineMaterial.uniforms.uTime.value=time;rainMaterial.uniforms.uTime.value=time;
    renderer.render(scene,camera);frame=requestAnimationFrame(render);};
  const wake=()=>{if(!frame&&alive&&visible&&!document.hidden){last=performance.now();frame=requestAnimationFrame(render);}};
  const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)wake();else{cancelAnimationFrame(frame);frame=0;}},{threshold:0});io.observe(host);
  const ro=new ResizeObserver(()=>{resize();wake();});ro.observe(host);resize();
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();};document.addEventListener('visibilitychange',visibility);
  const lost=(e:Event)=>{e.preventDefault();visible=false;cancelAnimationFrame(frame);frame=0;failed();};renderer.domElement.addEventListener('webglcontextlost',lost);
  return{progress(value:number){progress=value;},pointer(x:number,y:number){px=x;py=y;},dispose(){alive=false;cancelAnimationFrame(frame);image.onload=null;image.onerror=null;io.disconnect();ro.disconnect();document.removeEventListener('visibilitychange',visibility);renderer.domElement.removeEventListener('webglcontextlost',lost);resources.forEach(r=>r.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}};
}
