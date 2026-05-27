export type DashboardRole = "SuperAdmin" | "ProductAdmin" | "Support" | "Viewer";

export type UserType = "child" | "elder" | "owner" | "dashboard";

export interface JWTPayload {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  auth_time: number;
  email: string;
  email_verified: boolean;
  name: string;
  preferred_username: string;
  roles: string[];
  user_type: UserType;
  assigned_products: string[];
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: DashboardRole;
  roles: string[];
  user_type: UserType;
  assigned_products: string[];
  subscription_tier?: string;
  is_superuser?: boolean;
}

const ROLE_HIERARCHY: DashboardRole[] = [
  "SuperAdmin",
  "ProductAdmin",
  "Support",
  "Viewer",
];

export function getUserRole(roles: string[]): DashboardRole {
  return ROLE_HIERARCHY.find((role) => roles.includes(role)) ?? "Viewer";
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles?: DashboardRole[];
}
