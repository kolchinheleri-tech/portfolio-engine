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
     * lubame rakendusel kasutada localStorage'it
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