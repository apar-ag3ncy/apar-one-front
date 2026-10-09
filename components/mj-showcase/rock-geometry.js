import * as THREE from "three";
import { seededRandom } from "./random";

/** Intersect fracture planes to make a closed, angular stone with large irregular break faces. */
export function createRockGeometry(seed, detail = 2) {
  const random = seededRandom(seed);
  const hash = (x, y, z) => {
    let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647) ^ seed;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const noise = (point, scale) => {
    const x = point.x * scale,
      y = point.y * scale,
      z = point.z * scale;
    const ix = Math.floor(x),
      iy = Math.floor(y),
      iz = Math.floor(z);
    const fade = (t) => t * t * (3 - 2 * t);
    const sx = fade(x - ix),
      sy = fade(y - iy),
      sz = fade(z - iz);
    const layer = (dz) =>
      THREE.MathUtils.lerp(
        THREE.MathUtils.lerp(hash(ix, iy, iz + dz), hash(ix + 1, iy, iz + dz), sx),
        THREE.MathUtils.lerp(hash(ix, iy + 1, iz + dz), hash(ix + 1, iy + 1, iz + dz), sx),
        sy,
      );
    return THREE.MathUtils.lerp(layer(0), layer(1), sz);
  };
  const planes = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, -1),
  ].map((normal, i) => {
    // Each slab has its own dominant fracture slope, rather than a uniform horizontal cap.
    if (i === 2) normal.set((random() - 0.5) * 0.5, 1, (random() - 0.5) * 0.38).normalize();
    return {
      normal,
      offset: i === 3 ? 0.68 : i === 2 ? 0.73 + random() * 0.25 : 1.12 + random() * 0.2,
    };
  });
  const phase = random() * Math.PI * 2;
  for (let i = 0; i < 12; i++) {
    // Side fractures keep broad slab faces; the final four planes chip the upper corners.
    const y = i < 8 ? (random() - 0.5) * 0.84 : 0.55 + random() * 0.32;
    const radius = Math.sqrt(1 - y * y);
    const angle = phase + (i < 8 ? (i * Math.PI) / 4 : ((i - 8) * Math.PI) / 2) + random() * 0.24;
    const normal = new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius).normalize();
    planes.push({ normal, offset: i < 8 ? 0.82 + random() * 0.34 : 0.92 + random() * 0.22 });
  }

  const vertices = [];
  const crossBC = new THREE.Vector3(),
    crossCA = new THREE.Vector3(),
    crossAB = new THREE.Vector3();
  for (let a = 0; a < planes.length - 2; a++) {
    for (let b = a + 1; b < planes.length - 1; b++) {
      for (let c = b + 1; c < planes.length; c++) {
        const pa = planes[a],
          pb = planes[b],
          pc = planes[c];
        crossBC.crossVectors(pb.normal, pc.normal);
        const determinant = pa.normal.dot(crossBC);
        if (Math.abs(determinant) < 0.0001) continue;
        crossCA.crossVectors(pc.normal, pa.normal);
        crossAB.crossVectors(pa.normal, pb.normal);
        const point = crossBC
          .clone()
          .multiplyScalar(pa.offset)
          .addScaledVector(crossCA, pb.offset)
          .addScaledVector(crossAB, pc.offset)
          .divideScalar(determinant);
        if (planes.some((plane) => plane.normal.dot(point) > plane.offset + 0.0001)) continue;
        if (!vertices.some((vertex) => vertex.distanceToSquared(point) < 0.000001)) vertices.push(point);
      }
    }
  }

  const positions = [],
    normals = [];
  for (const plane of planes) {
    const face = vertices.filter((point) => Math.abs(plane.normal.dot(point) - plane.offset) < 0.0002);
    if (face.length < 3) continue;
    const centre = face.reduce((sum, point) => sum.add(point), new THREE.Vector3()).divideScalar(face.length);
    const u = new THREE.Vector3()
      .crossVectors(
        plane.normal,
        Math.abs(plane.normal.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0),
      )
      .normalize();
    const v = new THREE.Vector3().crossVectors(plane.normal, u);
    face.sort(
      (a, b) =>
        Math.atan2(a.clone().sub(centre).dot(v), a.clone().sub(centre).dot(u)) -
        Math.atan2(b.clone().sub(centre).dot(v), b.clone().sub(centre).dot(u)),
    );

    // Shallow irregular relief stays inside the face, so fracture seams remain watertight.
    const inner = face.map((point) =>
      point
        .clone()
        .lerp(centre, 0.12 + random() * 0.12)
        .addScaledVector(plane.normal, 0.012 + random() * 0.016),
    );
    const faceVertices = new Map();
    const faceTriangles = [];
    const vertex = (point) => {
      const key = point
        .toArray()
        .map((value) => value.toFixed(6))
        .join(",");
      if (!faceVertices.has(key)) {
        // Continuous radial relief preserves shared fracture seams while breaking the perfect planes.
        const relief = (noise(point, 3.7) - 0.5) * 0.085 + (noise(point, 11.3) - 0.5) * 0.022;
        faceVertices.set(key, {
          point: point.clone().addScaledVector(point.clone().normalize(), detail ? relief : 0),
          normal: new THREE.Vector3(),
        });
      }
      return faceVertices.get(key);
    };
    const add = (a, b, c, level = detail) => {
      if (level > 0) {
        const ab = a.clone().lerp(b, 0.5),
          bc = b.clone().lerp(c, 0.5),
          ca = c.clone().lerp(a, 0.5);
        add(a, ab, ca, level - 1);
        add(ab, b, bc, level - 1);
        add(ca, bc, c, level - 1);
        add(ab, bc, ca, level - 1);
        return;
      }
      const triangle = [vertex(a), vertex(b), vertex(c)];
      const n = triangle[1].point
        .clone()
        .sub(triangle[0].point)
        .cross(triangle[2].point.clone().sub(triangle[0].point));
      if (n.dot(plane.normal) < 0) {
        triangle.reverse();
        n.negate();
      }
      triangle.forEach((entry) => entry.normal.add(n));
      faceTriangles.push(triangle);
    };
    for (let i = 0; i < face.length; i++) {
      const next = (i + 1) % face.length;
      add(face[i], face[next], inner[i]);
      add(face[next], inner[next], inner[i]);
      add(inner[i], inner[next], centre);
    }
    // Smooth only within each broken face; edges between fracture planes stay crisp.
    faceVertices.forEach((entry) => entry.normal.normalize());
    for (const triangle of faceTriangles) {
      for (const entry of triangle) {
        positions.push(...entry.point.toArray());
        normals.push(...entry.normal.toArray());
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
