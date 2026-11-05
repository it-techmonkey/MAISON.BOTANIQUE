// Area: delivery fees. Flat AED 35 in Dubai, AED 65 elsewhere in the UAE, no free area (owner, 4 Nov 2026).
import { test, expect, openProduct, addToBag, openBag } from './fixtures';

test('the bag states the flat Dubai and UAE fees and offers no JVC option', async ({ page }) => {
  await openProduct(page);
  await addToBag(page);
  const bag = await openBag(page);
  await expect(bag.locator('.ll-cart-fee-note')).toContainText(/35.*Dubai.*65/);
  await expect(bag.locator('.ll-cart-jvc')).toHaveCount(0);
  await expect(bag).not.toContainText(/JVC|Jumeirah Village/i);
});

test('the delivery page states the flat fees and no free delivery', async ({ page }) => {
  await page.goto('/delivery');
  const main = page.locator('main');
  await expect(main).toContainText('AED 35 in Dubai and AED 65 elsewhere');
  await expect(main).not.toContainText(/JVC|Jumeirah Village|free/i);
});
