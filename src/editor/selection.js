import * as THREE from "three";

import {
  camera,
  renderer
} from "../core/scene.js";

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

let selectableObjects = [];
let selectedObjects = [];
let selectionEnabled = true;

let pointerStartX = 0;
let pointerStartY = 0;

const selectionListeners = new Set();

function emitSelectionChange() {
  const selectionCopy = [...selectedObjects];

  selectionListeners.forEach((listener) => {
    listener(selectionCopy);
  });
}

function updatePointer(event) {
  const rect =
    renderer.domElement.getBoundingClientRect();

  pointer.x =
    ((event.clientX - rect.left) / rect.width) * 2 - 1;

  pointer.y =
    -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function getSelectableRoot(object) {
  let current = object;

  while (current) {
    if (selectableObjects.includes(current)) {
      return current;
    }

    current = current.parent;
  }

  return null;
}

function getClickedObject(event) {
  updatePointer(event);

  raycaster.setFromCamera(
    pointer,
    camera
  );

  const intersections =
    raycaster.intersectObjects(
      selectableObjects,
      true
    );

  if (intersections.length === 0) {
    return null;
  }

  return getSelectableRoot(
    intersections[0].object
  );
}

function handlePointerDown(event) {
  pointerStartX = event.clientX;
  pointerStartY = event.clientY;
}

function handlePointerUp(event) {
  if (!selectionEnabled) {
    return;
  }

  const movement = Math.hypot(
    event.clientX - pointerStartX,
    event.clientY - pointerStartY
  );

  // Kaamera pööramine ei vali objekti.
  if (movement > 5) {
    return;
  }

  const clickedObject =
    getClickedObject(event);

  if (!clickedObject) {
    clearSelection();
    return;
  }

  if (event.shiftKey) {
    toggleSelection(clickedObject);
  } else {
    setSelection([clickedObject]);
  }
}

export function getSelectedObjects() {
  return [...selectedObjects];
}

export function getSelectedObject() {
  return selectedObjects.length === 1
    ? selectedObjects[0]
    : null;
}

export function setSelection(objects) {
  selectedObjects = Array.isArray(objects)
    ? [...new Set(objects.filter(Boolean))]
    : [];

  emitSelectionChange();
}

export function toggleSelection(object) {
  if (!object) {
    return;
  }

  if (selectedObjects.includes(object)) {
    selectedObjects =
      selectedObjects.filter(
        (selected) => selected !== object
      );
  } else {
    selectedObjects.push(object);
  }

  emitSelectionChange();
}

export function clearSelection() {
  if (selectedObjects.length === 0) {
    return;
  }

  selectedObjects = [];
  emitSelectionChange();
}

export function setSelectionEnabled(enabled) {
  selectionEnabled = Boolean(enabled);
}

export function onSelectionChange(listener) {
  if (typeof listener !== "function") {
    throw new TypeError(
      "Selection listener must be a function."
    );
  }

  selectionListeners.add(listener);

  return () => {
    selectionListeners.delete(listener);
  };
}

export function updateSelectableObjects(objects) {
  selectableObjects = Array.isArray(objects)
    ? objects
    : [];

  selectedObjects =
    selectedObjects.filter((object) =>
      selectableObjects.includes(object)
    );

  emitSelectionChange();
}

export function initSelection(objects) {
  updateSelectableObjects(objects);

  renderer.domElement.addEventListener(
    "pointerdown",
    handlePointerDown
  );

  renderer.domElement.addEventListener(
    "pointerup",
    handlePointerUp
  );
}