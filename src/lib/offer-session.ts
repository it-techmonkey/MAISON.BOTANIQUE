import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

export const OFFER_COOKIE = 'mb-welcome-offer';
export interface OfferSession { customerId?: string; code: string; email: string; phone: string; expires: number }
const key = () => {
  const secret = process.env.OFFER_SESSION_SECRET?.trim();
  return secret && secret.length >= 32 ? createHash('sha256').update(secret).digest() : null;
};

export function sealOffer(value: Omit<OfferSession, 'expires'>, now = Date.now()) {
  const secret = key();
  if (!secret) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', secret, iv);
  const text = JSON.stringify({ ...value, expires: now + 30 * 86400_000 });
  return Buffer.concat([iv, cipher.update(text), cipher.final(), cipher.getAuthTag()]).toString('base64url');
}

export function openOfferSession(value: string, now = Date.now()): OfferSession | null {
  const secret = key();
  if (!secret || value.length > 2000) return null;
  try {
    const bytes = Buffer.from(value, 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', secret, bytes.subarray(0, 12));
    decipher.setAuthTag(bytes.subarray(-16));
    const body = JSON.parse(Buffer.concat([decipher.update(bytes.subarray(12, -16)), decipher.final()]).toString());
    return typeof body.code === 'string' && typeof body.email === 'string' && typeof body.phone === 'string' && body.expires > now ? body : null;
  } catch { return null; }
}
