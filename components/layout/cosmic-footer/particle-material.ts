import * as THREE from "three";
import { GalaxyBrush, RETURN_SECONDS, STROKES, BRUSH_RADIUS, PUSH_STRENGTH, MAX_PUSH, RETURN_DAMPING } from "@/components/layout/cosmic-footer/galaxy-motion";

/** Fine stellar cores, restrained halos and an analytic damped return to each orbit. */
export function particleMaterial(brush: GalaxyBrush, orbit = 0, scatter = 1, interactive = true) {
  return new THREE.ShaderMaterial({
    // Touch devices do not need the desktop cursor's per-star stroke calculations.
    defines: interactive ? { GALAXY_INTERACTIVE: 1 } : {},
    uniforms: {
      uTime: { value: 0 }, uDpr: { value: 1 }, uAspect: { value: 1 }, uOpacity: { value: 1 },
      uOrbit: { value: orbit }, uScatter: { value: scatter },
      uStrokes: { value: brush.segments }, uEvents: { value: brush.events },
    },
    vertexShader: `
      attribute float aSize,aLight,aTint,aSeed;
      uniform float uTime,uDpr,uAspect,uOpacity,uOrbit,uScatter;
      uniform vec4 uStrokes[${STROKES}];uniform vec2 uEvents[${STROKES}];
      varying float vLight,vTint,vSpark;
      void main(){
        vec3 p=position;float radius=length(p.xy);
        float orbit=uTime*uOrbit/(1.+radius*.12);
        p.xy=mat2(cos(orbit),-sin(orbit),sin(orbit),cos(orbit))*p.xy;
        #ifdef GALAXY_INTERACTIVE
        p.z+=sin(uTime*.38+aSeed*30.)*.022;
        #endif
        vec4 mv=modelViewMatrix*vec4(p,1.);
        vec4 clip=projectionMatrix*mv;vec2 screen=clip.xy/clip.w;
        vec2 metric=vec2(uAspect,1.);vec2 push=vec2(0.);
        #ifdef GALAXY_INTERACTIVE
        for(int i=0;i<${STROKES};i++){
          float age=uTime-uEvents[i].x;
          if(age<0.||age>${RETURN_SECONDS.toFixed(1)})continue;
          vec2 start=uStrokes[i].xy*metric,end=uStrokes[i].zw*metric;
          vec2 line=end-start;
          float along=clamp(dot(screen*metric-start,line)/max(dot(line,line),.00001),0.,1.);
          vec2 delta=screen*metric-mix(start,end,along);
          float distance=length(delta);
          if(distance>${BRUSH_RADIUS.toFixed(3)})continue;
          vec2 direction=delta/max(distance,.006);
          if(distance<.006)direction=vec2(cos(aSeed*63.),sin(aSeed*63.));
          float influence=exp(-distance*distance/.011);
          // A gentle lift and a longer, uninterrupted settling tail.
          float spring=age*4.4*exp(-age*${RETURN_DAMPING.toFixed(1)})*(1.-smoothstep(2.7,${RETURN_SECONDS.toFixed(1)},age));
          vec2 swirl=vec2(-direction.y,direction.x)*(.12+.1*aSeed);
          push+=(direction+swirl)*influence*spring*uEvents[i].y*(.42+aSeed*1.1)*${PUSH_STRENGTH.toFixed(3)};
        }
        #endif
        // Repeated passes remain a small local disturbance, even at high speed.
        push=push/(1.+length(push)/${MAX_PUSH.toFixed(3)})*uScatter;
        mv.xy+=push*(-mv.z/projectionMatrix[1][1]);
        mv.z+=length(push)*(.4+aSeed)*.65;
        gl_Position=projectionMatrix*mv;
        float depth=clamp(9./max(2.,-mv.z),.5,2.4);
        gl_PointSize=clamp(aSize*uDpr*depth,.65,22.*uDpr);
        vLight=aLight*(.88+.12*sin(uTime*(.45+aSeed*.5)+aSeed*73.))*uOpacity;
        vTint=aTint;vSpark=smoothstep(3.,9.,aSize);
      }`,
    fragmentShader: `
      varying float vLight,vTint,vSpark;
      void main(){
        vec2 uv=(gl_PointCoord-.5)*2.;float r=length(uv);if(r>1.)discard;
        float core=exp(-r*r*17.);float halo=exp(-r*r*4.)*.16;
        float rays=(exp(-abs(uv.x)*80.)+exp(-abs(uv.y)*80.))*exp(-r*5.)*.12*vSpark;
        vec3 warm=mix(vec3(1.,.23,.075),vec3(1.,.65,.38),min(vTint*1.9,1.));
        vec3 color=mix(warm,vec3(.86,.94,1.),smoothstep(.48,.74,vTint));
        color=mix(color,vec3(1.),core*.38);
        gl_FragColor=vec4(color,(core+halo+rays)*vLight);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}

export function randomSource(seed: number) {
  return () => { seed = Math.imul(1664525,seed)+1013904223|0; return (seed>>>0)/4294967296; };
}
