"use client";

import { Menu, Bell, LogOut, User } from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";

interface HeaderProps {
  onMenuClick: () => void;
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

export default function Header({ onMenuClick, user }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="h-16 bg-card-bg border-b border-border flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-foreground lg:hidden">
          CTS Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-md hover:bg-gray-100 transition-colors">
          <Bell size={20} className="text-muted" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-foreground">
                {user?.name ?? "Admin"}
              </p>
              <p className="text-xs text-muted">{user?.role ?? "SuperAdmin"}</p>
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-card-bg rounded-lg shadow-lg border border-border py-1 z-50">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium">{user?.name ?? "Admin"}</p>
                <p className="text-xs text-muted">
                  {user?.email ?? "admin@example.com"}
                </p>
              </div>
              <button
                onClick={() => {
                  signOut({ callbackUrl: "/login" });
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-gray-50 transition-colors"
              >
                <LogOut size={16} />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
