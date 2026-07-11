import {
  extractOrderIdFromText,
  getOrderById,
  getOrdersByPhone,
  listDemoOrdersSummary,
} from "./orders";
import { chatSimple, chatWithTools, type ChatMessage } from "./openrouter";
import { SYSTEM_PROMPT } from "./prompt";
import { cleanReply, looksLikeMetaLeak } from "./sanitize";
import {
  addMemory,
  customerTag,
  getCustomerContext,
  searchPolicy,
} from "./supermemory";
import type { SessionState } from "./types";

function runTool(name: string, argsJson: string, defaultPhone?: string): string {
  let args: Record<string, unknown> = {};
  try {
    args = JSON.parse(argsJson || "{}") as Record<string, unknown>;
  } catch {
    args = {};
  }

  if (name === "lookup_order") {
    const orderId = typeof args.order_id === "string" ? args.order_id : undefined;
    const phone =
      typeof args.phone === "string" ? args.phone : defaultPhone || undefined;

    if (orderId) {
      const order = getOrderById(orderId);
      if (order) return JSON.stringify({ found: true, order });
    }
    if (phone) {
      const list = getOrdersByPhone(phone);
      if (list.length === 1) return JSON.stringify({ found: true, order: list[0] });
      if (list.length > 1) {
        return JSON.stringify({
          found: true,
          multiple: true,
          orders: list,
          hint: "Ask which order if needed",
        });
      }
    }
    return JSON.stringify({
      found: false,
      message:
        "No matching mock order for that ID. Demo IDs: LB10234 overdue, LB10235 processing, LB10236 dispatched, LB10237 delivered recent, LB10238 delivered old, LB10239 damage.",
      demo_orders: listDemoOrdersSummary(),
    });
  }

  if (name === "list_orders_for_phone") {
    const phone =
      typeof args.phone === "string" ? args.phone : defaultPhone || "";
    const list = getOrdersByPhone(phone);
    return JSON.stringify({ count: list.length, orders: list });
  }

  return JSON.stringify({ error: `Unknown tool: ${name}` });
}

function isFrustration(text: string): boolean {
  return /\b(wtf|what the|useless|stupid|idiot|can't u|cant u|can't you|already told|i told you|are you dumb|bs|fuck)\b/i.test(
    text,
  );
}

function isGreeting(text: string): boolean {
  return /^\s*(hi|hello|hey|hii|hlo|yo|namaste|good morning|good evening)\b[!.,\s]*$/i.test(
    text.trim(),
  );
}

function wantsBankRefund(text: string): boolean {
  const t = text.toLowerCase();
  return (
    (t.includes("refund") || t.includes("money back")) &&
    (t.includes("bank") || t.includes("upi") || t.includes("cash") || t.includes("account"))
  );
}

function wantsCancel(text: string): boolean {
  return /\bcancel\b/i.test(text);
}

function isDelayComplaint(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("ship") ||
    t.includes("late") ||
    t.includes("delay") ||
    t.includes("weeks") ||
    t.includes("hasn't") ||
    t.includes("hasnt") ||
    t.includes("not shipped") ||
    t.includes("processing") ||
    (t.includes("order") && t.includes("dress"))
  );
}

function buildPrefetchContext(
  userText: string,
  phone: string,
  session?: SessionState,
) {
  const extracted = extractOrderIdFromText(userText);
  const orderId = extracted || session?.lastOrderId;
  const chunks: string[] = [];

  if (orderId) {
    const order = getOrderById(orderId);
    if (order) {
      chunks.push(
        `ACTIVE ORDER (already discussed / provided — DO NOT ask for order ID again):\n${JSON.stringify(order, null, 2)}`,
      );
    } else if (extracted) {
      chunks.push(`Order id ${orderId} not found in mock data. Ask once for correct LB id.`);
    }
  }

  // Phone-linked mock orders (optional bonus)
  const byPhone = getOrdersByPhone(phone);
  if (byPhone.length && !orderId) {
    chunks.push(
      `Orders linked to this WhatsApp number:\n${JSON.stringify(byPhone, null, 2)}`,
    );
  }

  if (session?.history?.length) {
    const brief = session.history
      .slice(-6)
      .map((h) => `${h.role}: ${h.content}`)
      .join("\n");
    chunks.push(`Recent chat (this session):\n${brief}`);
  }

  return {
    context: chunks.join("\n\n"),
    lastOrderId: orderId,
  };
}

