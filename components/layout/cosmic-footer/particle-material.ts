import * as THREE from "three";
import { GalaxyBrush, PULSE_COUNT, BRUSH_RADIUS, MAX_PUSH } from "@/components/layout/cosmic-footer/galaxy-motion";

/** Fine stellar cores, restrained halos and an analytic damped return to each orbit. */
export function particleMaterial(brush: GalaxyBrush, orbit = 0, scatter = 1, interactive = true) {
  return new THREE.ShaderMaterial({
    // Touch devices do not need the desktop cursor's per-star hover calculations.
    defines: interactive ? { GALAXY_INTERACTIVE: 1 } : {},
    uniforms: {
      uTime: { value: 0 }, uDpr: { value: 1 }, uAspect: { value: 1 }, uOpacity: { value: 1 },
      uOrbit: { value: orbit }, uScatter: { value: scatter },
      uPulses: { value: brush.pulses },
    },
    vertexShader: `
      attribute float aSize,aLight,aTint,aSeed;
      uniform float uTime,uDpr,uAspect,uOpacity,uOrbit,uScatter;
      #ifdef GALAXY_INTERACTIVE
      uniform vec3 uPulses[${PULSE_COUNT}];
      #endif
      varying float vLight,vTint,vSpark;
      void main(){
        vec3 p=position;float radius=length(p.xy);
        float orbit=uTime*uOrbit/(1.+radius*.12);
        p.xy=mat2(cos(orbit),-sin(orbit),sin(orbit),cos(orbit))*p.xy;
        #ifdef GALAXY_INTERACTIVE
        p.z+=sin(uTime*.38+aSeed*30.)*.022;
        #endif
        vec4 mv=modelViewMatrix*vec4(p,1.);
        #ifdef GALAXY_INTERACTIVE
        vec4 clip = projectionMatrix * mv;
        vec2 screen = clip.xy / clip.w;
        float energy = 0.;
        vec2 outward = vec2(0.);
        for (int i = 0; i < ${PULSE_COUNT}; i++) {
          vec3 pulse = uPulses[i];
          if (pulse.z <= 0.) continue;
          vec2 offset = (screen - pulse.xy) * vec2(uAspect, 1.) / ${BRUSH_RADIUS.toFixed(3)};
          float weight = (1. - smoothstep(0., 1., dot(offset, offset))) * pulse.z;
          energy += weight;
          outward += weight * offset;
        }
        if (energy > 0.) {
          // A fixed direction per star lets neighbours separate in all three
          // dimensions without flicker or a ridge along the cursor's path.
          float angle = aSeed * 6.2831853;
          float z = fract(aSeed * 251.) * 2. - 1.;
          vec2 drift = vec2(cos(angle), sin(angle)) * sqrt(max(0., 1. - z*z));
          vec3 displacement = vec3(drift + .38 * outward / energy, .7 * z);
          float amount = ${MAX_PUSH.toFixed(3)} * (1. - exp(-1.6 * energy)) * uScatter;
          mv.xyz += displacement * amount * (-mv.z / projectionMatrix[1][1]);
        }
        #endif
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
