import {
  GLTFLoader
} from "three/examples/jsm/loaders/GLTFLoader.js";

import {
  scene
} from "../core/scene.js";

import {
  masterComposition
} from "./config.js";

import {
  createModel
} from "./modelFactory.js";

const gltfLoader = new GLTFLoader();

export const objects = [];

function removeObjectFromScene(object) {
  scene.remove(object);

  object.traverse((child) => {
    if (!child.isMesh) {
      return;
    }

    child.geometry?.dispose();

    if (Array.isArray(child.material)) {
      child.material.forEach((material) => {
        material?.dispose();
      });
    } else {
      child.material?.dispose();
    }
  });
}

export function clearModels() {
  objects.forEach(removeObjectFromScene);
  objects.length = 0;
}

export function loadSingleModel(item) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      item.file,

      (gltf) => {
        try {
          const model = createModel(
            gltf.scene,
            item
          );

          scene.add(model);
          objects.push(model);

          resolve(model);
        } catch (error) {
          console.error(
            `Could not prepare model: ${item.file}`,
            error
          );

          reject(error);
        }
      },

      undefined,

      (error) => {
        console.error(
          `Could not load model: ${item.file}`,
          error
        );

        reject(error);
      }
    );
  });
}

export async function loadModels(
  composition = masterComposition
) {
  clearModels();

  const source =
    Array.isArray(composition) &&
    composition.length > 0
      ? composition
      : masterComposition;

  const results =
    await Promise.allSettled(
      source.map((item) =>
        loadSingleModel(item)
      )
    );

  const failed = results.filter(
    (result) =>
      result.status === "rejected"
  );

  if (failed.length > 0) {
    console.warn(
      `${failed.length} model(s) failed to load.`
    );
  }

  return objects;
}