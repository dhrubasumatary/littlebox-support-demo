import {
  extractOrderIdFromText,
  getOrderById,
  getOrdersByPhone,
  listDemoOrdersSummary,
} from "./orders";
import { chatSimple, chatWithTools, type ChatMessage } from "./openrouter";
import { SYSTEM_PROMPT } from "./prompt";
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
      message: "No matching mock order. Ask for order ID like LB10234.",
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

function isOrderIntent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\b(lb\s*-?\s*\d{4,6}|\border\b|cancel|ship|dispatch|track|deliver|late|delay|weeks|return|exchange|damaged|wrong item|processing)\b/i.test(
      t,
    ) || Boolean(extractOrderIdFromText(text))
  );
}

function isPurePolicyQuestion(text: string): boolean {
  const t = text.toLowerCase();
  if (extractOrderIdFromText(text)) return false;
  return (
    (t.includes("cod") && (t.includes("safe") || t.includes("safer"))) ||
    (t.includes("refund") &&
      (t.includes("bank") || t.includes("upi") || t.includes("cash") || t.includes("return"))) ||
    t.includes("store credit") ||
    t.includes("how long") && t.includes("support")
  );
}

function buildPrefetchContext(userText: string, phone: string, session?: SessionState) {
  const extracted = extractOrderIdFromText(userText);
  // Don't carry last order into pure policy Qs (avoids free models answering cancel instead of store-credit)
  const orderId = extracted || (isPurePolicyQuestion(userText) ? undefined : session?.lastOrderId);
  const chunks: string[] = [];

  if (orderId) {
    const order = getOrderById(orderId);
    if (order) {
      chunks.push(`Matched order ${orderId}:\n${JSON.stringify(order, null, 2)}`);
    } else {
      chunks.push(`Order id ${orderId} not found in mock data.`);
    }
  }

  // Only auto-load phone orders for order-related intents (not "hi" or pure policy)
  if (isOrderIntent(userText) && !isPurePolicyQuestion(userText)) {
    const byPhone = getOrdersByPhone(phone);
    if (byPhone.length) {
      chunks.push(
        `Orders for this WhatsApp number (${phone}):\n${JSON.stringify(byPhone, null, 2)}`,
      );
    }
  }

  return {
    context: chunks.join("\n\n"),
    lastOrderId: orderId || session?.lastOrderId,
  };
}

