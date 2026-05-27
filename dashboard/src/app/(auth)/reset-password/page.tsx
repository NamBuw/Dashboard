"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { KeyRound, Shield, Loader2, ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Token đặt lại mật khẩu không hợp lệ hoặc thiếu trong đường dẫn.");
    }
  }, [token]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Token không hợp lệ.");
      return;
    }
    if (!password || !confirmPassword) {
      setError("Vui lòng nhập đầy đủ mật khẩu mới");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có độ dài từ 6 ký tự trở lên");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Đặt lại mật khẩu thất bại");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar-bg text-white flex-col justify-between p-12">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CTS Dashboard</h1>
          <p className="text-sm text-white/60 mt-1">YIRLODT Laboratory - PTIT</p>
        </div>

        <div className="space-y-6">
          <h2 className="text-4xl font-bold leading-tight">
            Đặt lại Mật khẩu mới
            <br />
            An toàn tối đa
          </h2>
          <p className="text-lg text-white/70 max-w-md">
            Mật khẩu mới của bạn sẽ được mã hoá bảo mật bcrypt chuẩn công nghiệp trước khi được cập nhật vào cơ sở dữ liệu.
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

      {/* Right - Form Card */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="lg:hidden text-center">
            <h1 className="text-2xl font-bold text-foreground">CTS Dashboard</h1>
            <p className="text-sm text-muted mt-1">YIRLODT Laboratory - PTIT</p>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-foreground">Tạo mật khẩu mới</h2>
            <p className="text-muted mt-2">
              Thiết lập mật khẩu đăng nhập mới cho tài khoản của bạn.
            </p>
          </div>

          {!success ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 leading-relaxed">
                  ⚠️ {error}
                </div>
              )}

              <div>
                <label htmlFor="pass" className="block text-sm font-medium text-foreground mb-1.5">
                  Mật khẩu mới (Tối thiểu 6 ký tự)
                </label>
                <div className="relative">
                  <input
                    id="pass"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới..."
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
                <label htmlFor="confirm" className="block text-sm font-medium text-foreground mb-1.5">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  id="confirm"
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới..."
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <KeyRound size={20} />
                )}
                {loading ? "Đang lưu mật khẩu..." : "Đặt lại mật khẩu"}
              </button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-1.5 text-xs text-muted hover:text-accent font-semibold transition-colors mt-2"
              >
                <ArrowLeft size={14} />
                Hủy bỏ và quay lại Đăng nhập
              </Link>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-success/10 border border-success/20 rounded-xl flex items-start gap-3">
                <CheckCircle size={24} className="text-success shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">Cập nhật thành công!</h4>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    Mật khẩu tài khoản của bạn đã được thay đổi thành công. Bạn hiện đã có thể đăng nhập bằng mật khẩu mới này.
                  </p>
                </div>
              </div>

              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors cursor-pointer shadow-lg"
              >
                Tiến hành Đăng nhập
              </Link>
            </div>
          )}

          <div className="flex items-start gap-3 p-4 bg-[#0C101A]/60 border border-white/5 rounded-lg">
            <Shield size={20} className="text-accent mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Độ bảo mật cao
              </p>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Mọi hành động đặt lại mật khẩu đều được mã hóa bằng hàm băm mật khẩu bảo mật một chiều trước khi đồng bộ.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#070b12] text-white w-full">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
