import {
  setTransformMode,
  duplicateSelected,
  getSelectionCount,
  scaleSelected,
  undoLastChange
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

  status.textContent = message;

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
          button.dataset.tool === mode
        );
    });
}

function requireSelection(
  message
) {
  if (getSelectionCount() > 0) {
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

  toolButtons.forEach((button) => {
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
  });

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
        "Object enlarged"
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
        "Object reduced"
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
          "Object duplicated"
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

      if (count === 0) {
        setToolbarStatus(
          "Tap an object to begin"
        );

        return;
      }

      if (count === 1) {
        setToolbarStatus(
          "Object selected"
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

  setActiveTool(
    "translate"
  );
}