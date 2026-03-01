import nodemailer from "nodemailer";
import { getEnv } from "@/src/lib/env";

let transporter: nodemailer.Transporter | null = null;

export function getTransporter() {
  if (transporter) return transporter;
  const env = getEnv();

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });

  return transporter;
}
