"use client";

import { useEffect, useMemo, useState } from "react";

type Task = {
  id: number;
  title: string;
  description: string | null;
  dueDate: string;
  isDone: boolean;
  createdAt: string;
  updatedAt: string;
};

type Filter = "ALL" | "PENDING" | "DONE" | "DUE_TODAY" | "DUE_NEXT_7_DAYS" | "OVERDUE";

const filterOptions: Filter[] = ["ALL", "PENDING", "DONE", "DUE_TODAY", "DUE_NEXT_7_DAYS", "OVERDUE"];

function toLocalDateTimeInput(iso: string): string {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function TaskApp() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (query) p.set("query", query);
    if (filter) p.set("filter", filter);
    p.set("sort", "due_date_asc");
    return p.toString();
  }, [query, filter]);

  async function loadTasks() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/tasks?${params}`);
      if (!res.ok) throw new Error("加载任务失败");
      const data = (await res.json()) as { tasks: Task[] };
      setTasks(data.tasks);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTasks();
  }, [params]);

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, dueDate })
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "创建失败");
      return;
    }
    setTitle("");
    setDescription("");
    setDueDate("");
    await loadTasks();
  }

  async function toggleDone(task: Task) {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDone: !task.isDone })
    });
    await loadTasks();
  }

  async function removeTask(id: number) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    await loadTasks();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={createTask} className="grid gap-3 rounded border bg-white p-4 shadow-sm">
        <h2 className="font-semibold">新建任务</h2>
        <input
          className="rounded border px-3 py-2"
          placeholder="标题（必填）"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="rounded border px-3 py-2"
          placeholder="描述（可选）"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="datetime-local"
          className="rounded border px-3 py-2"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
        />
        <button className="w-fit rounded bg-blue-600 px-4 py-2 text-white" type="submit">
          创建
        </button>
      </form>

      <div className="flex flex-wrap gap-3 rounded border bg-white p-4 shadow-sm">
        <input
          className="rounded border px-3 py-2"
          placeholder="按标题搜索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="rounded border px-3 py-2" value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
          {filterOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {error ? <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</div> : null}
      {loading ? <p>加载中...</p> : null}

      <ul className="space-y-3">
        {tasks.map((task) => (
          <li key={task.id} className="rounded border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className={`font-semibold ${task.isDone ? "line-through text-slate-400" : ""}`}>{task.title}</h3>
                {task.description ? <p className="mt-1 text-sm text-slate-600">{task.description}</p> : null}
                <p className="mt-2 text-xs text-slate-500">截止：{toLocalDateTimeInput(task.dueDate).replace("T", " ")}</p>
              </div>
              <div className="flex gap-2">
                <button className="rounded border px-3 py-1 text-sm" onClick={() => toggleDone(task)}>
                  {task.isDone ? "标记未完成" : "标记完成"}
                </button>
                <button className="rounded border border-red-300 px-3 py-1 text-sm text-red-600" onClick={() => removeTask(task.id)}>
                  删除
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
