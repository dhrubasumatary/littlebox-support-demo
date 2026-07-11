import rawOrders from "../data/orders.json";
import type { MockOrder } from "./types";

const ORDERS = rawOrders as MockOrder[];

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").replace(/^0+/, "");
}

function daysBetween(isoDate: string, now = new Date()): number {
  const start = new Date(isoDate.includes("T") ? isoDate : `${isoDate}T00:00:00+05:30`);
  const ms = now.getTime() - start.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function hoursBetween(isoDate: string, now = new Date()): number {
  const start = new Date(isoDate);
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60));
}

/** Enrich order with demo-clock policy flags for the LLM. */
export function enrichOrder(order: MockOrder, now = new Date()) {
  const daysSinceOrder = daysBetween(order.order_date, now);
  const daysSinceDispatch = order.dispatch_date
    ? daysBetween(order.dispatch_date, now)
    : null;
  const hoursSinceDelivered = order.delivered_at
    ? hoursBetween(order.delivered_at, now)
    : null;
  const daysSinceDelivered = order.delivered_at
    ? daysBetween(order.delivered_at, now)
    : null;

  const productionWindowDays = 14;
  const isPastProductionWindow =
    order.status === "processing" && daysSinceOrder > productionWindowDays;
  const withinProductionWindow =
    order.status === "processing" && daysSinceOrder <= productionWindowDays;

  const canCancel = !["dispatched", "in_transit", "delivered", "cancelled"].includes(
    String(order.status),
  );

  const within24hNotReceived =
    order.status === "delivered" &&
    hoursSinceDelivered !== null &&
    hoursSinceDelivered <= 24;

  const within48hDamage =
    order.status === "delivered" &&
    hoursSinceDelivered !== null &&
    hoursSinceDelivered <= 48;

  const within7DayReturn =
    order.status === "delivered" &&
    daysSinceDelivered !== null &&
    daysSinceDelivered <= 7;

  const trackingStale =
    (order.status === "dispatched" || order.status === "in_transit") &&
    daysSinceDispatch !== null &&
    daysSinceDispatch >= 4;

  return {
    ...order,
    computed: {
      today_ist: now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      days_since_order: daysSinceOrder,
      days_since_dispatch: daysSinceDispatch,
      hours_since_delivered: hoursSinceDelivered,
      days_since_delivered: daysSinceDelivered,
      is_past_production_window: isPastProductionWindow,
      within_production_window: withinProductionWindow,
      can_cancel_pre_dispatch: canCancel,
      within_24h_not_received_window: within24hNotReceived,
      within_48h_damage_window: within48hDamage,
      within_7_day_return_window: within7DayReturn,
      tracking_stale_4_plus_business_days: trackingStale,
      policy_hint: isPastProductionWindow
        ? "Escalate: processing >14 days — tell customer to raise ticket with order number; offer cancel if still pre-dispatch."
        : withinProductionWindow
          ? "Normal processing — explain made-to-order 7–14 day production, then 4–5 day delivery."
          : canCancel
            ? "Pre-dispatch — cancellation possible with full refund to original payment in 5–7 business days if prepaid."
            : order.status === "delivered"
              ? "Delivered — no cancel; returns = store credit only; check 24h/48h/7-day windows via computed flags."
              : "Dispatched — cancel not possible; track package; returns after delivery.",
    },
  };
}

export function getOrderById(orderId: string) {
  const id = orderId.trim().toUpperCase();
  const order = ORDERS.find((o) => o.order_id.toUpperCase() === id);
  return order ? enrichOrder(order) : null;
}

export function getOrdersByPhone(phone: string) {
  const p = normalizePhone(phone);
  return ORDERS.filter((o) => {
    const op = normalizePhone(o.phone);
    return op === p || op.endsWith(p.slice(-10)) || p.endsWith(op.slice(-10));
  }).map((o) => enrichOrder(o));
}

export function listDemoOrdersSummary() {
  return ORDERS.map((o) => ({
    order_id: o.order_id,
    status: o.status,
    item: o.item,
    customer_name: o.customer_name,
    phone_last4: o.phone.slice(-4),
    notes: o.notes,
  }));
}

/** Pull LB##### or bare 5-digit order-ish tokens from free text. */
export function extractOrderIdFromText(text: string): string | null {
  const m =
    text.match(/\b(LB\s*-?\s*\d{4,6})\b/i) ||
    text.match(/\border\s*(?:id|number|#)?\s*[:#]?\s*(LB\s*-?\s*\d{4,6}|\d{5,6})\b/i);
  if (!m) return null;
  let id = m[1].replace(/\s|-/g, "").toUpperCase();
  if (/^\d+$/.test(id)) id = `LB${id}`;
  if (!id.startsWith("LB")) id = `LB${id}`;
  return id;
}

export function allOrders(): MockOrder[] {
  return ORDERS;
}
