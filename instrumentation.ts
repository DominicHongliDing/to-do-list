import { startReminderCron } from "@/src/lib/cron";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    startReminderCron();
  }
}
