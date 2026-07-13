import * as THREE from "three";

import {
  getMasterObject
} from "./config.js";

function isFiniteNumber(value) {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function getVectorValue(
  vector,
  fallback,
  key
) {
  if (
    vector &&
    isFiniteNumber(vector[key])
  ) {
    return vector[key];
  }

  return fallback;
}

function centerModelGeometry(model) {
  const box =
    new THREE.Box3().setFromObject(model);

  const center =
    box.getCenter(new THREE.Vector3());

  const size =
    box.getSize(new THREE.Vector3());

  const maxDimension = Math.max(
    size.x,
    size.y,
    size.z
  );

  if (
    !Number.isFinite(maxDimension) ||
    maxDimension <= 0
  ) {
    throw new Error(
      "Model has invalid dimensions."
    );
  }

  model.traverse((child) => {
    if (
      !child.isMesh ||
      !child.geometry
    ) {
      return;
    }

    child.geometry.translate(
      -center.x,
      -center.y,
      -center.z
    );
  });

  return maxDimension;
}

function applyPosition(model, item) {
  const position = item.position || {};

  model.position.set(
    getVectorValue(position, item.x ?? 0, "x"),
    getVectorValue(position, item.y ?? 0, "y"),
    getVectorValue(position, item.z ?? 0, "z")
  );
}

function applyRotation(model, item) {
  const rotation = item.rotation || {};

  model.rotation.set(
    getVectorValue(rotation, item.rx ?? 0, "x"),
    getVectorValue(rotation, item.ry ?? 0, "y"),
    getVectorValue(rotation, item.rz ?? 0, "z")
  );
}

function applyScale(
  model,
  item,
  baseScale
) {
  const scale = item.scale;

  if (
    scale &&
    typeof scale === "object" &&
    isFiniteNumber(scale.x) &&
    isFiniteNumber(scale.y) &&
    isFiniteNumber(scale.z)
  ) {
    model.scale.set(
      scale.x,
      scale.y,
      scale.z
    );

    return;
  }

  if (isFiniteNumber(scale)) {
    model.scale.setScalar(scale);
    return;
  }

  model.scale.setScalar(baseScale);
}

export function createModel(
  model,
  item
) {
  if (!model) {
    throw new Error(
      "Cannot create an empty model."
    );
  }

  if (!item?.file) {
    throw new Error(
      "Model configuration has no file path."
    );
  }

  const maxDimension =
    centerModelGeometry(model);

  const master =
    getMasterObject(item.file) || item;

  const scaleFactor =
    isFiniteNumber(master.scaleFactor)
      ? master.scaleFactor
      : 1;

  const baseScale =
    (1.2 / maxDimension) *
    scaleFactor;

  applyPosition(model, item);
  applyRotation(model, item);
  applyScale(model, item, baseScale);

  model.userData = {
    ...model.userData,

    id:
      item.id ||
      `obj-${Date.now()}-${Math.random()}`,

    file: item.file,
    isCopy: Boolean(item.isCopy),
    baseScale
  };

  model.traverse((child) => {
    if (!child.isMesh) {
      return;
    }

    child.castShadow = false;
    child.receiveShadow = false;
    child.frustumCulled = false;
  });

  return model;
}