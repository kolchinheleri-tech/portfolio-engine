import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { scene } from "./scene.js";
import { loadComposition } from "./storage.js";

const loader = new GLTFLoader();

export const objects = [];

export const masterComposition = [
  {
    id: "obj-1",
    file: "/models/1.glb",
    x: -4,
    y: 0,
    z: 0,
    scaleFactor: 1.15
  },
  {
    id: "obj-2",
    file: "/models/pink.glb",
    x: -2,
    y: 0,
    z: 0.2,
    scaleFactor: 0.85
  },
  {
    id: "obj-3",
    file: "/models/yellow.glb",
    x: 0,
    y: 0,
    z: -0.2,
    scaleFactor: 1
  },
  {
    id: "obj-4",
    file: "/models/green.glb",
    x: 2,
    y: 0,
    z: 0.2,
    scaleFactor: 1.25
  },
  {
    id: "obj-5",
    file: "/models/pink big.glb",
    x: 4,
    y: 0,
    z: -0.1,
    scaleFactor: 0.95
  }
];

function getMaster(file) {
  return masterComposition.find((item) => item.file === file);
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export function addModelToScene(model, item) {
  const initialBox = new THREE.Box3().setFromObject(model);
  const center = initialBox.getCenter(new THREE.Vector3());
  const size = initialBox.getSize(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y, size.z);

  if (!Number.isFinite(maxDim) || maxDim <= 0) {
    throw new Error(`Invalid model dimensions: ${item.file}`);
  }

  /*
   * Nihutame mudeli geomeetria keskme root-objekti lokaalsesse nullpunkti.
   * See ei muuda hiljem määratud maailmapositsiooni.
   */
  model.traverse((child) => {
    if (child.isMesh && child.geometry) {
      child.geometry.translate(
        -center.x,
        -center.y,
        -center.z
      );
    }
  });

  const master = getMaster(item.file) || item;

  const baseScale =
    (1.2 / maxDim) *
    (master.scaleFactor || 1);

  model.position.set(
    isFiniteNumber(item.x) ? item.x : 0,
    isFiniteNumber(item.y) ? item.y : 0,
    isFiniteNumber(item.z) ? item.z : 0
  );

  model.rotation.set(
    isFiniteNumber(item.rx) ? item.rx : 0,
    isFiniteNumber(item.ry) ? item.ry : 0,
    isFiniteNumber(item.rz) ? item.rz : 0
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
  } else if (isFiniteNumber(item.scale)) {
    model.scale.setScalar(item.scale);
  } else {
    model.scale.setScalar(baseScale);
  }

  model.userData = {
    id:
      item.id ||
      `obj-${Date.now()}-${Math.random()}`,

    file: item.file,
    isCopy: Boolean(item.isCopy),
    baseScale
  };

  model.traverse((child) => {
    if (!child.isMesh) return;

    child.castShadow = false;
    child.receiveShadow = false;
    child.frustumCulled = false;
  });

  scene.add(model);
  objects.push(model);

  return model;
}

export function loadSingleModel(item, onLoad, onError) {
  loader.load(
    item.file,

    (gltf) => {
      try {
        const model = addModelToScene(
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
  const position = item.position || {};
  const rotation = item.rotation || {};

  /*
   * Toetab nii uut:
   * scale: { x, y, z }
   *
   * kui vana:
   * scale: 0.8
   */
  const scaleObject =
    item.scale &&
    typeof item.scale === "object"
      ? item.scale
      : null;

  return {
    id: item.id,
    file: item.file,
    isCopy: Boolean(item.isCopy),

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

    scaleX: scaleObject?.x,
    scaleY: scaleObject?.y,
    scaleZ: scaleObject?.z,

    scale:
      isFiniteNumber(item.scale)
        ? item.scale
        : undefined
  };
}

export function loadModels(onComplete) {
  objects.forEach((object) => {
    scene.remove(object);
  });

  objects.length = 0;

  const saved = loadComposition();

  const savedObjects = Array.isArray(saved?.objects)
    ? saved.objects
    : Array.isArray(saved)
      ? saved
      : null;

  const list =
    savedObjects?.length
      ? savedObjects.map(convertSavedObject)
      : masterComposition;

  if (list.length === 0) {
    onComplete?.(saved);
    return;
  }

  let finishedCount = 0;

  const finishOne = () => {
    finishedCount += 1;

    if (finishedCount === list.length) {
      onComplete?.(saved);
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