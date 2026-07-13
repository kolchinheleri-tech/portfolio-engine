import {
  loadCompositionVersions,
  loadCompositionVersion
} from "./cloud-storage.js";

import {
  loadModels,
  objects
} from "./loader.js";

import {
  camera
} from "./scene.js";

import {
  orbit,
  frameObjects
} from "./viewer.js";

function formatVersionType(versionType) {
  if (versionType === "initial") {
    return "Initial exhibition";
  }

  if (versionType === "restore") {
    return "Restored version";
  }

  if (versionType === "visitor_save") {
    return "Visitor save";
  }

  return versionType || "Saved version";
}

function formatDate(dateString) {
  if (!dateString) {
    return "Unknown date";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(date);
}

function applyCompositionCamera(
  composition
) {
  const savedCamera =
    composition?.camera;

  if (
    savedCamera?.position &&
    savedCamera?.target
  ) {
    camera.position.set(
      savedCamera.position.x,
      savedCamera.position.y,
      savedCamera.position.z
    );

    orbit.target.set(
      savedCamera.target.x,
      savedCamera.target.y,
      savedCamera.target.z
    );

    camera.lookAt(
      orbit.target
    );

    orbit.update();

    return;
  }

  frameObjects(objects);
}

function setPreviewStatus(
  message,
  isError = false
) {
  const element =
    document.getElementById(
      "version-preview-status"
    );

  if (!element) {
    return;
  }

  element.textContent = message;
  element.dataset.error =
    String(isError);
}

async function previewVersion(
  version,
  button
) {
  button.disabled = true;

  setPreviewStatus(
    `Loading version #${version.id}…`
  );

  try {
    const selectedVersion =
      await loadCompositionVersion(
        version.id
      );

    const composition =
      selectedVersion?.state;

    if (
      !composition ||
      typeof composition !== "object"
    ) {
      throw new Error(
        "The selected version has no valid composition."
      );
    }

    loadModels(
      () => {
        applyCompositionCamera(
          composition
        );

        document
          .querySelectorAll(
            ".version-history-item"
          )
          .forEach((item) => {
            item.dataset.previewing =
              "false";
          });

        const item =
          button.closest(
            ".version-history-item"
          );

        if (item) {
          item.dataset.previewing =
            "true";
        }

        setPreviewStatus(
          `Previewing version #${version.id}. ` +
          "This has not been restored or saved."
        );

        console.log(
          "Exhibition version previewed:",
          {
            version: selectedVersion,
            objects
          }
        );
      },
      composition
    );
  } catch (error) {
    console.error(
      "Version preview failed:",
      error
    );

    setPreviewStatus(
      "Preview failed — check Console.",
      true
    );
  } finally {
    button.disabled = false;
  }
}

function createVersionElement(
  version
) {
  const item =
    document.createElement(
      "article"
    );

  item.className =
    "version-history-item";

  item.dataset.versionId =
    String(version.id);

  item.dataset.previewing =
    "false";

  const information =
    document.createElement(
      "div"
    );

  information.className =
    "version-history-item-information";

  const type =
    document.createElement(
      "div"
    );

  type.className =
    "version-history-item-type";

  type.textContent =
    formatVersionType(
      version.version_type
    );

  const date =
    document.createElement(
      "time"
    );

  date.className =
    "version-history-item-date";

  date.dateTime =
    version.created_at || "";

  date.textContent =
    formatDate(
      version.created_at
    );

  const identifier =
    document.createElement(
      "div"
    );

  identifier.className =
    "version-history-item-identifier";

  identifier.textContent =
    `Version #${version.id}`;

  information.append(
    type,
    date,
    identifier
  );

  const actions =
    document.createElement(
      "div"
    );

  actions.className =
    "version-history-item-actions";

  const previewButton =
    document.createElement(
      "button"
    );

  previewButton.type =
    "button";

  previewButton.className =
    "version-preview-button";

  previewButton.textContent =
    "Preview";

  previewButton.addEventListener(
    "click",
    () => {
      previewVersion(
        version,
        previewButton
      );
    }
  );

  actions.append(
    previewButton
  );

  item.append(
    information,
    actions
  );

  return item;
}

function renderMessage(
  container,
  message,
  isError = false
) {
  container.replaceChildren();

  const element =
    document.createElement(
      "div"
    );

  element.className =
    "version-history-message";

  element.dataset.error =
    String(isError);

  element.textContent =
    message;

  container.append(
    element
  );
}

async function refreshVersionHistory() {
  const list =
    document.getElementById(
      "version-history-list"
    );

  const refreshButton =
    document.getElementById(
      "refresh-version-history"
    );

  if (!list) {
    return;
  }

  if (refreshButton) {
    refreshButton.disabled = true;
  }

  setPreviewStatus("");

  renderMessage(
    list,
    "Loading saved versions…"
  );

  try {
    const versions =
      await loadCompositionVersions();

    if (versions.length === 0) {
      renderMessage(
        list,
        "No saved versions yet."
      );

      return;
    }

    list.replaceChildren();

    versions.forEach((version) => {
      list.append(
        createVersionElement(
          version
        )
      );
    });
  } catch (error) {
    console.error(
      "Version history could not be displayed:",
      error
    );

    renderMessage(
      list,
      "Version history could not be loaded.",
      true
    );
  } finally {
    if (refreshButton) {
      refreshButton.disabled = false;
    }
  }
}

export function initVersionHistory() {
  const panel =
    document.getElementById(
      "version-history-panel"
    );

  const toggleButton =
    document.getElementById(
      "toggle-version-history"
    );

  const closeButton =
    document.getElementById(
      "close-version-history"
    );

  const refreshButton =
    document.getElementById(
      "refresh-version-history"
    );

  if (
    !panel ||
    !toggleButton
  ) {
    console.warn(
      "Version history controls were not found."
    );

    return;
  }

  toggleButton.addEventListener(
    "click",
    () => {
      const isOpen =
        panel.dataset.open === "true";

      panel.dataset.open =
        String(!isOpen);

      panel.setAttribute(
        "aria-hidden",
        String(isOpen)
      );

      toggleButton.setAttribute(
        "aria-expanded",
        String(!isOpen)
      );

      if (!isOpen) {
        refreshVersionHistory();
      }
    }
  );

  if (closeButton) {
    closeButton.addEventListener(
      "click",
      () => {
        panel.dataset.open =
          "false";

        panel.setAttribute(
          "aria-hidden",
          "true"
        );

        toggleButton.setAttribute(
          "aria-expanded",
          "false"
        );
      }
    );
  }

  if (refreshButton) {
    refreshButton.addEventListener(
      "click",
      refreshVersionHistory
    );
  }
}