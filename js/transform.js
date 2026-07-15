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
  saveComposition,
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

const undoStack = [];
const redoStack = [];

const FLOOR_Y = 0;

function notifySelectionChange() {
  window.dispatchEvent(
    new CustomEvent(
      "exhibition-selection-change",
      {
        detail: {
          count: selectedObjects.length
        }
      }
    )
  );
}

function snapshot() {
  return objects.map((object) => ({
    id: object.userData.id,
    file: object.userData.file,
    isCopy:
      object.userData.isCopy || false,

    x: object.position.x,
    y: object.position.y,
    z: object.position.z,

    rx: object.rotation.x,
    ry: object.rotation.y,
    rz: object.rotation.z,

    scale: object.scale.x
  }));
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
    new THREE.Box3().setFromObject(
      object
    );

  if (box.min.y < FLOOR_Y) {
    object.position.y +=
      FLOOR_Y - box.min.y;
  }
}

function bakeSelectionGroup() {
  if (
    selectionGroup.children.length === 0
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

  if (selectedObjects.length === 0) {
    transform.detach();
    notifySelectionChange();
    return;
  }

  if (selectedObjects.length === 1) {
    transform.attach(
      selectedObjects[0]
    );

    notifySelectionChange();
    return;
  }

  const center =
    new THREE.Vector3();

  selectedObjects.forEach((object) => {
    center.add(
      object.position
    );
  });

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

  selectedObjects.forEach((object) => {
    selectionGroup.attach(object);
  });

  transform.attach(
    selectionGroup
  );

  notifySelectionChange();
}

function restore(state) {
  objects.forEach((object) => {
    scene.remove(object);
  });

  objects.length = 0;
  selectedObjects = [];

  transform.detach();
  notifySelectionChange();

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

  const hits =
    raycaster.intersectObjects(
      objects,
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

  return objects.includes(object)
    ? object
    : null;
}

function selectObject(event) {
  if (transform.dragging) {
    return;
  }

  const object =
    getClickedObject(event);

  if (!object) {
    bakeSelectionGroup();

    selectedObjects = [];

    transform.detach();
    notifySelectionChange();

    return;
  }

  if (event.shiftKey) {
    if (
      selectedObjects.includes(object)
    ) {
      selectedObjects =
        selectedObjects.filter(
          (item) => item !== object
        );
    } else {
      selectedObjects.push(object);
    }
  } else {
    selectedObjects = [object];
  }

  attachSelection();
}

function applyPostTransform() {
  bakeSelectionGroup();

  selectedObjects.forEach((object) => {
    clampToFloor(object);
  });

  attachSelection();
}

export function setTransformMode(mode) {
  const allowedModes = [
    "translate",
    "rotate",
    "scale"
  ];

  if (!allowedModes.includes(mode)) {
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

export function getSelectionCount() {
  return selectedObjects.length;
}

export function duplicateSelected() {
  if (selectedObjects.length === 0) {
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

        x:
          original.position.x + 0.7,

        y:
          original.position.y,

        z:
          original.position.z + 0.25,

        rx:
          original.rotation.x,

        ry:
          original.rotation.y,

        rz:
          original.rotation.z,

        scale:
          original.scale.x
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

    const index =
      objects.indexOf(copy);

    if (index !== -1) {
      objects.splice(index, 1);
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

  objects.forEach((object) => {
    scene.remove(object);
  });

  objects.length = 0;
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

      if (undoStack.length > 0) {
        redoStack.push(
          snapshot()
        );

        restore(
          undoStack.pop()
        );
      }
    }

    if (
      event.ctrlKey &&
      event.shiftKey &&
      key === "z"
    ) {
      event.preventDefault();

      if (redoStack.length > 0) {
        undoStack.push(
          snapshot()
        );

        restore(
          redoStack.pop()
        );
      }
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

    if (key === "r") {
      setTransformMode(
        "scale"
      );
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