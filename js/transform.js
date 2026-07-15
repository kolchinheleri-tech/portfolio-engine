import {
  TransformControls
} from "three/examples/jsm/controls/TransformControls.js";

import * as THREE from "three";

import {
  camera,
  renderer,
  scene
} from "./scene.js";

import {
  orbit
} from "./viewer.js";

import {
  objects,
  loadSingleModel,
  masterComposition
} from "./loader.js";

import {
  clearComposition
} from "./storage.js";

const raycaster =
  new THREE.Raycaster();

const mouse =
  new THREE.Vector2();

export const transform =
  new TransformControls(
    camera,
    renderer.domElement
  );

scene.add(
  transform.getHelper()
);

transform.setMode("translate");
transform.setSize(0.8);

const selectionGroup =
  new THREE.Group();

scene.add(selectionGroup);

let selectedObjects = [];
let multiSelectMode = false;

const undoStack = [];
const redoStack = [];

const FLOOR_Y = 0;

function notifySelectionChange() {
  window.dispatchEvent(
    new CustomEvent(
      "exhibition-selection-change",
      {
        detail: {
          count:
            selectedObjects.length,

          multiSelectMode
        }
      }
    )
  );
}

function notifyMultiSelectChange() {
  window.dispatchEvent(
    new CustomEvent(
      "exhibition-multi-select-change",
      {
        detail: {
          active:
            multiSelectMode
        }
      }
    )
  );
}

function snapshot() {
  return objects.map(
    (object) => ({
      id:
        object.userData.id,

      file:
        object.userData.file,

      isCopy:
        Boolean(
          object.userData.isCopy
        ),

      visible:
        object.visible !== false,

      x: object.position.x,
      y: object.position.y,
      z: object.position.z,

      rx: object.rotation.x,
      ry: object.rotation.y,
      rz: object.rotation.z,

      scaleX: object.scale.x,
      scaleY: object.scale.y,
      scaleZ: object.scale.z
    })
  );
}

function pushUndo() {
  undoStack.push(
    snapshot()
  );

  if (undoStack.length > 50) {
    undoStack.shift();
  }

  redoStack.length = 0;
}

function clampToFloor(object) {
  const box =
    new THREE.Box3()
      .setFromObject(object);

  if (box.min.y < FLOOR_Y) {
    object.position.y +=
      FLOOR_Y - box.min.y;
  }
}

function bakeSelectionGroup() {
  if (
    selectionGroup.children
      .length === 0
  ) {
    return;
  }

  const children = [
    ...selectionGroup.children
  ];

  children.forEach((child) => {
    scene.attach(child);
    clampToFloor(child);
  });

  selectionGroup.position.set(
    0,
    0,
    0
  );

  selectionGroup.rotation.set(
    0,
    0,
    0
  );

  selectionGroup.scale.set(
    1,
    1,
    1
  );
}

function attachSelection() {
  bakeSelectionGroup();

  selectedObjects =
    selectedObjects.filter(
      (object) =>
        objects.includes(object) &&
        object.visible !== false
    );

  if (
    selectedObjects.length === 0
  ) {
    transform.detach();
    notifySelectionChange();
    return;
  }

  if (
    selectedObjects.length === 1
  ) {
    transform.attach(
      selectedObjects[0]
    );

    notifySelectionChange();
    return;
  }

  const center =
    new THREE.Vector3();

  selectedObjects.forEach(
    (object) => {
      center.add(
        object.position
      );
    }
  );

  center.divideScalar(
    selectedObjects.length
  );

  selectionGroup.position.copy(
    center
  );

  selectionGroup.rotation.set(
    0,
    0,
    0
  );

  selectionGroup.scale.set(
    1,
    1,
    1
  );

  selectedObjects.forEach(
    (object) => {
      selectionGroup.attach(
        object
      );
    }
  );

  transform.attach(
    selectionGroup
  );

  notifySelectionChange();
}

function disposeObject(object) {
  object.traverse((child) => {
    if (!child.isMesh) {
      return;
    }

    child.geometry?.dispose();

    if (
      Array.isArray(
        child.material
      )
    ) {
      child.material.forEach(
        (material) => {
          material.dispose?.();
        }
      );
    } else {
      child.material?.dispose?.();
    }
  });
}

