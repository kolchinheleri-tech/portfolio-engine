import { supabase } from "./supabase.js";

export async function loadCloudComposition() {
  const { data, error } = await supabase
    .from("exhibition_state")
    .select("composition")
    .eq("id", "latest")
    .single();

  if (error) {
    /*
     * Kui rida puudub või ühendus ebaõnnestub,
     * lubame rakendusel kasutada localStorage’it
     * või master-kompositsiooni.
     */
    console.warn(
      "Cloud composition could not be loaded:",
      error
    );

    return null;
  }

  if (
    !data?.composition ||
    typeof data.composition !== "object"
  ) {
    return null;
  }

  return data.composition;
}

export async function loadCompositionVersions() {
  const { data, error } = await supabase
    .from("exhibition_versions")
    .select(
      "id, version_type, created_at"
    )
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.error(
      "Composition versions could not be loaded:",
      error
    );

    throw error;
  }

  return Array.isArray(data) ? data : [];
}

export async function loadCompositionVersion(id) {
  const { data, error } = await supabase
    .from("exhibition_versions")
    .select(
      "id, state, version_type, created_at"
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error(
      "Composition version could not be loaded:",
      error
    );

    throw error;
  }

  return data;
}

export async function restoreCloudComposition(
  composition
) {
  if (
    !composition ||
    typeof composition !== "object"
  ) {
    throw new Error(
      "A valid composition is required for restore."
    );
  }

  const restoredAt =
    new Date().toISOString();

  const {
    error: activeStateError
  } = await supabase
    .from("exhibition_state")
    .upsert(
      {
        id: "latest",
        composition,
        updated_at: restoredAt
      },
      {
        onConflict: "id"
      }
    );

  if (activeStateError) {
    console.error(
      "Active exhibition could not be restored:",
      activeStateError
    );

    throw activeStateError;
  }

  const {
    data: restoredVersion,
    error: versionError
  } = await supabase
    .from("exhibition_versions")
    .insert({
      state: composition,
      version_type: "restore"
    })
    .select(
      "id, version_type, created_at"
    )
    .single();

  if (versionError) {
    console.error(
      "Restored version could not be added to history:",
      versionError
    );

    throw versionError;
  }

  return restoredVersion;
}