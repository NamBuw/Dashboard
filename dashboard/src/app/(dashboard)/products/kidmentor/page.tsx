"use client";

import { useState } from "react";
import { BookOpen, Search, Loader2, FileText, Sparkles } from "lucide-react";

interface RagResult {
  query: string;
  intent: {
    subject?: string;
    title?: string;
    keyword?: string;
    query_type?: string;
  };
  sources: string[];
  context: string;
  contentLines: string[];
  recitationTitle: string;
}

export default function KidMentorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RagResult | null>(null);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/rag-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Lỗi truy vấn");
      } else {
        setResult(data);
      }
    } catch {
      setError("Không kết nối được server");
    } finally {
      setLoading(false);
    }
  };

  const subjectColors: Record<string, string> = {
    "Toán": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Ngữ Văn": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "KHTN": "bg-green-500/20 text-green-400 border-green-500/30",
    "Lịch Sử": "bg-amber-500/20 text-amber-400 border-amber-500/30",
    "Địa Lý": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpen size={24} className="text-accent" />
          Kid Mentor - Tra cứu Sách
        </h1>
        <p className="text-sm text-muted mt-1">
          Tìm kiếm kiến thức từ kho sách giáo khoa, bài thơ, bài học
        </p>
      </div>

      {/* Search */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Hỏi về bất kỳ chủ đề nào... VD: Tóm tắt bài thơ Việt Nam của Tố Hữu"
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !searchQuery.trim()}
            className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium disabled:opacity-30 cursor-pointer flex items-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Tra cứu
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Intent info */}
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Kết quả truy vấn</h3>
            <div className="flex flex-wrap gap-2">
              {result.intent.subject && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${subjectColors[result.intent.subject] || "bg-white/10 text-muted border-white/10"}`}>
                  {result.intent.subject}
                </span>
              )}
              {result.intent.title && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-white/10 text-foreground border border-white/10">
                  📖 {result.intent.title}
                </span>
              )}
              {result.intent.query_type && (
                <span className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-muted border border-white/5">
                  {result.intent.query_type === "recite_full_text" ? "Đọc/Ngâm" : "Giải thích"}
                </span>
              )}
              {result.sources.length > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-muted border border-white/5">
                  Nguồn: {result.sources.join(", ")}
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          {result.recitationTitle ? (
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-3">
                <FileText size={16} className="text-accent" />
                {result.recitationTitle}
              </h3>
              <div className="space-y-1.5">
                {result.contentLines.map((line, i) => (
                  <p key={i} className="text-sm text-foreground/80 leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ) : result.context ? (
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-accent" />
                Nội dung
              </h3>
              <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                {result.context}
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-xl p-5 text-center text-muted text-sm">
              Không tìm thấy nội dung phù hợp cho câu truy vấn này.
            </div>
          )}
        </div>
      )}

      {/* Example queries */}
      {!result && !loading && (
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Gợi ý truy vấn</h3>
          <div className="flex flex-wrap gap-2">
            {[
              "Tóm tắt bài thơ Việt Nam của Tố Hữu",
              "Phân tích nhân vật Mị trong Vợ nhặt",
              "Giải bài toán phương trình bậc hai",
              "Hệ thống kiến thức cơ học Newton",
              "Đọc bài thơ Truyện Kiều",
            ].map((q) => (
              <button
                key={q}
                onClick={() => { setSearchQuery(q); }}
                className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-muted hover:text-foreground hover:border-white/20 transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
