import { NotificationType } from "@prisma/client";
import { DateTime } from "luxon";
import { prisma } from "@/src/lib/prisma";
import { getEnv } from "@/src/lib/env";
import { getTransporter } from "@/src/lib/email";

function buildTaskUrl(taskId: number) {
  const env = getEnv();
  return `${env.APP_BASE_URL}/?taskId=${taskId}`;
}

function makeEmailContent(taskTitle: string, dueDate: Date, type: NotificationType) {
  const env = getEnv();
  const now = DateTime.now().setZone(env.APP_TIMEZONE);
  const due = DateTime.fromJSDate(dueDate, { zone: "utc" }).setZone(env.APP_TIMEZONE);
  const minutesDiff = Math.round(due.diff(now, "minutes").minutes);

  if (type === "DUE_SOON") {
    return {
      subject: `任务即将到期：${taskTitle}`,
      text: `任务「${taskTitle}」将在 ${Math.max(minutesDiff, 0)} 分钟后到期（${due.toFormat("yyyy-LL-dd HH:mm")})。`
    };
  }

  return {
    subject: `任务已逾期：${taskTitle}`,
    text: `任务「${taskTitle}」已逾期 ${Math.abs(minutesDiff)} 分钟（截止时间 ${due.toFormat("yyyy-LL-dd HH:mm")})。`
  };
}

async function sendAndLog(taskId: number, type: NotificationType) {
  const env = getEnv();
  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
  const { subject, text } = makeEmailContent(task.title, task.dueDate, type);
  const transporter = getTransporter();

  try {
    await transporter.sendMail({
      from: env.MAIL_FROM,
      to: env.MAIL_TO_DEFAULT,
      subject,
      text: `${text}\n\n详情链接：${buildTaskUrl(task.id)}`
    });

    await prisma.notificationLog.create({
      data: { taskId, type, status: "SUCCESS" }
    });

    await prisma.task.update({
      where: { id: taskId },
      data:
        type === "DUE_SOON"
          ? { lastDueSoonNotifiedAt: new Date() }
          : { lastOverdueNotifiedAt: new Date() }
    });

    console.log(`[reminder] ${type} sent for task #${taskId}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await prisma.notificationLog.create({
      data: { taskId, type, status: "FAILED", errorMessage: message.slice(0, 2000) }
    });
    console.error(`[reminder] ${type} failed for task #${taskId}: ${message}`);
  }
}

export function classifyTaskForReminder(dueDate: Date, now: Date, windowMinutes: number) {
  const due = DateTime.fromJSDate(dueDate);
  const ref = DateTime.fromJSDate(now);
  const diff = due.diff(ref, "minutes").minutes;

  if (diff < 0) return "OVERDUE";
  if (diff <= windowMinutes) return "DUE_SOON";
  return "NONE";
}

export async function runReminderScan(now = new Date()) {
  const env = getEnv();
  const windowMinutes = env.REMINDER_WINDOW_MINUTES;

  const tasks = await prisma.task.findMany({
    where: { isDone: false },
    select: { id: true, dueDate: true, lastDueSoonNotifiedAt: true, lastOverdueNotifiedAt: true }
  });

  for (const task of tasks) {
    const category = classifyTaskForReminder(task.dueDate, now, windowMinutes);
    if (category === "DUE_SOON" && !task.lastDueSoonNotifiedAt) {
      await sendAndLog(task.id, "DUE_SOON");
    }
    if (category === "OVERDUE" && !task.lastOverdueNotifiedAt) {
      await sendAndLog(task.id, "OVERDUE");
    }
  }
}
