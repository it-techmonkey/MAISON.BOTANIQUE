// Shared validation for the enquiry, contact and newsletter forms. The route
// handler re-validates everything; the browser uses it for instant feedback.

export const ENQUIRY_KINDS = ['enquiry', 'contact', 'newsletter'] as const;
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
  // Checked in the order the fields appear on the page.
  if (kind !== 'newsletter' && !value.name) return { ok: false, field: 'name' };
  if (!EMAIL.test(value.email)) return { ok: false, field: 'email' };
  if (kind === 'newsletter') return value.consent ? { ok: true, value } : { ok: false, field: 'consent' };
  if (value.message.length < 5) return { ok: false, field: 'message' };
  return { ok: true, value };
}

/** A prefilled email used when no enquiry inbox is connected. */
export function enquiryMailto(to: string, input: EnquiryInput) {
  const subject = input.kind === 'newsletter'
    ? 'Newsletter: please add me to the list'
    : `${input.kind === 'enquiry' ? 'Enquiry' : 'Message'}${input.topic ? `: ${input.topic}` : ''}`;
  const lines = input.kind === 'newsletter'
    ? [`Please add ${input.email} to the Maison Botanique list.`]
    : [
      input.message,
      '',
      `Name: ${input.name}`,
      ...(input.phone ? [`Phone: ${input.phone}`] : []),
      ...(input.date ? [`Date: ${input.date}`] : []),
    ];
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
}
