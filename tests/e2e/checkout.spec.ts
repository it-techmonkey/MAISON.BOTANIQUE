// Area: bag → Shopify checkout handoff. Reaches the Shopify checkout page and checks the line item.
// Never types contact, address, discount or payment details, and never applies the welcome offer.
import { test, expect, CHECKOUT_HOST, openProduct, useEarliestDelivery, addToBag, openBag, isLiveCheckout, notConnected } from './fixtures';

test('checkout hands the bag to Shopify with the product in the order summary @live', async ({ page }) => {
  await openProduct(page);
  const name = (await page.locator('.purchase h1').innerText()).trim();
  await useEarliestDelivery(page);
  await addToBag(page);
  const bag = await openBag(page);
  await expect(bag.locator('.ll-shop-primary')).toBeEnabled();

  if (!(await isLiveCheckout(page))) {
    // A preview without Shopify settings shows the checkout preview panel instead.
    notConnected('Shopify checkout');
    await bag.locator('.ll-shop-primary').click();
    await expect(bag.locator('h2')).toHaveText('Checkout preview');
    return;
  }

  await bag.locator('.ll-shop-primary').click();
  await page.waitForURL((url) => url.hostname === CHECKOUT_HOST && url.pathname.includes('/checkouts/'), { timeout: 45_000 });
  // Shopify's own page: the order summary lists the product and the chosen size.
  await expect(page.getByText(name, { exact: true }).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Signature/).first()).toBeVisible();
});
