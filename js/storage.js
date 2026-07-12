const LOCAL_KEY = "exhibitionCompositionV1";

export function serializeComposition(objects, camera, orbit) {
  return {
    version: 1,
    savedAt: new Date().toISOString(),

    camera: {
      position: {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
      },
      target: {
        x: orbit.target.x,
        y: orbit.target.y,
        z: orbit.target.z
      }
    },

    objects: objects.map((object) => ({
      id: object.userData.id,
      file: object.userData.file,
      isCopy: Boolean(object.userData.isCopy),

      position: {
        x: object.position.x,
        y: object.position.y,
        z: object.position.z
      },

      rotation: {
        x: object.rotation.x,
        y: object.rotation.y,
        z: object.rotation.z
      },

      scale: {
        x: object.scale.x,
        y: object.scale.y,
        z: object.scale.z
      }
    }))
  };
}

export function saveComposition(objects, camera, orbit) {
  const composition = serializeComposition(objects, camera, orbit);

  localStorage.setItem(
    LOCAL_KEY,
    JSON.stringify(composition)
  );

  return composition;
}

export function loadComposition() {
  const saved = localStorage.getItem(LOCAL_KEY);

  if (!saved) return null;

  try {
    return JSON.parse(saved);
  } catch (error) {
    console.error("Composition could not be read:", error);
    return null;
  }
}

export function clearComposition() {
  localStorage.removeItem(LOCAL_KEY);
}