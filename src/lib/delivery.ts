// Delivery scheduling: one date and time slot per order, in Dubai time.
// The schedule is saved on the Shopify cart as attributes, so it appears on
// the order under "Additional details" and reaches the order webhook.

import type { Bilingual } from './site';

export const DELIVERY_DATE_KEY = 'Delivery date';
export const DELIVERY_TIME_KEY = 'Delivery time';

/** A slot is offered today only if it starts at least this long from now. */
export const SAME_DAY_LEAD_MINUTES = 120;
/** How far ahead a delivery can be booked. */
export const MAX_DAYS_AHEAD = 90;

export interface DeliverySlot {
  id: string;
  /** Start and end in minutes after midnight, Dubai time. 1440 is midnight. */
  start: number;
  end: number;
  label: Bilingual;
}

export const DELIVERY_SLOTS: DeliverySlot[] = [
  { id: '09-12', start: 9 * 60, end: 12 * 60, label: { en: '9:00 AM – 12:00 PM', ar: '9:00 ص – 12:00 م' } },
  { id: '12-15', start: 12 * 60, end: 15 * 60, label: { en: '12:00 PM – 3:00 PM', ar: '12:00 م – 3:00 م' } },
  { id: '15-18', start: 15 * 60, end: 18 * 60, label: { en: '3:00 PM – 6:00 PM', ar: '3:00 م – 6:00 م' } },
  { id: '18-21', start: 18 * 60, end: 21 * 60, label: { en: '6:00 PM – 9:00 PM', ar: '6:00 م – 9:00 م' } },
  { id: '21-24', start: 21 * 60, end: 24 * 60, label: { en: '9:00 PM – 12:00 AM', ar: '9:00 م – 12:00 ص' } },
];

export interface DeliverySchedule {
  /** YYYY-MM-DD */
  date: string;
  slotId: string;
}

export const findSlot = (id: string | null | undefined) => DELIVERY_SLOTS.find((slot) => slot.id === id) ?? null;

/** The current date (YYYY-MM-DD) and minutes after midnight in Dubai. */
export function dubaiNow(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now).map((part) => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

export function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

/** Slots that can still be booked on a date. */
export function slotsFor(date: string, now = dubaiNow()) {
  if (!date || date < now.date || date > addDays(now.date, MAX_DAYS_AHEAD)) return [];
  if (date > now.date) return DELIVERY_SLOTS;
  return DELIVERY_SLOTS.filter((slot) => slot.start >= now.minutes + SAME_DAY_LEAD_MINUTES);
}

/** Today when a slot is still open, otherwise tomorrow. */
export function earliestDate(now = dubaiNow()) {
  return slotsFor(now.date, now).length ? now.date : addDays(now.date, 1);
}

export type ScheduleProblem = 'missing_date' | 'missing_slot' | 'date_passed' | 'slot_passed';

export function checkSchedule(schedule: Partial<DeliverySchedule> | null, now = dubaiNow()): ScheduleProblem | null {
  if (!schedule?.date) return 'missing_date';
  if (!schedule.slotId || !findSlot(schedule.slotId)) return 'missing_slot';
  if (schedule.date < now.date) return 'date_passed';
  if (!slotsFor(schedule.date, now).some((slot) => slot.id === schedule.slotId)) return 'slot_passed';
  return null;
}

/** Cart attributes for a schedule. The English label is what the shop team sees on the order. */
export function scheduleAttributes(schedule: DeliverySchedule) {
  const slot = findSlot(schedule.slotId);
  return slot ? [
    { key: DELIVERY_DATE_KEY, value: schedule.date },
    { key: DELIVERY_TIME_KEY, value: slot.label.en },
  ] : [];
}

/** Reads a schedule back from cart attributes. */
export function scheduleFromAttributes(attributes: Record<string, string>): DeliverySchedule | null {
  const date = attributes[DELIVERY_DATE_KEY];
  const slot = DELIVERY_SLOTS.find((item) => item.label.en === attributes[DELIVERY_TIME_KEY]);
  return date && slot ? { date, slotId: slot.id } : null;
}

/** "Tue 21 Oct" style label for a YYYY-MM-DD date. */
export function formatDeliveryDate(date: string, arabic: boolean) {
  return new Intl.DateTimeFormat(arabic ? 'ar-AE' : 'en-AE', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}
