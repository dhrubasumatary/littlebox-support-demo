/**
 * Supermemory REST helpers for Cloudflare Workers (no Node SDK).
 * Docs: https://supermemory.ai/docs/integrations/supermemory-sdk
 */

const BASE = "https://api.supermemory.ai";

export function customerTag(phone: string): string {
  const p = phone.replace(/\D/g, "").slice(-12);
  return `lb_wa_${p || "unknown"}`;
}

export const POLICY_TAG = "littlebox_policy";

async function smFetch(
  apiKey: string,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

/** Store a chat turn / fact for this customer */
export async function addMemory(
  apiKey: string,
  opts: {
    containerTag: string;
    content: string;
    metadata?: Record<string, string | number | boolean>;
    customId?: string;
  },
): Promise<void> {
  try {
    const res = await smFetch(apiKey, "/v3/documents", {
      method: "POST",
      body: JSON.stringify({
        content: opts.content,
        containerTag: opts.containerTag,
        customId: opts.customId,
        metadata: opts.metadata,
        taskType: "memory",
        dreaming: "instant",
      }),
    });
    if (!res.ok) {
      console.error("sm_add_failed", res.status, await res.text());
    }
  } catch (e) {
    console.error("sm_add_error", e);
  }
}

/** Low-latency conversational recall for this customer */
export async function searchMemories(
  apiKey: string,
  containerTag: string,
  q: string,
  limit = 6,
): Promise<string[]> {
  try {
    const res = await smFetch(apiKey, "/v4/search", {
      method: "POST",
      body: JSON.stringify({
        q,
        containerTag,
        threshold: 0.35,
        limit,
      }),
    });
    if (!res.ok) {
      console.error("sm_search_failed", res.status, await res.text());
      return [];
    }
    const data = (await res.json()) as {
      results?: Array<{ memory?: string; content?: string; chunk?: string }>;
    };
    return (data.results || [])
      .map((r) => r.memory || r.content || r.chunk || "")
      .filter(Boolean)
      .slice(0, limit);
  } catch (e) {
    console.error("sm_search_error", e);
    return [];
  }
}

/** Profile + search (when available) */
export async function getCustomerContext(
  apiKey: string,
  phone: string,
  q: string,
): Promise<string> {
  const tag = customerTag(phone);
  const chunks: string[] = [];

  try {
    const res = await smFetch(apiKey, "/v3/profile", {
      method: "POST",
      body: JSON.stringify({
        containerTag: tag,
        q,
        threshold: 0.4,
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        profile?: { static?: string[]; dynamic?: string[] };
        searchResults?: { results?: Array<{ memory?: string }> };
        search_results?: { results?: Array<{ memory?: string }> };
      };
      const staticP = data.profile?.static || [];
      const dynamicP = data.profile?.dynamic || [];
      if (staticP.length) chunks.push(`Known facts:\n- ${staticP.join("\n- ")}`);
      if (dynamicP.length) chunks.push(`Recent context:\n- ${dynamicP.join("\n- ")}`);
      const hits =
        data.searchResults?.results || data.search_results?.results || [];
      if (hits.length) {
        chunks.push(
          `Relevant memories:\n- ${hits
            .map((h) => h.memory)
            .filter(Boolean)
            .join("\n- ")}`,
        );
      }
    }
  } catch (e) {
    console.error("sm_profile_error", e);
  }

  if (!chunks.length) {
    const mem = await searchMemories(apiKey, tag, q, 5);
    if (mem.length) chunks.push(`Relevant memories:\n- ${mem.join("\n- ")}`);
  }

  return chunks.join("\n\n");
}

/** Policy RAG from shared littlebox_policy space */
export async function searchPolicy(
  apiKey: string,
  q: string,
  limit = 4,
): Promise<string[]> {
  return searchMemories(apiKey, POLICY_TAG, q, limit);
}

/** Ingest public Littlebox policy URLs once */
export async function ingestPolicyUrls(apiKey: string): Promise<string[]> {
  const urls = [
    "https://littleboxindia.com/pages/faq",
    "https://littleboxindia.com/pages/return-exchanges-policy",
    "https://littleboxindia.com/policies/shipping-policy",
    "https://littleboxindia.com/blogs/you-ask-we-answer/why-is-my-littlebox-india-order-taking-so-long",
    "https://littleboxindia.com/blogs/you-ask-we-answer/how-can-i-contact-littlebox-india-for-a-refund",
    "https://littleboxindia.com/blogs/you-ask-we-answer/is-littlebox-india-safe",
    "https://littleboxindia.com/blogs/you-ask-we-answer/how-does-littlebox-india-customer-support-actually-work",
  ];
  const statuses: string[] = [];
  for (const url of urls) {
    try {
      const res = await smFetch(apiKey, "/v3/documents", {
        method: "POST",
        body: JSON.stringify({
          content: url,
          containerTag: POLICY_TAG,
          customId: `policy_${url.replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 80)}`,
          metadata: { source: "littlebox_public", type: "policy_url" },
          taskType: "superrag",
        }),
      });
      statuses.push(`${res.status} ${url}`);
    } catch (e) {
      statuses.push(`err ${url}`);
    }
  }
  return statuses;
}
