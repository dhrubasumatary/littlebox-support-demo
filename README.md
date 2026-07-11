# Littlebox Support AI — WhatsApp Pitch Demo

> **Founder pitch prototype only.** Not affiliated with Littlebox India / Good Tribe Pvt Ltd.  
> Uses **mock orders** + policies sourced from Littlebox’s **public** FAQ, shipping, return, and “You Ask We Answer” blogs.  
> No real customer data. No connection to Littlebox’s Shopify or WhatsApp Business numbers.

Built for a cold founder-to-founder pitch: show how a **conversational** WhatsApp agent handles the same messages that rigid button-flow bots bounce on.

## Stack

| Layer | Choice |
|--------|--------|
| Channel | [Kapso](https://docs.kapso.ai) WhatsApp API (**sandbox number only**) |
| Runtime | Cloudflare Worker |
| LLM | [OpenRouter](https://openrouter.ai) free model (`nvidia/nemotron-3-super-120b-a12b:free`, tool calling + fallback) |
| Data | Static mock orders in `src/data/orders.json` |

## Why this wins the demo

Littlebox’s own support blog describes WhatsApp as an **automated routing layer** that collects order number + category before a human replies in 24–48h. This agent:

1. Accepts **natural language** (no forced COD/Prepaid button tree)
2. **Looks up mock order context** and answers with item, dates, city
3. Stays **policy-accurate** (store credit on returns, 7–14 day made-to-order, 24h/48h windows)
4. Sounds like a human on WhatsApp — short, direct, not corporate

## Mock orders (for testing)

| Order | Scenario |
|-------|----------|
| `LB10234` | Processing **overdue** (>14 days) — “3 weeks late” script |
| `LB10235` | Processing **within** window |
| `LB10236` | **Dispatched** — cancel blocked |
| `LB10237` | **Delivered** recently — not-received window |
| `LB10238` | Delivered long ago — past 24h/48h |
| `LB10239` | Damage / wrong item path |

## Security (read this)

- **Never commit** `.dev.vars`, `.env`, or real API keys.
- Secrets live in Cloudflare (`wrangler secret put`) and local `.dev.vars` only.
- This demo must use the Kapso **sandbox** phone number — **not** a production Miithii number.
- If an OpenRouter key was ever pasted into chat, **rotate it** after the pitch.

## Setup

```bash
cd littlebox-support-demo
npm install
cp .dev.vars.example .dev.vars
# fill OPENROUTER_API_KEY, KAPSO_API_KEY, KAPSO_PHONE_NUMBER_ID, KAPSO_WEBHOOK_SECRET
```

### Local

```bash
npm run dev
# health
curl http://127.0.0.1:8787/health
# simulate a customer (no WhatsApp needed)
curl -X POST http://127.0.0.1:8787/demo/simulate \
  -H "content-type: application/json" \
  -d "{\"message\":\"hi\",\"phone\":\"919876543210\"}"
```

### Deploy (Cloudflare)

```bash
npx wrangler login   # once
npx wrangler secret put OPENROUTER_API_KEY
npx wrangler secret put KAPSO_API_KEY
npx wrangler secret put KAPSO_PHONE_NUMBER_ID
npx wrangler secret put KAPSO_WEBHOOK_SECRET
npm run deploy
```

### Live demo (Prompt Mafia account)

| | |
|--|--|
| Health | https://littlebox-support-demo.promptmafiainc.workers.dev/health |
| Simulate (no WhatsApp) | `POST /demo/simulate` with `{ "message": "...", "phone": "91..." }` |
| Kapso webhook | `POST /webhooks/kapso` (wired to **sandbox** number) |

```bash
curl -s -X POST https://littlebox-support-demo.promptmafiainc.workers.dev/demo/simulate \
  -H "content-type: application/json" \
  -d '{"message":"I ordered a dress three weeks ago. LB10234","phone":"919876543210"}'
```

In Kapso: webhook on the **sandbox** number → event `whatsapp.message.received` → same secret as `KAPSO_WEBHOOK_SECRET`.

Optional KV session memory:

```bash
npx wrangler kv namespace create SESSIONS
# paste id into wrangler.toml [[kv_namespaces]]
```

## Pitch script

See [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md) for the side-by-side Loom outline and exact customer lines.

## Policy sources (public)

- [How support actually works](https://littleboxindia.com/blogs/you-ask-we-answer/how-does-littlebox-india-customer-support-actually-work)
- [Why order takes so long](https://littleboxindia.com/blogs/you-ask-we-answer/why-is-my-littlebox-india-order-taking-so-long)
- [Is Littlebox safe / COD vs prepaid](https://littleboxindia.com/blogs/you-ask-we-answer/is-littlebox-india-safe)
- [Refunds / store credit](https://littleboxindia.com/blogs/you-ask-we-answer/how-can-i-contact-littlebox-india-for-a-refund)
- [Return & exchange policy](https://littleboxindia.com/pages/return-exchanges-policy)

## License

Private pitch prototype for Prompt Mafia / Dhru. Do not present as an official Littlebox product.
