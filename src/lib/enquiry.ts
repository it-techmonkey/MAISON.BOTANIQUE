// Shared validation for the enquiry, contact, newsletter and launch-offer forms. The route
// handler re-validates everything; the browser uses it for instant feedback.

export const ENQUIRY_KINDS = ['enquiry', 'contact', 'newsletter', 'offer'] as const;
export type EnquiryKind = typeof ENQUIRY_KINDS[number];

export interface EnquiryInput {
  kind: EnquiryKind;
  name: string;
  email: string;
  phone: string;
  topic: string;
  date: string;
  message: string;
  /** Newsletter marketing consent. */
  consent: boolean;
  locale: 'en' | 'ar';
}

const LIMITS = { name: 120, email: 200, phone: 40, topic: 80, date: 10, message: 3000 };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** A UAE mobile number (50 123 4567, 0501234567, +971501234567) as +9715XXXXXXXX, or ''. */
export function uaeMobile(value: string) {
  const digits = value.replace(/[\s()-]/g, '');
  const match = digits.match(/^(?:\+?971|0)?(5\d{8})$/);
  return match ? `+971${match[1]}` : '';
}

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

/** Returns clean input, or the name of the first invalid field. */
export function parseEnquiry(raw: unknown): { ok: true; value: EnquiryInput } | { ok: false; field: string } {
  const body = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const kind = ENQUIRY_KINDS.includes(body.kind as EnquiryKind) ? body.kind as EnquiryKind : null;
  if (!kind) return { ok: false, field: 'kind' };
  const value: EnquiryInput = {
    kind,
    name: text(body.name, LIMITS.name),
    email: text(body.email, LIMITS.email),
    phone: text(body.phone, LIMITS.phone),
    topic: text(body.topic, LIMITS.topic),
    date: /^\d{4}-\d{2}-\d{2}$/.test(text(body.date, LIMITS.date)) ? text(body.date, LIMITS.date) : '',
    message: text(body.message, LIMITS.message),
    consent: body.consent === true,
    locale: body.locale === 'ar' ? 'ar' : 'en',
  };
  // A contact is required for the offer; marketing consent is optional.
  if (kind === 'offer') {
    if (value.phone) {
      value.phone = uaeMobile(value.phone);
      if (!value.phone) return { ok: false, field: 'phone' };
      value.email = '';
    } else if (!EMAIL.test(value.email)) return { ok: false, field: 'email' };
    return { ok: true, value };
  }
  // Checked in the order the fields appear on the page.
  if (kind !== 'newsletter' && !value.name) return { ok: false, field: 'name' };
  if (!EMAIL.test(value.email)) return { ok: false, field: 'email' };
  if (kind === 'newsletter') return value.consent ? { ok: true, value } : { ok: false, field: 'consent' };
  if (value.message.length < 5) return { ok: false, field: 'message' };
  return { ok: true, value };
}

/** A prefilled email used when no enquiry inbox is connected. */
export function enquiryMailto(to: string, input: EnquiryInput) {
  const subject = input.kind === 'newsletter' || input.kind === 'offer'
    ? 'Newsletter: please add me to the list'
    : `${input.kind === 'enquiry' ? 'Enquiry' : 'Message'}${input.topic ? `: ${input.topic}` : ''}`;
  const lines = input.kind === 'newsletter' || input.kind === 'offer'
    ? [`Please add ${input.email || input.phone} to the Maison Botanique list.`]
    : [
      input.message,
      '',
      `Name: ${input.name}`,
      ...(input.phone ? [`Phone: ${input.phone}`] : []),
      ...(input.date ? [`Date: ${input.date}`] : []),
    ];
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
}
