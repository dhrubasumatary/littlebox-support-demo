export type PaymentMode = "prepaid" | "cod";

export type OrderStatus =
  | "processing"
  | "dispatched"
  | "in_transit"
  | "delivered"
  | "cancelled";

export interface MockOrder {
  order_id: string;
  customer_name: string;
  phone: string;
  item: string;
  order_date: string;
  status: OrderStatus | string;
  dispatch_date: string | null;
  expected_dispatch_by: string | null;
  expected_delivery: string | null;
  delivered_at?: string | null;
  tracking_id: string | null;
  tracking_url: string | null;
  payment_mode: PaymentMode | string;
  amount: number;
  shipping_city: string;
  notes?: string;
}

export interface Env {
  OPENROUTER_API_KEY: string;
  OPENROUTER_MODEL?: string;
  KAPSO_API_KEY: string;
  KAPSO_PHONE_NUMBER_ID: string;
  KAPSO_WEBHOOK_SECRET?: string;
  DEMO_NAME?: string;
  SESSIONS?: KVNamespace;
}

export interface SessionState {
  phone: string;
  lastOrderId?: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  updatedAt: string;
}

export interface InboundMessage {
  from: string;
  text: string;
  messageId?: string;
  conversationId?: string;
  rawType?: string;
}