/** Deterministic high-stakes answers so free models can't invent bank refunds or forget order. */
function smartDeterministic(
  userText: string,
  phone: string,
  lastOrderId?: string,
): string | null {
  const order = lastOrderId
    ? getOrderById(lastOrderId)
    : getOrdersByPhone(phone)[0];
  const t = userText.toLowerCase();

  if (isGreeting(userText)) {
    return order
      ? `Hey! Still here with you on ${order.order_id} (${order.item}). What do you need — status, cancel, return, or something else?`
      : "Hey! I'm Maya — Littlebox support. Order delay, cancel, return, missing package? Drop your order number (like LB10234) and I'll pull it up.";
  }

  if (isFrustration(userText) && order) {
    return `Got it — I'm still on your order ${order.order_id} (${order.item}, ${order.status}). I didn't lose it. Tell me what you need next: cancel, status update, or return/refund path.`;
  }
  if (isFrustration(userText)) {
    return "Sorry — I lost the thread for a sec. Share your order number again (e.g. LB10234) and what you need: delay, cancel, or refund.";
  }

  // Bare order id
  if (/^\s*(LB\s*-?\s*\d{4,6})\s*$/i.test(userText.trim()) && order) {
    if (order.computed.is_past_production_window) {
      return `Found ${order.order_id}: ${order.item}. It's been processing for ${order.computed.days_since_order} days — past the usual 7–14 day production window. You can raise a ticket via My Account, or cancel for a full prepaid refund (5–7 business days) since it hasn't dispatched. What do you want to do?`;
    }
    return `Found ${order.order_id}: ${order.item} — status ${order.status}. How can I help: delay/status, cancel, return, or something else?`;
  }

  if (wantsBankRefund(userText)) {
    if (order && order.computed.can_cancel_pre_dispatch) {
      return `${order.order_id} (${order.item}) is still ${order.status} / not dispatched. You can cancel and get a refund to your original prepaid method in 5–7 business days (not a "return"). Path: My Account → My Orders → ${order.order_id} → cancel. Once delivered, returns are store credit only — no bank/UPI. Want cancel steps?`;
    }
    if (order && !order.computed.can_cancel_pre_dispatch) {
      return `${order.order_id} is already ${order.status}, so bank refund via cancel isn't available. After delivery, returns = store credit only (1 year), ₹99 handling fee — no bank/UPI/cash. Shipping charges non-refundable.`;
    }
    return "Two paths: (1) Cancel before dispatch → prepaid refund to original payment in 5–7 business days. (2) Return after delivery → store credit only (1 year), ₹99 fee — no bank/UPI. Share your order number if you want me to check which applies.";
  }

  if (wantsCancel(userText) && order) {
    if (order.computed.can_cancel_pre_dispatch) {
      return `${order.order_id} (${order.item}) is still ${order.status}, so yes — cancel is possible. My Account → My Orders → ${order.order_id} → cancel. Prepaid refund hits original payment in 5–7 business days if approved.`;
    }
    return `${order.order_id} already ${order.status} — can't cancel. After delivery: return within 7 days for store credit (₹99 fee).`;
  }

  if (isDelayComplaint(userText) && order) {
    if (order.computed.is_past_production_window) {
      return `Totally fair you're frustrated. ${order.order_id} (${order.item}) has been processing ${order.computed.days_since_order} days — past the 7–14 day production window. Raise a ticket with that order number, or cancel for prepaid refund (5–7 business days) while it's still pre-dispatch.`;
    }
    return `${order.order_id} is ${order.status}. Made-to-order: usually 7–14 days production, then 4–5 days courier. You're around day ${order.computed.days_since_order}. If it crosses 14 days with no dispatch, we escalate.`;
  }

  if (isDelayComplaint(userText) && !order) {
    return "Littlebox stitches made-to-order (not pre-stocked): usually 7–14 days to dispatch, then 4–5 days delivery. Share your order number (e.g. LB10234) and I'll check exactly where yours sits.";
  }

  if (t.includes("cod") && (t.includes("safe") || t.includes("safer"))) {
    return "Prepaid isn't less safe than COD — checkout is Shopify Level 1 PCI DSS, TLS, 3D Secure. Card details aren't stored on Littlebox servers. COD is preference, not a security upgrade. Prepaid also gets 5% off + free shipping.";
  }

  return null;
}

