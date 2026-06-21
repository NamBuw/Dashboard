"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { RotateCcw, Download, AlertCircle, Send } from "lucide-react";
import { BentoShell, BentoOuter } from "@/components/bento";

interface Device {
  id: string;
  serial_number: string | null;
  firmware_version: string | null;
  app_version: string | null;
  build_number: string | null;
  model: string | null;
  device_type: number | null;
  connection_type: number | null;
  status: string | null;
  last_seen_at: string | null;
  owner_name: string | null;
  assigned_name: string | null;
  device_hw_id: string | null;
  mac_address: string | null;
  label: string | null;
}
type Live = Record<string, unknown> | null;

const CONN: Record<number, string> = { 0: "BLE", 1: "WiFi", 2: "MQTT" };
const DTYPE: Record<number, string> = { 1: "Robot", 2: "Tablet", 3: "Speaker" };

const ctrl: React.CSSProperties = {
  padding: "8px 10px", fontSize: 13, background: "var(--inner-2)",
  border: "1px solid var(--btn-line)", borderRadius: 10, color: "var(--ink)", outline: "none",
};
const btn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10,
  background: "var(--chip)", color: "var(--chip-fg)", fontSize: 12.5, fontWeight: 600, border: "none", cursor: "pointer",
};

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "7px 0", borderBottom: "1px solid var(--line)" }}>
      <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{k}</span>
      <span style={{ fontSize: 12.5, color: "var(--ink)", fontWeight: 600, textAlign: "right", wordBreak: "break-all" }}>{v}</span>
    </div>
  );
}

