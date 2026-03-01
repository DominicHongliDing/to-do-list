import { DateTime } from "luxon";
import { prisma } from "@/src/lib/prisma";
import { getEnv } from "@/src/lib/env";
import { parseDueDate, taskPayloadSchema } from "@/src/lib/task-schema";

export type TaskFilter = "ALL" | "PENDING" | "DONE" | "DUE_TODAY" | "DUE_NEXT_7_DAYS" | "OVERDUE";

export function buildTaskWhere(filter: TaskFilter, query?: string) {
  const env = getEnv();
  const now = DateTime.now().setZone(env.APP_TIMEZONE);
  const startOfDay = now.startOf("day").toUTC().toJSDate();
  const endOfDay = now.endOf("day").toUTC().toJSDate();
  const sevenDaysLater = now.plus({ days: 7 }).endOf("day").toUTC().toJSDate();

  const where: Record<string, unknown> = {};
  if (query) {
    where.title = { contains: query, mode: "insensitive" };
  }

  if (filter === "PENDING") where.isDone = false;
  if (filter === "DONE") where.isDone = true;
  if (filter === "DUE_TODAY") {
    where.isDone = false;
    where.dueDate = { gte: startOfDay, lte: endOfDay };
  }
  if (filter === "DUE_NEXT_7_DAYS") {
    where.isDone = false;
    where.dueDate = { gte: now.toUTC().toJSDate(), lte: sevenDaysLater };
  }
  if (filter === "OVERDUE") {
    where.isDone = false;
    where.dueDate = { lt: now.toUTC().toJSDate() };
  }

  return where;
}

export async function listTasks(filter: TaskFilter, query?: string) {
  return prisma.task.findMany({
    where: buildTaskWhere(filter, query),
    orderBy: { dueDate: "asc" }
  });
}

export async function createTask(payload: unknown) {
  const env = getEnv();
  const parsed = taskPayloadSchema.parse(payload);
  const dueDate = parseDueDate(parsed.dueDate, env.APP_TIMEZONE);

  return prisma.task.create({
    data: {
      title: parsed.title,
      description: parsed.description || null,
      dueDate
    }
  });
}

export async function updateTask(id: number, payload: { title?: string; description?: string; dueDate?: string; isDone?: boolean }) {
  const env = getEnv();
  const data: Record<string, unknown> = {};

  if (typeof payload.title === "string") {
    const title = payload.title.trim();
    if (!title) throw new Error("title is required");
    data.title = title;
  }
  if (typeof payload.description === "string") data.description = payload.description.trim() || null;
  if (typeof payload.isDone === "boolean") data.isDone = payload.isDone;
  if (typeof payload.dueDate === "string") data.dueDate = parseDueDate(payload.dueDate, env.APP_TIMEZONE);

  return prisma.task.update({ where: { id }, data });
}

export async function deleteTask(id: number) {
  return prisma.task.delete({ where: { id } });
}
