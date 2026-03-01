import { NextRequest, NextResponse } from "next/server";
import { createTask, listTasks, type TaskFilter } from "@/src/lib/task-service";

const FILTERS: TaskFilter[] = ["ALL", "PENDING", "DONE", "DUE_TODAY", "DUE_NEXT_7_DAYS", "OVERDUE"];

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query") || undefined;
  const filterInput = (request.nextUrl.searchParams.get("filter") || "ALL") as TaskFilter;
  const filter = FILTERS.includes(filterInput) ? filterInput : "ALL";
  const tasks = await listTasks(filter, query);
  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const task = await createTask(payload);
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "invalid payload" },
      { status: 400 }
    );
  }
}
