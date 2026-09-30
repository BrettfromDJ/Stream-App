"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient, getUser } from "@/lib/supabase/server";

/** Saves the user's streaming services (TMDB provider IDs) to their auth profile. */
export async function saveServices(ids: number[]): Promise<{ ok: boolean; message?: string }> {
  if (!isSupabaseConfigured) return { ok: false, message: "This is a preview. Connect Supabase to save settings." };
  const user = await getUser();
  if (!user) return { ok: false, message: "Your session expired. Please sign in again." };
  const clean = [...new Set(ids.filter((n) => Number.isInteger(n) && n > 0))].slice(0, 30);

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ data: { services: clean } });
  if (error) return { ok: false, message: "Couldn't save your services. Try again." };
  // Mint a fresh token so the new services are visible to the very next request.
  await supabase.auth.refreshSession();
  revalidatePath("/", "layout");
  return { ok: true };
}
