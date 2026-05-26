# Naming Conventions, JWT Payload & Cross-Team Contract

> **Version:** 2.0 | **Date:** 2026-05-26
> **Scope:** Tài liệu đồng bộ giữa 3 task — FE Dashboard (Trung), Authentik (Tuấn Anh), Business DB (Nam)

---

## 1. Git Branch Naming

| Pattern | Use case | Example |
|---------|----------|---------|
| `feature/<module>-<description>` | New feature | `feature/dashboard-fe-setup` |
| `fix/<module>-<description>` | Bug fix | `fix/auth-token-refresh` |
| `docs/<description>` | Documentation | `docs/naming-conventions` |
| `refactor/<description>` | Refactoring | `refactor/user-list-query` |

## 2. File & Folder Naming (FE — Dashboard)

| Type | Convention | Example |
|------|-----------|---------|
| Folders | `kebab-case` | `user-management/`, `auth/` |
| React Components | `PascalCase.tsx` | `UserTable.tsx`, `Sidebar.tsx` |
| Pages (App Router) | `page.tsx`, `layout.tsx` | `app/dashboard/page.tsx` |
| Utilities / Hooks | `camelCase.ts` | `useAuth.ts`, `formatDate.ts` |
| Types / Interfaces | `camelCase.ts` (file), `PascalCase` (type) | `types/user.ts` -> `type User` |
| Constants | `camelCase.ts` (file), `UPPER_SNAKE_CASE` (value) | `constants.ts` -> `API_BASE_URL` |
| API routes | `kebab-case` | `app/api/auth/callback/route.ts` |

## 3. Code Naming (FE)

| Type | Convention | Example |
|------|-----------|---------|
| Variables | `camelCase` | `userName`, `isActive` |
| Functions | `camelCase` | `getUser()`, `handleSubmit()` |
| React Components | `PascalCase` | `UserTable`, `DashboardLayout` |
| Hooks | `useCamelCase` | `useAuth()`, `useUsers()` |
| Interfaces / Types | `PascalCase` | `User`, `DashboardStats` |
| Enums | `PascalCase` (name), `PascalCase` (value) | `enum UserRole { SuperAdmin }` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_PAGE_SIZE`, `API_TIMEOUT` |
| Environment vars | `UPPER_SNAKE_CASE` with prefix | `NEXT_PUBLIC_API_URL`, `AUTHENTIK_CLIENT_ID` |

---

## 4. Authentik Naming Convention (Tuấn Anh)

### 4.1 Groups

Tất cả group name dùng **PascalCase**, không dấu, không khoảng trắng.

**End User Groups:**

| Group Name | Mô tả | Blueprint ID |
|------------|--------|--------------|
| `AccountOwner` | Người mua/quản lý robot PTalk | `group-account-owner` |
| `Child` | Trẻ em (robot user + Kid Mentor) | `group-child` |
| `Elder` | Người cao tuổi (robot user + Elder Kare) | `group-elder` |

**Dashboard/Ops Groups (= Dashboard Roles):**

| Group Name | Mô tả | Blueprint ID |
|------------|--------|--------------|
| `SuperAdmin` | Toàn quyền hệ thống | `role-super-admin` |
| `ProductAdmin` | Quản lý theo sản phẩm được gán | `role-product-admin` |
| `Support` | Xem & chỉnh sửa user, xử lý hỗ trợ | `role-support` |
| `Viewer` | Chỉ xem dashboard & báo cáo | `role-viewer` |

> **Quy tắc:** Một user có thể thuộc nhiều group. FE lấy role cao nhất theo thứ tự: SuperAdmin > ProductAdmin > Support > Viewer.

### 4.2 OIDC Providers & Applications

| App | Provider Name | App Slug | Client ID | Redirect URIs (dev) |
|-----|--------------|----------|-----------|---------------------|
| Dashboard | `Provider Dashboard` | `dashboard` | `dashboard-client` | `http://localhost:3000/api/auth/callback/authentik` |
| Kid Mentor | `Provider Kid Mentor` | `kid-mentor` | `kid-mentor-client` | `http://localhost:3001/api/auth/callback/authentik`, `app://kidmentor/callback` |
| PTalk Assistant | `Provider P Assistant` | `p-assistant` | `p-assistant-client` | `http://localhost:3002/api/auth/callback/authentik`, `app://passistant/callback` |

**Issuer URL pattern:** `http://localhost:9000/application/o/<app-slug>/`

### 4.3 Scopes (mỗi Provider đều cần)

