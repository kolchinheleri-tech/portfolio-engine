import * as THREE from "three";

import {
  OrbitControls
} from "three/examples/jsm/controls/OrbitControls.js";

import {
  camera,
  renderer,
  scene
} from "./scene.js";

export const orbit = new OrbitControls(
  camera,
  renderer.domElement
);

orbit.enableDamping = true;
orbit.dampingFactor = 0.08;

orbit.enableZoom = true;
orbit.enableRotate = true;
orbit.enablePan = true;

orbit.minDistance = 1;
orbit.maxDistance = 50;

orbit.target.set(0, 0, 0);
orbit.update();

let animationFrameId = null;

export function frameObjects(objects, padding = 1.2) {
  if (!Array.isArray(objects) || objects.length === 0) {
    return;
  }

  const box = new THREE.Box3();

  objects.forEach((object) => {
    if (object) {
      box.expandByObject(object);
    }
  });

  if (box.isEmpty()) {
    return;
  }

  const center = box.getCenter(
    new THREE.Vector3()
  );

  const size = box.getSize(
    new THREE.Vector3()
  );

  const verticalFov =
    THREE.MathUtils.degToRad(camera.fov);

  const width =
    renderer.domElement.clientWidth || 1;

  const height =
    renderer.domElement.clientHeight || 1;

  const aspect = width / height;

  const distanceForHeight =
    size.y /
    (2 * Math.tan(verticalFov / 2));

  const horizontalFov =
    2 *
    Math.atan(
      Math.tan(verticalFov / 2) * aspect
    );

  const distanceForWidth =
    size.x /
    (2 * Math.tan(horizontalFov / 2));

  const distance =
    Math.max(
      distanceForHeight,
      distanceForWidth
    ) * padding;

  camera.position.set(
    center.x,
    center.y + size.y * 0.12,
    center.z + Math.max(distance, 1)
  );

  camera.near = Math.max(
    distance / 100,
    0.01
  );

  camera.far = Math.max(
    distance * 100,
    100
  );

  camera.updateProjectionMatrix();

  orbit.target.copy(center);
  camera.lookAt(center);
  orbit.update();
}

export function startViewer() {
  if (animationFrameId !== null) {
    return;
  }

  function animate() {
    animationFrameId =
      window.requestAnimationFrame(animate);

    orbit.update();

    renderer.render(
      scene,
      camera
    );
  }

  animate();
}

export function stopViewer() {
  if (animationFrameId === null) {
    return;
  }

  window.cancelAnimationFrame(
    animationFrameId
  );

  animationFrameId = null;
}