"use client";

import { useState } from "react";
import {
  Settings,
  Bell,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Save,
  Radio,
  Zap,
} from "lucide-react";

interface SystemService {
  name: string;
  status: "healthy" | "unhealthy" | "warning";
  latency: number;
}

export default function SettingsPage() {
  const [telegramToken, setTelegramToken] = useState("bot1289381923:AAElk2...");
  const [telegramChatId, setTelegramChatId] = useState("-100238128");
  const [offlineThreshold, setOfflineThreshold] = useState(15);
  const [emailAlerts, setEmailAlerts] = useState(true);

  // Mock system services latency health check
  const [services] = useState<SystemService[]>([
    { name: "Auth Identity Service", status: "healthy", latency: 45 },
    { name: "PostgreSQL Database", status: "healthy", latency: 2 },
    { name: "MQTT Broker (PTalk)", status: "healthy", latency: 12 },
    { name: "KidMentor API Gateway", status: "warning", latency: 180 },
  ]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Đã lưu cấu hình cảnh báo và giám sát thành công!");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
          Cài đặt & Giám sát Hệ thống
        </h1>
        <p className="text-muted text-sm mt-1">
          Cấu hình quy tắc cảnh báo sự cố và giám sát sức khỏe dịch vụ thời gian thực (System status latency).
        </p>
      </div>

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
                className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg glow-accent"
              >
                <Save size={16} />
                Lưu cấu hình quy tắc
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
    </div>
  );
}
