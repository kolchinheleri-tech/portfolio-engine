import * as THREE from "three";

import {
  scene
} from "../core/scene.js";

const FLOOR_Y = 0;

const floorGeometry =
  new THREE.PlaneGeometry(100, 100);

const floorMaterial =
  new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false
  });

export const floor =
  new THREE.Mesh(
    floorGeometry,
    floorMaterial
  );

floor.rotation.x = -Math.PI / 2;
floor.position.y = FLOOR_Y;
floor.name = "InvisibleFloor";

scene.add(floor);

export function clampObjectToFloor(object) {
  if (!object) {
    return;
  }

  const box =
    new THREE.Box3().setFromObject(object);

  const bottom = box.min.y;

  if (bottom < FLOOR_Y) {
    object.position.y +=
      FLOOR_Y - bottom;
  }
}

export function getFloorY() {
  return FLOOR_Y;
}