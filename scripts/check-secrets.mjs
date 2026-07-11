import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const bad = [];

function scan(file, content) {
  const patterns = [
    /sk-or-v1-[a-zA-Z0-9]{20,}/g,
    /sk-ant-[a-zA-Z0-9\-_]{20,}/g,
    /sk-[a-zA-Z0-9]{20,}/g,
  ];
  for (const p of patterns) {
    if (p.test(content) && !file.includes(".example") && !file.includes(".dev.vars")) {
      // allow .dev.vars only locally; never in tracked files
      if (!file.endsWith(".dev.vars") && !file.includes("node_modules")) {
        bad.push(file);
      }
    }
  }
}

function walk(dir) {
  // lightweight: only check common tracked files
  const files = [
    "README.md",
    "DEMO_SCRIPT.md",
    "wrangler.toml",
    "package.json",
    "src/index.ts",
    "src/lib/agent.ts",
    "src/lib/openrouter.ts",
    "src/lib/kapso.ts",
    "src/lib/prompt.ts",
    "src/lib/orders.ts",
    "src/data/orders.json",
  ];
  for (const f of files) {
    const path = join(root, f);
    if (existsSync(path)) {
      scan(f, readFileSync(path, "utf8"));
    }
  }
}

walk(root);

if (bad.length) {
  console.error("Possible secrets in tracked files:", bad);
  process.exit(1);
}
console.log("Secret scan clean for tracked sources.");
