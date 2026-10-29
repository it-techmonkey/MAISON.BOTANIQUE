// Delivery picker rules (src/lib/delivery.ts): Dubai time, one-hour lead,
// 60-day horizon, passed days and windows. Owner rules, 19 October 2026.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const {
  DELIVERY_RULES, addDays, bookableDays, checkSchedule, dateOpen, dubaiNow, earliestDate, lastBookableDate,
  scheduleAttributes, scheduleFromAttributes, slotsFor, usableSchedule, windowLabel, windowsFor,
} = await import('../src/lib/delivery.ts');

const at = (date, hh, mm = 0) => ({ date, minutes: hh * 60 + mm });
const open = (date, now) => slotsFor(date, now).map((slot) => slot.id);
const seasonal = JSON.parse(readFileSync(new URL('../src/data/seasonal-products.json', import.meta.url), 'utf8')).deliveryRanges;

test('four daily windows, 9am to 9pm, one-hour lead, 60 days ahead', () => {
  assert.deepEqual(DELIVERY_RULES.windows.map((w) => [w.id, w.start / 60, w.end / 60]), [
    ['morning', 9, 12], ['midday', 12, 15], ['afternoon', 15, 18], ['evening', 18, 21],
  ]);
  assert.equal(DELIVERY_RULES.leadMinutes, 60);
  assert.equal(DELIVERY_RULES.maxDaysAhead, 60);
  assert.equal(windowLabel('morning', false), '9am – 12pm');
  assert.equal(windowLabel('evening', false), '6pm – 9pm');
});

test('a same-day window closes exactly one hour before it ends', () => {
  const all = ['morning', 'midday', 'afternoon', 'evening'];
  assert.deepEqual(open('2026-10-21', at('2026-10-21', 7, 0)), all);
  // A running window stays bookable: 10:30 can still book the 9am–12pm window.
  assert.deepEqual(open('2026-10-21', at('2026-10-21', 11, 0)), all);
  assert.deepEqual(open('2026-10-21', at('2026-10-21', 11, 1)), ['midday', 'afternoon', 'evening']);
  assert.deepEqual(open('2026-10-21', at('2026-10-21', 14, 0)), ['midday', 'afternoon', 'evening']);
  assert.deepEqual(open('2026-10-21', at('2026-10-21', 14, 1)), ['afternoon', 'evening']);
  assert.deepEqual(open('2026-10-21', at('2026-10-21', 17, 1)), ['evening']);
  // 7pm and 8pm can still book 6–9pm; after 8pm only tomorrow is left.
  assert.deepEqual(open('2026-10-21', at('2026-10-21', 19, 0)), ['evening']);
  assert.deepEqual(open('2026-10-21', at('2026-10-21', 20, 0)), ['evening']);
  assert.deepEqual(open('2026-10-21', at('2026-10-21', 20, 1)), []);
  // Passed windows stay listed but disabled, so the picker layout does not jump.
  const windows = windowsFor('2026-10-21', at('2026-10-21', 12, 0));
  assert.equal(windows.length, 4);
  assert.deepEqual(windows.filter((w) => !w.available).map((w) => w.id), ['morning']);
});

test('tomorrow is fully open even late tonight', () => {
  assert.deepEqual(open('2026-10-22', at('2026-10-21', 23, 59)), ['morning', 'midday', 'afternoon', 'evening']);
});

test('after the last same-day cut-off the earliest date moves to tomorrow', () => {
  assert.equal(earliestDate(at('2026-10-21', 20, 0)), '2026-10-21');
  assert.equal(earliestDate(at('2026-10-21', 20, 1)), '2026-10-22');
  assert.deepEqual(bookableDays(3, at('2026-10-21', 21, 0)), ['2026-10-22', '2026-10-23', '2026-10-24']);
});

test('booking horizon: today plus 60 days, nothing after, nothing in the past', () => {
  const now = at('2026-10-21', 10);
  assert.equal(lastBookableDate(now), '2026-12-20');
  assert.equal(dateOpen('2026-12-20', now), true);
  assert.equal(dateOpen('2026-12-21', now), false);
  assert.equal(dateOpen('2026-10-20', now), false);
  assert.deepEqual(open('2026-12-21', now), []);
  // Month and year boundaries.
  assert.equal(lastBookableDate(at('2026-12-15', 10)), '2027-02-13');
  assert.equal(addDays('2028-02-28', 1), '2028-02-29');
});

test('checkSchedule names each problem the bag shows', () => {
  const now = at('2026-10-21', 14, 30);
  assert.equal(checkSchedule(null, now), 'missing_date');
  assert.equal(checkSchedule({ date: '2026-10-22' }, now), 'missing_slot');
  assert.equal(checkSchedule({ date: '2026-10-22', slotId: 'brunch' }, now), 'missing_slot');
  assert.equal(checkSchedule({ date: '2026-10-20', slotId: 'evening' }, now), 'date_passed');
  assert.equal(checkSchedule({ date: '2026-12-21', slotId: 'evening' }, now), 'day_closed');
  assert.equal(checkSchedule({ date: '2026-10-21', slotId: 'midday' }, now), 'slot_passed');
  assert.equal(checkSchedule({ date: '2026-10-21', slotId: 'evening' }, now), null);
  assert.equal(checkSchedule({ date: '2026-12-20', slotId: 'morning' }, now), null);
});

