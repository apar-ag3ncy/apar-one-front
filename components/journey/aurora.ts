import { AdditiveBlending, DoubleSide, Mesh, PlaneGeometry, ShaderMaterial, type Vector2 } from 'three';
import { clientsPortal } from './film-shader';

// Project a folded sheet of light above the horizon. Where the sheet turns
// back on itself, the overlapping folds add light naturally.
export function createAurora(uniforms: {
  aspect: { value: number }; pixelHeight: { value: number }; journey: { value: number };
  clockTime: { value: number }; pointer: { value: Vector2 };
}) {
  const material = new ShaderMaterial({
    uniforms, transparent: true, blending: AdditiveBlending, side: DoubleSide,
    forceSinglePass: true, depthTest: false, depthWrite: false, toneMapped: false,
    vertexShader: `
      uniform float aspect, journey, clockTime;
      uniform vec2 pointer;
      varying vec2 sheet;
      varying float activity;
      varying vec2 framing;
      void main() {
        float along = (uv.x - .5) * 20.;
        float altitude = uv.y;
        float t = clockTime * .12;
        float swell = along * 1.48 + .82 * sin(along * .76 - t * .43) + t * .48;
        float pleat = swell + .36 * sin(2.4 * swell + t * .32);
        float depth = 3.7 + 1.16 * cos(pleat) + .55 * sin(along * .82 + t * .38);
        float x = along + .90 * sin(pleat) + altitude * (.22 + .10 * sin(swell));
        float hem = 1.20 + .22 * sin(along * 1.07 + t * .58);
        float height = 1.35 + .40 * sin(swell * .76 + .5);
        vec2 sky = vec2(x, hem + altitude * height) * (1.65 / depth);
        sky.y -= .53;
        sky.x *= min(1., aspect / 1.45);
        sky += pointer * (.035 / depth);
        // Lift the same folds into the sky as the Clients floor comes into view.
        float landing = smoothstep(4., 5., journey);
        sky.y = mix(sky.y, .19 + .82 * sky.y, landing);
        framing = vec2(sky.x / aspect, sky.y);
        sheet = vec2(along, altitude);
        activity = .60 + .27 * sin(swell - .4) + .13 * cos(2.6 * along - t);
        gl_Position = vec4(framing * depth, 0., depth);
      }`,
    fragmentShader: `
      uniform float clockTime, journey, aspect, pixelHeight;
      varying vec2 sheet, framing;
      varying float activity;
      ${clientsPortal}
      float strands(float x) {
        float cell = floor(x);
        vec2 seeds = fract(sin(mod(cell + vec2(0., 1.), 521.) * 127.1) * 4375.5);
        float f = fract(x);
        return mix(seeds.x, seeds.y, f*f*(3.-2.*f));
      }
      void main() {
        float t = clockTime * .12;
        float drift = sheet.x + .065 * sin(sheet.x * 3. - t) + .07 * t;
        float broad = strands(drift * 4.);
        float fine = strands(drift * 57.);
        fine = mix(fine, .5, smoothstep(.22, 1., fwidth(drift * 57.)));
        float filaments = .30 + .40 * broad + .17 * strands(drift * 19.) + .26 * fine;
        float h = sheet.y;
        float base = .038 + .018 * broad;
        float edge = smoothstep(0., base, h);
        float green = exp(-max(h - base, 0.) * (4.1 - 1.7 * broad));
        float crown = smoothstep(.14, .68, h) * (.30 + .70 * broad);
        vec3 colour = mix(vec3(.16,.93,.54), vec3(.10,.65,.63), smoothstep(.06,.52,h));
        colour = mix(colour, vec3(.51,.35,.68), crown);
        float glow = edge * (green + .16 * crown) * (1. - smoothstep(.61,1.,h));
        float readingLight = mix(.53, 1., smoothstep(.14, .76, length(framing * vec2(1.,1.45))));
        float fade = smoothstep(3.79,3.98,journey) * (1. - smoothstep(5.18,5.45,journey));
        if (journey > 4.) {
          vec2 p = gl_FragCoord.xy * (2. / pixelHeight) - vec2(aspect, 1.);
          vec2 rect = portalRect(p, clamp(journey - 4., 0., 1.), max(journey - 5., 0.));
          float ground = smoothstep(0., .05, -.19 - p.y);
          fade *= (1. - roomArrival() * portalMask(rect)) * (1. - roomArrival() * ground);
          // Let the folds above the Clients copy carry most of the light.
          float aboveCopy = smoothstep(.26, .65, p.y);
          readingLight = mix(readingLight, mix(.32, .92, aboveCopy), smoothstep(4., 5., journey));
        }
        gl_FragColor = vec4(colour, glow * filaments * activity * readingLight * fade);
      }`,
  });
  const curtain = new Mesh(new PlaneGeometry(1, 1, 320, 1), material);
  curtain.frustumCulled = false;
  curtain.visible = false;
  return curtain;
}
