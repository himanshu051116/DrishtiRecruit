import { describe, expect, it } from "vitest";
import { interviewIcs } from "../src/lib/calendar/ics";

describe("interviewIcs", () => {
  it("creates a portable calendar event", () => {
    const output = interviewIcs({ id: "int-1", title: "Backend Interview", description: "Structured interview", start: new Date("2026-08-14T10:00:00Z"), url: "https://meet.example/test" });
    expect(output).toContain("BEGIN:VCALENDAR");
    expect(output).toContain("DTSTART:20260814T100000Z");
    expect(output).toContain("SUMMARY:Backend Interview");
    expect(output).toContain("END:VCALENDAR");
  });
});
