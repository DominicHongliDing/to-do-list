import { describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/env", () => ({
  getEnv: () => ({ APP_TIMEZONE: "America/Los_Angeles" })
}));

import { buildTaskWhere } from "@/src/lib/task-service";

describe("buildTaskWhere", () => {
  it("returns overdue filter with isDone false", () => {
    const where = buildTaskWhere("OVERDUE", "home") as any;
    expect(where.isDone).toBe(false);
    expect(where.title.contains).toBe("home");
    expect(where.dueDate.lt).toBeInstanceOf(Date);
  });

  it("returns pending filter only", () => {
    const where = buildTaskWhere("PENDING") as any;
    expect(where.isDone).toBe(false);
    expect(where.dueDate).toBeUndefined();
  });
});
