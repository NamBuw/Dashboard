"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import {
  Settings,
  Bell,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Save,
  Radio,
  Zap,
  Shield,
  Plus,
  Trash2,
  Baby,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { BentoShell } from "@/components/bento";
import UsersChildrenPanel from "@/components/settings/UsersChildrenPanel";

interface SystemService {
  name: string;
  status: "healthy" | "unhealthy" | "warning";
  latency: number;
}

interface BannedWord {
  id: string;
  word: string;
  category: string;
  set_by_role: string;
  set_by_name: string | null;
  is_active: boolean;
  created_at: string;
  topic_id: string | null;
}

interface BannedTopic {
  id: string;
  topic: string;
  description: string | null;
  set_by_role: string;
  set_by_name: string | null;
  is_active: boolean;
  created_at: string;
  words: BannedWord[];
}

function SettingsContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  // Optional child scope: /settings?childId=<id> → manage THIS child's banned words.
  // A child is a users row, so its per-child rules are banned_words.parent_user_id=<id>.
  const childId = searchParams.get("childId");
  const [childName, setChildName] = useState<string | null>(null);
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [offlineThreshold, setOfflineThreshold] = useState(15);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const [services, setServices] = useState<SystemService[]>([]);
  const [loadingHealth, setLoadingHealth] = useState(true);

  // Banned words + topics state
  const [bannedWords, setBannedWords] = useState<BannedWord[]>([]);
  const [newWord, setNewWord] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [loadingWords, setLoadingWords] = useState(false);
  const [bannedTopics, setBannedTopics] = useState<BannedTopic[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [suggesting, setSuggesting] = useState(false);

  const isSuperUser = !!session?.user?.is_superuser;

  const fetchBannedWords = useCallback(async () => {
    setLoadingWords(true);
    try {
      // When scoped to a child, list only that child's per-child rules.
      const url = childId
        ? `/api/banned-words?child_id=${encodeURIComponent(childId)}`
        : "/api/banned-words";
      const res = await fetch(url);
      const data = await res.json();
      setBannedWords(data.words || []);
    } catch { /* ignore */ }
    setLoadingWords(false);
  }, [childId]);

  const fetchBannedTopics = useCallback(async () => {
    try {
      const res = await fetch("/api/banned-topics");
      const data = await res.json();
      setBannedTopics(data.topics || []);
    } catch { /* ignore */ }
  }, []);

  // Word edits can touch both the standalone list and a topic's word list → refresh both.
  const refreshAll = useCallback(() => {
    fetchBannedWords();
    fetchBannedTopics();
  }, [fetchBannedWords, fetchBannedTopics]);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  // Resolve the scoped child's display name for the banner (best-effort).
  useEffect(() => {
    if (!childId) { setChildName(null); return; }
    let alive = true;
    fetch(`/api/users/${childId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d?.user) setChildName(d.user.full_name || d.user.display_name || d.user.username || null);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [childId]);

  // Load saved alert rules + live service health (SuperAdmin only endpoints).
  useEffect(() => {
    if (!isSuperUser) { setLoadingHealth(false); return; }
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setOfflineThreshold(d.offlineThresholdMin ?? 15);
        setEmailAlerts(d.emailAlertsEnabled ?? true);
        setTelegramToken(d.telegramToken ?? "");
        setTelegramChatId(d.telegramChatId ?? "");
      })
      .catch(() => {});
    setLoadingHealth(true);
    fetch("/api/health")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.services) setServices(d.services); })
      .catch(() => {})
      .finally(() => setLoadingHealth(false));
  }, [isSuperUser]);

  const handleAddWord = async (topicId?: string) => {
    const value = topicId ? prompt("Thêm từ cấm vào chủ đề:")?.trim() : newWord.trim();
    if (!value) return;
    try {
      const res = await fetch("/api/banned-words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: value,
          category: topicId ? "general" : newCategory,
          // Child-scoped → always a per-child ('parent') rule on that child id.
          setByRole: childId ? "parent" : isSuperUser ? "admin" : "parent",
          parentUserId: childId || undefined,
          topicId: topicId || undefined,
        }),
      });
      if (res.ok) {
        if (!topicId) setNewWord("");
        refreshAll();
      }
    } catch { /* ignore */ }
  };

  const handleDeleteWord = async (id: string) => {
    if (!confirm("Xoá từ cấm này?")) return;
    try {
      const res = await fetch(`/api/banned-words?id=${id}`, { method: "DELETE" });
      if (res.ok) refreshAll();
    } catch { /* ignore */ }
  };

  // Bật/tắt mềm một từ cấm (CloudPTalk chỉ enforce các từ is_active = true).
  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch("/api/banned-words", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !isActive }),
      });
      if (res.ok) refreshAll();
    } catch { /* ignore */ }
  };

  // Đổi nhóm (category) của một từ cấm.
  const handleChangeCategory = async (id: string, category: string) => {
    try {
      const res = await fetch("/api/banned-words", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, category }),
      });
      if (res.ok) refreshAll();
    } catch { /* ignore */ }
  };

  // Nhập 1 chủ đề → Gemma gợi ý ~5 từ cấm → lưu + hiện.
  const handleSuggestTopic = async () => {
    if (!newTopic.trim()) return;
    setSuggesting(true);
    try {
      const res = await fetch("/api/banned-topics?action=suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: newTopic.trim(),
          setByRole: isSuperUser ? "admin" : "parent",
        }),
      });
      if (res.ok) {
        setNewTopic("");
        refreshAll();
      } else {
        const e = await res.json().catch(() => ({}));
        alert(e.error || "Không tạo được chủ đề");
      }
    } catch { /* ignore */ }
    setSuggesting(false);
  };

  const handleToggleTopic = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch("/api/banned-topics", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !isActive }),
      });
      if (res.ok) refreshAll();
    } catch { /* ignore */ }
  };

  const handleDeleteTopic = async (id: string) => {
    if (!confirm("Xoá chủ đề này và tất cả từ cấm thuộc nó?")) return;
    try {
      const res = await fetch(`/api/banned-topics?id=${id}&words=cascade`, { method: "DELETE" });
      if (res.ok) refreshAll();
    } catch { /* ignore */ }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offlineThresholdMin: offlineThreshold,
          emailAlertsEnabled: emailAlerts,
          telegramToken,
          telegramChatId,
        }),
      });
      alert(res.ok ? "Đã lưu cấu hình cảnh báo." : "Lưu thất bại (cần quyền Super Admin).");
    } catch {
      alert("Không kết nối được máy chủ.");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <BentoShell
      title="Cài đặt & Giám sát Hệ thống"
      sub="Cấu hình quy tắc cảnh báo sự cố và giám sát sức khỏe dịch vụ thời gian thực"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Settings Form Column-span-2 */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveSettings} className="glass-card rounded-2xl p-5 space-y-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Bell size={18} className="text-accent" />
              Thiết lập Quy tắc Cảnh báo (Alert Rules)
            </h2>

            <div className="space-y-4">
              {/* Threshold */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Ngưỡng thời gian xác định thiết bị Offline (Phút)
                </label>
                <input
                  type="number"
                  required
                  value={offlineThreshold}
                  onChange={(e) => setOfflineThreshold(parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 text-sm bg-black/20 border border-white/5 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
                <p className="text-[10px] text-muted mt-1">
                  Nếu robot mất kết nối WebSocket/MQTT quá số phút này, hệ thống sẽ tự động kích hoạt cảnh báo khẩn.
                </p>
              </div>

              {/* Email Switch */}
              <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Gửi thông báo qua Email</h4>
                  <p className="text-[10px] text-muted mt-0.5">Gửi báo cáo lỗi hệ thống hàng tuần và sự cố thiết bị khẩn.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailAlerts(!emailAlerts)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    emailAlerts ? "bg-success" : "bg-white/10"
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    emailAlerts ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Telegram Channel Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Radio size={12} className="text-accent" />
                  Kênh tích hợp Telegram Alert Bot
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-muted mb-1.5 uppercase font-bold tracking-wider">Telegram Token</label>
                    <input
                      type="text"
                      value={telegramToken}
                      onChange={(e) => setTelegramToken(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-black/20 border border-white/5 rounded-xl text-foreground focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted mb-1.5 uppercase font-bold tracking-wider">Chat ID (Group/Channel)</label>
                    <input
                      type="text"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-black/20 border border-white/5 rounded-xl text-foreground focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-white/5 flex justify-end">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg glow-accent disabled:opacity-50"
              >
                <Save size={16} />
                {savingSettings ? "Đang lưu…" : "Lưu cấu hình quy tắc"}
              </button>
            </div>
          </form>
        </div>

        {/* System Health Check Latency metrics Column-span-1 */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-lg font-bold text-foreground mb-1.5 flex items-center gap-2">
              <Activity size={18} className="text-accent" />
              Sức khoẻ Dịch vụ
            </h2>
            <p className="text-xs text-muted mb-6">Độ trễ phản hồi (Latency check) của các cổng dịch vụ microservices.</p>

            <div className="space-y-3.5">
              {loadingHealth && services.length === 0 && (
                <p className="text-xs text-muted">Đang kiểm tra dịch vụ…</p>
              )}
              {!loadingHealth && services.length === 0 && (
                <p className="text-xs text-muted">Không lấy được trạng thái dịch vụ (cần quyền Super Admin).</p>
              )}
              {services.map((srv, idx) => (
                <div key={idx} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${
                      srv.status === "healthy" ? "bg-success" : 
                      srv.status === "warning" ? "bg-warning animate-pulse" : "bg-danger"
                    }`} />
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{srv.name}</h4>
                      <span className="text-[10px] text-muted font-mono">{srv.latency} ms response</span>
                    </div>
                  </div>
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase ${
                    srv.status === "healthy" ? "bg-success/10 text-success border-success/20" :
                    srv.status === "warning" ? "bg-warning/10 text-warning border-warning/20" : "bg-danger/10 text-danger border-danger/20"
                  }`}>
                    {srv.status === "healthy" ? "Ổn định" : srv.status === "warning" ? "Độ trễ cao" : "Gián đoạn"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ═══════ Banned Words Management ═══════ */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
          <Shield size={18} className="text-danger" />
          Từ ngữ bị cấm
        </h2>

        {/* Child-scoped banner: rules below apply ONLY to the selected child. */}
        {childId && (
          <div className="flex items-center justify-between gap-3 mb-4 p-3 bg-accent/10 border border-accent/20 rounded-xl">
            <div className="flex items-center gap-2 min-w-0">
              <Baby size={15} className="text-accent shrink-0" />
              <p className="text-xs text-foreground min-w-0">
                Đang quản lý từ cấm cho{" "}
                <span className="font-bold">{childName || "bé"}</span>
                <span className="font-mono text-muted"> · ID {childId.substring(0, 8)}…</span>
              </p>
            </div>
            <Link
              href="/settings"
              className="flex items-center gap-1 text-[11px] font-bold text-muted hover:text-foreground transition-colors shrink-0"
            >
              <X size={12} /> Bỏ lọc
            </Link>
          </div>
        )}

        <p className="text-xs text-muted mb-4">
          {childId
            ? "Từ cấm thêm ở đây chỉ áp dụng cho riêng bé đã chọn."
            : isSuperUser
              ? "Quản lý từ cấm toàn hệ thống (Admin)"
              : "Thêm từ cấm cho con bạn (Phụ huynh)"}
        </p>

        {/* Add word form */}
        <div className="flex gap-2 mb-4">
          <input
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddWord()}
            placeholder="Nhập từ cần cấm..."
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-foreground focus:outline-none"
          >
            <option value="general">Chung</option>
            <option value="violence">Bạo lực</option>
            <option value="profanity">Vulgar</option>
            <option value="danger">Nguy hiểm</option>
          </select>
          <button
            onClick={() => handleAddWord()}
            disabled={!newWord.trim()}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium disabled:opacity-30 cursor-pointer"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Word list — standalone words only (topic words live in the topics card) */}
        <div className="space-y-2">
          {loadingWords && <p className="text-xs text-muted">Đang tải...</p>}
          {!loadingWords && bannedWords.filter((w) => !w.topic_id).length === 0 && (
            <p className="text-xs text-muted py-2">Chưa có từ nào bị cấm.</p>
          )}
          {bannedWords.filter((w) => !w.topic_id).map((w) => (
            <div
              key={w.id}
              className={clsx(
                "flex items-center justify-between p-2.5 bg-white/5 rounded-lg border border-white/5 transition-opacity",
                !w.is_active && "opacity-40"
              )}
            >
              <div className="flex items-center gap-3">
                <span className={clsx("text-sm font-medium text-foreground", !w.is_active && "line-through")}>
                  {w.word}
                </span>
                <select
                  value={w.category}
                  onChange={(e) => handleChangeCategory(w.id, e.target.value)}
                  className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-muted border border-white/5 focus:outline-none cursor-pointer"
                >
                  <option value="general">Chung</option>
                  <option value="violence">Bạo lực</option>
                  <option value="profanity">Vulgar</option>
                  <option value="danger">Nguy hiểm</option>
                </select>
                <span className={`text-[10px] px-2 py-0.5 rounded ${w.set_by_role === "admin" ? "bg-accent/20 text-accent" : "bg-purple/20 text-purple"}`}>
                  {w.set_by_role === "admin" ? "Admin" : "Phụ huynh"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Bật/tắt — chỉ từ đang bật mới được CloudPTalk áp dụng */}
                <button
                  type="button"
                  title={w.is_active ? "Đang áp dụng — bấm để tạm tắt" : "Đang tắt — bấm để bật lại"}
                  onClick={() => handleToggleActive(w.id, w.is_active)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    w.is_active ? "bg-success" : "bg-white/10"
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    w.is_active ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
                <button
                  onClick={() => handleDeleteWord(w.id)}
                  className="p-1 text-danger hover:bg-danger/10 rounded cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════ Banned Topics Management ═══════ */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
          <Shield size={18} className="text-warning" />
          Chủ đề bị cấm
        </h2>
        <p className="text-xs text-muted mb-4">
          Nhập một chủ đề (vd: bạo lực, ma tuý) — AI sẽ gợi ý các từ cấm liên quan. Bạn có thể sửa/thêm/bớt sau.
        </p>

        {/* Add topic form */}
        <div className="flex gap-2 mb-4">
          <input
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !suggesting && handleSuggestTopic()}
            placeholder="Nhập chủ đề cần cấm..."
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
          />
          <button
            onClick={handleSuggestTopic}
            disabled={!newTopic.trim() || suggesting}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium disabled:opacity-30 cursor-pointer whitespace-nowrap"
          >
            {suggesting ? "Đang hỏi AI..." : "Gợi ý từ AI"}
          </button>
        </div>

        {/* Topic list */}
        <div className="space-y-3">
          {bannedTopics.length === 0 && (
            <p className="text-xs text-muted py-2">Chưa có chủ đề nào bị cấm.</p>
          )}
          {bannedTopics.map((t) => (
            <div
              key={t.id}
              className={clsx(
                "p-3 bg-white/5 rounded-lg border border-white/5 transition-opacity",
                !t.is_active && "opacity-40"
              )}
            >
              {/* Topic header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={clsx("text-sm font-bold text-foreground", !t.is_active && "line-through")}>
                    {t.topic}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${t.set_by_role === "admin" ? "bg-accent/20 text-accent" : "bg-purple/20 text-purple"}`}>
                    {t.set_by_role === "admin" ? "Admin" : "Phụ huynh"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    title={t.is_active ? "Đang áp dụng — bấm để tạm tắt cả chủ đề" : "Đang tắt — bấm để bật lại"}
                    onClick={() => handleToggleTopic(t.id, t.is_active)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      t.is_active ? "bg-success" : "bg-white/10"
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      t.is_active ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                  <button
                    onClick={() => handleDeleteTopic(t.id)}
                    className="p-1 text-danger hover:bg-danger/10 rounded cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Topic words (chips) */}
              <div className="flex flex-wrap gap-2">
                {t.words.length === 0 && (
                  <span className="text-[11px] text-muted">Chưa có từ nào — bấm + để thêm.</span>
                )}
                {t.words.map((w) => (
                  <span
                    key={w.id}
                    className={clsx(
                      "inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-white/10 text-xs",
                      !w.is_active && "opacity-40 line-through"
                    )}
                  >
                    {w.word}
                    <button
                      type="button"
                      title={w.is_active ? "Tạm tắt từ này" : "Bật lại từ này"}
                      onClick={() => handleToggleActive(w.id, w.is_active)}
                      className={`w-2 h-2 rounded-full ${w.is_active ? "bg-success" : "bg-white/30"}`}
                    />
                    <button
                      onClick={() => handleDeleteWord(w.id)}
                      className="p-0.5 text-danger hover:bg-danger/10 rounded-full cursor-pointer"
                    >
                      <Trash2 size={11} />
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => handleAddWord(t.id)}
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent/20 text-accent hover:bg-accent/30 cursor-pointer"
                  title="Thêm từ vào chủ đề"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <UsersChildrenPanel />
    </BentoShell>
  );
}

// useSearchParams() requires a Suspense boundary (CSR bailout) — wrap the page.
export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  );
}
