// Click-to-chat links (https://wa.me/<number>?text=…). No WhatsApp script or
// API key is involved; the link opens the app on phones and WhatsApp Web on
// desktops. Until VITE_WHATSAPP_NUMBER is set, every helper returns null and
// the site hides its WhatsApp entry points.

// Provisional opening hours in Dubai time. Replace once the owner confirms them.
export const WHATSAPP_HOURS = { open: 9 * 60, close: 21 * 60 };

export function whatsappNumber() {
  const digits = (import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '');
  return /^971\d{8,9}$/.test(digits) ? digits : '';
}

export function whatsappLink(message = '') {
  const number = whatsappNumber();
  if (!number) return null;
  const text = message.trim().slice(0, 1500);
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

function dubaiMinutes(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return Number(value.hour) * 60 + Number(value.minute);
}

export function isWhatsappOpen(now = new Date()) {
  const minutes = dubaiMinutes(now);
  return minutes >= WHATSAPP_HOURS.open && minutes < WHATSAPP_HOURS.close;
}

const MESSAGES = {
  en: {
    general: 'Hello Maison Botanique, I have a question about an order.',
    product: (name, size) => `Hello Maison Botanique, I'd like to ask about "${name}" (${size}).`,
    events: 'Hello Maison Botanique, I would like to discuss flowers for an event (wedding, corporate or a large order).',
    bag: (lines, delivery) => `Hello Maison Botanique, I'd like to order:\n${lines}${delivery ? `\n\nDelivery: ${delivery}` : ''}`,
  },
  ar: {
    general: 'مرحباً ميزون بوتانيك، لدي استفسار عن طلب.',
    product: (name, size) => `مرحباً ميزون بوتانيك، أود الاستفسار عن «${name}» (${size}).`,
    events: 'مرحباً ميزون بوتانيك، أود مناقشة تنسيق زهور لمناسبة (زفاف أو شركة أو طلب كبير).',
    bag: (lines, delivery) => `مرحباً ميزون بوتانيك، أود طلب:\n${lines}${delivery ? `\n\nالتوصيل: ${delivery}` : ''}`,
  },
};

export function whatsappMessage(kind, ar, ...args) {
  const entry = MESSAGES[ar ? 'ar' : 'en'][kind];
  return typeof entry === 'function' ? entry(...args) : entry;
}
