import * as THREE from "three";

import {
  GLTFLoader
} from "three/examples/jsm/loaders/GLTFLoader.js";

import {
  scene
} from "./scene.js";

import {
  loadComposition
} from "./storage.js";

import {
  loadCloudComposition
} from "./cloud-storage.js";

const loader =
  new GLTFLoader();

export const objects = [];

export const masterComposition = [
  {
    id: "obj-1",
    file: "/models/1.glb",
    x: -4,
    y: 0,
    z: 0,
    scaleFactor: 1.15,
    visible: true
  },
  {
    id: "obj-2",
    file: "/models/pink.glb",
    x: -2,
    y: 0,
    z: 0.2,
    scaleFactor: 0.85,
    visible: true
  },
  {
    id: "obj-3",
    file: "/models/yellow.glb",
    x: 0,
    y: 0,
    z: -0.2,
    scaleFactor: 1,
    visible: true
  },
  {
    id: "obj-4",
    file: "/models/green.glb",
    x: 2,
    y: 0,
    z: 0.2,
    scaleFactor: 1.25,
    visible: true
  },
  {
    id: "obj-5",
    file: "/models/pink big.glb",
    x: 4,
    y: 0,
    z: -0.1,
    scaleFactor: 0.95,
    visible: true
  }
];

function getMaster(file) {
  return masterComposition.find(
    (item) =>
      item.file === file
  );
}

function isFiniteNumber(value) {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
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

function removeCurrentObjects() {
  objects.forEach((object) => {
    scene.remove(object);
    disposeObject(object);
  });

  objects.length = 0;
}

export function addModelToScene(
  model,
  item
) {
  const initialBox =
    new THREE.Box3()
      .setFromObject(model);

  const center =
    initialBox.getCenter(
      new THREE.Vector3()
    );

  const size =
    initialBox.getSize(
      new THREE.Vector3()
    );

  const maxDim =
    Math.max(
      size.x,
      size.y,
      size.z
    );

  if (
    !Number.isFinite(maxDim) ||
    maxDim <= 0
  ) {
    throw new Error(
      `Invalid model dimensions: ${item.file}`
    );
  }

  model.traverse((child) => {
    if (
      child.isMesh &&
      child.geometry
    ) {
      child.geometry.translate(
        -center.x,
        -center.y,
        -center.z
      );
    }
  });

  const master =
    getMaster(item.file) ||
    item;

  const baseScale =
    (1.2 / maxDim) *
    (master.scaleFactor || 1);

  model.position.set(
    isFiniteNumber(item.x)
      ? item.x
      : 0,

    isFiniteNumber(item.y)
      ? item.y
      : 0,

    isFiniteNumber(item.z)
      ? item.z
      : 0
  );

  model.rotation.set(
    isFiniteNumber(item.rx)
      ? item.rx
      : 0,

    isFiniteNumber(item.ry)
      ? item.ry
      : 0,

    isFiniteNumber(item.rz)
      ? item.rz
      : 0
  );

  if (
    isFiniteNumber(item.scaleX) &&
    isFiniteNumber(item.scaleY) &&
    isFiniteNumber(item.scaleZ)
  ) {
    model.scale.set(
      item.scaleX,
      item.scaleY,
      item.scaleZ
    );
  } else if (
    isFiniteNumber(item.scale)
  ) {
    model.scale.setScalar(
      item.scale
    );
  } else {
    model.scale.setScalar(
      baseScale
    );
  }

  model.visible =
    item.visible !== false;

  model.userData = {
    id:
      item.id ||
      `obj-${Date.now()}-${Math.random()}`,

    file:
      item.file,

    isCopy:
      Boolean(item.isCopy),

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

  scene.add(model);
  objects.push(model);

  return model;
}

export function loadSingleModel(
  item,
  onLoad,
  onError
) {
  loader.load(
    item.file,

    (gltf) => {
      try {
        const model =
          addModelToScene(
            gltf.scene,
            item
          );

        onLoad?.(model);
      } catch (error) {
        console.error(
          `Model could not be prepared: ${item.file}`,
          error
        );

        onError?.(error);
      }
    },

    undefined,

    (error) => {
      console.error(
        `Cannot load ${item.file}:`,
        error
      );

      onError?.(error);
    }
  );
}

function convertSavedObject(item) {
  const position =
    item.position || {};

  const rotation =
    item.rotation || {};

  const scaleObject =
    item.scale &&
    typeof item.scale === "object"
      ? item.scale
      : null;

  return {
    id: item.id,
    file: item.file,

    isCopy:
      Boolean(item.isCopy),

    visible:
      item.visible !== false,

    x:
      isFiniteNumber(position.x)
        ? position.x
        : item.x,

    y:
      isFiniteNumber(position.y)
        ? position.y
        : item.y,

    z:
      isFiniteNumber(position.z)
        ? position.z
        : item.z,

    rx:
      isFiniteNumber(rotation.x)
        ? rotation.x
        : item.rx,

    ry:
      isFiniteNumber(rotation.y)
        ? rotation.y
        : item.ry,

    rz:
      isFiniteNumber(rotation.z)
        ? rotation.z
        : item.rz,

    scaleX:
      isFiniteNumber(
        scaleObject?.x
      )
        ? scaleObject.x
        : item.scaleX,

    scaleY:
      isFiniteNumber(
        scaleObject?.y
      )
        ? scaleObject.y
        : item.scaleY,

    scaleZ:
      isFiniteNumber(
        scaleObject?.z
      )
        ? scaleObject.z
        : item.scaleZ,

    scale:
      isFiniteNumber(item.scale)
        ? item.scale
        : undefined
  };
}

async function getStartupComposition(
  compositionOverride
) {
  if (
    compositionOverride &&
    typeof compositionOverride ===
      "object"
  ) {
    return compositionOverride;
  }

  const cloudComposition =
    await loadCloudComposition();

  if (
    cloudComposition &&
    typeof cloudComposition ===
      "object"
  ) {
    return cloudComposition;
  }

  const localComposition =
    loadComposition();

  if (
    localComposition &&
    typeof localComposition ===
      "object"
  ) {
    return localComposition;
  }

  return null;
}

export async function loadModels(
  onComplete,
  compositionOverride
) {
  removeCurrentObjects();

  const composition =
    await getStartupComposition(
      compositionOverride
    );

  const savedObjects =
    Array.isArray(
      composition?.objects
    )
      ? composition.objects
      : Array.isArray(composition)
        ? composition
        : null;

  const list =
    savedObjects?.length
      ? savedObjects.map(
          convertSavedObject
        )
      : masterComposition;

  if (list.length === 0) {
    onComplete?.(composition);
    return;
  }

  let finishedCount = 0;

  const finishOne = () => {
    finishedCount += 1;

    if (
      finishedCount ===
      list.length
    ) {
      onComplete?.(
        composition
      );
    }
  };

  list.forEach((item) => {
    loadSingleModel(
      item,
      finishOne,
      finishOne
    );
  });
}