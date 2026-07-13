function serializeVector3(vector) {
  return {
    x: vector.x,
    y: vector.y,
    z: vector.z
  };
}

function serializeQuaternion(quaternion) {
  return {
    x: quaternion.x,
    y: quaternion.y,
    z: quaternion.z,
    w: quaternion.w
  };
}

export function serializeObject(object) {
  if (!object?.userData?.file) {
    throw new Error(
      "Object cannot be serialized because its model file is missing."
    );
  }

  return {
    id: object.userData.id,
    file: object.userData.file,
    isCopy: Boolean(object.userData.isCopy),

    position: serializeVector3(
      object.position
    ),

    quaternion: serializeQuaternion(
      object.quaternion
    ),

    scale: serializeVector3(
      object.scale
    )
  };
}

export function serializeCamera(
  camera,
  orbit
) {
  return {
    position: serializeVector3(
      camera.position
    ),

    target: serializeVector3(
      orbit.target
    )
  };
}

export function serializeProjectComposition({
  project,
  objects,
  camera,
  orbit
}) {
  if (!project?.id || !project?.slug) {
    throw new Error(
      "A valid project is required before the composition can be serialized."
    );
  }

  return {
    version: 1,

    project: {
      id: project.id,
      slug: project.slug,
      title: project.title,
      description: project.description || ""
    },

    camera: serializeCamera(
      camera,
      orbit
    ),

    objects: objects.map(
      serializeObject
    ),

    updatedAt: new Date().toISOString()
  };
}

export function deserializeObjectData(
  item
) {
  const position = item.position || {};
  const quaternion = item.quaternion;
  const rotation = item.rotation || {};
  const scale = item.scale;

  return {
    id: item.id,
    file: item.file,
    isCopy: Boolean(item.isCopy),

    position: {
      x: position.x ?? 0,
      y: position.y ?? 0,
      z: position.z ?? 0
    },

    quaternion:
      quaternion &&
      Number.isFinite(quaternion.w)
        ? {
            x: quaternion.x ?? 0,
            y: quaternion.y ?? 0,
            z: quaternion.z ?? 0,
            w: quaternion.w
          }
        : null,

    rotation: {
      x: rotation.x ?? 0,
      y: rotation.y ?? 0,
      z: rotation.z ?? 0
    },

    scale:
      scale &&
      typeof scale === "object"
        ? {
            x: scale.x,
            y: scale.y,
            z: scale.z
          }
        : scale
  };
}