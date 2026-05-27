"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  MessageSquare,
  Smile,
  Frown,
  Meh,
  Cpu,
  Layers,
  ArrowRight,
  Send,
  Loader2,
} from "lucide-react";
import { clsx } from "clsx";

interface Conversation {
  id: string;
  sender: "user" | "robot";
  message: string;
  sentiment: "positive" | "negative" | "neutral";
  created_at: string;
}

export default function PTalkProductPage() {
  const { data: session, status } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Input states
  const [newMessage, setNewMessage] = useState("");
  const [sender, setSender] = useState<"user" | "robot">("user");
  const [sentiment, setSentiment] = useState<"positive" | "negative" | "neutral">("neutral");
  const [submitting, setSubmitting] = useState(false);

  // We need the user's real ID to link the chat logs
  const userId = session?.user?.id;

  const fetchChatLogs = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/chat?userId=${userId}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setConversations(data.chatLogs || []);
      }
    } catch {
      setError("Không kết nối được API Lịch sử Chat");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (status === "authenticated" && userId) {
      fetchChatLogs();
    }
  }, [status, userId, fetchChatLogs]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          sender,
          message: newMessage,
          sentiment,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewMessage("");
        // Instantly append or re-fetch
        fetchChatLogs();
      } else {
        alert("Lỗi khi lưu cuộc hội thoại");
      }
    } catch {
      alert("Không kết nối được server");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
        <p className="text-muted text-sm font-semibold animate-pulse">Đang tải lịch sử hội thoại thực tế...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="glass-card max-w-sm p-6 text-center rounded-xl">
          <p className="text-foreground font-bold">Vui lòng đăng nhập</p>
          <p className="text-muted text-xs mt-1">Cần có phiên đăng nhập hợp lệ để lấy lịch sử đối thoại.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
          Robot PTalk Assistant Insight
        </h1>
        <p className="text-muted text-sm mt-1">
          Giám sát sơ đồ mapping và phân tích sắc thái nội dung đối thoại (Conversation sentiment logs) lưu trữ trong PostgreSQL.
        </p>
      </div>

      {/* Sơ đồ Mapping Owner ↔ Robot ↔ User */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="text-lg font-bold text-foreground mb-4">Sơ đồ Mapping Thiết bị trong Hệ sinh thái</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative items-center">
          {/* 1. Account Owner card */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Chủ hộ (Account Owner)</span>
              <p className="text-sm font-bold text-foreground mt-1">{session?.user?.name || "Lê Minh H."}</p>
              <p className="text-xs text-muted">ID: {userId?.substring(0, 8)}...</p>
            </div>
            <ArrowRight className="text-muted hidden md:block" />
          </div>

          {/* 2. Robot Companion card */}
          <div className="p-4 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-accent font-bold uppercase tracking-wider">Companion Robot</span>
              <p className="text-sm font-bold text-foreground mt-1">PTALK-ROBOT-0081</p>
              <p className="text-xs text-muted">Status: Online</p>
            </div>
            <ArrowRight className="text-muted hidden md:block" />
          </div>

          {/* 3. Assigned Beneficiary User card */}
          <div className="p-4 bg-success/10 border border-success/20 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-success font-bold uppercase tracking-wider">Đối tượng sử dụng (Beneficiary)</span>
              <p className="text-sm font-bold text-foreground mt-1">Bé Bảo Vy</p>
              <p className="text-xs text-muted">Type: Child (Trẻ em)</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse shrink-0" />
          </div>
        </div>
      </div>

      {/* Grid: Chat log & Mock Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chat Logs Window (Col-span-2) */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 flex flex-col h-[550px]">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2 shrink-0">
            <MessageSquare size={18} className="text-accent" />
            Nhật ký Hội thoại Thực tế (PostgreSQL)
          </h2>
          <p className="text-xs text-muted mb-4 shrink-0">Lịch sử trò chuyện của user gán được tải trực tiếp từ bảng `conversation_logs`.</p>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 my-4">
            {conversations.map((chat) => (
              <div 
                key={chat.id} 
                className={clsx(
                  "flex flex-col",
                  chat.sender === "user" ? "items-end" : "items-start"
                )}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] text-muted font-mono">
                    {new Date(chat.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-[9px] font-bold text-foreground uppercase">
                    {chat.sender === "user" ? (session?.user?.name || "Bé Bảo Vy") : "Robot PTalk"}
                  </span>
                </div>
                
                <div className={clsx(
                  "p-3.5 rounded-2xl max-w-md text-sm relative",
                  chat.sender === "user" 
                    ? "bg-accent text-white rounded-tr-none" 
                    : "bg-white/5 border border-white/5 text-foreground rounded-tl-none"
                )}>
                  <p className="leading-relaxed">{chat.message}</p>
                  
                  {/* Sentiment badge indicator */}
                  <div className={clsx(
                    "absolute bottom-[-10px] p-1 bg-black rounded-lg border border-white/10 flex items-center gap-1 shadow-lg",
                    chat.sender === "user" ? "left-2" : "right-2"
                  )}>
                    {chat.sentiment === "positive" ? (
                      <Smile size={10} className="text-success" />
                    ) : chat.sentiment === "negative" ? (
                      <Frown size={10} className="text-danger" />
                    ) : (
                      <Meh size={10} className="text-muted" />
                    )}
                    <span className="text-[7px] font-bold uppercase text-white px-0.5">
                      {chat.sentiment === "positive" ? "Tích cực" : chat.sentiment === "negative" ? "Lo lắng" : "Bình thường"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {conversations.length === 0 && (
              <p className="text-sm text-muted text-center py-12">Chưa có dữ liệu hội thoại trong cơ sở dữ liệu.</p>
            )}
          </div>
        </div>

        {/* Mock Dialog Creator / Simulator (Col-span-1) */}
        <div className="glass-card rounded-2xl p-5 flex flex-col">
          <h2 className="text-lg font-bold text-foreground mb-1.5">Trình mô phỏng Hội thoại Robot</h2>
          <p className="text-xs text-muted mb-6">Mô phỏng gửi câu thoại từ robot hoặc người dùng, lưu và đồng bộ trực tiếp vào cơ sở dữ liệu.</p>

          <form onSubmit={handleSendChat} className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Sender Select */}
              <div>
                <label className="block text-[10px] text-muted mb-2 font-bold uppercase tracking-wider">Người gửi câu thoại</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSender("user")}
                    className={clsx(
                      "py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer",
                      sender === "user" 
                        ? "bg-accent/15 border-accent text-accent" 
                        : "bg-black/20 border-white/5 text-muted hover:text-foreground"
                    )}
                  >
                    Người dùng (Bé)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSender("robot")}
                    className={clsx(
                      "py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer",
                      sender === "robot" 
                        ? "bg-accent/15 border-accent text-accent" 
                        : "bg-black/20 border-white/5 text-muted hover:text-foreground"
                    )}
                  >
                    Robot PTalk
                  </button>
                </div>
              </div>

              {/* Sentiment Select */}
              <div>
                <label className="block text-[10px] text-muted mb-2 font-bold uppercase tracking-wider">Cảm xúc hội thoại</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["positive", "neutral", "negative"] as const).map((sent) => (
                    <button
                      key={sent}
                      type="button"
                      onClick={() => setSentiment(sent)}
                      className={clsx(
                        "py-2 text-[10px] font-bold rounded-lg border transition-all cursor-pointer capitalize flex items-center justify-center gap-1",
                        sentiment === sent 
                          ? "bg-white/10 border-white/20 text-foreground" 
                          : "bg-black/20 border-white/5 text-muted hover:text-foreground"
                      )}
                    >
                      {sent === "positive" ? "Vui vẻ" : sent === "negative" ? "Lo âu" : "Bình thường"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-[10px] text-muted mb-2 font-bold uppercase tracking-wider">Nội dung đối thoại</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Nhập câu thoại..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-black/20 border border-white/5 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
            >
              {submitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              Ghi nhận cuộc trò chuyện
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

// Helper callback wrapper standard in client pages
import { useCallback } from "react";
