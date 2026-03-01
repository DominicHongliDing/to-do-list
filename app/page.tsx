import { TaskApp } from "@/src/components/task-app";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-3xl font-bold">To-Do List</h1>
      <p className="mb-6 text-sm text-slate-600">支持 CRUD、搜索筛选、截止日期提醒（邮件）。</p>
      <TaskApp />
    </main>
  );
}
