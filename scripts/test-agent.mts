/**
 * Local smoke test against OpenRouter (uses .dev.vars).
 * Run: npm run test:agent
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadDevVars() {
  const path = resolve(process.cwd(), ".dev.vars");
  if (!existsSync(path)) throw new Error("Missing .dev.vars");
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const env = loadDevVars();
const base = process.env.DEMO_URL || "http://127.0.0.1:8787";

const scripts = [
  "hi",
  "I ordered a dress three weeks ago, and it still hasn't been shipped. This is unacceptable. Order LB10234",
  "cancel my order LB10236",
  "my order LB10237 says delivered but I never got it",
  "can I get a refund to my bank account for my return",
  "is cod safer than paying online",
];

async function main() {
  // Prefer hitting local worker if up; else call OpenRouter path via dynamic import won't work without wrangler.
  // This script posts to /demo/simulate
  console.log(`Testing against ${base}/demo/simulate\n`);

  for (const message of scripts) {
    const res = await fetch(`${base}/demo/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, phone: "919876543210" }),
    });
    const data = await res.json();
    console.log("—".repeat(48));
    console.log("USER:", message);
    console.log("BOT:", data.reply || data.error || JSON.stringify(data));
    console.log();
  }

  // silence unused
  void env;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
