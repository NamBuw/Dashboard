"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Shield, Loader2, KeyRound } from "lucide-react";

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
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar-bg text-white flex-col justify-between p-12">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CTS Dashboard</h1>
          <p className="text-sm text-white/60 mt-1">CTS Lab - PTIT</p>
        </div>

        <div className="space-y-6">
          <h2 className="text-4xl font-bold leading-tight">
            Qu&#7843;n l&#253; H&#7879; sinh th&#225;i
            <br />
            S&#7843;n ph&#7849;m t&#7853;p trung
          </h2>
          <p className="text-lg text-white/70 max-w-md">
            Theo d&#245;i to&#224;n b&#7897; PTalk Assistant, Kid Mentor, Elder Kare t&#7915; m&#7897;t
            dashboard duy nh&#7845;t.
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

      {/* Right - Login */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center">
            <h1 className="text-2xl font-bold text-foreground">CTS Dashboard</h1>
            <p className="text-sm text-muted mt-1">CTS Lab - PTIT</p>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-foreground">Đăng nhập</h2>
            <p className="text-muted mt-2">
              Sử dụng tài khoản Authentik để truy cập dashboard
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Authentik SSO Button */}
          <button
            onClick={handleAuthentikLogin}
            disabled={ssoLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-lg"
          >
            {ssoLoading ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <KeyRound size={24} />
            )}
            {ssoLoading ? "Đang chuyển đến SSO..." : "Đăng nhập với Authentik SSO"}
          </button>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-muted">
              Chưa có tài khoản?{" "}
              <Link
                href="/signup"
                className="text-accent hover:underline font-semibold"
              >
                Đăng ký tài khoản
              </Link>
            </p>
          </div>

          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <Shield size={20} className="text-accent mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Xác thực SSO
              </p>
              <p className="text-xs text-muted mt-1">
                Đăng nhập qua Authentik Identity Provider. Hỗ trợ SSO cho tất cả sản phẩm PTalk.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
