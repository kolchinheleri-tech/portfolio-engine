import * as THREE from "three";

import {
  GLTFLoader
} from "three/examples/jsm/loaders/GLTFLoader.js";

import {
  getProductBySlug,
  formatProductPrice
} from "./product-data.js";

import {
  loadComposition
} from "./storage.js";

import {
  loadCloudComposition
} from "./cloud-storage.js";


const CART_KEY =
  "portfolio-shop-cart";


function getCart() {
  try {
    const raw =
      window.localStorage.getItem(
        CART_KEY
      );

    const parsed =
      JSON.parse(
        raw || "[]"
      );

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}


function saveCart(
  cart
) {
  window.localStorage.setItem(
    CART_KEY,
    JSON.stringify(cart)
  );

  updateCartCount();
}


function updateCartCount() {
  const cart =
    getCart();

  const count =
    document.getElementById(
      "cart-count"
    );

  if (!count) {
    return;
  }

  const total =
    cart.reduce(
      (
        sum,
        item
      ) =>
        sum +
        (
          Number(
            item.quantity
          ) || 1
        ),
      0
    );

  count.textContent =
    String(total);
}


function addProductToCart(
  product
) {
  const cart =
    getCart();

  const existing =
    cart.find(
      (item) =>
        item.productId ===
        product.id
    );

  if (existing) {
    existing.quantity =
      (
        Number(
          existing.quantity
        ) || 1
      ) + 1;
  } else {
    cart.push({
      productId:
        product.id,

      quantity: 1,

      addedAt:
        new Date()
          .toISOString()
    });
  }

  saveCart(
    cart
  );

  const status =
    document.getElementById(
      "cart-status"
    );

  if (!status) {
    return;
  }

  status.textContent =
    "ADDED TO CART";

  window.setTimeout(
    () => {
      status.textContent =
        "";
    },
    1800
  );
}


/* =========================================================
   EXHIBITION TRANSFORM
   ========================================================= */

async function getExhibitionObjectState(
  modelFile
) {
  /*
   * Public website:
   * prefer latest Supabase state.
   *
   * Localhost fallback:
   * localStorage.
   */
  let composition =
    null;

  try {
    composition =
      await loadCloudComposition();
  } catch (error) {
    console.warn(
      "Could not load cloud composition:",
      error
    );
  }


  if (!composition) {
    composition =
      loadComposition();
  }


  if (
    !composition ||
    !Array.isArray(
      composition.objects
    )
  ) {
    return null;
  }


  /*
   * Use original object,
   * not a duplicate.
   */
  return (
    composition.objects.find(
      (item) =>
        item.file ===
          modelFile &&
        !item.isCopy
    ) ||
    composition.objects.find(
      (item) =>
        item.file ===
        modelFile
    ) ||
    null
  );
}


/* =========================================================
   PRODUCT 3D VIEWER
   ========================================================= */

async function initProductViewer(
  product
) {
  const container =
    document.getElementById(
      "product-model-viewer"
    );

  const status =
    document.getElementById(
      "product-model-status"
    );

  if (
    !container ||
    !product?.modelFile
  ) {
    return;
  }


  const exhibitionState =
    await getExhibitionObjectState(
      product.modelFile
    );


  const viewerSettings =
    product.viewer || {};


  const scene =
    new THREE.Scene();

  scene.background =
    null;


  const camera =
    new THREE.PerspectiveCamera(
      35,
      1,
      0.01,
      100
    );


  const defaultCameraDistance =
    viewerSettings
      .cameraDistance ||
    4.3;


  let cameraDistance =
    defaultCameraDistance;


  camera.position.set(
    0,
    0.1,
    cameraDistance
  );


  camera.lookAt(
    0,
    0,
    0
  );


  const renderer =
    new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });


  renderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio,
      2
    )
  );


  renderer.setClearColor(
    0xffffff,
    0
  );


  renderer.outputColorSpace =
    THREE.SRGBColorSpace;


  renderer.toneMapping =
    THREE.ACESFilmicToneMapping;


  renderer.toneMappingExposure =
    1.35;


  container.appendChild(
    renderer.domElement
  );


  /* =======================================================
     LIGHTS
     ======================================================= */

  const ambientLight =
    new THREE.AmbientLight(
      0xffffff,
      3
    );

  scene.add(
    ambientLight
  );


  const keyLight =
    new THREE.DirectionalLight(
      0xffffff,
      2.8
    );

  keyLight.position.set(
    4,
    6,
    5
  );

  scene.add(
    keyLight
  );


  const fillLight =
    new THREE.DirectionalLight(
      0xffffff,
      1.7
    );

  fillLight.position.set(
    -5,
    3,
    -4
  );

  scene.add(
    fillLight
  );


  /* =======================================================
     GROUPS
     ======================================================= */

  /*
   * baseGroup:
   * gets the SAME orientation
   * as the exhibition.
   *
   * inspectionGroup:
   * user can rotate this manually.
   */
  const inspectionGroup =
    new THREE.Group();

  const baseGroup =
    new THREE.Group();


  inspectionGroup.add(
    baseGroup
  );

  scene.add(
    inspectionGroup
  );


  let dragging =
    false;

  let previousX =
    0;

  let previousY =
    0;


  function resize() {
    const width =
      container.clientWidth;

    const height =
      container.clientHeight;


    if (
      width <= 0 ||
      height <= 0
    ) {
      return;
    }


    renderer.setSize(
      width,
      height,
      false
    );


    camera.aspect =
      width /
      height;


    camera.updateProjectionMatrix();
  }


  const resizeObserver =
    new ResizeObserver(
      resize
    );


  resizeObserver.observe(
    container
  );

  resize();


  /* =======================================================
     LOAD GLB
     ======================================================= */

  const loader =
    new GLTFLoader();


  loader.load(
    product.modelFile,

    (gltf) => {
      const model =
        gltf.scene;


      /*
       * Same centering logic
       * as exhibition loader.js.
       */
      const initialBox =
        new THREE.Box3()
          .setFromObject(
            model
          );


      const center =
        initialBox.getCenter(
          new THREE.Vector3()
        );


      const size =
        initialBox.getSize(
          new THREE.Vector3()
        );


      const maxDimension =
        Math.max(
          size.x,
          size.y,
          size.z
        );


      if (
        !Number.isFinite(
          maxDimension
        ) ||
        maxDimension <= 0
      ) {
        throw new Error(
          `Invalid model dimensions: ${product.modelFile}`
        );
      }


      model.traverse(
        (child) => {
          if (
            child.isMesh &&
            child.geometry
          ) {
            child.geometry.translate(
              -center.x,
              -center.y,
              -center.z
            );
          }
        }
      );


      /*
       * Product viewer uses normalized
       * size, but keeps proportions.
       */
      const normalizedScale =
        1.75 /
        maxDimension;


      const customScale =
        viewerSettings.scale ||
        1;


      model.scale.setScalar(
        normalizedScale *
        customScale
      );


      baseGroup.add(
        model
      );


      /*
       * THIS IS THE IMPORTANT PART:
       *
       * use rotation from saved
       * exhibition composition.
       */
      const savedRotation =
        exhibitionState?.rotation;


      if (savedRotation) {
        baseGroup.rotation.set(
          Number(
            savedRotation.x
          ) || 0,

          Number(
            savedRotation.y
          ) || 0,

          Number(
            savedRotation.z
          ) || 0
        );
      } else {
        baseGroup.rotation.set(
          0,
          0,
          0
        );
      }


      baseGroup.updateMatrixWorld(
        true
      );


      /*
       * After applying the exhibition
       * rotation, centre the visible
       * object in the product viewer.
       */
      const visibleBox =
        new THREE.Box3()
          .setFromObject(
            baseGroup
          );


      const visibleCenter =
        visibleBox.getCenter(
          new THREE.Vector3()
        );


      baseGroup.position.set(
        -visibleCenter.x,
        -visibleCenter.y,
        -visibleCenter.z
      );


      const offset =
        viewerSettings.offset ||
        {};


      baseGroup.position.x +=
        offset.x || 0;


      baseGroup.position.y +=
        offset.y || 0;


      baseGroup.position.z +=
        offset.z || 0;


      model.traverse(
        (child) => {
          if (!child.isMesh) {
            return;
          }

          child.castShadow =
            false;

          child.receiveShadow =
            false;

          child.frustumCulled =
            false;
        }
      );


      if (status) {
        status.hidden =
          true;
      }
    },

    undefined,

    (error) => {
      console.error(
        `Could not load product model: ${product.modelFile}`,
        error
      );


      if (status) {
        status.textContent =
          "3D OBJECT COULD NOT BE LOADED";
      }
    }
  );


  /* =======================================================
     MANUAL ROTATE
     ======================================================= */

  renderer.domElement
    .addEventListener(
      "pointerdown",
      (event) => {
        dragging =
          true;


        previousX =
          event.clientX;


        previousY =
          event.clientY;


        renderer
          .domElement
          .setPointerCapture(
            event.pointerId
          );
      }
    );


  renderer.domElement
    .addEventListener(
      "pointermove",
      (event) => {
        if (!dragging) {
          return;
        }


        const deltaX =
          event.clientX -
          previousX;


        const deltaY =
          event.clientY -
          previousY;


        inspectionGroup.rotation.y +=
          deltaX *
          0.007;


        inspectionGroup.rotation.x +=
          deltaY *
          0.0035;


        inspectionGroup.rotation.x =
          THREE.MathUtils.clamp(
            inspectionGroup.rotation.x,
            -0.75,
            0.75
          );


        previousX =
          event.clientX;


        previousY =
          event.clientY;
      }
    );


  function stopDragging() {
    dragging =
      false;
  }


  renderer.domElement
    .addEventListener(
      "pointerup",
      stopDragging
    );


  renderer.domElement
    .addEventListener(
      "pointercancel",
      stopDragging
    );


  /* =======================================================
     ZOOM
     ======================================================= */

  renderer.domElement
    .addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();


        cameraDistance +=
          event.deltaY *
          0.0025;


        cameraDistance =
          THREE.MathUtils.clamp(
            cameraDistance,
            1.45,
            8
          );


        camera.position.z =
          cameraDistance;


        camera.lookAt(
          0,
          0,
          0
        );
      },

      {
        passive: false
      }
    );


  /* =======================================================
     RESET
     ======================================================= */

  renderer.domElement
    .addEventListener(
      "dblclick",
      () => {
        cameraDistance =
          defaultCameraDistance;


        camera.position.set(
          0,
          0.1,
          cameraDistance
        );


        camera.lookAt(
          0,
          0,
          0
        );


        /*
         * Reset ONLY user's inspection
         * rotation.
         *
         * Exhibition orientation stays.
         */
        inspectionGroup.rotation.set(
          0,
          0,
          0
        );
      }
    );


  /* =======================================================
     RENDER
     ======================================================= */

  function animate() {
    renderer.render(
      scene,
      camera
    );


    window.requestAnimationFrame(
      animate
    );
  }


  animate();
}


