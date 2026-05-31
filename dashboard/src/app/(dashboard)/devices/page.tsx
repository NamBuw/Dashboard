"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Monitor,
  Cpu,
  User,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  X,
  Radio,
  Trash2,
  ArrowRightLeft,
  RotateCcw,
  UserPlus,
} from "lucide-react";
import { clsx } from "clsx";

interface Device {
  id: string;
  serialNumber: string;
  firmwareVersion: string;
  status: "online" | "offline" | "error";
  ownerName: string;
  assignedUser: string | null;
  uptime: string;
  lastSeen: string;
}

interface ActionModalState {
  type: "forget" | "transfer" | "factory-reset" | null;
  device: Device | null;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Assign modal state
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigneeName, setAssigneeName] = useState("");

  // Action modal state
  const [actionModal, setActionModal] = useState<ActionModalState>({ type: null, device: null });
  const [transferTargetId, setTransferTargetId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // OTA state simulation
  const [updatingDeviceId, setUpdatingDeviceId] = useState<string | null>(null);
  const [updateProgress, setUpdateProgress] = useState(0);

  const fetchDevices = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/devices");
      const data = await res.json();
      if (res.ok) {
        setDevices(data.devices || []);
      } else {
        setError(data.error || "Không thể tải danh sách thiết bị");
      }
    } catch {
      setError("Không kết nối được server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  // Filter logic
  const filteredDevices = devices.filter((device) => {
    const serial = (device.serialNumber || "").toLowerCase();
    const owner = (device.ownerName || "").toLowerCase();
    const matchesSearch = serial.includes(search.toLowerCase()) ||
                          owner.includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || device.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Assign user logic
  const handleAssignUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;

    try {
      const res = await fetch("/api/devices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: selectedDevice.id,
          assigneeName: assigneeName.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsAssignModalOpen(false);
        setAssigneeName("");
        setSelectedDevice(null);
        fetchDevices();
      } else {
        alert(`Lỗi gán: ${data.error}`);
      }
    } catch {
      alert("Đã xảy ra lỗi khi gán người dùng");
    }
  };

  // Device action handler (forget / transfer / factory-reset)
  const handleDeviceAction = async () => {
    if (!actionModal.device || !actionModal.type) return;

    setActionLoading(true);
    try {
      const body: Record<string, string> = {
        action: actionModal.type,
        deviceId: actionModal.device.id,
      };
      if (actionModal.type === "transfer") {
        if (!transferTargetId.trim()) {
          alert("Vui lòng nhập ID người nhận chuyển nhượng.");
          setActionLoading(false);
          return;
        }
        body.newOwnerId = transferTargetId.trim();
      }

      const res = await fetch("/api/devices/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setActionModal({ type: null, device: null });
        setTransferTargetId("");
        fetchDevices();
      } else {
        alert(`Lỗi: ${data.error}`);
      }
    } catch {
      alert("Không kết nối được server");
    } finally {
      setActionLoading(false);
    }
  };

  // Register physical device (simulate registering a device hardware ID)
  const handleRegisterDevice = async () => {
    const serial = `PTALK-${Math.floor(1000 + Math.random() * 9000)}`;
    const mac = `00:1A:2B:3C:4D:${Math.floor(10 + Math.random() * 89).toString(16).toUpperCase()}`;
    
    try {
      const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serialNumber: serial,
          macAddress: mac,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Đăng ký thiết bị ${serial} thành công! Gói cước của bạn đã được nâng cấp lên Ultra.`);
        fetchDevices();
      } else {
        alert(`Lỗi: ${data.error}`);
      }
    } catch {
      alert("Không kết nối được server");
    }
  };

  // Simulate OTA Firmware Update process
  const triggerOTA = (deviceId: string) => {
    setUpdatingDeviceId(deviceId);
    setUpdateProgress(0);

    const interval = setInterval(() => {
      setUpdateProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // Update device object firmware version upon success
            setDevices((prevDevices) => 
              prevDevices.map((d) => 
                d.id === deviceId ? { ...d, firmwareVersion: "v2.1.5", status: "online" as const } : d
              )
            );
            setUpdatingDeviceId(null);
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
            Quản lý Thiết bị Robot
          </h1>
          <p className="text-muted text-sm mt-1">
            Theo dõi, gán người dùng & nâng cấp Firmware (OTA) robot PTalk Assistant.
          </p>
        </div>
        
        {/* Simulate Adding Device */}
        <button 
          onClick={handleRegisterDevice}
          className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg glow-accent"
        >
          <Plus size={16} />
          Đăng ký Thiết bị Mới
        </button>
      </div>

      {/* Filter and Search */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Tìm kiếm Serial Number hoặc Tên Chủ sở hữu (Owner)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-black/20 border border-white/5 rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 text-xs bg-black/20 border border-white/5 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 shrink-0"
          >
            <option value="all" className="bg-[#090D16]">Tất cả Trạng thái</option>
            <option value="online" className="bg-[#090D16]">Online</option>
            <option value="offline" className="bg-[#090D16]">Offline</option>
            <option value="error" className="bg-[#090D16]">Lỗi kết nối</option>
          </select>
        </div>
      </div>

      {/* Devices table container */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/5 text-muted text-xs font-semibold uppercase tracking-wider">
                <th className="px-5 py-4">Serial Number</th>
                <th className="px-5 py-4">Trạng thái</th>
                <th className="px-5 py-4">Chủ sở hữu (Owner)</th>
                <th className="px-5 py-4">Đối tượng thụ hưởng (User)</th>
                <th className="px-5 py-4">Firmware OS</th>
                <th className="px-5 py-4">Thời gian Hoạt động</th>
                <th className="px-5 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-muted">
                    <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto mb-2" />
                    Đang nạp dữ liệu thiết bị...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-danger font-semibold">
                    ⚠️ Lỗi: {error}
                  </td>
                </tr>
              ) : filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted">
                    Không tìm thấy thiết bị nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device) => (
                  <tr key={device.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-muted">
                          <Cpu size={14} />
                        </div>
                        <span className="font-mono font-bold text-foreground text-xs">{device.serialNumber}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={clsx("inline-flex items-center gap-1.5 text-xs font-bold leading-none")}>
                        <span className={clsx("w-2 h-2 rounded-full", 
                          device.status === "online" ? "bg-success animate-pulse" :
                          device.status === "offline" ? "bg-muted" : "bg-danger"
                        )} />
                        <span className={clsx(
                          device.status === "online" ? "text-success" :
                          device.status === "offline" ? "text-muted" : "text-danger"
                        )}>
                          {device.status === "online" ? "Online" :
                           device.status === "offline" ? "Offline" : "Lỗi"}
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-foreground text-xs">{device.ownerName}</td>
                    {/* Assigned User check (1:1 mapping DEV-03) */}
                    <td className="px-5 py-4">
                      {device.assignedUser ? (
                        <span className="inline-flex items-center gap-1 text-xs text-foreground font-semibold">
                          <User size={12} className="text-accent" />
                          {device.assignedUser}
                        </span>
                      ) : (
                        <span className="text-xs text-muted font-medium italic">Chưa gán user</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-foreground bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                          {device.firmwareVersion}
                        </span>
                        {device.firmwareVersion !== "v2.1.5" && device.status === "online" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" title="Có cập nhật mới" />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted font-medium">
                      {device.status === "online" ? device.uptime : <span className="font-mono">Last seen: {device.lastSeen}</span>}
                    </td>
                    {/* OTA firmware trigger / assign popup trigger */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          onClick={() => {
                            setSelectedDevice(device);
                            setAssigneeName(device.assignedUser || "");
                            setIsAssignModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-white/5 border border-white/5 hover:border-white/10 rounded-lg text-xs font-bold text-foreground transition-all cursor-pointer"
                          title="Gán người sử dụng"
                        >
                          <span className="flex items-center gap-1"><UserPlus size={12} /> Gán</span>
                        </button>

                        <button
                          disabled={device.status !== "online" || device.firmwareVersion === "v2.1.5" || updatingDeviceId === device.id}
                          onClick={() => triggerOTA(device.id)}
                          className={clsx(
                            "px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1",
                            device.firmwareVersion === "v2.1.5"
                              ? "bg-success/10 border-success/20 text-success cursor-default"
                              : "bg-accent/10 border-accent/20 text-accent hover:bg-accent/20 disabled:opacity-30 disabled:pointer-events-none"
                          )}
                        >
                          {updatingDeviceId === device.id ? (
                            <>
                              <RefreshCw size={12} className="animate-spin" />
                              {updateProgress}%
                            </>
                          ) : device.firmwareVersion === "v2.1.5" ? (
                            <>
                              <CheckCircle2 size={12} />
                              Đã nâng cấp
                            </>
                          ) : (
                            <>
                              <RefreshCw size={12} />
                              OTA
                            </>
                          )}
                        </button>

                        {/* Action dropdown */}
                        <div className="relative group">
                          <button className="px-2.5 py-1 text-xs font-bold rounded-lg border border-white/10 text-muted hover:text-foreground hover:bg-white/5 transition-all cursor-pointer flex items-center gap-1">
                            <Trash2 size={12} /> Thao tác
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-52 bg-[#111827] border border-white/10 rounded-xl shadow-2xl z-30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 py-1.5">
                            <button
                              onClick={() => setActionModal({ type: "factory-reset", device })}
                              className="w-full text-left px-4 py-2.5 text-xs font-medium text-foreground hover:bg-white/5 flex items-center gap-2.5 transition-colors"
                            >
                              <RotateCcw size={13} className="text-warning" />
                              <div>
                                <div className="font-bold">Xoá dữ liệu chat</div>
                                <div className="text-[10px] text-muted mt-0.5">Giữ thiết bị, chỉ xoá lịch sử trò chuyện</div>
                              </div>
                            </button>
                            <button
                              onClick={() => setActionModal({ type: "transfer", device })}
                              className="w-full text-left px-4 py-2.5 text-xs font-medium text-foreground hover:bg-white/5 flex items-center gap-2.5 transition-colors"
                            >
                              <ArrowRightLeft size={13} className="text-accent" />
                              <div>
                                <div className="font-bold">Chuyển nhượng</div>
                                <div className="text-[10px] text-muted mt-0.5">Chuyển thiết bị cho người dùng khác</div>
                              </div>
                            </button>
                            <div className="mx-3 my-1 border-t border-white/5" />
                            <button
                              onClick={() => setActionModal({ type: "forget", device })}
                              className="w-full text-left px-4 py-2.5 text-xs font-medium text-danger hover:bg-danger/5 flex items-center gap-2.5 transition-colors"
                            >
                              <Trash2 size={13} />
                              <div>
                                <div className="font-bold">Quên thiết bị</div>
                                <div className="text-[10px] text-muted mt-0.5">Gỡ thiết bị, cho phép đăng ký lại</div>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign User Popup Modal */}
      {isAssignModalOpen && selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAssignModalOpen(false)} />
          
          <form 
            onSubmit={handleAssignUser} 
            className="glass-card rounded-2xl max-w-md w-full p-6 relative overflow-hidden z-10 animate-in fade-in zoom-in duration-200"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">Gán đối tượng vào Robot</h3>
                <p className="text-xs text-muted mt-0.5 font-mono">Serial: {selectedDevice.serialNumber}</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Tên người sử dụng Robot (Child / Elder)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên bé hoặc người già thụ hưởng..."
                  value={assigneeName}
                  onChange={(e) => setAssigneeName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-black/20 border border-white/5 rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                />
                <p className="text-[10px] text-muted mt-1.5 leading-relaxed">
                  Thiết bị robot sẽ tự động đồng bộ hồ sơ, dữ liệu tiến trình và các nội dung chuyên biệt phù hợp với hồ sơ gán.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-5 mt-6 border-t border-white/5">
              <button 
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 bg-white/5 border border-white/5 hover:border-white/10 text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Huỷ bỏ
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Lưu liên kết gán
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Action Confirmation Modal (Forget / Transfer / Factory Reset) */}
      {actionModal.type && actionModal.device && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !actionLoading && setActionModal({ type: null, device: null })} />
          
          <div className="glass-card rounded-2xl max-w-md w-full p-6 relative overflow-hidden z-10 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {actionModal.type === "forget" && "Quên thiết bị"}
                  {actionModal.type === "transfer" && "Chuyển nhượng thiết bị"}
                  {actionModal.type === "factory-reset" && "Xoá dữ liệu trò chuyện"}
                </h3>
                <p className="text-xs text-muted mt-0.5 font-mono">Serial: {actionModal.device.serialNumber}</p>
              </div>
              <button 
                type="button"
                onClick={() => !actionLoading && setActionModal({ type: null, device: null })}
                className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Warning box */}
            <div className={clsx(
              "rounded-xl p-3 mb-4 text-xs leading-relaxed border",
              actionModal.type === "forget" 
                ? "bg-danger/5 border-danger/20 text-danger" 
                : actionModal.type === "transfer"
                ? "bg-accent/5 border-accent/20 text-accent"
                : "bg-warning/5 border-warning/20 text-warning"
            )}>
              {actionModal.type === "forget" && (
                <>
                  <strong>⚠️ Cảnh báo:</strong> Thiết bị sẽ bị gỡ khỏi tài khoản của bạn.
                  Toàn bộ lịch sử trò chuyện <strong>(chỉ của thiết bị này)</strong> sẽ bị xoá.
                  Thiết bị có thể được đăng ký lại bởi người dùng khác.
                </>
              )}
              {actionModal.type === "transfer" && (
                <>
                  <strong>🔄 Chuyển nhượng:</strong> Thiết bị sẽ được chuyển cho người dùng mới.
                  Toàn bộ lịch sử trò chuyện <strong>(chỉ của thiết bị này)</strong> sẽ bị xoá trước khi chuyển.
                  Người nhận sẽ cần kết nối lại thiết bị qua PAssistant.
                </>
              )}
              {actionModal.type === "factory-reset" && (
                <>
                  <strong>🔄 Đặt lại:</strong> Toàn bộ lịch sử trò chuyện <strong>(chỉ của thiết bị này)</strong> sẽ bị xoá.
                  Thiết bị vẫn giữ nguyên liên kết với tài khoản.
                </>
              )}
            </div>

            {/* Transfer: show target user input */}
            {actionModal.type === "transfer" && (
              <div className="mb-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  ID người nhận chuyển nhượng (User UUID)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập User ID của người nhận..."
                  value={transferTargetId}
                  onChange={(e) => setTransferTargetId(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-black/20 border border-white/5 rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-mono"
                />
                <p className="text-[10px] text-muted mt-1.5">
                  Tìm User ID trong trang Quản lý Người dùng.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/5">
              <button 
                type="button"
                onClick={() => setActionModal({ type: null, device: null })}
                disabled={actionLoading}
                className="px-4 py-2 bg-white/5 border border-white/5 hover:border-white/10 text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Huỷ bỏ
              </button>
              <button 
                onClick={handleDeviceAction}
                disabled={actionLoading}
                className={clsx(
                  "px-4 py-2 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50",
                  actionModal.type === "forget" 
                    ? "bg-danger hover:bg-danger/80" 
                    : actionModal.type === "transfer"
                    ? "bg-accent hover:bg-accent-hover"
                    : "bg-warning hover:bg-warning/80"
                )}
              >
                {actionLoading && <RefreshCw size={12} className="animate-spin" />}
                {actionModal.type === "forget" && "Quên thiết bị"}
                {actionModal.type === "transfer" && "Chuyển nhượng"}
                {actionModal.type === "factory-reset" && "Xoá dữ liệu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Simulated OTA alert banner when active */}
      {updatingDeviceId && (
        <div className="fixed bottom-6 right-6 glass-card rounded-2xl p-4 w-80 shadow-2xl z-40 animate-bounce">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent">
              <Radio size={16} className="animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-foreground">Đang tải xuống bản dựng Firmware...</h4>
              <div className="w-full bg-black/20 rounded-full h-1.5 mt-2 border border-white/5">
                <div 
                  className="bg-accent h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${updateProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