test('dubaiNow converts from UTC to Asia/Dubai (UTC+4, no daylight saving)', () => {
  assert.deepEqual(dubaiNow(new Date('2026-10-21T05:00:00Z')), { date: '2026-10-21', minutes: 9 * 60 });
  // 20:30 UTC is already 00:30 the next day in Dubai.
  assert.deepEqual(dubaiNow(new Date('2026-10-21T20:30:00Z')), { date: '2026-10-22', minutes: 30 });
  assert.deepEqual(dubaiNow(new Date('2026-12-31T21:15:00Z')), { date: '2027-01-01', minutes: 75 });
  // Same offset in (northern) summer.
  assert.deepEqual(dubaiNow(new Date('2026-07-01T11:00:00Z')), { date: '2026-07-01', minutes: 15 * 60 });
});

test('the schedule round-trips through Shopify cart attributes', () => {
  const schedule = { date: '2026-10-23', slotId: 'afternoon' };
  const attributes = scheduleAttributes(schedule);
  assert.deepEqual(attributes, [{ key: 'Delivery date', value: '2026-10-23' }, { key: 'Delivery time', value: '3pm – 6pm' }]);
  assert.deepEqual(scheduleFromAttributes(Object.fromEntries(attributes.map((a) => [a.key, a.value]))), schedule);
});

test('a schedule saved on an earlier visit is dropped once it can no longer be booked', () => {
  // Reported 22 Oct 2026, 18:30 Dubai: a 21 Oct choice came back as "That delivery day has passed".
  const now = at('2026-10-22', 20, 30);
  assert.equal(usableSchedule({ date: '2026-10-21', slotId: 'afternoon' }, now), null);
  assert.equal(usableSchedule({ date: '2026-10-22', slotId: 'evening' }, now), null);
  assert.equal(usableSchedule({ date: '2026-12-22', slotId: 'morning' }, now), null);
  assert.equal(usableSchedule(null, now), null);
  assert.deepEqual(usableSchedule({ date: '2026-10-23', slotId: 'morning' }, now), { date: '2026-10-23', slotId: 'morning' });
  assert.deepEqual(usableSchedule({ date: '2026-12-21', slotId: 'evening' }, now), { date: '2026-12-21', slotId: 'evening' });
  // Earlier the same day, today's evening window is still open.
  assert.deepEqual(usableSchedule({ date: '2026-10-22', slotId: 'evening' }, at('2026-10-22', 15, 0)), { date: '2026-10-22', slotId: 'evening' });
});

// The owner kept toran delivery open 5–15 November; Halloween ends 31 October.
test('a pre-order range limits delivery to its dates', () => {
  const range = seasonal['marigold-toran'];
  const now = at('2026-10-25', 10);
  assert.deepEqual(range, { from: '2026-11-05', to: '2026-11-15' });
  assert.equal(dateOpen('2026-10-26', now, range), false);
  assert.equal(dateOpen('2026-11-05', now, range), true);
  assert.equal(dateOpen('2026-11-08', now, range), true);
  assert.equal(dateOpen('2026-11-15', now, range), true);
  assert.equal(dateOpen('2026-11-16', now, range), false);
  assert.deepEqual(bookableDays(4, now, range), ['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08']);
  assert.equal(earliestDate(now, range), '2026-11-05');
  assert.equal(lastBookableDate(now, range), '2026-11-15');
  assert.equal(checkSchedule({ date: '2026-10-26', slotId: 'morning' }, now, range), 'day_closed');
  assert.equal(checkSchedule({ date: '2026-11-06', slotId: 'evening' }, now, range), null);
  assert.equal(checkSchedule({ date: '2026-11-15', slotId: 'evening' }, now, range), null);
  assert.equal(checkSchedule(null, at('2026-11-15', 20, 1), range), 'range_closed');
  assert.equal(checkSchedule(null, at('2026-11-16', 10), range), 'range_closed');
  // Without a pre-order the normal schedule is unchanged.
  assert.equal(checkSchedule({ date: '2026-10-26', slotId: 'morning' }, now), null);
});

test('Halloween ends on 31 October and cannot share a delivery date with the toran', () => {
  const halloween = seasonal['pumpkin-and-pralines'];
  assert.deepEqual(halloween, { from: '2026-10-25', to: '2026-10-31' });
  for (const handle of ['the-pumpkin-basket', 'jack-o-bloom', 'the-midnight-pumpkin']) {
    assert.deepEqual(seasonal[handle], halloween);
  }
  assert.equal(checkSchedule({ date: '2026-10-31', slotId: 'evening' }, at('2026-10-25', 10), halloween), null);
  assert.equal(checkSchedule({ date: '2026-11-01', slotId: 'morning' }, at('2026-10-25', 10), halloween), 'day_closed');
  assert.equal(checkSchedule(null, at('2026-10-31', 20, 1), halloween), 'range_closed');
  assert.equal(checkSchedule(null, at('2026-11-01', 10), halloween), 'range_closed');
  const mixed = { from: seasonal['marigold-toran'].from, to: halloween.to };
  assert.equal(checkSchedule(null, at('2026-10-25', 10), mixed), 'range_conflict');
});
