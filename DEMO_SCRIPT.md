# 60–90s Loom script (deal-closing)

## Framing (5s, voiceover)

> “I messaged Littlebox’s live WhatsApp support. It’s a button tree — fine for volume routing, brittle on real customer language. I built a working agent on mock orders with your public policies. Same messages, better first response.”

**Do not** name their CRM vendor. **Do** show structure: free text → useful answer.

---

## Side A — Their bot (record first, 20–25s)

1. Open `wa.me/+919395787877` (or the Contact Us number).
2. Send **hi** → show 3-button menu.
3. Type free text (not a button):  
   `I ordered a dress three weeks ago, and it still hasn't been shipped. This is unacceptable.`
4. Capture the fallback / loop / “kindly state your concern…” style dead end.

---

## Side B — This agent (35–50s)

Message the **Kapso sandbox** demo number (after webhook is live).

| # | You send | What good looks like |
|---|----------|----------------------|
| 1 | `hi` | Natural greet, asks how to help / order # — **no** forced 3-button wall |
| 2 | `I ordered a dress three weeks ago… Order LB10234` | Names **Emerald Bodycon**, days overdue, empathy, ticket **or** cancel path |
| 3 | `cancel my order LB10236` | Sees **dispatched**, cancel blocked, return-after-delivery path |
| 4 | `can I get a refund to my bank for a return` | Store credit only, ₹99, 1 year — human tone |
| 5 | *(optional)* `is COD safer than paying online` | Prepaid equally secure; Shopify PCI; COD = preference |

If time is tight, run **1 → 2 → 4** only. That’s the money shot.

---

## Closing line (5–10s)

> “This is a sandbox with mock Shopify-shaped orders — zero access to your backend. If useful, we wire the same agent to real order APIs and your number in a week. Happy to show the Worker + policy pack.”

---

## Rehearsal without WhatsApp

```bash
npm run dev
curl -s -X POST http://127.0.0.1:8787/demo/simulate \
  -H "content-type: application/json" \
  -d "{\"message\":\"I ordered a dress three weeks ago and it still hasn't shipped. LB10234\",\"phone\":\"919876543210\"}"
```

---

## Pitch message (WhatsApp / email)

> Hi — I’m Dhru (Prompt Mafia). I tested Littlebox’s WhatsApp support flow; button trees drop hard on natural language. I built a small working prototype that understands free text, pulls mock order context, and answers with your public shipping/return policies. 60s Loom: [link]. Happy to tear it down or extend it if useful — no hard sell.
