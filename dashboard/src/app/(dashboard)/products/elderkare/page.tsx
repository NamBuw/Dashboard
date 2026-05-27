"use client";

import { useState } from "react";
import {
  Heart,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  schedule: string;
  status: "taken" | "missed" | "scheduled";
}

const mockMeds: Medication[] = [
  { id: "1", name: "Thuốc Huyết áp (Amlodipine)", dosage: "1 viên", schedule: "08:00 Sáng", status: "taken" },
  { id: "2", name: "Thuốc Tim mạch (Digoxin)", dosage: "1/2 viên", schedule: "12:00 Trưa", status: "taken" },
  { id: "3", name: "Bổ não (Ginkgo Biloba)", dosage: "1 viên", schedule: "20:00 Tối", status: "scheduled" },
];

export default function ElderKareProductPage() {
  const [meds, setMeds] = useState<Medication[]>(mockMeds);

  const toggleMedStatus = (id: string) => {
    setMeds(meds.map(m => {
      if (m.id === id) {
        const nextStatus = m.status === "scheduled" ? "taken" : 
                           m.status === "taken" ? "missed" : "scheduled";
        return { ...m, status: nextStatus };
      }
      return m;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
          Báo cáo Elder Kare App
        </h1>
        <p className="text-muted text-sm mt-1">
          Theo dõi lịch nhắc uống thuốc của người cao tuổi, lịch sử xác nhận và các cảnh báo hành vi sức khỏe khẩn cấp.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Medication Schedule List Column-span-2 */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-lg font-bold text-foreground mb-1.5 flex items-center gap-2">
              <Calendar size={18} className="text-accent" />
              Lịch nhắc thuốc hôm nay (Ông Hoàng Văn T.)
            </h2>
            <p className="text-xs text-muted mb-6">Theo dõi trạng thái xác nhận uống thuốc thời gian thực từ robot/app di động.</p>

            <div className="space-y-4">
              {meds.map((med) => (
                <div 
                  key={med.id} 
                  onClick={() => toggleMedStatus(med.id)}
                  className="p-4 bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl flex items-center justify-between transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                      med.status === "taken" ? "bg-success/10 border-success/30 text-success" :
                      med.status === "missed" ? "bg-danger/10 border-danger/30 text-danger" : "bg-accent/10 border-accent/30 text-accent animate-pulse"
                    }`}>
                      <Clock size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{med.name}</h4>
                      <p className="text-xs text-muted mt-0.5">Liều dùng: {med.dosage} — Lịch: {med.schedule}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-xl border ${
                    med.status === "taken" ? "bg-success/10 text-success border-success/20" :
                    med.status === "missed" ? "bg-danger/10 text-danger border-danger/20" : "bg-accent/10 text-accent border-accent/20"
                  }`}>
                    {med.status === "taken" ? "Đã uống" : 
                     med.status === "missed" ? "Bỏ lỡ" : "Đang chờ"}
                  </span>
                </div>
              ))}
              <p className="text-[10px] text-muted text-center pt-2 italic">
                * Mẹo: Click chuột vào từng dòng lịch nhắc thuốc ở trên để mô phỏng chuyển đổi nhanh các trạng thái uống thuốc!
              </p>
            </div>
          </div>
        </div>

        {/* Health Alert Indicators Column-span-1 */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-lg font-bold text-foreground mb-1.5 flex items-center gap-2">
              <AlertTriangle size={18} className="text-danger" />
              Sự cố sức khỏe phát hiện
            </h2>
            <p className="text-xs text-muted mb-4">Các biến cố khẩn cấp phát hiện qua App di động / Nút khẩn cấp SOS trên Robot.</p>

            <div className="space-y-3">
              {/* Fall Warning */}
              <div className="p-3.5 bg-danger/5 border border-danger/10 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-danger" />
                  <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">Cảnh báo ngã (Fall warning)</h4>
                </div>
                <p className="text-xs text-muted leading-relaxed">Không phát hiện sự cố ngã hay gia tốc bất thường trong 24 giờ qua.</p>
                <span className="inline-flex items-center gap-1 text-[10px] text-success font-bold">
                  <CheckCircle2 size={10} /> Trạng thái: An toàn
                </span>
              </div>

              {/* Heart rate Warning */}
              <div className="p-3.5 bg-success/5 border border-success/10 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <Heart size={16} className="text-success" />
                  <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">Nhịp tim (Heart rate)</h4>
                </div>
                <p className="text-xs text-muted leading-relaxed">Nhịp tim đo được trung bình ở mức 72 bpm từ vòng tay thông minh gán kèm.</p>
                <span className="inline-flex items-center gap-1 text-[10px] text-success font-bold">
                  <CheckCircle2 size={10} /> Trạng thái: Ổn định
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
