"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { LogIn, Shield, Loader2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Sai tên đăng nhập hoặc mật khẩu");
      setLoading(false);
    } else {
      window.location.href = "/dashboard";
    }
  };

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
              Sử dụng tài khoản PTalk để truy cập dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-foreground mb-1.5">
                Tên đăng nhập
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập username"
                autoComplete="username"
                className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Mật khẩu
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-accent hover:underline font-semibold"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <LogIn size={20} />
              )}
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <Shield size={20} className="text-accent mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Bảo mật JWT
              </p>
              <p className="text-xs text-muted mt-1">
                Xác thực bằng JSON Web Token. Mật khẩu được mã hoá bcrypt.
                Chỉ admin mới có quyền truy cập đầy đủ.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
