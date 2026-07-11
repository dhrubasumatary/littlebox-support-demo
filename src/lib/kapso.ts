import type { Env, InboundMessage } from "./types";

/**
 * Kapso platform webhooks vary slightly by version.
 * We normalize common shapes used for whatsapp.message.received.
 */
export function parseInboundWebhook(body: unknown): InboundMessage | null {
  if (!body || typeof body !== "object") return null;
  const root = body as Record<string, unknown>;

  // Nested data.message pattern
  const data = (root.data as Record<string, unknown>) || root;
  const message =
    (data.message as Record<string, unknown>) ||
    (root.message as Record<string, unknown>) ||
    data;

  if (!message || typeof message !== "object") return null;

  const type = String(message.type || root.type || "");
  // Ignore status echoes / delivery receipts if they land on same URL
  if (
    type.includes("status") ||
    root.event === "whatsapp.message.sent" ||
    root.event === "whatsapp.message.delivered" ||
    root.event === "whatsapp.message.read"
  ) {
    // only skip pure status events
    if (!message.from && !message.text && !(message as { text?: unknown }).text) {
      return null;
    }
  }

  const from =
    String(
      message.from ||
        message.wa_id ||
        (message.kapso as Record<string, unknown> | undefined)?.phone_number ||
        data.from ||
        "",
    ).replace(/\D/g, "");

  let text = "";
  if (typeof message.text === "string") text = message.text;
  else if (message.text && typeof message.text === "object") {
    text = String((message.text as { body?: string }).body || "");
  } else if (typeof message.body === "string") {
    text = message.body;
  } else if (message.interactive && typeof message.interactive === "object") {
    const interactive = message.interactive as Record<string, unknown>;
    const button = interactive.button_reply as { title?: string; id?: string } | undefined;
    const list = interactive.list_reply as { title?: string; id?: string } | undefined;
    text = button?.title || button?.id || list?.title || list?.id || "";
  } else if (message.button && typeof message.button === "object") {
    text = String((message.button as { text?: string }).text || "");
  } else if (typeof (message as { content?: string }).content === "string") {
    text = String((message as { content?: string }).content);
  }

  // Kapso sometimes puts content under kapso.direction + message content fields
  const kapso = message.kapso as Record<string, unknown> | undefined;
  if (!text && kapso?.content && typeof kapso.content === "string") {
    text = kapso.content;
  }

  // Direction: only handle inbound
  const direction = String(
    kapso?.direction || data.direction || root.direction || "inbound",
  ).toLowerCase();
  if (direction === "outbound" || direction === "outbound_message") {
    return null;
  }

  if (!from || !text.trim()) {
    // try alternate envelope: { message: { ... }, conversation: {} }
    const altText =
      (root as { text?: string }).text ||
      (data as { text?: string }).text ||
      "";
    if (!from || !String(altText).trim()) return null;
    return {
      from,
      text: String(altText).trim(),
      messageId: String(message.id || message.wamid || ""),
      rawType: type,
    };
  }

  return {
    from,
    text: text.trim(),
    messageId: String(message.id || message.wamid || ""),
    conversationId: String(
      (data.conversation as { id?: string } | undefined)?.id ||
        (message as { conversation_id?: string }).conversation_id ||
        "",
    ),
    rawType: type,
  };
}

/** Verify Kapso X-Webhook-Signature when secret is configured. */
export async function verifyKapsoSignature(
  request: Request,
  rawBody: string,
  secret?: string,
): Promise<boolean> {
  if (!secret) return true; // allow if not configured (local dev)
  const header =
    request.headers.get("X-Webhook-Signature") ||
    request.headers.get("x-webhook-signature") ||
    "";
  if (!header) return false;

  // Common patterns: raw hex hmac-sha256, or sha256=<hex>
  const provided = header.replace(/^sha256=/i, "").trim();

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(rawBody),
  );
  const hex = [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // timing-safe-ish compare
  if (hex.length !== provided.length) return false;
  let ok = 0;
  for (let i = 0; i < hex.length; i++) {
    ok |= hex.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return ok === 0;
}

export async function sendWhatsAppText(
  env: Env,
  to: string,
  body: string,
): Promise<{ ok: boolean; detail: string }> {
  const phoneNumberId = env.KAPSO_PHONE_NUMBER_ID;
  const apiKey = env.KAPSO_API_KEY;
  if (!phoneNumberId || !apiKey) {
    return { ok: false, detail: "Missing KAPSO_PHONE_NUMBER_ID or KAPSO_API_KEY" };
  }

  // Kapso Meta proxy — send text
  const url = `https://api.kapso.ai/meta/whatsapp/v24.0/${phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to.replace(/\D/g, ""),
      type: "text",
      text: { body: body.slice(0, 4000) },
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    // Alternate base used in some docs
    const alt = await fetch(
      `https://app.kapso.ai/api/meta/v24.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to.replace(/\D/g, ""),
          type: "text",
          text: { body: body.slice(0, 4000) },
        }),
      },
    );
    const altText = await alt.text();
    if (!alt.ok) {
      return {
        ok: false,
        detail: `send failed ${res.status}: ${text.slice(0, 300)} | alt ${alt.status}: ${altText.slice(0, 200)}`,
      };
    }
    return { ok: true, detail: altText.slice(0, 200) };
  }

  return { ok: true, detail: text.slice(0, 200) };
}

export async function markRead(env: Env, messageId: string): Promise<void> {
  if (!messageId) return;
  try {
    await fetch(
      `https://api.kapso.ai/meta/whatsapp/v24.0/${env.KAPSO_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": env.KAPSO_API_KEY,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          status: "read",
          message_id: messageId,
        }),
      },
    );
  } catch {
    /* non-fatal */
  }
}
