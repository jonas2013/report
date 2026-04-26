# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Daily Report Management System (项目日报管理系统)

Multi-project, multi-role daily report system with strict data isolation per role.

### Roles & Data Isolation
- **Admin (系统管理员)**: Full access to all projects, users, reports, system config
- **Project Lead (项目负责人)**: Manages own projects' members, views all members' reports within those projects
- **Member (项目参与者)**: Can only fill and view own reports within assigned projects

**Rule**: Every API endpoint must enforce permissions server-side. Frontend route guards are supplementary, not authoritative.

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + React Router v6
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT (access 2h + refresh 7d, httpOnly cookie for refresh)
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Rich Text**: Tiptap (h2, h3, bold, italic, bullet/ordered list, code block, task list)
- **Package Manager**: pnpm monorepo

### Monorepo Structure
```
daily-report/
├── packages/frontend/     # React SPA
├── packages/backend/      # Express API (Prisma schema lives here)
├── pnpm-workspace.yaml
├── docker-compose.yml     # Dev environment
├── docker-compose.prod.yml
├── Makefile               # Shortcut commands
└── .env.example
```

## Common Commands

```bash
# Docker-based development (recommended)
make dev                  # Start all services (postgres + backend + frontend)
make down                 # Stop all containers
make logs                 # Follow all logs
make logs-backend         # Backend logs only
make seed                 # Run seed data
make shell-backend        # Shell into backend container
make shell-db             # psql into database

# Production
make prod                 # Start production stack
make backup               # Database backup

# If running locally without Docker (from package directories):
cd packages/backend && pnpm dev
cd packages/frontend && pnpm dev
```

## API Conventions

- Prefix: `/api/v1`
- Response: `{ success: true, data: T }` or `{ success: false, error: string, code?: string }`
- Pagination: returns `{ data, total, page, limit, totalPages }`
- Health check: `GET /health`

## Database Conventions

- All `date` fields stored as UTC 00:00:00 of that day
- Soft deletes via `isActive` / `deletedAt`, never physical delete
- DailyReport has optimistic locking via `version` field
- Prisma `select`/`omit` must exclude `password` from all User queries
- Use `$transaction` or `include` to avoid N+1 queries

## Design System: Executive Precision

Reference: `stitch/executive_precision/DESIGN.md`

- **Font**: Inter
- **Primary**: `#000000` (Slate Deep Blue navigation)
- **Secondary / Action**: `#0058be` / `#2170e4` (interactive elements, CTAs)
- **Surface**: `#f7f9fb` (background), `#ffffff` (cards with `1px solid #E2E8F0`)
- **Elevation**: Tonal layers + low-contrast outlines, NOT heavy shadows
- **Shape**: 4px corner radius standard, 8px for modals
- **Spacing**: 4px base unit, `md`=16px internal padding, `lg`=24px between modules
- **Icons**: Material Symbols Outlined
- **Status colors**: Green `#2F9E44` success, Amber `#F59E0B` warning, Red `#C92A2A` error

## UI Reference Pages

Stitch mockups in `stitch/` are the source of truth for UI layout. Each has a `screen.png` and `code.html`:

| Directory | Page |
|-----------|------|
| `admin_dashboard` | Admin dashboard with KPIs, project health, alerts, reports table |
| `submit_daily_report` | Report submission form with rich text, blockers, tomorrow plan, file upload |
| `user_project_console` | Project detail view for members |
| `project_management_lead` | Project lead management console |
| `my_reports_history` | Report history/archive with filters |

## Workflow: OpenSpec + Superpowers

This project uses two complementary systems:

### OpenSpec (What to build)
OpenSpec manages change proposals through a structured workflow. Commands are slash commands:

- `/opsx:explore` — Think through ideas, investigate problems. **Read-only, no implementation.**
- `/opsx:propose` — Create a change with all artifacts (proposal, design, tasks) in one step.
- `/opsx:apply` — Implement tasks from a change, marking them complete as you go.
- `/opsx:archive` — Archive a completed change.

OpenSpec config lives in `openspec/config.yaml`. Change artifacts go in `openspec/changes/<name>/`.

### Superpowers (How to build with quality)
Superpowers skills are invoked automatically when relevant. Key skills available:
- `simplify` — Review changed code for reuse, quality, and efficiency
- `review` — Review a pull request
- `security-review` — Security review of pending changes
- `claude-api` — For any Anthropic SDK usage
- `init` — Initialize/regenerate this CLAUDE.md

## Development Order

Follow the build sequence in the original spec:
1. Monorepo init (pnpm workspace, TS configs)
2. Docker setup (Dockerfiles, compose, Makefile)
3. Database (Prisma schema, migrate, seed)
4. Auth API (login, logout, refresh, me)
5. User management API (admin only)
6. Project API (CRUD + permissions)
7. Member management API
8. Daily report API (core — test permissions thoroughly)
9. Stats API
10. Frontend base (routing, axios, login, layout)
11. Dashboard page
12. Report writing page (Tiptap + auto-save)
13. Project detail + member management
14. Report list + filters
15. Admin pages
16. Stats charts (Recharts)
17. Integration + permission testing
18. Production Docker validation

## Seed Data (Test Accounts)

| Name | Email | Password | Role |
|------|-------|----------|------|
| 超级管理员 | admin@example.com | Admin@123 | ADMIN |
| 张三 | zhang@example.com | Test@123 | MEMBER (leads 电商+移动端) |
| 李四 | li@example.com | Test@123 | MEMBER (leads 数据中台) |
| 王五 | wang@example.com | Test@123 | MEMBER (in 电商+数据中台) |
| 赵六 | zhao@example.com | Test@123 | MEMBER (in 电商+移动端) |

## Security Requirements
- Hashids for ProjectID/ReportID in API responses to prevent ID enumeration
- sanitize-html on backend for all rich text content (strip `<script>`, `<iframe>`, etc.)
- Refresh token rotation on use
- Rate limiting on login endpoint
