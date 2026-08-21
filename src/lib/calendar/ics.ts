function escapeIcs(value: string) { return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;"); }
function utc(value: Date) { return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z"); }
export function interviewIcs(input: { id: string; title: string; description: string; start: Date; durationMinutes?: number; location?: string; url?: string }) {
  const end = new Date(input.start.getTime() + (input.durationMinutes ?? 45) * 60_000);
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//DrishtiRecruit//Interview Calendar//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT", `UID:${escapeIcs(input.id)}@tracehire`, `DTSTAMP:${utc(new Date())}`, `DTSTART:${utc(input.start)}`, `DTEND:${utc(end)}`, `SUMMARY:${escapeIcs(input.title)}`, `DESCRIPTION:${escapeIcs(input.description)}`];
  if (input.location) lines.push(`LOCATION:${escapeIcs(input.location)}`);
  if (input.url) lines.push(`URL:${input.url}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