/* =========================================================
   PRODUCT INFORMATION
   ========================================================= */

function setText(
  id,
  value
) {
  const element =
    document.getElementById(
      id
    );


  if (!element) {
    return;
  }


  element.textContent =
    value || "";
}


function renderProduct(
  product
) {
  document.title =
    `${product.title} — Exhibition`;


  setText(
    "product-catalogue-number",
    product.catalogueNumber
      ? `${product.catalogueNumber} / OBJECT`
      : ""
  );


  setText(
    "product-title",
    product.title
  );


  setText(
    "product-subtitle",
    product.type
  );


  setText(
    "product-year",
    product.year
  );


  setText(
    "product-price",
    formatProductPrice(
      product
    )
  );


  setText(
    "product-materials",
    product.materials
  );


  setText(
    "product-dimensions",
    product.dimensions
  );


  setText(
    "product-availability",
    product.availability
  );


  setText(
    "product-edition",
    product.edition
  );


  setText(
    "product-short-description",
    product.shortDescription
  );


  const description =
    document.getElementById(
      "product-description"
    );


  if (description) {
    description.innerHTML =
      "";


    (
      product.description ||
      []
    ).forEach(
      (paragraph) => {
        const element =
          document.createElement(
            "p"
          );


        element.textContent =
          paragraph;


        description.appendChild(
          element
        );
      }
    );
  }


  const details =
    document.getElementById(
      "product-details"
    );


  if (details) {
    details.innerHTML =
      "";


    (
      product.details ||
      []
    ).forEach(
      (detail) => {
        const item =
          document.createElement(
            "li"
          );


        item.textContent =
          detail;


        details.appendChild(
          item
        );
      }
    );
  }


  setText(
    "product-shipping",
    product.shipping
  );


  const addButton =
    document.getElementById(
      "add-to-cart"
    );


  if (
    addButton &&
    typeof product.price ===
      "number"
  ) {
    addButton.addEventListener(
      "click",
      () => {
        addProductToCart(
          product
        );
      }
    );
  }


  const productStatus =
    document.getElementById(
      "product-status"
    );


  if (productStatus) {
    productStatus.hidden =
      true;
  }


  const productContent =
    document.getElementById(
      "product-content"
    );


  if (productContent) {
    productContent.hidden =
      false;
  }


  initProductViewer(
    product
  );
}


/* =========================================================
   INIT
   ========================================================= */

function init() {
  updateCartCount();


  const parameters =
    new URLSearchParams(
      window.location.search
    );


  const slug =
    parameters.get(
      "product"
    );


  const product =
    getProductBySlug(
      slug
    );


  if (
    !product ||
    !product.showLabel
  ) {
    const status =
      document.getElementById(
        "product-status"
      );


    if (status) {
      status.textContent =
        "OBJECT NOT FOUND.";
    }


    return;
  }


  renderProduct(
    product
  );
}


init();