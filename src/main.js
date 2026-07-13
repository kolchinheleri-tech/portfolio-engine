import {
  startViewer,
  frameObjects
} from "./core/viewer.js";

import {
  camera
} from "./core/scene.js";

import {
  orbit
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

import {
  createProject,
  getActiveProject,
  restoreActiveProject
} from "./projects/manager.js";

async function initializeApplication() {
  startViewer();

  const savedComposition =
    restoreActiveProject();

  if (!getActiveProject()) {
    createProject({
      title: "Flux and Form",
      slug: "flux-and-form",
      description:
        "Interactive sculptural exhibition."
    });
  }

  const compositionObjects =
    savedComposition?.objects;

  await loadModels(
    Array.isArray(compositionObjects)
      ? compositionObjects
      : undefined
  );

  frameObjects(objects);

  initTransformControls();
  initSelection(objects);

  const loading =
    document.getElementById("loading");

  if (loading) {
    loading.style.display = "none";
  }

  console.log(
    "Active exhibition project:",
    getActiveProject()
  );

  console.log(
    "Exhibition Space v2 initialized:",
    {
      objects,
      camera,
      orbit
    }
  );
}

initializeApplication().catch((error) => {
  console.error(
    "Exhibition Space v2 could not start:",
    error
  );
});