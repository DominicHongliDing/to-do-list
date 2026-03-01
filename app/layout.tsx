import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "To-Do List with Reminders",
  description: "Track tasks and receive due soon/overdue reminders"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
