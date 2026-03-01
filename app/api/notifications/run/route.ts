import { NextResponse } from "next/server";
import { runReminderScan } from "@/src/lib/reminder-service";

export async function POST() {
  await runReminderScan();
  return NextResponse.json({ ok: true });
}
