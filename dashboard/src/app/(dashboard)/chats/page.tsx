"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Search,
  MessageSquare,
  User,
  Smile,
  Meh,
  Frown,
  Activity,
  Layers,
  FileJson,
  FileSpreadsheet,
  FileText,
  FileCode,
  AlertCircle,
  Send
} from "lucide-react";
import { clsx } from "clsx";

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
  created_at: string;
}

const sentimentColors: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  positive: { bg: "bg-success/15 border-success/30", text: "text-success", icon: Smile },
  neutral: { bg: "bg-white/5 border-white/10", text: "text-muted", icon: Meh },
  negative: { bg: "bg-danger/15 border-danger/30", text: "text-danger", icon: Frown },
};

export default function ChatManagementPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  
  // Chat state
  const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterTier, setFilterTier] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  
  // Simulator input state
  const [newMessage, setNewMessage] = useState("");
  const [simSender, setSimSender] = useState("user"); // 'user' or 'robot'
  const [simSentiment, setSimSentiment] = useState("neutral"); // 'positive', 'neutral', 'negative'
  const [sendingMessage, setSendingMessage] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch Users list
  const fetchUsersList = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/users?limit=100");
      const data = await res.json();
      const fetchedUsers = data.users || [];
      setUsers(fetchedUsers);
      
      if (fetchedUsers.length > 0) {
        const isSuper = !!session?.user?.is_superuser;
        if (!isSuper) {
          // Auto select child user first, else fallback to owner (themselves)
          const child = fetchedUsers.find((u: ApiUser) => u.userType === "child");
          setSelectedUser(child || fetchedUsers[0]);
        } else {
          setSelectedUser(fetchedUsers[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load users for chats", err);
    } finally {
      setLoadingUsers(false);
    }
  }, [session]);

  useEffect(() => {
    fetchUsersList();
  }, [fetchUsersList]);

  // Fetch chat history for selected user
  const fetchChatsForUser = useCallback(async (userId: string, source?: string) => {
    setLoadingChats(true);
    try {
      const sourceParam = source && source !== "all" ? `&source=${source}` : "";
      const res = await fetch(`/api/chat?userId=${userId}${sourceParam}`);
      const data = await res.json();
      setChatLogs(data.chatLogs || []);
    } catch (err) {
      console.error("Failed to fetch chats", err);
      setChatLogs([]);
    } finally {
      setLoadingChats(false);
    }
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchChatsForUser(selectedUser.id, filterSource);
    } else {
      setChatLogs([]);
    }
  }, [selectedUser, filterSource, fetchChatsForUser]);

  // Scroll to bottom when chats load
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLogs]);

  // Filtered users matching search & dropdowns
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

  // Simulator Post message
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
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save conversation log");
      }

      setNewMessage("");
      // Reload logs immediately from DB
      await fetchChatsForUser(selectedUser.id);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định";
      setErrorMsg(errorMsg);
    } finally {
      setSendingMessage(false);
    }
  };

  // 1. Export JSON File Utility
  const exportToJson = () => {
    if (!selectedUser || chatLogs.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(chatLogs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `chat_history_${selectedUser.username}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 2. Export CSV File Utility
  const exportToCsv = () => {
    if (!selectedUser || chatLogs.length === 0) return;
    
    const headers = ["ID", "Sender", "Message", "Sentiment", "Created At"];
    const rows = chatLogs.map((log) => [
      log.id,
      log.sender === "user" ? "User/Bé" : "Robot/PTalk",
      `"${log.message.replace(/"/g, '""')}"`,
      log.sentiment,
      new Date(log.created_at).toLocaleString("vi-VN"),
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", `chat_history_${selectedUser.username}_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 3. Export Text/Markdown Dialogue Format Utility
  const exportToTxt = () => {
    if (!selectedUser || chatLogs.length === 0) return;

    let txtContent = `==================================================\n`;
    txtContent += `NHẬT KÝ HỘI THOẠI ROBOT PTALK ASSISTANT\n`;
    txtContent += `Tài khoản: ${selectedUser.displayName || selectedUser.username}\n`;
    txtContent += `Email: ${selectedUser.email}\n`;
    txtContent += `Ngày xuất báo cáo: ${new Date().toLocaleString("vi-VN")}\n`;
    txtContent += `==================================================\n\n`;

    chatLogs.forEach((log) => {
      const timeStr = new Date(log.created_at).toLocaleString("vi-VN");
      const senderStr = log.sender === "user" ? "BÉ / USER" : "ROBOT PTALK";
      const sentimentStr = 
        log.sentiment === "positive" ? "Tích cực" : 
        log.sentiment === "negative" ? "Tiêu cực" : "Trung lập";
      
      txtContent += `[${timeStr}] ${senderStr} (${sentimentStr}):\n`;
      txtContent += `${log.message}\n\n`;
    });

    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(txtContent);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `chat_history_${selectedUser.username}_${Date.now()}.txt`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 4. Export Standalone Beautiful Styled HTML Document
  const exportToHtml = () => {
    if (!selectedUser || chatLogs.length === 0) return;

    const userDisplayName = selectedUser.displayName || selectedUser.username;
    
    let htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Báo cáo Hội thoại - ${userDisplayName}</title>
  <style>
    body {
      background-color: #090d16;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 40px 20px;
      display: flex;
      justify-content: center;
    }
    .container {
      max-width: 750px;
      width: 100%;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      padding: 30px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    h1 {
      font-size: 24px;
      margin-top: 0;
      background: linear-gradient(to right, #fff, #94a3b8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      padding-bottom: 15px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 30px;
      background: rgba(0,0,0,0.2);
      padding: 15px;
      border-radius: 12px;
      font-size: 13px;
    }
    .meta-item {
      color: #94a3b8;
    }
    .meta-item strong {
      color: #f8fafc;
    }
    .chat-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 20px;
    }
    .message-row {
      display: flex;
      width: 100%;
    }
    .message-row.user {
      justify-content: flex-end;
    }
    .message-row.robot {
      justify-content: flex-start;
    }
    .bubble {
      max-width: 70%;
      padding: 14px 18px;
      border-radius: 18px;
      font-size: 14px;
      line-height: 1.5;
      position: relative;
    }
    .user .bubble {
      background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(6, 182, 212, 0.05));
      border: 1px solid rgba(6, 182, 212, 0.2);
      border-bottom-right-radius: 4px;
      color: #e0f7fa;
    }
    .robot .bubble {
      background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(168, 85, 247, 0.05));
      border: 1px solid rgba(168, 85, 247, 0.2);
      border-bottom-left-radius: 4px;
      color: #f3e8ff;
    }
    .sender-name {
      font-size: 11px;
      font-weight: bold;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .user .sender-name {
      color: #06b6d4;
      text-align: right;
    }
    .robot .sender-name {
      color: #a855f7;
    }
    .message-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
      font-size: 10px;
      color: #64748b;
    }
    .sentiment-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 6px;
      border-radius: 9999px;
      font-weight: bold;
    }
    .badge-positive {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
    }
    .badge-neutral {
      background: rgba(255, 255, 255, 0.05);
      color: #94a3b8;
    }
    .badge-negative {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Nhật ký hội thoại với PTalk Assistant</h1>
    <div class="meta-grid">
      <div class="meta-item">Người dùng: <strong>${userDisplayName}</strong></div>
      <div class="meta-item">Mạng kết nối: <strong>PTalk Ecosystem</strong></div>
      <div class="meta-item">Loại tài khoản: <strong style="text-transform: capitalize;">${selectedUser.userType}</strong></div>
      <div class="meta-item">Ngày xuất: <strong>${new Date().toLocaleString("vi-VN")}</strong></div>
    </div>
    <div class="chat-container">`;

    chatLogs.forEach((log) => {
      const isUser = log.sender === "user";
      const senderLabel = isUser ? "BÉ / USER" : "ROBOT PTALK";
      const timeStr = new Date(log.created_at).toLocaleString("vi-VN");
      
      let badgeClass = "badge-neutral";
      let sentimentLabel = "Trung lập";
      if (log.sentiment === "positive") {
        badgeClass = "badge-positive";
        sentimentLabel = "Tích cực";
      } else if (log.sentiment === "negative") {
        badgeClass = "badge-negative";
        sentimentLabel = "Tiêu cực";
      }

      htmlContent += `
      <div class="message-row ${isUser ? "user" : "robot"}">
        <div class="bubble">
          <div class="sender-name">${senderLabel}</div>
          <div>${log.message}</div>
          <div class="message-footer">
            <span>${timeStr}</span>
            <span class="sentiment-badge ${badgeClass}">${sentimentLabel}</span>
          </div>
        </div>
      </div>`;
    });

    htmlContent += `
    </div>
  </div>
</body>
</html>`;

    const dataStr = "data:text/html;charset=utf-8," + encodeURIComponent(htmlContent);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `chat_history_${selectedUser.username}_${Date.now()}.html`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Calculate sentiment percentages for statistics
  const getSentimentStats = () => {
    if (chatLogs.length === 0) return { pos: 0, neu: 0, neg: 0, total: 0 };
    const pos = chatLogs.filter(l => l.sentiment === "positive").length;
    const neu = chatLogs.filter(l => l.sentiment === "neutral").length;
    const neg = chatLogs.filter(l => l.sentiment === "negative").length;
    const total = chatLogs.length;
    return {
      pos: Math.round((pos / total) * 100),
      neu: Math.round((neu / total) * 100),
      neg: Math.round((neg / total) * 100),
      total
    };
  };

  const stats = getSentimentStats();

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
          Quản lý Lịch sử Chat
        </h1>
        <p className="text-muted text-sm mt-1">
          Theo dõi hội thoại, phân tích sắc thái cảm xúc và quản lý nhật ký tương tác Robot PTalk Assistant.
        </p>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side Column: User List & Filters (4 Columns) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="glass-card rounded-2xl p-4 flex flex-col gap-3 flex-1">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Layers size={16} className="text-accent" />
              Danh sách Tài khoản
            </h2>

            {/* Search Account Box */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Tìm tên, username hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-black/30 border border-white/5 rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* Quick Filters Group */}
            <div className="grid grid-cols-3 gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-2.5 py-1.5 text-[11px] bg-black/20 border border-white/5 rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="all" className="bg-[#090D16]">Mọi đối tượng</option>
                <option value="child" className="bg-[#090D16]">Trẻ em (Child)</option>
                <option value="owner" className="bg-[#090D16]">Người nhà (Owner)</option>
              </select>

              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="px-2.5 py-1.5 text-[11px] bg-black/20 border border-white/5 rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="all" className="bg-[#090D16]">Mọi Tiers</option>
                <option value="admin" className="bg-[#090D16]">Admin</option>
                <option value="ultra" className="bg-[#090D16]">Ultra</option>
                <option value="pro" className="bg-[#090D16]">Pro</option>
                <option value="basic" className="bg-[#090D16]">Basic</option>
              </select>

              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="px-2.5 py-1.5 text-[11px] bg-black/20 border border-white/5 rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="all" className="bg-[#090D16]">Mọi nguồn</option>
                <option value="kids" className="bg-[#090D16]">Kids</option>
                <option value="eldercare" className="bg-[#090D16]">Elder Care</option>
              </select>
            </div>

            {/* Interactive Users List */}
            <div className="flex-1 overflow-y-auto max-h-[460px] pr-1 space-y-2 mt-2 custom-scrollbar">
              {loadingUsers ? (
                <div className="py-12 text-center text-xs text-muted">
                  <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto mb-2" />
                  Đang nạp danh sách tài khoản...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted border border-dashed border-white/5 rounded-xl">
                  Không tìm thấy tài khoản phù hợp
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = selectedUser?.id === user.id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={clsx(
                        "w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer",
                        isSelected
                          ? "bg-accent/15 border-accent text-foreground shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                          : "bg-white/[0.02] border-white/5 hover:border-white/10 text-muted hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={clsx(
                          "w-7 h-7 rounded-lg font-bold flex items-center justify-center text-xs shrink-0",
                          isSelected ? "bg-accent text-white" : "bg-white/5 border border-white/5 text-accent"
                        )}>
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-foreground block truncate">
                            {user.displayName || user.username}
                          </span>
                          <span className="text-[9px] text-muted block truncate font-mono mt-0.5">
                            {user.email}
                          </span>
                        </div>
                      </div>

                      {/* Small badge of User Type */}
                      <span className={clsx(
                        "text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wide shrink-0",
                        user.userType === "owner" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                        user.userType === "child" ? "bg-success/10 text-success border-success/20" :
                        user.isSuperuser ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      )}>
                        {user.userType === "owner" ? "Owner" :
                         user.userType === "child" ? "Child" :
                         user.isSuperuser ? "Admin" : "Demo"}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Side Column: Chat Window & Controls (8 Columns) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Main pane placeholder if no user selected */}
          {!selectedUser ? (
            <div className="glass-card rounded-2xl p-8 flex-1 flex flex-col items-center justify-center text-center text-muted min-h-[400px]">
              <MessageSquare size={48} className="text-accent/30 animate-pulse mb-3" />
              <h3 className="text-sm font-bold text-foreground">Chưa chọn tài khoản</h3>
              <p className="text-xs text-muted max-w-sm mt-1.5">
                Vui lòng chọn một tài khoản từ danh sách bên trái để theo dõi nhật ký chat và thực hiện các nghiệp vụ quản lý.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 flex-1">
              
              {/* Statistics & Exports top control bar */}
              <div className="glass-card rounded-2xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                
                {/* User brief header */}
                <div className="md:col-span-1 border-r border-white/5 pr-2">
                  <span className="text-[9px] font-bold text-accent uppercase tracking-wider block">Đang xem nhật ký</span>
                  <h3 className="text-sm font-extrabold text-foreground truncate mt-0.5">
                    {selectedUser.displayName || selectedUser.username}
                  </h3>
                  <span className="text-[9px] text-muted font-mono mt-0.5 block truncate">ID: {selectedUser.id.substring(0, 8)}...</span>
                </div>

                {/* Sentiment analytics bars */}
                <div className="md:col-span-2 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-muted uppercase tracking-wider">
                    <span>Phân tích cảm xúc</span>
                    <span className="text-foreground">{stats.total} tin nhắn</span>
                  </div>
                  {stats.total === 0 ? (
                    <div className="text-[10px] text-muted">Chưa có đủ dữ liệu thống kê</div>
                  ) : (
                    <div className="space-y-1.5">
                      {/* Percent bars nested */}
                      <div className="w-full h-2.5 bg-black/40 border border-white/5 rounded-full overflow-hidden flex">
                        <div className="bg-success h-full transition-all" style={{ width: `${stats.pos}%` }} title={`Tích cực: ${stats.pos}%`} />
                        <div className="bg-white/20 h-full transition-all" style={{ width: `${stats.neu}%` }} title={`Trung lập: ${stats.neu}%`} />
                        <div className="bg-danger h-full transition-all" style={{ width: `${stats.neg}%` }} title={`Tiêu cực: ${stats.neg}%`} />
                      </div>
                      <div className="flex justify-between text-[9px] font-semibold">
                        <span className="text-success flex items-center gap-0.5">🟢 Tích cực ({stats.pos}%)</span>
                        <span className="text-muted flex items-center gap-0.5">⚪ Trung lập ({stats.neu}%)</span>
                        <span className="text-danger flex items-center gap-0.5">🔴 Tiêu cực ({stats.neg}%)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Exports Dropdown buttons */}
                <div className="md:col-span-1 flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold text-muted uppercase tracking-wider text-center md:text-right block">Tải file nhật ký</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      disabled={chatLogs.length === 0}
                      onClick={exportToJson}
                      title="Tải về file JSON"
                      className="px-2 py-1.5 bg-white/5 border border-white/5 hover:border-white/10 text-foreground rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 hover:text-accent disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      <FileJson size={11} />
                      JSON
                    </button>
                    <button
                      disabled={chatLogs.length === 0}
                      onClick={exportToCsv}
                      title="Tải về file CSV (Excel)"
                      className="px-2 py-1.5 bg-white/5 border border-white/5 hover:border-white/10 text-foreground rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 hover:text-accent disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet size={11} />
                      CSV
                    </button>
                    <button
                      disabled={chatLogs.length === 0}
                      onClick={exportToTxt}
                      title="Tải về file văn bản TXT"
                      className="px-2 py-1.5 bg-white/5 border border-white/5 hover:border-white/10 text-foreground rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 hover:text-accent disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      <FileText size={11} />
                      TXT
                    </button>
                    <button
                      disabled={chatLogs.length === 0}
                      onClick={exportToHtml}
                      title="Tải về file HTML giao diện đẹp"
                      className="px-2 py-1.5 bg-white/5 border border-white/5 hover:border-white/10 text-foreground rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 hover:text-accent disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      <FileCode size={11} />
                      HTML
                    </button>
                  </div>
                </div>

              </div>

              {/* Chat bubble screen area */}
              <div className="glass-card rounded-2xl p-4 flex-1 flex flex-col min-h-[350px] max-h-[500px]">
                <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
                  {loadingChats ? (
                    <div className="h-full flex flex-col items-center justify-center text-xs text-muted">
                      <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin mb-2" />
                      Đang lấy lịch sử hội thoại...
                    </div>
                  ) : chatLogs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-xs text-muted">
                      <AlertCircle size={24} className="text-muted/40 mb-2" />
                      Không có tin nhắn nào trong database
                    </div>
                  ) : (
                    chatLogs.map((log) => {
                      const isUser = log.sender === "user";
                      const SColor = sentimentColors[log.sentiment] || sentimentColors.neutral;
                      const SIcon = SColor.icon;
                      
                      return (
                        <div
                          key={log.id}
                          className={clsx(
                            "flex w-full group animate-in fade-in slide-in-from-bottom-2 duration-200",
                            isUser ? "justify-end" : "justify-start"
                          )}
                        >
                          <div className={clsx(
                            "max-w-[70%] p-3.5 rounded-2xl relative border flex flex-col gap-1.5",
                            isUser
                              ? "bg-gradient-to-br from-cyan-500/10 to-cyan-500/0 border-cyan-500/20 text-cyan-50 rounded-br-sm shadow-[0_4px_16px_rgba(6,182,212,0.03)]"
                              : "bg-gradient-to-br from-purple-500/10 to-purple-500/0 border-purple-500/20 text-purple-50 rounded-bl-sm shadow-[0_4px_16px_rgba(168,85,247,0.03)]"
                          )}>
                            
                            {/* Dialogue header */}
                            <div className="flex items-center justify-between gap-6">
                              <span className={clsx(
                                "text-[9px] font-extrabold uppercase tracking-wide",
                                isUser ? "text-cyan-400" : "text-purple-400"
                              )}>
                                {isUser ? "Bé / User" : "Robot / PTalk"}
                              </span>
                              
                              {/* Sentiment status tag */}
                              <span className={clsx(
                                "text-[8px] font-bold inline-flex items-center gap-1 px-1.5 py-0.5 rounded border uppercase shrink-0",
                                SColor.bg, SColor.text
                              )}>
                                <SIcon size={9} />
                                {log.sentiment}
                              </span>
                            </div>

                            {/* Message text */}
                            <p className="text-xs leading-relaxed font-medium whitespace-pre-wrap">
                              {log.message}
                            </p>

                            {/* Bottom date timestamp */}
                            <span className="text-[8px] text-muted self-end mt-1 block font-mono">
                              {new Date(log.created_at).toLocaleString("vi-VN")}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>

              {/* Chat simulator console pane */}
              <div className="glass-card rounded-2xl p-4">
                <form onSubmit={handleSendMessage} className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <Activity size={13} className="text-accent" />
                      Giả lập hội thoại (Ghi trực tiếp vào DB)
                    </span>
                    {errorMsg && (
                      <span className="text-danger text-[11px] font-medium flex items-center gap-1">
                        ⚠️ Lỗi: {errorMsg}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap md:flex-nowrap gap-3 items-center">
                    
                    {/* Select Sender roles */}
                    <div className="flex items-center gap-1 border border-white/5 bg-black/20 p-1 rounded-xl shrink-0">
                      <button
                        type="button"
                        onClick={() => setSimSender("user")}
                        className={clsx(
                          "px-2.5 py-1 text-[10px] font-extrabold rounded-lg uppercase tracking-wide transition-all cursor-pointer",
                          simSender === "user" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-muted hover:text-foreground"
                        )}
                      >
                        Bé Gửi
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimSender("robot")}
                        className={clsx(
                          "px-2.5 py-1 text-[10px] font-extrabold rounded-lg uppercase tracking-wide transition-all cursor-pointer",
                          simSender === "robot" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "text-muted hover:text-foreground"
                        )}
                      >
                        Robot Trả Lời
                      </button>
                    </div>

                    {/* Select sentiment indicator */}
                    <div className="flex items-center gap-1 border border-white/5 bg-black/20 p-1 rounded-xl shrink-0">
                      <button
                        type="button"
                        onClick={() => setSimSentiment("positive")}
                        title="Tích cực"
                        className={clsx(
                          "p-1.5 rounded-lg transition-all cursor-pointer",
                          simSentiment === "positive" ? "bg-success/20 text-success" : "text-muted hover:text-foreground"
                        )}
                      >
                        <Smile size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimSentiment("neutral")}
                        title="Trung lập"
                        className={clsx(
                          "p-1.5 rounded-lg transition-all cursor-pointer",
                          simSentiment === "neutral" ? "bg-white/10 text-foreground" : "text-muted hover:text-foreground"
                        )}
                      >
                        <Meh size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimSentiment("negative")}
                        title="Tiêu cực"
                        className={clsx(
                          "p-1.5 rounded-lg transition-all cursor-pointer",
                          simSentiment === "negative" ? "bg-danger/20 text-danger" : "text-muted hover:text-foreground"
                        )}
                      >
                        <Frown size={14} />
                      </button>
                    </div>

                    {/* Input message and submit send */}
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder={simSender === "user" ? "Bé nói gì đó..." : "Robot nói gì đó..."}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={sendingMessage}
                        className="w-full pl-3 pr-10 py-2.5 text-xs bg-black/30 border border-white/5 rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      <button
                        type="submit"
                        disabled={sendingMessage || !newMessage.trim()}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-accent/25 hover:bg-accent text-accent hover:text-white rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                      >
                        <Send size={13} />
                      </button>
                    </div>

                  </div>
                </form>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
