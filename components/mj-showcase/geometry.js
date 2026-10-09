import * as THREE from "three";
import { seededRandom } from "./random";
export { createRockGeometry } from "./rock-geometry";
export { seededRandom } from "./random";

/** A closed brilliant-inspired stone. Its surface triangles also define the burst pieces. */
export function diamondTriangles() {
  const count = 12;
  const rings = [
    { radius: 0.53, y: 0.82, offset: 0 },
    { radius: 0.82, y: 0.49, offset: Math.PI / count },
    { radius: 1.12, y: 0.17, offset: 0 },
    { radius: 1.12, y: 0.1, offset: 0 },
    { radius: 0.4, y: -0.7, offset: Math.PI / count },
  ].map(({ radius, y, offset }) =>
    Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + offset;
      return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    }),
  );
  const triangles = [];
  const add = (a, b, c) => {
    // Consistent outward winding, including the table and pavilion.
    const centre = a.clone().add(b).add(c).divideScalar(3);
    const normal = b.clone().sub(a).cross(c.clone().sub(a));
    triangles.push(normal.dot(centre) < 0 ? [a, c, b] : [a, b, c]);
  };
  for (let i = 0; i < count; i++) {
    const next = (i + 1) % count;
    add(new THREE.Vector3(0, 0.82, 0), rings[0][i], rings[0][next]);
    for (let r = 0; r < rings.length - 1; r++) {
      add(rings[r][i], rings[r + 1][i], rings[r][next]);
      add(rings[r][next], rings[r + 1][i], rings[r + 1][next]);
    }
    add(rings.at(-1)[i], new THREE.Vector3(0, -1.12, 0), rings.at(-1)[next]);
  }
  return triangles;
}

export function createDiamondGeometry(triangles) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      triangles.flatMap((face) => face.flatMap((v) => v.toArray())),
      3,
    ),
  );
  geometry.computeVertexNormals();
  return geometry;
}

/** Closed tetrahedral pieces share one draw call; the GPU moves each piece independently. */
export function createFragmentGeometry(triangles) {
  const random = seededRandom(1916);
  const positions = [],
    centres = [],
    bursts = [],
    axes = [],
    spins = [];
  const core = new THREE.Vector3(0, -0.03, 0);
  triangles.forEach((face) => {
    const centre = face[0].clone().add(face[1]).add(face[2]).add(core).divideScalar(4);
    const normal = face[0].clone().add(face[1]).add(face[2]).divideScalar(3).normalize();
    const distance = 1.8 + random() * 2.8;
    const burst = new THREE.Vector3(
      normal.x * distance * 1.3,
      normal.y * distance * 0.8 + 0.7,
      normal.z * distance * 0.34,
    );
    const axis = new THREE.Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize();
    const spin = (random() - 0.5) * Math.PI * 4;
    const faces = [face, [face[0], core, face[1]], [face[1], core, face[2]], [face[2], core, face[0]]];
    faces.forEach((triangle) =>
      triangle.forEach((vertex) => {
        positions.push(...vertex.toArray());
        centres.push(...centre.toArray());
        bursts.push(...burst.toArray());
        axes.push(...axis.toArray());
        spins.push(spin);
      }),
    );
  });
  const geometry = new THREE.BufferGeometry();
  for (const [name, values, size] of [
    ["position", positions, 3],
    ["aCentre", centres, 3],
    ["aBurst", bursts, 3],
    ["aAxis", axes, 3],
    ["aSpin", spins, 1],
  ]) {
    geometry.setAttribute(name, new THREE.Float32BufferAttribute(values, size));
  }
  geometry.computeVertexNormals();
  return geometry;
}
