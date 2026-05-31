"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Mail, XCircle } from "lucide-react";
import { Suspense } from "react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {success ? (
          <>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Xac thuc thanh cong!
            </h1>
            <p className="text-muted">
              Email cua ban da duoc xac thuc. Tai khoan da duoc kich hoat.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors"
            >
              Dang nhap ngay
            </Link>
          </>
        ) : error === "invalid" ? (
          <>
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle size={32} className="text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Lien ket khong hop le
            </h1>
            <p className="text-muted">
              Lien ket xac thuc da het han hoac da duoc su dung. Vui long dang
              ky lai hoac yeu cau gui lai email xac thuc.
            </p>
            <div className="flex gap-3">
              <Link
                href="/signup"
                className="flex-1 px-4 py-3 border border-border text-foreground rounded-lg font-medium hover:bg-surface transition-colors text-center"
              >
                Dang ky lai
              </Link>
              <Link
                href="/login"
                className="flex-1 px-4 py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors text-center"
              >
                Dang nhap
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail size={32} className="text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Xac thuc email
            </h1>
            <p className="text-muted">
              Vui long kiem tra hop thu email va nhan lien ket xac thuc de kich
              hoat tai khoan.
            </p>
            <p className="text-sm text-muted">
              Khong nhan duoc email? Kiem tra thu muc spam hoac{" "}
              <Link href="/signup" className="text-accent hover:underline">
                dang ky lai
              </Link>
              .
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Dang tai...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
