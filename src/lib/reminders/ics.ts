import { mediaHref } from "@/lib/media/labels";
import { reminderDetail, type Reminder } from "./reminders";

const escape = (text: string) => text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");

/** Folds lines longer than 75 bytes, as the iCalendar spec requires. */
function fold(line: string) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let size = 0;
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length;
    if (size + n > (parts.length ? 74 : 75)) {
      parts.push(current);
      current = "";
      size = 0;
    }
    current += ch;
    size += n;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

const compact = (iso: string) => iso.replace(/-/g, "");
const nextDay = (iso: string) => new Date(Date.parse(`${iso}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

function summary(r: Reminder) {
  if (r.kind === "release") {
    const verb = r.media.type === "movie" ? "in theaters" : "comes out";
    return `${r.media.title} ${verb}`;
  }
  if (r.kind === "premiere") return `${r.media.title}: ${reminderDetail(r)}`;
  return `${r.media.title} S${r.season} E${r.episode}`;
}

/** A subscribable calendar of release days and episode air dates, each with a 9am alert. */
export function remindersCalendar(reminders: Reminder[], origin: string, now = Date.now()) {
  const stamp = new Date(now).toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Shelf//Reminders//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Shelf",
    "X-WR-CALDESC:Release days and new episodes from your Shelf",
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
  ];
  for (const r of reminders) {
    const url = `${origin}${mediaHref(r.media.type, r.media.externalId)}`;
    const title = summary(r);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${r.key.replace(/[^\w:.-]/g, "")}@shelf`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(r.date)}`,
      `DTEND;VALUE=DATE:${compact(nextDay(r.date))}`,
      `SUMMARY:${escape(title)}`,
      `DESCRIPTION:${escape(`${reminderDetail(r)}\n${url}`)}`,
      `URL:${url}`,
      "TRANSP:TRANSPARENT",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escape(title)}`,
      // All-day events start at midnight, so this fires at 9am on the day.
      "TRIGGER:PT9H",
      "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
