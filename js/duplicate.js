import { scene } from "./scene.js";
import { objects, loadSingleModel } from "./loader.js";
import { saveComposition } from "./storage.js";

export function duplicateObjects(selectedObjects, onDuplicate) {
  if (selectedObjects.length === 0) return;

  const newObjects = [];

  selectedObjects.forEach((original, index) => {
    const data = {
      id: `${original.userData.id}-copy-${Date.now()}-${index}`,
      file: original.userData.file,
      isCopy: true,
      x: original.position.x + 0.7,
      y: original.position.y,
      z: original.position.z + 0.25,
      rx: original.rotation.x,
      ry: original.rotation.y,
      rz: original.rotation.z,
      scale: original.scale.x
    };

    loadSingleModel(data, (newObject) => {
      newObjects.push(newObject);

      if (newObjects.length === selectedObjects.length) {
        saveComposition(objects);

        if (onDuplicate) {
          onDuplicate(newObjects);
        }
      }
    });
  });
}

export function deleteCopies(selectedObjects, onDelete) {
  const copies = selectedObjects.filter((object) => object.userData.isCopy);

  if (copies.length === 0) return selectedObjects;

  copies.forEach((copy) => {
    scene.remove(copy);

    const index = objects.indexOf(copy);
    if (index !== -1) {
      objects.splice(index, 1);
    }
  });

  const remaining = selectedObjects.filter((object) => !object.userData.isCopy);

  saveComposition(objects);

  if (onDelete) {
    onDelete(remaining);
  }

  return remaining;
}