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
  groups: string[];
  user_type: UserType;
  assigned_products: string[];
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: DashboardRole;
  groups: string[];
  user_type: UserType;
  assigned_products: string[];
}

const ROLE_HIERARCHY: DashboardRole[] = [
  "SuperAdmin",
  "ProductAdmin",
  "Support",
  "Viewer",
];

export function getUserRole(groups: string[]): DashboardRole {
  return ROLE_HIERARCHY.find((role) => groups.includes(role)) ?? "Viewer";
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles?: DashboardRole[];
}
