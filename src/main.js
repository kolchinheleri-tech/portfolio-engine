import {
  startViewer,
  frameObjects
} from "./core/viewer.js";

import {
  loadModels,
  objects
} from "./models/loader.js";

import {
  initSelection
} from "./editor/selection.js";

import {
  initTransformControls
} from "./editor/transform.js";

async function initializeApplication() {
  startViewer();

  await loadModels();

  frameObjects(objects);

  initTransformControls();
  initSelection(objects);

  const loading =
    document.getElementById("loading");

  if (loading) {
    loading.style.display = "none";
  }

  console.log(
    "Exhibition Space v2 initialized:",
    objects
  );
}

initializeApplication().catch((error) => {
  console.error(
    "Exhibition Space v2 could not start:",
    error
  );
});