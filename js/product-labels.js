import * as THREE from "three";

import {
  camera,
  renderer
} from "./scene.js";

import {
  objects
} from "./loader.js";

import {
  getProductByModelFile,
  formatProductPrice
} from "./product-data.js";


const labels =
  new Map();

const box =
  new THREE.Box3();

const anchorWorld =
  new THREE.Vector3();


const LABEL_WIDTH = 148;

/*
 * Distance from object base
 * to first label row.
 */
const BASE_LINE_LENGTH = 72;

/*
 * Additional downward distance
 * when labels would otherwise overlap.
 */
const LANE_STEP = 78;

const HORIZONTAL_GAP = 18;


function openProduct(
  product
) {
  if (!product) {
    return;
  }

  window.location.href =
    `/product.html?product=${encodeURIComponent(
      product.slug
    )}`;
}


function createProductLabel(
  object,
  product
) {
  const wrapper =
    document.createElement(
      "div"
    );

  wrapper.className =
    "product-label";

  wrapper.innerHTML = `
    <div class="product-label-line"></div>

    <div class="product-label-content">

      <span class="product-label-index">
        ${product.catalogueNumber || ""}
      </span>

      <span class="product-label-title">
        ${product.title}
      </span>

      <span class="product-label-meta">
        ${product.type || ""}
      </span>

      <span class="product-label-meta product-label-year-price">

        <span>
          ${product.year || ""}
        </span>

        ${
          typeof product.price ===
          "number"
            ? `
              <span class="product-label-separator">
                /
              </span>

              <span>
                ${formatProductPrice(
                  product
                )}
              </span>
            `
            : ""
        }

      </span>

      <button
        class="product-label-action"
        type="button"
      >
        VIEW →
      </button>

    </div>
  `;

  const action =
    wrapper.querySelector(
      ".product-label-action"
    );

  action?.addEventListener(
    "pointerdown",
    (event) => {
      event.stopPropagation();
    }
  );

  action?.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      openProduct(
        product
      );
    }
  );

  document
    .getElementById(
      "product-label-layer"
    )
    ?.appendChild(
      wrapper
    );

  labels.set(
    object,
    {
      element: wrapper,
      product
    }
  );
}


function removeLabel(
  object
) {
  const labelData =
    labels.get(
      object
    );

  if (!labelData) {
    return;
  }

  labelData.element.remove();

  labels.delete(
    object
  );
}


function syncLabels() {
  objects.forEach(
    (object) => {
      const product =
        getProductByModelFile(
          object.userData.file
        );

      const shouldShow =
        Boolean(
          product?.showLabel
        ) &&
        !object.userData.isCopy &&
        object.visible !== false;

      if (
        shouldShow &&
        !labels.has(object)
      ) {
        createProductLabel(
          object,
          product
        );
      }

      if (
        !shouldShow &&
        labels.has(object)
      ) {
        removeLabel(
          object
        );
      }
    }
  );

  for (
    const object of
    [...labels.keys()]
  ) {
    if (
      !objects.includes(
        object
      )
    ) {
      removeLabel(
        object
      );
    }
  }
}


function getProjectedAnchor(
  object
) {
  box.setFromObject(
    object
  );

  /*
   * Bottom-centre of object.
   *
   * Connector always begins
   * from the exact centre
   * underneath the object.
   */
  anchorWorld.set(
    (
      box.min.x +
      box.max.x
    ) / 2,

    box.min.y,

    (
      box.min.z +
      box.max.z
    ) / 2
  );

  anchorWorld.project(
    camera
  );

  const rect =
    renderer
      .domElement
      .getBoundingClientRect();

  return {
    x:
      (
        anchorWorld.x *
          0.5 +
        0.5
      ) *
      rect.width,

    y:
      (
        -anchorWorld.y *
          0.5 +
        0.5
      ) *
      rect.height,

    z:
      anchorWorld.z,

    width:
      rect.width,

    height:
      rect.height
  };
}


function buildLayoutEntries() {
  const entries = [];

  for (
    const [
      object,
      labelData
    ] of labels
  ) {
    const anchor =
      getProjectedAnchor(
        object
      );

    entries.push({
      object,
      element:
        labelData.element,

      anchor,

      lane: 0
    });
  }

  return entries;
}


function assignLanes(
  entries
) {
  /*
   * Work from left to right.
   *
   * Labels that are horizontally
   * too close are moved to the
   * next row lower down.
   */
  entries.sort(
    (a, b) =>
      a.anchor.x -
      b.anchor.x
  );

  const laneRightEdges = [];

  entries.forEach(
    (entry) => {
      const left =
        entry.anchor.x -
        LABEL_WIDTH / 2;

      const right =
        entry.anchor.x +
        LABEL_WIDTH / 2;

      let lane = 0;

      while (true) {
        const previousRight =
          laneRightEdges[lane];

        if (
          previousRight ===
            undefined ||
          left >
            previousRight +
              HORIZONTAL_GAP
        ) {
          break;
        }

        lane += 1;
      }

      entry.lane =
        lane;

      laneRightEdges[lane] =
        right;
    }
  );
}


function applyLayout(
  entries
) {
  entries.forEach(
    (entry) => {
      const {
        anchor,
        element,
        lane
      } = entry;

      const invisible =
        anchor.z < -1 ||
        anchor.z > 1 ||
        anchor.x < -200 ||
        anchor.x >
          anchor.width + 200 ||
        anchor.y < -200 ||
        anchor.y >
          anchor.height + 200;

      element.hidden =
        invisible;

      if (invisible) {
        return;
      }

      const lineLength =
        BASE_LINE_LENGTH +
        lane *
          LANE_STEP;

      element.style.left =
        `${anchor.x}px`;

      element.style.top =
        `${anchor.y}px`;

      element.style.setProperty(
        "--label-line-length",
        `${lineLength}px`
      );

      element.style.setProperty(
        "--label-content-offset",
        `${lineLength + 12}px`
      );
    }
  );
}


function update() {
  syncLabels();

  const entries =
    buildLayoutEntries();

  assignLanes(
    entries
  );

  applyLayout(
    entries
  );

  window.requestAnimationFrame(
    update
  );
}


export function initProductLabels() {
  window.requestAnimationFrame(
    update
  );
}