// Delivery picker rules (src/lib/delivery.ts): Dubai time, three-hour lead,
// 60-day horizon, passed days and windows. Owner rules, 19 October 2026.
import test from 'node:test';
import assert from 'node:assert/strict';

const {
  DELIVERY_RULES, addDays, bookableDays, checkSchedule, dateOpen, dubaiNow, earliestDate, lastBookableDate,
  scheduleAttributes, scheduleFromAttributes, slotsFor, windowLabel, windowsFor,
} = await import('../src/lib/delivery.ts');

const at = (date, hh, mm = 0) => ({ date, minutes: hh * 60 + mm });
const open = (date, now) => slotsFor(date, now).map((slot) => slot.id);

test('four daily windows, 9am to 9pm, three-hour lead, 60 days ahead', () => {
  assert.deepEqual(DELIVERY_RULES.windows.map((w) => [w.id, w.start / 60, w.end / 60]), [
    ['morning', 9, 12], ['midday', 12, 15], ['afternoon', 15, 18], ['evening', 18, 21],
  ]);
  assert.equal(DELIVERY_RULES.leadMinutes, 180);
  assert.equal(DELIVERY_RULES.maxDaysAhead, 60);
  assert.equal(windowLabel('morning', false), '9am – 12pm');
  assert.equal(windowLabel('evening', false), '6pm – 9pm');
});

test('a same-day window closes exactly three hours before it starts', () => {
  assert.deepEqual(open('2026-10-21', at('2026-10-21', 5, 59)), ['morning', 'midday', 'afternoon', 'evening']);
  assert.deepEqual(open('2026-10-21', at('2026-10-21', 6, 0)), ['morning', 'midday', 'afternoon', 'evening']);
  assert.deepEqual(open('2026-10-21', at('2026-10-21', 6, 1)), ['midday', 'afternoon', 'evening']);
  assert.deepEqual(open('2026-10-21', at('2026-10-21', 12, 0)), ['afternoon', 'evening']);
  assert.deepEqual(open('2026-10-21', at('2026-10-21', 15, 0)), ['evening']);
  assert.deepEqual(open('2026-10-21', at('2026-10-21', 15, 1)), []);
  // Passed windows stay listed but disabled, so the picker layout does not jump.
  const windows = windowsFor('2026-10-21', at('2026-10-21', 10, 0));
  assert.equal(windows.length, 4);
  assert.deepEqual(windows.filter((w) => !w.available).map((w) => w.id), ['morning', 'midday']);
});

test('tomorrow is fully open even late tonight', () => {
  assert.deepEqual(open('2026-10-22', at('2026-10-21', 23, 59)), ['morning', 'midday', 'afternoon', 'evening']);
});

test('after the last same-day cut-off the earliest date moves to tomorrow', () => {
  assert.equal(earliestDate(at('2026-10-21', 14, 59)), '2026-10-21');
  assert.equal(earliestDate(at('2026-10-21', 15, 1)), '2026-10-22');
  assert.deepEqual(bookableDays(3, at('2026-10-21', 20, 0)), ['2026-10-22', '2026-10-23', '2026-10-24']);
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
  const now = at('2026-10-21', 13);
  assert.equal(checkSchedule(null, now), 'missing_date');
  assert.equal(checkSchedule({ date: '2026-10-22' }, now), 'missing_slot');
  assert.equal(checkSchedule({ date: '2026-10-22', slotId: 'brunch' }, now), 'missing_slot');
  assert.equal(checkSchedule({ date: '2026-10-20', slotId: 'evening' }, now), 'date_passed');
  assert.equal(checkSchedule({ date: '2026-12-21', slotId: 'evening' }, now), 'day_closed');
  assert.equal(checkSchedule({ date: '2026-10-21', slotId: 'afternoon' }, now), 'slot_passed');
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