| Scope | Source | Claim trả về |
|-------|--------|--------------|
| `openid` | Built-in | `sub`, `iss`, `aud`, `exp`, `iat` |
| `email` | Built-in | `email`, `email_verified` |
| `profile` | Built-in | `name`, `preferred_username` |
| `roles` | Custom (Property Mapping) | `roles: string[]` — danh sách group names |
| `user_type` | Custom (Property Mapping) | `user_type: string` — loại user |
| `assigned_products` | Custom (Property Mapping) | `assigned_products: string[]` — sản phẩm enrolled |

### 4.4 Property Mappings (Tuấn Anh cần tạo)

**① roles** (đã có trong blueprint):
```python
# Scope name: roles
return {
    "roles": [group.name for group in request.user.ak_groups.all()]
}
```

**② user_type** (cần tạo thêm):
```python
# Scope name: user_type
return {
    "user_type": request.user.attributes.get("user_type", "dashboard")
}
```

**③ assigned_products** (cần tạo thêm):
```python
# Scope name: assigned_products
return {
    "assigned_products": request.user.attributes.get("assigned_products", [])
}
```

> **Lưu ý:** `user_type` và `assigned_products` được lưu trong `attributes` của Authentik user. Khi tạo user trên Authentik, set attributes:
> ```json
> {
>   "user_type": "child",
>   "assigned_products": ["ptalk-assistant", "kid-mentor"]
> }
> ```

### 4.5 Authentik User ID (`sub` claim)

Authentik sử dụng **UUID v4** cho user ID, đây chính là giá trị `sub` trong JWT.

```
Ví dụ: sub = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

> **QUAN TRỌNG cho cả 3 task:** Giá trị `sub` (UUID) từ Authentik là **Unified User ID** — dùng chung xuyên suốt FE, Business DB, và tất cả app. Không tạo ID riêng.

---

## 5. Database Schema Contract (Nam)

### 5.1 Nguyên tắc phân tách

| Dữ liệu | Lưu ở đâu | Lý do |
|----------|-----------|-------|
| Identity (email, password, MFA, groups) | **Authentik** | Authentik quản lý xác thực |
| Business profile (tên hiển thị, SĐT, ngày sinh, địa chỉ) | **Business DB (Postgres)** | Dữ liệu nghiệp vụ |
| Product enrollment, device assignment | **Business DB** | Quan hệ nghiệp vụ |
| Session, token, refresh token | **Authentik + Redis** | Authentik quản lý phiên |

### 5.2 Bảng `user_profiles` — cầu nối Authentik ↔ Business DB

```sql
-- Bảng trung tâm: mỗi row = 1 user Authentik
CREATE TABLE user_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    authentik_id    UUID NOT NULL UNIQUE,  -- = sub claim từ JWT, FK tới Authentik
    display_name    VARCHAR(255),
    phone           VARCHAR(20),
    date_of_birth   DATE,
    avatar_url      TEXT,
    user_type       VARCHAR(20) NOT NULL DEFAULT 'dashboard',
        -- CHECK (user_type IN ('child', 'elder', 'owner', 'dashboard'))
    status          VARCHAR(20) NOT NULL DEFAULT 'active',
        -- CHECK (status IN ('active', 'inactive', 'suspended'))
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_user_profiles_authentik_id ON user_profiles(authentik_id);
```

### 5.3 Drizzle ORM Schema tương ứng

```typescript
// schema/userProfiles.ts
import { pgTable, uuid, varchar, date, text, timestamp } from "drizzle-orm/pg-core";

