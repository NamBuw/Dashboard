# Settings — "Người dùng & Bé" viewer

**Date:** 2026-06-07
**Status:** Approved (user said "ok làm đi")

## Goal
Add a read-only section to the Settings page that reads the DB and shows user info
and the linked children (bé) profiles. Role-aware.

## Behavior (role-aware)
- **Super Admin:** search box + list of ALL users (reuses `GET /api/users`). Each user
  row expands to load and show that user's children (bé) + the user's account info.
- **Parent (non-admin):** shows only their own account info + their own children.
  No access to other users.
- Read-only. No create/edit/delete, no export, no schema changes.

## Components
1. **API (new, both trees):** `GET /api/users/[id]/children`
   - Auth: `auth()` (web session). RBAC: `is_superuser` OR `id === session.user.id`, else 403.
   - Returns `{ user, children }`.
     - `user`: id, username, email, display_name, user_type, subscription_tier,
       is_active, is_superuser, created_at, full_name, phone_number.
     - `children[]`: via `user_relationships r JOIN users u ON u.id=r.child_id WHERE r.parent_id=$1`,
       mapped by `childRowToJson` → {id, username, fullName, grade, dateOfBirth, hometown,
       curriculum, relationship}.
   - Self-contained so it works in both trees (deploy lacks `/api/users/[id]`).
2. **Component (new, both trees):** `components/settings/UsersChildrenPanel.tsx` (client)
   - `useSession()` → isSuperUser + own id.
   - Super: fetch `/api/users?search=&limit=50`; expandable rows fetch `/api/users/[id]/children`.
   - Non-super: fetch `/api/users/[ownId]/children`.
   - Bento/Tailwind theme-safe styles (bg-card, text-foreground/muted), responsive.
   - Maps curriculum + relationship codes → Vietnamese labels; shows child age from DOB.
3. **Wire-in:** render `<UsersChildrenPanel />` as a new full-width section in
   `settings/page.tsx` (both trees; settings pages differ, component is the same).

## Reused (no change)
- `GET /api/users` (list, RBAC, search, pagination) — present in both trees.
- `lib/children.ts` `ChildRow` + `childRowToJson` — present in both trees.

## Deploy
Build in `Dashboard/` (source) and `Dashboard-deploy/`, then rebuild the deploy
container (`docker compose up -d --build`).
