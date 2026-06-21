"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Users, ChevronDown, ChevronRight, Search, Baby, Shield, Loader2,
} from "lucide-react";

interface UserLite {
  id: string; username: string; email: string; displayName: string | null;
  userType: string; tier: string; isActive: boolean; isSuperuser: boolean; createdAt: string;
}
interface Child {
  id: string; username: string; fullName: string | null; grade: string | null;
  dateOfBirth: string | null; hometown: string | null; curriculum: string | null;
  relationship: string | null;
}
interface UserInfo {
  id: string; username: string; email: string | null; display_name: string | null;
  user_type: string | null; subscription_tier: string | null; is_active: boolean;
  is_superuser: boolean; created_at: string; full_name: string | null; phone_number: string | null;
}
interface Detail { user: UserInfo; children: Child[] }

const CURRICULUM_LABEL: Record<string, string> = {
  chan_troi_sang_tao: "Chân trời sáng tạo",
  canh_dieu: "Cánh diều",
  ket_noi_tri_thuc: "Kết nối tri thức",
};
const RELATIONSHIP_LABEL: Record<string, string> = {
  father: "Bố", mother: "Mẹ", grandparent: "Ông/Bà", guardian: "Người giám hộ", other: "Khác",
};

function label(map: Record<string, string>, code: string | null): string {
  if (!code) return "—";
  return map[code] ?? code;
}

function fmtDate(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("vi-VN");
}

function ageFromDob(dob: string | null): string {
  if (!dob) return "—";
  const d = new Date(dob);
  if (isNaN(d.getTime())) return "—";
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 ? `${age} tuổi` : "—";
}

function InfoCell({ label: l, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">{l}</div>
      <div className="text-sm text-foreground mt-0.5 break-words">{value ?? "—"}</div>
    </div>
  );
}