export const userProfiles = pgTable("user_profiles", {
  id:           uuid("id").primaryKey().defaultRandom(),
  authentikId:  uuid("authentik_id").notNull().unique(),
  displayName:  varchar("display_name", { length: 255 }),
  phone:        varchar("phone", { length: 20 }),
  dateOfBirth:  date("date_of_birth"),
  avatarUrl:    text("avatar_url"),
  userType:     varchar("user_type", { length: 20 }).notNull().default("dashboard"),
  status:       varchar("status", { length: 20 }).notNull().default("active"),
  createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

### 5.4 Các bảng nghiệp vụ liên quan (gợi ý)

```
user_profiles
├── user_enrollments        (user enrolled vào sản phẩm nào)
│   ├── id, user_profile_id (FK), product_slug, enrolled_at
│
├── devices                 (PTalk robots)
│   ├── id, serial_number, firmware_version, status, owner_id (FK to user_profiles)
│
├── device_assignments      (robot gán cho user nào)
│   ├── id, device_id (FK), assigned_user_id (FK to user_profiles), assigned_at
│
└── user_relationships      (owner ↔ child/elder)
    ├── id, parent_id (FK), child_id (FK), relationship_type
```

### 5.5 Database Naming Convention (Drizzle ORM)

| Type | Convention | Example |
|------|-----------|---------|
| Table names | `snake_case` (số nhiều) | `user_profiles`, `user_enrollments` |
| Column names | `snake_case` | `created_at`, `user_type`, `authentik_id` |
| Primary keys | `id` (UUID) | `id UUID PRIMARY KEY` |
| Foreign keys | `<entity_singular>_id` | `user_profile_id`, `device_id` |
| Index names | `idx_<table>_<column(s)>` | `idx_user_profiles_authentik_id` |
| Drizzle schema vars | `camelCase` | `export const userProfiles = pgTable(...)` |
| Migration files | auto-generated by Drizzle Kit | `0001_create_user_profiles.sql` |

### 5.6 Sync Strategy: JWT → Business DB

Khi user đăng nhập lần đầu, FE/Backend cần **upsert** `user_profiles`:

```typescript
// Khi nhận JWT từ Authentik (sau login callback)
async function syncUserProfile(jwtPayload: JWTPayload) {
  const existing = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.authentikId, jwtPayload.sub),
  });

  if (!existing) {
    // Tạo mới profile trong business DB
    await db.insert(userProfiles).values({
      authentikId: jwtPayload.sub,      // UUID từ Authentik
      displayName: jwtPayload.name,
      userType: jwtPayload.user_type,
    });
  } else {
    // Cập nhật nếu thông tin thay đổi
    await db.update(userProfiles)
      .set({
        displayName: jwtPayload.name,
        userType: jwtPayload.user_type,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.authentikId, jwtPayload.sub));
  }
}
```

### 5.7 Seed Data (cho development)

```typescript
// seed/users.ts
const seedUsers = [
  {
    authentikId: "00000000-0000-0000-0000-000000000001",  // phải trùng với user tạo trên Authentik
    displayName: "Admin Test",
    userType: "dashboard",
    status: "active",
  },
  {
    authentikId: "00000000-0000-0000-0000-000000000002",
    displayName: "Bé An",
    userType: "child",
    phone: "0901234567",
    status: "active",
  },
  {
    authentikId: "00000000-0000-0000-0000-000000000003",
    displayName: "Ông Bình",
    userType: "elder",
    status: "active",
  },
];
```

> **Quan trọng:** `authentikId` trong seed phải khớp với UUID của user được tạo trên Authentik. Tuấn Anh tạo user trước → lấy UUID → Nam dùng cho seed.

---

## 6. JWT Payload (Authentik OIDC) — Chuẩn chung

### 6.1 Access Token Payload

```json
{
  "iss": "http://localhost:9000/application/o/dashboard/",
  "sub": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "aud": "dashboard-client",
  "exp": 1716700800,
  "iat": 1716697200,
  "auth_time": 1716697200,
  "acr": "goauthentik.io/providers/oauth2/default",

  "email": "admin@ptit.edu.vn",
  "email_verified": true,
  "name": "Nguyen Van A",
  "preferred_username": "nguyenvana",

  "roles": ["SuperAdmin"],
  "user_type": "dashboard",
  "assigned_products": ["ptalk-assistant", "kid-mentor", "elder-kare"]
}
```

### 6.2 Field Definitions

| Field | Type | Source | Ai dùng | Description |
|-------|------|--------|---------|-------------|
| `sub` | UUID string | Authentik auto | **Cả 3** | Unified User ID. FE dùng để hiển thị, Nam dùng làm `authentik_id` FK, Tuấn Anh quản lý |
| `iss` | string | Authentik auto | FE | Issuer URL theo pattern `http://host/application/o/<app-slug>/` |
| `aud` | string | Authentik auto | FE | Client ID của app đang request |
| `exp` | number | Authentik auto | FE | Expiration timestamp |
| `iat` | number | Authentik auto | FE | Issued at timestamp |
| `email` | string | OIDC `email` scope | FE, Nam (sync) | Email user |
| `email_verified` | boolean | OIDC `email` scope | FE | Email đã xác thực chưa |
| `name` | string | OIDC `profile` scope | FE, Nam (sync `display_name`) | Tên hiển thị |
| `preferred_username` | string | OIDC `profile` scope | FE | Username |
| `roles` | string[] | Custom scope `roles` | **FE** (phân quyền dashboard) | Danh sách group names. FE map sang DashboardRole |
| `user_type` | string | Custom scope `user_type` | **FE + Nam** | `"child"` \| `"elder"` \| `"owner"` \| `"dashboard"` |
| `assigned_products` | string[] | Custom scope `assigned_products` | **FE + Nam** | `["ptalk-assistant", "kid-mentor", "elder-kare"]` |

### 6.3 Token Lifetimes (Tuấn Anh config trên Authentik)

| Token | Lifetime | Notes |
|-------|----------|-------|
| Access Token | 5 phút | Short-lived, FE gửi kèm mỗi API call |
| Refresh Token | 7 ngày | Dùng để lấy access token mới |
| ID Token | 5 phút | Chứa identity claims |

### 6.4 Dashboard Role Mapping (FE đọc từ `roles` claim)

| JWT `roles` chứa | Dashboard Role | Quyền |
|-------------------|----------------|-------|
| `SuperAdmin` | Super Admin | Toàn quyền |
| `ProductAdmin` | Product Admin | Quản lý user/device/data cho sản phẩm được gán |
| `Support` | Support | Xem & chỉnh sửa user, xử lý hỗ trợ |
| `Viewer` | Viewer | Chỉ xem |

### 6.5 How Frontend Uses JWT

```typescript
interface JWTPayload {
  sub: string;           // UUID — Authentik user ID
  iss: string;
  aud: string;
  exp: number;
  iat: number;

  email: string;
  email_verified: boolean;
  name: string;
  preferred_username: string;

  roles: string[];              // ["SuperAdmin", "ProductAdmin", ...]
  user_type: string;            // "child" | "elder" | "owner" | "dashboard"
  assigned_products: string[];  // ["ptalk-assistant", "kid-mentor", ...]
}

type DashboardRole = "SuperAdmin" | "ProductAdmin" | "Support" | "Viewer";

function getUserRole(roles: string[]): DashboardRole {
  const hierarchy: DashboardRole[] = ["SuperAdmin", "ProductAdmin", "Support", "Viewer"];
  return hierarchy.find(role => roles.includes(role)) ?? "Viewer";
}
```

---

## 7. Shared Constants (cả 3 task dùng chung)

### 7.1 Product Slugs

| Sản phẩm | Slug | Dùng ở |
|-----------|------|--------|
| PTalk Assistant | `ptalk-assistant` | JWT `assigned_products`, DB `user_enrollments.product_slug`, Authentik attributes |
| Kid Mentor | `kid-mentor` | JWT `assigned_products`, DB `user_enrollments.product_slug`, Authentik app slug |
| Elder Kare | `elder-kare` | JWT `assigned_products`, DB `user_enrollments.product_slug` |

### 7.2 User Types

| Type | Mô tả |
|------|--------|
| `child` | Trẻ em — dùng PTalk robot + Kid Mentor |
| `elder` | Người cao tuổi — dùng PTalk robot + Elder Kare |
| `owner` | Account Owner — sở hữu/quản lý robot PTalk |
| `dashboard` | User vận hành — chỉ truy cập dashboard |

### 7.3 User Status

| Status | Mô tả |
|--------|--------|
| `active` | Đang hoạt động |
| `inactive` | Ngừng hoạt động (tự nguyện) |
| `suspended` | Bị khóa (do admin) |

### 7.4 Device Status

| Status | Mô tả |
|--------|--------|
| `online` | Đang kết nối |
| `offline` | Mất kết nối |
| `error` | Lỗi phần cứng/firmware |

---

## 8. API Response Format (chuẩn chung)

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 150
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token expired"
  }
}
```

---

## 9. Checklist đồng bộ giữa 3 task

| # | Item | Tuấn Anh (Authentik) | Nam (DB) | Trung (FE) |
|---|------|---------------------|----------|------------|
| 1 | Group names khớp | Tạo đúng tên group ở §4.1 | — | Đọc `roles` claim, map theo §6.4 |
| 2 | Property mappings | Tạo 3 custom scopes: `roles`, `user_type`, `assigned_products` (§4.4) | — | Parse 3 claims này từ JWT |
| 3 | `sub` = UUID | Authentik tự sinh UUID | Lưu vào `user_profiles.authentik_id` (§5.2) | Dùng `sub` làm user identifier |
| 4 | Product slugs | Set trong user attributes `assigned_products` | Dùng trong `user_enrollments.product_slug` | Hiển thị theo slug |
| 5 | User type | Set trong user attributes `user_type` | Lưu trong `user_profiles.user_type` | Đọc từ JWT claim |
| 6 | Client IDs | Config theo §4.2 | — | Dùng `dashboard-client` trong `.env` |
| 7 | Redirect URIs | Config theo §4.2 | — | Route: `/api/auth/callback/authentik` |
| 8 | Seed data sync | Tạo test users trước → export UUID | Dùng UUID đó cho seed (§5.7) | Login bằng test users |
| 9 | Token lifetime | Config theo §6.3 | — | Handle refresh token tự động |
