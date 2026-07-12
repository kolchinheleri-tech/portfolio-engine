import {
  loadModels
} from "./loader.js";

import {
  startViewer,
  frameObjects,
  orbit
} from "./viewer.js";

import {
  camera
} from "./scene.js";

import "./transform.js";

import {
  initSaveButton
} from "./save.js";

startViewer();

loadModels((savedComposition) => {
  const savedCamera = savedComposition?.camera;

  if (
    savedCamera?.position &&
    savedCamera?.target
  ) {
    camera.position.set(
      savedCamera.position.x,
      savedCamera.position.y,
      savedCamera.position.z
    );

    orbit.target.set(
      savedCamera.target.x,
      savedCamera.target.y,
      savedCamera.target.z
    );

    camera.lookAt(orbit.target);
    orbit.update();
  } else {
    frameObjects();
  }

  const loading =
    document.getElementById("loading");

  if (loading) {
    loading.style.display = "none";
  }
});

initSaveButton();