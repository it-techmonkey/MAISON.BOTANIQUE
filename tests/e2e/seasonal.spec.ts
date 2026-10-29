// Seasonal buying-flow regression: no delivery before a pre-order, after an
// occasion, or across Halloween and Diwali in one order.
import { test, expect, openProduct, useEarliestDelivery, addToBag, openBag } from './fixtures';

const atDubaiNoon = (date: string) => new Date(`${date}T08:00:00Z`);
async function openClosedSeasonal(page: import('@playwright/test').Page, handle: string) {
  const response = await page.goto(`/shop/${handle}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator('.purchase h1')).toBeVisible();
}

test('toran starts 5 November and keeps the owner-approved 15 November end date', async ({ page }) => {
  await page.clock.install({ time: atDubaiNoon('2026-10-25') });
  await openProduct(page, 'marigold-toran');
  const picker = page.locator('.dl-picker-product');
  await expect(picker).toContainText('Thu 5 Nov – Sun 15 Nov');
  await expect(picker).not.toContainText('Today');
  await addToBag(page);
  const bag = await openBag(page);
  await expect(bag.locator('.dl-picker')).toContainText('Thu 5 Nov – Sun 15 Nov');
  await bag.locator('.dl-picker .qa-day').first().click();
  await bag.locator('.dl-picker .dl-window input:enabled').first().check();
  await expect(bag.locator('.ll-shop-primary')).not.toHaveAttribute('aria-disabled', 'true');
  await expect(bag).toContainText('Arrives');
});

test('a toran and Halloween gift need separate orders', async ({ page }) => {
  await page.clock.install({ time: atDubaiNoon('2026-10-25') });
  await openProduct(page, 'marigold-toran');
  await addToBag(page);
  await openClosedSeasonal(page, 'pumpkin-and-pralines');
  await expect(page.locator('.dl-picker-product [role="alert"]')).toContainText('separate orders');
  await expect(page.locator('.qa-add')).toBeDisabled();
  await expect(page.locator('.qa-add')).toContainText('Place a separate order');
});

test('Halloween closes after 31 October while the Diwali pre-order remains visible', async ({ page }) => {
  await page.clock.install({ time: atDubaiNoon('2026-11-01') });
  await page.goto('/');
  await expect(page.locator('.sea-hw')).toHaveCount(0);
  await expect(page.locator('.sea-dw')).toBeVisible();
  await openClosedSeasonal(page, 'pumpkin-and-pralines');
  await expect(page.locator('.dl-picker-product [role="alert"]')).toContainText('has ended');
  await expect(page.locator('.qa-add')).toBeDisabled();
});

test('Diwali band and toran ordering close after 15 November', async ({ page }) => {
  await page.clock.install({ time: atDubaiNoon('2026-11-16') });
  await page.goto('/');
  await expect(page.locator('.sea-dw')).toHaveCount(0);
  await openClosedSeasonal(page, 'marigold-toran');
  await expect(page.locator('.dl-picker-product [role="alert"]')).toContainText('has ended');
  await expect(page.locator('.qa-add')).toBeDisabled();
});

test('ordering closes when the last delivery window can no longer be booked', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-31T16:01:00Z') });
  await openClosedSeasonal(page, 'pumpkin-and-pralines');
  await expect(page.locator('.dl-picker-product [role="alert"]')).toContainText('has ended');
  await expect(page.locator('.qa-add')).toBeDisabled();
});

test('a saved early date cannot be sent through the seasonal WhatsApp order link', async ({ page }) => {
  await page.clock.install({ time: atDubaiNoon('2026-10-25') });
  await openProduct(page);
  await useEarliestDelivery(page);
  await addToBag(page);
  await openProduct(page, 'marigold-toran');
  await addToBag(page);
  const bag = await openBag(page);
  await expect(bag.locator('.dl-picker .ll-cart-date-alert')).toContainText('choose another');
  await expect(bag.locator('.ll-cart-totals')).not.toContainText('Arrives');
  await expect(bag.getByRole('link', { name: 'Order on WhatsApp instead' })).toHaveCount(0);
  await bag.locator('.dl-picker .qa-day').first().click();
  await bag.locator('.dl-picker .dl-window input:enabled').first().check();
  await expect(bag).toContainText(/Arrives\s*Thu 5 Nov/);
  const whatsapp = bag.getByRole('link', { name: 'Order on WhatsApp instead' });
  // Local builds may omit WhatsApp; a connected site must restore the link with the valid date.
  if (await page.locator('a[href^="https://wa.me/"]').count()) {
    await expect(whatsapp).toBeVisible();
    await expect(whatsapp).toHaveAttribute('href', /Delivery%3A%20Thu%205%20Nov/);
  }
});
