import { generateAgentReply, updateSession } from "./lib/agent";
import {
  markRead,
  parseInboundWebhook,
  sendWhatsAppText,
  verifyKapsoSignature,
} from "./lib/kapso";
import { ingestPolicyUrls } from "./lib/supermemory";
import type { Env, MessageBuffer, SessionState } from "./lib/types";

const DEBOUNCE_MS = 2800;

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
          ingest_policies: "POST /admin/ingest-policies",
          health: "GET /health",
        },
        model: env.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free",
        memory: Boolean(env.SUPERMEMORY_API_KEY),
        sessions: Boolean(env.SESSIONS),
        note: "Pitch prototype with mock orders only. Not affiliated with Littlebox India.",
      });
    }

    // One-time / occasional: pull Littlebox public policy URLs into SuperMemory
    if (request.method === "POST" && url.pathname === "/admin/ingest-policies") {
      if (!env.SUPERMEMORY_API_KEY) {
        return json({ error: "SUPERMEMORY_API_KEY missing" }, 500);
      }
      const statuses = await ingestPolicyUrls(env.SUPERMEMORY_API_KEY);
      return json({ ok: true, statuses });
    }

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
          await env.SESSIONS.delete(bufferKey(phone));
        }

        const session = await loadSession(env, phone);
        const { reply, lastOrderId } = await generateAgentReply({
          apiKey: env.OPENROUTER_API_KEY,
          model: env.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free",
          userText: message,
          phone,
          session,
          supermemoryKey: env.SUPERMEMORY_API_KEY,
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

      ctx.waitUntil(handleInboundBuffered(env, payload));
      return json({ received: true }, 200);
    }

    return json({ error: "not found" }, 404);
  },
};

/**
 * Buffer rapid WhatsApp messages (user sends 2–3 lines quickly) into one reply.
 * Without this, each line gets a separate dumb answer and looks broken.
 */
async function handleInboundBuffered(env: Env, payload: unknown): Promise<void> {
  try {
    const inbound = parseInboundWebhook(payload);
    if (!inbound) {
      console.log("skip_non_inbound", JSON.stringify(payload).slice(0, 300));
      return;
    }

    if (inbound.messageId) {
      await markRead(env, inbound.messageId);
    }

    const phone = inbound.from.replace(/\D/g, "");
    if (!phone || !inbound.text.trim()) return;

    // No KV → process immediately (still better than nothing)
    if (!env.SESSIONS) {
      await processCombined(env, phone, inbound.text, [inbound.messageId || ""]);
      return;
    }

    const token = crypto.randomUUID();
    const bKey = bufferKey(phone);
    const existing = await loadBuffer(env, phone);
    const next: MessageBuffer = {
      texts: [...(existing?.texts || []), inbound.text.trim()],
      messageIds: [
        ...(existing?.messageIds || []),
        inbound.messageId || "",
      ].filter(Boolean),
      updatedAt: Date.now(),
      token,
    };
    await env.SESSIONS.put(bKey, JSON.stringify(next), {
      expirationTtl: 60,
    });

    await sleep(DEBOUNCE_MS);

    const latest = await loadBuffer(env, phone);
    if (!latest || latest.token !== token) {
      // Newer message arrived — that handler will reply
      return;
    }

    // Clear buffer and process combined text
    await env.SESSIONS.delete(bKey);
    const combined = latest.texts.join("\n");
    await processCombined(env, phone, combined, latest.messageIds);
  } catch (err) {
    console.error("handle_inbound_error", err);
  }
}

async function processCombined(
  env: Env,
  phone: string,
  userText: string,
  _messageIds: string[],
): Promise<void> {
  // Simple lock to avoid double send
  if (env.SESSIONS) {
    const lockKey = `lock:${phone}`;
    const locked = await env.SESSIONS.get(lockKey);
    if (locked) {
      console.log("skip_locked", phone);
      return;
    }
    await env.SESSIONS.put(lockKey, "1", { expirationTtl: 45 });
  }

  try {
    const session = await loadSession(env, phone);
    const { reply, lastOrderId } = await generateAgentReply({
      apiKey: env.OPENROUTER_API_KEY,
      model: env.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free",
      userText,
      phone,
      session,
      supermemoryKey: env.SUPERMEMORY_API_KEY,
    });

    const next = updateSession(session, phone, userText, reply, lastOrderId);
    await saveSession(env, next);

    const sent = await sendWhatsAppText(env, phone, reply);
    if (!sent.ok) {
      console.error("send_failed", sent.detail);
    } else {
      console.log("replied", phone, reply.slice(0, 100));
    }
  } finally {
    if (env.SESSIONS) {
      await env.SESSIONS.delete(`lock:${phone}`);
    }
  }
}

function sessionKey(phone: string) {
  return `session:${phone.replace(/\D/g, "")}`;
}

function bufferKey(phone: string) {
  return `buffer:${phone.replace(/\D/g, "")}`;
}

async function loadBuffer(
  env: Env,
  phone: string,
): Promise<MessageBuffer | undefined> {
  if (!env.SESSIONS) return undefined;
  try {
    const raw = await env.SESSIONS.get(bufferKey(phone));
    if (!raw) return undefined;
    return JSON.parse(raw) as MessageBuffer;
  } catch {
    return undefined;
  }
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
      expirationTtl: 60 * 60 * 24 * 14,
    });
  } catch (err) {
    console.error("session_save_failed", err);
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
