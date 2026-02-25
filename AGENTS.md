# AGENTS.md

## Cursor Cloud specific instructions

### Architecture
Single Next.js 14 app (not a monorepo). Frontend + API routes in one codebase, backed by Supabase (PostgreSQL + Auth). See `README.md` for full architecture details.

### Prerequisites
- Node.js 18+ (repo uses `package-lock.json`, so use `npm`)
- `.env.local` must exist with at least `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Copy from `.env.example`.

### Dev commands
| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (port 3000) |
| Lint | `npm run lint` |
| Build | `npm run build` |

### Non-obvious notes
- The repo did not ship with `.eslintrc.json`. One was added extending `next/core-web-vitals` with `react/no-unescaped-entities` downgraded to `"warn"` because the codebase has many unescaped apostrophes. Without this config, `npm run lint` and `npm run build` will prompt interactively or fail respectively.
- There are no automated tests in this codebase (no `__tests__/`, no `*.test.*`, no `*.spec.*`).
- The landing page (`/`), login (`/login`), and signup (`/signup`) render without a real Supabase connection. Dashboard and protected routes require valid Supabase credentials.
- Middleware (`src/middleware.ts`) calls `supabase.auth.getUser()` on every request. With placeholder env vars this silently fails and treats the user as unauthenticated, which is fine for public pages.
- `eslint-config-next` is pinned to `15.1.0` while Next.js is `14.2.35` — a version mismatch that exists in the repo but doesn't cause issues.
