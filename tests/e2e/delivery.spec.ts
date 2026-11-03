// Area: delivery day and time picker (product page and bag). Dubai time, one-hour lead, 60 days ahead.
// The browser runs in UTC on CI, so these also prove the picker uses Asia/Dubai, not the device clock.
import { test, expect, openProduct, addToBag, openBag, useEarliestDelivery } from './fixtures';

function dubaiNow() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).map((p) => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}
const addDays = (date: string, days: number) => {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};
const ENDS = [12 * 60, 15 * 60, 18 * 60, 21 * 60];

test('quick days start today in Dubai, or tomorrow after the last same-day cut-off', async ({ page }) => {
  await openProduct(page);
  const now = dubaiNow();
  // Skip the minute either side of the last same-day cut-off (8pm Dubai).
  test.skip(Math.abs(now.minutes - 20 * 60) <= 1, 'at the same-day cut-off');
  const days = page.locator('.dl-picker-product .qa-day');
  await expect(days).toHaveCount(4);
  await expect(days.first()).toContainText(now.minutes <= 20 * 60 ? 'Today' : 'Tomorrow');
  await expect(days.last()).toContainText('Another day');
});

test('same-day windows close one hour before they end', async ({ page }) => {
  await openProduct(page);
  const now = dubaiNow();
  test.skip(now.minutes > 20 * 60, 'no same-day windows left today');
  test.skip(ENDS.some((end) => Math.abs(end - 60 - now.minutes) <= 1), 'at a window cut-off');
  await page.locator('.dl-picker-product .qa-day').first().click();
  const windows = page.locator('.dl-picker-product .dl-window input');
  await expect(windows).toHaveCount(4);
  for (const [i, end] of ENDS.entries()) {
    if (end - 60 >= now.minutes) await expect(windows.nth(i)).toBeEnabled();
    else await expect(windows.nth(i)).toBeDisabled();
  }
});

test('another day accepts up to 60 days ahead and refuses day 61', async ({ page }) => {
  await openProduct(page);
  const today = dubaiNow().date;
  await page.locator('.dl-picker-product .qa-day', { hasText: 'Another day' }).click();
  const input = page.locator('.dl-picker-product input[type="date"]');
  await expect(input).toHaveAttribute('min', today);
  await expect(input).toHaveAttribute('max', addDays(today, 60));
  await input.fill(addDays(today, 60));
  await expect(page.locator('.dl-picker-product .dl-window input:enabled')).toHaveCount(4);
  await input.fill(addDays(today, 61));
  await expect(page.locator('.dl-picker-product [role="alert"]')).toHaveText("We aren't delivering on that day. Please choose another.");
  await expect(page.locator('.dl-picker-product .dl-window')).toHaveCount(0);
});

test('the bag will not go to checkout until a day and time are chosen', async ({ page }) => {
  await openProduct(page);
  await addToBag(page);
  const bag = await openBag(page);
  await expect(bag.locator('.ll-cart-date-alert[role="status"]')).toHaveText('Choose a delivery day and time to continue.');
  await expect(bag.locator('.ll-shop-primary')).toHaveAttribute('aria-disabled', 'true');
  // The blocked button stays clickable on purpose: it points the shopper to the picker.
  await bag.locator('.ll-shop-primary').dispatchEvent('click');
  await expect(bag.locator('.dl-picker [role="alert"]')).toHaveText('Choose a delivery day and time to continue.');
  await expect(page).toHaveURL(/\/shop\//);
  // Pick the first open window in the bag's own picker.
  await bag.locator('.dl-picker .qa-day').first().click();
  await bag.locator('.dl-picker .dl-window input:enabled').first().check();
  await expect(bag.locator('.ll-cart-date-alert[role="status"]')).toHaveCount(0);
  await expect(bag.locator('.ll-cart-totals')).toContainText('Arrives');
});

test('the delivery chosen on the product page carries into the bag', async ({ page }) => {
  await openProduct(page);
  await useEarliestDelivery(page);
  await addToBag(page);
  const bag = await openBag(page);
  await expect(bag.locator('.ll-cart-totals')).toContainText(/Arrives.*(am|pm)/s);
  await expect(bag.locator('.ll-shop-primary')).not.toHaveAttribute('aria-disabled', 'true');
});

test('a delivery day saved on an earlier visit is not restored once it has passed', async ({ page }) => {
  // Reported 22 Oct 2026: a day chosen yesterday showed "That delivery day has passed" on first load.
  const yesterday = addDays(dubaiNow().date, -1);
  await page.addInitScript((date) => {
    try { localStorage.setItem('maison-botanique-delivery', JSON.stringify({ date, slotId: 'afternoon' })); } catch { /* storage blocked */ }
  }, yesterday);
  await openProduct(page);
  const picker = page.locator('.dl-picker-product');
  await expect(picker.locator('.qa-day').first()).toBeVisible();
  await expect(picker.locator('[role="alert"]')).toHaveCount(0);
  await expect(picker.locator('.qa-day.is-selected')).toHaveCount(0);
  await expect(picker.locator('input[type="date"]')).toHaveCount(0);
  await expect(page.locator('.qa-delivery .pd-link')).toBeVisible();
  // The passed day is not stamped on the bag either.
  await addToBag(page);
  const bag = await openBag(page);
  await expect(bag.locator('.ll-cart-date-alert[role="status"]')).toHaveText('Choose a delivery day and time to continue.');
  expect(await page.evaluate(() => localStorage.getItem('maison-botanique-delivery'))).toBeNull();
});
