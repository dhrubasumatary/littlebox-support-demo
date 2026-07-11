import { generateAgentReply, updateSession } from "./lib/agent";
import {
  markRead,
  parseInboundWebhook,
  sendWhatsAppText,
  verifyKapsoSignature,
} from "./lib/kapso";
import type { Env, SessionState } from "./lib/types";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return json({
        ok: true,
        service: env.DEMO_NAME || "littlebox-support-demo",
        endpoints: {
          webhook: "POST /webhooks/kapso",
          simulate: "POST /demo/simulate",
          health: "GET /health",
        },
        model: env.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free",
        note: "Pitch prototype with mock orders only. Not affiliated with Littlebox India.",
      });
    }

    // Local / pitch rehearsal without WhatsApp
    if (request.method === "POST" && url.pathname === "/demo/simulate") {
      try {
        const body = (await request.json()) as {
          message?: string;
          phone?: string;
          reset?: boolean;
        };
        const phone = (body.phone || "919876543210").replace(/\D/g, "");
        const message = (body.message || "").trim();
        if (!message) return json({ error: "message required" }, 400);

        if (body.reset && env.SESSIONS) {
          await env.SESSIONS.delete(sessionKey(phone));
        }

        const session = await loadSession(env, phone);
        const { reply, lastOrderId } = await generateAgentReply({
          apiKey: env.OPENROUTER_API_KEY,
          model: env.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free",
          userText: message,
          phone,
          session,
        });

        const next = updateSession(session, phone, message, reply, lastOrderId);
        await saveSession(env, next);

        return json({ phone, message, reply, lastOrderId: next.lastOrderId });
      } catch (err) {
        return json(
          { error: err instanceof Error ? err.message : "simulate failed" },
          500,
        );
      }
    }

    if (request.method === "POST" && url.pathname === "/webhooks/kapso") {
      const rawBody = await request.text();

      const valid = await verifyKapsoSignature(
        request,
        rawBody,
        env.KAPSO_WEBHOOK_SECRET,
      );
      if (!valid) {
        return json({ error: "invalid signature" }, 401);
      }

      let payload: unknown;
      try {
        payload = JSON.parse(rawBody);
      } catch {
        return json({ error: "invalid json" }, 400);
      }

      // Ack fast — process async so Kapso doesn't retry on LLM latency
      ctx.waitUntil(handleInbound(env, payload));
      return json({ received: true }, 200);
    }

    return json({ error: "not found" }, 404);
  },
};

async function handleInbound(env: Env, payload: unknown): Promise<void> {
  try {
    const inbound = parseInboundWebhook(payload);
    if (!inbound) {
      console.log("skip_non_inbound", JSON.stringify(payload).slice(0, 400));
      return;
    }

    if (inbound.messageId) {
      await markRead(env, inbound.messageId);
    }

    const session = await loadSession(env, inbound.from);
    const { reply, lastOrderId } = await generateAgentReply({
      apiKey: env.OPENROUTER_API_KEY,
      model: env.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free",
      userText: inbound.text,
      phone: inbound.from,
      session,
    });

    const next = updateSession(
      session,
      inbound.from,
      inbound.text,
      reply,
      lastOrderId,
    );
    await saveSession(env, next);

    const sent = await sendWhatsAppText(env, inbound.from, reply);
    if (!sent.ok) {
      console.error("send_failed", sent.detail);
    } else {
      console.log("replied", inbound.from, reply.slice(0, 80));
    }
  } catch (err) {
    console.error("handle_inbound_error", err);
  }
}

function sessionKey(phone: string) {
  return `session:${phone.replace(/\D/g, "")}`;
}

async function loadSession(env: Env, phone: string): Promise<SessionState | undefined> {
  if (!env.SESSIONS) return undefined;
  try {
    const raw = await env.SESSIONS.get(sessionKey(phone));
    if (!raw) return undefined;
    return JSON.parse(raw) as SessionState;
  } catch {
    return undefined;
  }
}

async function saveSession(env: Env, session: SessionState): Promise<void> {
  if (!env.SESSIONS) return;
  try {
    await env.SESSIONS.put(sessionKey(session.phone), JSON.stringify(session), {
      expirationTtl: 60 * 60 * 24 * 7,
    });
  } catch (err) {
    console.error("session_save_failed", err);
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
