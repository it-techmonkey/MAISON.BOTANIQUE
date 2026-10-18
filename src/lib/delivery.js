// Delivery days and time windows, always in Dubai time. One date and one
// window apply to the whole order: Shopify checkout takes a single address.
// PROVISIONAL RULES: replace with the owner's confirmed windows, cutoff,
// booking horizon and closed dates. Later these move to a Shopify metaobject
// so the owner can close a day without a code change.
export const DELIVERY_RULES = {
  windows: [
    { id: 'morning', start: 9 * 60, end: 12 * 60 },
    { id: 'midday', start: 12 * 60, end: 15 * 60 },
    { id: 'afternoon', start: 15 * 60, end: 18 * 60 },
    { id: 'evening', start: 18 * 60, end: 21 * 60 },
  ],
  leadMinutes: 180, // a same-day window closes this long before it starts
  maxDaysAhead: 60, // pre-booking horizon
  blackoutDates: [], // 'YYYY-MM-DD'
  closedWeekdays: [], // 0 = Sunday … 6 = Saturday
};

export function dubaiNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { date: `${value.year}-${value.month}-${value.day}`, minutes: Number(value.hour) * 60 + Number(value.minute) };
}

export function todayDubai(now = new Date()) { return dubaiNow(now).date; }

export function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function lastBookableDate(now = new Date(), rules = DELIVERY_RULES) {
  return addDays(todayDubai(now), rules.maxDaysAhead);
}

// Is the business delivering at all on this date (ignoring the time of day)?
export function dateOpen(date, now = new Date(), rules = DELIVERY_RULES) {
  if (!validDate(date)) return false;
  const today = todayDubai(now);
  if (date < today || date > lastBookableDate(now, rules)) return false;
  if (rules.blackoutDates.includes(date)) return false;
  return !rules.closedWeekdays.includes(new Date(`${date}T00:00:00Z`).getUTCDay());
}

export function windowsFor(date, now = new Date(), rules = DELIVERY_RULES) {
  const open = dateOpen(date, now, rules);
  const { date: today, minutes } = dubaiNow(now);
  return rules.windows.map((slot) => ({
    ...slot,
    available: open && (date !== today || slot.start - rules.leadMinutes >= minutes),
  }));
}

export function isBookable(delivery, now = new Date(), rules = DELIVERY_RULES) {
  if (!delivery?.date || !delivery?.windowId) return false;
  return windowsFor(delivery.date, now, rules).some((slot) => slot.id === delivery.windowId && slot.available);
}

// The next few dates that still have at least one open window.
export function bookableDays(count = 3, now = new Date(), rules = DELIVERY_RULES) {
  const days = [];
  const today = todayDubai(now);
  for (let offset = 0; offset <= rules.maxDaysAhead && days.length < count; offset += 1) {
    const date = addDays(today, offset);
    if (windowsFor(date, now, rules).some((slot) => slot.available)) days.push(date);
  }
  return days;
}

function hourLabel(minutes, ar) {
  return new Intl.DateTimeFormat(ar ? 'ar-AE' : 'en-US', { hour: 'numeric', minute: minutes % 60 ? '2-digit' : undefined, timeZone: 'UTC' })
    .format(new Date(Date.UTC(2000, 0, 1, Math.floor(minutes / 60), minutes % 60)))
    .replace(/\s/g, ar ? ' ' : '').toLowerCase();
}

export function windowLabel(windowId, ar, rules = DELIVERY_RULES) {
  const slot = rules.windows.find((item) => item.id === windowId);
  return slot ? `${hourLabel(slot.start, ar)} – ${hourLabel(slot.end, ar)}` : '';
}

export function dateLabel(date, ar) {
  return new Intl.DateTimeFormat(ar ? 'ar-AE' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
    .format(new Date(`${date}T00:00:00Z`));
}

export function deliverySummary(delivery, ar) {
  if (!delivery?.date || !delivery?.windowId) return '';
  return `${dateLabel(delivery.date, ar)} · ${windowLabel(delivery.windowId, ar)}`;
}

// Saved state from the browser: keep only a well-formed date and a known window.
export function safeDelivery(raw, rules = DELIVERY_RULES) {
  if (!raw || typeof raw !== 'object' || !validDate(raw.date)) return null;
  const windowId = rules.windows.some((slot) => slot.id === raw.windowId) ? raw.windowId : '';
  return { date: raw.date, windowId };
}
