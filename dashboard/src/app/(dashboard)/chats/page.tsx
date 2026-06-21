"use client";

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  MessageSquare,
  AlertCircle,
  Send,
  Bot,
  Smartphone,
  Inbox,
  Users as UsersIcon,
  Activity,
  Layers,
  FileJson,
  FileSpreadsheet,
  FileText,
  FileCode,
  Heart,
} from "lucide-react";
import {
  BentoShell,
  BentoOuter,
  BentoStat,
  BentoDonut,
  BentoLegend,
  BentoSpark,
} from "@/components/bento";
import { useProduct, productToChatSource } from "@/components/ProductProvider";
import ChatMarkdown from "@/components/ChatMarkdown";
import { exportCsv, exportHtml, exportJson, exportTxt } from "./exporters";

interface ChatSession {
  id: string;
  productSource: string;
  title: string;
  messageCount: number;
  startedAt: string;
  lastMessageAt: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  sentiment: string | null;
  createdAt: string;
}

interface ApiUser {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  userType: string;
  tier: string;
  isActive: boolean;
  isSuperuser: boolean;
  createdAt: string;
}

interface ChatLog {
  id: string;
  user_id: string;
  sender: string;
  message: string;
  sentiment: string;
  source: string;
  session_id?: string | null;
  channel?: string | null;
  created_at: string;
}

const sourceLabel: Record<string, string> = {
  kids: "Kid Mentor",
  eldercare: "Elder Kare",
  app: "Ứng dụng",
};

const sourceColor: Record<string, string> = {
  kids: "var(--amber)",
  eldercare: "var(--green)",
  app: "var(--sky)",
};

const pad = (n: number) => String(n).padStart(2, "0");
const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
// Group key for a turn: its real pipeline session, else its calendar day.
const sessionKeyOf = (l: ChatLog) =>
  l.session_id ? `s:${l.session_id}` : `d:${dayKey(l.created_at)}`;

// Guard against the same DB row appearing twice in a list (duplicate React keys
// / accidental double render).
function dedupeById<T extends { id: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of arr) {
    if (!seen.has(x.id)) { seen.add(x.id); out.push(x); }
  }
  return out;
}

