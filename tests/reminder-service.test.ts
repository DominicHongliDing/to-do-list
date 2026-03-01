import { describe, expect, it } from "vitest";
import { classifyTaskForReminder } from "@/src/lib/reminder-service";

describe("classifyTaskForReminder", () => {
  it("classifies due soon inside window", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const due = new Date("2026-01-01T00:45:00.000Z");
    expect(classifyTaskForReminder(due, now, 60)).toBe("DUE_SOON");
  });

  it("classifies overdue", () => {
    const now = new Date("2026-01-01T01:00:00.000Z");
    const due = new Date("2026-01-01T00:45:00.000Z");
    expect(classifyTaskForReminder(due, now, 60)).toBe("OVERDUE");
  });

  it("classifies none when outside window", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const due = new Date("2026-01-01T03:00:00.000Z");
    expect(classifyTaskForReminder(due, now, 60)).toBe("NONE");
  });
});
