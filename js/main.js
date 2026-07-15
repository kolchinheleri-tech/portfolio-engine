import {
  loadModels
} from "./loader.js";

import {
  startViewer,
  frameObjects,
  orbit
} from "./viewer.js";

import "./transform.js";

import {
  initSaveButton
} from "./save.js";

import {
  initVersionHistory
} from "./version-history.js";

function isAdminMode() {
  const parameters =
    new URLSearchParams(
      window.location.search
    );

  return parameters.get("admin") === "1";
}

function configureAdminInterface() {
  const adminMode =
    isAdminMode();

  const historyButton =
    document.getElementById(
      "toggle-version-history"
    );

  const historyPanel =
    document.getElementById(
      "version-history-panel"
    );

  if (!adminMode) {
    if (historyButton) {
      historyButton.hidden = true;
    }

    if (historyPanel) {
      historyPanel.hidden = true;
      historyPanel.dataset.open = "false";

      historyPanel.setAttribute(
        "aria-hidden",
        "true"
      );
    }

    console.log(
      "Exhibition opened in visitor mode."
    );

    return;
  }

  if (historyButton) {
    historyButton.hidden = false;
  }

  if (historyPanel) {
    historyPanel.hidden = false;
  }

  initVersionHistory();

  console.log(
    "Exhibition opened in admin mode."
  );
}

startViewer();

loadModels(() => {
  /*
   * Kadreerime kõik objektid automaatselt.
   *
   * Salvestatud kompositsiooni kaamera asendit
   * ei kasutata, sest see võib olla liiga paremal,
   * liiga lähedal või liiga kaugel.
   */
  frameObjects();
  orbit.update();

  const loading =
    document.getElementById(
      "loading"
    );

  if (loading) {
    loading.style.display = "none";
  }
});

initSaveButton();
configureAdminInterface();