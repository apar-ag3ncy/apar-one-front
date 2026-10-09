import * as THREE from "three";
import { createRockGeometry } from "./rock-geometry";
import { seededRandom } from "./random";

const groundY = -2.13;
const ease = (value) => {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

export function createRockMotion(world, rocks, material) {
  const geometry = createRockGeometry(207, 0);
  const chips = new THREE.InstancedMesh(geometry, material, 20);
  chips.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  chips.castShadow = true;
  chips.frustumCulled = false;
  world.add(chips);
  const random = seededRandom(79348);
  const debris = Array.from({ length: 20 }, (_, i) => ({
    side: i % 2 ? 1 : -1,
    radius: 1.8 + random() * 2.3,
    lift: 1.5 + random() * 2.1,
    depth: -0.9 + random() * 1.8,
    size: 0.045 + random() * 0.1,
    delay: random() * 0.22,
    rotation: [random() * 4, random() * 4, random() * 4],
    spin: [(random() - 0.5) * 0.9, (random() - 0.5) * 1.4, (random() - 0.5) * 0.8],
  }));
  const temporary = new THREE.Object3D();
  const vertex = new THREE.Vector3();
  let lastBurst = -1,
    lastMobile = null;

  const update = (burst, mobile) => {
    if (burst === lastBurst && mobile === lastMobile) return;
    if (mobile !== lastMobile) {
      for (const { mesh, data } of rocks) {
        mesh.scale.set(
          data.scale[0] * (mobile ? 0.48 : 1),
          data.scale[1] * (mobile ? 0.7 : 1),
          data.scale[2] * (mobile ? 0.65 : 1),
        );
        mesh.rotation.set(...data.rotation);
        // Ground the actual lowest vertex, rather than guessing from a sphere's radius.
        let minimum = Infinity;
        const positions = mesh.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          vertex.fromBufferAttribute(positions, i).multiply(mesh.scale).applyEuler(mesh.rotation);
          minimum = Math.min(minimum, vertex.y);
        }
        mesh.userData.restY = groundY - minimum + 0.012;
      }
      chips.count = mobile ? 12 : 20;
    }
    rocks.forEach(({ mesh, data }, index) => {
      const amount = ease((burst - index * 0.018) / (1 - index * 0.018));
      const lift = amount * data.lift * (mobile ? 0.75 : 1);
      mesh.position.set(
        data.position[0] * (mobile ? 0.37 : 1) * (1 + amount * 0.34),
        mesh.userData.restY + lift + Math.sin(amount * Math.PI) * 0.07,
        data.position[2] * (mobile ? 0.7 : 1) + amount * 0.15,
      );
      mesh.rotation.set(...data.rotation.map((angle, i) => angle + data.turn[i] * amount));
    });
    debris.slice(0, chips.count).forEach((chip, index) => {
      const amount = ease((burst - chip.delay) / (1 - chip.delay));
      const radius = mobile ? 1.1 + chip.radius * 0.06 : chip.radius;
      temporary.position.set(
        chip.side * (radius + amount * (mobile ? 0.2 : 0.65)),
        groundY + chip.size + chip.lift * amount * (mobile ? 0.7 : 1),
        chip.depth,
      );
      temporary.rotation.set(...chip.rotation.map((angle, i) => angle + chip.spin[i] * amount));
      const scale = chip.size * (mobile ? 0.65 : 1);
      temporary.scale.set(scale * 0.8, scale * 1.3, scale);
      temporary.updateMatrix();
      chips.setMatrixAt(index, temporary.matrix);
    });
    chips.instanceMatrix.needsUpdate = true;
    lastBurst = burst;
    lastMobile = mobile;
  };
  return { update, dispose: () => geometry.dispose(), count: (mobile) => (mobile ? 12 : 20) };
}
