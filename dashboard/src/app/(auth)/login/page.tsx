"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Shield, Loader2, KeyRound, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [ssoLoading, setSsoLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuthentikLogin = async () => {
    setSsoLoading(true);
    setError("");
    await signIn("authentik", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Animated Background Mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] animate-float" style={{ animationDelay: "4s" }} />
      </div>

      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 text-white flex-col justify-between p-12 relative">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg glow-indigo">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient-primary">CTS Dashboard</h1>
              <p className="text-xs text-white/40">CTS Lab - PTIT</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-8 animate-fade-in-up">
          <div>
            <h2 className="text-5xl font-bold leading-tight mb-4">
              <span className="text-gradient-primary">Quản lý</span>
              <br />
              <span className="text-foreground">Hệ sinh thái Sản phẩm</span>
            </h2>
            <p className="text-lg text-white/60 max-w-md leading-relaxed">
              Theo dõi toàn bộ PTalk Assistant, Kid Mentor, Elder Kare từ một dashboard duy nhất.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            {[
              { name: "PTalk Assistant", gradient: "from-indigo-500 to-purple-500" },
              { name: "Kid Mentor", gradient: "from-emerald-500 to-cyan-500" },
              { name: "Elder Kare", gradient: "from-amber-500 to-orange-500" },
            ].map((product, i) => (
              <div
                key={product.name}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white/80 border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-300 opacity-0 animate-fade-in-up cursor-default"
                style={{ animationDelay: `${0.3 + i * 0.1}s` }}
              >
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${product.gradient} inline-block mr-2`} />
                {product.name}
              </div>
            ))}
          </div>

          {/* Stats Preview */}
          <div className="grid grid-cols-3 gap-4 pt-4 opacity-0 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
            {[
              { label: "Người dùng", value: "1,200+" },
              { label: "Thiết bị", value: "500+" },
              { label: "Lượt/ngày", value: "10K+" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-gradient-primary">{stat.value}</p>
                <p className="text-xs text-white/40 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/30">
          &copy; 2026 CTS Lab. All rights reserved.
        </p>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md space-y-8 opacity-0 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          {/* Mobile Logo */}
          <div className="lg:hidden text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg glow-indigo mx-auto mb-3">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <h1 className="text-2xl font-bold text-gradient-primary">CTS Dashboard</h1>
            <p className="text-sm text-muted mt-1">CTS Lab - PTIT</p>
          </div>

          {/* Title */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-foreground mb-2">Đăng nhập</h2>
            <p className="text-muted">
              Sử dụng tài khoản Authentik để truy cập dashboard
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger flex items-center gap-2 animate-scale-in">
              <Shield size={16} />
              {error}
            </div>
          )}

          {/* SSO Button */}
          <button
            onClick={handleAuthentikLogin}
            disabled={ssoLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-primary hover:opacity-90 text-white rounded-xl font-semibold transition-all duration-300 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-lg shadow-lg glow-indigo hover:glow-indigo-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            {ssoLoading ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <KeyRound size={24} />
            )}
            {ssoLoading ? "Đang chuyển đến SSO..." : "Đăng nhập với Authentik SSO"}
          </button>

          {/* Sign Up */}
          <div className="text-center">
            <p className="text-sm text-muted">
              Chưa có tài khoản?{" "}
              <Link
                href="/signup"
                className="text-gradient-primary font-semibold hover:opacity-80 transition-opacity"
              >
                Đăng ký tài khoản
              </Link>
            </p>
          </div>

          {/* SSO Info Card */}
          <div className="glass-card rounded-xl p-5 flex items-start gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <div className="p-2.5 rounded-lg bg-gradient-primary shadow-lg">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                Xác thực SSO
                <Sparkles size={12} className="text-amber-400" />
              </p>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Đăng nhập qua Authentik Identity Provider. Hỗ trợ SSO cho tất cả sản phẩm PTalk.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
