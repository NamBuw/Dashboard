<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# PTalk Dashboard — Architecture & Conventions

## Tech Stack
- **Framework:** Next.js 16.2.6 (Turbopack), React 19, Tailwind CSS 4
- **Auth:** NextAuth v5 (beta 31) with Authentik OIDC (single sign-on)
- **DB:** PostgreSQL (`ptalk_auth` via `pg` driver, raw SQL — no ORM)
- **Language:** TypeScript, UI text in Vietnamese

## Database
- **Host:** `cts-dashboard-db` container, port `5434` (exposed), DB `ptalk_auth`
- **Connection:** `src/lib/db.ts` — `pg.Pool` with env vars `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- **Key tables:** `users`, `devices`, `products`, `conversation_logs`, `password_reset_tokens`, `roles`, `permissions`

## Chat History Integration (CloudPTalk ↔ Dashboard)
- `conversation_logs` table is the bridge between CloudPTalk real-time pipeline and Dashboard
- **Source column:** `source` VARCHAR(32) — values: `'kids'` or `'eldercare'`
- CloudPTalk LLM worker persists via `workers/db_persist.py` (asyncpg)
- Dashboard API: `GET /api/chat?userId=X&source=Y` — RBAC enforced
- Dashboard UI: `/chats` page with source filter dropdown

## RBAC Rules
- **SuperAdmin (`is_superuser=true`):** Full access to all users, devices, chats, settings
- **Non-admin:** Can only view own data + data of users assigned to their devices (`devices.owner_id` / `devices.assigned_user_id`)
- `/users` and `/settings` pages: admin-only (middleware blocks non-superusers)
- Basic-tier non-superusers: blocked from dashboard features → `/unauthorized`

## Pages
| Route | Access | Purpose |
|-------|--------|---------|
| `/dashboard` | Login required | Stats overview |
| `/chats` | Login required | Chat history with sentiment + source filter |
| `/devices` | Login required | Device management |
| `/users` | SuperUser only | User CRUD |
| `/settings` | SuperUser only | Alert config + health check |
| `/products/ptalk` | Login required | PTalk product page |
| `/products/kidmentor` | Login required | Kid Mentor (mock data) |
| `/products/eldercare` | Login required | Elder Care (mock data) |

## API Routes
| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth handler (Authentik OIDC) |
| `/api/auth/signup` | POST | User registration (Authentik + Dashboard DB) |
| `/api/auth/forgot-password` | POST | Password reset token generation |
| `/api/auth/reset-password` | POST | Token-based reset (syncs to Authentik) |
| `/api/stats` | GET | Dashboard statistics |
| `/api/users` | GET, POST, PUT, DELETE | User CRUD |
| `/api/devices` | GET, POST, PUT | Device management |
| `/api/chat` | GET, POST | Chat log CRUD with RBAC + source filter |

## Docker
- `docker-compose.yml`: single service `dashboard-frontend`, port `4321→3000`
- Multi-stage build: `node:20-alpine`, installs `python3` + `py3-bcrypt` for password reset
- Production: `dashboard.ctslab.net`

## Environment Variables (.env)
```
AUTH_SECRET=...
AUTH_URL=https://dashboard.ctslab.net
AUTH_TRUST_HOST=true
AUTHENTIK_ISSUER=https://auth.ctslab.net/application/o/dashboard/
AUTHENTIK_CLIENT_ID=dashboard-client
AUTHENTIK_CLIENT_SECRET=dashboard-secret-key
AUTHENTIK_API_TOKEN=...
AUTHENTIK_URL=https://auth.ctslab.net
NEXT_PUBLIC_API_URL=...
DB_HOST=192.168.1.1
DB_PORT=5434
DB_NAME=ptalk_auth
DB_USER=postgres
DB_PASSWORD=SecurePassword2024
```

## Common Pitfalls
- Always null-check user fields (`username`, `email`, `displayName`) before `.toLowerCase()` — some users have null values
- The `devices` table must have entries for CloudPTalk persistence to work (`resolve_user_id` queries by `device_hw_id` or `mac_address`)
- `source` column in `conversation_logs` defaults to `'kids'` — eldercare pipeline passes `source='eldercare'` explicitly
