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
    return masterComposition.find(item => item.file === file);
}

export function addModelToScene(model, item) {

    const box = new THREE.Box3().setFromObject(model);

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    model.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z);

    const master = getMaster(item.file) || item;

    const baseScale =
        (1.2 / maxDim) *
        (master.scaleFactor || 1);

    model.position.set(
        item.x ?? 0,
        item.y ?? 0,
        item.z ?? 0
    );

    model.rotation.set(
        item.rx ?? 0,
        item.ry ?? 0,
        item.rz ?? 0
    );

    model.scale.setScalar(
        item.scale ?? baseScale
    );

    model.userData = {
        id:
            item.id ||
            `obj-${Date.now()}-${Math.random()}`,

        file: item.file,

        isCopy: item.isCopy || false,

        baseScale
    };

    model.traverse(child => {

        if (child.isMesh) {

            child.castShadow = false;
            child.receiveShadow = false;

            child.frustumCulled = false;

        }

    });

    scene.add(model);

    objects.push(model);

    return model;
}

export function loadSingleModel(item, onLoad) {

    loader.load(

        item.file,

        gltf => {

            const model =
                addModelToScene(
                    gltf.scene,
                    item
                );

            if (onLoad)
                onLoad(model);

        },

        undefined,

        err => {

            console.error(
                "Cannot load",
                item.file,
                err
            );

        }

    );

}

export function loadModels() {

    objects.length = 0;

    const saved =
        loadComposition();

    const list =
        saved && saved.length
            ? saved
            : masterComposition;

    list.forEach(item => {

        loadSingleModel(item);

    });

}