function ChatManagementPage() {
  const { data: session } = useSession();
  const { active: activeProduct } = useProduct();
  const searchParams = useSearchParams();
  // Deep-link target: /chats?userId=<id> (e.g. from the Users modal "view child's chat").
  const targetUserId = searchParams.get("userId");

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);

  const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterTier, setFilterTier] = useState("all");

  const [newMessage, setNewMessage] = useState("");
  const [simSender, setSimSender] = useState("user");
  const [simSentiment, setSimSentiment] = useState("neutral");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [chatSource, setChatSource] = useState<"robot" | "app">("app");

  const [appSessions, setAppSessions] = useState<ChatSession[]>([]);
  const [appLogs, setAppLogs] = useState<ChatLog[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [appMessages, setAppMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Per-day "sessions" for the App Chat tab are derived client-side from /api/chat
  // (cookie-authed, RBAC-enforced). The /api/v1/chat/* endpoints are a mobile-only
  // Bearer-token contract and 401 from the browser, so we don't use them here.
  // Raw logs grouped by session id (`userId_YYYY-MM-DD`) for the message view.
  const appLogsBySession = useRef<Record<string, ChatLog[]>>({});

  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Fetch users ──
  const fetchUsersList = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/users?limit=100");
      const data = await res.json();
      const fetched: ApiUser[] = data.users || [];

      // Deep-link: if /chats?userId=<id> targets a user not in the (page-limited) list,
      // fetch that single user so it can be selected + shown (e.g. a specific child).
      let list = fetched;
      if (targetUserId && !fetched.some((u) => u.id === targetUserId)) {
        try {
          const r = await fetch(`/api/users/${targetUserId}`);
          if (r.ok) {
            const d2 = await r.json();
            const u = d2.user;
            if (u) {
              list = [
                {
                  id: u.id,
                  username: u.username,
                  email: u.email,
                  displayName: u.display_name ?? null,
                  userType: u.user_type ?? "child",
                  tier: u.subscription_tier ?? "basic",
                  isActive: !!u.is_active,
                  isSuperuser: !!u.is_superuser,
                  createdAt: u.created_at,
                },
                ...fetched,
              ];
            }
          }
        } catch { /* fall through to default selection */ }
      }

      setUsers(list);
      if (list.length > 0) {
        const target = targetUserId ? list.find((u) => u.id === targetUserId) : null;
        if (target) {
          setSelectedUser(target);
        } else {
          const isSuper = !!session?.user?.is_superuser;
          if (!isSuper) {
            const child = list.find((u) => u.userType === "child");
            setSelectedUser(child || list[0]);
          } else {
            setSelectedUser(list[0]);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load users for chats", err);
    } finally {
      setLoadingUsers(false);
    }
  }, [session, targetUserId]);

  useEffect(() => { fetchUsersList(); }, [fetchUsersList]);

  // ── Fetch chat history (filtered by dome product) ──
  const fetchChatsForUser = useCallback(async (userId: string, source: string | null) => {
    setLoadingChats(true);
    setChatError(null);
    try {
      const params = new URLSearchParams({ userId, channel: "robot" });
      if (source) params.set("source", source);
      const res = await fetch(`/api/chat?${params.toString()}`);
      if (!res.ok) {
        setChatLogs([]);
        setChatError(
          res.status === 403
            ? "Bạn không có quyền xem lịch sử của tài khoản này."
            : `Không tải được lịch sử (lỗi ${res.status}).`,
        );
        return;
      }
      const data = await res.json();
      setChatLogs(dedupeById(data.chatLogs || []));
    } catch (err) {
      console.error("Failed to fetch chats", err);
      setChatLogs([]);
      setChatError("Không kết nối được máy chủ.");
    } finally {
      setLoadingChats(false);
    }
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchChatsForUser(selectedUser.id, productToChatSource(activeProduct));
    } else {
      setChatLogs([]);
    }
  }, [selectedUser, activeProduct, fetchChatsForUser]);

  // ── App sessions (channel='app', grouped by pipeline session / day) ──
  const fetchAppSessions = useCallback(async (userId: string) => {
    setLoadingSessions(true);
    setAppError(null);
    try {
      const res = await fetch(`/api/chat?userId=${encodeURIComponent(userId)}&channel=app`);
      if (!res.ok) {
        setAppLogs([]);
        setAppSessions([]);
        appLogsBySession.current = {};
        setAppError(
          res.status === 403
            ? "Bạn không có quyền xem lịch sử của tài khoản này."
            : `Không tải được phiên (lỗi ${res.status}).`,
        );
        return;
      }
      const data = await res.json();
      const logs: ChatLog[] = dedupeById(data.chatLogs || []);
      setAppLogs(logs);

      // Group into real conversation sessions by the pipeline session_id; fall back
      // to per-day grouping for legacy rows written before the session_id column.
      const groups: Record<string, ChatLog[]> = {};
      for (const l of logs) {
        const d = new Date(l.created_at);
        if (Number.isNaN(d.getTime())) continue;
        (groups[`${userId}::${sessionKeyOf(l)}`] ||= []).push(l);
      }
      appLogsBySession.current = groups;

      const sessions: ChatSession[] = Object.entries(groups)
        .map(([id, ls]) => {
          const sorted = [...ls].sort(
            (a, b) =>
              (+new Date(a.created_at) - +new Date(b.created_at)) ||
              ((a.sender === "user" ? 0 : 1) - (b.sender === "user" ? 0 : 1)),
          );
          const first = sorted[0];
          const last = sorted[sorted.length - 1];
          return {
            id,
            productSource: sourceLabel[last.source] ?? "Ứng dụng",
            title: first.session_id
              ? `Phiên ${new Date(first.created_at).toLocaleString("vi-VN")}`
              : `Ngày ${new Date(first.created_at).toLocaleDateString("vi-VN")}`,
            messageCount: ls.length,
            startedAt: first.created_at,
            lastMessageAt: last.created_at,
          };
        })
        .sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt));

      setAppSessions(sessions);
    } catch (err) {
      console.error("Failed to fetch app sessions", err);
      setAppSessions([]);
      setAppLogs([]);
      setAppError("Không kết nối được máy chủ.");
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  const fetchSessionMessages = useCallback((sessionId: string) => {
    setLoadingMessages(true);
    const logs = [...(appLogsBySession.current[sessionId] || [])].sort(
      (a, b) =>
        (+new Date(a.created_at) - +new Date(b.created_at)) ||
        ((a.sender === "user" ? 0 : 1) - (b.sender === "user" ? 0 : 1)),
    );
    setAppMessages(
      logs.map((l) => ({
        id: l.id,
        sender: l.sender,
        content: l.message,
        sentiment: l.sentiment,
        createdAt: l.created_at,
      })),
    );
    setLoadingMessages(false);
  }, []);

  useEffect(() => {
    if (selectedUser && chatSource === "app") {
      fetchAppSessions(selectedUser.id);
      setSelectedSession(null);
      setAppMessages([]);
    }
  }, [selectedUser, chatSource, fetchAppSessions]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLogs, appMessages]);

  // ── Filtered user list ──
  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (u.username || "").toLowerCase().includes(term) ||
      (u.displayName || "").toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term);
    const matchesType = filterType === "all" || u.userType === filterType;
    const matchesTier = filterTier === "all" || u.tier === filterTier;
    return matchesSearch && matchesType && matchesTier;
  });

  // ── Simulator post ──
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newMessage.trim()) return;
    setSendingMessage(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          sender: simSender,
          message: newMessage.trim(),
          sentiment: simSentiment,
          channel: "robot", // simulator lives on the Robot tab
        }),
      });
      if (!res.ok) throw new Error("Failed to save conversation log");
      setNewMessage("");
      await fetchChatsForUser(selectedUser.id, productToChatSource(activeProduct));
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định");
    } finally {
      setSendingMessage(false);
    }
  };

  // Active dataset = the tab currently being viewed (robot logs vs app logs), so
  // the KPIs and bottom charts reflect what's on screen.
  const activeLogs = chatSource === "robot" ? chatLogs : appLogs;

  // ── Derived aggregates for KPI strip (scoped to active tab + selected user) ──
  const aggregates = useMemo(() => {
    const total = activeLogs.length;
    const userTurns = activeLogs.filter((l) => l.sender === "user").length;
    const positive = activeLogs.filter((l) => l.sentiment === "positive").length;
    return {
      total,
      userTurns,
      positivePct: total ? Math.round((positive / total) * 100) : 0,
      sessions: new Set(activeLogs.map(sessionKeyOf)).size,
    };
  }, [activeLogs]);

  // ── Source distribution donut data ──
  const sourceDonut = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of activeLogs) {
      const s = l.source || "app";
      counts[s] = (counts[s] || 0) + 1;
    }
    return Object.entries(counts).map(([k, v]) => ({
      l: sourceLabel[k] ?? k,
      v,
      c: sourceColor[k] ?? "var(--slate)",
    }));
  }, [activeLogs]);

  // ── Hourly buckets (0-23) ──
  const hourly = useMemo(() => {
    const buckets = Array(24).fill(0);
    for (const l of activeLogs) {
      const h = new Date(l.created_at).getHours();
      if (Number.isFinite(h) && h >= 0 && h < 24) buckets[h]++;
    }
    return buckets;
  }, [activeLogs]);

  const sourceTotal = sourceDonut.reduce((s, d) => s + d.v, 0);

  return (
    <BentoShell
      title="Lịch sử Chat"
      sub={`Nhật ký hội thoại · ${activeProduct === "all" ? "toàn hệ sinh thái" : sourceLabel[productToChatSource(activeProduct) ?? "app"] ?? "ứng dụng"}`}
    >
      {/* KPI row */}
      <div className="stagger grid-kpi">
        <BentoStat icon={Inbox} label="Số phiên" value={aggregates.sessions.toLocaleString("vi")} delta={chatSource === "robot" ? "robot" : "app"} deltaTone="neutral" />
        <BentoStat icon={Activity} label="Tổng tin nhắn" value={aggregates.total.toLocaleString("vi")} delta="trong phạm vi" deltaTone="neutral" />
        <BentoStat icon={UsersIcon} label="Lượt người dùng hỏi" value={aggregates.userTurns.toLocaleString("vi")} delta="câu hỏi" deltaTone="neutral" />
        <BentoStat icon={Heart} label="Cảm xúc tích cực" value={`${aggregates.positivePct}%`} delta="trên tổng" deltaTone="neutral" />
      </div>

      {/* Source tab */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => setChatSource("robot")}
          type="button"
          style={{
            padding: "10px 18px",
            borderRadius: 14,
            fontSize: 12.5,
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            border: "1px solid",
            borderColor: chatSource === "robot" ? "var(--blue)" : "var(--btn-line)",
            background: chatSource === "robot" ? "color-mix(in srgb, var(--blue) 12%, var(--inner))" : "var(--inner)",
            color: chatSource === "robot" ? "var(--blue)" : "var(--ink-2)",
          }}
        >
          <Bot size={14} strokeWidth={1.8} />
          Robot
        </button>
        <button
          onClick={() => setChatSource("app")}
          type="button"
          style={{
            padding: "10px 18px",
            borderRadius: 14,
            fontSize: 12.5,
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            border: "1px solid",
            borderColor: chatSource === "app" ? "var(--blue)" : "var(--btn-line)",
            background: chatSource === "app" ? "color-mix(in srgb, var(--blue) 12%, var(--inner))" : "var(--inner)",
            color: chatSource === "app" ? "var(--blue)" : "var(--ink-2)",
          }}
        >
          <Smartphone size={14} strokeWidth={1.8} />
          App
        </button>
      </div>

      {/* Main split */}
      <div className="split-4-8">
        {/* User list */}
        <BentoOuter title="Danh sách tài khoản" sub="Tìm và chọn người dùng để xem nhật ký">
          <div className="bento-inner" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ position: "relative" }}>
              <Search size={15} strokeWidth={1.8} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên, username hoặc email…"
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 36px",
                  fontSize: 13,
                  background: "var(--inner-2)",
                  border: "1px solid var(--btn-line)",
                  borderRadius: 12,
                  color: "var(--ink)",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{ padding: "8px 10px", fontSize: 12, background: "var(--inner-2)", border: "1px solid var(--btn-line)", borderRadius: 10, color: "var(--ink)" }}
              >
                <option value="all">Mọi đối tượng</option>
                <option value="child">Trẻ em</option>
                <option value="owner">Người nhà</option>
              </select>
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                style={{ padding: "8px 10px", fontSize: 12, background: "var(--inner-2)", border: "1px solid var(--btn-line)", borderRadius: 10, color: "var(--ink)" }}
              >
                <option value="all">Mọi tier</option>
                <option value="admin">Admin</option>
                <option value="ultra">Ultra</option>
                <option value="pro">Pro</option>
                <option value="basic">Basic</option>
              </select>
            </div>

            <div className="stagger" style={{ flex: 1, overflowY: "auto", maxHeight: 460, display: "flex", flexDirection: "column", gap: 6 }}>
              {loadingUsers ? (
                <div style={{ padding: 32, textAlign: "center", fontSize: 12, color: "var(--muted)" }}>Đang nạp…</div>
              ) : filteredUsers.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", fontSize: 12, color: "var(--muted)" }}>Không tìm thấy</div>
              ) : (
                filteredUsers.map((u) => {
                  const sel = selectedUser?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      type="button"
                      style={{
                        textAlign: "left",
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: "1px solid",
                        borderColor: sel ? "var(--blue)" : "var(--btn-line)",
                        background: sel ? "color-mix(in srgb, var(--blue) 10%, var(--inner))" : "var(--inner-2)",
                        color: "var(--ink)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <div className="bento-uav2">{u.username.charAt(0).toUpperCase()}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {u.displayName || u.username}
                          </div>
                          <div style={{ fontSize: 10.5, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} className="mono">{u.email}</div>
                        </div>
                      </div>
                      <span className="bento-tag" style={{ background: "var(--inner-2)", color: "var(--ink-2)", flex: "none" }}>
                        {u.userType === "owner" ? "Owner" : u.userType === "child" ? "Child" : u.isSuperuser ? "Admin" : u.userType}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </BentoOuter>

        {/* Transcript */}
        <BentoOuter
          title={selectedUser ? (selectedUser.displayName || selectedUser.username) : "Bản ghi hội thoại"}
          sub={selectedUser ? `${activeLogs.length.toLocaleString("vi")} tin nhắn` : "Chọn một tài khoản để xem"}
          right={
            selectedUser && activeLogs.length > 0 && (
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => exportJson(selectedUser, activeLogs)} type="button" title="JSON" className="bento-ib" style={{ cursor: "pointer" }}>
                  <FileJson size={14} strokeWidth={1.8} />
                </button>
                <button onClick={() => exportCsv(selectedUser, activeLogs)} type="button" title="CSV" className="bento-ib" style={{ cursor: "pointer" }}>
                  <FileSpreadsheet size={14} strokeWidth={1.8} />
                </button>
                <button onClick={() => exportTxt(selectedUser, activeLogs)} type="button" title="TXT" className="bento-ib" style={{ cursor: "pointer" }}>
                  <FileText size={14} strokeWidth={1.8} />
                </button>
                <button onClick={() => exportHtml(selectedUser, activeLogs)} type="button" title="HTML" className="bento-ib" style={{ cursor: "pointer" }}>
                  <FileCode size={14} strokeWidth={1.8} />
                </button>
              </div>
            )
          }
        >
          <div className="bento-inner" style={{ display: "flex", flexDirection: "column", minHeight: 380, maxHeight: 520 }}>
            {!selectedUser ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--muted)", textAlign: "center" }}>
                <MessageSquare size={42} style={{ color: "var(--faint)", marginBottom: 10 }} strokeWidth={1.5} />
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Chưa chọn tài khoản</div>
                <p style={{ fontSize: 12, color: "var(--muted)", maxWidth: 320, marginTop: 6 }}>
                  Vui lòng chọn một tài khoản từ danh sách bên trái để theo dõi nhật ký chat.
                </p>
              </div>
            ) : chatSource === "robot" ? (
              <>
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingRight: 4 }}>
                  {loadingChats ? (
                    <div style={{ padding: 40, textAlign: "center", fontSize: 12, color: "var(--muted)" }}>Đang lấy lịch sử…</div>
                  ) : chatError ? (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--red)" }}>
                      <AlertCircle size={22} style={{ color: "var(--red)", marginBottom: 8 }} />
                      <span style={{ fontSize: 12, color: "var(--red)" }}>{chatError}</span>
                    </div>
                  ) : chatLogs.length === 0 ? (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
                      <AlertCircle size={22} style={{ color: "var(--faint)", marginBottom: 8 }} />
                      <span style={{ fontSize: 12 }}>Chưa có tin nhắn robot nào cho tài khoản này</span>
                    </div>
                  ) : (
                    chatLogs.map((log) => {
                      const isUser = log.sender === "user";
                      return (
                        <div key={log.id} className="anim-rise" style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
                          <div style={{ maxWidth: "82%" }}>
                            <div
                              style={{
                                padding: "10px 13px",
                                borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                                background: isUser ? "var(--blue)" : "var(--inner-2)",
                                color: isUser ? "#fff" : "var(--ink-2)",
                                fontSize: 13,
                                lineHeight: 1.45,
                              }}
                            >
                              <ChatMarkdown text={log.message} />
                            </div>
                            <div
                              className="mono"
                              style={{
                                fontSize: 10.5,
                                color: "var(--faint)",
                                marginTop: 4,
                                textAlign: isUser ? "right" : "left",
                              }}
                            >
                              {isUser ? selectedUser.username : "Robot PTalk"} · {new Date(log.created_at).toLocaleString("vi-VN")}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <select
                      value={simSender}
                      onChange={(e) => setSimSender(e.target.value)}
                      style={{ padding: "8px 10px", fontSize: 12, background: "var(--inner-2)", border: "1px solid var(--btn-line)", borderRadius: 10, color: "var(--ink)" }}
                    >
                      <option value="user">Người dùng</option>
                      <option value="robot">Robot</option>
                    </select>
                    <select
                      value={simSentiment}
                      onChange={(e) => setSimSentiment(e.target.value)}
                      style={{ padding: "8px 10px", fontSize: 12, background: "var(--inner-2)", border: "1px solid var(--btn-line)", borderRadius: 10, color: "var(--ink)" }}
                    >
                      <option value="positive">Tích cực</option>
                      <option value="neutral">Trung lập</option>
                      <option value="negative">Tiêu cực</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Mô phỏng tin nhắn…"
                      style={{
                        flex: 1,
                        padding: "10px 14px",
                        fontSize: 13,
                        background: "var(--inner-2)",
                        border: "1px solid var(--btn-line)",
                        borderRadius: 12,
                        color: "var(--ink)",
                        outline: "none",
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sendingMessage}
                      style={{
                        padding: "10px 16px",
                        borderRadius: 12,
                        background: "var(--chip)",
                        color: "var(--chip-fg)",
                        fontSize: 13,
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                        opacity: !newMessage.trim() || sendingMessage ? 0.4 : 1,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Send size={14} strokeWidth={1.8} />
                      Gửi
                    </button>
                  </div>
                  {errorMsg && <div style={{ fontSize: 12, color: "var(--red)" }}>{errorMsg}</div>}
                </form>
              </>
            ) : (
              // App-sessions tab
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
                {loadingSessions ? (
                  <div style={{ padding: 40, textAlign: "center", fontSize: 12, color: "var(--muted)" }}>Đang nạp phiên…</div>
                ) : appError ? (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--red)" }}>
                    <AlertCircle size={22} style={{ color: "var(--red)", marginBottom: 8 }} />
                    <span style={{ fontSize: 12, color: "var(--red)" }}>{appError}</span>
                  </div>
                ) : appSessions.length === 0 ? (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
                    <AlertCircle size={22} style={{ color: "var(--faint)", marginBottom: 8 }} />
                    <span style={{ fontSize: 12 }}>Tài khoản này chưa có phiên app nào</span>
                  </div>
                ) : !selectedSession ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {appSessions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => { setSelectedSession(s); fetchSessionMessages(s.id); }}
                        style={{
                          textAlign: "left",
                          padding: "10px 14px",
                          background: "var(--inner-2)",
                          border: "1px solid var(--btn-line)",
                          borderRadius: 12,
                          color: "var(--ink)",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {s.title || "Phiên không tiêu đề"}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }} className="mono">
                            {s.messageCount} tin · {new Date(s.startedAt).toLocaleString("vi-VN")}
                          </div>
                        </div>
                        <span className="bento-chip">{s.productSource}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => { setSelectedSession(null); setAppMessages([]); }}
                      type="button"
                      style={{ alignSelf: "flex-start", fontSize: 12, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      ← Quay lại danh sách phiên
                    </button>
                    {loadingMessages ? (
                      <div style={{ padding: 40, textAlign: "center", fontSize: 12, color: "var(--muted)" }}>Đang nạp tin nhắn…</div>
                    ) : (
                      appMessages.map((m) => {
                        const isUser = m.sender === "user";
                        return (
                          <div key={m.id} className="anim-rise" style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
                            <div style={{ maxWidth: "82%" }}>
                              <div
                                style={{
                                  padding: "10px 13px",
                                  borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                                  background: isUser ? "var(--blue)" : "var(--inner-2)",
                                  color: isUser ? "#fff" : "var(--ink-2)",
                                  fontSize: 13,
                                  lineHeight: 1.45,
                                }}
                              >
                                <ChatMarkdown text={m.content} />
                              </div>
                              <div
                                className="mono"
                                style={{
                                  fontSize: 10.5,
                                  color: "var(--faint)",
                                  marginTop: 4,
                                  textAlign: isUser ? "right" : "left",
                                }}
                              >
                                {new Date(m.createdAt).toLocaleString("vi-VN")}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </BentoOuter>
      </div>

      {/* Bottom row — source donut + hourly spark */}
      <div className="split-4-8">
        <BentoOuter title="Nguồn dữ liệu" sub="Phân bố tin nhắn theo nguồn">
          <div className="bento-inner" style={{ display: "flex", alignItems: "center", gap: 22 }}>
            {sourceDonut.length === 0 ? (
              <div style={{ padding: 20, color: "var(--muted)", fontSize: 12 }}>Chưa có dữ liệu</div>
            ) : (
              <>
                <BentoDonut data={sourceDonut} size={156} thick={22} center={`${sourceTotal}`} centerSub="tin nhắn" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <BentoLegend data={sourceDonut} />
                </div>
              </>
            )}
          </div>
        </BentoOuter>

        <BentoOuter title="Lưu lượng theo giờ" sub="Số tin nhắn trong 24 giờ qua">
          <div className="bento-inner">
            <div className="bento-ihd">
              <div className="bento-ichip">
                <Layers size={18} strokeWidth={1.8} />
              </div>
              <div>
                <div className="t">Phiên theo giờ</div>
                <div className="s">Đếm theo giờ tạo</div>
              </div>
            </div>
            {activeLogs.length === 0 ? (
              <div style={{ padding: 20, color: "var(--muted)", fontSize: 12 }}>Chưa có dữ liệu</div>
            ) : (
              <>
                <BentoSpark data={hourly} w={760} h={150} color="var(--blue)" />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "var(--faint)" }} className="mono">
                  <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:59</span>
                </div>
              </>
            )}
          </div>
        </BentoOuter>
      </div>
    </BentoShell>
  );
}

// useSearchParams() requires a Suspense boundary (CSR bailout) — wrap the page.
export default function ChatsPage() {
  return (
    <Suspense fallback={null}>
      <ChatManagementPage />
    </Suspense>
  );
}