function clearSceneObjects() {
  objects.forEach((object) => {
    scene.remove(object);
    disposeObject(object);
  });

  objects.length = 0;
}

function restore(state) {
  bakeSelectionGroup();
  clearSceneObjects();

  selectedObjects = [];

  transform.detach();
  notifySelectionChange();

  if (state.length === 0) {
    return;
  }

  state.forEach((item) => {
    loadSingleModel(item);
  });
}

function getClickedObject(event) {
  const rect =
    renderer.domElement
      .getBoundingClientRect();

  mouse.x =
    (
      (
        event.clientX -
        rect.left
      ) /
      rect.width
    ) *
      2 -
    1;

  mouse.y =
    -(
      (
        event.clientY -
        rect.top
      ) /
      rect.height
    ) *
      2 +
    1;

  raycaster.setFromCamera(
    mouse,
    camera
  );

  const visibleObjects =
    objects.filter(
      (object) =>
        object.visible !== false
    );

  const hits =
    raycaster.intersectObjects(
      visibleObjects,
      true
    );

  if (hits.length === 0) {
    return null;
  }

  let object =
    hits[0].object;

  while (
    object.parent &&
    !objects.includes(object)
  ) {
    object = object.parent;
  }

  return (
    objects.includes(object) &&
    object.visible !== false
  )
    ? object
    : null;
}

function selectObject(event) {
  if (transform.dragging) {
    return;
  }

  const object =
    getClickedObject(event);

  const useMultiSelection =
    multiSelectMode ||
    event.shiftKey;

  if (!object) {
    if (!useMultiSelection) {
      bakeSelectionGroup();

      selectedObjects = [];

      transform.detach();
      notifySelectionChange();
    }

    return;
  }

  if (useMultiSelection) {
    if (
      selectedObjects.includes(
        object
      )
    ) {
      selectedObjects =
        selectedObjects.filter(
          (item) =>
            item !== object
        );
    } else {
      selectedObjects.push(
        object
      );
    }
  } else {
    selectedObjects = [
      object
    ];
  }

  attachSelection();
}

function applyPostTransform() {
  bakeSelectionGroup();

  selectedObjects.forEach(
    (object) => {
      clampToFloor(object);
    }
  );

  attachSelection();
}

export function setTransformMode(
  mode
) {
  const allowedModes = [
    "translate",
    "rotate"
  ];

  if (
    !allowedModes.includes(mode)
  ) {
    return;
  }

  transform.setMode(mode);

  window.dispatchEvent(
    new CustomEvent(
      "exhibition-transform-mode-change",
      {
        detail: {
          mode
        }
      }
    )
  );
}

export function setMultiSelectMode(
  active
) {
  multiSelectMode =
    Boolean(active);

  notifyMultiSelectChange();
  notifySelectionChange();

  return multiSelectMode;
}

export function toggleMultiSelectMode() {
  return setMultiSelectMode(
    !multiSelectMode
  );
}

export function getMultiSelectMode() {
  return multiSelectMode;
}

export function getSelectionCount() {
  return selectedObjects.length;
}

export function scaleSelected(
  multiplier
) {
  if (
    selectedObjects.length === 0 ||
    typeof multiplier !== "number" ||
    !Number.isFinite(
      multiplier
    ) ||
    multiplier <= 0
  ) {
    return false;
  }

  bakeSelectionGroup();
  pushUndo();

  selectedObjects.forEach(
    (object) => {
      object.scale.multiplyScalar(
        multiplier
      );

      clampToFloor(object);
    }
  );

  attachSelection();

  return true;
}

export function hideSelected() {
  if (
    selectedObjects.length === 0
  ) {
    return false;
  }

  bakeSelectionGroup();
  pushUndo();

  selectedObjects.forEach(
    (object) => {
      object.visible = false;
    }
  );

  selectedObjects = [];

  transform.detach();
  notifySelectionChange();

  return true;
}

