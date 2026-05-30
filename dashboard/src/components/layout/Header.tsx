"use client";

import { Menu, Bell, LogOut, User, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { clsx } from "clsx";

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="glass-header h-16 flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-all duration-200 hover:scale-105"
        >
          <Menu size={20} className="text-muted" />
        </button>
        <h1 className="text-lg font-semibold text-foreground lg:hidden text-gradient-primary">
          CTS Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <button className="relative p-2.5 rounded-xl hover:bg-white/5 transition-all duration-200 hover:scale-105 group">
          <Bell size={20} className="text-muted group-hover:text-foreground transition-colors" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-danger rounded-full animate-dot-pulse border-2 border-background" />
        </button>

        {/* User Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-white/5 transition-all duration-200 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg glow-indigo">
              <User size={16} className="text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-foreground leading-tight">
                {user?.name ?? "Admin"}
              </p>
              <p className="text-xs text-muted">{user?.role ?? "SuperAdmin"}</p>
            </div>
            <ChevronDown
              size={14}
              className={clsx(
                "hidden sm:block text-muted transition-transform duration-200",
                showDropdown && "rotate-180"
              )}
            />
          </button>

          {showDropdown && (
            <div className="glass-dropdown absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden animate-scale-in z-50">
              <div className="px-4 py-3 border-b border-white/5">
                <p className="text-sm font-semibold text-foreground">{user?.name ?? "Admin"}</p>
                <p className="text-xs text-muted mt-0.5">
                  {user?.email ?? "admin@ctslab.net"}
                </p>
              </div>
              <button
                onClick={() => {
                  signOut({ callbackUrl: "/login" });
                }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-danger hover:bg-white/5 transition-all duration-200"
              >
                <LogOut size={16} />
                <span className="font-medium">Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
