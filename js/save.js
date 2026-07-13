import { objects } from "./loader.js";
import { camera } from "./scene.js";
import { orbit } from "./viewer.js";
import {
  saveComposition as saveLocalComposition,
  serializeComposition
} from "./storage.js";
import { supabase } from "./supabase.js";

function showSaveMessage(message, isError = false) {
  const element = document.getElementById("save-status");

  if (!element) return;

  element.textContent = message;
  element.dataset.error = String(isError);

  window.clearTimeout(showSaveMessage.timeout);

  showSaveMessage.timeout = window.setTimeout(() => {
    element.textContent = "";
  }, 3000);
}

async function saveCompositionToCloud(composition) {
  const { error } = await supabase
    .from("exhibition_state")
    .upsert(
      {
        id: "latest",
        composition,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: "id"
      }
    );

  if (error) {
    throw error;
  }
}

async function saveCompositionVersion(composition) {
  const { error } = await supabase
    .from("exhibition_versions")
    .insert({
      state: composition,
      version_type: "visitor_save"
    });

  if (error) {
    throw error;
  }
}

export async function saveInitialComposition(composition) {
  const { error } = await supabase
    .from("exhibition_versions")
    .insert({
      state: composition,
      version_type: "initial"
    });

  if (error) {
    throw error;
  }
}

export function initSaveButton() {
  const button = document.getElementById(
    "save-composition"
  );

  if (!button) {
    console.warn(
      "Save Composition button was not found."
    );
    return;
  }

  button.addEventListener("click", async () => {
    button.disabled = true;
    showSaveMessage("Saving composition…");

    try {
      const composition = serializeComposition(
        objects,
        camera,
        orbit
      );

      // Kohalik varukoopia
      saveLocalComposition(
        objects,
        camera,
        orbit
      );

      // Praegune aktiivne kompositsioon
      await saveCompositionToCloud(composition);

      // Uus ajaloo versioon
      await saveCompositionVersion(composition);

      console.log(
        "Full exhibition composition saved:",
        composition
      );

      showSaveMessage(
        "Composition saved to cloud"
      );
    } catch (error) {
      console.error(
        "Composition save failed:",
        error
      );

      showSaveMessage(
        "Save failed — check Console",
        true
      );
    } finally {
      button.disabled = false;
    }
  });
}