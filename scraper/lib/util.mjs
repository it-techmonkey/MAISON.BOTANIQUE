import fs from "node:fs/promises";
import path from "node:path";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * HTTP client that spaces requests at least `minIntervalMs` apart (across all
 * concurrent callers) and retries network errors, 429s and 5xx with backoff.
 */
export function createHttp({ minIntervalMs = 1000, retries = 6 } = {}) {
  let nextSlot = 0;

  async function waitForSlot() {
    const now = Date.now();
    const start = Math.max(now, nextSlot);
    nextSlot = start + minIntervalMs;
    if (start > now) await sleep(start - now);
  }

  async function request(url, { as = "text" } = {}) {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) await sleep(Math.min(60_000, 2_000 * 2 ** (attempt - 1)));
      await waitForSlot();

      let res;
      try {
        res = await fetch(url, {
          headers: { "user-agent": USER_AGENT, accept: as === "json" ? "application/json" : "*/*" },
          signal: AbortSignal.timeout(60_000),
        });
      } catch (err) {
        lastError = err;
        continue;
      }

      if (res.status === 429 || res.status >= 500) {
        await res.body?.cancel();
        lastError = new Error(`HTTP ${res.status} for ${url}`);
        const retryAfter = Number(res.headers.get("retry-after"));
        if (retryAfter > 0) await sleep(retryAfter * 1000);
        continue;
      }
      if (!res.ok) {
        await res.body?.cancel();
        const err = new Error(`HTTP ${res.status} for ${url}`);
        err.status = res.status;
        throw err;
      }

      if (as === "buffer") {
        return { buffer: Buffer.from(await res.arrayBuffer()), contentType: res.headers.get("content-type") };
      }
      const text = await res.text();
      if (as !== "json") return text;
      try {
        return JSON.parse(text);
      } catch (err) {
        // Shopify answers rate limits with a 200 plain-text body sometimes.
        lastError = new Error(`Invalid JSON from ${url}: ${text.slice(0, 80)}`);
      }
    }
    throw lastError;
  }

  return { request };
}

/** Runs `fn` over `items` with at most `limit` in flight; results keep input order. */
export async function mapPool(items, limit, fn) {
  const results = new Array(items.length);
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", bull: "•", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…" };

export function htmlToText(html) {
  if (!html) return "";
  return html
    .replace(/\r\n?/g, "\n")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|ul|ol|tr)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function csvCell(value) {
  if (value == null) return "";
  const s = Array.isArray(value) ? value.join(" | ") : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV with a BOM so Excel reads UTF-8 (Arabic, em dashes) correctly. */
export function toCsv(rows, columns) {
  const lines = [columns.join(","), ...rows.map((row) => columns.map((c) => csvCell(row[c])).join(","))];
  return "﻿" + lines.join("\r\n") + "\r\n";
}

export async function writeFile(filePath, contents) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents);
}

export async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

export function parseArgs(argv) {
  const args = { fresh: false, skipLogos: false, limit: Infinity };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--fresh") args.fresh = true;
    else if (argv[i] === "--skip-logos") args.skipLogos = true;
    else if (argv[i] === "--limit") args.limit = Number(argv[++i]);
  }
  return args;
}