export async function generateAgentReply(opts: {
  apiKey: string;
  model: string;
  userText: string;
  phone: string;
  session?: SessionState;
  supermemoryKey?: string;
}): Promise<{ reply: string; lastOrderId?: string }> {
  const { apiKey, model, userText, phone, session, supermemoryKey } = opts;
  const prefetch = buildPrefetchContext(userText, phone, session);
  let lastOrderId = prefetch.lastOrderId;

  // SuperMemory: recall before answering
  let memoryBlock = "";
  let policyBlock = "";
  if (supermemoryKey) {
    const [ctx, pol] = await Promise.all([
      getCustomerContext(supermemoryKey, phone, userText),
      searchPolicy(supermemoryKey, userText, 3),
    ]);
    memoryBlock = ctx;
    if (pol.length) policyBlock = pol.join("\n---\n");

    // Try recover last order from memory text if session empty
    if (!lastOrderId && memoryBlock) {
      const m = memoryBlock.match(/\b(LB\d{4,6})\b/i);
      if (m) lastOrderId = m[1].toUpperCase();
    }
  }

  // Prefer deterministic when we can — free models forget + leak meta
  const det = smartDeterministic(userText, phone, lastOrderId);
  if (det) {
    await persistTurn(supermemoryKey, phone, userText, det, lastOrderId);
    return { reply: det, lastOrderId };
  }

  const nowLine = `Current datetime (IST): ${new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  })}`;

  const history = (session?.history || []).slice(-10);
  const userContent = [
    nowLine,
    `Customer WhatsApp: ${phone}`,
    lastOrderId
      ? `LOCKED ORDER ID FOR THIS CHAT: ${lastOrderId} — never claim you don't know their order if this is set.`
      : "",
    prefetch.context ? `System context:\n${prefetch.context}` : "",
    memoryBlock ? `Supermemory customer context:\n${memoryBlock}` : "",
    policyBlock ? `Policy excerpts (Littlebox public docs):\n${policyBlock}` : "",
    `Customer message:\n${userText}`,
    "Reply as Maya in WhatsApp style. No meta. No 'We need to respond'. Use the locked order if present.",
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "user", content: userContent },
    ];

    for (let i = 0; i < 3; i++) {
      const completion = await chatWithTools({ apiKey, model, messages });
      const msg = completion.choices?.[0]?.message;
      if (!msg) break;

      if (msg.tool_calls?.length) {
        messages.push({
          role: "assistant",
          content: msg.content,
          tool_calls: msg.tool_calls,
        });
        for (const tc of msg.tool_calls) {
          const result = runTool(tc.function.name, tc.function.arguments, phone);
          try {
            const parsed = JSON.parse(result) as {
              order?: { order_id?: string };
            };
            if (parsed.order?.order_id) lastOrderId = parsed.order.order_id;
          } catch {
            /* ignore */
          }
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            name: tc.function.name,
            content: result,
          });
        }
        continue;
      }

      let text = cleanReply(msg.content || "");
      if (text && !looksLikeMetaLeak(text)) {
        await persistTurn(supermemoryKey, phone, userText, text, lastOrderId);
        return { reply: text, lastOrderId };
      }
      break;
    }
  } catch (err) {
    console.error("tool_loop_failed", err);
  }

  // Simple LLM fallback
  try {
    let reply = cleanReply(
      await chatSimple({
        apiKey,
        model,
        system: SYSTEM_PROMPT,
        messages: [
          ...history,
          { role: "user", content: userContent },
        ],
        extraContext: [prefetch.context, memoryBlock, policyBlock]
          .filter(Boolean)
          .join("\n\n"),
      }),
    );
    if (reply && !looksLikeMetaLeak(reply)) {
      await persistTurn(supermemoryKey, phone, userText, reply, lastOrderId);
      return { reply, lastOrderId };
    }
  } catch (err) {
    console.error("simple_chat_failed", err);
  }

  const fallback =
    smartDeterministic(userText, phone, lastOrderId) ||
    (lastOrderId
      ? `Still have ${lastOrderId} on file. Tell me what you need: status, cancel, or refund/return path.`
      : "Got it. Send your order number (like LB10234) and what you need — status, cancel, return, or missing package.");

  await persistTurn(supermemoryKey, phone, userText, fallback, lastOrderId);
  return { reply: fallback, lastOrderId };
}

async function persistTurn(
  smKey: string | undefined,
  phone: string,
  userText: string,
  reply: string,
  lastOrderId?: string,
): Promise<void> {
  if (!smKey) return;
  const tag = customerTag(phone);
  const content = [
    `user: ${userText}`,
    `assistant: ${reply}`,
    lastOrderId ? `active_order_id: ${lastOrderId}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  await addMemory(smKey, {
    containerTag: tag,
    content,
    metadata: {
      channel: "whatsapp",
      order_id: lastOrderId || "",
      type: "chat_turn",
    },
  });
  if (lastOrderId) {
    await addMemory(smKey, {
      containerTag: tag,
      content: `Customer active order is ${lastOrderId}. Always remember this order for this WhatsApp user until they switch orders.`,
      customId: `active_order_${tag}`,
      metadata: { type: "active_order", order_id: lastOrderId },
    });
  }
}

export function updateSession(
  prev: SessionState | undefined,
  phone: string,
  userText: string,
  reply: string,
  lastOrderId?: string,
): SessionState {
  const history = [...(prev?.history || [])];
  history.push({ role: "user", content: userText });
  history.push({ role: "assistant", content: reply });
  while (history.length > 16) history.shift();

  return {
    phone: phone.replace(/\D/g, ""),
    lastOrderId: lastOrderId || prev?.lastOrderId,
    history,
    updatedAt: new Date().toISOString(),
  };
}
