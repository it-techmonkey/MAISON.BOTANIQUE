// Click-to-chat links (https://wa.me/<number>?text=…). No WhatsApp script or
// API key is involved; the link opens the app on phones and WhatsApp Web on
// desktops. Until NEXT_PUBLIC_WHATSAPP_NUMBER is set, every helper returns
// null and the site hides its WhatsApp entry points.

import { SITE } from './site';

/** Provisional opening hours in Dubai time. Replace once the owner confirms them. */
export const WHATSAPP_HOURS = { open: 9 * 60, close: 21 * 60 };

/** A UAE number: 971 followed by 8 or 9 digits. */
export function whatsappNumber() {
  const digits = SITE.whatsapp ?? '';
  return /^971\d{8,9}$/.test(digits) ? digits : '';
}

export function whatsappLink(message = '') {
  const number = whatsappNumber();
  if (!number) return null;
  const text = message.trim().slice(0, 1500);
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

function dubaiMinutes(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now).map((part) => [part.type, part.value]));
  return Number(parts.hour) * 60 + Number(parts.minute);
}

export function isWhatsappOpen(now = new Date()) {
  const minutes = dubaiMinutes(now);
  return minutes >= WHATSAPP_HOURS.open && minutes < WHATSAPP_HOURS.close;
}

const MESSAGES = {
  en: {
    general: 'Hello Maison Botanique, I have a question about an order.',
    product: (name: string, size: string) => `Hello Maison Botanique, I'd like to ask about "${name}" (${size}).`,
    events: 'Hello Maison Botanique, I would like to discuss flowers for an event (wedding, corporate or a large order).',
    bag: (lines: string, delivery: string) => `Hello Maison Botanique, I'd like to order:\n${lines}${delivery ? `\n\nDelivery: ${delivery}` : ''}`,
  },
  ar: {
    general: 'مرحباً ميزون بوتانيك، لدي استفسار عن طلب.',
    product: (name: string, size: string) => `مرحباً ميزون بوتانيك، أود الاستفسار عن «${name}» (${size}).`,
    events: 'مرحباً ميزون بوتانيك، أود مناقشة تنسيق زهور لمناسبة (زفاف أو شركة أو طلب كبير).',
    bag: (lines: string, delivery: string) => `مرحباً ميزون بوتانيك، أود طلب:\n${lines}${delivery ? `\n\nالتوصيل: ${delivery}` : ''}`,
  },
};

export const whatsappMessage = {
  general: (arabic: boolean) => MESSAGES[arabic ? 'ar' : 'en'].general,
  events: (arabic: boolean) => MESSAGES[arabic ? 'ar' : 'en'].events,
  product: (arabic: boolean, name: string, size: string) => MESSAGES[arabic ? 'ar' : 'en'].product(name, size),
  bag: (arabic: boolean, lines: string, delivery: string) => MESSAGES[arabic ? 'ar' : 'en'].bag(lines, delivery),
};
