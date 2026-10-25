// Seasonal buying-flow regression: no delivery before a pre-order, after an
// occasion, or across Halloween and Diwali in one order.
import { test, expect, openProduct, addToBag, openBag } from './fixtures';

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
