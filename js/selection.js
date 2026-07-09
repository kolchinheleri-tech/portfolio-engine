import * as THREE from "three";
import { camera, renderer } from "./scene.js";
import { objects } from "./loader.js";

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

export let selectedObjects = [];

export function clearSelection() {
    selectedObjects = [];
}

export function setSelection(list) {
    selectedObjects = list;
}

export function addToSelection(object) {
    if (!selectedObjects.includes(object)) {
        selectedObjects.push(object);
    }
}

export function removeFromSelection(object) {
    selectedObjects = selectedObjects.filter(o => o !== object);
}

export function getClickedObject(event) {

    const rect = renderer.domElement.getBoundingClientRect();

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const hits = raycaster.intersectObjects(objects, true);

    if (!hits.length) return null;

    let object = hits[0].object;

    while (object.parent && !objects.includes(object)) {
        object = object.parent;
    }

    return objects.includes(object) ? object : null;
}