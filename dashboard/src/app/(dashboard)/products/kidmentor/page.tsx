"use client";

import { useState } from "react";
import {
  BookOpen,
  Calendar,
  Sparkles,
  TrendingUp,
  Award,
} from "lucide-react";

interface ProgressItem {
  id: string;
  subject: string;
  completedLessons: number;
  totalLessons: number;
  score: number;
  status: "excellent" | "good" | "needs_improvement";
}

const mockProgress: ProgressItem[] = [
  { id: "1", subject: "Toán học Tư duy", completedLessons: 24, totalLessons: 30, score: 9.2, status: "excellent" },
  { id: "2", subject: "Tiếng Anh Phát âm", completedLessons: 18, totalLessons: 45, score: 8.5, status: "good" },
  { id: "3", subject: "Logic & Lập trình nhí", completedLessons: 5, totalLessons: 20, score: 7.0, status: "needs_improvement" },
];

export default function KidMentorProductPage() {
  const [progress] = useState<ProgressItem[]>(mockProgress);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
          Tiến độ Kid Mentor App
        </h1>
        <p className="text-muted text-sm mt-1">
          Giám sát tiến độ học tập, kết quả điểm số trung bình và mức độ hoạt động của các bé.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress List Column-span-2 */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-lg font-bold text-foreground mb-1.5 flex items-center gap-2">
              <BookOpen size={18} className="text-accent" />
              Chương trình Học tập đang kích hoạt (Bé Bảo Vy)
            </h2>
            <p className="text-xs text-muted mb-6">Theo dõi trực tiếp tỷ lệ hoàn thành học phần khóa học nhí.</p>

            <div className="space-y-5">
              {progress.map((item) => {
                const percentage = Math.round((item.completedLessons / item.totalLessons) * 100);
                return (
                  <div key={item.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-foreground">{item.subject}</h4>
                        <p className="text-xs text-muted mt-0.5">Tiến độ bài học: {item.completedLessons}/{item.totalLessons} bài</p>
                      </div>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                        item.status === "excellent" ? "bg-success/10 text-success border-success/20" :
                        item.status === "good" ? "bg-accent/10 text-accent border-accent/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      }`}>
                        {item.status === "excellent" ? "Xuất sắc" : item.status === "good" ? "Khá giỏi" : "Cần cố gắng"}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono text-muted">
                        <span>Hoàn thành {percentage}%</span>
                        <span>Điểm số: {item.score}/10</span>
                      </div>
                      <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full rounded-full bg-accent transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Learning Badges Column-span-1 */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-lg font-bold text-foreground mb-1.5 flex items-center gap-2">
              <Award size={18} className="text-amber-500" />
              Huy hiệu Danh giá đạt được
            </h2>
            <p className="text-xs text-muted mb-4">Các cột mốc học tập bé Bảo Vy đã gặt hái.</p>

            <div className="space-y-3">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Trùm Toán nhí</h4>
                  <p className="text-[10px] text-muted mt-0.5">Hoàn thành 10 bài toán điểm tuyệt đối.</p>
                </div>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <Calendar size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Chăm học Chuyên cần</h4>
                  <p className="text-[10px] text-muted mt-0.5">Học liên tục 7 ngày trong tuần.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
