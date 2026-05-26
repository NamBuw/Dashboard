# Naming Conventions & JWT Payload

> **Version:** 1.0 | **Date:** 2026-05-26 | **Author:** Dashboard FE Team

---

## 1. Git Branch Naming

| Pattern | Use case | Example |
|---------|----------|---------|
| `feature/<module>-<description>` | New feature | `feature/dashboard-fe-setup` |
| `fix/<module>-<description>` | Bug fix | `fix/auth-token-refresh` |
| `docs/<description>` | Documentation | `docs/naming-conventions` |
| `refactor/<description>` | Refactoring | `refactor/user-list-query` |

## 2. File & Folder Naming

| Type | Convention | Example |
|------|-----------|---------|
| Folders | `kebab-case` | `user-management/`, `auth/` |
| React Components | `PascalCase.tsx` | `UserTable.tsx`, `Sidebar.tsx` |
| Pages (App Router) | `page.tsx`, `layout.tsx` | `app/dashboard/page.tsx` |
| Utilities / Hooks | `camelCase.ts` | `useAuth.ts`, `formatDate.ts` |
| Types / Interfaces | `camelCase.ts` (file), `PascalCase` (type) | `types/user.ts` -> `type User` |
| Constants | `camelCase.ts` (file), `UPPER_SNAKE_CASE` (value) | `constants.ts` -> `API_BASE_URL` |
| API routes | `kebab-case` | `app/api/auth/callback/route.ts` |
| CSS Modules | `PascalCase.module.css` | _(not used, prefer Tailwind)_ |

## 3. Code Naming

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

## 4. Database (Drizzle ORM)

| Type | Convention | Example |
|------|-----------|---------|
| Table names | `snake_case` (plural) | `users`, `user_enrollments` |
| Column names | `snake_case` | `created_at`, `user_type` |
| Foreign keys | `<table_singular>_id` | `user_id`, `product_id` |
| Index names | `idx_<table>_<column>` | `idx_users_email` |
| Drizzle schema vars | `camelCase` | `export const users = pgTable(...)` |

## 5. API Response Format

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

Error response:
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

## 6. JWT Payload (Authentik OIDC)

Authentik issues JWT tokens via OpenID Connect. Below is the standardized payload structure used across the ecosystem.

### 6.1 Access Token Payload

```json
{
  "iss": "https://auth.example.com/application/o/dashboard/",
  "sub": "U-001",
  "aud": "dashboard-client-id",
  "exp": 1716700800,
  "iat": 1716697200,
  "auth_time": 1716697200,
  "acr": "goauthentik.io/providers/oauth2/default",

  "email": "user@example.com",
  "email_verified": true,
  "name": "Nguyen Van A",
  "preferred_username": "nguyenvana",

  "groups": ["SuperAdmin", "ProductAdmin"],

  "user_type": "dashboard",
  "assigned_products": ["ptalk-assistant", "kid-mentor"]
}
```

### 6.2 Field Definitions

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `iss` | string | Authentik auto | Issuer URL - Authentik OIDC provider endpoint |
| `sub` | string | Authentik auto | Subject - Unified User ID (e.g., `U-001`). **This is the single source of truth ID across all products** |
| `aud` | string | Authentik auto | Audience - Client ID of the requesting application |
| `exp` | number | Authentik auto | Expiration timestamp (Unix). Default: 5 minutes for access token |
| `iat` | number | Authentik auto | Issued at timestamp |
| `auth_time` | number | Authentik auto | Time of original authentication |
| `email` | string | OIDC `email` scope | User email |
| `email_verified` | boolean | OIDC `email` scope | Whether email has been verified |
| `name` | string | OIDC `profile` scope | Full display name |
| `preferred_username` | string | OIDC `profile` scope | Username for display |
| `groups` | string[] | OIDC `groups` scope | List of Authentik groups the user belongs to. Used for RBAC |
| `user_type` | string | Custom claim (Property Mapping) | One of: `child`, `elder`, `owner`, `dashboard` |
| `assigned_products` | string[] | Custom claim (Property Mapping) | Products the user is enrolled in: `ptalk-assistant`, `kid-mentor`, `elder-kare` |

### 6.3 Token Lifetimes

| Token | Lifetime | Notes |
|-------|----------|-------|
| Access Token | 5 minutes | Short-lived, used for API calls |
| Refresh Token | 7 days | Used to obtain new access tokens |
| ID Token | 5 minutes | Contains user identity claims |

### 6.4 Custom Property Mappings (Authentik Config)

To include `user_type` and `assigned_products` in the JWT, configure Authentik Property Mappings:

**user_type mapping:**
```python
# Authentik Property Mapping - Expression
return request.user.attributes.get("user_type", "dashboard")
```

**assigned_products mapping:**
```python
# Authentik Property Mapping - Expression
return request.user.attributes.get("assigned_products", [])
```

### 6.5 Dashboard Role Mapping (from JWT groups)

| JWT `groups` contains | Dashboard Role | Permissions |
|----------------------|----------------|-------------|
| `SuperAdmin` | Super Admin | Full access to all features and data |
| `ProductAdmin` | Product Admin | Manage users, devices, data for assigned products |
| `Support` | Support | View & edit user info, handle support requests |
| `Viewer` | Viewer | Read-only access to dashboard & reports |

### 6.6 How Frontend Uses JWT

```typescript
// Decoded token type used in the Dashboard FE
interface JWTPayload {
  iss: string;
  sub: string;          // Unified User ID
  aud: string;
  exp: number;
  iat: number;
  auth_time: number;

  email: string;
  email_verified: boolean;
  name: string;
  preferred_username: string;

  groups: string[];     // ["SuperAdmin", "ProductAdmin", ...]
  user_type: string;    // "child" | "elder" | "owner" | "dashboard"
  assigned_products: string[]; // ["ptalk-assistant", "kid-mentor", ...]
}

// Role check helper
type DashboardRole = "SuperAdmin" | "ProductAdmin" | "Support" | "Viewer";

function getUserRole(groups: string[]): DashboardRole {
  const roleHierarchy: DashboardRole[] = ["SuperAdmin", "ProductAdmin", "Support", "Viewer"];
  return roleHierarchy.find(role => groups.includes(role)) ?? "Viewer";
}
```
