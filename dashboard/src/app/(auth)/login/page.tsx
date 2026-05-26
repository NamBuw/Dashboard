"use client";

import { useState } from "react";
import { LogIn, Shield } from "lucide-react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  function handleLogin() {
    setIsLoading(true);
    window.location.href = "/api/auth/signin/authentik";
  }

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar-bg text-white flex-col justify-between p-12">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CTS Dashboard</h1>
          <p className="text-sm text-white/60 mt-1">YIRLODT Laboratory - PTIT</p>
        </div>

        <div className="space-y-6">
          <h2 className="text-4xl font-bold leading-tight">
            Quản lý Hệ sinh thái
            <br />
            Sản phẩm tập trung
          </h2>
          <p className="text-lg text-white/70 max-w-md">
            Theo dõi toàn bộ PTalk Assistant, Kid Mentor, Elder Kare từ một
            dashboard duy nhất.
          </p>

          <div className="flex gap-4 pt-4">
            {["PTalk Assistant", "Kid Mentor", "Elder Kare"].map((product) => (
              <div
                key={product}
                className="px-4 py-2 bg-white/10 rounded-lg text-sm font-medium"
              >
                {product}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/40">
          &copy; 2026 YIRLODT Laboratory. All rights reserved.
        </p>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center">
            <h1 className="text-2xl font-bold text-foreground">CTS Dashboard</h1>
            <p className="text-sm text-muted mt-1">YIRLODT Laboratory - PTIT</p>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-foreground">Đăng nhập</h2>
            <p className="text-muted mt-2">
              Sử dụng tài khoản Authentik để truy cập dashboard
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn size={20} />
              )}
              {isLoading ? "Đang chuyển hướng..." : "Đăng nhập với Authentik"}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-background text-muted">
                  Single Sign-On
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <Shield size={20} className="text-accent mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Xác thực tập trung
                </p>
                <p className="text-xs text-muted mt-1">
                  Đăng nhập một lần, truy cập toàn bộ hệ sinh thái sản phẩm.
                  Tài khoản được quản lý bởi Authentik.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
