/** Strip free-model meta leaks and junk WhatsApp should never show */

const BAD_PATTERNS = [
  /we need to respond to (the )?customer/i,
  /customer message:\s*/i,
  /as an ai( language model)?/i,
  /i don't have access to (real )?systems/i,
  /support@brand\.com/i,
  /\+91-X{5,}/i,
];

export function looksLikeMetaLeak(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (t.length < 8) return true;
  if (/^we need to/i.test(t)) return true;
  if (/^respond to customer/i.test(t)) return true;
  return BAD_PATTERNS.some((p) => p.test(t));
}

export function cleanReply(text: string): string {
  let t = text.trim();
  // Drop quoted meta wrappers
  t = t.replace(/^["']|["']$/g, "");
  t = t.replace(/^We need to respond to customer message:\s*["']?/i, "");
  t = t.replace(/^Customer message:\s*["']?/i, "");
  // Collapse weird spaces / replacement chars from free models
  t = t.replace(/\uFFFD/g, "");
  t = t.replace(/[ \t]+\n/g, "\n");
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}
