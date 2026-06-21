"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, User, Baby, ArrowRight, CheckCircle } from "lucide-react";

const CURRICULA = [
  { code: "chan_troi_sang_tao", label: "Chân trời sáng tạo" },
  { code: "canh_dieu", label: "Cánh diều" },
  { code: "ket_noi_tri_thuc", label: "Kết nối tri thức" },
];
const RELATIONSHIPS = [
  { code: "father", label: "Bố" },
  { code: "mother", label: "Mẹ" },
  { code: "grandparent", label: "Ông/Bà" },
  { code: "guardian", label: "Người giám hộ" },
  { code: "other", label: "Khác" },
];

const inputCls =
  "w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors";

export default function OnboardingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Parent
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");

  // Child (optional)
  const [childName, setChildName] = useState("");
  const [childDob, setChildDob] = useState("");
  const [grade, setGrade] = useState("");
  const [curriculum, setCurriculum] = useState("");
  const [relationship, setRelationship] = useState("guardian");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/account/profile");
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        const data = await res.json();
        const p = data?.profile;
        if (p?.onboarded) {
          router.replace("/dashboard");
          return;
        }
        if (p) {
          setEmail(p.email || "");
          setFullName(p.fullName || "");
          setDob(p.dateOfBirth || "");
          setPhone(p.phone || "");
        }
        setReady(true);
      } catch {
        setError("Không kết nối được máy chủ.");
        setReady(true);
      }
    })();
  }, [router]);

  const goStep2 = () => {
    setError("");
    if (!fullName.trim()) {
      setError("Vui lòng nhập họ tên phụ huynh");
      return;
    }
    setStep(2);
  };

  const finish = async (withChild: boolean) => {
    setError("");
    setLoading(true);
    try {
      // 1) Save parent
      const pRes = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim(), phone, dateOfBirth: dob }),
      });
      if (!pRes.ok) {
        const d = await pRes.json().catch(() => ({}));
        setError(d.error || "Lưu thông tin phụ huynh thất bại");
        setLoading(false);
        return;
      }

      // 2) Optionally create child
      if (withChild && childName.trim()) {
        const cRes = await fetch("/api/account/children", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: childName.trim(),
            dateOfBirth: childDob || undefined,
            grade: grade || undefined,
            curriculum: curriculum || undefined,
            relationship,
          }),
        });
        if (!cRes.ok) {
          const d = await cRes.json().catch(() => ({}));
          setError(d.error || "Lưu thông tin con thất bại");
          setLoading(false);
          return;
        }
      }

      // 3) Mark onboarded
      await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarded: true }),
      });

      router.replace("/dashboard");
    } catch {
      setError("Không kết nối được máy chủ.");
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={28} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Hoàn tất hồ sơ</h1>
          <p className="text-muted mt-1.5">
            Bổ sung thông tin để bắt đầu sử dụng hệ sinh thái PTalk
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className={`h-2 w-8 rounded-full ${step === 1 ? "bg-accent" : "bg-accent/30"}`} />
            <span className={`h-2 w-8 rounded-full ${step === 2 ? "bg-accent" : "bg-accent/30"}`} />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {step === 1 ? (
          <div className="space-y-4 rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <User size={18} className="text-accent" /> Thông tin phụ huynh
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Họ và tên *</label>
              <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Ngày tháng năm sinh</label>
              <input type="date" className={inputCls} value={dob} onChange={(e) => setDob(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Số điện thoại</label>
              <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxx" inputMode="tel" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Gmail</label>
              <input className={`${inputCls} opacity-60 cursor-not-allowed`} value={email} readOnly />
            </div>

            <button
              onClick={goStep2}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors cursor-pointer"
            >
              Tiếp tục <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <div className="space-y-4 rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <Baby size={18} className="text-accent" /> Thông tin con
              <span className="text-xs font-normal text-muted">(có thể bỏ qua)</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Tên bé</label>
              <input className={inputCls} value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="Tên của con" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Ngày tháng năm sinh</label>
              <input type="date" className={inputCls} value={childDob} onChange={(e) => setChildDob(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Lớp</label>
              <select className={inputCls} value={grade} onChange={(e) => setGrade(e.target.value)}>
                <option value="">— Chọn lớp —</option>
                {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((g) => (
                  <option key={g} value={g}>{`Lớp ${g}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Chương trình học</label>
              <select className={inputCls} value={curriculum} onChange={(e) => setCurriculum(e.target.value)}>
                <option value="">— Chọn bộ sách —</option>
                {CURRICULA.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Quan hệ với bé</label>
              <select className={inputCls} value={relationship} onChange={(e) => setRelationship(e.target.value)}>
                {RELATIONSHIPS.map((r) => (
                  <option key={r.code} value={r.code}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => finish(false)}
                disabled={loading}
                className="flex-1 px-6 py-3 border border-border text-foreground hover:bg-foreground/5 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-60"
              >
                Để sau
              </button>
              <button
                onClick={() => finish(true)}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-60"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                {loading ? "Đang lưu..." : "Hoàn tất"}
              </button>
            </div>
            <button
              onClick={() => setStep(1)}
              disabled={loading}
              className="w-full text-sm text-muted hover:text-foreground transition-colors"
            >
              ← Quay lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
