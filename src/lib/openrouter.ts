export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface ChatCompletionResponse {
  id?: string;
  choices?: Array<{
    index: number;
    message: {
      role: string;
      content: string | null;
      tool_calls?: ToolCall[];
    };
    finish_reason?: string;
  }>;
  error?: { message?: string; code?: number };
}

const TOOLS = [
  {
    type: "function",
    function: {
      name: "lookup_order",
      description:
        "Look up a mock Littlebox order by order_id (e.g. LB10234) and/or customer phone. Returns order details and policy window flags.",
      parameters: {
        type: "object",
        properties: {
          order_id: {
            type: "string",
            description: "Order ID like LB10234",
          },
          phone: {
            type: "string",
            description: "Customer phone with country code if available",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_orders_for_phone",
      description: "List all mock orders linked to a phone number.",
      parameters: {
        type: "object",
        properties: {
          phone: { type: "string" },
        },
        required: ["phone"],
      },
    },
  },
] as const;

export async function chatWithTools(opts: {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
}): Promise<ChatCompletionResponse> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/dhrubasumatary/littlebox-support-demo",
      "X-OpenRouter-Title": "Littlebox Support AI Demo",
    },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      tools: TOOLS,
      tool_choice: "auto",
      temperature: opts.temperature ?? 0.4,
      max_tokens: 800,
    }),
  });

  const data = (await res.json()) as ChatCompletionResponse;
  if (!res.ok) {
    const msg = data.error?.message || `OpenRouter HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

/** Fallback when free model ignores tools — plain completion with injected context. */
export async function chatSimple(opts: {
  apiKey: string;
  model: string;
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  extraContext?: string;
}): Promise<string> {
  const system = opts.extraContext
    ? `${opts.system}\n\n## Live order context (from system lookup — treat as facts)\n${opts.extraContext}`
    : opts.system;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/dhrubasumatary/littlebox-support-demo",
      "X-OpenRouter-Title": "Littlebox Support AI Demo",
    },
    body: JSON.stringify({
      model: opts.model,
      messages: [{ role: "system", content: system }, ...opts.messages],
      temperature: 0.4,
      max_tokens: 700,
    }),
  });

  const data = (await res.json()) as ChatCompletionResponse;
  if (!res.ok) {
    throw new Error(data.error?.message || `OpenRouter HTTP ${res.status}`);
  }
  return data.choices?.[0]?.message?.content?.trim() || "";
}
