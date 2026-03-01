import { describe, expect, it } from "vitest";
import { parseDueDate } from "@/src/lib/task-schema";

describe("parseDueDate", () => {
  it("parses valid ISO local datetime with timezone", () => {
    const date = parseDueDate("2026-01-01T10:30", "America/Los_Angeles");
    expect(date.toISOString()).toBe("2026-01-01T18:30:00.000Z");
  });

  it("throws on invalid date", () => {
    expect(() => parseDueDate("bad-date", "America/Los_Angeles")).toThrow("due_date is invalid");
  });
});
