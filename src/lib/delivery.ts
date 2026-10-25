// Delivery days and time windows, always in Dubai time. One date and one
// window apply to the whole order: Shopify checkout takes a single address.
// The schedule is saved on the Shopify cart as attributes and as the cart
// note, so on the order it appears under "Additional details", at the top as
// the order Note, and in the order webhook.
//
// Owner approved 19 October 2026: daily windows and a 60-day horizon. The lead
// was three hours; the owner shortened it to one hour on 23 October 2026.

export const DELIVERY_DATE_KEY = 'Delivery date';
export const DELIVERY_TIME_KEY = 'Delivery time';

export interface DeliveryWindow {
  id: string;
  /** Start and end in minutes after midnight, Dubai time. */
  start: number;
  end: number;
}

export const DELIVERY_RULES = {
  windows: [
    { id: 'morning', start: 9 * 60, end: 12 * 60 },
    { id: 'midday', start: 12 * 60, end: 15 * 60 },
    { id: 'afternoon', start: 15 * 60, end: 18 * 60 },
    { id: 'evening', start: 18 * 60, end: 21 * 60 },
  ] as DeliveryWindow[],
  /** A same-day window closes this long before it starts. */
  leadMinutes: 60,
  /** Pre-booking horizon. */
  maxDaysAhead: 60,
  /** 'YYYY-MM-DD' dates with no deliveries. */
  blackoutDates: [] as string[],
  /** 0 = Sunday … 6 = Saturday. */
  closedWeekdays: [] as number[],
};

export const SAME_DAY_LEAD_MINUTES = DELIVERY_RULES.leadMinutes;
export const MAX_DAYS_AHEAD = DELIVERY_RULES.maxDaysAhead;

export interface DeliverySchedule {
  /** YYYY-MM-DD */
  date: string;
  /** A window id from DELIVERY_RULES.windows. */
  slotId: string;
}

export const findSlot = (id: string | null | undefined) => DELIVERY_RULES.windows.find((slot) => slot.id === id) ?? null;

