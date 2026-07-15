import {
  setTransformMode,
  duplicateSelected,
  getSelectionCount,
  scaleSelected,
  undoLastChange,
  toggleMultiSelectMode,
  hideSelected,
  showAllObjects
} from "./transform.js";

function setToolbarStatus(
  message,
  isError = false
) {
  const status =
    document.getElementById(
      "mobile-tool-status"
    );

  if (!status) {
    return;
  }

  status.textContent =
    message;

  status.dataset.error =
    String(isError);
}

function setActiveTool(mode) {
  document
    .querySelectorAll(
      "[data-tool]"
    )
    .forEach((button) => {
      button.dataset.active =
        String(
          button.dataset.tool ===
          mode
        );
    });
}

function setMultiButtonState(
  active
) {
  const button =
    document.getElementById(
      "mobile-multi"
    );

  if (!button) {
    return;
  }

  button.dataset.active =
    String(active);

  button.setAttribute(
    "aria-pressed",
    String(active)
  );
}

function requireSelection(
  message
) {
  if (
    getSelectionCount() > 0
  ) {
    return true;
  }

  setToolbarStatus(
    message,
    true
  );

  return false;
}

export function initMobileToolbar() {
  const toolbar =
    document.getElementById(
      "mobile-toolbar"
    );

  if (!toolbar) {
    return;
  }

  const toolButtons =
    toolbar.querySelectorAll(
      "[data-tool]"
    );

  const scaleUpButton =
    document.getElementById(
      "mobile-scale-up"
    );

  const scaleDownButton =
    document.getElementById(
      "mobile-scale-down"
    );

  const undoButton =
    document.getElementById(
      "mobile-undo"
    );

  const multiButton =
    document.getElementById(
      "mobile-multi"
    );

  const hideButton =
    document.getElementById(
      "mobile-hide"
    );

  const showButton =
    document.getElementById(
      "mobile-show"
    );

  const duplicateButton =
    document.getElementById(
      "mobile-duplicate"
    );

  const mobileSaveButton =
    document.getElementById(
      "mobile-save"
    );

  const desktopSaveButton =
    document.getElementById(
      "save-composition"
    );

  toolButtons.forEach(
    (button) => {
      button.addEventListener(
        "click",

        () => {
          const mode =
            button.dataset.tool;

          setTransformMode(mode);
          setActiveTool(mode);

          const labels = {
            translate:
              "Move tool active",

            rotate:
              "Rotate tool active"
          };

          setToolbarStatus(
            labels[mode] ||
            "Tool selected"
          );
        }
      );
    }
  );

  scaleUpButton?.addEventListener(
    "click",

    () => {
      if (
        !requireSelection(
          "Tap an object before resizing"
        )
      ) {
        return;
      }

      scaleSelected(1.08);

      setToolbarStatus(
        "Selection enlarged"
      );
    }
  );

  scaleDownButton?.addEventListener(
    "click",

    () => {
      if (
        !requireSelection(
          "Tap an object before resizing"
        )
      ) {
        return;
      }

      scaleSelected(0.92);

      setToolbarStatus(
        "Selection reduced"
      );
    }
  );

  undoButton?.addEventListener(
    "click",

    () => {
      const undone =
        undoLastChange();

      if (!undone) {
        setToolbarStatus(
          "Nothing to undo",
          true
        );

        return;
      }

      setToolbarStatus(
        "Last change undone"
      );
    }
  );

  multiButton?.addEventListener(
    "click",

    () => {
      const active =
        toggleMultiSelectMode();

      setMultiButtonState(
        active
      );

      if (active) {
        setToolbarStatus(
          "Multi-select active — tap several objects"
        );
      } else {
        setToolbarStatus(
          "Multi-select off"
        );
      }
    }
  );

  hideButton?.addEventListener(
    "click",

    () => {
      if (
        !requireSelection(
          "Select one or more objects to hide"
        )
      ) {
        return;
      }

      const hidden =
        hideSelected();

      if (hidden) {
        setToolbarStatus(
          "Selected objects hidden"
        );
      }
    }
  );

  showButton?.addEventListener(
    "click",

    () => {
      const shown =
        showAllObjects();

      if (!shown) {
        setToolbarStatus(
          "All objects are already visible"
        );

        return;
      }

      setToolbarStatus(
        "All objects shown"
      );
    }
  );

  duplicateButton?.addEventListener(
    "click",

    () => {
      if (
        !requireSelection(
          "Tap an object before duplicating"
        )
      ) {
        return;
      }

      const duplicated =
        duplicateSelected();

      if (duplicated) {
        setToolbarStatus(
          "Selection duplicated"
        );
      }
    }
  );

  mobileSaveButton?.addEventListener(
    "click",

    () => {
      if (!desktopSaveButton) {
        setToolbarStatus(
          "Save button was not found",
          true
        );

        return;
      }

      desktopSaveButton.click();

      setToolbarStatus(
        "Saving composition..."
      );
    }
  );

  window.addEventListener(
    "exhibition-selection-change",

    (event) => {
      const count =
        event.detail?.count || 0;

      const multiActive =
        Boolean(
          event.detail
            ?.multiSelectMode
        );

      if (count === 0) {
        setToolbarStatus(
          multiActive
            ? "Multi-select active — tap objects"
            : "Tap an object to begin"
        );

        return;
      }

      if (count === 1) {
        setToolbarStatus(
          multiActive
            ? "1 object selected — tap more"
            : "Object selected"
        );

        return;
      }

      setToolbarStatus(
        `${count} objects selected`
      );
    }
  );

  window.addEventListener(
    "exhibition-transform-mode-change",

    (event) => {
      const mode =
        event.detail?.mode;

      if (
        mode === "translate" ||
        mode === "rotate"
      ) {
        setActiveTool(mode);
      }
    }
  );

  window.addEventListener(
    "exhibition-multi-select-change",

    (event) => {
      setMultiButtonState(
        Boolean(
          event.detail?.active
        )
      );
    }
  );

  setActiveTool("translate");
  setMultiButtonState(false);
}