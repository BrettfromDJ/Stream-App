import { isSupabaseConfigured } from "@/lib/env";
import { fromRow, type LibraryRow } from "@/lib/library/mappers";
import { remindersCalendar } from "@/lib/reminders/ics";
import { getReminders } from "@/lib/reminders/reminders";
import { createClient } from "@/lib/supabase/server";

/** Private calendar feed (subscribed to from Apple/Google Calendar). The token in the URL is the key. */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token: raw } = await params;
  const token = raw.replace(/\.ics$/i, "");
  if (!isSupabaseConfigured || !/^[0-9a-f-]{36}$/i.test(token)) return new Response("Not found", { status: 404 });

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("calendar_feed", { feed_token: token });
  if (error) {
    console.error("[calendar]", error.message);
    return new Response("Calendar unavailable", { status: 503 });
  }
  const rows = (data ?? []) as LibraryRow[];
  // An unknown token looks the same as an empty library, so links can't be probed.
  const { recent, upcoming } = await getReminders(rows.map(fromRow), { allEpisodes: true });
  const body = remindersCalendar([...recent, ...upcoming], new URL(request.url).origin);

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="shelf.ics"',
      "Cache-Control": "private, max-age=900",
    },
  });
}
