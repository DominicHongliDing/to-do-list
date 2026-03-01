# To-Do List Web App（Next.js + Prisma + SQLite + SMTP Reminder）

一个可运行的单用户 To-Do List：支持 CRUD、搜索、筛选、按截止时间排序，并包含“即将到期/逾期”邮件提醒。

## 架构概览

- **前端**：Next.js App Router + TypeScript + Tailwind
- **后端**：Next.js API Routes（与前端同进程）
- **数据库**：SQLite + Prisma ORM
- **定时任务**：node-cron（每 5 分钟扫描）
- **邮件**：nodemailer + SMTP
- **时区处理**：Luxon（默认 `America/Los_Angeles`）

## 关键设计决策

1. **提醒去重策略**：
   - 在 `Task` 表中维护 `lastDueSoonNotifiedAt` / `lastOverdueNotifiedAt` 字段，确保每类提醒最多发送一次。
   - 同时把每次发送结果写入 `NotificationLog` 作为审计日志。
2. **时区统一策略**：
   - 输入 `due_date` 按用户时区解析后存储为 UTC。
   - 提醒内容展示为用户时区时间。
3. **MVP 单用户模式**：
   - 所有提醒发送到 `MAIL_TO_DEFAULT`（固定邮箱）。
4. **同进程 cron**：
   - 通过 `instrumentation.ts` 在 Next Node 运行时启动 cron。
   - 生产建议：将 reminder scan 拆成独立 worker 进程，避免和 Web 实例耦合。

## 项目文件树

```text
.
├── app
│   ├── api
│   │   ├── notifications/run/route.ts
│   │   └── tasks
│   │       ├── [id]/route.ts
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── prisma
│   └── schema.prisma
├── src
│   ├── components/task-app.tsx
│   └── lib
│       ├── cron.ts
│       ├── email.ts
│       ├── env.ts
│       ├── prisma.ts
│       ├── reminder-service.ts
│       ├── task-schema.ts
│       └── task-service.ts
├── tests
│   ├── reminder-service.test.ts
│   ├── task-filter.test.ts
│   └── task-schema.test.ts
├── .env.example
├── instrumentation.ts
├── package.json
└── README.md
```

## 数据库模型（Prisma）

详见 `prisma/schema.prisma`：
- `Task`: title, description, dueDate, isDone, createdAt, updatedAt, lastDueSoonNotifiedAt, lastOverdueNotifiedAt
- `NotificationLog`: taskId, type(DUE_SOON/OVERDUE), sentAt, status(SUCCESS/FAILED), errorMessage

## 迁移说明

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
```

> SQLite 文件会按 `DATABASE_URL` 生成（默认 `prisma/dev.db`）。

## 环境变量

参考 `.env.example`：
- `DATABASE_URL`
- `APP_TIMEZONE`
- `REMINDER_WINDOW_MINUTES`
- `APP_BASE_URL`
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS`
- `MAIL_FROM` / `MAIL_TO_DEFAULT`

## 启动方式

### 开发环境

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

访问：`http://localhost:3000`

### 生产环境

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start
```

## API 简述

- `GET /api/tasks?query=&filter=`：列表 + 搜索 + 筛选（默认按 dueDate 升序）
- `POST /api/tasks`：创建任务
- `PATCH /api/tasks/:id`：更新（title/description/dueDate/isDone）
- `DELETE /api/tasks/:id`：删除
- `POST /api/notifications/run`：手动触发一次提醒扫描

## 测试

包含至少 5 条测试（当前 7 条）：
- 时间解析合法/非法
- 筛选条件构建（OVERDUE / PENDING）
- 提醒分类（DUE_SOON / OVERDUE / NONE）

运行：

```bash
npm run test
```

## 后续扩展建议

1. **多用户**
   - 新增 `User` 模型与认证（NextAuth/Clerk 等）
   - `Task` 增加 `userId`，查询与提醒按用户隔离
   - 每个用户保存自己的时区与通知偏好
2. **短信提醒**
   - 抽象 Notification Channel（EMAIL/SMS/PUSH）
   - 接入 Twilio/阿里云短信等 Provider
   - 支持 channel 级重试与限流
3. **Worker 化**
   - 把 `runReminderScan` 独立为 worker（BullMQ / Agenda / Temporal）
   - Web 与 worker 分开扩缩容，提高稳定性
