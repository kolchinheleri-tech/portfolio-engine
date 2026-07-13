import * as THREE from "three";

import {
  TransformControls
} from "three/examples/jsm/controls/TransformControls.js";

import {
  camera,
  renderer,
  scene
} from "../core/scene.js";

import {
  orbit
} from "../core/viewer.js";

import {
  onSelectionChange,
  clearSelection,
  getSelectedObjects,
  setSelectionEnabled
} from "./selection.js";

import {
  createHistorySnapshot,
  pushHistory,
  undo,
  redo
} from "./history.js";

import {
  clampObjectToFloor
} from "./floor.js";

export const transformControls =
  new TransformControls(
    camera,
    renderer.domElement
  );

const transformHelper =
  typeof transformControls.getHelper === "function"
    ? transformControls.getHelper()
    : transformControls;

scene.add(transformHelper);

transformControls.setMode("translate");
transformControls.setSpace("world");
transformControls.setTranslationSnap(null);
transformControls.setRotationSnap(null);

const selectionGroup = new THREE.Group();
selectionGroup.name = "SelectionGroup";
scene.add(selectionGroup);

let transformStartState = null;
let currentSelection = [];

function resetSelectionGroup() {
  selectionGroup.position.set(0, 0, 0);
  selectionGroup.rotation.set(0, 0, 0);
  selectionGroup.scale.set(1, 1, 1);
  selectionGroup.updateMatrixWorld(true);
}

function bakeSelectionGroup() {
  if (selectionGroup.children.length === 0) {
    return;
  }

  const children = [
    ...selectionGroup.children
  ];

  children.forEach((object) => {
    scene.attach(object);
    object.updateMatrixWorld(true);
  });

  resetSelectionGroup();
}

function getSelectionCenter(objects) {
  const box = new THREE.Box3();

  objects.forEach((object) => {
    box.expandByObject(object);
  });

  return box.getCenter(
    new THREE.Vector3()
  );
}

function attachTransformToSelection(selection) {
  bakeSelectionGroup();

  currentSelection = Array.isArray(selection)
    ? selection.filter(Boolean)
    : [];

  if (currentSelection.length === 0) {
    transformControls.detach();
    return;
  }

  if (currentSelection.length === 1) {
    transformControls.attach(
      currentSelection[0]
    );

    return;
  }

  const center =
    getSelectionCenter(currentSelection);

  resetSelectionGroup();
  selectionGroup.position.copy(center);
  selectionGroup.updateMatrixWorld(true);

  currentSelection.forEach((object) => {
    selectionGroup.attach(object);
  });

  transformControls.attach(
    selectionGroup
  );
}

function finishGroupTransform() {
  bakeSelectionGroup();

  currentSelection.forEach((object) => {
    clampObjectToFloor(object);
  });

  attachTransformToSelection(
    currentSelection
  );
}

function handleDraggingChanged(event) {
  const isDragging =
    Boolean(event.value);

  orbit.enabled = !isDragging;
  setSelectionEnabled(!isDragging);

  if (isDragging) {
    /*
     * Enne snapshot'i viime objektid maailmaruumi,
     * et kõik positsioonid salvestuksid õigesti.
     */
    bakeSelectionGroup();

    transformStartState =
      createHistorySnapshot(
        currentSelection
      );

    attachTransformToSelection(
      currentSelection
    );

    return;
  }

  finishGroupTransform();

  if (
    transformStartState &&
    currentSelection.length > 0
  ) {
    const transformEndState =
      createHistorySnapshot(
        currentSelection
      );

    pushHistory(
      transformStartState,
      transformEndState
    );
  }

  transformStartState = null;
}

function scaleSelection(multiplier) {
  const selection =
    getSelectedObjects();

  if (selection.length === 0) {
    return;
  }

  bakeSelectionGroup();

  const before =
    createHistorySnapshot(selection);

  if (selection.length === 1) {
    selection[0].scale.multiplyScalar(
      multiplier
    );

    clampObjectToFloor(selection[0]);
  } else {
    const center =
      getSelectionCenter(selection);

    selection.forEach((object) => {
      /*
       * Muudame objekti kaugust grupi keskpunktist,
       * et kogu kompositsioon suureneks koos.
       */
      object.position
        .sub(center)
        .multiplyScalar(multiplier)
        .add(center);

      object.scale.multiplyScalar(
        multiplier
      );

      clampObjectToFloor(object);
    });
  }

  const after =
    createHistorySnapshot(selection);

  pushHistory(before, after);

  attachTransformToSelection(selection);
}

function isTypingTarget(target) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLButtonElement ||
    target?.isContentEditable
  );
}

function handleKeyboard(event) {
  if (isTypingTarget(event.target)) {
    return;
  }

  const key =
    event.key.toLowerCase();

  if (
    event.ctrlKey &&
    !event.shiftKey &&
    key === "z"
  ) {
    event.preventDefault();

    bakeSelectionGroup();
    undo();
    attachTransformToSelection(
      currentSelection
    );

    return;
  }

  if (
    (
      event.ctrlKey &&
      event.shiftKey &&
      key === "z"
    ) ||
    (
      event.ctrlKey &&
      key === "y"
    )
  ) {
    event.preventDefault();

    bakeSelectionGroup();
    redo();
    attachTransformToSelection(
      currentSelection
    );

    return;
  }

  if (key === "w") {
    transformControls.setMode(
      "translate"
    );

    return;
  }

  if (key === "e") {
    transformControls.setMode(
      "rotate"
    );

    return;
  }

  if (
    event.key === "+" ||
    event.key === "="
  ) {
    event.preventDefault();
    scaleSelection(1.1);
    return;
  }

  if (
    event.key === "-" ||
    event.key === "_"
  ) {
    event.preventDefault();
    scaleSelection(0.9);
    return;
  }

  if (key === "escape") {
    bakeSelectionGroup();
    clearSelection();
  }
}

export function initTransformControls() {
  onSelectionChange(
    attachTransformToSelection
  );

  transformControls.addEventListener(
    "dragging-changed",
    handleDraggingChanged
  );

  window.addEventListener(
    "keydown",
    handleKeyboard
  );
}