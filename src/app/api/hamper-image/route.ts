import { createHash, randomBytes } from 'node:crypto';
import { isIP } from 'node:net';
import { hamperCodeString } from '@/lib/hamper';
import { parseRenderRequest, renderHamper } from '@/lib/hamper-render';

// Makes a photo of the customer's own hamper (see src/lib/hamper-render.ts). Every render costs money, so: same-origin only,
// a valid catalogue selection only, a per-visitor limit, a daily cap and a cache. Without OPENAI_API_KEY it answers 503 and the
// page keeps showing its tidy preview. The limits are instance-level backstops; set a spend limit on the OpenAI account too.
export const maxDuration = 60;

const PER_VISITOR = 8;
const WINDOW_MS = 60 * 60 * 1000;
const DAILY_CAP = Number(process.env.HAMPER_RENDER_DAILY_CAP) || 150;
const salt = randomBytes(32);
const visitors = new Map<string, { count: number; reset: number }>();
const cache = new Map<string, string>();
let day = { date: '', count: 0 };

function limited(request: Request, now = Date.now()) {
  const forwarded = (request.headers.get(process.env.VERCEL ? 'x-vercel-forwarded-for' : 'x-forwarded-for') || '').split(',')[0].trim();
  const key = createHash('sha256').update(salt).update(isIP(forwarded) ? forwarded : 'unknown').digest('hex');
  for (const [id, value] of visitors) if (value.reset <= now) visitors.delete(id);
  const entry = visitors.get(key) ?? { count: 0, reset: now + WINDOW_MS };
  if (!visitors.has(key) && visitors.size >= 10_000) return true;
  visitors.set(key, entry);
  return ++entry.count > PER_VISITOR;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json({ error: 'not_configured' }, { status: 503 });
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: 'forbidden' }, { status: 403 });
  const text = await request.text();
  if (text.length > 2_000) return Response.json({ error: 'too_large' }, { status: 413 });
  let selection;
  try { selection = parseRenderRequest(JSON.parse(text)); } catch { selection = null; }
  if (!selection) return Response.json({ error: 'invalid' }, { status: 422 });

  const key = hamperCodeString(selection);
  const cached = cache.get(key);
  if (cached) return Response.json({ image: cached }, { headers: { 'Cache-Control': 'no-store' } });
  if (limited(request)) return Response.json({ error: 'rate_limited' }, { status: 429 });
  const today = new Date().toISOString().slice(0, 10);
  if (day.date !== today) day = { date: today, count: 0 };
  if (day.count >= DAILY_CAP) return Response.json({ error: 'busy' }, { status: 429 });
  day.count++;

  try {
    const image = await renderHamper(selection, new URL(request.url).origin, apiKey);
    if (cache.size >= 60) cache.delete(cache.keys().next().value!);
    cache.set(key, image);
    return Response.json({ image }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    console.error('[hamper-image] render failed');
    return Response.json({ error: 'render_failed' }, { status: 502 });
  }
}
