import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { camera, renderer, scene } from "./scene.js";
import { objects } from "./loader.js";

export const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.target.set(0, 0.8, 0);

function frameObjects() {
  if (!objects.length) return;

  const box = new THREE.Box3();

  objects.forEach((object) => {
    box.expandByObject(object);
  });

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y, size.z);
  const distance = maxDim * 2.2;

  camera.position.set(
    center.x,
    center.y + maxDim * 0.45,
    center.z + distance
  );

  camera.lookAt(center);
  orbit.target.copy(center);
  orbit.update();
}

export function startViewer() {
  setTimeout(frameObjects, 800);

  function animate() {
    requestAnimationFrame(animate);
    orbit.update();
    renderer.render(scene, camera);
  }

  animate();
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  setTimeout(frameObjects, 200);
});