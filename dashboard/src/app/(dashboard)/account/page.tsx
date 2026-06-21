"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Baby,
  AlertCircle,
  MessageSquare,
  Pencil,
  Check,
  X,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { BentoShell, BentoOuter } from "@/components/bento";

interface Parent {
  username: string;
  email: string;
  displayName: string | null;
  fullName: string | null;
  phone: string | null;
  dateOfBirth: string | null;
}
interface Child {
  id: string;
  username: string;
  fullName: string | null;
  grade: string | null;
  dateOfBirth: string | null;
  curriculum: string | null;
  relationship: string | null;
}

// Field option sets — mirror app/onboarding/page.tsx so the choices stay in lockstep.
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
const GRADES = Array.from({ length: 12 }, (_, i) => String(i + 1));

const CURRICULUM_LABEL: Record<string, string> = Object.fromEntries(
  CURRICULA.map((c) => [c.code, c.label]),
);
const RELATIONSHIP_LABEL: Record<string, string> = Object.fromEntries(
  RELATIONSHIPS.map((r) => [r.code, r.label]),
);

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: "1px solid var(--line)" }}>
      <span style={{ fontSize: 13, color: "var(--muted)" }}>{k}</span>
      <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600, textAlign: "right" }}>{v || "—"}</span>
    </div>
  );
}

// ── Shared field controls (Bento-styled) ────────────────────────────────────
const fieldWrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4, padding: "7px 0", borderBottom: "1px solid var(--line)" };
const fieldLabel: React.CSSProperties = { fontSize: 12, color: "var(--muted)" };
const fieldInput: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  fontSize: 13,
  background: "var(--inner-2)",
  border: "1px solid var(--btn-line)",
  borderRadius: 10,
  color: "var(--ink)",
  outline: "none",
};

