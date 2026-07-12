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