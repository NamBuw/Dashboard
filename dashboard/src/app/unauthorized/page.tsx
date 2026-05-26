import Link from "next/link";
import { ShieldX, Home, LogIn } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="mx-auto w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center">
          <ShieldX size={40} className="text-danger" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Không có quyền truy cập
          </h1>
          <p className="text-muted">
            Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ quản
            trị viên nếu bạn cho rằng đây là lỗi.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
          <p className="text-sm text-amber-800">
            <strong>Gợi ý:</strong> Kiểm tra xem tài khoản của bạn đã được gán
            đúng role (SuperAdmin, ProductAdmin, Support, Viewer) trên Authentik
            chưa.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors"
          >
            <Home size={18} />
            Về Dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-border hover:bg-gray-50 rounded-lg font-medium transition-colors"
          >
            <LogIn size={18} />
            Đăng nhập lại
          </Link>
        </div>
      </div>
    </div>
  );
}
