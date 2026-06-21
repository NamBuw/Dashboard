import { auth } from "@/lib/auth";
import { subscribeStatus } from "@/lib/mqtt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// SSE stream of realtime device status (MQTT devices/+/status). SuperAdmin only.
export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  if (!session.user.is_superuser) return new Response("Forbidden", { status: 403 });

  const enc = new TextEncoder();
  let unsub = () => {};
  let hb: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (obj: unknown) => {
        try { controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`)); } catch { /* closed */ }
      };
      send({ type: "ready" });
      unsub = subscribeStatus((deviceId, payload) => send({ type: "status", deviceId, payload }));
      hb = setInterval(() => {
        try { controller.enqueue(enc.encode(": ping\n\n")); } catch { /* closed */ }
      }, 25000);
    },
    cancel() {
      unsub();
      if (hb) clearInterval(hb);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
