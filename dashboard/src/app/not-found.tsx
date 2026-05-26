import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-8xl font-bold text-accent">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">
            Không tìm thấy trang
          </h2>
          <p className="text-muted">
            Trang bạn đang tìm không tồn tại hoặc đã được di chuyển.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors"
          >
            <Home size={18} />
            Về trang chủ
          </Link>
          <Link
            href="javascript:history.back()"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-border hover:bg-gray-50 rounded-lg font-medium transition-colors"
          >
            <ArrowLeft size={18} />
            Quay lại
          </Link>
        </div>
      </div>
    </div>
  );
}
