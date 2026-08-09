import * as THREE from "three";

import {
  OrbitControls
} from "three/examples/jsm/controls/OrbitControls.js";

import {
  camera,
  renderer,
  scene
} from "./scene.js";

import {
  objects
} from "./loader.js";


export const orbit =
  new OrbitControls(
    camera,
    renderer.domElement
  );


orbit.enableDamping =
  true;

orbit.dampingFactor =
  0.08;


orbit.enableZoom =
  true;

orbit.enableRotate =
  true;

orbit.enablePan =
  true;


orbit.minDistance =
  2;

orbit.maxDistance =
  40;


/* =========================================================
   FRAME ALL EXHIBITION OBJECTS
   ========================================================= */

export function frameObjects() {

  if (!objects.length) {
    return;
  }


  const box =
    new THREE.Box3();


  objects.forEach(
    (object) => {

      box.expandByObject(
        object
      );

    }
  );


  if (box.isEmpty()) {
    return;
  }


  const center =
    box.getCenter(
      new THREE.Vector3()
    );


  const size =
    box.getSize(
      new THREE.Vector3()
    );


  const verticalFov =
    THREE.MathUtils.degToRad(
      camera.fov
    );


  const aspect =
    renderer.domElement.clientWidth /
    renderer.domElement.clientHeight;


  const distanceForHeight =
    size.y /
    (
      2 *
      Math.tan(
        verticalFov /
        2
      )
    );


  const horizontalFov =
    2 *
    Math.atan(
      Math.tan(
        verticalFov /
        2
      ) *
      aspect
    );


  const distanceForWidth =
    size.x /
    (
      2 *
      Math.tan(
        horizontalFov /
        2
      )
    );


  /*
   * INITIAL EXHIBITION VIEW
   *
   * Larger value =
   * more white space around
   * the full composition.
   *
   * Previous:
   * 1.55
   *
   * Current:
   * 1.85
   */
  const FRAME_PADDING =
    1.85;


  const distance =
    Math.max(
      distanceForHeight,
      distanceForWidth
    ) *
    FRAME_PADDING;


  /*
   * Slight vertical lift keeps
   * enough room underneath
   * for product information.
   */
  camera.position.set(
    center.x,

    center.y +
      size.y *
      0.08,

    center.z +
      distance
  );


  camera.near =
    Math.max(
      distance /
      100,
      0.01
    );


  camera.far =
    Math.max(
      distance *
      100,
      100
    );


  camera.updateProjectionMatrix();


  orbit.target.copy(
    center
  );


  camera.lookAt(
    center
  );


  orbit.update();


  const viewer =
    document.getElementById(
      "viewer"
    );


  if (viewer) {

    viewer.classList.remove(
      "loading"
    );

  }


  const loading =
    document.getElementById(
      "loading"
    );


  if (loading) {

    loading.style.display =
      "none";

  }

}


/* =========================================================
   START VIEWER
   ========================================================= */

export function startViewer() {

  function animate() {

    requestAnimationFrame(
      animate
    );


    orbit.update();


    renderer.render(
      scene,
      camera
    );

  }


  animate();

}


/* =========================================================
   RESIZE
   ========================================================= */

window.addEventListener(
  "resize",
  () => {

    const width =
      renderer.domElement
        .parentElement
        ?.clientWidth ||
      window.innerWidth;


    const height =
      renderer.domElement
        .parentElement
        ?.clientHeight ||
      window.innerHeight;


    camera.aspect =
      width /
      height;


    camera.updateProjectionMatrix();


    renderer.setSize(
      width,
      height
    );

  }
);