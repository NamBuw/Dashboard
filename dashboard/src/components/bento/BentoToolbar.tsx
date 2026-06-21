"use client";

import { Search, Bell, Sun, Moon, Users as UsersIcon, Monitor, AlertCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../ThemeProvider";
import { Dropdown } from "@/components/ui/Dropdown";

interface SearchUser { id: string; username: string; displayName: string | null; email: string }
interface SearchDevice { id: string; serialNumber: string; ownerName: string | null; status: string }
interface AlertItem { id: string | number; severity: string; message: string; time: string }

const round: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: "50%",
  background: "var(--inner)",
  boxShadow: "var(--shadow-sm)",
  color: "var(--ink-2)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  cursor: "pointer",
  position: "relative",
};

export default function BentoToolbar() {
  const { theme, toggle } = useTheme();
  const router = useRouter();

  // Search
  const [q, setQ] = useState("");
  const [sOpen, setSOpen] = useState(false);
  const [results, setResults] = useState<{ users: SearchUser[]; devices: SearchDevice[] }>({ users: [], devices: [] });
  const searchRef = useRef<HTMLDivElement>(null);

  // Notifications (alerts)
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (searchRef.current && !searchRef.current.contains(t)) setSOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Debounced search across users + devices
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults({ users: [], devices: [] }); return; }
    const t = setTimeout(async () => {
      try {
        const [u, d] = await Promise.all([
          fetch(`/api/users?search=${encodeURIComponent(term)}&limit=6`).then((r) => (r.ok ? r.json() : { users: [] })),
          fetch(`/api/devices`).then((r) => (r.ok ? r.json() : { devices: [] })),
        ]);
        const lc = term.toLowerCase();
        const devices = (d.devices || [])
          .filter((x: SearchDevice) =>
            (x.serialNumber || "").toLowerCase().includes(lc) || (x.ownerName || "").toLowerCase().includes(lc))
          .slice(0, 6);
        setResults({ users: (u.users || []).slice(0, 6), devices });
      } catch { setResults({ users: [], devices: [] }); }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  // Load alerts (poll every 60s)
  useEffect(() => {
    const load = () =>
      fetch("/api/alerts").then((r) => (r.ok ? r.json() : { alerts: [] })).then((d) => setAlerts(d.alerts || [])).catch(() => {});
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  const go = (href: string) => { setSOpen(false); setQ(""); router.push(href); };
  const hasResults = results.users.length > 0 || results.devices.length > 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, flex: "none" }}>
      {/* Search */}
      <div ref={searchRef} style={{ position: "relative" }} className="bento-search-wrap">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            height: 42,
            padding: "0 14px",
            borderRadius: 24,
            background: "var(--inner)",
            color: "var(--muted)",
            fontSize: 13,
            width: 230,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <Search size={16} strokeWidth={1.8} />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setSOpen(true); }}
            onFocus={() => setSOpen(true)}
            placeholder="Tìm user, thiết bị…"
            style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "var(--ink)", fontSize: 13 }}
          />
        </div>
        {sOpen && q.trim().length >= 2 && (
          <div
            className="anim-scale-in"
            style={{
              position: "absolute", top: "calc(100% + 8px)", left: 0, width: 300, zIndex: 40,
              background: "var(--inner)", border: "1px solid var(--btn-line)", borderRadius: 16, padding: 7,
              boxShadow: "0 2px 6px rgba(20,22,28,.08), 0 20px 50px -16px rgba(20,22,28,.4)", maxHeight: 360, overflowY: "auto",
            }}
          >
            {!hasResults && <div style={{ padding: 12, fontSize: 12.5, color: "var(--muted)" }}>Không có kết quả.</div>}
            {results.users.length > 0 && (
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--faint)", padding: "8px 10px 4px" }}>Người dùng</div>
            )}
            {results.users.map((u) => (
              <div key={`u-${u.id}`} role="button" tabIndex={0} onClick={() => go("/users")}
                onKeyDown={(e) => { if (e.key === "Enter") go("/users"); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--inner-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <UsersIcon size={15} style={{ color: "var(--blue)", flex: "none" }} strokeWidth={1.8} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.displayName || u.username}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
                </div>
              </div>
            ))}
            {results.devices.length > 0 && (
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--faint)", padding: "8px 10px 4px" }}>Thiết bị</div>
            )}
            {results.devices.map((d) => (
              <div key={`d-${d.id}`} role="button" tabIndex={0} onClick={() => go("/devices")}
                onKeyDown={(e) => { if (e.key === "Enter") go("/devices"); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--inner-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <Monitor size={15} style={{ color: "var(--green)", flex: "none" }} strokeWidth={1.8} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.serialNumber}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{d.ownerName || "—"} · {d.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Theme toggle */}
      <button onClick={toggle} type="button" aria-label="Chuyển giao diện" style={round}>
        <span style={{ display: "inline-flex", transition: "transform .45s var(--ease-spring)", transform: theme === "dark" ? "rotate(180deg)" : "none" }}>
          {theme === "dark" ? <Sun size={17} strokeWidth={1.8} /> : <Moon size={17} strokeWidth={1.8} />}
        </span>
      </button>

      {/* Bell / alerts */}
      <Dropdown
        align="right"
        width={320}
        menuStyle={{ borderRadius: 16, maxHeight: 380, zIndex: 40 }}
        trigger={
          <button type="button" aria-label="Thông báo" style={round}>
            <Bell size={17} strokeWidth={1.8} />
            {alerts.length > 0 && (
              <span style={{ position: "absolute", top: 6, right: 7, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 8, background: "var(--red)", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {alerts.length > 9 ? "9+" : alerts.length}
              </span>
            )}
          </button>
        }
      >
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--faint)", padding: "8px 10px 6px" }}>Cảnh báo</div>
        {alerts.length === 0 && <div style={{ padding: 12, fontSize: 12.5, color: "var(--muted)" }}>Không có cảnh báo nào.</div>}
        {alerts.map((a) => {
          const tone = a.severity === "high" ? "var(--red)" : a.severity === "warning" ? "var(--amber)" : "var(--slate)";
          return (
            <div key={a.id} style={{ display: "flex", gap: 9, padding: "9px 10px", borderRadius: 10 }}>
              <AlertCircle size={15} style={{ color: tone, flex: "none", marginTop: 1 }} strokeWidth={1.8} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, color: "var(--ink)", lineHeight: 1.4 }}>{a.message}</div>
                {a.time && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{a.time}</div>}
              </div>
            </div>
          );
        })}
      </Dropdown>

    </div>
  );
}