export default function DeviceDetailPage() {
  const params = useParams();
  const id = String(params?.id || "");
  const { data: session } = useSession();
  const isSuper = !!session?.user?.is_superuser;

  const [device, setDevice] = useState<Device | null>(null);
  const [live, setLive] = useState<Live>(null);
  const [mqttOk, setMqttOk] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [vol, setVol] = useState(50);
  const [bri, setBri] = useState(50);
  const [name, setName] = useState("");
  const [ota, setOta] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/devices/${id}`);
      if (!r.ok) {
        setError(r.status === 403 ? "Bạn không có quyền xem thiết bị này." : r.status === 404 ? "Không tìm thấy thiết bị." : "Lỗi tải thiết bị.");
        return;
      }
      const d = await r.json();
      setDevice(d.device);
      setLive(d.liveStatus);
      setMqttOk(!!d.mqttConfigured);
      setName(d.device?.label || "");
      if (d.liveStatus) {
        if (typeof d.liveStatus.volume === "number") setVol(d.liveStatus.volume);
        if (typeof d.liveStatus.brightness === "number") setBri(d.liveStatus.brightness);
      }
    } catch {
      setError("Không kết nối được máy chủ.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { if (id) load(); }, [id, load]);

  // Realtime status via SSE (SuperAdmin).
  useEffect(() => {
    if (!isSuper || !device) return;
    const myId = device.device_hw_id || device.mac_address;
    if (!myId) return;
    const es = new EventSource("/api/devices/stream");
    es.onmessage = (ev) => {
      try {
        const m = JSON.parse(ev.data);
        if (m.type === "status" && m.deviceId === myId) setLive(m.payload);
      } catch { /* ignore */ }
    };
    return () => es.close();
  }, [isSuper, device]);

  const send = async (action: string, value?: unknown) => {
    setBusy(action);
    try {
      const r = await fetch(`/api/devices/${id}/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, value }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.success) alert(d.error || "Gửi lệnh thất bại (thiết bị offline?).");
    } catch {
      alert("Không kết nối được máy chủ.");
    } finally {
      setBusy("");
    }
  };

  if (loading) {
    return <BentoShell title="Chi tiết thiết bị" sub="Đang tải…"><div className="bento-inner skeleton" style={{ height: 200 }} /></BentoShell>;
  }
  if (error || !device) {
    return (
      <BentoShell title="Chi tiết thiết bị" sub="Lỗi">
        <div className="bento-inner" style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--red)" }}>
          <AlertCircle size={18} /> {error || "Không có dữ liệu."}
        </div>
      </BentoShell>
    );
  }

  const title = device.label || device.serial_number || "Thiết bị";
  const live2 = live || {};
  const num = (k: string) => (typeof live2[k] === "number" ? (live2[k] as number) : undefined);
  const canControl = mqttOk && !!(device.device_hw_id || device.mac_address);

  return (
    <BentoShell title={title} sub={`Robot PTalk · ${device.status || "offline"}`}>
      <div className="split-5-7">
        {/* Info */}
        <BentoOuter title="Thông tin thiết bị" sub="Phần cứng & phiên bản">
          <div className="bento-inner">
            <Row k="Serial" v={device.serial_number || "—"} />
            <Row k="Model" v={device.model || "—"} />
            <Row k="Loại" v={device.device_type != null ? DTYPE[device.device_type] || device.device_type : "—"} />
            <Row k="Kết nối" v={device.connection_type != null ? CONN[device.connection_type] || device.connection_type : "—"} />
            <Row k="Hardware ID" v={device.device_hw_id || "—"} />
            <Row k="MAC" v={device.mac_address || "—"} />
            <Row k="Firmware" v={device.firmware_version || "—"} />
            <Row k="App / Build" v={`${device.app_version || "—"} / ${device.build_number || "—"}`} />
            <Row k="Chủ sở hữu" v={device.owner_name || "—"} />
            <Row k="Người dùng" v={device.assigned_name || "Chưa gán"} />
            <Row k="Trạng thái" v={device.status || "offline"} />
            <Row k="Last seen" v={device.last_seen_at ? new Date(device.last_seen_at).toLocaleString("vi-VN") : "—"} />
          </div>
        </BentoOuter>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {/* Live status */}
          <BentoOuter title="Trạng thái realtime" sub="Cập nhật qua MQTT/SSE">
            <div className="bento-inner grid-stat-3">
              {[
                { l: "Pin", v: num("battery_level") != null ? `${num("battery_level")}%` : "—" },
                { l: "Âm lượng", v: num("volume") != null ? `${num("volume")}%` : "—" },
                { l: "Độ sáng", v: num("brightness") != null ? `${num("brightness")}%` : "—" },
                { l: "WiFi RSSI", v: num("wifi_rssi") != null ? `${num("wifi_rssi")} dBm` : "—" },
                { l: "Uptime", v: num("uptime_sec") != null ? `${Math.round((num("uptime_sec") as number) / 60)} phút` : "—" },
                { l: "Kết nối", v: (live2.connectivity_state as string) || (live ? "ONLINE" : "—") },
              ].map((x) => (
                <div key={x.l} style={{ background: "var(--inner-2)", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{x.l}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", marginTop: 4 }}>{x.v}</div>
                </div>
              ))}
            </div>
          </BentoOuter>

          {/* Controls */}
          <BentoOuter title="Điều khiển từ xa" sub="Gửi lệnh qua MQTT (devices/{id}/cmd)">
            <div className="bento-inner" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {!canControl && (
                <div style={{ fontSize: 12, color: "var(--amber)", display: "flex", gap: 6, alignItems: "center" }}>
                  <AlertCircle size={14} /> {mqttOk ? "Thiết bị chưa có hw_id/MAC." : "MQTT chưa cấu hình (DASHBOARD_MQTT_URL)."}
                </div>
              )}
              {/* Volume */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 90, fontSize: 12.5, color: "var(--ink-2)" }}>Âm lượng</span>
                <input type="range" min={0} max={100} value={vol} onChange={(e) => setVol(Number(e.target.value))} style={{ flex: 1 }} disabled={!canControl} />
                <span style={{ width: 38, textAlign: "right", fontSize: 12.5 }}>{vol}%</span>
                <button type="button" style={btn} disabled={!canControl || busy === "set_volume"} onClick={() => send("set_volume", vol)}><Send size={13} /> Gửi</button>
              </div>
              {/* Brightness */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 90, fontSize: 12.5, color: "var(--ink-2)" }}>Độ sáng</span>
                <input type="range" min={0} max={100} value={bri} onChange={(e) => setBri(Number(e.target.value))} style={{ flex: 1 }} disabled={!canControl} />
                <span style={{ width: 38, textAlign: "right", fontSize: 12.5 }}>{bri}%</span>
                <button type="button" style={btn} disabled={!canControl || busy === "set_brightness"} onClick={() => send("set_brightness", bri)}><Send size={13} /> Gửi</button>
              </div>
              {/* Name */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 90, fontSize: 12.5, color: "var(--ink-2)" }}>Tên thiết bị</span>
                <input value={name} onChange={(e) => setName(e.target.value)} style={{ ...ctrl, flex: 1 }} disabled={!canControl} />
                <button type="button" style={btn} disabled={!canControl || busy === "set_device_name"} onClick={() => send("set_device_name", name)}><Send size={13} /> Đổi tên</button>
              </div>
              {/* OTA + reboot */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ width: 90, fontSize: 12.5, color: "var(--ink-2)" }}>OTA version</span>
                <input value={ota} onChange={(e) => setOta(e.target.value)} placeholder="vd: 2.1.5" style={{ ...ctrl, width: 140 }} disabled={!canControl} />
                <button type="button" style={btn} disabled={!canControl || busy === "ota_update"} onClick={() => send("ota_update", ota || undefined)}><Download size={13} /> Cập nhật OTA</button>
                <button type="button" style={{ ...btn, background: "var(--red)", color: "#fff" }} disabled={!canControl || busy === "reboot"} onClick={() => { if (confirm("Khởi động lại thiết bị?")) send("reboot"); }}><RotateCcw size={13} /> Reboot</button>
              </div>
            </div>
          </BentoOuter>
        </div>
      </div>
    </BentoShell>
  );
}
