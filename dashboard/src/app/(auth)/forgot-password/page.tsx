"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, Shield, Loader2, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Vui lòng nhập email tài khoản");
      return;
    }

    setLoading(true);
    setError("");
    setResetUrl("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gửi yêu cầu thất bại");
      }

      setSuccess(true);
      if (data.resetUrl) {
        setResetUrl(data.resetUrl);
      }
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi kết nối");
    } finally {
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
            Khôi phục mật khẩu
            <br />
            Hệ sinh thái PTalk
          </h2>
          <p className="text-lg text-white/70 max-w-md">
            Lấy lại quyền truy cập vào tài khoản quản lý thiết bị và theo dõi chỉ với vài bước đơn giản.
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

      {/* Right - Form Card */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="lg:hidden text-center">
            <h1 className="text-2xl font-bold text-foreground">CTS Dashboard</h1>
            <p className="text-sm text-muted mt-1">CTS Lab - PTIT</p>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-foreground">Quên mật khẩu?</h2>
            <p className="text-muted mt-2">
              Chúng tôi sẽ gửi liên kết khôi phục mật khẩu tới email của bạn.
            </p>
          </div>

          {!success ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  ⚠️ {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                  Email tài khoản
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email đã đăng ký..."
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <KeyRound size={20} />
                )}
                {loading ? "Đang gửi yêu cầu..." : "Gửi liên kết khôi phục"}
              </button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-1.5 text-xs text-muted hover:text-accent font-semibold transition-colors mt-2"
              >
                <ArrowLeft size={14} />
                Quay lại trang Đăng nhập
              </Link>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-success/10 border border-success/20 rounded-xl flex items-start gap-3">
                <CheckCircle size={24} className="text-success shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">Gửi yêu cầu thành công!</h4>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    Một email chứa liên kết khôi phục mật khẩu đã được gửi đến địa chỉ <strong>{email}</strong>. 
                  </p>
                </div>
              </div>

              {/* Developer/Tester quick link helper (Wow factor!) */}
              {resetUrl && (
                <div className="p-5 border border-dashed border-accent/30 bg-accent/5 rounded-2xl space-y-3">
                  <span className="text-[10px] bg-accent/20 text-accent font-bold px-2 py-0.5 rounded uppercase">
                    Môi trường Test (Quick Link)
                  </span>
                  <p className="text-[11px] text-muted leading-relaxed">
                    Do hệ thống đang chạy trong môi trường cục bộ (local/docker) không cấu hình cổng SMTP gửi mail thật, bạn có thể click trực tiếp vào nút dưới đây để đặt lại mật khẩu mới:
                  </p>
                  <Link
                    href={resetUrl}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_12px_rgba(6,182,212,0.1)]"
                  >
                    <KeyRound size={12} />
                    Đặt lại mật khẩu mới tại đây
                  </Link>
                </div>
              )}

              <Link
                href="/login"
                className="flex items-center justify-center gap-1.5 text-xs text-accent hover:underline font-semibold transition-colors mt-4"
              >
                <ArrowLeft size={14} />
                Quay lại trang Đăng nhập
              </Link>
            </div>
          )}

          <div className="flex items-start gap-3 p-4 bg-[#0C101A]/60 border border-white/5 rounded-lg">
            <Shield size={20} className="text-accent mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Xác thực an toàn
              </p>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Mã xác nhận (Reset Token) được băm bảo mật SHA-256 trong database và có hiệu lực tối đa trong vòng 60 phút.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
