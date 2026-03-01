import { DateTime } from "luxon";
import { z } from "zod";

export const taskPayloadSchema = z.object({
  title: z.string().trim().min(1, "title is required"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  dueDate: z.string().min(1)
});

export function parseDueDate(value: string, timezone: string): Date {
  const dt = DateTime.fromISO(value, { zone: timezone });
  if (!dt.isValid) {
    throw new Error("due_date is invalid");
  }
  return dt.toUTC().toJSDate();
}
