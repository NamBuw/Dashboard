"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus, Shield, Loader2, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !email || !password || !confirmPassword) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải từ 6 ký tự");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Đăng ký thất bại");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Không thể kết nối đến server");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar-bg text-white flex-col justify-between p-12">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CTS Dashboard</h1>
          <p className="text-sm text-white/60 mt-1">CTS Lab - PTIT</p>
        </div>

        <div className="space-y-6">
          <h2 className="text-4xl font-bold leading-tight">
            Tạo tài khoản mới
            <br />
            Tham gia hệ sinh thái PTalk
          </h2>
          <p className="text-lg text-white/70 max-w-md">
            Đăng ký tài khoản để truy cập PTalk Assistant, Kid Mentor, Elder Kare.
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
          &copy; 2026 CTS Lab. All rights reserved.
        </p>
      </div>

      {/* Right - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center">
            <h1 className="text-2xl font-bold text-foreground">CTS Dashboard</h1>
            <p className="text-sm text-muted mt-1">CTS Lab - PTIT</p>
          </div>

          <div className="text-center lg:text-left">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft size={16} />
              Quay lại đăng nhập
            </Link>
            <h2 className="text-2xl font-bold text-foreground">Đăng ký tài khoản</h2>
            <p className="text-muted mt-2">
              Tạo tài khoản PTalk để truy cập dashboard
            </p>
          </div>

          {success ? (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                <CheckCircle size={24} className="text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Dang ky thanh cong!
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Mot email xac thuc da duoc gui den <strong>{email}</strong>.
                    Vui long kiem tra hop thu va nhan lien ket xac thuc de kich hoat tai khoan.
                  </p>
                </div>
              </div>
              {resendMsg && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  {resendMsg}
                </div>
              )}
              <button
                onClick={async () => {
                  setResendLoading(true);
                  setResendMsg("");
                  try {
                    const res = await fetch("/api/auth/resend-verification", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email }),
                    });
                    const data = await res.json();
                    setResendMsg(data.message || "Email xac thuc da duoc gui lai!");
                  } catch {
                    setResendMsg("Khong the gui lai email. Vui long thu lai sau.");
                  }
                  setResendLoading(false);
                }}
                disabled={resendLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-accent text-accent hover:bg-accent/5 rounded-lg font-medium transition-colors disabled:opacity-60"
              >
                {resendLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                {resendLoading ? "Dang gui..." : "Gui lai email xac thuc"}
              </button>
              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors"
              >
                Tiến hành Đăng nhập
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
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
                  placeholder="Chỉ gồm chữ, số, dấu gạch dưới"
                  autoComplete="username"
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                  Địa chỉ email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                  Mật khẩu (Tối thiểu 6 ký tự)
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tạo mật khẩu"
                    autoComplete="new-password"
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

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1.5">
                  Xác nhận mật khẩu
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <UserPlus size={20} />
                )}
                {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
              </button>
            </form>
          )}

          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <Shield size={20} className="text-accent mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Bảo mật tài khoản
              </p>
              <p className="text-xs text-muted mt-1">
                Mật khẩu được mã hoá bcrypt. Tài khoản được tạo đồng bộ với hệ thống xác thực Authentik SSO.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
