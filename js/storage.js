const KEY = "portfolioCompositionV4";

export function loadComposition() {
  const data = localStorage.getItem(KEY);
  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function saveComposition(objects) {
  const data = objects.map((object) => ({
    id: object.userData.id,
    file: object.userData.file,
    isCopy: object.userData.isCopy || false,
    x: object.position.x,
    y: object.position.y,
    z: object.position.z,
    rx: object.rotation.x,
    ry: object.rotation.y,
    rz: object.rotation.z,
    scale: object.scale.x
  }));

  localStorage.setItem(KEY, JSON.stringify(data));
}

export function clearComposition() {
  localStorage.removeItem(KEY);
}