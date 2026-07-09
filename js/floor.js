import * as THREE from "three";

export const FLOOR_Y = 0;

export function clampToFloor(object) {
  const box = new THREE.Box3().setFromObject(object);

  if (box.min.y < FLOOR_Y) {
    object.position.y += FLOOR_Y - box.min.y;
  }
}