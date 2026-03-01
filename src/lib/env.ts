import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  APP_TIMEZONE: z.string().default("America/Los_Angeles"),
  REMINDER_WINDOW_MINUTES: z.coerce.number().int().positive().default(60),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  MAIL_FROM: z.string().email(),
  MAIL_TO_DEFAULT: z.string().email(),
  APP_BASE_URL: z.string().url().default("http://localhost:3000")
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) return cachedEnv;
  cachedEnv = envSchema.parse(process.env);
  return cachedEnv;
}
