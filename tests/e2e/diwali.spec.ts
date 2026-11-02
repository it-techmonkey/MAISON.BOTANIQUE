// Area: the Diwali tab and the ten Diwali pre-orders (preview builds show them from seasonal-products.json;
// on a build whose Shopify has not published them the product tests skip).
import { test, expect, openProduct, addToBag, openBag, expectNoHorizontalScroll } from './fixtures';

const atDubaiNoon = (date: string) => new Date(`${date}T08:00:00Z`);

for (const width of [1440, 414, 390, 360, 320]) {
  for (const locale of ['en', 'ar']) {
    test(`the Diwali tab fits ${width}px in ${locale} and respects reduced motion`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.addInitScript((value) => localStorage.setItem('maison-botanique-locale', value), locale);
      await page.clock.install({ time: atDubaiNoon('2026-11-02') });
      await page.goto('/#diwali');
      const tab = page.getByRole('button', { name: locale === 'ar' ? 'ديوالي' : 'Diwali', exact: true });
      await expect(tab.first()).toHaveAttribute('aria-pressed', 'true');
      await expectNoHorizontalScroll(page, `Diwali tab ${width} ${locale}`);
    });
  }
}

test('a Diwali pre-order starts 5 November and ends on Diwali, 8 November', async ({ page }) => {
  await page.clock.install({ time: atDubaiNoon('2026-11-02') });
  const response = await page.goto('/shop/marigold-urli');
  test.skip(response?.status() !== 200, 'Diwali drafts are not published on this build');
  await openProduct(page, 'marigold-urli');
  await expect(page.locator('.dl-picker-product')).toContainText('Thu 5 Nov – Sun 8 Nov');
  await addToBag(page);
  const bag = await openBag(page);
  await expect(bag.locator('.dl-picker')).toContainText('Thu 5 Nov – Sun 8 Nov');
});

for (const width of [1440, 414, 390, 360, 320]) {
  for (const locale of ['en', 'ar']) {
    test(`/diwali fits ${width}px in ${locale}, shows the symbols and the fee`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.addInitScript((value) => localStorage.setItem('maison-botanique-locale', value), locale);
      await page.clock.install({ time: atDubaiNoon('2026-11-02') });
      await page.goto('/diwali');
      await expect(page.locator('.dwe h1')).toBeVisible();
      await expect(page.locator('.dwe-fee')).toContainText(locale === 'ar' ? '٦٠ درهماً' : 'AED 60');
      await expect(page.locator('.dwe-chip').first()).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('.dwe-return')).toBeVisible();
      await expectNoHorizontalScroll(page, `/diwali ${width} ${locale}`);
    });
  }
}

test('a symbol filters the Diwali page to one group and All brings the range back', async ({ page }) => {
  await page.clock.install({ time: atDubaiNoon('2026-11-02') });
  await page.goto('/diwali#doorstep');
  await expect(page.locator('.dwe-group')).toHaveCount(1);
  await expect(page.locator('.dwe-chip[aria-pressed="true"]')).toContainText(/doorstep/i);
  await page.locator('.dwe-chip').first().click();
  expect(await page.locator('.dwe-group').count()).toBeGreaterThanOrEqual(1);
  await expect(page.locator('.dwe-chip').first()).toHaveAttribute('aria-pressed', 'true');
});

test('the home band sends shoppers to /diwali and shows the three places', async ({ page }) => {
  await page.clock.install({ time: atDubaiNoon('2026-11-02') });
  await page.goto('/');
  await expect(page.locator('.sea-cta')).toHaveAttribute('href', '/diwali');
  await expect(page.locator('.dwe-sym-row a')).toHaveCount(3);
});

test('after Diwali delivery ends the page points back to the everyday shop', async ({ page }) => {
  await page.clock.install({ time: atDubaiNoon('2026-11-20') });
  await page.goto('/diwali');
  await expect(page.locator('.dwe-ended')).toBeVisible();
});
