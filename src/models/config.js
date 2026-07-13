export const masterComposition = [
  {
    id: "obj-1",
    file: "/models/1.glb",
    position: {
      x: -4,
      y: 0,
      z: 0
    },
    rotation: {
      x: 0,
      y: 0,
      z: 0
    },
    scaleFactor: 1.15,
    isCopy: false
  },
  {
    id: "obj-2",
    file: "/models/pink.glb",
    position: {
      x: -2,
      y: 0,
      z: 0.2
    },
    rotation: {
      x: 0,
      y: 0,
      z: 0
    },
    scaleFactor: 0.85,
    isCopy: false
  },
  {
    id: "obj-3",
    file: "/models/yellow.glb",
    position: {
      x: 0,
      y: 0,
      z: -0.2
    },
    rotation: {
      x: 0,
      y: 0,
      z: 0
    },
    scaleFactor: 1,
    isCopy: false
  },
  {
    id: "obj-4",
    file: "/models/green.glb",
    position: {
      x: 2,
      y: 0,
      z: 0.2
    },
    rotation: {
      x: 0,
      y: 0,
      z: 0
    },
    scaleFactor: 1.25,
    isCopy: false
  },
  {
    id: "obj-5",
    file: "/models/pink big.glb",
    position: {
      x: 4,
      y: 0,
      z: -0.1
    },
    rotation: {
      x: 0,
      y: 0,
      z: 0
    },
    scaleFactor: 0.95,
    isCopy: false
  }
];

export function getMasterObject(file) {
  return masterComposition.find(
    (item) => item.file === file
  );
}