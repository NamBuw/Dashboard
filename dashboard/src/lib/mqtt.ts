import mqtt, { type MqttClient } from "mqtt";
import { query } from "./db";

// Server-side MQTT singleton. Reuses the PAssistant device-control protocol:
//   command topic:  devices/<DEVICE_ID>/cmd
//   status topic:   devices/<DEVICE_ID>/status   (subscribed for realtime)
// DEVICE_ID = device_hw_id or MAC. Broker URL via env DASHBOARD_MQTT_URL,
// e.g. mqtt://ptalk:ptalk123@171.226.10.121:8443

const URL = process.env.DASHBOARD_MQTT_URL || "";

type StatusListener = (deviceId: string, payload: Record<string, unknown>) => void;

let client: MqttClient | null = null;
const listeners = new Set<StatusListener>();
const lastStatus = new Map<string, Record<string, unknown>>();

function ensureClient(): MqttClient | null {
  if (!URL) return null;
  if (client) return client;
  try {
    client = mqtt.connect(URL, { reconnectPeriod: 5000, connectTimeout: 8000 });
  } catch {
    client = null;
    return null;
  }
  client.on("connect", () => {
    client?.subscribe("devices/+/status", { qos: 1 });
  });
  client.on("message", async (topic, buf) => {
    const m = topic.match(/^devices\/(.+)\/status$/);
    if (!m) return;
    const id = m[1];
    let payload: Record<string, unknown> = {};
    try { payload = JSON.parse(buf.toString()); } catch { payload = { raw: buf.toString() }; }
    lastStatus.set(id, payload);
    listeners.forEach((l) => { try { l(id, payload); } catch { /* ignore */ } });
    // Best-effort: keep devices.status / last_seen_at / firmware fresh.
    try {
      await query(
        `UPDATE devices SET status = 'online', last_seen_at = now(),
           firmware_version = COALESCE($2, firmware_version)
         WHERE device_hw_id = $1 OR mac_address = $1`,
        [id, (payload.firmware_version as string) || null],
      );
    } catch { /* ignore */ }
  });
  client.on("error", () => { /* keep trying via reconnectPeriod */ });
  return client;
}

export function mqttConfigured(): boolean {
  return !!URL;
}

export function publishCommand(deviceId: string, cmd: Record<string, unknown>): boolean {
  const c = ensureClient();
  if (!c) return false;
  try {
    c.publish(`devices/${deviceId}/cmd`, JSON.stringify(cmd), { qos: 1 });
    return true;
  } catch {
    return false;
  }
}

export function subscribeStatus(l: StatusListener): () => void {
  ensureClient();
  listeners.add(l);
  return () => { listeners.delete(l); };
}

export function getLastStatus(deviceId: string): Record<string, unknown> | undefined {
  return lastStatus.get(deviceId);
}
