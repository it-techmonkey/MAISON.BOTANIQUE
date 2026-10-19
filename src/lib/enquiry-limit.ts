import { createHash, randomBytes } from 'node:crypto';
import { isIP } from 'node:net';

const WINDOW_MS = 10 * 60 * 1000;
const salt = randomBytes(32);
const attempts = new Map<string, { count: number; reset: number }>();

/** Instance-level backstop; the Vercel firewall must enforce the same limit across instances. */
export function checkEnquiryLimit(request: Request, now = Date.now()) {
  const forwarded = (request.headers.get(process.env.VERCEL ? 'x-vercel-forwarded-for' : 'x-forwarded-for') || '').split(',')[0].trim();
  const ip = isIP(forwarded) ? forwarded : 'unknown';
  const key = createHash('sha256').update(salt).update(ip).digest('hex');
  for (const [id, value] of attempts) if (value.reset <= now) attempts.delete(id);
  let entry = attempts.get(key);
  if (!entry) {
    if (attempts.size >= 10_000) return 600;
    entry = { count: 0, reset: now + WINDOW_MS };
    attempts.set(key, entry);
  }
  if (entry.count >= 5) return Math.max(1, Math.ceil((entry.reset - now) / 1000));
  entry.count++;
  return 0;
}

export async function readEnquiryBody(request: Request, limit = 16_000) {
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > limit) { await reader.cancel(); throw new RangeError('too_large'); }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}
