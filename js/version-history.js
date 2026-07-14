import {
  loadCompositionVersions,
  loadCompositionVersion,
  restoreCloudComposition
} from "./cloud-storage.js";

import {
  loadModels,
  objects
} from "./loader.js";

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

function applyCompositionCamera() {
  /*
   * Preview ja Restore taastavad objektide paigutuse,
   * kuid ei kasuta versiooni sisse salvestatud
   * kaamera asukohta.
   *
   * Nii saab iga kompositsioon automaatselt
   * ühtlase ja sobiva kadreeringu.
   */

  frameObjects(objects);
  orbit.update();
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

function markPreviewingVersion(
  versionId
) {
  document
    .querySelectorAll(
      ".version-history-item"
    )
    .forEach((item) => {
      item.dataset.previewing =
        String(
          item.dataset.versionId ===
          String(versionId)
        );
    });
}

async function loadVersionComposition(
  versionId
) {
  const selectedVersion =
    await loadCompositionVersion(
      versionId
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

  return {
    selectedVersion,
    composition
  };
}

function displayComposition(
  composition,
  onComplete
) {
  loadModels(
    () => {
      applyCompositionCamera();
      onComplete?.();
    },
    composition
  );
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
    const {
      selectedVersion,
      composition
    } = await loadVersionComposition(
      version.id
    );

    displayComposition(
      composition,
      () => {
        markPreviewingVersion(
          version.id
        );

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
      }
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

async function restoreVersion(
  version,
  button
) {
  const confirmed = window.confirm(
    `Restore version #${version.id}?\n\n` +
    "This will become the active exhibition " +
    "for all visitors."
  );

  if (!confirmed) {
    return;
  }

  button.disabled = true;

  setPreviewStatus(
    `Restoring version #${version.id}…`
  );

  try {
    const {
      composition
    } = await loadVersionComposition(
      version.id
    );

    const restoredVersion =
      await restoreCloudComposition(
        composition
      );

    displayComposition(
      composition,
      async () => {
        setPreviewStatus(
          `Version #${version.id} restored successfully. ` +
          `New history version: #${restoredVersion.id}.`
        );

        console.log(
          "Exhibition version restored:",
          {
            sourceVersionId:
              version.id,

            restoredVersion
          }
        );

        await refreshVersionHistory();
      }
    );
  } catch (error) {
    console.error(
      "Version restore failed:",
      error
    );

    setPreviewStatus(
      "Restore failed — check Console.",
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

  const restoreButton =
    document.createElement(
      "button"
    );

  restoreButton.type =
    "button";

  restoreButton.className =
    "version-preview-button";

  restoreButton.textContent =
    "Restore";

  restoreButton.addEventListener(
    "click",
    () => {
      restoreVersion(
        version,
        restoreButton
      );
    }
  );

  actions.append(
    previewButton,
    restoreButton
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