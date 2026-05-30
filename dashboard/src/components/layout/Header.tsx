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
    <header className="h-[52px] border-b border-border flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-md hover:bg-surface text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu size={18} />
        </button>
        <h1 className="text-sm font-semibold text-foreground lg:hidden">
          CTS Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-1">
        {/* Notification */}
        <button className="relative p-1.5 rounded-md hover:bg-surface text-muted-foreground hover:text-foreground transition-colors">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-danger rounded-full" />
        </button>

        {/* User Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 p-1.5 rounded-md hover:bg-surface transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-surface flex items-center justify-center">
              <User size={12} className="text-muted-foreground" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[13px] font-medium text-foreground leading-tight">
                {user?.name ?? "Admin"}
              </p>
            </div>
            <ChevronDown
              size={12}
              className={clsx(
                "hidden sm:block text-muted-foreground transition-transform duration-150",
                showDropdown && "rotate-180"
              )}
            />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 w-52 rounded-lg bg-card border border-border shadow-lg py-1 z-50 animate-fade-in">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-[13px] font-medium text-foreground">{user?.name ?? "Admin"}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {user?.email ?? "admin@ctslab.net"}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-danger hover:bg-danger-muted transition-colors"
              >
                <LogOut size={14} />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