function ChildCard({ c }: { c: Child }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-7 h-7 rounded-lg bg-accent-muted text-accent flex items-center justify-center shrink-0">
          <Baby size={15} />
        </span>
        <div className="font-semibold text-foreground text-sm">{c.fullName || c.username}</div>
        {c.relationship && (
          <span className="ml-auto text-[11px] font-medium px-2 py-0.5 rounded-md bg-surface text-muted-foreground">
            {label(RELATIONSHIP_LABEL, c.relationship)}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
        <InfoCell label="Tài khoản" value={<span className="font-mono text-xs">{c.username}</span>} />
        <InfoCell label="Lớp" value={c.grade} />
        <InfoCell label="Tuổi" value={ageFromDob(c.dateOfBirth)} />
        <InfoCell label="Ngày sinh" value={fmtDate(c.dateOfBirth)} />
        <InfoCell label="Quê quán" value={c.hometown} />
        <InfoCell label="Bộ sách" value={label(CURRICULUM_LABEL, c.curriculum)} />
      </div>
    </div>
  );
}

function DetailView({ detail }: { detail: Detail }) {
  const u = detail.user;
  return (
    <div className="space-y-4">
      {/* User info */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3">
        <InfoCell label="Tên hiển thị" value={u.display_name || u.full_name || u.username} />
        <InfoCell label="Tài khoản" value={<span className="font-mono text-xs">{u.username}</span>} />
        <InfoCell label="Email" value={u.email} />
        <InfoCell label="Số điện thoại" value={u.phone_number} />
        <InfoCell label="Loại tài khoản" value={u.user_type} />
        <InfoCell label="Gói" value={u.subscription_tier || "basic"} />
        <InfoCell
          label="Trạng thái"
          value={
            <span className={u.is_active ? "text-success" : "text-muted"}>
              {u.is_active ? "Đang hoạt động" : "Đã khoá"}
            </span>
          }
        />
        <InfoCell label="Ngày tạo" value={fmtDate(u.created_at)} />
      </div>

      {/* Children */}
      <div>
        <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-foreground">
          <Baby size={15} className="text-accent" />
          Các bé ({detail.children.length})
        </div>
        {detail.children.length === 0 ? (
          <div className="text-sm text-muted">Chưa có hồ sơ bé nào.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {detail.children.map((c) => <ChildCard key={c.id} c={c} />)}
          </div>
        )}
      </div>
    </div>
  );
}

/** Lazy-loaded detail for one user (admin expand). */
function useDetail(id: string | null) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true); setError(null);
    fetch(`/api/users/${id}/children`)
      .then((r) => r.ok ? r.json() : Promise.reject(new Error("load")))
      .then((d) => { if (alive) setDetail(d); })
      .catch(() => { if (alive) setError("Không tải được thông tin."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);
  return { detail, loading, error };
}

function UserRow({ u }: { u: UserLite }) {
  const [open, setOpen] = useState(false);
  const { detail, loading, error } = useDetail(open ? u.id : null);
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface transition-colors"
      >
        {open ? <ChevronDown size={16} className="text-muted shrink-0" /> : <ChevronRight size={16} className="text-muted shrink-0" />}
        <span className="w-8 h-8 rounded-lg bg-surface text-muted-foreground flex items-center justify-center text-xs font-bold shrink-0">
          {(u.displayName || u.username || "?").slice(0, 2).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-foreground truncate">
            {u.displayName || u.username}
            {u.isSuperuser && <Shield size={12} className="inline ml-1.5 -mt-0.5 text-accent" />}
          </span>
          <span className="block text-xs text-muted truncate">{u.email}</span>
        </span>
        <span className="ml-auto text-[11px] font-medium px-2 py-0.5 rounded-md bg-surface text-muted-foreground shrink-0">
          {u.tier || "basic"}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border bg-card">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted py-3"><Loader2 size={15} className="animate-spin" /> Đang tải…</div>
          ) : error ? (
            <div className="text-sm text-danger py-3">{error}</div>
          ) : detail ? (
            <div className="pt-3"><DetailView detail={detail} /></div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function UsersChildrenPanel() {
  const { data: session } = useSession();
  const isSuper = !!session?.user?.is_superuser;
  const ownId = session?.user?.id ?? null;

  // ── Admin: searchable user list ──
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<UserLite[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const loadUsers = useCallback(async (term: string) => {
    setListLoading(true); setListError(null);
    try {
      const res = await fetch(`/api/users?limit=50&search=${encodeURIComponent(term)}`);
      if (!res.ok) throw new Error("load");
      const d = await res.json();
      setUsers(d.users || []);
    } catch {
      setListError("Không tải được danh sách người dùng.");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSuper) return;
    const t = setTimeout(() => loadUsers(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q, isSuper, loadUsers]);

  // ── Non-admin: own detail ──
  const { detail, loading: selfLoading, error: selfError } = useDetail(!isSuper ? ownId : null);

  return (
    <section className="glass-card rounded-2xl p-5">
      <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-1.5">
        <Users size={18} className="text-accent" />
        Người dùng & Bé
      </h2>
      <p className="text-sm text-muted mb-4">
        {isSuper
          ? "Tra cứu người dùng và xem hồ sơ các bé liên kết (chỉ đọc)."
          : "Thông tin tài khoản của bạn và các bé đã đăng ký."}
      </p>

      {isSuper ? (
        <>
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên, email, tài khoản…"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          {listLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted py-3"><Loader2 size={15} className="animate-spin" /> Đang tải…</div>
          ) : listError ? (
            <div className="text-sm text-danger py-3">{listError}</div>
          ) : users.length === 0 ? (
            <div className="text-sm text-muted py-3">Không có người dùng phù hợp.</div>
          ) : (
            <div className="space-y-2">
              {users.map((u) => <UserRow key={u.id} u={u} />)}
            </div>
          )}
        </>
      ) : selfLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted py-3"><Loader2 size={15} className="animate-spin" /> Đang tải…</div>
      ) : selfError ? (
        <div className="text-sm text-danger py-3">{selfError}</div>
      ) : detail ? (
        <DetailView detail={detail} />
      ) : null}
    </section>
  );
}