function TextField({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <label style={fieldWrap}>
      <span style={fieldLabel}>{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={fieldInput} />
    </label>
  );
}

function SelectField({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { code: string; label: string }[]; placeholder?: string;
}) {
  return (
    <label style={fieldWrap}>
      <span style={fieldLabel}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={fieldInput}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.code} value={o.code}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

// Small icon-text button shared across edit affordances.
function IconBtn({ onClick, disabled, tone = "neutral", children }: {
  onClick: () => void; disabled?: boolean; tone?: "neutral" | "accent" | "danger";
  children: React.ReactNode;
}) {
  const colors =
    tone === "danger"
      ? { color: "var(--red)", border: "var(--red)" }
      : tone === "accent"
        ? { color: "#fff", border: "var(--blue)" }
        : { color: "var(--ink-2)", border: "var(--btn-line)" };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: 10,
        fontSize: 12.5,
        fontWeight: 600,
        cursor: disabled ? "default" : "pointer",
        border: "1px solid",
        borderColor: colors.border,
        background: tone === "accent" ? "var(--blue)" : "var(--inner)",
        color: colors.color,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

export default function AccountPage() {
  const { status } = useSession();
  const [parent, setParent] = useState<Parent | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pr, cr] = await Promise.all([
        fetch("/api/account/profile"),
        fetch("/api/account/children"),
      ]);
      if (!pr.ok) {
        setError(`Không tải được hồ sơ (lỗi ${pr.status}).`);
        return;
      }
      const pd = await pr.json();
      setParent(pd.profile);
      if (cr.ok) {
        const cd = await cr.json();
        setChildren(cd.children || []);
      }
    } catch {
      setError("Không kết nối được máy chủ.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status, load]);

  // ── Parent edit state ──
  const [editParent, setEditParent] = useState(false);
  const [pForm, setPForm] = useState({ fullName: "", dateOfBirth: "", phone: "" });
  const [pSaving, setPSaving] = useState(false);
  const [pError, setPError] = useState<string | null>(null);

  const startParentEdit = () => {
    setPForm({
      fullName: parent?.fullName || "",
      dateOfBirth: parent?.dateOfBirth || "",
      phone: parent?.phone || "",
    });
    setPError(null);
    setEditParent(true);
  };

  const saveParent = async () => {
    setPSaving(true);
    setPError(null);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: pForm.fullName.trim(),
          dateOfBirth: pForm.dateOfBirth || "",
          phone: pForm.phone || "",
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPError(d.error || "Lưu thất bại");
        return;
      }
      setEditParent(false);
      await load();
    } catch {
      setPError("Không kết nối được máy chủ.");
    } finally {
      setPSaving(false);
    }
  };

  // ── Child edit state (one child at a time) ──
  const [editChildId, setEditChildId] = useState<string | null>(null);
  const [cForm, setCForm] = useState({
    fullName: "", dateOfBirth: "", grade: "", curriculum: "", relationship: "guardian",
  });
  const [cSaving, setCSaving] = useState(false);
  const [cError, setCError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const startChildEdit = (c: Child) => {
    setCForm({
      fullName: c.fullName || "",
      dateOfBirth: c.dateOfBirth || "",
      grade: c.grade || "",
      curriculum: c.curriculum || "",
      relationship: c.relationship || "guardian",
    });
    setCError(null);
    setEditChildId(c.id);
  };

  const saveChild = async (id: string) => {
    setCSaving(true);
    setCError(null);
    try {
      const res = await fetch(`/api/account/children/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: cForm.fullName.trim(),
          dateOfBirth: cForm.dateOfBirth || "",
          grade: cForm.grade || "",
          curriculum: cForm.curriculum || "",
          relationship: cForm.relationship,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCError(d.error || "Lưu thất bại");
        return;
      }
      setEditChildId(null);
      await load();
    } catch {
      setCError("Không kết nối được máy chủ.");
    } finally {
      setCSaving(false);
    }
  };

  const deleteChild = async (id: string) => {
    if (!confirm("Xoá hồ sơ con này? Hành động không thể hoàn tác.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/account/children/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (editChildId === id) setEditChildId(null);
        await load();
      }
    } catch {
      /* ignore */
    } finally {
      setDeletingId(null);
    }
  };

  // ── Add child state ──
  const [adding, setAdding] = useState(false);
  const [aForm, setAForm] = useState({
    fullName: "", dateOfBirth: "", grade: "", curriculum: "", relationship: "guardian",
  });
  const [aSaving, setASaving] = useState(false);
  const [aError, setAError] = useState<string | null>(null);

  const startAdd = () => {
    setAForm({ fullName: "", dateOfBirth: "", grade: "", curriculum: "", relationship: "guardian" });
    setAError(null);
    setAdding(true);
  };

  const saveAdd = async () => {
    if (!aForm.fullName.trim()) {
      setAError("Vui lòng nhập tên bé");
      return;
    }
    setASaving(true);
    setAError(null);
    try {
      const res = await fetch("/api/account/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: aForm.fullName.trim(),
          dateOfBirth: aForm.dateOfBirth || undefined,
          grade: aForm.grade || undefined,
          curriculum: aForm.curriculum || undefined,
          relationship: aForm.relationship,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAError(d.error || "Lưu thất bại");
        return;
      }
      setAdding(false);
      await load();
    } catch {
      setAError("Không kết nối được máy chủ.");
    } finally {
      setASaving(false);
    }
  };

  return (
    <BentoShell title="Tài khoản của tôi" sub="Quản lý thông tin cá nhân & hồ sơ các con">
      {loading ? (
        <div className="bento-inner skeleton" style={{ height: 200 }} />
      ) : error ? (
        <BentoOuter title="Hồ sơ" sub="Lỗi">
          <div className="bento-inner" style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--red)" }}>
            <AlertCircle size={18} /> {error}
          </div>
        </BentoOuter>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 5fr) minmax(0, 7fr)", gap: 22, alignItems: "start" }}>
          {/* Parent */}
          <BentoOuter
            title="Thông tin phụ huynh"
            sub="Chủ tài khoản"
            right={
              !editParent ? (
                <IconBtn onClick={startParentEdit}>
                  <Pencil size={13} /> Sửa
                </IconBtn>
              ) : (
                <div style={{ display: "flex", gap: 6 }}>
                  <IconBtn onClick={saveParent} disabled={pSaving} tone="accent">
                    {pSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Lưu
                  </IconBtn>
                  <IconBtn onClick={() => setEditParent(false)} disabled={pSaving}>
                    <X size={13} /> Huỷ
                  </IconBtn>
                </div>
              )
            }
          >
            <div className="bento-inner">
              {editParent ? (
                <>
                  <TextField label="Họ và tên" value={pForm.fullName} onChange={(v) => setPForm({ ...pForm, fullName: v })} placeholder="Nguyễn Văn A" />
                  <TextField label="Ngày sinh" type="date" value={pForm.dateOfBirth} onChange={(v) => setPForm({ ...pForm, dateOfBirth: v })} />
                  <TextField label="Số điện thoại" value={pForm.phone} onChange={(v) => setPForm({ ...pForm, phone: v })} placeholder="09xxxxxxxx" />
                  <Row k="Gmail" v={parent?.email} />
                  {pError && <div style={{ fontSize: 12, color: "var(--red)", marginTop: 8 }}>{pError}</div>}
                </>
              ) : (
                <>
                  <Row k="Họ và tên" v={parent?.fullName || parent?.displayName} />
                  <Row k="Ngày sinh" v={parent?.dateOfBirth} />
                  <Row k="Số điện thoại" v={parent?.phone} />
                  <Row k="Gmail" v={parent?.email} />
                </>
              )}
            </div>
          </BentoOuter>

          {/* Children */}
          <BentoOuter
            title={`Thông tin con (${children.length})`}
            sub="Hồ sơ học sinh"
            right={
              !adding && (
                <IconBtn onClick={startAdd} tone="accent">
                  <Plus size={13} /> Thêm con
                </IconBtn>
              )
            }
          >
            <div className="bento-inner" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Add-child inline form */}
              {adding && (
                <div className="anim-rise" style={{ border: "1px dashed var(--btn-line)", borderRadius: 12, padding: "8px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 13.5, color: "var(--ink)", marginBottom: 4 }}>
                    <Baby size={15} style={{ color: "var(--blue)" }} /> Hồ sơ con mới
                  </div>
                  <TextField label="Tên bé" value={aForm.fullName} onChange={(v) => setAForm({ ...aForm, fullName: v })} placeholder="Tên của con" />
                  <TextField label="Ngày sinh" type="date" value={aForm.dateOfBirth} onChange={(v) => setAForm({ ...aForm, dateOfBirth: v })} />
                  <SelectField label="Lớp" value={aForm.grade} onChange={(v) => setAForm({ ...aForm, grade: v })} placeholder="— Chọn lớp —" options={GRADES.map((g) => ({ code: g, label: `Lớp ${g}` }))} />
                  <SelectField label="Chương trình học" value={aForm.curriculum} onChange={(v) => setAForm({ ...aForm, curriculum: v })} placeholder="— Chọn bộ sách —" options={CURRICULA} />
                  <SelectField label="Quan hệ" value={aForm.relationship} onChange={(v) => setAForm({ ...aForm, relationship: v })} options={RELATIONSHIPS} />
                  {aError && <div style={{ fontSize: 12, color: "var(--red)", marginTop: 8 }}>{aError}</div>}
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    <IconBtn onClick={saveAdd} disabled={aSaving} tone="accent">
                      {aSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Lưu
                    </IconBtn>
                    <IconBtn onClick={() => setAdding(false)} disabled={aSaving}>
                      <X size={13} /> Huỷ
                    </IconBtn>
                  </div>
                </div>
              )}

              {children.length === 0 && !adding ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--muted)", padding: 24 }}>
                  <Baby size={34} style={{ color: "var(--faint)", marginBottom: 8 }} strokeWidth={1.5} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Chưa có hồ sơ con</div>
                  <p style={{ fontSize: 12, marginTop: 4 }}>Nhấn “Thêm con” để bổ sung.</p>
                </div>
              ) : (
                children.map((c) => {
                  const editing = editChildId === c.id;
                  return (
                    <div key={c.id} className="anim-rise">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 13.5, color: "var(--ink)" }}>
                          <Baby size={15} style={{ color: "var(--blue)" }} /> {c.fullName || "Bé"}
                        </div>
                        {!editing ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <IconBtn onClick={() => startChildEdit(c)}>
                              <Pencil size={13} /> Sửa
                            </IconBtn>
                            <IconBtn onClick={() => deleteChild(c.id)} disabled={deletingId === c.id} tone="danger">
                              {deletingId === c.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Xoá
                            </IconBtn>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: 6 }}>
                            <IconBtn onClick={() => saveChild(c.id)} disabled={cSaving} tone="accent">
                              {cSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Lưu
                            </IconBtn>
                            <IconBtn onClick={() => setEditChildId(null)} disabled={cSaving}>
                              <X size={13} /> Huỷ
                            </IconBtn>
                          </div>
                        )}
                      </div>

                      {editing ? (
                        <>
                          <TextField label="Họ và tên" value={cForm.fullName} onChange={(v) => setCForm({ ...cForm, fullName: v })} placeholder="Tên của con" />
                          <TextField label="Ngày sinh" type="date" value={cForm.dateOfBirth} onChange={(v) => setCForm({ ...cForm, dateOfBirth: v })} />
                          <SelectField label="Lớp" value={cForm.grade} onChange={(v) => setCForm({ ...cForm, grade: v })} placeholder="— Chọn lớp —" options={GRADES.map((g) => ({ code: g, label: `Lớp ${g}` }))} />
                          <SelectField label="Chương trình học" value={cForm.curriculum} onChange={(v) => setCForm({ ...cForm, curriculum: v })} placeholder="— Chọn bộ sách —" options={CURRICULA} />
                          <SelectField label="Quan hệ" value={cForm.relationship} onChange={(v) => setCForm({ ...cForm, relationship: v })} options={RELATIONSHIPS} />
                          {cError && <div style={{ fontSize: 12, color: "var(--red)", marginTop: 8 }}>{cError}</div>}
                        </>
                      ) : (
                        <>
                          <Row k="Ngày sinh" v={c.dateOfBirth} />
                          <Row k="Lớp" v={c.grade ? `Lớp ${c.grade}` : null} />
                          <Row k="Chương trình học" v={c.curriculum ? CURRICULUM_LABEL[c.curriculum] || c.curriculum : null} />
                          <Row k="Quan hệ" v={c.relationship ? RELATIONSHIP_LABEL[c.relationship] || c.relationship : null} />
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </BentoOuter>
        </div>
      )}

      <Link
        href="/chats"
        style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 12, background: "var(--chip)", color: "var(--chip-fg)", fontSize: 13, fontWeight: 600, textDecoration: "none", width: "fit-content" }}
      >
        <MessageSquare size={16} /> Xem lịch sử chat KidMentor
      </Link>
    </BentoShell>
  );
}