export function showAllObjects() {
  const hiddenObjects =
    objects.filter(
      (object) =>
        object.visible === false
    );

  if (
    hiddenObjects.length === 0
  ) {
    return false;
  }

  bakeSelectionGroup();
  pushUndo();

  hiddenObjects.forEach(
    (object) => {
      object.visible = true;
    }
  );

  notifySelectionChange();

  return true;
}

export function undoLastChange() {
  if (
    undoStack.length === 0
  ) {
    return false;
  }

  redoStack.push(
    snapshot()
  );

  restore(
    undoStack.pop()
  );

  return true;
}

export function redoLastChange() {
  if (
    redoStack.length === 0
  ) {
    return false;
  }

  undoStack.push(
    snapshot()
  );

  restore(
    redoStack.pop()
  );

  return true;
}

export function duplicateSelected() {
  if (
    selectedObjects.length === 0
  ) {
    return false;
  }

  bakeSelectionGroup();
  pushUndo();

  const originals = [
    ...selectedObjects
  ];

  selectedObjects = [];

  let loadedCount = 0;

  originals.forEach(
    (original, index) => {
      const data = {
        id:
          `${original.userData.id}` +
          `-copy-${Date.now()}-${index}`,

        file:
          original.userData.file,

        isCopy: true,
        visible: true,

        x:
          original.position.x +
          0.7,

        y:
          original.position.y,

        z:
          original.position.z +
          0.25,

        rx:
          original.rotation.x,

        ry:
          original.rotation.y,

        rz:
          original.rotation.z,

        scaleX:
          original.scale.x,

        scaleY:
          original.scale.y,

        scaleZ:
          original.scale.z
      };

      loadSingleModel(
        data,

        (newObject) => {
          selectedObjects.push(
            newObject
          );

          loadedCount += 1;

          if (
            loadedCount ===
            originals.length
          ) {
            attachSelection();
          }
        }
      );
    }
  );

  return true;
}

export function deleteSelectedCopies() {
  const copies =
    selectedObjects.filter(
      (object) =>
        object.userData.isCopy
    );

  if (copies.length === 0) {
    return false;
  }

  pushUndo();
  bakeSelectionGroup();

  copies.forEach((copy) => {
    scene.remove(copy);
    disposeObject(copy);

    const index =
      objects.indexOf(copy);

    if (index !== -1) {
      objects.splice(
        index,
        1
      );
    }
  });

  selectedObjects =
    selectedObjects.filter(
      (object) =>
        !object.userData.isCopy
    );

  attachSelection();

  return true;
}

function resetToMaster() {
  pushUndo();

  bakeSelectionGroup();
  clearSceneObjects();

  selectedObjects = [];

  transform.detach();
  notifySelectionChange();

  clearComposition();

  masterComposition.forEach(
    (item) => {
      loadSingleModel(item);
    }
  );
}

transform.addEventListener(
  "mouseDown",

  () => {
    pushUndo();
  }
);

transform.addEventListener(
  "dragging-changed",

  (event) => {
    orbit.enabled =
      !event.value;

    if (!event.value) {
      applyPostTransform();
    }
  }
);

renderer.domElement.addEventListener(
  "pointerdown",
  selectObject
);

window.addEventListener(
  "keydown",

  (event) => {
    const key =
      event.key.toLowerCase();

    if (
      event.ctrlKey &&
      key === "z" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      undoLastChange();
    }

    if (
      event.ctrlKey &&
      event.shiftKey &&
      key === "z"
    ) {
      event.preventDefault();
      redoLastChange();
    }

    if (
      event.ctrlKey &&
      key === "d"
    ) {
      event.preventDefault();
      duplicateSelected();
    }

    if (
      key === "delete" ||
      key === "backspace"
    ) {
      event.preventDefault();
      deleteSelectedCopies();
    }

    if (key === "w") {
      setTransformMode(
        "translate"
      );
    }

    if (key === "e") {
      setTransformMode(
        "rotate"
      );
    }

    if (
      key === "+" ||
      key === "="
    ) {
      scaleSelected(1.08);
    }

    if (
      key === "-" ||
      key === "_"
    ) {
      scaleSelected(0.92);
    }

    if (
      event.ctrlKey &&
      key === "r"
    ) {
      event.preventDefault();
      resetToMaster();
    }
  }
);