/** The current date (YYYY-MM-DD) and minutes after midnight in Dubai. */
export function dubaiNow(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now).map((part) => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

export type DubaiNow = ReturnType<typeof dubaiNow>;

export function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/**
 * Dates (YYYY-MM-DD, inclusive) an order is limited to, e.g. a Diwali pre-order
 * that is only delivered 5–8 November. null means the normal schedule.
 */
export interface DeliveryRange { from: string; to: string }

export const lastBookableDate = (now: DubaiNow = dubaiNow(), range: DeliveryRange | null = null) => {
  const horizon = addDays(now.date, DELIVERY_RULES.maxDaysAhead);
  return range && range.to < horizon ? range.to : horizon;
};

/** Is the business delivering at all on this date (ignoring the time of day)? */
export function dateOpen(date: string, now: DubaiNow = dubaiNow(), range: DeliveryRange | null = null) {
  if (!isValidDate(date) || date < now.date || date > lastBookableDate(now, range)) return false;
  if (range && date < range.from) return false;
  if (DELIVERY_RULES.blackoutDates.includes(date)) return false;
  return !DELIVERY_RULES.closedWeekdays.includes(new Date(`${date}T00:00:00Z`).getUTCDay());
}

/** Every window on a date, with whether it can still be booked. */
export function windowsFor(date: string, now: DubaiNow = dubaiNow(), range: DeliveryRange | null = null) {
  const open = dateOpen(date, now, range);
  return DELIVERY_RULES.windows.map((slot) => ({
    ...slot,
    available: open && (date !== now.date || slot.start - DELIVERY_RULES.leadMinutes >= now.minutes),
  }));
}

/** Windows that can still be booked on a date. */
export const slotsFor = (date: string, now: DubaiNow = dubaiNow(), range: DeliveryRange | null = null) => windowsFor(date, now, range).filter((slot) => slot.available);

/** The next few dates that still have at least one open window. */
export function bookableDays(count = 3, now: DubaiNow = dubaiNow(), range: DeliveryRange | null = null) {
  const days: string[] = [];
  for (let offset = 0; offset <= DELIVERY_RULES.maxDaysAhead && days.length < count; offset += 1) {
    const date = addDays(now.date, offset);
    if (slotsFor(date, now, range).length) days.push(date);
  }
  return days;
}

/** The first date with an open window. */
export const earliestDate = (now: DubaiNow = dubaiNow(), range: DeliveryRange | null = null) => bookableDays(1, now, range)[0] ?? range?.from ?? addDays(now.date, 1);

export type ScheduleProblem = 'missing_date' | 'missing_slot' | 'date_passed' | 'day_closed' | 'slot_passed' | 'range_conflict' | 'range_closed';

export function rangeProblem(range: DeliveryRange | null, now: DubaiNow = dubaiNow()): 'range_conflict' | 'range_closed' | null {
  if (range && range.from > range.to) return 'range_conflict';
  if (range && !bookableDays(1, now, range).length) return 'range_closed';
  return null;
}

export function checkSchedule(schedule: Partial<DeliverySchedule> | null, now: DubaiNow = dubaiNow(), range: DeliveryRange | null = null): ScheduleProblem | null {
  const rangeIssue = rangeProblem(range, now);
  if (rangeIssue) return rangeIssue;
  if (!schedule?.date) return 'missing_date';
  if (!schedule.slotId || !findSlot(schedule.slotId)) return 'missing_slot';
  if (schedule.date < now.date) return 'date_passed';
  if (!dateOpen(schedule.date, now, range)) return 'day_closed';
  if (!slotsFor(schedule.date, now, range).some((slot) => slot.id === schedule.slotId)) return 'slot_passed';
  return null;
}

function hourLabel(minutes: number, arabic: boolean) {
  return new Intl.DateTimeFormat(arabic ? 'ar-AE' : 'en-US', { hour: 'numeric', minute: minutes % 60 ? '2-digit' : undefined, timeZone: 'UTC' })
    .format(new Date(Date.UTC(2000, 0, 1, Math.floor(minutes / 60), minutes % 60)))
    .replace(/\s/g, arabic ? ' ' : '')
    .toLowerCase();
}

/** "9am – 12pm" (or Arabic). */
export function windowLabel(slotId: string, arabic: boolean) {
  const slot = findSlot(slotId);
  return slot ? `${hourLabel(slot.start, arabic)} – ${hourLabel(slot.end, arabic)}` : '';
}

/** "Tue 21 Oct" style label for a YYYY-MM-DD date. */
export function formatDeliveryDate(date: string, arabic: boolean) {
  return new Intl.DateTimeFormat(arabic ? 'ar-AE' : 'en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

/** "Tue 21 Oct · 9am – 12pm". */
export function deliverySummary(schedule: DeliverySchedule | null, arabic: boolean) {
  if (!schedule?.date || !schedule.slotId) return '';
  return `${formatDeliveryDate(schedule.date, arabic)} · ${windowLabel(schedule.slotId, arabic)}`;
}

/** Cart attributes for a schedule. The English label is what the shop team sees on the order. */
export function scheduleAttributes(schedule: DeliverySchedule) {
  return findSlot(schedule.slotId) ? [
    { key: DELIVERY_DATE_KEY, value: schedule.date },
    { key: DELIVERY_TIME_KEY, value: windowLabel(schedule.slotId, false) },
  ] : [];
}

/**
 * The order note: the same schedule in words, so it shows at the top of the
 * order in Shopify (and on packing slips) without opening "Additional details".
 */
export function deliveryNote(schedule: DeliverySchedule) {
  return findSlot(schedule.slotId)
    ? `Delivery: ${formatDeliveryDate(schedule.date, false)} (${schedule.date}) · ${windowLabel(schedule.slotId, false)} Dubai time`
    : '';
}

/** Reads a schedule back from cart attributes. */
export function scheduleFromAttributes(attributes: Record<string, string>): DeliverySchedule | null {
  const date = attributes[DELIVERY_DATE_KEY];
  const slot = DELIVERY_RULES.windows.find((item) => windowLabel(item.id, false) === attributes[DELIVERY_TIME_KEY]);
  return date && slot ? { date, slotId: slot.id } : null;
}
