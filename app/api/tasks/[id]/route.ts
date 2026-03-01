import { NextRequest, NextResponse } from "next/server";
import { deleteTask, updateTask } from "@/src/lib/task-service";

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  try {
    const payload = await request.json();
    const task = await updateTask(id, payload);
    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "update failed" }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  await deleteTask(id);
  return NextResponse.json({ ok: true });
}
