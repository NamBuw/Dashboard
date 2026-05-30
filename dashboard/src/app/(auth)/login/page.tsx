"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Loader2, KeyRound } from "lucide-react";

export default function LoginPage() {
  const [ssoLoading, setSsoLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuthentikLogin = async () => {
    setSsoLoading(true);
    setError("");
    await signIn("authentik", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-[480px] bg-card border-r border-border flex-col justify-between p-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 mb-1">
            <a href="https://ptit.edu.vn/" target="_blank" rel="noopener noreferrer">
              <img src="/ptit-logo.png" alt="PTIT" className="h-9 w-auto opacity-80 hover:opacity-100 transition-opacity" />
            </a>
            <div className="w-px h-5 bg-border" />
            <a href="https://ctslab.net/" target="_blank" rel="noopener noreferrer">
              <img src="/cts-logo.png" alt="CTS Lab" className="h-8 w-auto opacity-80 hover:opacity-100 transition-opacity" />
            </a>
          </div>
          <p className="text-[13px] text-muted-foreground">CTS Lab - PTIT</p>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-[32px] font-semibold text-foreground leading-tight tracking-tight">
              Quản lý
              <br />
              Hệ sinh thái Sản phẩm
            </h2>
            <p className="text-[15px] text-muted-foreground mt-3 leading-relaxed">
              Theo dõi toàn bộ PTalk Assistant, Kid Mentor, Elder Kare từ một dashboard duy nhất.
            </p>
          </div>

          <div className="flex gap-2">
            {["PTalk Assistant", "Kid Mentor", "Elder Kare"].map((product) => (
              <div
                key={product}
                className="px-3 py-1.5 bg-surface rounded-md text-[12px] font-medium text-muted-foreground"
              >
                {product}
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          &copy; 2026 CTS Lab. All rights reserved.
        </p>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[360px] space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center">
            <div className="flex items-center justify-center gap-2.5 mb-2">
              <img src="/ptit-logo.png" alt="PTIT" className="h-8 w-auto opacity-80" />
              <div className="w-px h-4 bg-border" />
              <img src="/cts-logo.png" alt="CTS" className="h-7 w-auto opacity-80" />
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-[24px] font-semibold text-foreground tracking-tight">
              Đăng nhập
            </h1>
            <p className="text-[14px] text-muted-foreground mt-1.5">
              Sử dụng tài khoản Authentik để truy cập dashboard
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-danger-muted border border-danger/20 rounded-lg text-[13px] text-danger">
              {error}
            </div>
          )}

          {/* SSO Button */}
          <button
            onClick={handleAuthentikLogin}
            disabled={ssoLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-[14px] font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {ssoLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <KeyRound size={16} />
            )}
            {ssoLoading ? "Đang chuyển..." : "Đăng nhập với Authentik SSO"}
          </button>

          {/* Sign up link */}
          <p className="text-[13px] text-muted-foreground text-center">
            Chưa có tài khoản?{" "}
            <Link href="/signup" className="text-accent hover:text-accent-hover font-medium">
              Đăng ký
            </Link>
          </p>

          {/* Info */}
          <div className="p-3 bg-surface rounded-lg">
            <p className="text-[13px] text-foreground font-medium">Xác thực SSO</p>
            <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
              Đăng nhập qua Authentik Identity Provider. Hỗ trợ SSO cho tất cả sản phẩm PTalk.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
