"use server";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient, getUser } from "@/lib/supabase/server";

export type CalendarLinkResult = { ok: true; token: string } | { ok: false; message: string };

/** The signed-in user's secret calendar feed token, created on first use. `reset` swaps in a new one. */
export async function calendarLink(reset = false): Promise<CalendarLinkResult> {
  if (!isSupabaseConfigured) return { ok: false, message: "This is a preview. Connect Supabase to get a calendar link." };
  const user = await getUser();
  if (!user) return { ok: false, message: "Your session expired. Please sign in again." };
  const supabase = await createClient();

  if (!reset) {
    const { data, error } = await supabase.from("calendar_feeds").select("token").eq("user_id", user.id).maybeSingle();
    if (error) {
      console.error("[calendarLink]", error.message);
      return { ok: false, message: "Calendar links aren't set up yet. Run the calendar step from the README in Supabase." };
    }
    if (data?.token) return { ok: true, token: data.token as string };
  }

  const { data, error } = await supabase
    .from("calendar_feeds")
    .upsert({ user_id: user.id, token: crypto.randomUUID() }, { onConflict: "user_id" })
    .select("token")
    .single();
  if (error || !data) {
    console.error("[calendarLink]", error?.message);
    return { ok: false, message: "Couldn't create your calendar link. Try again." };
  }
  return { ok: true, token: data.token as string };
}
