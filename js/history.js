export const undoStack = [];
export const redoStack = [];

export function snapshot(objects) {
  return objects.map((o) => ({
    id: o.userData.id,
    file: o.userData.file,
    isCopy: o.userData.isCopy || false,
    x: o.position.x,
    y: o.position.y,
    z: o.position.z,
    rx: o.rotation.x,
    ry: o.rotation.y,
    rz: o.rotation.z,
    scale: o.scale.x
  }));
}

export function pushUndo(objects) {
  undoStack.push(snapshot(objects));

  if (undoStack.length > 50) {
    undoStack.shift();
  }

  redoStack.length = 0;
}