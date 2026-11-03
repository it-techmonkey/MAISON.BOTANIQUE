// Area: free delivery to JVC (bag tick-box). The tick-box is built behind NEXT_PUBLIC_JVC_FREE_DELIVERY,
// so the same file proves it is hidden while the switch is off and works when it is on. In the
// preview catalogue there is no Shopify cart, so only the tick-box and the fee line are checked here;
// the discount code itself is proven by the test checkout in docs/SHOPIFY_SETUP.md section 18.
import { test, expect, openProduct, useEarliestDelivery, addToBag, openBag } from './fixtures';

const switchedOn = process.env.NEXT_PUBLIC_JVC_FREE_DELIVERY === '1';

test('the JVC tick-box is hidden until the switch is on, then changes the fee line', async ({ page }) => {
  await openProduct(page);
  await useEarliestDelivery(page);
  await addToBag(page);
  const bag = await openBag(page);
  const box = bag.locator('.ll-cart-jvc input');
  if (!switchedOn) { await expect(box).toHaveCount(0); return; }
  await expect(bag.locator('.ll-cart-fee-note')).toContainText('30 in Dubai');
  await box.check();
  await expect(bag.locator('.ll-cart-fee-note')).toContainText('free to JVC');
  await box.uncheck();
  await expect(bag.locator('.ll-cart-fee-note')).toContainText('30 in Dubai');
});