export async function generateAgentReply(opts: {
  apiKey: string;
  model: string;
  userText: string;
  phone: string;
  session?: SessionState;
}): Promise<{ reply: string; lastOrderId?: string }> {
  const { apiKey, model, userText, phone, session } = opts;
  const nowLine = `Current datetime (IST): ${new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  })}`;

  const prefetch = buildPrefetchContext(userText, phone, session);

  // Policy Qs that free models often get wrong — answer from locked copy first
  if (isPurePolicyQuestion(userText)) {
    const det = deterministicFallback(userText, phone, prefetch.lastOrderId);
    if (det && !det.startsWith("Got it.")) {
      return { reply: det, lastOrderId: prefetch.lastOrderId };
    }
  }

  // Simple greetings — keep snappy without order dumps
  if (/^\s*(hi|hello|hey|hii|hlo|yo)\b[!.,\s]*$/i.test(userText.trim())) {
    return {
      reply:
        "Hey! I'm Maya — Littlebox support. What's going on: order delay, cancel, return, missing package, or something else? Order number helps if you have it.",
      lastOrderId: session?.lastOrderId,
    };
  }

  const history = (session?.history || []).slice(-8);
  const userContent = [
    nowLine,
    `Customer WhatsApp: ${phone}`,
    prefetch.context ? `Prefetched system context:\n${prefetch.context}` : "",
    `Customer message:\n${userText}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    { role: "user", content: userContent },
  ];

  try {
    let lastOrderId = prefetch.lastOrderId;
    // Tool loop (max 4 rounds)
    for (let i = 0; i < 4; i++) {
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
              orders?: Array<{ order_id?: string }>;
            };
            if (parsed.order?.order_id) lastOrderId = parsed.order.order_id;
            else if (parsed.orders?.[0]?.order_id)
              lastOrderId = parsed.orders[0].order_id;
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

      const text = (msg.content || "").trim();
      if (text) {
        return { reply: text, lastOrderId };
      }
      break;
    }
  } catch (err) {
    console.error("tool_loop_failed", err);
  }

  // High-stakes policy answers: prefer deterministic copy so free models don't invent bank refunds
  if (isPurePolicyQuestion(userText)) {
    const det = deterministicFallback(userText, phone, prefetch.lastOrderId);
    if (det && !det.startsWith("Got it.")) {
      return { reply: det, lastOrderId: prefetch.lastOrderId };
    }
  }

  // Fallback: no tools / model hiccup — inject prefetch + simple chat
  try {
    const reply = await chatSimple({
      apiKey,
      model,
      system: SYSTEM_PROMPT,
      messages: [
        ...history,
        {
          role: "user",
          content: userContent,
        },
      ],
      extraContext: prefetch.context || undefined,
    });
    if (reply) {
      // Guardrail: free models sometimes invent bank refunds on returns
      if (
        /return/i.test(userText) &&
        /bank|upi|cash/i.test(userText) &&
        /refund to your (bank|original)/i.test(reply) &&
        !/store credit/i.test(reply)
      ) {
        return {
          reply: deterministicFallback(userText, phone, prefetch.lastOrderId),
          lastOrderId: prefetch.lastOrderId,
        };
      }
      return { reply, lastOrderId: prefetch.lastOrderId };
    }
  } catch (err) {
    console.error("simple_chat_failed", err);
  }

  // Deterministic last-resort so WhatsApp never goes silent during a pitch
  return {
    reply: deterministicFallback(userText, phone, prefetch.lastOrderId),
    lastOrderId: prefetch.lastOrderId,
  };
}

function deterministicFallback(
  userText: string,
  phone: string,
  orderId?: string,
): string {
  const t = userText.toLowerCase();
  const order = orderId ? getOrderById(orderId) : getOrdersByPhone(phone)[0];

  if (/^\s*(hi|hello|hey|hii|hlo)\b/i.test(userText.trim())) {
    return "Hey! I'm Maya from Littlebox support. Share your order number (like LB10234) or tell me what's up — delay, cancel, return, missing package — and I'll sort it.";
  }

  if (t.includes("cod") && (t.includes("safe") || t.includes("safer"))) {
    return "Prepaid isn't less safe than COD here — checkout runs on Shopify with Level 1 PCI DSS, TLS, and 3D Secure. Card details aren't stored on Littlebox servers. COD is fine if you prefer it, but it's a preference, not a security upgrade. Prepaid also gets 5% off + free shipping.";
  }

  if (
    t.includes("return") &&
    (t.includes("refund") || t.includes("bank") || t.includes("upi") || t.includes("cash"))
  ) {
    return "For a return after delivery: Littlebox issues store credit only — not bank/UPI/cash. Credit is valid 1 year site-wide, and there's a flat ₹99 return handling fee per order. Cash back to your original payment only happens if you cancel before dispatch. Want steps to raise a return from My Account?";
  }

  if (t.includes("bank") || t.includes("refund") || t.includes("upi")) {
    return "Two different paths: (1) Cancel before dispatch → prepaid refund to original payment in 5–7 business days. (2) Return after delivery → store credit only (1 year), ₹99 handling fee — no bank/UPI. Share your order number if you want me to check which applies.";
  }

  if (t.includes("cancel")) {
    if (order?.computed.can_cancel_pre_dispatch) {
      return `Your ${order.item} (${order.order_id}) is still ${order.status}, so cancellation is possible. Go to My Account → My Orders → that order and raise cancel, or tell me to walk you through it. Prepaid refunds hit the original method in 5–7 business days if approved.`;
    }
    if (order && !order.computed.can_cancel_pre_dispatch) {
      return `${order.order_id} is already ${order.status}, so it can't be cancelled. After delivery you can return within 7 days for store credit (₹99 fee). Want the return steps?`;
    }
    return "I can check cancel eligibility — drop your order number (e.g. LB10234). Cancel works only before dispatch.";
  }

  if (
    t.includes("delivered") &&
    (t.includes("not") || t.includes("never") || t.includes("didn't") || t.includes("didnt"))
  ) {
    return "If tracking says delivered but you don't have the parcel: check security/neighbours/door first, then raise a ticket in My Account within 24 hours of the delivered update with your order number — after that window courier investigation usually can't start. Share your order ID and I'll check the mock status.";
  }

  if (
    t.includes("late") ||
    t.includes("long") ||
    t.includes("delay") ||
    t.includes("weeks") ||
    t.includes("ship")
  ) {
    if (order) {
      if (order.computed.is_past_production_window) {
        return `Totally fair you're frustrated — ${order.order_id} (${order.item}) has been in processing for ${order.computed.days_since_order} days, past the usual 7–14 day production window. Raise a ticket with that order number via My Account or chat so the team can pull a real update. It's still pre-dispatch, so you can also cancel for a full prepaid refund (5–7 business days) if you don't want to wait.`;
      }
      return `${order.order_id} is ${order.status}. Littlebox stitches made-to-order: usually 7–14 days to dispatch, then 4–5 business days to deliver. You're about day ${order.computed.days_since_order} — I can keep an eye with you; if it crosses 14 days with no dispatch, we escalate.`;
    }
    return "Littlebox makes pieces after you order (not pre-stocked), so production is usually 7–14 days, then 4–5 days courier. Share your order number and I'll check where yours sits.";
  }

  return "Got it. Send your order number (like LB10234) and what you need — status, cancel, return, missing package, or a policy question — and I'll help right away.";
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
  while (history.length > 12) history.shift();

  return {
    phone,
    lastOrderId: lastOrderId || prev?.lastOrderId,
    history,
    updatedAt: new Date().toISOString(),
  };
}
