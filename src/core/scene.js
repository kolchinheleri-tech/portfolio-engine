import * as THREE from "three";

const viewer = document.getElementById("viewer");

if (!viewer) {
  throw new Error(
    'Element with id="viewer" was not found.'
  );
}

export const scene = new THREE.Scene();
scene.background = null;

export const camera = new THREE.PerspectiveCamera(
  45,
  viewer.clientWidth / viewer.clientHeight,
  0.01,
  1000
);

camera.position.set(0, 2.5, 8);

export const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: true
});

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, 2)
);

renderer.setSize(
  viewer.clientWidth,
  viewer.clientHeight
);

renderer.setClearColor(0x000000, 0);

renderer.outputColorSpace =
  THREE.SRGBColorSpace;

renderer.toneMapping =
  THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = false;

viewer.appendChild(renderer.domElement);

// Üldvalgus
const ambientLight = new THREE.AmbientLight(
  0xffffff,
  2.5
);

scene.add(ambientLight);

// Põhivalgus
const keyLight = new THREE.DirectionalLight(
  0xffffff,
  3
);

keyLight.position.set(5, 8, 6);
scene.add(keyLight);

// Täitevalgus
const fillLight = new THREE.DirectionalLight(
  0xffffff,
  1.5
);

fillLight.position.set(-5, 4, -4);
scene.add(fillLight);

export function resizeScene() {
  const width =
    viewer.clientWidth || window.innerWidth;

  const height =
    viewer.clientHeight || window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
}

window.addEventListener(
  "resize",
  resizeScene
);