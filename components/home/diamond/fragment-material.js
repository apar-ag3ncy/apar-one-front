import * as THREE from "three";

const rotation = `
uniform float uBurst;
attribute vec3 aCentre;
attribute vec3 aBurst;
attribute vec3 aAxis;
attribute float aSpin;
mat3 mjRotate(vec3 axis, float angle) {
  float c = cos(angle), s = sin(angle), t = 1.0 - c;
  float x = axis.x, y = axis.y, z = axis.z;
  return mat3(t*x*x+c, t*x*y+s*z, t*x*z-s*y,
              t*x*y-s*z, t*y*y+c, t*y*z+s*x,
              t*x*z+s*y, t*y*z-s*x, t*z*z+c);
}`;
const transform = `
#include <begin_vertex>
transformed = mjRotate(aAxis, uBurst * aSpin) * (position - aCentre) * (1.0 - uBurst * 0.64) + aCentre + aBurst * uBurst;
`;

// A compact brilliant volume: light can reflect inside the pavilion before leaving the stone.
// Only the assembled diamond traces this volume; burst fragments use the cheaper studio shader.
const crystalRefraction = `
uniform mat3 uWorldBasis;
uniform vec3 uCameraLocal;
varying vec3 vLocalPosition;
varying vec3 vLocalNormal;
void planeExit(vec3 origin, vec3 ray, vec3 normal, float offset, inout float distance, inout vec3 hitNormal) {
  float denominator = dot(ray, normal);
  if (denominator > 0.0001) {
    float t = (offset - dot(origin, normal)) / denominator;
    if (t > 0.001 && t < distance) { distance = t; hitNormal = normal; }
  }
}
vec3 insideCrystal(vec3 origin, vec3 ray) {
  vec3 hitNormal = vec3(0.0, 1.0, 0.0);
  for (int bounce = 0; bounce < 3; bounce++) {
    float distance = 100.0;
    planeExit(origin, ray, vec3(0.0, 1.0, 0.0), 0.82, distance, hitNormal);
    for (int facet = 0; facet < 8; facet++) {
      float angle = float(facet) * 0.785398163;
      vec2 radial = vec2(cos(angle), sin(angle));
      // Normalized crown and pavilion planes, with matching normalized offsets.
      planeExit(origin, ray, vec3(radial.x, 0.861, radial.y) / 1.319,
        1.266 / 1.319, distance, hitNormal);
      planeExit(origin, ray, vec3(radial.x, -0.918, radial.y) / 1.357,
        1.028 / 1.357, distance, hitNormal);
    }
    if (distance > 99.0) break;
    origin += ray * distance;
    vec3 outgoing = refract(ray, -hitNormal, 2.42);
    if (dot(outgoing, outgoing) > 0.001) return normalize(outgoing);
    ray = reflect(ray, hitNormal);
    origin += ray * 0.003;
  }
  return normalize(ray);
}
`;

/** Sharp softbox reflections, internal refraction and subtle spectral fire. No blurred transmission buffer. */
export function diamondMaterial(uniform = null) {
  return new THREE.ShaderMaterial({
    uniforms: uniform
      ? { uBurst: uniform }
      : { uWorldBasis: { value: new THREE.Matrix3() }, uCameraLocal: { value: new THREE.Vector3() } },
    vertexShader: `
      ${uniform ? rotation : ""}
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      ${uniform ? "" : "varying vec3 vLocalPosition; varying vec3 vLocalNormal;"}
      void main() {
        vec3 transformed = position;
        vec3 facetNormal = normal;
        ${
          uniform
            ? `transformed = mjRotate(aAxis, uBurst * aSpin) * (position - aCentre) * (1.0 - uBurst * 0.64) + aCentre + aBurst * uBurst;
        facetNormal = mjRotate(aAxis, uBurst * aSpin) * normal;`
            : ""
        }
        vec4 world = modelMatrix * vec4(transformed, 1.0);
        vWorldPosition = world.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * facetNormal);
        ${uniform ? "" : "vLocalPosition = transformed; vLocalNormal = facetNormal;"}
        gl_Position = projectionMatrix * viewMatrix * world;
      }`,
    fragmentShader: `
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      ${uniform ? "" : crystalRefraction}
      // Analytic softboxes stay sharp as the stone turns and expose each individual cut.
      vec3 studio(vec3 direction) {
        vec3 d = normalize(direction);
        float strip = exp(-pow((d.x + 0.36 * d.z - 0.18) * 9.0, 2.0));
        float box = pow(max(dot(d, normalize(vec3(-0.8, 0.9, 0.6))), 0.0), 18.0);
        float rim = exp(-pow((d.z - 0.27 * d.x + 0.34) * 15.0, 2.0));
        float ceiling = smoothstep(0.2, 0.8, d.y);
        float glint = pow(max(dot(d, normalize(vec3(0.6, 0.45, 0.7))), 0.0), 160.0);
        return vec3(0.07, 0.025, 0.035) + vec3(2.25) * strip
          + vec3(3.2, 3.0, 2.8) * box + vec3(1.7) * rim
          + vec3(0.32, 0.29, 0.28) * ceiling + vec3(7.0) * glint;
      }
      void main() {
        vec3 n = normalize(vWorldNormal);
        vec3 incident = normalize(vWorldPosition - cameraPosition);
        float facing = abs(dot(-incident, n));
        vec3 reflection = studio(reflect(incident, n));
        ${
          uniform
            ? `
        vec3 refracted = reflect(refract(incident, n, 1.0 / 2.42), -n);
        vec3 refraction = studio(refracted);`
            : `
        vec3 localIncident = normalize(vLocalPosition - uCameraLocal);
        vec3 localNormal = normalize(vLocalNormal);
        vec3 inner = refract(localIncident, localNormal, 1.0 / 2.42);
        vec3 exitRay = insideCrystal(vLocalPosition + inner * 0.006, inner);
        vec3 outgoing = normalize(uWorldBasis * exitRay);
        vec3 dispersion = normalize(cross(outgoing, vec3(0.0, 1.0, 0.2))) * 0.015;
        vec3 refraction = vec3(studio(outgoing + dispersion).r, studio(outgoing).g, studio(outgoing - dispersion).b);`
        }
        float fresnel = 0.17 + 0.83 * pow(1.0 - facing, 4.0);
        vec3 light = mix(refraction, reflection, fresnel);
        light += vec3(0.035) * (0.25 + facing);
        gl_FragColor = vec4(light, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

export function fragmentDepthMaterial(uniform) {
  const material = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uBurst = uniform;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${rotation}`)
      .replace("#include <begin_vertex>", transform);
  };
  material.customProgramCacheKey = () => "mj-diamond-fragment-depth-v1";
  return material;
}
