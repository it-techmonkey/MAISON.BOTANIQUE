// Area: phone layout at 390px. No sideways scrolling on the main shopping pages and sheets.
import { test, expect, openProduct, addToBag, openBag, expectNoHorizontalScroll } from './fixtures';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test('home, shop and info pages fit a 390px phone', async ({ page }) => {
  for (const path of ['/', '/shop', '/delivery', '/faq']) {
    await page.goto(path);
    await expect(page.locator('#site-footer')).toBeAttached();
    await page.evaluate(() => document.fonts.ready);
    await expectNoHorizontalScroll(page, path);
  }
});

test('product page, quick-add sheet and bag fit a 390px phone', async ({ page }) => {
  await openProduct(page);
  await expectNoHorizontalScroll(page, 'product page');
  await addToBag(page);
  const bag = await openBag(page);
  const box = await bag.boundingBox();
  expect(box!.width).toBeLessThanOrEqual(390);
  await expectNoHorizontalScroll(page, 'bag open');

  await page.keyboard.press('Escape');
  await page.goto('/shop');
  await page.locator('.mbc-piece .mbc-add').first().click();
  const sheet = page.locator('.ll-shop-panel--quickadd');
  await expect(sheet).toBeVisible();
  expect((await sheet.boundingBox())!.width).toBeLessThanOrEqual(390);
  await expectNoHorizontalScroll(page, 'quick-add sheet');
});

test('Add buttons line up in each row of the shop grid', async ({ page }) => {
  await page.goto('/shop');
  const adds = page.locator('.mbc-piece .mbc-add');
  await expect(adds.first()).toBeVisible();
  const boxes = await adds.evaluateAll((nodes) => nodes.slice(0, 8).map((n) => n.getBoundingClientRect()).map((r) => ({ x: r.x, y: r.y })));
  // Two columns: buttons that share a row share a top edge (within 2px).
  for (let i = 0; i + 1 < boxes.length; i += 2) expect(Math.abs(boxes[i].y - boxes[i + 1].y)).toBeLessThanOrEqual(2);
});
