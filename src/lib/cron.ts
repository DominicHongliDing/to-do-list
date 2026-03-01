import cron from "node-cron";
import { runReminderScan } from "@/src/lib/reminder-service";

let started = false;

export function startReminderCron() {
  if (started) return;

  cron.schedule("*/5 * * * *", async () => {
    await runReminderScan();
  });

  started = true;
  console.log("[cron] reminder scan scheduled every 5 minutes");
}
