import * as THREE from "three";

/** Black fractured anthracite with satin platelets and fine bronze mineral seams. */
export function createRockMaterial(renderer, mobile) {
  const loader = new THREE.TextureLoader();
  const suffix = mobile ? "-mobile" : "";
  const textures = [];
  const load = (name, color = false) => {
    let texture;
    const ready = new Promise((resolve, reject) => {
      texture = loader.load(`/showcase/mj/anthracite-${name}${suffix}.webp`, resolve, undefined, reject);
    });
    if (color) texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    textures.push(texture);
    return { texture, ready };
  };
  const color = load("color", true);
  const surface = load("surface");
  const material = new THREE.MeshStandardMaterial({ color: "#f4f1ea", roughness: 0.55, metalness: 0.055 });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRockColor = { value: color.texture };
    shader.uniforms.uRockSurface = { value: surface.texture };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vRockPosition; varying vec3 vRockNormal;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvRockPosition = position; vRockNormal = normal;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform sampler2D uRockColor; uniform sampler2D uRockSurface;
        varying vec3 vRockPosition; varying vec3 vRockNormal;
        vec4 rockProjection(sampler2D map, vec3 p, vec3 weights) {
          return texture2D(map, p.zy) * weights.x + texture2D(map, p.xz) * weights.y + texture2D(map, p.xy) * weights.z;
        }
        vec3 mineralNormal(vec3 position, vec3 normal, float height, float faceDirection) {
          vec3 dx = dFdx(position), dy = dFdy(position);
          vec3 rx = cross(dy, normal), ry = cross(normal, dx);
          float determinant = dot(dx, rx) * faceDirection;
          vec3 gradient = sign(determinant) * (dFdx(height) * rx + dFdy(height) * ry);
          return normalize(max(abs(determinant), 0.0000001) * normal - gradient);
        }`,
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        vec3 rockNormal = normalize(vRockNormal);
        vec3 weights = pow(abs(rockNormal), vec3(6.0));
        weights /= max(weights.x + weights.y + weights.z, 0.001);
        vec3 rockPoint = vRockPosition * 0.58 + vec3(0.17, 0.31, 0.09);
        vec3 rockColor = rockProjection(uRockColor, rockPoint, weights).rgb;
        vec4 rockSurface = rockProjection(uRockSurface, rockPoint, weights);
        float fractureSide = 1.0 - smoothstep(0.25, 0.8, abs(rockNormal.y));
        diffuseColor.rgb *= rockColor * rockSurface.b * mix(1.0, 0.62, fractureSide);`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        "#include <roughnessmap_fragment>\nroughnessFactor = clamp(rockSurface.g + fractureSide * 0.17, 0.34, 0.9);",
      )
      .replace(
        "#include <metalnessmap_fragment>",
        "#include <metalnessmap_fragment>\nmetalnessFactor = 0.055 + clamp((rockColor.r - rockColor.b - 0.003) * 12.0, 0.0, 1.0) * 0.18;",
      )
      .replace(
        "#include <normal_fragment_maps>",
        "#include <normal_fragment_maps>\nnormal = mineralNormal(-vViewPosition, normal, (rockSurface.r - 0.5) * 0.022, faceDirection);",
      )
      .replace(
        "#include <opaque_fragment>",
        `// Broad studio reflections reveal satin platelets without turning the stone grey.
        vec3 rockView = normalize(vViewPosition);
        vec3 reflected = transformDirectionByInverseViewMatrix(reflect(-rockView, normal), viewMatrix);
        float softbox = pow(max(dot(reflected, normalize(vec3(-0.5, 0.6, -1.0))), 0.0), 8.0);
        float bronzeRim = pow(max(dot(reflected, normalize(vec3(0.6, 0.4, -1.0))), 0.0), 14.0);
        float satinFresnel = 0.08 + 0.92 * pow(1.0 - abs(dot(normal, rockView)), 5.0);
        outgoingLight += (vec3(0.32, 0.30, 0.27) * softbox + vec3(0.18, 0.135, 0.075) * bronzeRim)
          * satinFresnel * (1.0 - roughnessFactor) * mix(1.0, 0.32, fractureSide) * rockSurface.b;
        #include <opaque_fragment>`,
      );
  };
  material.customProgramCacheKey = () => "mj-anthracite-bronze-triplanar-v2";
  return { material, textures, ready: Promise.all([color.ready, surface.ready]) };
}
